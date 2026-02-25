/**
 * Security Copilot plugin schema definitions.
 * Contains required/optional fields, valid values, and documentation for each field.
 */

export interface FieldDef {
    description: string;
    required: boolean;
    type: 'string' | 'array' | 'object' | 'boolean';
    validValues?: string[];
    children?: Record<string, FieldDef>;
    example?: string;
}

/** Descriptor-level fields */
export const DESCRIPTOR_FIELDS: Record<string, FieldDef> = {
    Name: {
        description: 'Unique internal identifier for the plugin. No spaces allowed.',
        required: true,
        type: 'string',
        example: 'MyPlugin'
    },
    DisplayName: {
        description: 'Human-readable name shown in the Security Copilot UI.',
        required: false,
        type: 'string',
        example: 'My Custom Plugin'
    },
    Description: {
        description: 'Description visible to users AND the LLM orchestrator. This helps the model select the right plugin.',
        required: true,
        type: 'string',
        example: 'A plugin that retrieves threat intelligence data'
    },
    DescriptionDisplay: {
        description: 'Alternate description shown only in the UI (not sent to the model).',
        required: false,
        type: 'string'
    },
    DescriptionForModel: {
        description: 'Detailed instructions only the LLM orchestrator sees. Use for complex guidance on when/how to invoke the plugin.',
        required: false,
        type: 'string'
    },
    Icon: {
        description: 'URL to a publicly accessible icon image for the plugin.',
        required: false,
        type: 'string',
        example: 'https://raw.githubusercontent.com/org/repo/main/icon.png'
    },
    Category: {
        description: 'Plugin category for organization in the UI.',
        required: false,
        type: 'string',
        example: 'Other'
    },
    Settings: {
        description: 'Array of user-configurable settings displayed at plugin install time.',
        required: false,
        type: 'array'
    },
    SupportedAuthTypes: {
        description: 'Authentication methods the plugin supports. Required when using Settings or Authorization.',
        required: false,
        type: 'array',
        validValues: ['ApiKey', 'Basic', 'AAD', 'AADDelegated', 'OAuthAuthorizationCodeFlow', 'OAuthClientCredentialsFlow', 'ServiceHttp', 'None']
    },
    Authorization: {
        description: 'Configuration for plugin authentication.',
        required: false,
        type: 'object',
        children: {
            Type: {
                description: 'The authentication type.',
                required: true,
                type: 'string',
                validValues: ['APIKey', 'Basic', 'AAD', 'AADDelegated', 'OAuthAuthorizationCodeFlow', 'OAuthClientCredentialsFlow']
            },
            Key: {
                description: 'The header or query parameter name for the API key.',
                required: false,
                type: 'string',
                example: 'x-api-key'
            },
            Location: {
                description: 'Where to send the API key.',
                required: false,
                type: 'string',
                validValues: ['Header', 'QueryString']
            },
            AuthScheme: {
                description: 'Authentication scheme prefix (e.g., "Bearer" for Bearer tokens). Use empty string for raw keys.',
                required: false,
                type: 'string',
                example: 'Bearer'
            },
            EntraScopes: {
                description: 'Entra ID (AAD) scope for token acquisition.',
                required: false,
                type: 'string',
                example: 'https://graph.microsoft.com/.default'
            },
            ClientId: {
                description: 'OAuth App Registration Client ID.',
                required: false,
                type: 'string'
            },
            AuthorizationEndpoint: {
                description: 'OAuth authorization URL.',
                required: false,
                type: 'string'
            },
            TokenEndpoint: {
                description: 'OAuth token endpoint URL.',
                required: false,
                type: 'string'
            },
            Scopes: {
                description: 'Space-separated OAuth scopes.',
                required: false,
                type: 'string'
            },
            AuthorizationContentType: {
                description: 'Content type for OAuth token requests.',
                required: false,
                type: 'string'
            }
        }
    }
};

