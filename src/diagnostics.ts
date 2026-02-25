import * as vscode from 'vscode';
import { isSecurityCopilotPlugin, detectPluginFormat, detectAllPluginFormats, findLineNumber } from './utils';
import { BEST_PRACTICES } from './schema';

/** Misspelled KQL operators and their corrections */
const KQL_MISSPELLINGS: [RegExp, string][] = [
    [/\bsumarize\b/i, 'summarize'],
    [/\bsummerize\b/i, 'summarize'],
    [/\bsummurize\b/i, 'summarize'],
    [/\bporject\b/i, 'project'],
    [/\bproejct\b/i, 'project'],
    [/\brendor\b/i, 'render'],
    [/\bmakeset\b(?!\s*\()/i, 'make_set'],
    [/\bmakelist\b(?!\s*\()/i, 'make_list'],
    [/\|\s*select\b/i, 'project (not SQL SELECT)'],
];

const DIAGNOSTIC_SOURCE = 'Security Copilot';

export function registerDiagnostics(context: vscode.ExtensionContext) {
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('securityCopilot');
    context.subscriptions.push(diagnosticCollection);

    // Validate on open and change
    const validateDocument = (document: vscode.TextDocument) => {
        if (document.languageId !== 'yaml') { return; }

        const config = vscode.workspace.getConfiguration('securityCopilot');
        if (!config.get('enableDiagnostics', true)) {
            diagnosticCollection.delete(document.uri);
            return;
        }

        const text = document.getText();
        if (!isSecurityCopilotPlugin(text)) {
            diagnosticCollection.delete(document.uri);
            return;
        }

        const diagnostics: vscode.Diagnostic[] = [];

        // === Structural Validation ===
        validateStructure(text, document, diagnostics);

        // === Best Practice Checks ===
        validateBestPractices(text, document, diagnostics);

        // === Template Variable Validation ===
        validateTemplateVariables(text, document, diagnostics);

        // === KQL Template Validation (line-specific) ===
        validateKqlTemplates(text, document, diagnostics);

        diagnosticCollection.set(document.uri, diagnostics);
    };

    // Fire on open, save, and typing
    vscode.workspace.onDidOpenTextDocument(validateDocument, null, context.subscriptions);
    vscode.workspace.onDidChangeTextDocument(e => validateDocument(e.document), null, context.subscriptions);
    vscode.workspace.onDidSaveTextDocument(validateDocument, null, context.subscriptions);

    // Validate all open documents
    vscode.workspace.textDocuments.forEach(validateDocument);
}

function validateStructure(text: string, document: vscode.TextDocument, diagnostics: vscode.Diagnostic[]) {
    const lines = text.split('\n');

    // Check for required top-level keys
    if (!/^\s*Descriptor\s*:/m.test(text)) {
        diagnostics.push(createDiagnostic(
            0, 0, 0, 10,
            'Missing required top-level key: Descriptor',
            vscode.DiagnosticSeverity.Error,
            'SEC001'
        ));
    }

    if (!/^\s*SkillGroups\s*:/m.test(text) && !/^\s*AgentDefinitions\s*:/m.test(text)) {
        diagnostics.push(createDiagnostic(
            lines.length - 1, 0, lines.length - 1, 10,
            'Missing required top-level key: SkillGroups (or AgentDefinitions for agents)',
            vscode.DiagnosticSeverity.Error,
            'SEC002'
        ));
    }

    // Check Descriptor has Name
    if (/^\s*Descriptor\s*:/m.test(text)) {
        const descriptorBlock = extractBlock(text, 'Descriptor');
        if (!/Name\s*:/m.test(descriptorBlock)) {
            const line = findLineNumber(text, /^\s*Descriptor\s*:/m);
            diagnostics.push(createDiagnostic(
                line, 0, line, 20,
                'Descriptor is missing required field: Name',
                vscode.DiagnosticSeverity.Error,
                'SEC003'
            ));
        }
        if (!/Description\s*:/m.test(descriptorBlock)) {
            const line = findLineNumber(text, /^\s*Descriptor\s*:/m);
            diagnostics.push(createDiagnostic(
                line, 0, line, 20,
                'Descriptor is missing required field: Description',
                vscode.DiagnosticSeverity.Error,
                'SEC004'
            ));
        }
    }

    // Check SkillGroups have Format
    const formatMatches = text.matchAll(/^(\s*)Format\s*:\s*(\S+)/gm);
    for (const match of formatMatches) {
        const format = match[2];
        if (!['API', 'GPT', 'KQL', 'LogicApp', 'MCP', 'Agent'].includes(format)) {
            const line = findLineNumber(text, new RegExp(`Format\\s*:\\s*${format}`));
            diagnostics.push(createDiagnostic(
                line, 0, line, lines[line]?.length || 20,
                `Invalid Format value "${format}". Must be one of: API, GPT, KQL, LogicApp, MCP, Agent`,
                vscode.DiagnosticSeverity.Error,
                'SEC005'
            ));
        }
    }

    // Check SupportedAuthTypes values
    const authTypePattern = /SupportedAuthTypes\s*:\s*\n(\s*-\s*.+\n)+/g;
    const authMatch = authTypePattern.exec(text);
    if (authMatch) {
        const validAuthTypes = ['ApiKey', 'Basic', 'AAD', 'AADDelegated', 'OAuthAuthorizationCodeFlow', 'OAuthClientCredentialsFlow', 'ServiceHttp', 'None'];
        const authLines = authMatch[0].matchAll(/-\s*(\S+)/g);
        for (const authLine of authLines) {
            if (!validAuthTypes.includes(authLine[1])) {
                const line = findLineNumber(text, new RegExp(`-\\s*${authLine[1]}`));
                diagnostics.push(createDiagnostic(
                    line, 0, line, lines[line]?.length || 20,
                    `Invalid SupportedAuthTypes value "${authLine[1]}". Must be one of: ${validAuthTypes.join(', ')}`,
                    vscode.DiagnosticSeverity.Warning,
                    'SEC006'
                ));
            }
        }
    }

    // Check KQL Target values
    const targetMatches = text.matchAll(/Target\s*:\s*(\S+)/gm);
    const validTargets = ['Defender', 'Sentinel', 'LogAnalytics', 'Kusto'];
    for (const match of targetMatches) {
        const target = match[1].replace(/['"]/g, '');
        if (!validTargets.includes(target)) {
            const line = findLineNumber(text, new RegExp(`Target\\s*:\\s*${match[1]}`));
            diagnostics.push(createDiagnostic(
                line, 0, line, lines[line]?.length || 20,
                `Invalid Target value "${target}". Must be one of: ${validTargets.join(', ')}`,
                vscode.DiagnosticSeverity.Error,
                'SEC007'
            ));
        }
    }

    // Check GPT / Agent ModelName values
    const allFormats = detectAllPluginFormats(text);
    if (allFormats.includes('GPT') || allFormats.includes('Agent')) {
        const modelMatches = text.matchAll(/(?:ModelName|Model)\s*:\s*(\S+)/gm);
        const validModels = ['gpt-4o', 'gpt-4.1', 'gpt-4-32k-v0613', 'gpt-4', 'gpt-4o-mini'];
        for (const match of modelMatches) {
            const model = match[1].replace(/['"]/g, '');
            if (!validModels.includes(model)) {
                const line = findLineNumber(text, new RegExp(`(?:ModelName|Model)\\s*:\\s*${match[1].replace(/[\-\.]/g, '\\$&')}`));
                diagnostics.push(createDiagnostic(
                    line, 0, line, lines[line]?.length || 20,
                    `Unknown model "${model}". Common values: ${validModels.join(', ')}`,
                    vscode.DiagnosticSeverity.Warning,
                    'SEC008'
                ));
            }
        }
    }
}

function validateBestPractices(text: string, document: vscode.TextDocument, diagnostics: vscode.Diagnostic[]) {
    const severityMap: Record<string, vscode.DiagnosticSeverity> = {
        error: vscode.DiagnosticSeverity.Error,
        warning: vscode.DiagnosticSeverity.Warning,
        information: vscode.DiagnosticSeverity.Information,
        hint: vscode.DiagnosticSeverity.Hint,
    };

    for (const rule of BEST_PRACTICES) {
        if (rule.check(text)) {
            diagnostics.push(createDiagnostic(
                0, 0, 0, 1,
                `[${rule.id}] ${rule.message}`,
                severityMap[rule.severity] ?? vscode.DiagnosticSeverity.Information,
                rule.id
            ));
        }
    }
}

function validateTemplateVariables(text: string, document: vscode.TextDocument, diagnostics: vscode.Diagnostic[]) {
    // Find all {{variable}} references in Templates
    const templateVarPattern = /\{\{(\w+)\}\}/g;
    const inputNamePattern = /Inputs\s*:\s*\n([\s\S]*?)(?=\n\s{2,}\w+:|^\w|$)/gm;
    const settingNamePattern = /Settings\s*:\s*\n\s*-\s*Name\s*:\s*(.+)/gm;

    // Collect declared input/setting names
    const declaredNames = new Set<string>();

    let inputMatch;
    while ((inputMatch = inputNamePattern.exec(text)) !== null) {
        const block = inputMatch[1];
        const names = block.matchAll(/Name\s*:\s*(\S+)/g);
        for (const n of names) {
            declaredNames.add(n[1].replace(/['"]/g, ''));
        }
    }

    let settingMatch;
    while ((settingMatch = settingNamePattern.exec(text)) !== null) {
        declaredNames.add(settingMatch[1].trim().replace(/['"]/g, ''));
    }

    // Check Template blocks for undefined variables
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let varMatch;
        while ((varMatch = templateVarPattern.exec(lines[i])) !== null) {
            const varName = varMatch[1];
            if (!declaredNames.has(varName)) {
                diagnostics.push(createDiagnostic(
                    i, varMatch.index, i, varMatch.index + varMatch[0].length,
                    `Template variable "{{${varName}}}" is not declared in any Inputs or Settings.`,
                    vscode.DiagnosticSeverity.Warning,
                    'SEC009'
                ));
            }
        }
    }
}

function validateKqlTemplates(text: string, document: vscode.TextDocument, diagnostics: vscode.Diagnostic[]) {
    const allFormats = detectAllPluginFormats(text);
    if (!allFormats.includes('KQL')) { return; }

    const lines = text.split('\n');

    // Find all KQL template regions: lines belonging to a Template: |- block
    const templateRegions = findKqlTemplateRegions(lines, text);

    // Detect Target for time-column checks
    const targetMatch = text.match(/Target\s*:\s*(\w+)/);
    const target = targetMatch ? targetMatch[1] : '';

    for (const region of templateRegions) {
        const { startLine, endLine } = region;

        // BP029: Trailing pipe at end of KQL query
        for (let i = endLine; i >= startLine; i--) {
            if (lines[i].trim() !== '') {
                if (/\|\s*$/.test(lines[i].trim())) {
                    diagnostics.push(createDiagnostic(
                        i, 0, i, lines[i].length,
                        '[BP029] KQL query ends with a trailing pipe (|). This causes a runtime parse error.',
                        vscode.DiagnosticSeverity.Error,
                        'BP029'
                    ));
                }
                break;
            }
        }

        for (let i = startLine; i <= endLine; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            if (trimmed === '') { continue; }

            // BP030: let statement missing semicolon
            if (/^\s*let\s+\w+\s*=/i.test(line) && !/;\s*$/.test(trimmed) && !/;\s*\/\//.test(trimmed)) {
                diagnostics.push(createDiagnostic(
                    i, 0, i, line.length,
                    '[BP030] KQL `let` statement does not end with a semicolon (;). All let statements must be terminated.',
                    vscode.DiagnosticSeverity.Error,
                    'BP030'
                ));
            }

            // BP031: Invalid time unit in ago()
            const agoMatch = line.match(/\bago\s*\(\s*\d+\s*(days?|hours?|hrs?|minutes?|mins?|seconds?|secs?|weeks?|months?|years?)\s*\)/i);
            if (agoMatch) {
                diagnostics.push(createDiagnostic(
                    i, 0, i, line.length,
                    `[BP031] Invalid time unit "${agoMatch[1]}" in ago(). Use short forms: d (days), h (hours), m (minutes), s (seconds), ms (milliseconds).`,
                    vscode.DiagnosticSeverity.Error,
                    'BP031'
                ));
            }

            // BP032: SQL syntax in KQL template
            if (/^\s*(SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s/i.test(trimmed)) {
                diagnostics.push(createDiagnostic(
                    i, 0, i, line.length,
                    '[BP032] SQL syntax detected in KQL template. KQL uses different syntax (e.g., use table | project instead of SELECT FROM).',
                    vscode.DiagnosticSeverity.Error,
                    'BP032'
                ));
            }

            // BP033: Management/destructive commands
            if (/^\s*\.(set|append|drop|create|alter|delete|rename|ingest|move|replace|execute|cancel)\b/i.test(trimmed)) {
                diagnostics.push(createDiagnostic(
                    i, 0, i, line.length,
                    '[BP033] KQL management command detected. Security Copilot KQL queries are read-only; management commands are prohibited.',
                    vscode.DiagnosticSeverity.Error,
                    'BP033'
                ));
            }

            // BP034: Wrong time column for target
            if (target.toLowerCase() === 'defender' && /\bTimeGenerated\b/.test(line)) {
                diagnostics.push(createDiagnostic(
                    i, 0, i, line.length,
                    '[BP034] Defender uses `Timestamp` not `TimeGenerated`. Use the correct time column for the Defender target.',
                    vscode.DiagnosticSeverity.Warning,
                    'BP034'
                ));
            }
            if (/sentinel|loganalytics/i.test(target) && /\bTimestamp\b/.test(line) && !/\bTimeGenerated\b/.test(line)) {
                diagnostics.push(createDiagnostic(
                    i, 0, i, line.length,
                    '[BP034] Sentinel/LogAnalytics uses `TimeGenerated` not `Timestamp`. Use the correct time column for the target.',
                    vscode.DiagnosticSeverity.Warning,
                    'BP034'
                ));
            }

            // BP035: Single = instead of == in where clause
            if (/\bwhere\b/i.test(line)) {
                // Match "where <column> = <value>" but not ==, !=, >=, <=, =~
                const whereClause = line.replace(/.*\bwhere\b\s*/i, '');
                if (/\w+\s*(?<![!<>=])=(?![=~])\s*["'\w{]/.test(whereClause)) {
                    diagnostics.push(createDiagnostic(
                        i, 0, i, line.length,
                        '[BP035] Single `=` in where clause. KQL uses `==` for equality and `=~` for case-insensitive. Single `=` is invalid.',
                        vscode.DiagnosticSeverity.Error,
                        'BP035'
                    ));
                }
            }

            // BP036: Misspelled KQL operators
            for (const [pattern, correction] of KQL_MISSPELLINGS) {
                if (pattern.test(trimmed)) {
                    const misspelled = trimmed.match(pattern)?.[0] || '';
                    diagnostics.push(createDiagnostic(
                        i, 0, i, line.length,
                        `[BP036] Possible misspelled KQL operator "${misspelled}". Did you mean "${correction}"?`,
                        vscode.DiagnosticSeverity.Error,
                        'BP036'
                    ));
                }
            }

            // BP037: summarize with bare column but no by clause
            if (/\bsummarize\b/i.test(trimmed) && !/\bby\b/i.test(trimmed)) {
                // Check if there are non-function tokens after summarize (bare column names)
                const afterSummarize = trimmed.replace(/.*\bsummarize\b\s*/i, '');
                // Look for comma-separated items where at least one is a bare identifier (no parentheses)
                const parts = afterSummarize.split(',').map(p => p.trim());
                const hasBareColumn = parts.some(p => /^[A-Za-z_]\w*$/.test(p) && !/\(/.test(p));
                const hasAggFunction = parts.some(p => /\w+\s*\(/.test(p));
                if (hasBareColumn && hasAggFunction) {
                    diagnostics.push(createDiagnostic(
                        i, 0, i, line.length,
                        '[BP037] `summarize` mixes aggregation functions with bare column names but has no `by` clause. Use `summarize <agg> by <column>`.',
                        vscode.DiagnosticSeverity.Error,
                        'BP037'
                    ));
                }
            }

            // BP038: join with invalid kind
            const joinMatch = line.match(/\bjoin\s+kind\s*=\s*(\w+)/i);
            if (joinMatch) {
                const validKinds = ['inner', 'leftouter', 'rightouter', 'fullouter', 'leftanti', 'rightanti', 'leftsemi', 'rightsemi'];
                if (!validKinds.includes(joinMatch[1].toLowerCase())) {
                    diagnostics.push(createDiagnostic(
                        i, 0, i, line.length,
                        `[BP038] Invalid join kind "${joinMatch[1]}". Valid kinds: ${validKinds.join(', ')}.`,
                        vscode.DiagnosticSeverity.Error,
                        'BP038'
                    ));
                }
            }
        }
    }
}

/** Find KQL template regions (start/end line indices) in the document */
function findKqlTemplateRegions(lines: string[], text: string): { startLine: number; endLine: number }[] {
    const regions: { startLine: number; endLine: number }[] = [];

    // Only look at KQL skill groups
    let inKqlSkillGroup = false;

    for (let i = 0; i < lines.length; i++) {
        // Detect entering/leaving KQL skill group
        if (/^\s*-?\s*Format\s*:\s*KQL/i.test(lines[i])) {
            inKqlSkillGroup = true;
        } else if (/^\s*-?\s*Format\s*:\s*\w+/i.test(lines[i])) {
            inKqlSkillGroup = false;
        }

        if (!inKqlSkillGroup) { continue; }

        // Find Template: |- or Template: | or Template: >- lines
        const templateMatch = lines[i].match(/^(\s*)Template\s*:\s*(\|[-+]?|>[-+]?)\s*$/);
        if (templateMatch) {
            const baseIndent = templateMatch[1].length;
            const startLine = i + 1;
            let endLine = startLine;

            // Template block continues while lines are indented beyond the Template key
            while (endLine < lines.length) {
                const line = lines[endLine];
                if (line.trim() === '') { endLine++; continue; }
                const indent = line.match(/^(\s*)/)?.[1].length ?? 0;
                if (indent <= baseIndent) { break; }
                endLine++;
            }
            endLine = Math.max(startLine, endLine - 1);
            if (startLine <= endLine) {
                regions.push({ startLine, endLine });
            }
        }

        // Also handle inline Template: <query> (single line)
        const inlineMatch = lines[i].match(/^(\s*)Template\s*:\s*(\S.+)$/);
        if (inlineMatch && !/^\|[-+]?\s*$/.test(inlineMatch[2].trim()) && !/^>[-+]?\s*$/.test(inlineMatch[2].trim())) {
            regions.push({ startLine: i, endLine: i });
        }
    }

    return regions;
}

function createDiagnostic(
    startLine: number, startCol: number,
    endLine: number, endCol: number,
    message: string,
    severity: vscode.DiagnosticSeverity,
    code: string
): vscode.Diagnostic {
    const range = new vscode.Range(startLine, startCol, endLine, endCol);
    const diagnostic = new vscode.Diagnostic(range, message, severity);
    diagnostic.source = DIAGNOSTIC_SOURCE;
    diagnostic.code = code;
    return diagnostic;
}

function extractBlock(text: string, key: string): string {
    const regex = new RegExp(`^(\\s*)${key}\\s*:`, 'm');
    const match = regex.exec(text);
    if (!match) { return ''; }

    const startLine = text.substring(0, match.index).split('\n').length - 1;
    const baseIndent = match[1].length;
    const lines = text.split('\n');
    let endLine = startLine + 1;

    while (endLine < lines.length) {
        const line = lines[endLine];
        if (line.trim() === '') { endLine++; continue; }
        const indent = line.match(/^(\s*)/)?.[1].length ?? 0;
        if (indent <= baseIndent && line.trim() !== '') { break; }
        endLine++;
    }

    return lines.slice(startLine, endLine).join('\n');
}
