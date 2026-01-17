/** QubeTalk type definitions for agent-to-agent communication */

export type ContentType = 'json' | 'iqube' | 'code_snippet' | 'hybrid';
export type TransferStatus = 'pending' | 'sent' | 'delivered' | 'failed';
export type IqubeType = 'content' | 'code' | 'data' | 'hybrid';
export type ExecutionEnvironment = 'browser' | 'node' | 'blockchain';
export type AgentInfra = 'agentiq' | 'lovable';
export type AgentType = 'system' | 'platform' | 'thin-client' | 'development';
export type ChannelType = 'essential' | 'optional';

export interface AgentInfo {
  id: string;
  type: AgentType;
  name: string;
  infra: AgentInfra;
}

/** Agent definitions for the ecosystem */
export const AGENTS = {
  AIGENT_Z: {
    id: 'aigent-z',
    name: 'Aigent Z',
    type: 'system' as AgentType,
    infra: 'agentiq' as AgentInfra,
  },
  MARKETA_AGQ: {
    id: 'marketa-agq',
    name: 'Marketa (AGQ)',
    type: 'platform' as AgentType,
    infra: 'agentiq' as AgentInfra,
  },
  MARKETA_LVB: {
    id: 'marketa-lvb',
    name: 'Marketa (LVB)',
    type: 'thin-client' as AgentType,
    infra: 'lovable' as AgentInfra,
  },
  LOVABLE: {
    id: 'lovable-dev',
    name: 'Lovable',
    type: 'development' as AgentType,
    infra: 'lovable' as AgentInfra,
  },
} as const;

/** Channel definition with proper nomenclature */
export interface ChannelDefinition {
  channel_id: string;
  display_name: string;
  description: string;
  from_agent: AgentInfo;
  to_agent: AgentInfo;
  participants: string[];
  content_types: string[];
  channel_type: ChannelType;
  hidden_by_default?: boolean;
}

/** Channel configuration for Marketa (LVB) thin client */
export const CHANNEL_CONFIG: {
  essential: ChannelDefinition[];
  optional: ChannelDefinition[];
} = {
  essential: [
    {
      // Updated to match backend channel naming: <from>-<to>
      channel_id: 'marketa-agq-marketa-lvb',
      display_name: 'Marketa (AGQ) ↔ Marketa (LVB)',
      description: 'Configuration sync and data exchange with thick platform',
      from_agent: AGENTS.MARKETA_AGQ,
      to_agent: AGENTS.MARKETA_LVB,
      participants: ['marketa-agq', 'marketa-lvb'],
      content_types: ['config_json', 'iqube', 'data_exchange', 'text'],
      channel_type: 'essential',
    },
    {
      channel_id: 'aigent-z-marketa-lvb',
      display_name: 'Aigent Z ↔ Marketa (LVB)',
      description: 'System communication and orchestration',
      from_agent: AGENTS.AIGENT_Z,
      to_agent: AGENTS.MARKETA_LVB,
      participants: ['aigent-z', 'marketa-lvb'],
      content_types: ['system_alert', 'text', 'iqube'],
      channel_type: 'essential',
    },
  ],
  optional: [
    {
      channel_id: 'lovable-dev-marketa-agq',
      display_name: 'Lovable ↔ Marketa (AGQ)',
      description: 'Development coordination and infrastructure',
      from_agent: AGENTS.LOVABLE,
      to_agent: AGENTS.MARKETA_AGQ,
      participants: ['lovable-dev', 'marketa-agq'],
      content_types: ['code_snippet', 'config_json', 'text'],
      channel_type: 'optional',
      hidden_by_default: true,
    },
    {
      channel_id: 'lovable-dev-aigent-z',
      display_name: 'Lovable ↔ Aigent Z',
      description: 'System diagnostics and infrastructure',
      from_agent: AGENTS.LOVABLE,
      to_agent: AGENTS.AIGENT_Z,
      participants: ['lovable-dev', 'aigent-z'],
      content_types: ['system_alert', 'code_snippet', 'text'],
      channel_type: 'optional',
      hidden_by_default: true,
    },
  ],
};

export interface IqubeMetadata {
  title: string;
  description: string;
  tags: string[];
  dependencies: string[];
  execution_context: {
    environment: ExecutionEnvironment;
    permissions: ('read' | 'write' | 'execute')[];
  };
}

export interface IqubeDelivery {
  channels: string[];
  triggers: ('schedule' | 'event' | 'manual')[];
  tracking: boolean;
}

export interface Iqube {
  iqube_id: string;
  type: IqubeType;
  version: string;
  creator: string;
  tenant_id?: string;
  content: {
    payload: unknown;
    format: 'json' | 'javascript' | 'markdown' | 'binary';
    encoding: 'utf-8' | 'base64';
  };
  metadata: IqubeMetadata;
  delivery: IqubeDelivery;
  created_at: string;
  expires_at?: string;
  signature?: string;
}

export interface CodeSnippet {
  language: 'javascript' | 'typescript' | 'python';
  code: string;
  execution_context: ExecutionEnvironment;
}

export interface MessageContent {
  type: 'text' | 'content_transfer' | 'iqube_transfer' | 'code_snippet';
  text?: string;
  payload?: {
    content_type: ContentType;
    data: unknown;
    iqube_ref?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface QubeTalkMessage {
  message_id: string;
  from_agent: AgentInfo;
  to_agent?: AgentInfo;
  content: MessageContent;
  message_type: 'incoming' | 'outgoing';
  channel_id?: string;
  created_at: string;
}

export interface ContentTransfer {
  transfer_id: string;
  from_agent: string;
  to_agent: string;
  content_type: 'campaign' | 'content' | 'config' | 'iqube' | 'code';
  content: {
    id: string;
    type: ContentType;
    name: string;
    data: unknown;
    iqube_format?: Iqube;
    code_snippet?: CodeSnippet;
    created_at: string;
  };
  status: TransferStatus;
  iqube_ref?: string;
  transfer_method: 'raw_json' | 'iqube' | 'code_snippet' | 'encrypted';
  created_at: string;
}

export interface QubeTalkChannel {
  id: string;
  channel_id?: string; // Backend may return either id or channel_id
  name: string;
  description?: string;
  participants: string[];
  created_at: string;
  last_activity?: string;
}

export interface QubeTalkConfig {
  baseUrl: string;
  apiEndpoint: string;
  environment: 'development' | 'production';
}
