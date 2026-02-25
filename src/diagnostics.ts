import * as vscode from 'vscode';
import { isSecurityCopilotPlugin, detectPluginFormat, findLineNumber } from './utils';
import { BEST_PRACTICES } from './schema';

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

    if (!/^\s*SkillGroups\s*:/m.test(text)) {
        diagnostics.push(createDiagnostic(
            lines.length - 1, 0, lines.length - 1, 10,
            'Missing required top-level key: SkillGroups',
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
        if (!['API', 'GPT', 'KQL'].includes(format)) {
            const line = findLineNumber(text, new RegExp(`Format\\s*:\\s*${format}`));
            diagnostics.push(createDiagnostic(
                line, 0, line, lines[line]?.length || 20,
                `Invalid Format value "${format}". Must be one of: API, GPT, KQL`,
                vscode.DiagnosticSeverity.Error,
                'SEC005'
            ));
        }
    }

    // Check SupportedAuthTypes values
    const authTypePattern = /SupportedAuthTypes\s*:\s*\n(\s*-\s*.+\n)+/g;
    const authMatch = authTypePattern.exec(text);
    if (authMatch) {
        const validAuthTypes = ['ApiKey', 'Basic', 'AAD', 'None'];
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

    // Check GPT ModelName values
    const pluginFormat = detectPluginFormat(text);
    if (pluginFormat === 'GPT') {
        const modelMatches = text.matchAll(/ModelName\s*:\s*(\S+)/gm);
        const validModels = ['gpt-4o', 'gpt-4-32k-v0613', 'gpt-4', 'gpt-4o-mini'];
        for (const match of modelMatches) {
            const model = match[1].replace(/['"]/g, '');
            if (!validModels.includes(model)) {
                const line = findLineNumber(text, new RegExp(`ModelName\\s*:\\s*${match[1].replace(/[-.]/g, '\\$&')}`));
                diagnostics.push(createDiagnostic(
                    line, 0, line, lines[line]?.length || 20,
                    `Unknown ModelName "${model}". Common values: ${validModels.join(', ')}`,
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