/** Setting item fields */
export const SETTING_FIELDS: Record<string, FieldDef> = {
    Name: {
        description: 'Setting identifier, used as {{Name}} in templates.',
        required: true,
        type: 'string'
    },
    Label: {
        description: 'Display label for the setting in the UI.',
        required: false,
        type: 'string'
    },
    Description: {
        description: 'Description of what the setting is for.',
        required: true,
        type: 'string'
    },
    HintText: {
        description: 'Placeholder hint text shown in the input field.',
        required: false,
        type: 'string'
    },
    SettingType: {
        description: 'Data type of the setting.',
        required: false,
        type: 'string',
        validValues: ['String', 'string']
    },
    Required: {
        description: 'Whether the setting must be provided by the user.',
        required: false,
        type: 'boolean'
    }
};

/** SkillGroup fields */
export const SKILLGROUP_FIELDS: Record<string, FieldDef> = {
    Format: {
        description: 'The skill format type. Determines how skills are executed.',
        required: true,
        type: 'string',
        validValues: ['API', 'GPT', 'KQL', 'LogicApp', 'MCP', 'Agent']
    },
    Settings: {
        description: 'Format-specific settings for the skill group.',
        required: true,
        type: 'object'
    },
    Skills: {
        description: 'Array of individual skill definitions (required for GPT and KQL formats).',
        required: false,
        type: 'array'
    }
};

/** API SkillGroup Settings */
export const API_SKILLGROUP_SETTINGS: Record<string, FieldDef> = {
    OpenApiSpecUrl: {
        description: 'URL to the OpenAPI/Swagger specification file.',
        required: true,
        type: 'string',
        example: 'https://example.com/openapi.yaml'
    },
    EndpointUrlSettingName: {
        description: 'Maps to a Descriptor Setting for a user-configurable base URL.',
        required: false,
        type: 'string'
    }
};

/** GPT Skill fields */
export const GPT_SKILL_FIELDS: Record<string, FieldDef> = {
    Name: {
        description: 'Unique internal skill identifier.',
        required: true,
        type: 'string'
    },
    DisplayName: {
        description: 'Human-readable skill name.',
        required: false,
        type: 'string'
    },
    Description: {
        description: 'User-facing skill description. Also helps the orchestrator select this skill.',
        required: true,
        type: 'string'
    },
    DescriptionForModel: {
        description: 'Detailed instructions only the LLM orchestrator sees.',
        required: false,
        type: 'string'
    },
    ExamplePrompts: {
        description: 'Array of natural language prompts that should trigger this skill.',
        required: false,
        type: 'array'
    },
    Inputs: {
        description: 'Array of user-provided input variables. Each maps to {{variableName}} in the template.',
        required: false,
        type: 'array'
    },
    Settings: {
        description: 'GPT skill settings including ModelName and Template.',
        required: true,
        type: 'object',
        children: {
            ModelName: {
                description: 'The GPT model to use for this skill.',
                required: true,
                type: 'string',
                validValues: ['gpt-4o', 'gpt-4.1', 'gpt-4-32k-v0613', 'gpt-4']
            },
            Template: {
                description: 'Inline prompt template. Use {{variableName}} for input placeholders.',
                required: false,
                type: 'string'
            },
            TemplateUrl: {
                description: 'URL to an external prompt template file.',
                required: false,
                type: 'string'
            },
            TemplateFile: {
                description: 'Path to a template file within the PackageUrl zip archive.',
                required: false,
                type: 'string'
            }
        }
    }
};

