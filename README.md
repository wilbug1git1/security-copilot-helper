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
  <img src="https://img.shields.io/badge/plugins-API%20%7C%20GPT%20%7C%20KQL-success?style=flat-square" alt="Plugin Types">
</p>

---

## Overview

**Security Copilot Plugin Helper** is a VS Code extension that gives you real-time validation, IntelliSense, snippets, hover documentation, and a guided scaffolding wizard for building Microsoft Security Copilot custom plugins and promptbooks.

It knows the full plugin manifest schema for all three plugin types — **API**, **GPT**, and **KQL** — and applies **12 best-practice rules** as you type.

---

## Features

### Scaffolding Wizard

> **Command Palette** → `Security Copilot: Scaffold New Plugin (Guided Wizard)`

A 5-step guided flow that creates a complete, ready-to-upload plugin project:

1. **Choose format** — API, GPT, or KQL
2. **Name your plugin** — validates PascalCase naming
3. **Describe it** — set display name and description
4. **Pick auth type** — None, API Key, OAuth, or Entra ID (AAD)
5. **Format-specific options** — API endpoint URL, GPT model, KQL target & workspace

Creates a folder with:
- `manifest.yaml` — fully populated plugin manifest
- `README.md` — plugin documentation template
- `openapi.yaml` / `template.txt` / `query.kql` — companion file for the chosen format

A matching promptbook wizard is also available via `Security Copilot: New Promptbook`.

---

### Real-time Diagnostics

The extension validates your plugin manifest as you type and surfaces issues in the **Problems** panel.

| Category | What it checks |
|--|--|
| **Structural** | Required fields: `Descriptor`, `SkillGroups`, `Name`, `Description`, `Format` |
| **Value validation** | Enum values for `Format`, `Target`, `ModelName`, `SupportedAuthTypes` |
| **Template variables** | `{{variable}}` references match declared `Inputs` or `Settings` |
| **Best practices** | 12 rules (see table below) covering common mistakes and optimization tips |

---

### IntelliSense & Completions

- **Field suggestions** adapt to your cursor position and plugin type
- **Value completions** for enum fields (`Format`, `Target`, `ModelName`, auth types, etc.)
- Works at every nesting level — `Descriptor`, `SkillGroups`, `Skills`, `Inputs`, `Settings`, `Authorization`

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
| `sc-skill-gpt` | Add a GPT skill |
| `sc-skill-kql` | Add a KQL skill |
| `sc-input` | Add an input parameter |
| `sc-setting` | Add a user-configurable setting |
| `sc-auth-apikey` | API Key authorization block |
| `sc-auth-oauth` | OAuth authorization block |
| `sc-auth-entra` | Entra ID (AAD) authorization block |

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
| **Scaffold New Plugin (Guided Wizard)** | Full 5-step plugin creation wizard |
| **Validate Plugin Manifest** | Run on-demand validation on the current file |
| **New API Plugin** | Quick-create an API plugin project |
| **New GPT Plugin** | Quick-create a GPT plugin project |
| **New KQL Plugin** | Quick-create a KQL plugin project |
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

---

## Plugin Types at a Glance

| Type | Use case | Companion file |
|--|--|--|
| **API** | Wrap an existing REST API via OpenAPI spec | `openapi.yaml` |
| **GPT** | Analyze text with LLM prompt templates | `template.txt` |
| **KQL** | Query Defender, Sentinel, Log Analytics, or Kusto | `query.kql` |

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

- [Security Copilot Plugin Documentation](https://learn.microsoft.com/security-copilot/extend/)
- [Create API Plugins](https://learn.microsoft.com/security-copilot/extend/create-api-plugin)
- [Create GPT Plugins](https://learn.microsoft.com/security-copilot/extend/create-gpt-plugin)
- [Create KQL Plugins](https://learn.microsoft.com/security-copilot/extend/create-kql-plugin)
- [Promptbook Samples on GitHub](https://github.com/Azure/Copilot-For-Security/tree/main/Promptbook%20samples)
- [Security Copilot Community Plugins](https://github.com/Azure/Copilot-For-Security/tree/main/Plugins)

---

## License

[MIT](LICENSE)
