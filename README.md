<p align="center">
  <img src="media/icon.png" alt="Security Copilot Plugin Helper" width="128" height="128">
</p>

<h1 align="center">Security Copilot Plugin Helper</h1>

<p align="center">
  <strong>Build Microsoft Security Copilot custom plugins and promptbooks — faster.</strong>
</p>

<p align="center">
  <a href="https://learn.microsoft.com/security-copilot/extend/">
    <img src="https://img.shields.io/badge/Security%20Copilot-Plugin%20Docs-0078D4?style=flat-square&logo=microsoft" alt="Docs">
  </a>
  <img src="https://img.shields.io/badge/version-0.1.0-blue?style=flat-square" alt="Version">
  <img src="https://img.shields.io/badge/plugins-API%20%7C%20GPT%20%7C%20KQL%20%7C%20LogicApp%20%7C%20MCP%20%7C%20Agent-success?style=flat-square" alt="Plugin Types">
</p>

---

## Overview

**Security Copilot Plugin Helper** is a VS Code extension that gives you real-time validation, IntelliSense, snippets, hover documentation, and a guided scaffolding wizard for building Microsoft Security Copilot custom plugins and promptbooks.

It knows the full plugin manifest schema for all six plugin types — **API**, **GPT**, **KQL**, **LogicApp**, **MCP**, and **Agent** — and applies **28 best-practice rules** (including 10 line-specific KQL template validations) as you type. It also supports **mixed-format plugins** (multiple formats in one file) and **agent definitions** with triggers, interactive prompts, and orchestration skills.

---

## Features

### Scaffolding Wizard

> **Command Palette** → `Security Copilot: Scaffold New Plugin (Guided Wizard)`

A 5-step guided flow that creates a complete, ready-to-upload plugin project:

1. **Choose format** — API, GPT, KQL, LogicApp, MCP, or Agent
2. **Name your plugin** — validates PascalCase naming
3. **Describe it** — set display name and description
4. **Pick auth type** — None, API Key, OAuth (auth-code or client-credentials), Entra ID (AAD or delegated), or Basic
5. **Format-specific options** — API endpoint URL, GPT model, KQL target & workspace, LogicApp subscription/RG/workflow, MCP endpoint, or Agent type (Standard / Interactive) & model

Creates a folder with:
- `manifest.yaml` — fully populated plugin manifest (with `AgentDefinitions` for Agent format)
- `README.md` — plugin documentation template
- `openapi.yaml` / `template.txt` / `query.kql` — companion file for applicable formats

A matching promptbook wizard is also available via `Security Copilot: New Promptbook`.

---

### Real-time Diagnostics

The extension validates your plugin manifest as you type and surfaces issues in the **Problems** panel.

| Category | What it checks |
|--|--|
| **Structural** | Required fields: `Descriptor`, `SkillGroups` / `AgentDefinitions`, `Name`, `Description`, `Format` |
| **Value validation** | Enum values for `Format`, `Target`, `ModelName`/`Model`, `SupportedAuthTypes` |
| **Template variables** | `{{variable}}` references match declared `Inputs` or `Settings` |
| **Best practices** | 28 rules (see table below) covering common mistakes and optimization tips for all 6 formats |
| **KQL template analysis** | Line-specific detection of trailing pipes, missing semicolons, invalid `ago()` units, SQL syntax, misspelled operators, wrong time columns, and more |

---

### IntelliSense & Completions

- **Field suggestions** adapt to your cursor position and plugin type — including **cursor-relative format detection** for mixed-format plugins
- **Value completions** for enum fields (`Format`, `Target`, `ModelName`, `Model`, auth types, `Interfaces`, `AgentSingleInstanceConstraint`, etc.)
- Works at every nesting level — `Descriptor`, `SkillGroups`, `Skills`, `Inputs`, `Settings`, `Authorization`, `AgentDefinitions`, `Triggers`, `SuggestedPrompts`

---

### Hover Documentation

Hover over any YAML key to see:

- Field description
- Whether it's required or optional
- Valid values (for enums)
- Example values
- Child fields (for objects)

---

### Snippets

Type these prefixes in any YAML or Markdown file:

#### YAML — Plugin Manifests