/** KQL Skill fields */
export const KQL_SKILL_FIELDS: Record<string, FieldDef> = {
    Name: {
        description: 'Unique internal skill identifier.',
        required: true,
        type: 'string'
    },
    DisplayName: {
        description: 'Human-readable skill name.',
        required: false,
        type: 'string'
    },
    Description: {
        description: 'User-facing skill description. Also helps the orchestrator select this skill.',
        required: true,
        type: 'string'
    },
    DescriptionForModel: {
        description: 'Detailed instructions only the LLM orchestrator sees.',
        required: false,
        type: 'string'
    },
    ExamplePrompts: {
        description: 'Array of natural language prompts that should trigger this skill.',
        required: false,
        type: 'array'
    },
    Inputs: {
        description: 'Array of user-provided input variables mapped to {{variableName}} in KQL.',
        required: false,
        type: 'array'
    },
    Settings: {
        description: 'KQL skill settings including Target and Template.',
        required: true,
        type: 'object',
        children: {
            Target: {
                description: 'The KQL data source to query.',
                required: true,
                type: 'string',
                validValues: ['Defender', 'Sentinel', 'LogAnalytics', 'Kusto']
            },
            Template: {
                description: 'Inline KQL query template. Use {{variableName}} for input placeholders.',
                required: false,
                type: 'string'
            },
            TemplateUrl: {
                description: 'URL to an external KQL query file.',
                required: false,
                type: 'string'
            },
            TenantId: {
                description: 'Azure Tenant ID (required for Sentinel/LogAnalytics/Kusto targets).',
                required: false,
                type: 'string'
            },
            SubscriptionId: {
                description: 'Azure Subscription ID (required for Sentinel/LogAnalytics targets).',
                required: false,
                type: 'string'
            },
            ResourceGroupName: {
                description: 'Resource Group name (required for Sentinel/LogAnalytics targets).',
                required: false,
                type: 'string'
            },
            WorkspaceName: {
                description: 'Log Analytics Workspace name (required for Sentinel/LogAnalytics targets).',
                required: false,
                type: 'string'
            },
            Cluster: {
                description: 'Kusto (ADX) cluster URL (required for Kusto target).',
                required: false,
                type: 'string'
            },
            Database: {
                description: 'Kusto (ADX) database name (required for Kusto target).',
                required: false,
                type: 'string'
            }
        }
    }
};

/** LogicApp Skill fields */
export const LOGICAPP_SKILL_FIELDS: Record<string, FieldDef> = {
    Name: {
        description: 'Unique internal skill identifier.',
        required: true,
        type: 'string'
    },
    DisplayName: {
        description: 'Human-readable skill name.',
        required: false,
        type: 'string'
    },
    Description: {
        description: 'User-facing skill description.',
        required: true,
        type: 'string'
    },
    Inputs: {
        description: 'Array of input parameters passed in the request body to the Logic App.',
        required: false,
        type: 'array'
    },
    Settings: {
        description: 'LogicApp skill settings identifying the target Logic App.',
        required: true,
        type: 'object',
        children: {
            SubscriptionId: {
                description: 'Azure Subscription ID of the Logic App. Must be in the same tenant as the Security Copilot user.',
                required: true,
                type: 'string'
            },
            ResourceGroup: {
                description: 'Resource Group where the Logic App resides.',
                required: true,
                type: 'string'
            },
            WorkflowName: {
                description: 'Name of the Logic App resource.',
                required: true,
                type: 'string'
            },
            TriggerName: {
                description: 'Name of the trigger in the Logic App (typically "manual").',
                required: true,
                type: 'string',
                example: 'manual'
            }
        }
    }
};

/** MCP SkillGroup Settings */
export const MCP_SKILLGROUP_SETTINGS: Record<string, FieldDef> = {
    Endpoint: {
        description: 'MCP Server endpoint URL.',
        required: true,
        type: 'string',
        example: 'https://learn.microsoft.com/api/mcp'
    },
    TimeoutInSeconds: {
        description: 'Timeout in seconds for MCP calls.',
        required: false,
        type: 'string',
        example: '120'
    },
    AllowedTools: {
        description: 'Comma-separated list of allowed MCP tools. Recommended for security.',
        required: false,
        type: 'string',
        example: 'microsoft_docs_search, microsoft_docs_fetch'
    }
};

