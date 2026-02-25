import * as vscode from 'vscode';
import { registerDiagnostics } from './diagnostics';
import { registerCompletions } from './completions';
import { registerHoverProvider } from './hover';
import { registerCommands } from './commands';
import { isSecurityCopilotPlugin } from './utils';

export function activate(context: vscode.ExtensionContext) {
    console.log('Security Copilot Plugin Helper is now active');

    // Register diagnostics (real-time validation)
    registerDiagnostics(context);

    // Register completions (IntelliSense)
    registerCompletions(context);

    // Register hover information
    registerHoverProvider(context);

    // Register commands (new plugin, validate, etc.)
    registerCommands(context);

    // Show status bar item when editing Security Copilot files
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.text = '$(shield) Security Copilot';
    statusBarItem.tooltip = 'Security Copilot Plugin Helper active';
    statusBarItem.command = 'securityCopilot.validatePlugin';
    context.subscriptions.push(statusBarItem);

    // Show/hide status bar based on active editor
    const updateStatusBar = () => {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document.languageId === 'yaml' && isSecurityCopilotPlugin(editor.document.getText())) {
            statusBarItem.show();
        } else {
            statusBarItem.hide();
        }
    };

    vscode.window.onDidChangeActiveTextEditor(updateStatusBar, null, context.subscriptions);
    updateStatusBar();
}

export function deactivate() {}
