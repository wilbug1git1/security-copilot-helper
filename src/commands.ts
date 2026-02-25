import * as vscode from 'vscode';
import * as path from 'path';

// ─── Scaffold wizard options ─────────────────────────────────────────────────

interface ScaffoldOptions {
    format: 'API' | 'GPT' | 'KQL' | 'LogicApp' | 'MCP' | 'Agent';
    name: string;
    displayName: string;
    description: string;
    authType: 'ApiKey' | 'Basic' | 'AAD' | 'AADDelegated' | 'OAuthAuthorizationCodeFlow' | 'OAuthClientCredentialsFlow' | 'None';
    // KQL-specific
    kqlTarget?: 'Defender' | 'Sentinel' | 'LogAnalytics' | 'Kusto';
    // API-specific
    openApiSpecUrl?: string;
    // GPT-specific
    modelName?: string;
    // LogicApp-specific
    subscriptionId?: string;
    resourceGroup?: string;
    workflowName?: string;
    triggerName?: string;
    // MCP-specific
    mcpEndpoint?: string;
    // Agent-specific
    agentType?: 'Standard' | 'Interactive';
    agentModel?: string;
}

interface PromptbookOptions {
    title: string;
    description: string;
    plugins: string;
    inputVariable: string;
    stepCount: number;
}

// ─── Command registration ────────────────────────────────────────────────────