/** Agent Skill fields */
export const AGENT_SKILL_FIELDS: Record<string, FieldDef> = {
    Name: {
        description: 'Unique internal skill identifier for the agent. No spaces or dots.',
        required: true,
        type: 'string'
    },
    DisplayName: {
        description: 'Human-readable agent skill name.',
        required: false,
        type: 'string'
    },
    Description: {
        description: 'User-facing agent skill description.',
        required: true,
        type: 'string'
    },
    Interfaces: {
        description: 'Agent interface type. Use [Agent] for standard agents or [InteractiveAgent] for chat-based agents.',
        required: true,
        type: 'array',
        validValues: ['Agent', 'InteractiveAgent']
    },
    Inputs: {
        description: 'Input parameters. Interactive agents must have a single input named "UserRequest".',
        required: false,
        type: 'array'
    },
    Settings: {
        description: 'Agent skill settings including Instructions and Model.',
        required: true,
        type: 'object',
        children: {
            Instructions: {
                description: 'Natural language directions defining the agent\'s behavior, mission, and workflow. Use markdown sections: # Mission, # Workflow, # Output.',
                required: true,
                type: 'string'
            },
            Model: {
                description: 'The model to use for agent orchestration.',
                required: true,
                type: 'string',
                validValues: ['gpt-4o', 'gpt-4.1']
            },
            OrchestratorSkill: {
                description: 'Orchestrator skill name. Set to "DefaultAgentOrchestrator" for interactive agents.',
                required: false,
                type: 'string',
                example: 'DefaultAgentOrchestrator'
            }
        }
    },
    ChildSkills: {
        description: 'Array of skill names the agent can invoke. Can be inline skills, external skills, or other agent skills.',
        required: true,
        type: 'array'
    },
    SuggestedPrompts: {
        description: 'Starter and follow-up prompts for interactive agents. Starter prompts require IsStarterAgent, Title, and Personas.',
        required: false,
        type: 'array'
    }
};

/** AgentDefinitions fields */
export const AGENT_DEFINITION_FIELDS: Record<string, FieldDef> = {
    Name: {
        description: 'Agent install name. No whitespace, no dots.',
        required: true,
        type: 'string'
    },
    DisplayName: {
        description: 'User-friendly name for UI display.',
        required: true,
        type: 'string'
    },
    Description: {
        description: 'Human-readable summary of the agent\'s purpose.',
        required: true,
        type: 'string'
    },
    Publisher: {
        description: 'Name of the agent\'s publisher.',
        required: true,
        type: 'string'
    },
    Product: {
        description: 'Source product associated with the agent (e.g., Security, SecurityCopilot).',
        required: true,
        type: 'string'
    },
    RequiredSkillsets: {
        description: 'Skillsets the agent depends on. Must include the Descriptor Name and any external plugin/skillset names.',
        required: true,
        type: 'array'
    },
    AgentSingleInstanceConstraint: {
        description: 'Deployment constraint for the agent.',
        required: false,
        type: 'string',
        validValues: ['None', 'Workspace', 'Tenant']
    },
    Triggers: {
        description: 'Array defining how/when the agent runs. At least one trigger required.',
        required: true,
        type: 'array'
    },
    PromptSkill: {
        description: 'Enables interactive chat experience. Format: SkillsetName.SkillName. Only for interactive agents.',
        required: false,
        type: 'string'
    }
};

/** Trigger fields */
export const TRIGGER_FIELDS: Record<string, FieldDef> = {
    Name: {
        description: 'Descriptive name for the trigger (e.g., Default).',
        required: true,
        type: 'string',
        example: 'Default'
    },
    DefaultPollPeriodSeconds: {
        description: 'Interval in seconds for scheduled execution. Set to 0 for manual-only triggers.',
        required: true,
        type: 'string'
    },
    FetchSkill: {
        description: 'Skill invoked first to gather data. Format: SkillsetName.SkillName. Set to empty string if not needed.',
        required: false,
        type: 'string'
    },
    ProcessSkill: {
        description: 'Agent skill invoked to process each result. Format: SkillsetName.SkillName.',
        required: true,
        type: 'string'
    }
};

