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
        validValues: ['ApiKey', 'Basic', 'AAD', 'None']
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
                validValues: ['APIKey', 'Basic', 'AAD', 'OAuthAuthorizationCodeFlow']
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
        validValues: ['API', 'GPT', 'KQL']
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
                validValues: ['gpt-4o', 'gpt-4-32k-v0613', 'gpt-4']
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
    }
];