| Prefix | Description |
|--|--|
| `sc-api-plugin` | Full API plugin manifest |
| `sc-gpt-plugin` | Full GPT plugin manifest |
| `sc-kql-plugin` | Full KQL plugin manifest (Defender) |
| `sc-kql-sentinel` | Full KQL plugin manifest (Sentinel with workspace) |
| `sc-logicapp-plugin` | Full LogicApp plugin manifest |
| `sc-mcp-plugin` | Full MCP plugin manifest |
| `sc-agent` | Full standard Agent manifest with AgentDefinitions |
| `sc-agent-interactive` | Full interactive Agent manifest with chat experience |
| `sc-skill-gpt` | Add a GPT skill |
| `sc-skill-kql` | Add a KQL skill |
| `sc-skill-logicapp` | Add a LogicApp skill |
| `sc-skill-mcp` | Add an MCP skill group |
| `sc-skill-agent` | Add an Agent orchestration skill |
| `sc-input` | Add an input parameter |
| `sc-setting` | Add a user-configurable setting |
| `sc-auth-apikey` | API Key authorization block |
| `sc-auth-oauth` | OAuth authorization block |
| `sc-auth-entra` | Entra ID (AAD) authorization block |
| `sc-auth-aad-delegated` | Entra ID delegated (user + application) authorization |
| `sc-auth-oauth-clientcreds` | OAuth 2.0 Client Credentials authorization |

#### Markdown — Promptbooks

| Prefix | Description |
|--|--|
| `sc-promptbook` | Full promptbook template |
| `sc-pb-step` | Add a promptbook step |
| `sc-pb-skill-step` | Step with direct skill invocation (`/SkillName`) |
| `sc-pb-header` | Promptbook metadata header |

---

### Commands

Open the **Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`) and type `Security Copilot`:

| Command | Description |
|--|--|
| **Scaffold New Plugin (Guided Wizard)** | Full 5-step plugin creation wizard (all 6 formats) |
| **Validate Plugin Manifest** | Run on-demand validation on the current file |
| **New API Plugin** | Quick-create an API plugin project |
| **New GPT Plugin** | Quick-create a GPT plugin project |
| **New KQL Plugin** | Quick-create a KQL plugin project |
| **New LogicApp Plugin** | Quick-create a LogicApp plugin project |
| **New MCP Plugin** | Quick-create an MCP plugin project |
| **New Agent** | Quick-create an Agent (Standard or Interactive) |
| **New Promptbook** | Create a new promptbook markdown file |

---

## Best Practices Enforced

| Code | Severity | Rule |
|--|--|--|
| BP001 | Warning | ExamplePrompts should not contain specific IPs or emails |
| BP002 | Info | Add `DescriptionForModel` for better orchestrator guidance |
| BP003 | Info | Add `ExamplePrompts` to improve skill matching |
| BP004 | Warning | Sentinel / LogAnalytics targets require workspace settings |
| BP005 | Warning | Kusto targets require Cluster and Database settings |
| BP006 | Error | GPT skills need exactly one of Template / TemplateUrl / TemplateFile |
| BP007 | Warning | GPT skills require a `ModelName` |
| BP008 | Warning | API plugins require `OpenApiSpecUrl` |
| BP009 | Info | Add `DisplayName` for better UI experience |
| BP010 | Info | `Descriptor.Name` should not contain spaces |
| BP011 | Info | Settings that accept secrets should have `SupportedAuthTypes` |
| BP012 | Warning | KQL skills require a `Target` |
| BP013 | Warning | MCP plugins require `Endpoint` in SkillGroup Settings |
| BP014 | Info | MCP plugins should specify `AllowedTools` |
| BP015 | Warning | LogicApp skills require `SubscriptionId`, `ResourceGroup`, `WorkflowName`, `TriggerName` |
| BP016 | Warning | Agent skills require `AgentDefinitions` at top level |
| BP017 | Warning | Agent skills require `Instructions` in Settings |
| BP018 | Warning | Agent skills require `ChildSkills` |
| BP019 | Warning | Agent `RequiredSkillsets` should include the Descriptor Name |
| BP020 | Warning | Interactive agents need `InteractiveAgent` interface, `UserRequest` input, `PromptSkill`, `OrchestratorSkill` |
| BP021 | Info | MCP plugins benefit from detailed `DescriptionForModel` |
| BP022 | Warning | KQL query missing time filter (`ago`, `between`, `datetime`) |
| BP023 | Warning | KQL query missing result set cap (`take`, `top`, `limit`) |
| BP024 | Warning | Multi-line KQL Template should use `\|-` block scalar |
| BP025 | Error | KQL skills need exactly one of Template / TemplateUrl |
| BP026 | Warning | Possible real credentials detected (GUID in TenantId/SubscriptionId/ClientId) |
| BP027 | Warning | Skill Name should not contain spaces or dots |
| BP028 | Warning | `Descriptor.Name` contains forbidden characters (`/\?#@`) |
| BP029 | Error | KQL query ends with trailing pipe (\|) — line-specific |
| BP030 | Error | KQL `let` statement missing semicolon — line-specific |
| BP031 | Error | Invalid time unit in `ago()` (e.g., `7days` → `7d`) — line-specific |
| BP032 | Error | SQL syntax (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) in KQL template — line-specific |
| BP033 | Error | KQL management commands (`.set`, `.drop`, `.create`, etc.) — line-specific |
| BP034 | Warning | Wrong time column for target (Defender→`Timestamp`, Sentinel→`TimeGenerated`) — line-specific |
| BP035 | Error | Single `=` instead of `==` or `=~` in KQL `where` clause — line-specific |
| BP036 | Error | Misspelled KQL operators (`sumarize`, `porject`, etc.) — line-specific |
| BP037 | Error | `summarize` mixes aggregation with bare columns but no `by` clause — line-specific |
| BP038 | Error | `join kind=X` with invalid join type — line-specific |

