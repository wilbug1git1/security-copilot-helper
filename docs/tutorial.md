# Tutorial: Building Security Copilot Plugins & Promptbooks

This step-by-step tutorial walks you through creating a custom Security Copilot plugin and a promptbook using the **Security Copilot Plugin Helper** VS Code extension.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Part 1 — Create a KQL Plugin with the Scaffold Wizard](#part-1--create-a-kql-plugin-with-the-scaffold-wizard)
- [Part 2 — Create an Agent with the Scaffold Wizard](#part-2--create-an-agent-with-the-scaffold-wizard)
- [Part 3 — Build a Plugin Manually with `sc-` Snippets](#part-3--build-a-plugin-manually-with-sc--snippets)
- [Part 4 — Build a LogicApp, MCP, or Agent Plugin Manually](#part-4--build-a-logicapp-mcp-or-agent-plugin-manually)
- [Part 5 — Mixed-Format Plugins](#part-5--mixed-format-plugins)
- [Part 6 — Create a Promptbook](#part-6--create-a-promptbook)
- [Part 7 — Using `sc-` Snippets Reference](#part-7--using-sc--snippets-reference)
- [Part 8 — Validation & Best Practices](#part-8--validation--best-practices)
- [Part 9 — KQL Template Validation in Action](#part-9--kql-template-validation-in-action)
- [Next Steps](#next-steps)

---

## Prerequisites

1. **VS Code** with the Security Copilot Plugin Helper extension installed
2. A workspace folder open in VS Code (this is where your plugin files will be created)

---

## Part 1 — Create a KQL Plugin with the Scaffold Wizard

The fastest way to create a plugin is the **guided wizard**. It asks you five questions and generates a complete, ready-to-upload project.

### Step 1: Launch the Wizard

Open the **Command Palette** (`Ctrl+Shift+P`) and type:

```
Security Copilot: Scaffold New Plugin (Guided Wizard)
```

> **Tip:** You can also use the quick-create commands if you already know your format:
> - `Security Copilot: New API Plugin`
> - `Security Copilot: New GPT Plugin`
> - `Security Copilot: New KQL Plugin`
> - `Security Copilot: New LogicApp Plugin`
> - `Security Copilot: New MCP Plugin`
> - `Security Copilot: New Agent`

### Step 2: Choose Your Plugin Format

The wizard presents six options:

| Format | Best for |
|--------|----------|
| **API** | Wrapping an existing REST API via OpenAPI spec |
| **GPT** | Text analysis, summarization, and data transformation using LLM prompts |
| **KQL** | Querying Microsoft Defender, Sentinel, Log Analytics, or Azure Data Explorer |
| **LogicApp** | Triggering Azure Logic App workflows for automation, email, Teams actions |
| **MCP** | Connecting to remote MCP servers (Model Context Protocol) |
| **Agent** | Autonomous or interactive multi-step investigations and orchestration |

Select the format that matches your use case. For this tutorial, let's pick **KQL**.

### Step 3: Name Your Plugin

Enter a **PascalCase** name with no spaces — this is the internal identifier:

```
ThreatHuntingQueries
```

### Step 4: Set Display Name & Description

- **Display name**: `Threat Hunting Queries` (shown in the Security Copilot UI)
- **Description**: `Run KQL threat hunting queries against Microsoft Sentinel to investigate suspicious activity` (this helps the AI orchestrator select your skills)

### Step 5: Pick Authentication

Choose from:
- **ApiKey** — API key in a header or query string
- **AAD** — Microsoft Entra ID (application-only)
- **AADDelegated** — Microsoft Entra ID (user + application delegated)
- **OAuthAuthorizationCodeFlow** — OAuth 2.0 Authorization Code (interactive)
- **OAuthClientCredentialsFlow** — OAuth 2.0 Client Credentials (server-to-server)
- **Basic** — Username/password
- **None** — No authentication required

For a KQL plugin hitting Sentinel, choose **None** (Sentinel auth is handled by Security Copilot).

### Step 6: Configure KQL Target

Select your target:
- **Defender** — no extra settings needed
- **Sentinel** — generates workspace settings (Tenant ID, Subscription, Resource Group, Workspace)
- **LogAnalytics** — similar to Sentinel
- **Kusto** — generates Cluster and Database settings

Pick **Sentinel** for this example.

### What Gets Created

The wizard creates a folder with three files:

```
ThreatHuntingQueries/
├── manifest.yaml     ← Plugin manifest (your main file)
├── README.md         ← Documentation template
└── query.kql         ← Sample KQL query
```

The `manifest.yaml` opens automatically with all fields pre-filled, validation running, and IntelliSense active.

---

## Part 2 — Create an Agent with the Scaffold Wizard

Agents are the most powerful plugin type — they orchestrate multiple skills, run in loops, and can provide interactive chat experiences. The wizard handles the extra complexity for you.

### Step 1: Launch the Wizard

Open the Command Palette and run:

```
Security Copilot: New Agent
```

Or use the full wizard (`Security Copilot: Scaffold New Plugin`) and select **Agent**.

### Step 2: Choose Agent Type

The wizard asks you to pick between:

| Type | Description |
|------|-------------|
| **Standard** | Autonomous agent — runs on a schedule via Triggers, processes data with a ProcessSkill, and generates findings without user interaction |
| **Interactive** | Chat-based agent — users interact via prompts and follow-ups, requires `PromptSkill`, `OrchestratorSkill`, and `UserRequest` input |

For this tutorial, pick **Standard**.

### Step 3: Name, Describe, Authenticate

Same as any plugin:
- **Name**: `IncidentTriageAgent`
- **Display Name**: `Incident Triage Agent`
- **Description**: `Automatically triages and prioritizes security incidents from Microsoft Sentinel`
- **Auth**: None

### Step 4: Pick a Model

Agents need a model for orchestration:
- **gpt-4o** — recommended for most agents
- **gpt-4.1** — latest model with improved reasoning

Pick **gpt-4o**.

### What Gets Created

```
IncidentTriageAgent/
├── manifest.yaml     ← Plugin manifest with SkillGroups AND AgentDefinitions
├── README.md         ← Documentation
└── query.kql         ← Sample KQL for the agent's child skill
```

The manifest includes these agent-specific sections:

```yaml
# Skills the agent can invoke
SkillGroups:
  - Format: Agent
    Skills:
      - Name: TriageAgent
        Interfaces:
          - Agent
        Settings:
          Instructions: |-
            # Mission
            You are a security triage agent...
          Model: gpt-4o
        ChildSkills:
          - IncidentTriageAgent.FetchIncidents

# Agent deployment configuration
AgentDefinitions:
  - Name: IncidentTriageAgent
    DisplayName: Incident Triage Agent
    Publisher: My Team
    Product: SecurityCopilot
    RequiredSkillsets:
      - IncidentTriageAgent
    Triggers:
      - Name: Default
        DefaultPollPeriodSeconds: "0"
        ProcessSkill: IncidentTriageAgent.TriageAgent
```

### Interactive Agent Differences

If you chose **Interactive** instead, the wizard would also generate:

- `Interfaces: [InteractiveAgent]` on the skill
- A single input: `Name: UserRequest`
- `OrchestratorSkill: DefaultAgentOrchestrator` in Settings
- `PromptSkill: IncidentTriageAgent.TriageAgent` in AgentDefinitions
- `SuggestedPrompts` with starter prompts for different security personas

---

## Part 3 — Build a Plugin Manually with `sc-` Snippets

If you prefer to write a plugin from scratch, the extension provides **snippet prefixes** that scaffold code blocks as you type.

### Create a New YAML File

1. Create a new file: `my-plugin.yaml`
2. Start typing `sc-` and IntelliSense will show the available snippets

### Scaffold the Full Plugin

Type `sc-gpt-plugin` and press **Tab** (or **Enter**). This inserts a complete GPT plugin manifest:

```yaml
Descriptor:
  Name: MyGptPlugin
  DisplayName: "My GPT Plugin"
  Description: >
    Plugin description for users and orchestrator.

SkillGroups:
  - Format: GPT
    Skills:
      - Name: MySkill
        DisplayName: "My Skill"
        Description: >
          Skill description.
        Inputs:
          - Name: inputText
            Description: The input to process
            Required: true
        Settings:
          ModelName: gpt-4o
          Template: |-
            Your prompt template here.

            {{inputText}}
```

Each **placeholder** (highlighted in blue) is a tab stop — press `Tab` to jump between them and fill in your values.

### Add More Skills

Position your cursor inside the `Skills:` array and type `sc-skill-gpt` + **Tab** to add another GPT skill with all the required fields.

### Add Authentication

Need API key auth? Type `sc-auth-apikey` + **Tab** inside the `Descriptor:` section:

```yaml
  SupportedAuthTypes:
    - ApiKey
  Authorization:
    Type: APIKey
    Key: x-api-key
    Location: Header
    AuthScheme: ""
```

### Add Inputs and Settings

- `sc-input` — adds an input parameter to a skill
- `sc-setting` — adds a user-configurable setting to the Descriptor

---

## Part 4 — Build a LogicApp, MCP, or Agent Plugin Manually

Beyond API, GPT, and KQL, the extension supports three additional plugin formats. Here's how to build each one manually.

### LogicApp Plugin

LogicApp plugins trigger Azure Logic App workflows. Type `sc-logicapp-plugin` in a new YAML file:

```yaml
Descriptor:
  Name: AlertNotifier
  DisplayName: "Alert Notifier"
  Description: >
    Sends security alerts to Teams channels via Logic App.

SkillGroups:
  - Format: LogicApp
    Skills:
      - Name: SendAlert
        DisplayName: "Send Alert Notification"
        Description: >
          Sends an alert notification to the configured Teams channel.
        Inputs:
          - Name: alertTitle
            Description: Title of the security alert
            Required: true
          - Name: alertSeverity
            Description: Severity level (High, Medium, Low)
            Required: true
        Settings:
          SubscriptionId: <YOUR-SUBSCRIPTION-ID>
          ResourceGroup: <YOUR-RESOURCE-GROUP>
          WorkflowName: <YOUR-LOGIC-APP-NAME>
          TriggerName: manual
```

> **Key fields**: `SubscriptionId`, `ResourceGroup`, `WorkflowName`, and `TriggerName` are all required. The Logic App must be in the same Azure tenant as your Security Copilot instance.

### MCP Plugin

MCP (Model Context Protocol) plugins connect to remote MCP servers. Type `sc-mcp-plugin`:

```yaml
Descriptor:
  Name: DocsSearch
  DisplayName: "Documentation Search"
  Description: >
    Search Microsoft Learn documentation via MCP.
  DescriptionForModel: >
    Use this plugin when the user asks about Microsoft documentation,
    product features, or configuration guidance.

SkillGroups:
  - Format: MCP
    Settings:
      Endpoint: https://learn.microsoft.com/api/mcp
      AllowedTools: microsoft_docs_search, microsoft_docs_fetch
```

> **Key fields**: `Endpoint` is required. `AllowedTools` is strongly recommended for security — it restricts which MCP tools Security Copilot can invoke. Add `DescriptionForModel` to guide the AI on when to use the MCP tools.

### Agent Plugin (Manual)

Building an agent manually gives you full control. Type `sc-agent` for a standard agent or `sc-agent-interactive` for an interactive one:

```yaml
Descriptor:
  Name: ThreatHunter
  DisplayName: "Threat Hunter Agent"
  Description: >
    Autonomous agent that hunts for threats across Defender and Sentinel.

SkillGroups:
  # Child skill: KQL query the agent will invoke
  - Format: KQL
    Skills:
      - Name: GetRecentAlerts
        Description: Fetch recent high-severity alerts
        Settings:
          Target: Defender
          Template: |-
            AlertInfo
            | where Timestamp > ago(7d)
            | where Severity == "High"
            | top 20 by Timestamp desc

  # Agent orchestration skill
  - Format: Agent
    Skills:
      - Name: HuntAgent
        Interfaces:
          - Agent
        Settings:
          Instructions: |-
            # Mission
            You are a threat hunting agent. Your job is to analyze
            recent high-severity alerts and identify patterns.

            # Workflow
            1. Fetch recent alerts using GetRecentAlerts
            2. Analyze patterns across alert titles and categories
            3. Identify any related attack chains

            # Output
            Produce a markdown report with:
            - Summary of findings
            - Top threat patterns
            - Recommended response actions
          Model: gpt-4o
        ChildSkills:
          - ThreatHunter.GetRecentAlerts

AgentDefinitions:
  - Name: ThreatHunterAgent
    DisplayName: Threat Hunter Agent
    Publisher: Security Team
    Product: SecurityCopilot
    RequiredSkillsets:
      - ThreatHunter    # Must match Descriptor.Name
    Triggers:
      - Name: Default
        DefaultPollPeriodSeconds: "0"
        ProcessSkill: ThreatHunter.HuntAgent
```

> **Key points**:
> - `ChildSkills` uses dot notation: `DescriptorName.SkillName`
> - `RequiredSkillsets` must include `Descriptor.Name` so the agent can access its own skills
> - `Instructions` should have `# Mission`, `# Workflow`, and `# Output` sections
> - Standard agents use `Interfaces: [Agent]`, interactive agents use `Interfaces: [InteractiveAgent]`

---

## Part 5 — Mixed-Format Plugins

Security Copilot supports **mixed-format plugins** — a single manifest with multiple SkillGroups of different types. This is common when agents need child skills in other formats.

### Why Mixed-Format?

- An **Agent** that invokes **KQL** queries and **GPT** analysis in one manifest
- An **API** plugin bundled with a **GPT** summarization skill
- Any combination of the six supported formats

### How It Works

List multiple SkillGroups with different `Format` values:

```yaml
Descriptor:
  Name: ComprehensiveInvestigator
  Description: Multi-format investigation plugin.

SkillGroups:
  - Format: KQL
    Skills:
      - Name: QueryAlerts
        Description: Fetch recent alerts from Defender
        Settings:
          Target: Defender
          Template: |-
            AlertInfo
            | where Timestamp > ago(24h)
            | top 10 by Timestamp desc

  - Format: GPT
    Skills:
      - Name: AnalyzeAlerts
        Description: Analyze alert patterns using AI
        Settings:
          ModelName: gpt-4o
          Template: |-
            Analyze these security alerts and identify patterns:

            {{alertData}}
        Inputs:
          - Name: alertData
            Description: Alert data to analyze

  - Format: Agent
    Skills:
      - Name: InvestigationAgent
        Interfaces:
          - Agent
        Settings:
          Instructions: |-
            Orchestrate a full investigation using alerts and analysis.
          Model: gpt-4o
        ChildSkills:
          - ComprehensiveInvestigator.QueryAlerts
          - ComprehensiveInvestigator.AnalyzeAlerts
```

### Extension Support for Mixed-Format

The extension fully supports mixed-format plugins:

- **Cursor-relative completions** — IntelliSense adapts to whichever SkillGroup your cursor is in. Inside the KQL block you get `Target`, `Template`; inside GPT you get `ModelName`.
- **Cursor-relative hover** — hover documentation shows the correct field description for the format at your cursor position.
- **Cross-format validation** — the extension validates each SkillGroup independently and checks for issues across all formats in the file.

---

## Part 6 — Create a Promptbook

Promptbooks are **Markdown** files that define multi-step investigation workflows in Security Copilot.

### Option A: Use the Wizard

Open the Command Palette and run:

```
Security Copilot: New Promptbook
```

The wizard asks for:
1. **Title** — e.g., `Suspicious Sign-In Investigation`
2. **Description** — what the promptbook does
3. **Required plugins** — comma-separated (e.g., `Microsoft Defender XDR, Microsoft Entra`)
4. **Input variable** — the starting data point (e.g., `user_email`)
5. **Number of steps** — how many investigation steps to include

It generates a complete promptbook markdown file in a `promptbooks/` folder.

### Option B: Use `sc-` Snippets

1. Create a new file: `my-investigation.md`
2. Type `sc-promptbook` + **Tab**

This inserts a full promptbook template:

```markdown
# Promptbook Title

**Required plugins**: *Microsoft Defender XDR*

**Required Input**: `<input_variable>`

**Description**: Describe the investigation workflow.

---

1. **Gather initial context**

   ```
   Provide an overview of <input_variable> including recent activity and risk indicators.
   ```

2. **Deep investigation**

   ```
   Based on the previous findings, investigate any anomalous behavior associated with <input_variable>.
   ```

3. **Generate report**

   ```
   Compile a comprehensive investigation report including summary, findings, and recommendations.
   ```
```

### Add More Steps

Type `sc-pb-step` to add a standard natural-language step, or `sc-pb-skill-step` to add a step that directly invokes a Security Copilot skill:

```markdown
4. **Check threat intelligence**

   ```
   /GetThreatIntelligence Look up any known threat indicators associated with the IP addresses found above.
   ```
```

The `/SkillName` syntax tells Security Copilot to invoke a specific plugin skill instead of using natural-language routing.

---

## Part 7 — Using `sc-` Snippets Reference

Here is the complete list of `sc-` snippet prefixes available. Type any of these in the appropriate file type and press **Tab**.

### YAML Snippets (for plugin manifests)

| Prefix | What it creates |
|--------|----------------|
| `sc-api-plugin` | Complete API plugin manifest with Descriptor, SkillGroups, OpenAPI settings |
| `sc-gpt-plugin` | Complete GPT plugin manifest with a skill, input, model, and template |
| `sc-kql-plugin` | Complete KQL plugin manifest targeting Defender |
| `sc-kql-sentinel` | Complete KQL plugin with Sentinel workspace settings (TenantId, SubscriptionId, etc.) |
| `sc-logicapp-plugin` | Complete LogicApp plugin manifest with workflow settings |
| `sc-mcp-plugin` | Complete MCP plugin manifest with endpoint and AllowedTools |
| `sc-agent` | Complete standard Agent manifest with AgentDefinitions and KQL child skill |
| `sc-agent-interactive` | Complete interactive Agent with chat experience, SuggestedPrompts |
| `sc-skill-gpt` | Add a GPT skill block (Name, Description, Inputs, ModelName, Template) |
| `sc-skill-kql` | Add a KQL skill block (Name, Description, Inputs, Target, Template) |
| `sc-skill-logicapp` | Add a LogicApp skill with workflow settings |
| `sc-skill-mcp` | Add an MCP skill group with Endpoint and AllowedTools |
| `sc-skill-agent` | Add an Agent orchestration skill with Instructions and ChildSkills |
| `sc-input` | Add an input parameter (Name, Description, DefaultValue, Required) |
| `sc-setting` | Add a user-configurable setting (Name, Label, Description, HintText, SettingType) |
| `sc-auth-apikey` | Add API Key authorization block |
| `sc-auth-oauth` | Add OAuth authorization block (ClientId, endpoints, scopes) |
| `sc-auth-entra` | Add Entra ID (AAD) authorization block |
| `sc-auth-aad-delegated` | Add Entra ID delegated (user + application) authorization |
| `sc-auth-oauth-clientcreds` | Add OAuth 2.0 Client Credentials authorization |

### Markdown Snippets (for promptbooks)

| Prefix | What it creates |
|--------|----------------|
| `sc-promptbook` | Full 3-step promptbook with header, required plugins, input variable |
| `sc-pb-step` | A single numbered investigation step |
| `sc-pb-skill-step` | A step with `/SkillName` direct invocation |
| `sc-pb-header` | Just the promptbook header (title, plugins, input, description) |

### How Snippets Work

1. **Type the prefix** (e.g., `sc-kql-plugin`) in a YAML or Markdown file
2. **Select from IntelliSense** or press **Tab** to expand
3. **Fill in placeholders** — the cursor lands on the first placeholder (highlighted)
4. **Press Tab** to jump to the next placeholder
5. **Press Escape** when done

For fields with choices (like `Format`, `Target`, or `ModelName`), a dropdown appears showing the valid options — just arrow-key and press Enter.

---

## Part 8 — Validation & Best Practices

As soon as you start editing a plugin manifest, the extension validates your YAML in real time.

### See Diagnostics

Open the **Problems** panel (`Ctrl+Shift+M`) to see all issues. They are categorized:

- **Errors** (red) — must fix before uploading
- **Warnings** (yellow) — likely issues
- **Info** (blue) — optimization suggestions

### Run On-Demand Validation

Open the Command Palette and run:

```
Security Copilot: Validate Plugin Manifest
```

This gives you a quick summary: `✅ Plugin manifest looks good!` or a count of errors/warnings/suggestions.

### Hover for Documentation

Hover your mouse over any YAML key (e.g., `DescriptionForModel`, `ExamplePrompts`, `Target`) to see:

- What the field does
- Whether it's required
- Valid values
- Example values

### Common Validation Messages

| Code | What to do |
|------|-----------|
| SEC001 | Add a `Descriptor:` section at the top level |
| SEC002 | Add a `SkillGroups:` section |
| SEC003 | Add `Name` inside `Descriptor` |
| SEC004 | Add `Description` inside `Descriptor` |
| SEC005 | Your `Format` value is invalid — use `API`, `GPT`, `KQL`, `LogicApp`, `MCP`, or `Agent` |
| SEC009 | A `{{variable}}` in your template doesn't match any declared Input or Setting |
| BP002 | Add `DescriptionForModel` — this helps the AI pick your skill more accurately |
| BP003 | Add `ExamplePrompts` — natural language examples that trigger your skill |
| BP010 | Remove spaces from `Descriptor.Name` — use PascalCase |
| BP022 | KQL query missing time filter — add `ago()`, `between()`, or `datetime()` |
| BP029 | Trailing pipe at end of KQL query — remove the dangling `\|` |
| BP030 | KQL `let` statement missing semicolon (`;`) |
| BP031 | Invalid time unit in `ago()` — use `7d` not `7days` |
| BP036 | Misspelled KQL operator — e.g., `sumarize` → `summarize` |

### Best Practice Tips

1. **Always add `ExamplePrompts`** — these are how Security Copilot matches user questions to your skills
2. **Write a good `DescriptionForModel`** — this is prompt-level guidance for the AI orchestrator
3. **Don't put real IPs or emails in ExamplePrompts** — it hurts skill selection accuracy
4. **Use `DisplayName`** — it makes your plugin look polished in the UI
5. **For Sentinel plugins**, always include the four workspace settings (TenantId, SubscriptionId, ResourceGroupName, WorkspaceName) — use `sc-kql-sentinel` to get them automatically
6. **Use `|-` for multi-line KQL templates** — inline templates without block scalar indicators cause YAML parsing issues
7. **Cap your KQL results** — always use `| take N` or `| top N by ...` to prevent excessive data transfer
8. **Use correct time columns** — Defender uses `Timestamp`, Sentinel uses `TimeGenerated`
9. **Don't put real credentials in manifests** — use `<YOUR-TENANT-ID>` placeholders for TenantId, SubscriptionId, and ClientId

---

## Part 9 — KQL Template Validation in Action

The extension performs **line-specific analysis** of KQL templates, catching errors that would only show up at runtime in Security Copilot. Here's a walkthrough of what the validator catches.

### Example: A KQL Plugin with Common Mistakes

Create this intentionally flawed plugin to see the validator in action:

```yaml
Descriptor:
  Name: BadKqlExample
  Description: Demonstrates KQL validation rules

SkillGroups:
  - Format: KQL
    Skills:
      - Name: FaultyQuery
        Description: A query with several common mistakes
        Settings:
          Target: Defender
          Template: |-
            let lookback = ago(7days)
            DeviceProcessEvents
            | where TimeGenerated > lookback
            | where ProcessFileName = "cmd.exe"
            | sumarize count(), DeviceName
            | top 10 by count_ |
```

Open the **Problems** panel (`Ctrl+Shift+M`). You'll see these diagnostics at the exact lines:

| Code | Line | Issue |
|------|------|-------|
| **BP030** | `let lookback...` | `let` statement missing semicolon — add `;` at the end |
| **BP031** | `ago(7days)` | Invalid time unit — use `ago(7d)` not `ago(7days)` |
| **BP034** | `TimeGenerated` | Wrong time column for Defender — use `Timestamp` instead |
| **BP035** | `= "cmd.exe"` | Single `=` in where clause — use `==` for equality |
| **BP036** | `sumarize` | Misspelled operator — should be `summarize` |
| **BP037** | `count(), DeviceName` | `summarize` mixes aggregation with bare column but no `by` clause |
| **BP029** | trailing `\|` | Query ends with a dangling pipe — remove it |

### The Corrected Version

```yaml
          Template: |-
            let lookback = ago(7d);
            DeviceProcessEvents
            | where Timestamp > lookback
            | where ProcessFileName == "cmd.exe"
            | summarize count() by DeviceName
            | top 10 by count_
```

All diagnostics clear instantly as you fix each issue.

### Additional KQL Checks

The validator also catches:

| Code | What it detects |
|------|----------------|
| **BP032** | SQL syntax (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) accidentally used in KQL |
| **BP033** | Management commands (`.set`, `.drop`, `.create`, `.alter`) — these are prohibited in Security Copilot |
| **BP038** | Invalid `join kind=` values — only `inner`, `leftouter`, `rightouter`, `fullouter`, `leftanti`, `rightanti`, `leftsemi`, `rightsemi` are valid |

### Document-Level KQL Checks

Beyond line-specific analysis, the extension also checks:

| Code | What it detects |
|------|----------------|
| **BP022** | No time filter anywhere in the query (`ago`, `between`, `datetime`, `now`) |
| **BP023** | No result cap (`take`, `top`, `limit`) — risks returning excessive data |
| **BP024** | Multi-line query not using `\|-` block scalar indicator |
| **BP025** | Both `Template` and `TemplateUrl` specified (or neither) |

---

## Next Steps

- Browse the [Security Copilot plugin documentation](https://learn.microsoft.com/en-us/copilot/security/plugin-overview)
- See real-world examples in the [Community Plugins](https://github.com/Azure/Copilot-For-Security/tree/main/Plugins) repo
- Check out [Promptbook samples](https://github.com/Azure/Copilot-For-Security/tree/main/Promptbook%20samples) for investigation workflows
- Upload your plugin to Security Copilot: **Settings → Custom plugins → Add plugin → Upload file**
