import * as vscode from 'vscode';
import { isSecurityCopilotPlugin, getYamlPath, detectFormatAtLine } from './utils';
import {
    DESCRIPTOR_FIELDS, SKILLGROUP_FIELDS, GPT_SKILL_FIELDS,
    KQL_SKILL_FIELDS, API_SKILLGROUP_SETTINGS, INPUT_FIELDS, SETTING_FIELDS,
    LOGICAPP_SKILL_FIELDS, MCP_SKILLGROUP_SETTINGS, AGENT_SKILL_FIELDS,
    AGENT_DEFINITION_FIELDS, TRIGGER_FIELDS, SUGGESTED_PROMPT_FIELDS
} from './schema';

export function registerCompletions(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration('securityCopilot');

    // YAML completions for Security Copilot manifests
    const yamlProvider = vscode.languages.registerCompletionItemProvider(
        { language: 'yaml', scheme: 'file' },
        {
            provideCompletionItems(document, position) {
                if (!config.get('enableCompletions', true)) { return []; }
                const text = document.getText();
                if (!isSecurityCopilotPlugin(text)) { return []; }

                const lineText = document.lineAt(position).text;
                const yamlPath = getYamlPath(text, position.line);
                const completions: vscode.CompletionItem[] = [];

                // Determine context and offer relevant completions
                const pathStr = yamlPath.join('.');

                if (pathStr === '' || pathStr === 'Descriptor' || lineText.trim() === '') {
                    // Top-level or Descriptor fields
                    if (yamlPath.length === 0 || yamlPath[0] === 'Descriptor') {
                        addFieldCompletions(completions, DESCRIPTOR_FIELDS, getIndent(lineText));
                    }
                }

                if (pathStr.includes('SkillGroups') && !pathStr.includes('Skills')) {
                    addFieldCompletions(completions, SKILLGROUP_FIELDS, getIndent(lineText));
                }

                if (pathStr.includes('Skills')) {
                    const format = detectFormatAtLine(text, position.line);
                    if (format === 'GPT') {
                        addFieldCompletions(completions, GPT_SKILL_FIELDS, getIndent(lineText));
                    } else if (format === 'KQL') {
                        addFieldCompletions(completions, KQL_SKILL_FIELDS, getIndent(lineText));
                    } else if (format === 'LogicApp') {
                        addFieldCompletions(completions, LOGICAPP_SKILL_FIELDS, getIndent(lineText));
                    } else if (format === 'Agent') {
                        addFieldCompletions(completions, AGENT_SKILL_FIELDS, getIndent(lineText));
                    }
                }

                if (pathStr.includes('AgentDefinitions')) {
                    addFieldCompletions(completions, AGENT_DEFINITION_FIELDS, getIndent(lineText));
                    if (pathStr.includes('Triggers')) {
                        addFieldCompletions(completions, TRIGGER_FIELDS, getIndent(lineText));
                    }
                    if (pathStr.includes('SuggestedPrompts')) {
                        addFieldCompletions(completions, SUGGESTED_PROMPT_FIELDS, getIndent(lineText));
                    }
                }

                if (pathStr.includes('Inputs')) {
                    addFieldCompletions(completions, INPUT_FIELDS, getIndent(lineText));
                }

                if (pathStr.includes('Settings') && yamlPath.includes('Descriptor')) {
                    addFieldCompletions(completions, SETTING_FIELDS, getIndent(lineText));
                }

                if (pathStr.includes('Settings') && yamlPath.includes('SkillGroups')) {
                    const format = detectFormatAtLine(text, position.line);
                    if (format === 'API') {
                        addFieldCompletions(completions, API_SKILLGROUP_SETTINGS, getIndent(lineText));
                    } else if (format === 'MCP') {
                        addFieldCompletions(completions, MCP_SKILLGROUP_SETTINGS, getIndent(lineText));
                    }
                }

                // Value completions
                const keyMatch = lineText.match(/^\s*(\w+)\s*:\s*$/);
                if (keyMatch) {
                    const key = keyMatch[1];
                    addValueCompletions(completions, key, text);
                }

                return completions;
            }
        },
        '' // trigger on any character
    );

    context.subscriptions.push(yamlProvider);
}

function addFieldCompletions(
    completions: vscode.CompletionItem[],
    fields: Record<string, { description: string; required: boolean; type: string; example?: string }>,
    indent: string
) {
    for (const [name, field] of Object.entries(fields)) {
        const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Property);
        item.detail = field.required ? '(required)' : '(optional)';
        item.documentation = new vscode.MarkdownString(field.description);

        if (field.type === 'string') {
            item.insertText = new vscode.SnippetString(`${name}: \${1:${field.example || ''}}`);
        } else if (field.type === 'array') {
            item.insertText = new vscode.SnippetString(`${name}:\n${indent}  - \${1}`);
        } else if (field.type === 'object') {
            item.insertText = new vscode.SnippetString(`${name}:\n${indent}  \${1}`);
        } else {
            item.insertText = new vscode.SnippetString(`${name}: \${1}`);
        }

        // Required fields sort first
        item.sortText = field.required ? `0_${name}` : `1_${name}`;
        completions.push(item);
    }
}

function addValueCompletions(completions: vscode.CompletionItem[], key: string, text: string) {
    const valueMap: Record<string, string[]> = {
        Format: ['API', 'GPT', 'KQL', 'LogicApp', 'MCP', 'Agent'],
        Target: ['Defender', 'Sentinel', 'LogAnalytics', 'Kusto'],
        ModelName: ['gpt-4o', 'gpt-4.1', 'gpt-4-32k-v0613', 'gpt-4', 'gpt-4o-mini'],
        SettingType: ['String', 'string'],
        Location: ['Header', 'QueryString'],
        Type: ['APIKey', 'Basic', 'AAD', 'AADDelegated', 'OAuthAuthorizationCodeFlow', 'OAuthClientCredentialsFlow'],
        Required: ['true', 'false'],
        Interfaces: ['Agent', 'InteractiveAgent'],
        AgentSingleInstanceConstraint: ['None', 'Workspace', 'Tenant'],
        Model: ['gpt-4o', 'gpt-4.1', 'gpt-4-32k-v0613', 'gpt-4', 'gpt-4o-mini'],
    };

    const values = valueMap[key];
    if (values) {
        for (const val of values) {
            const item = new vscode.CompletionItem(val, vscode.CompletionItemKind.Value);
            item.insertText = ` ${val}`;
            completions.push(item);
        }
    }
}

function getIndent(line: string): string {
    const match = line.match(/^(\s*)/);
    return match ? match[1] : '';
}