export function registerCommands(context: vscode.ExtensionContext) {
    // Validate current plugin manifest
    context.subscriptions.push(
        vscode.commands.registerCommand('securityCopilot.validatePlugin', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.document.languageId !== 'yaml') {
                vscode.window.showWarningMessage('Open a YAML file to validate as a Security Copilot plugin manifest.');
                return;
            }
            const diagnostics = vscode.languages.getDiagnostics(editor.document.uri);
            const secDiags = diagnostics.filter(d => d.source === 'Security Copilot');
            if (secDiags.length === 0) {
                vscode.window.showInformationMessage('✅ Security Copilot plugin manifest looks good!');
            } else {
                const errors = secDiags.filter(d => d.severity === vscode.DiagnosticSeverity.Error).length;
                const warnings = secDiags.filter(d => d.severity === vscode.DiagnosticSeverity.Warning).length;
                const info = secDiags.filter(d => d.severity === vscode.DiagnosticSeverity.Information || d.severity === vscode.DiagnosticSeverity.Hint).length;
                vscode.window.showWarningMessage(
                    `Security Copilot: ${errors} error(s), ${warnings} warning(s), ${info} suggestion(s). Check the Problems panel.`
                );
            }
        })
    );

    // === Scaffold wizard (full guided flow) ===
    context.subscriptions.push(
        vscode.commands.registerCommand('securityCopilot.scaffoldPlugin', async () => {
            await scaffoldPluginWizard();
        })
    );

    // Quick-create commands (skip format selection)
    context.subscriptions.push(
        vscode.commands.registerCommand('securityCopilot.newApiPlugin', async () => {
            await scaffoldPluginWizard('API');
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('securityCopilot.newGptPlugin', async () => {
            await scaffoldPluginWizard('GPT');
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('securityCopilot.newKqlPlugin', async () => {
            await scaffoldPluginWizard('KQL');
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('securityCopilot.newLogicAppPlugin', async () => {
            await scaffoldPluginWizard('LogicApp');
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('securityCopilot.newMcpPlugin', async () => {
            await scaffoldPluginWizard('MCP');
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('securityCopilot.newAgent', async () => {
            await scaffoldPluginWizard('Agent');
        })
    );

    // Promptbook scaffold
    context.subscriptions.push(
        vscode.commands.registerCommand('securityCopilot.newPromptbook', async () => {
            await scaffoldPromptbookWizard();
        })
    );
}

// ─── Plugin scaffold wizard ──────────────────────────────────────────────────

async function scaffoldPluginWizard(preselectedFormat?: ScaffoldOptions['format']) {
    // Step 1: Choose format (unless pre-selected)
    let format = preselectedFormat;
    if (!format) {
        const pick = await vscode.window.showQuickPick(
            [
                { label: 'API',      description: 'Wrap an external REST API via OpenAPI spec',         detail: 'Best for: existing APIs, third-party integrations' },
                { label: 'GPT',      description: 'Use the LLM to process prompts via templates',       detail: 'Best for: text analysis, summarization, data transformation' },
                { label: 'KQL',      description: 'Run KQL queries against Defender/Sentinel/Kusto',    detail: 'Best for: log queries, threat hunting, data retrieval' },
                { label: 'LogicApp', description: 'Trigger an Azure Logic App workflow',                 detail: 'Best for: automation, email, Teams, external actions' },
                { label: 'MCP',      description: 'Connect to an MCP server (Model Context Protocol)',   detail: 'Best for: remote tool servers, existing MCP endpoints' },
                { label: 'Agent',    description: 'Autonomous or interactive agent with orchestration',  detail: 'Best for: multi-step investigations, automated workflows' },
            ],
            { title: 'Security Copilot — New Plugin (Step 1/5)', placeHolder: 'Choose the plugin format' }
        );
        if (!pick) { return; }
        format = pick.label as ScaffoldOptions['format'];
    }

    // Step 2: Plugin name
    const name = await vscode.window.showInputBox({
        title: `Security Copilot — New ${format} Plugin (Step 2/5)`,
        prompt: 'Internal plugin name (PascalCase, no spaces)',
        placeHolder: 'MyCustomPlugin',
        validateInput: v => {
            if (!v) { return 'Name is required'; }
            if (/\s/.test(v)) { return 'No spaces allowed — use PascalCase'; }
            if (!/^[A-Za-z]\w*$/.test(v)) { return 'Must start with a letter, alphanumeric only'; }
            return null;
        }
    });
    if (!name) { return; }

    // Step 3: Display name + description
    const displayName = await vscode.window.showInputBox({
        title: `Security Copilot — New ${format} Plugin (Step 3/5)`,
        prompt: 'Display name shown in the Security Copilot UI',
        value: name.replace(/([A-Z])/g, ' $1').trim(),
    }) ?? name;

    const description = await vscode.window.showInputBox({
        title: `Security Copilot — New ${format} Plugin (Step 3/5)`,
        prompt: 'Description (used by users AND the AI orchestrator for skill selection)',
        placeHolder: 'Retrieves threat intelligence data from ...',
    }) ?? `A Security Copilot ${format} plugin.`;

    // Step 4: Auth type
    const authPick = await vscode.window.showQuickPick(
        [
            { label: 'ApiKey',  description: 'API key in header or query string' },
            { label: 'AAD',     description: 'Microsoft Entra ID — application only' },
            { label: 'AADDelegated', description: 'Microsoft Entra ID — user + application (delegated)' },
            { label: 'OAuthAuthorizationCodeFlow', description: 'OAuth 2.0 Authorization Code (interactive user)' },
            { label: 'OAuthClientCredentialsFlow', description: 'OAuth 2.0 Client Credentials (server-to-server)' },
            { label: 'Basic',   description: 'Basic username/password auth' },
            { label: 'None',    description: 'No authentication (or settings-only plugin)' },
        ],
        { title: `Security Copilot — New ${format} Plugin (Step 4/5)`, placeHolder: 'Choose authentication method' }
    );
    const authType = (authPick?.label ?? 'None') as ScaffoldOptions['authType'];

    // Step 5: Format-specific options
    let kqlTarget: ScaffoldOptions['kqlTarget'];
    let openApiSpecUrl: string | undefined;
    let modelName: string | undefined;

    if (format === 'KQL') {
        const targetPick = await vscode.window.showQuickPick(
            [
                { label: 'Defender',     description: 'Microsoft Defender XDR — no workspace config needed' },
                { label: 'Sentinel',     description: 'Microsoft Sentinel — requires workspace settings' },
                { label: 'LogAnalytics', description: 'Log Analytics workspace' },
                { label: 'Kusto',        description: 'Azure Data Explorer (ADX) cluster' },
            ],
            { title: `Security Copilot — New KQL Plugin (Step 5/5)`, placeHolder: 'Choose KQL target' }
        );
        kqlTarget = (targetPick?.label ?? 'Defender') as ScaffoldOptions['kqlTarget'];
    }

    if (format === 'API') {
        openApiSpecUrl = await vscode.window.showInputBox({
            title: `Security Copilot — New API Plugin (Step 5/5)`,
            prompt: 'OpenAPI spec URL (you can change this later)',
            placeHolder: 'https://example.com/openapi.yaml',
            value: 'https://example.com/openapi.yaml',
        });
    }

    if (format === 'GPT') {
        const modelPick = await vscode.window.showQuickPick(
            [
                { label: 'gpt-4o',            description: 'Recommended — fast and capable' },
                { label: 'gpt-4.1',           description: 'Latest GPT-4.1 model (used by agents)' },
                { label: 'gpt-4',             description: 'GPT-4 base model' },
                { label: 'gpt-4o-mini',       description: 'Smaller / cheaper variant' },
                { label: 'gpt-4-32k-v0613',   description: 'Extended context window' },
            ],
            { title: `Security Copilot — New GPT Plugin (Step 5/5)`, placeHolder: 'Choose GPT model' }
        );
        modelName = modelPick?.label ?? 'gpt-4o';
    }

    // LogicApp-specific options
    let subscriptionId: string | undefined;
    let resourceGroup: string | undefined;
    let workflowName: string | undefined;
    let triggerName: string | undefined;

    if (format === 'LogicApp') {
        subscriptionId = await vscode.window.showInputBox({
            title: `Security Copilot — New LogicApp Plugin (Step 5/5)`,
            prompt: 'Azure Subscription ID',
            placeHolder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        }) ?? '<YOUR-SUBSCRIPTION-ID>';
        resourceGroup = await vscode.window.showInputBox({
            title: `Security Copilot — New LogicApp Plugin (Step 5/5)`,
            prompt: 'Resource Group name',
            placeHolder: 'my-resource-group',
        }) ?? '<YOUR-RESOURCE-GROUP>';
        workflowName = await vscode.window.showInputBox({
            title: `Security Copilot — New LogicApp Plugin (Step 5/5)`,
            prompt: 'Logic App Workflow name',
            placeHolder: 'MyLogicApp',
        }) ?? 'MyLogicApp';
        triggerName = await vscode.window.showInputBox({
            title: `Security Copilot — New LogicApp Plugin (Step 5/5)`,
            prompt: 'Trigger name (usually "manual" for HTTP trigger)',
            placeHolder: 'manual',
            value: 'manual',
        }) ?? 'manual';
    }

    // MCP-specific options
    let mcpEndpoint: string | undefined;

    if (format === 'MCP') {
        mcpEndpoint = await vscode.window.showInputBox({
            title: `Security Copilot — New MCP Plugin (Step 5/5)`,
            prompt: 'MCP server endpoint URL',
            placeHolder: 'https://example.com/api/mcp',
            value: 'https://example.com/api/mcp',
        }) ?? 'https://example.com/api/mcp';
    }

    // Agent-specific options
    let agentType: 'Standard' | 'Interactive' | undefined;
    let agentModel: string | undefined;

    if (format === 'Agent') {
        const agentTypePick = await vscode.window.showQuickPick(
            [
                { label: 'Standard',    description: 'Autonomous agent — runs on trigger, produces reports', detail: 'Executes autonomously and produces structured output' },
                { label: 'Interactive',  description: 'Chat agent — responds to user questions in Copilot', detail: 'Users interact via chat, with suggested prompts' },
            ],
            { title: `Security Copilot — New Agent (Step 5a/5)`, placeHolder: 'Choose agent type' }
        );
        agentType = (agentTypePick?.label ?? 'Standard') as 'Standard' | 'Interactive';

        const agentModelPick = await vscode.window.showQuickPick(
            [
                { label: 'gpt-4o',   description: 'Recommended — fast and capable' },
                { label: 'gpt-4.1',  description: 'Latest GPT-4.1 model' },
            ],
            { title: `Security Copilot — New Agent (Step 5b/5)`, placeHolder: 'Choose agent model' }
        );
        agentModel = agentModelPick?.label ?? 'gpt-4o';
    }

    const options: ScaffoldOptions = {
        format, name, displayName, description, authType,
        kqlTarget, openApiSpecUrl, modelName,
        subscriptionId, resourceGroup, workflowName, triggerName,
        mcpEndpoint, agentType, agentModel,
    };

    // === Create files on disk ===
    await writeScaffold(options);
}

// ─── Promptbook scaffold wizard ──────────────────────────────────────────────

async function scaffoldPromptbookWizard() {
    const title = await vscode.window.showInputBox({
        title: 'Security Copilot — New Promptbook (Step 1/4)',
        prompt: 'Promptbook title',
        placeHolder: 'Incident Investigation',
    });
    if (!title) { return; }

    const description = await vscode.window.showInputBox({
        title: 'Security Copilot — New Promptbook (Step 2/4)',
        prompt: 'What does this promptbook do?',
        placeHolder: 'Automates investigation of security incidents...',
    }) ?? 'Investigation workflow.';

    const plugins = await vscode.window.showInputBox({
        title: 'Security Copilot — New Promptbook (Step 3/4)',
        prompt: 'Required plugins (comma-separated)',
        placeHolder: 'Microsoft Defender XDR, Microsoft Sentinel',
        value: 'Microsoft Defender XDR',
    }) ?? 'Microsoft Defender XDR';

    const inputVariable = await vscode.window.showInputBox({
        title: 'Security Copilot — New Promptbook (Step 4/4)',
        prompt: 'Input variable name (the user provides this value)',
        placeHolder: 'incidentId',
    }) ?? 'input_variable';

    const options: PromptbookOptions = { title, description, plugins, inputVariable, stepCount: 4 };

    await writePromptbookScaffold(options);
}

// ─── File writing helpers ────────────────────────────────────────────────────

async function getTargetFolder(suggestedName: string): Promise<vscode.Uri | undefined> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('Open a workspace folder first.');
        return undefined;
    }
    const rootUri = workspaceFolders[0].uri;
    return vscode.Uri.joinPath(rootUri, suggestedName);
}

async function writeScaffold(opts: ScaffoldOptions) {
    const folderUri = await getTargetFolder(opts.name);
    if (!folderUri) { return; }

    // Create plugin folder
    await vscode.workspace.fs.createDirectory(folderUri);

    // 1. Manifest YAML
    const manifestContent = buildManifest(opts);
    const manifestUri = vscode.Uri.joinPath(folderUri, `${opts.name.toLowerCase()}-manifest.yaml`);
    await vscode.workspace.fs.writeFile(manifestUri, Buffer.from(manifestContent, 'utf-8'));

    // 2. README
    const readmeContent = buildPluginReadme(opts);
    const readmeUri = vscode.Uri.joinPath(folderUri, 'README.md');
    await vscode.workspace.fs.writeFile(readmeUri, Buffer.from(readmeContent, 'utf-8'));

    // 3. API-specific: sample OpenAPI spec
    if (opts.format === 'API') {
        const specContent = buildOpenApiSpec(opts);
        const specUri = vscode.Uri.joinPath(folderUri, 'openapi.yaml');
        await vscode.workspace.fs.writeFile(specUri, Buffer.from(specContent, 'utf-8'));
    }

    // 4. GPT-specific: sample prompt template file
    if (opts.format === 'GPT') {
        const templateContent = buildGptTemplateFile(opts);
        const templateUri = vscode.Uri.joinPath(folderUri, `${opts.name.toLowerCase()}-template.txt`);
        await vscode.workspace.fs.writeFile(templateUri, Buffer.from(templateContent, 'utf-8'));
    }

    // 5. KQL-specific: sample query file
    if (opts.format === 'KQL') {
        const queryContent = buildKqlQueryFile(opts);
        const queryUri = vscode.Uri.joinPath(folderUri, `${opts.name.toLowerCase()}-query.kql`);
        await vscode.workspace.fs.writeFile(queryUri, Buffer.from(queryContent, 'utf-8'));
    }

    // Open the manifest
    const doc = await vscode.workspace.openTextDocument(manifestUri);
    await vscode.window.showTextDocument(doc);

    vscode.window.showInformationMessage(
        `✅ Scaffolded ${opts.format} plugin "${opts.displayName}" in ${opts.name}/`
    );
}

async function writePromptbookScaffold(opts: PromptbookOptions) {
    const safeName = opts.title.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
    const folderUri = await getTargetFolder(`promptbooks`);
    if (!folderUri) { return; }

    await vscode.workspace.fs.createDirectory(folderUri);

    const content = buildPromptbook(opts);
    const fileUri = vscode.Uri.joinPath(folderUri, `${safeName}.md`);
    await vscode.workspace.fs.writeFile(fileUri, Buffer.from(content, 'utf-8'));

    const doc = await vscode.workspace.openTextDocument(fileUri);
    await vscode.window.showTextDocument(doc);

    vscode.window.showInformationMessage(
        `✅ Scaffolded promptbook "${opts.title}" in promptbooks/`
    );
}

// ─── Manifest builder ────────────────────────────────────────────────────────

function buildManifest(opts: ScaffoldOptions): string {
    let yaml = '';

    // ── Header comment ───────────────────────────────────────────────────────
    yaml += `# =========================================================================\n`;
    yaml += `# Security Copilot ${opts.format} Plugin — ${opts.displayName}\n`;
    yaml += `# =========================================================================\n`;
    yaml += `# Format:  ${opts.format}\n`;
    yaml += `# Docs:    https://learn.microsoft.com/security-copilot/extend/\n`;
    yaml += `#\n`;
    yaml += `# To install: Upload this file to Security Copilot > Settings > Plugins\n`;
    yaml += `# =========================================================================\n\n`;

    // ── Descriptor ───────────────────────────────────────────────────────────
    yaml += `Descriptor:\n`;
    yaml += `  Name: ${opts.name}\n`;
    yaml += `  DisplayName: "${opts.displayName}"\n`;
    yaml += `  Description: >\n`;
    yaml += `    ${opts.description}\n`;
    yaml += `  DescriptionForModel: |\n`;
    yaml += `    ${opts.description}\n`;
    yaml += `    Use this plugin when the user asks about topics related to ${opts.displayName}.\n`;

    // Auth
    if (opts.authType !== 'None') {
        yaml += buildAuthBlock(opts);
    } else {
        yaml += `  SupportedAuthTypes:\n    - None\n`;
    }

    // Settings block for KQL workspace targets
    if (opts.format === 'KQL' && opts.kqlTarget && ['Sentinel', 'LogAnalytics'].includes(opts.kqlTarget)) {
        yaml += buildWorkspaceSettings();
    }
    if (opts.format === 'KQL' && opts.kqlTarget === 'Kusto') {
        yaml += buildKustoSettings();
    }

    yaml += `\n`;

    // ── SkillGroups ──────────────────────────────────────────────────────────
    yaml += `SkillGroups:\n`;

    if (opts.format === 'API') {
        yaml += buildApiSkillGroup(opts);
    } else if (opts.format === 'GPT') {
        yaml += buildGptSkillGroup(opts);
    } else if (opts.format === 'KQL') {
        yaml += buildKqlSkillGroup(opts);
    } else if (opts.format === 'LogicApp') {
        yaml += buildLogicAppSkillGroup(opts);
    } else if (opts.format === 'MCP') {
        yaml += buildMcpSkillGroup(opts);
    } else if (opts.format === 'Agent') {
        yaml += buildAgentSkillGroup(opts);
    }

    // ── Agent Definitions (Agent format only) ────────────────────────────────
    if (opts.format === 'Agent') {
        yaml = buildAgentManifest(opts);
    }

    return yaml;
}

// ── Auth blocks ──────────────────────────────────────────────────────────────

function buildAuthBlock(opts: ScaffoldOptions): string {
    let s = '';
    s += `  SupportedAuthTypes:\n`;
    s += `    - ${opts.authType}\n`;
    s += `  Authorization:\n`;

    switch (opts.authType) {
        case 'ApiKey':
            s += `    Type: APIKey\n`;
            s += `    Key: x-api-key               # Change to your API's header name\n`;
            s += `    Location: Header              # Header | QueryString\n`;
            s += `    AuthScheme: ""                # Use "Bearer" for Bearer tokens\n`;
            break;
        case 'AAD':
            s += `    Type: AAD\n`;
            s += `    EntraScopes: https://graph.microsoft.com/.default\n`;
            break;
        case 'AADDelegated':
            s += `    Type: AADDelegated\n`;
            s += `    EntraScopes: https://graph.microsoft.com/.default\n`;
            break;
        case 'OAuthAuthorizationCodeFlow':
            s += `    Type: OAuthAuthorizationCodeFlow\n`;
            s += `    ClientId: <YOUR-CLIENT-ID>\n`;
            s += `    AuthorizationEndpoint: https://login.microsoftonline.com/<YOUR-TENANT-ID>/oauth2/v2.0/authorize\n`;
            s += `    TokenEndpoint: https://login.microsoftonline.com/<YOUR-TENANT-ID>/oauth2/v2.0/token\n`;
            s += `    Scopes: offline_access User.Read.All\n`;
            s += `    AuthorizationContentType: application/x-www-form-urlencoded\n`;
            break;
        case 'OAuthClientCredentialsFlow':
            s += `    Type: OAuthClientCredentialsFlow\n`;
            s += `    TokenEndpoint: https://login.microsoftonline.com/<YOUR-TENANT-ID>/oauth2/v2.0/token\n`;
            s += `    AuthorizationContentType: application/x-www-form-urlencoded\n`;
            break;
        case 'Basic':
            s += `    Type: Basic\n`;
            break;
    }
    return s;
}

// ── KQL settings blocks ──────────────────────────────────────────────────────

function buildWorkspaceSettings(): string {
    return `  Settings:
    - Name: TenantId
      Label: Tenant ID
      Description: Your Azure Tenant ID
      HintText: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
      SettingType: string
      Required: true
    - Name: SubscriptionId
      Label: Subscription ID
      Description: Your Azure Subscription ID
      HintText: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
      SettingType: string
      Required: true
    - Name: ResourceGroupName
      Label: Resource Group
      Description: The resource group containing the workspace
      HintText: "my-resource-group"
      SettingType: string
      Required: true
    - Name: WorkspaceName
      Label: Workspace Name
      Description: The Log Analytics workspace name
      HintText: "my-workspace"
      SettingType: string
      Required: true
`;
}

function buildKustoSettings(): string {
    return `  Settings:
    - Name: ClusterURL
      Label: Cluster URL
      Description: Azure Data Explorer cluster URL
      HintText: "https://mycluster.region.kusto.windows.net"
      SettingType: string
      Required: true
    - Name: DatabaseName
      Label: Database Name
      Description: The Kusto database to query
      HintText: "mydb"
      SettingType: string
      Required: true
`;
}

// ── Skill group builders ─────────────────────────────────────────────────────

function buildApiSkillGroup(opts: ScaffoldOptions): string {
    const specUrl = opts.openApiSpecUrl || 'https://example.com/openapi.yaml';
    return `  - Format: API
    Settings:
      OpenApiSpecUrl: ${specUrl}
      # EndpointUrlSettingName: InstanceURL   # Uncomment for user-configurable base URL
`;
}

function buildGptSkillGroup(opts: ScaffoldOptions): string {
    const model = opts.modelName || 'gpt-4o';
    return `  - Format: GPT
    Skills:
      - Name: ${opts.name}Analyze
        DisplayName: "${opts.displayName} — Analyze"
        Description: >
          Analyzes input data and provides a structured security assessment.
        DescriptionForModel: |
          Use this skill when the user wants to analyze security-related text,
          logs, or indicators. Provide the analysis in a clear structured format.
        ExamplePrompts:
          - "Analyze this data with ${opts.displayName}"
          - "Use ${opts.displayName} to assess this"
          - "Run ${opts.displayName} analysis"
        Inputs:
          - Name: inputData
            Description: The text, log data, or indicator to analyze
            Required: true
        Settings:
          ModelName: ${model}
          Template: |-
            You are a security analyst assistant powered by ${opts.displayName}.

            Analyze the following input and provide a detailed security assessment:

            --- BEGIN INPUT ---
            {{inputData}}
            --- END INPUT ---

            Provide your response in this structure:
            ## Summary
            Brief overview of findings.

            ## Key Findings
            - Finding 1
            - Finding 2

            ## Risk Level
            Low / Medium / High / Critical — with justification.

            ## Recommended Actions
            1. Action 1
            2. Action 2

      - Name: ${opts.name}Summarize
        DisplayName: "${opts.displayName} — Summarize"
        Description: >
          Summarizes security data into an executive-friendly report.
        ExamplePrompts:
          - "Summarize the ${opts.displayName} results"
          - "Give me an executive summary"
        Inputs:
          - Name: reportData
            Description: The data or previous findings to summarize
            Required: true
        Settings:
          ModelName: ${model}
          Template: |-
            You are a security analyst writing an executive summary.

            Based on the following data, produce a concise executive summary
            suitable for a CISO or security leadership:

            {{reportData}}

            Format:
            ## Executive Summary
            ## Risk Overview
            ## Top Recommendations
`;
}

function buildKqlSkillGroup(opts: ScaffoldOptions): string {
    const target = opts.kqlTarget || 'Defender';
    let settingsBlock = `          Target: ${target}\n`;

    if (target === 'Sentinel' || target === 'LogAnalytics') {
        settingsBlock += `          TenantId: "{{TenantId}}"\n`;
        settingsBlock += `          SubscriptionId: "{{SubscriptionId}}"\n`;
        settingsBlock += `          ResourceGroupName: "{{ResourceGroupName}}"\n`;
        settingsBlock += `          WorkspaceName: "{{WorkspaceName}}"\n`;
    }
    if (target === 'Kusto') {
        settingsBlock += `          Cluster: "{{ClusterURL}}"\n`;
        settingsBlock += `          Database: "{{DatabaseName}}"\n`;
    }

    const queries = getKqlTemplateQueries(target, opts.name);

    return `  - Format: KQL
    Skills:
      - Name: ${opts.name}RecentAlerts
        DisplayName: "${opts.displayName} — Recent Alerts"
        Description: >
          Retrieves recent high and critical severity alerts.
        DescriptionForModel: |
          Use this skill to fetch recent security alerts.
          Returns a table of alerts sorted by time.
        ExamplePrompts:
          - "Show me recent high severity alerts"
          - "What critical alerts happened today?"
          - "Get the latest security alerts"
        Inputs:
          - Name: timeRange
            Description: How far back to look (e.g. 1h, 24h, 7d)
            PlaceholderValue: "7d"
            DefaultValue: "7d"
            Required: false
          - Name: minSeverity
            Description: Minimum severity to include
            PlaceholderValue: "High"
            DefaultValue: "High"
            Required: false
        Settings:
${settingsBlock}          Template: |-
${queries.alerts}

      - Name: ${opts.name}UserActivity
        DisplayName: "${opts.displayName} — User Activity"
        Description: >
          Looks up recent activity for a specific user account.
        DescriptionForModel: |
          Use this skill when the user asks about a specific user's activity,
          sign-ins, or behavior.
        ExamplePrompts:
          - "Show me activity for this user"
          - "What has this user been doing?"
          - "Look up user sign-in activity"
        Inputs:
          - Name: userPrincipalName
            Description: The UPN or email of the user to investigate
            PlaceholderValue: "user@contoso.com"
            Required: true
          - Name: timeRange
            Description: How far back to look (e.g. 1h, 24h, 7d)
            DefaultValue: "7d"
            Required: false
        Settings:
${settingsBlock}          Template: |-
${queries.userActivity}
`;
}

function getKqlTemplateQueries(target: string, name: string) {
    if (target === 'Defender') {
        return {
            alerts: `            // ${name} — Recent Alerts (Defender)
            AlertInfo
            | where TimeGenerated > ago({{timeRange}})
            | where Severity in ("{{minSeverity}}", "Critical")
            | project AlertId, Title, Severity, Category, TimeGenerated
            | order by TimeGenerated desc
            | take 50`,
            userActivity: `            // ${name} — User Activity (Defender)
            IdentityLogonEvents
            | where TimeGenerated > ago({{timeRange}})
            | where AccountUpn =~ "{{userPrincipalName}}"
            | project TimeGenerated, ActionType, LogonType,
                      DeviceName, ISP, IPAddress, Location
            | order by TimeGenerated desc
            | take 100`,
        };
    }
    // Sentinel / LogAnalytics / Kusto
    return {
        alerts: `            // ${name} — Recent Alerts (${target})
            SecurityAlert
            | where TimeGenerated > ago({{timeRange}})
            | where AlertSeverity in ("{{minSeverity}}", "Critical")
            | project SystemAlertId, AlertName, AlertSeverity,
                      ProviderName, TimeGenerated
            | order by TimeGenerated desc
            | take 50`,
        userActivity: `            // ${name} — User Activity (${target})
            SigninLogs
            | where TimeGenerated > ago({{timeRange}})
            | where UserPrincipalName =~ "{{userPrincipalName}}"
            | project TimeGenerated, AppDisplayName, ResultType,
                      IPAddress, Location, DeviceDetail
            | order by TimeGenerated desc
            | take 100`,
    };
}

// ── LogicApp, MCP, Agent skill group builders ────────────────────────────────

function buildLogicAppSkillGroup(opts: ScaffoldOptions): string {
    return `  - Format: LogicApp
    Skills:
      - Name: ${opts.name}Trigger
        DisplayName: "${opts.displayName} — Trigger"
        Description: >
          Triggers the ${opts.displayName} Logic App workflow.
        DescriptionForModel: |
          Use this skill when the user wants to trigger the ${opts.displayName} workflow.
        ExamplePrompts:
          - "Run ${opts.displayName}"
          - "Trigger ${opts.displayName} workflow"
        Inputs:
          - Name: inputData
            Description: The data to pass to the Logic App
            Required: true
        Settings:
          SubscriptionId: ${opts.subscriptionId || '<YOUR-SUBSCRIPTION-ID>'}
          ResourceGroup: ${opts.resourceGroup || '<YOUR-RESOURCE-GROUP>'}
          WorkflowName: ${opts.workflowName || 'MyLogicApp'}
          TriggerName: ${opts.triggerName || 'manual'}
`;
}

function buildMcpSkillGroup(opts: ScaffoldOptions): string {
    return `  - Format: MCP
    Settings:
      Endpoint: ${opts.mcpEndpoint || 'https://example.com/api/mcp'}
      TimeoutInSeconds: 120
      # AllowedTools: tool_name_1, tool_name_2   # Uncomment to restrict which tools Copilot can use
`;
}

function buildAgentSkillGroup(opts: ScaffoldOptions): string {
    const model = opts.agentModel || 'gpt-4o';
    const isInteractive = opts.agentType === 'Interactive';

    let yaml = '';
    yaml += `  - Format: Agent\n`;
    yaml += `    Skills:\n`;
    yaml += `      - Name: ${opts.name}Skill\n`;
    yaml += `        DisplayName: "${opts.displayName} — Orchestrator"\n`;
    yaml += `        Description: >\n`;
    yaml += `          Main orchestration skill for the ${opts.displayName} agent.\n`;
    yaml += `        Interfaces:\n`;
    yaml += `          - ${isInteractive ? 'InteractiveAgent' : 'Agent'}\n`;

    // Interactive agents need a UserRequest input
    if (isInteractive) {
        yaml += `        Inputs:\n`;
        yaml += `          - Name: UserRequest\n`;
        yaml += `            Description: The user's question or request.\n`;
        yaml += `            DefaultValue: ''\n`;
        yaml += `            Required: true\n`;
        yaml += `        SuggestedPrompts:\n`;
        yaml += `          - Prompt: Show me an overview of recent security activity\n`;
        yaml += `            Title: Security Overview\n`;
        yaml += `            Personas:\n`;
        yaml += `              - 1\n`;
        yaml += `            IsStarterAgent: true\n`;
        yaml += `          - Prompt: Tell me more about the findings\n`;
    }

    yaml += `        Settings:\n`;
    if (isInteractive) {
        yaml += `          OrchestratorSkill: DefaultAgentOrchestrator\n`;
    }
    yaml += `          Model: ${model}\n`;
    yaml += `          Instructions: >-\n`;
    yaml += `            # Mission\n`;
    yaml += `            You are a security analyst agent for ${opts.displayName}.\n`;
    yaml += `\n`;
    yaml += `            # Workflow\n`;
    yaml += `            1. Gather initial context using available child skills\n`;
    yaml += `            2. Analyze the data for security implications\n`;
    yaml += `            3. Formulate findings and recommendations\n`;
    yaml += `\n`;
    yaml += `            # Output\n`;
    yaml += `            Provide a structured report with Summary, Findings, and Recommendations.\n`;
    yaml += `        ChildSkills:\n`;
    yaml += `          - ${opts.name}Query\n`;
    yaml += `\n`;

    // Add a sample KQL child skill
    yaml += `  - Format: KQL\n`;
    yaml += `    Skills:\n`;
    yaml += `      - Name: ${opts.name}Query\n`;
    yaml += `        DisplayName: "${opts.displayName} — Data Query"\n`;
    yaml += `        Description: >\n`;
    yaml += `          Retrieves recent security data for the agent to analyze.\n`;
    yaml += `        Inputs:\n`;
    yaml += `          - Name: timeRange\n`;
    yaml += `            Description: How far back to look (e.g. 1h, 24h, 7d)\n`;
    yaml += `            DefaultValue: "7d"\n`;
    yaml += `            Required: false\n`;
    yaml += `        Settings:\n`;
    yaml += `          Target: Defender\n`;
    yaml += `          Template: |-\n`;
    yaml += `            AlertInfo\n`;
    yaml += `            | where TimeGenerated > ago({{timeRange}})\n`;
    yaml += `            | where Severity in ("High", "Critical")\n`;
    yaml += `            | project AlertId, Title, Severity, Category, TimeGenerated\n`;
    yaml += `            | order by TimeGenerated desc\n`;
    yaml += `            | take 50\n`;

    return yaml;
}

function buildAgentManifest(opts: ScaffoldOptions): string {
    const isInteractive = opts.agentType === 'Interactive';

    let yaml = '';

    // ── Header comment ───────────────────────────────────────────────────────
    yaml += `# =========================================================================\n`;
    yaml += `# Security Copilot Agent — ${opts.displayName}\n`;
    yaml += `# =========================================================================\n`;
    yaml += `# Type:    ${isInteractive ? 'Interactive' : 'Standard'} Agent\n`;
    yaml += `# Docs:    https://learn.microsoft.com/security-copilot/extend/\n`;
    yaml += `#\n`;
    yaml += `# To install: Upload this file to Security Copilot > Settings > Plugins\n`;
    yaml += `# =========================================================================\n\n`;

    // ── Descriptor ───────────────────────────────────────────────────────────
    yaml += `Descriptor:\n`;
    yaml += `  Name: ${opts.name}\n`;
    yaml += `  DisplayName: "${opts.displayName}"\n`;
    yaml += `  Description: >\n`;
    yaml += `    ${opts.description}\n\n`;

    // ── AgentDefinitions ─────────────────────────────────────────────────────
    yaml += `AgentDefinitions:\n`;
    yaml += `  - Name: ${opts.name}\n`;
    yaml += `    DisplayName: "${opts.displayName}"\n`;
    yaml += `    Description: >\n`;
    yaml += `      ${opts.description}\n`;
    yaml += `    Publisher: Custom\n`;
    yaml += `    Product: Security\n`;
    yaml += `    RequiredSkillsets:\n`;
    yaml += `      - ${opts.name}\n`;
    yaml += `    AgentSingleInstanceConstraint: None\n`;
    yaml += `    Triggers:\n`;
    yaml += `      - Name: Default\n`;
    yaml += `        DefaultPollPeriodSeconds: 0\n`;
    yaml += `        ProcessSkill: ${opts.name}.${opts.name}Skill\n`;
    yaml += `        FetchSkill: ''\n`;
    if (isInteractive) {
        yaml += `    PromptSkill: ${opts.name}.${opts.name}Skill\n`;
    }
    yaml += `\n`;

    // ── SkillGroups ──────────────────────────────────────────────────────────
    yaml += `SkillGroups:\n`;
    yaml += buildAgentSkillGroup(opts);

    return yaml;
}

// ─── Promptbook builder ──────────────────────────────────────────────────────

function buildPromptbook(opts: PromptbookOptions): string {
    const pluginList = opts.plugins.split(',').map(p => `*${p.trim()}*`).join(', ');

    return `# ${opts.title}

**Required plugins**: ${pluginList}

**Required Input**: \`<${opts.inputVariable}>\`

**Description**: ${opts.description}

---

1. **Gather initial context**

   \`\`\`
   Provide an overview of <${opts.inputVariable}> including any recent activity,
   associated alerts, and risk indicators from the last 7 days.
   \`\`\`

2. **Deep investigation**

   \`\`\`
   Based on the previous findings, perform a deeper investigation into any
   anomalous behavior or indicators of compromise associated with
   <${opts.inputVariable}>. Check for lateral movement, privilege escalation,
   and data exfiltration indicators.
   \`\`\`

3. **Check related entities**

   \`\`\`
   Identify all related users, devices, IP addresses, and applications
   connected to <${opts.inputVariable}>. For each entity, check for
   suspicious patterns or known threat indicators.
   \`\`\`

4. **Generate executive summary**

   \`\`\`
   Compile a comprehensive investigation report for <${opts.inputVariable}>
   including:
   - Executive summary suitable for security leadership
   - Timeline of events
   - Key findings with severity ratings
   - Risk assessment (Low / Medium / High / Critical)
   - Recommended immediate actions
   - Long-term remediation steps
   \`\`\`
`;
}

// ─── Supplementary file builders ─────────────────────────────────────────────

function buildPluginReadme(opts: ScaffoldOptions): string {
    let authSection = '';
    switch (opts.authType) {
        case 'ApiKey': authSection = 'This plugin requires an **API key**. You will be prompted for it when installing.'; break;
        case 'AAD':    authSection = 'This plugin uses **Microsoft Entra ID** (application-only) authentication.'; break;
        case 'AADDelegated': authSection = 'This plugin uses **Microsoft Entra ID** delegated (user + application) authentication.'; break;
        case 'OAuthAuthorizationCodeFlow': authSection = 'This plugin uses **OAuth 2.0 Authorization Code** authentication. Users will sign in interactively.'; break;
        case 'OAuthClientCredentialsFlow': authSection = 'This plugin uses **OAuth 2.0 Client Credentials** (server-to-server) authentication.'; break;
        case 'Basic':  authSection = 'This plugin uses **Basic** (username/password) authentication.'; break;
        case 'None':   authSection = 'This plugin does not require authentication.'; break;
    }

    let targetSection = '';
    if (opts.format === 'KQL' && opts.kqlTarget) {
        targetSection = `\n### KQL Target\n\nThis plugin queries **${opts.kqlTarget}**.`;
        if (['Sentinel', 'LogAnalytics'].includes(opts.kqlTarget)) {
            targetSection += ` You will need to provide your Tenant ID, Subscription ID, Resource Group, and Workspace Name during installation.`;
        }
        if (opts.kqlTarget === 'Kusto') {
            targetSection += ` You will need to provide your ADX Cluster URL and Database name during installation.`;
        }
    }

    return `# ${opts.displayName}

> **Format**: ${opts.format} plugin for Microsoft Security Copilot

## Description

${opts.description}

## Installation

1. Go to **Security Copilot** > **Settings** > **Plugins** > **Add Plugin**
2. Select **Custom** and upload \`${opts.name.toLowerCase()}-manifest.yaml\`
3. Configure authentication and settings as prompted

## Authentication

${authSection}
${targetSection}

## Skills

| Skill | Description |
|-------|-------------|
${opts.format === 'GPT' ? `| ${opts.name}Analyze | Analyzes input data and provides a security assessment |\n| ${opts.name}Summarize | Generates executive summaries |` : ''}${opts.format === 'KQL' ? `| ${opts.name}RecentAlerts | Retrieves recent high/critical severity alerts |\n| ${opts.name}UserActivity | Looks up activity for a specific user |` : ''}${opts.format === 'API' ? `| (defined by OpenAPI spec) | Skills are derived from your OpenAPI operations |` : ''}${opts.format === 'LogicApp' ? `| ${opts.name}Trigger | Triggers the Logic App workflow |` : ''}${opts.format === 'MCP' ? `| (defined by MCP server) | Tools are auto-discovered from the MCP endpoint |` : ''}${opts.format === 'Agent' ? `| ${opts.name}Skill | Main agent orchestration skill |\n| ${opts.name}Query | KQL child skill for data retrieval |` : ''}

## Files

| File | Description |
|------|-------------|
| \`${opts.name.toLowerCase()}-manifest.yaml\` | Plugin manifest (upload this to Security Copilot) |
${opts.format === 'API' ? `| \`openapi.yaml\` | OpenAPI specification (host this at a public URL) |` : ''}${opts.format === 'GPT' ? `| \`${opts.name.toLowerCase()}-template.txt\` | Sample prompt template |` : ''}${opts.format === 'KQL' ? `| \`${opts.name.toLowerCase()}-query.kql\` | Sample KQL queries for reference |` : ''}${opts.format === 'Agent' ? `| \`README.md\` | This documentation file |` : ''}${opts.format === 'LogicApp' ? `| \`README.md\` | This documentation file |` : ''}${opts.format === 'MCP' ? `| \`README.md\` | This documentation file |` : ''}

## Resources

- [Create ${opts.format} Plugins](https://learn.microsoft.com/security-copilot/extend/create-${opts.format.toLowerCase()}-plugin)
- [Security Copilot Plugin Overview](https://learn.microsoft.com/security-copilot/extend/)
`;
}

function buildOpenApiSpec(opts: ScaffoldOptions): string {
    const lowerName = opts.name.toLowerCase();
    return `# OpenAPI specification for ${opts.displayName}
# Host this file at a publicly accessible URL and update OpenApiSpecUrl in the manifest.
#
# Tips:
#   - Add #ExamplePrompts in operation descriptions to improve skill selection
#   - Keep operationIds short and descriptive
#   - Include detailed descriptions for the orchestrator

openapi: "3.0.0"

info:
  title: ${opts.displayName} API
  description: ${opts.description}
  version: "1.0.0"

servers:
  - url: https://api.example.com/v1
    description: Production

paths:
  /${lowerName}/lookup:
    get:
      operationId: ${lowerName}Lookup
      summary: Look up an indicator
      description: |
        Looks up threat intelligence for a given indicator.
        #ExamplePrompts Look up this indicator using ${opts.displayName}
        #ExamplePrompts Check threat intel on this IOC
      parameters:
        - name: indicator
          in: query
          description: The indicator to look up (IP, domain, hash, etc.)
          required: true
          schema:
            type: string
      responses:
        "200":
          description: Successful lookup
          content:
            application/json:
              schema:
                type: object
                properties:
                  indicator:
                    type: string
                  riskScore:
                    type: integer
                  category:
                    type: string
                  details:
                    type: string

  /${lowerName}/report:
    get:
      operationId: ${lowerName}Report
      summary: Get a threat report
      description: |
        Retrieves a detailed threat report.
        #ExamplePrompts Get a threat report from ${opts.displayName}
        #ExamplePrompts Show me the latest threat report
      parameters:
        - name: reportId
          in: query
          description: Report identifier
          required: false
          schema:
            type: string
      responses:
        "200":
          description: Report data
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    type: string
                  title:
                    type: string
                  summary:
                    type: string
                  severity:
                    type: string
                  indicators:
                    type: array
                    items:
                      type: string
`;
}

function buildGptTemplateFile(opts: ScaffoldOptions): string {
    return `# Prompt Template for ${opts.displayName}
#
# This is a sample standalone prompt template file.
# You can reference it from the manifest using TemplateUrl instead of inline Template.
#
# Variables: use {{variableName}} to reference Inputs declared in the manifest.
# ─────────────────────────────────────────────────────────────────────────────

You are a security analyst assistant powered by ${opts.displayName}.

Your task is to analyze the following input and provide expert security guidance.

## Context
The user is a security analyst performing an investigation.
They need clear, actionable, evidence-based analysis.

## Input
{{inputData}}

## Instructions
1. Identify any indicators of compromise (IOCs)
2. Assess the severity and potential impact
3. Correlate with known threat patterns if possible
4. Provide specific, actionable recommendations

## Output Format
### Summary
Brief overview of the analysis.

### Indicators Found
- List each IOC with type (IP, domain, hash, URL, email)

### Risk Assessment
- Severity: [Low / Medium / High / Critical]
- Confidence: [Low / Medium / High]
- Justification for the rating

### Recommended Actions
1. Immediate steps
2. Short-term remediation
3. Long-term prevention
`;
}

function buildKqlQueryFile(opts: ScaffoldOptions): string {
    const target = opts.kqlTarget || 'Defender';
    const isDefender = target === 'Defender';

    return `// =========================================================================
// KQL Queries for ${opts.displayName}
// Target: ${target}
// =========================================================================
// These are reference queries. The actual queries used by the plugin are in
// the manifest YAML. You can use these for testing in Advanced Hunting or
// Log Analytics.
// =========================================================================

// ─── Recent High/Critical Alerts ─────────────────────────────────────────────
${isDefender ? `AlertInfo
| where TimeGenerated > ago(7d)
| where Severity in ("High", "Critical")
| project AlertId, Title, Severity, Category, TimeGenerated
| order by TimeGenerated desc
| take 50` : `SecurityAlert
| where TimeGenerated > ago(7d)
| where AlertSeverity in ("High", "Critical")
| project SystemAlertId, AlertName, AlertSeverity, ProviderName, TimeGenerated
| order by TimeGenerated desc
| take 50`}

// ─── User Activity Lookup ────────────────────────────────────────────────────
// Replace <UPN> with the user's email address
${isDefender ? `IdentityLogonEvents
| where TimeGenerated > ago(7d)
| where AccountUpn =~ "<UPN>"
| project TimeGenerated, ActionType, LogonType, DeviceName, ISP, IPAddress, Location
| order by TimeGenerated desc
| take 100` : `SigninLogs
| where TimeGenerated > ago(7d)
| where UserPrincipalName =~ "<UPN>"
| project TimeGenerated, AppDisplayName, ResultType, IPAddress, Location, DeviceDetail
| order by TimeGenerated desc
| take 100`}

// ─── Failed Sign-ins (Brute Force Detection) ────────────────────────────────
${isDefender ? `IdentityLogonEvents
| where TimeGenerated > ago(24h)
| where ActionType == "LogonFailed"
| summarize FailedAttempts = count() by AccountUpn, IPAddress, bin(TimeGenerated, 1h)
| where FailedAttempts > 10
| order by FailedAttempts desc` : `SigninLogs
| where TimeGenerated > ago(24h)
| where ResultType != "0"
| summarize FailedAttempts = count() by UserPrincipalName, IPAddress, bin(TimeGenerated, 1h)
| where FailedAttempts > 10
| order by FailedAttempts desc`}
`;
}