/** SuggestedPrompt fields */
export const SUGGESTED_PROMPT_FIELDS: Record<string, FieldDef> = {
    Prompt: {
        description: 'The prompt text to display.',
        required: true,
        type: 'string'
    },
    Title: {
        description: 'Title of the prompt. Required for starter prompts.',
        required: false,
        type: 'string'
    },
    Personas: {
        description: 'Persona type IDs the prompt is aligned to. 0=CISO, 1=SOC Analyst, 2=Threat Intel, 3=ITAdmin, 4=Identity Admin, 5=Data Security Admin, 6=Cloud Admin.',
        required: false,
        type: 'array'
    },
    IsStarterAgent: {
        description: 'Set to true for starter prompts shown at the beginning of an interactive session.',
        required: false,
        type: 'boolean'
    },
    Recommendation: {
        description: 'Short recommendation text (max 2 sentences).',
        required: false,
        type: 'string'
    }
};

/** Input field definition */
export const INPUT_FIELDS: Record<string, FieldDef> = {
    Name: {
        description: 'Input variable name. Maps to {{Name}} in templates.',
        required: true,
        type: 'string'
    },
    Description: {
        description: 'Description of the input (used by orchestrator).',
        required: true,
        type: 'string'
    },
    PlaceholderValue: {
        description: 'Hint text shown to user in the UI input field.',
        required: false,
        type: 'string'
    },
    DefaultValue: {
        description: 'Default value if the user does not provide input.',
        required: false,
        type: 'string'
    },
    Required: {
        description: 'Whether this input must be provided.',
        required: false,
        type: 'boolean'
    }
};