---

## Plugin Types at a Glance

| Type | Use case | Companion file |
|--|--|--|
| **API** | Wrap an existing REST API via OpenAPI spec | `openapi.yaml` |
| **GPT** | Analyze text with LLM prompt templates | `template.txt` |
| **KQL** | Query Defender, Sentinel, Log Analytics, or Kusto | `query.kql` |
| **LogicApp** | Trigger Azure Logic App workflows | — |
| **MCP** | Connect to MCP servers (Model Context Protocol) | — |
| **Agent** | Autonomous or interactive multi-step agents | — |

---

## Getting Started

### Install from VSIX (shared package)

```powershell
code --install-extension security-copilot-helper-0.1.0.vsix
```

### Build from source

```powershell
# Clone the repo and install dependencies
npm install

# Compile TypeScript
npm run compile

# Package as .vsix
npm run package

# Install the built extension
code --install-extension security-copilot-helper-0.1.0.vsix
```

Or use the included script:

```powershell
.\scripts\build-and-install.ps1
```

### Debug in VS Code

1. Open this folder in VS Code
2. Press **F5** to launch the Extension Development Host
3. Open or create a `.yaml` file and start typing `sc-`

---

## Extension Settings

| Setting | Default | Description |
|--|--|--|
| `securityCopilot.enableDiagnostics` | `true` | Enable real-time validation and best-practice warnings |
| `securityCopilot.enableCompletions` | `true` | Enable IntelliSense completions for YAML fields |

---

## Resources

- **[Tutorial: Building Plugins & Promptbooks](docs/tutorial.md)** — Step-by-step guide covering the scaffold wizard, `sc-` snippets, and validation
- [Security Copilot Plugin Documentation](https://learn.microsoft.com/en-us/copilot/security/plugin-overview)
- [Create API Plugins](https://learn.microsoft.com/security-copilot/extend/create-api-plugin)
- [Create GPT Plugins](https://learn.microsoft.com/security-copilot/extend/create-gpt-plugin)
- [Create KQL Plugins](https://learn.microsoft.com/security-copilot/extend/create-kql-plugin)
- [Promptbook Samples on GitHub](https://github.com/Azure/Copilot-For-Security/tree/main/Promptbook%20samples)
- [Security Copilot Community Plugins](https://github.com/Azure/Copilot-For-Security/tree/main/Plugins)

---

## License

[MIT](LICENSE)
