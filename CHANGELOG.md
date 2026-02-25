# Changelog

All notable changes to the **Security Copilot Plugin Helper** extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-02-24

### Added

#### Scaffolding Wizard
- **Guided 5-step plugin wizard** — create complete plugin projects from the Command Palette
  - Supports all three plugin types: API, GPT, and KQL
  - Generates manifest YAML, README, and format-specific companion files
  - KQL: auto-generates correct workspace settings for Sentinel / LogAnalytics / Kusto targets
  - API: generates a sample OpenAPI spec with `#ExamplePrompts`
  - GPT: generates sample prompt template file and two pre-built skills (Analyze + Summarize)
- **Promptbook scaffolding** — guided flow creates a 4-step investigation promptbook

#### Real-time Diagnostics
- **12 best-practice rules** (BP001–BP012) for plugin manifests
- **Structural validation** — missing `Descriptor`, `SkillGroups`, `Name`, `Description`, `Format`
- **Value validation** — `Format`, `Target`, `ModelName`, `SupportedAuthTypes`
- **Template variable checking** — warns on `{{variable}}` with no matching `Inputs` or `Settings`

#### IntelliSense
- Context-aware YAML field completions (adapts to API / GPT / KQL)
- Value completions for enumerations (`Format`, `Target`, `ModelName`, auth types)

#### Hover Documentation
- Hover any manifest field to see description, required status, valid values, and examples
- Covers all plugin types and nested fields (Authorization, Settings, Skills, Inputs)

#### Snippets — YAML (11)
- `sc-api-plugin`, `sc-gpt-plugin`, `sc-kql-plugin`, `sc-kql-sentinel`
- `sc-skill-gpt`, `sc-skill-kql`, `sc-input`, `sc-setting`
- `sc-auth-apikey`, `sc-auth-oauth`, `sc-auth-entra`

#### Snippets — Markdown Promptbooks (4)
- `sc-promptbook`, `sc-pb-step`, `sc-pb-skill-step`, `sc-pb-header`

#### Commands
- `Security Copilot: Scaffold New Plugin (Guided Wizard)`
- `Security Copilot: Validate Plugin Manifest`
- `Security Copilot: New API Plugin`
- `Security Copilot: New GPT Plugin`
- `Security Copilot: New KQL Plugin`
- `Security Copilot: New Promptbook`

#### Other
- Status bar indicator when editing a Security Copilot plugin manifest
- Extension settings to toggle diagnostics and completions