/** Best practices rules */
export const BEST_PRACTICES = [
    {
        id: 'BP001',
        severity: 'warning' as const,
        message: 'ExamplePrompts should not contain specific named entities (IPs, usernames, domains). Use generic placeholders instead.',
        check: (text: string) => {
            const exampleSection = text.match(/ExamplePrompts\s*:\s*\n([\s\S]*?)(?=\n\s*\w+:|$)/g);
            if (!exampleSection) { return false; }
            const ipPattern = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
            const emailPattern = /\b[\w.-]+@[\w.-]+\.\w+\b/;
            return ipPattern.test(exampleSection[0]) || emailPattern.test(exampleSection[0]);
        }
    },
    {
        id: 'BP002',
        severity: 'information' as const,
        message: 'Consider adding DescriptionForModel to provide detailed orchestrator instructions separate from the user-facing Description.',
        check: (text: string) => {
            return /^\s*Description\s*:/m.test(text) && !/DescriptionForModel\s*:/m.test(text);
        }
    },
    {
        id: 'BP003',
        severity: 'information' as const,
        message: 'Consider adding ExamplePrompts to improve skill selection accuracy.',
        check: (text: string) => {
            return /^\s*Skills\s*:/m.test(text) && !/ExamplePrompts\s*:/m.test(text);
        }
    },
    {
        id: 'BP004',
        severity: 'warning' as const,
        message: 'Sentinel/LogAnalytics KQL skills require TenantId, SubscriptionId, ResourceGroupName, and WorkspaceName in Settings.',
        check: (text: string) => {
            if (!/Target\s*:\s*(Sentinel|LogAnalytics)/i.test(text)) { return false; }
            const required = ['TenantId', 'SubscriptionId', 'ResourceGroupName', 'WorkspaceName'];
            return required.some(field => !new RegExp(`${field}\\s*:`).test(text));
        }
    },
    {
        id: 'BP005',
        severity: 'warning' as const,
        message: 'Kusto KQL skills require Cluster and Database in Settings.',
        check: (text: string) => {
            if (!/Target\s*:\s*Kusto/i.test(text)) { return false; }
            return !/Cluster\s*:/.test(text) || !/Database\s*:/.test(text);
        }
    },
    {
        id: 'BP006',
        severity: 'warning' as const,
        message: 'GPT skills must specify exactly one of Template, TemplateUrl, or TemplateFile.',
        check: (text: string) => {
            if (!/Format\s*:\s*GPT/i.test(text)) { return false; }
            const hasTemplate = /^\s+Template\s*:\s*[|>-]/m.test(text);
            const hasTemplateUrl = /TemplateUrl\s*:/m.test(text);
            const hasTemplateFile = /TemplateFile\s*:/m.test(text);
            const count = [hasTemplate, hasTemplateUrl, hasTemplateFile].filter(Boolean).length;
            return count === 0 || count > 1;
        }
    },
    {
        id: 'BP007',
        severity: 'warning' as const,
        message: 'GPT skills require ModelName in Settings (e.g., gpt-4o).',
        check: (text: string) => {
            if (!/Format\s*:\s*GPT/i.test(text)) { return false; }
            return !/ModelName\s*:/m.test(text);
        }
    },
    {
        id: 'BP008',
        severity: 'warning' as const,
        message: 'API plugins require OpenApiSpecUrl in SkillGroup Settings.',
        check: (text: string) => {
            if (!/Format\s*:\s*API/i.test(text)) { return false; }
            return !/OpenApiSpecUrl\s*:/m.test(text) && !/OpenApiSpecURL\s*:/m.test(text);
        }
    },
    {
        id: 'BP009',
        severity: 'hint' as const,
        message: 'Consider adding a DisplayName for a better user experience in the Security Copilot UI.',
        check: (text: string) => {
            return /^\s*Descriptor\s*:/m.test(text) && !/DisplayName\s*:/m.test(text);
        }
    },
    {
        id: 'BP010',
        severity: 'warning' as const,
        message: 'Descriptor.Name should not contain spaces. Use PascalCase or camelCase.',
        check: (text: string) => {
            const match = text.match(/Descriptor\s*:[\s\S]*?Name\s*:\s*(.+)/);
            if (!match) { return false; }
            return /\s/.test(match[1].trim());
        }
    },
    {
        id: 'BP011',
        severity: 'warning' as const,
        message: 'When using user-configurable Settings, SupportedAuthTypes must be specified (typically [None] for settings-only plugins).',
        check: (text: string) => {
            const hasSettings = /Descriptor\s*:[\s\S]*?Settings\s*:\s*\n\s*-\s+Name\s*:/m.test(text);
            if (!hasSettings) { return false; }
            return !/SupportedAuthTypes\s*:/m.test(text);
        }
    },
    {
        id: 'BP012',
        severity: 'warning' as const,
        message: 'KQL skills require Target field in Settings (Defender, Sentinel, LogAnalytics, or Kusto).',
        check: (text: string) => {
            if (!/Format\s*:\s*KQL/i.test(text)) { return false; }
            return !/Target\s*:/m.test(text);
        }
    },
    {
        id: 'BP013',
        severity: 'warning' as const,
        message: 'MCP plugins require Endpoint in SkillGroup Settings.',
        check: (text: string) => {
            if (!/Format\s*:\s*MCP/i.test(text)) { return false; }
            return !/Endpoint\s*:/m.test(text);
        }
    },
    {
        id: 'BP014',
        severity: 'information' as const,
        message: 'MCP plugins should specify AllowedTools to restrict which MCP tools are available.',
        check: (text: string) => {
            if (!/Format\s*:\s*MCP/i.test(text)) { return false; }
            return !/AllowedTools\s*:/m.test(text);
        }
    },
    {
        id: 'BP015',
        severity: 'warning' as const,
        message: 'LogicApp skills require SubscriptionId, ResourceGroup, WorkflowName, and TriggerName in Settings.',
        check: (text: string) => {
            if (!/Format\s*:\s*LogicApp/i.test(text)) { return false; }
            const required = ['SubscriptionId', 'ResourceGroup', 'WorkflowName', 'TriggerName'];
            return required.some(field => !new RegExp(`${field}\\s*:`).test(text));
        }
    },
    {
        id: 'BP016',
        severity: 'warning' as const,
        message: 'Agent skills require AgentDefinitions at the top level with Name, Publisher, Product, RequiredSkillsets, and Triggers.',
        check: (text: string) => {
            if (!/Format\s*:\s*Agent/i.test(text)) { return false; }
            return !/AgentDefinitions\s*:/m.test(text);
        }
    },
    {
        id: 'BP017',
        severity: 'warning' as const,
        message: 'Agent skills require Instructions in Settings defining the agent\'s mission, workflow, and output format.',
        check: (text: string) => {
            if (!/Format\s*:\s*Agent/i.test(text)) { return false; }
            return !/Instructions\s*:/m.test(text);
        }
    },
    {
        id: 'BP018',
        severity: 'warning' as const,
        message: 'Agent skills require ChildSkills listing the skills the agent can invoke.',
        check: (text: string) => {
            if (!/Format\s*:\s*Agent/i.test(text)) { return false; }
            return !/ChildSkills\s*:/m.test(text);
        }
    },
    {
        id: 'BP019',
        severity: 'warning' as const,
        message: 'Agent RequiredSkillsets should include the Descriptor Name so the agent can access its own inline skills.',
        check: (text: string) => {
            if (!/AgentDefinitions\s*:/m.test(text)) { return false; }
            if (!/RequiredSkillsets\s*:/m.test(text)) { return false; }
            const nameMatch = text.match(/Descriptor\s*:[\s\S]*?Name\s*:\s*(\S+)/);
            if (!nameMatch) { return false; }
            const descriptorName = nameMatch[1].replace(/['"]/g, '');
            const skillsetsBlock = text.match(/RequiredSkillsets\s*:\s*\n((?:\s*-\s*.+\n)*)/);
            if (!skillsetsBlock) { return false; }
            return !skillsetsBlock[1].includes(descriptorName);
        }
    },
    {
        id: 'BP020',
        severity: 'warning' as const,
        message: 'Interactive agents must have Interfaces set to [InteractiveAgent], a single input named "UserRequest", PromptSkill in AgentDefinitions, and OrchestratorSkill: DefaultAgentOrchestrator.',
        check: (text: string) => {
            if (!/InteractiveAgent/m.test(text)) { return false; }
            const hasUserRequest = /Name\s*:\s*UserRequest/m.test(text);
            const hasPromptSkill = /PromptSkill\s*:/m.test(text);
            const hasOrchestrator = /OrchestratorSkill\s*:/m.test(text);
            return !hasUserRequest || !hasPromptSkill || !hasOrchestrator;
        }
    },
    {
        id: 'BP021',
        severity: 'information' as const,
        message: 'MCP plugins benefit from a detailed DescriptionForModel to guide the AI on when and how to use MCP tools.',
        check: (text: string) => {
            if (!/Format\s*:\s*MCP/i.test(text)) { return false; }
            return !/DescriptionForModel\s*:/m.test(text);
        }
    },
    // === P3: KQL & General Validation Rules ===
    {
        id: 'BP022',
        severity: 'warning' as const,
        message: 'KQL query has no time filter (ago, between, datetime, startofday, now). Queries without time bounds risk scanning excessive data and causing timeouts.',
        check: (text: string) => {
            if (!/Format\s*:\s*KQL/i.test(text)) { return false; }
            // Extract template content
            const templateMatch = text.match(/Template\s*:\s*\|[-+]?\s*\n([\s\S]*?)(?=\n\s{2,}\w+:|\n\w|$)/);
            if (!templateMatch) { return false; }
            const tpl = templateMatch[1];
            const hasTimeFilter = /\bago\s*\(/.test(tpl) || /\bbetween\s*\(/.test(tpl) ||
                /\bdatetime\s*\(/.test(tpl) || /\bstartof(day|week|month|year)\s*\(/.test(tpl) ||
                /\bnow\s*\(/.test(tpl) || /\btodatetime\s*\(/.test(tpl);
            return !hasTimeFilter;
        }
    },
    {
        id: 'BP023',
        severity: 'warning' as const,
        message: 'KQL query has no result set cap (take, top, or limit). Consider capping results to prevent excessive data transfer (recommended max: 50 rows).',
        check: (text: string) => {
            if (!/Format\s*:\s*KQL/i.test(text)) { return false; }
            const templateMatch = text.match(/Template\s*:\s*\|[-+]?\s*\n([\s\S]*?)(?=\n\s{2,}\w+:|\n\w|$)/);
            if (!templateMatch) { return false; }
            const tpl = templateMatch[1];
            return !/\|\s*(take|top|limit)\s+\d+/i.test(tpl);
        }
    },
    {
        id: 'BP024',
        severity: 'warning' as const,
        message: 'Multi-line KQL Template should use the YAML block scalar indicator (|- or |) to preserve newlines correctly.',
        check: (text: string) => {
            if (!/Format\s*:\s*KQL/i.test(text)) { return false; }
            const lines = text.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const match = lines[i].match(/^(\s*)Template\s*:\s*(.*)$/);
                if (match) {
                    const value = match[2].trim();
                    // If value is not a block scalar indicator and the next lines contain pipe operators
                    if (value && !/^\|[-+]?\s*$/.test(value) && !/^>[-+]?\s*$/.test(value)) {
                        // Check next few lines for KQL pipe operators suggesting multi-line query
                        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
                            if (/^\s*\|/.test(lines[j])) { return true; }
                        }
                    }
                }
            }
            return false;
        }
    },
    {
        id: 'BP025',
        severity: 'error' as const,
        message: 'KQL skills must specify exactly one of Template or TemplateUrl.',
        check: (text: string) => {
            if (!/Format\s*:\s*KQL/i.test(text)) { return false; }
            const hasTemplate = /^\s+Template\s*:\s*[|>]/m.test(text) || /^\s+Template\s*:\s*\S/m.test(text);
            const hasTemplateUrl = /^\s+TemplateUrl\s*:/m.test(text);
            const count = [hasTemplate, hasTemplateUrl].filter(Boolean).length;
            return count === 0 || count > 1;
        }
    },
    {
        id: 'BP026',
        severity: 'warning' as const,
        message: 'Possible real credentials detected (GUID pattern in TenantId/SubscriptionId/ClientId). Use <YOUR-TENANT-ID> style placeholders for shared manifests.',
        check: (text: string) => {
            const guidInSensitiveField = /(TenantId|SubscriptionId|ClientId)\s*:\s*[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
            return guidInSensitiveField.test(text);
        }
    },
    {
        id: 'BP027',
        severity: 'warning' as const,
        message: 'Skill Name should not contain spaces or dots. Skill names are used in ChildSkills references and ProcessSkill dot notation.',
        check: (text: string) => {
            // Get skill names (indented Name: under Skills:)
            const skillsBlock = text.match(/Skills\s*:\s*\n([\s\S]*?)(?=\n\s{0,2}\w+:|\n\w|$)/g);
            if (!skillsBlock) { return false; }
            for (const block of skillsBlock) {
                const names = block.matchAll(/^\s+-?\s*Name\s*:\s*(.+)/gm);
                for (const n of names) {
                    const name = n[1].trim().replace(/['"]/g, '');
                    if (/[\s.]/.test(name)) { return true; }
                }
            }
            return false;
        }
    },
    {
        id: 'BP028',
        severity: 'warning' as const,
        message: 'Descriptor.Name contains forbidden characters (/\\?#@). These characters are not allowed in plugin names.',
        check: (text: string) => {
            const match = text.match(/Descriptor\s*:[\s\S]*?Name\s*:\s*(.+)/);
            if (!match) { return false; }
            const name = match[1].trim().replace(/['"]/g, '');
            return /[\/\\?#@]/.test(name);
        }
    }
];
