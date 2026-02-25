/**
 * Utility functions for detecting and parsing Security Copilot plugin manifests.
 */

/** Check if a YAML document is a Security Copilot plugin manifest */
export function isSecurityCopilotPlugin(text: string): boolean {
    return /^\s*Descriptor\s*:/m.test(text) && /^\s*SkillGroups\s*:/m.test(text);
}

/** Detect plugin format type from content */
export function detectPluginFormat(text: string): 'API' | 'GPT' | 'KQL' | 'unknown' {
    if (/Format\s*:\s*API/i.test(text)) { return 'API'; }
    if (/Format\s*:\s*GPT/i.test(text)) { return 'GPT'; }
    if (/Format\s*:\s*KQL/i.test(text)) { return 'KQL'; }
    return 'unknown';
}

/** Check if a markdown document is a Security Copilot promptbook */
export function isPromptbook(text: string): boolean {
    return /\*\*Required\s+(plugins?|input)\*\*/i.test(text) && /```[\s\S]*?```/.test(text);
}

/** Extract the indentation level at a given line */
export function getIndentLevel(line: string): number {
    const match = line.match(/^(\s*)/);
    return match ? match[1].length : 0;
}

/** Get the current YAML path at cursor position (simplified) */
export function getYamlPath(text: string, lineNumber: number): string[] {
    const lines = text.split('\n');
    const path: { key: string; indent: number }[] = [];

    for (let i = 0; i <= lineNumber && i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/^(\s*)(\w[\w\s]*?):\s*/);
        if (match) {
            const indent = match[1].length;
            const key = match[2].trim();

            // Pop items with equal or greater indent
            while (path.length > 0 && path[path.length - 1].indent >= indent) {
                path.pop();
            }
            path.push({ key, indent });
        }
    }

    return path.map(p => p.key);
}

/** Find line number for a given YAML key pattern */
export function findLineNumber(text: string, pattern: RegExp): number {
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (pattern.test(lines[i])) {
            return i;
        }
    }
    return 0;
}

/** Find the range (start, end columns) of a key on a line */
export function findKeyRange(line: string, key: string): { start: number; end: number } {
    const idx = line.indexOf(key);
    if (idx >= 0) {
        return { start: idx, end: idx + key.length };
    }
    return { start: 0, end: line.length };
}
