import * as vscode from 'vscode';
import { isSecurityCopilotPlugin, getYamlPath, detectPluginFormat } from './utils';
import {
    DESCRIPTOR_FIELDS, SKILLGROUP_FIELDS, GPT_SKILL_FIELDS,
    KQL_SKILL_FIELDS, API_SKILLGROUP_SETTINGS, INPUT_FIELDS, SETTING_FIELDS, FieldDef
} from './schema';

export function registerHoverProvider(context: vscode.ExtensionContext) {
    const hoverProvider = vscode.languages.registerHoverProvider(
        { language: 'yaml', scheme: 'file' },
        {
            provideHover(document, position) {
                const text = document.getText();
                if (!isSecurityCopilotPlugin(text)) { return null; }

                const line = document.lineAt(position).text;
                const wordRange = document.getWordRangeAtPosition(position, /[\w]+/);
                if (!wordRange) { return null; }

                const word = document.getText(wordRange);
                const yamlPath = getYamlPath(text, position.line);
                const format = detectPluginFormat(text);

                // Try to find field definition
                const fieldDef = resolveFieldDef(word, yamlPath, format);
                if (!fieldDef) { return null; }

                const md = new vscode.MarkdownString();
                md.appendMarkdown(`### ${word}\n\n`);
                md.appendMarkdown(fieldDef.description + '\n\n');

                if (fieldDef.required) {
                    md.appendMarkdown('**Required**: Yes\n\n');
                }

                if (fieldDef.validValues) {
                    md.appendMarkdown(`**Valid values**: \`${fieldDef.validValues.join('`, `')}\`\n\n`);
                }

                if (fieldDef.example) {
                    md.appendMarkdown(`**Example**: \`${fieldDef.example}\`\n\n`);
                }

                if (fieldDef.children) {
                    md.appendMarkdown('**Child fields**:\n');
                    for (const [name, child] of Object.entries(fieldDef.children)) {
                        md.appendMarkdown(`- \`${name}\`${child.required ? ' *(required)*' : ''}: ${child.description}\n`);
                    }
                }

                return new vscode.Hover(md, wordRange);
            }
        }
    );

    context.subscriptions.push(hoverProvider);
}

function resolveFieldDef(
    word: string,
    yamlPath: string[],
    format: string
): FieldDef | null {
    // Check Descriptor fields
    if (yamlPath.includes('Descriptor') || yamlPath.length <= 1) {
        if (DESCRIPTOR_FIELDS[word]) { return DESCRIPTOR_FIELDS[word]; }
        // Check Authorization child fields
        if (yamlPath.includes('Authorization') && DESCRIPTOR_FIELDS.Authorization?.children?.[word]) {
            return DESCRIPTOR_FIELDS.Authorization.children[word];
        }
    }

    // Check SkillGroup fields
    if (yamlPath.includes('SkillGroups')) {
        if (SKILLGROUP_FIELDS[word]) { return SKILLGROUP_FIELDS[word]; }
    }

    // Check Skill fields based on format type
    if (yamlPath.includes('Skills')) {
        if (format === 'GPT' && GPT_SKILL_FIELDS[word]) {
            return GPT_SKILL_FIELDS[word];
        }
        if (format === 'KQL' && KQL_SKILL_FIELDS[word]) {
            return KQL_SKILL_FIELDS[word];
        }

        // Check nested Settings children
        if (yamlPath.includes('Settings')) {
            if (format === 'GPT' && GPT_SKILL_FIELDS.Settings?.children?.[word]) {
                return GPT_SKILL_FIELDS.Settings.children[word];
            }
            if (format === 'KQL' && KQL_SKILL_FIELDS.Settings?.children?.[word]) {
                return KQL_SKILL_FIELDS.Settings.children[word];
            }
        }
    }

    // Check API SkillGroup settings
    if (yamlPath.includes('Settings') && format === 'API') {
        if (API_SKILLGROUP_SETTINGS[word]) { return API_SKILLGROUP_SETTINGS[word]; }
    }

    // Check Input fields
    if (yamlPath.includes('Inputs')) {
        if (INPUT_FIELDS[word]) { return INPUT_FIELDS[word]; }
    }

    // Check Setting fields (Descriptor level)
    if (yamlPath.includes('Settings') && yamlPath.includes('Descriptor')) {
        if (SETTING_FIELDS[word]) { return SETTING_FIELDS[word]; }
    }

    // Global fallback (check all registries)
    const allRegistries = [DESCRIPTOR_FIELDS, SKILLGROUP_FIELDS, GPT_SKILL_FIELDS, KQL_SKILL_FIELDS, INPUT_FIELDS, SETTING_FIELDS, API_SKILLGROUP_SETTINGS];
    for (const registry of allRegistries) {
        if (registry[word]) { return registry[word]; }
    }

    return null;
}
