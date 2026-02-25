# Changelog

All notable changes to the **Security Copilot Plugin Helper** extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-02-24

### Added

#### Scaffolding Wizard
- **Guided 5-step plugin wizard** — create complete plugin projects from the Command Palette
  - Supports all six plugin types: API, GPT, KQL, LogicApp, MCP, and Agent
  - Generates manifest YAML, README, and format-specific companion files
  - KQL: auto-generates correct workspace settings for Sentinel / LogAnalytics / Kusto targets
  - API: generates a sample OpenAPI spec with `#ExamplePrompts`
  - GPT: generates sample prompt template file and two pre-built skills (Analyze + Summarize)
  - LogicApp: prompts for Azure Subscription, Resource Group, Workflow, and Trigger
  - MCP: prompts for MCP endpoint URL
  - Agent: prompts for agent type (Standard / Interactive) and model
    - Standard agents: generates `AgentDefinitions` with triggers, `ProcessSkill`, and KQL child skill
    - Interactive agents: generates chat experience with `PromptSkill`, `SuggestedPrompts`, `UserRequest` input, and `OrchestratorSkill`
- **Promptbook scaffolding** — guided flow creates a 4-step investigation promptbook

#### Real-time Diagnostics
- **28 best-practice rules** (BP001–BP038) for plugin manifests:
  - BP001–BP012: Core rules for API, GPT, and KQL plugins
  - BP013–BP014, BP021: MCP-specific (Endpoint, AllowedTools, DescriptionForModel)
  - BP015: LogicApp-specific (SubscriptionId, ResourceGroup, WorkflowName, TriggerName)
  - BP016–BP020: Agent-specific (AgentDefinitions, Instructions, ChildSkills, RequiredSkillsets, interactive agent requirements)
  - BP022–BP025: KQL validation (time filter, result cap, block scalar, Template/TemplateUrl exclusivity)
  - BP026–BP028: General (credential detection, skill name validation, descriptor name forbidden chars)
  - BP029–BP038: **Line-specific KQL template analysis** — trailing pipe, let semicolons, invalid ago() units, SQL syntax, management commands, wrong time column, single = in where, misspelled operators, summarize without by, invalid join kind
- **Structural validation** — missing `Descriptor`, `SkillGroups` / `AgentDefinitions`, `Name`, `Description`, `Format`
- **Value validation** — `Format` (6 types), `Target`, `ModelName`/`Model`, `SupportedAuthTypes` (7 types including AADDelegated, OAuth variants, ServiceHttp)
- **Template variable checking** — warns on `{{variable}}` with no matching `Inputs` or `Settings`
- **Mixed-format support** — validates all formats present in mixed-format plugins
- **Agent-aware** — recognizes `AgentDefinitions` as alternative to `SkillGroups`; validates `Model:` in Agent skills (not just GPT’s `ModelName:`)

#### IntelliSense
- Context-aware YAML field completions (adapts to API / GPT / KQL / LogicApp / MCP / Agent)
- **Cursor-relative format detection** — completions adapt to each SkillGroup in mixed-format plugins
- Value completions for enumerations (`Format`, `Target`, `ModelName`, `Model`, auth types, `Interfaces`, `AgentSingleInstanceConstraint`)
- Completions for `AgentDefinitions`, `Triggers`, and `SuggestedPrompts` contexts

#### Hover Documentation
- Hover any manifest field to see description, required status, valid values, and examples
- Covers all six plugin types and nested fields (Authorization, Settings, Skills, Inputs, AgentDefinitions, Triggers, SuggestedPrompts)
- **Cursor-relative** — hover shows documentation for the correct format in mixed-format plugins

#### Snippets — YAML (20)
- `sc-api-plugin`, `sc-gpt-plugin`, `sc-kql-plugin`, `sc-kql-sentinel`
- `sc-logicapp-plugin`, `sc-mcp-plugin`, `sc-agent`, `sc-agent-interactive`
- `sc-skill-gpt`, `sc-skill-kql`, `sc-skill-logicapp`, `sc-skill-mcp`, `sc-skill-agent`
- `sc-input`, `sc-setting`
- `sc-auth-apikey`, `sc-auth-oauth`, `sc-auth-entra`, `sc-auth-aad-delegated`, `sc-auth-oauth-clientcreds`

#### Snippets — Markdown Promptbooks (4)
- `sc-promptbook`, `sc-pb-step`, `sc-pb-skill-step`, `sc-pb-header`

#### Commands
- `Security Copilot: Scaffold New Plugin (Guided Wizard)`
- `Security Copilot: Validate Plugin Manifest`
- `Security Copilot: New API Plugin`
- `Security Copilot: New GPT Plugin`
- `Security Copilot: New KQL Plugin`
- `Security Copilot: New LogicApp Plugin`
- `Security Copilot: New MCP Plugin`
- `Security Copilot: New Agent`
- `Security Copilot: New Promptbook`

#### Other
- Status bar indicator when editing a Security Copilot plugin manifest
- Extension settings to toggle diagnostics and completions
- Plugin detection recognizes both `SkillGroups:` and `AgentDefinitions:` as valid top-level keys
- `detectAllPluginFormats()` and `detectFormatAtLine()` utilities for mixed-format awareness
