# Tutorial: Building Security Copilot Plugins & Promptbooks

This step-by-step tutorial walks you through creating a custom Security Copilot plugin and a promptbook using the **Security Copilot Plugin Helper** VS Code extension.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Part 1 — Create a Plugin with the Scaffold Wizard](#part-1--create-a-plugin-with-the-scaffold-wizard)
- [Part 2 — Build a Plugin Manually with `sc-` Snippets](#part-2--build-a-plugin-manually-with-sc--snippets)
- [Part 3 — Create a Promptbook](#part-3--create-a-promptbook)
- [Part 4 — Using `sc-` Snippets Reference](#part-4--using-sc--snippets-reference)
- [Part 5 — Validation & Best Practices](#part-5--validation--best-practices)
- [Next Steps](#next-steps)

---

## Prerequisites

1. **VS Code** with the Security Copilot Plugin Helper extension installed
2. A workspace folder open in VS Code (this is where your plugin files will be created)

---

## Part 1 — Create a Plugin with the Scaffold Wizard

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

### Step 2: Choose Your Plugin Format

The wizard presents three options:

| Format | Best for |
|--------|----------|
| **API** | Wrapping an existing REST API via OpenAPI spec |
| **GPT** | Text analysis, summarization, and data transformation using LLM prompts |
| **KQL** | Querying Microsoft Defender, Sentinel, Log Analytics, or Azure Data Explorer |

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
- **AAD** — Microsoft Entra ID (Azure AD)
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

## Part 2 — Build a Plugin Manually with `sc-` Snippets

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

## Part 3 — Create a Promptbook

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

## Part 4 — Using `sc-` Snippets Reference

Here is the complete list of `sc-` snippet prefixes available. Type any of these in the appropriate file type and press **Tab**.

### YAML Snippets (for plugin manifests)

| Prefix | What it creates |
|--------|----------------|
| `sc-api-plugin` | Complete API plugin manifest with Descriptor, SkillGroups, OpenAPI settings |
| `sc-gpt-plugin` | Complete GPT plugin manifest with a skill, input, model, and template |
| `sc-kql-plugin` | Complete KQL plugin manifest targeting Defender |
| `sc-kql-sentinel` | Complete KQL plugin with Sentinel workspace settings (TenantId, SubscriptionId, etc.) |
| `sc-skill-gpt` | Add a GPT skill block (Name, Description, Inputs, ModelName, Template) |
| `sc-skill-kql` | Add a KQL skill block (Name, Description, Inputs, Target, Template) |
| `sc-input` | Add an input parameter (Name, Description, DefaultValue, Required) |
| `sc-setting` | Add a user-configurable setting (Name, Label, Description, HintText, SettingType) |
| `sc-auth-apikey` | Add API Key authorization block |
| `sc-auth-oauth` | Add OAuth authorization block (ClientId, endpoints, scopes) |
| `sc-auth-entra` | Add Entra ID (AAD) authorization block |

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

## Part 5 — Validation & Best Practices

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
| SEC005 | Your `Format` value is invalid — use `API`, `GPT`, or `KQL` |
| SEC009 | A `{{variable}}` in your template doesn't match any declared Input or Setting |
| BP002 | Add `DescriptionForModel` — this helps the AI pick your skill more accurately |
| BP003 | Add `ExamplePrompts` — natural language examples that trigger your skill |
| BP010 | Remove spaces from `Descriptor.Name` — use PascalCase |

### Best Practice Tips

1. **Always add `ExamplePrompts`** — these are how Security Copilot matches user questions to your skills
2. **Write a good `DescriptionForModel`** — this is prompt-level guidance for the AI orchestrator
3. **Don't put real IPs or emails in ExamplePrompts** — it hurts skill selection accuracy
4. **Use `DisplayName`** — it makes your plugin look polished in the UI
5. **For Sentinel plugins**, always include the four workspace settings (TenantId, SubscriptionId, ResourceGroupName, WorkspaceName) — use `sc-kql-sentinel` to get them automatically

---

## Next Steps

- Browse the [Security Copilot plugin documentation](https://learn.microsoft.com/security-copilot/extend/)
- See real-world examples in the [Community Plugins](https://github.com/Azure/Copilot-For-Security/tree/main/Plugins) repo
- Check out [Promptbook samples](https://github.com/Azure/Copilot-For-Security/tree/main/Promptbook%20samples) for investigation workflows
- Upload your plugin to Security Copilot: **Settings → Custom plugins → Add plugin → Upload file**
