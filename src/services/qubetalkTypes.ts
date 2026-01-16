/** QubeTalk type definitions for agent-to-agent communication */

export type ContentType = 'json' | 'iqube' | 'code_snippet' | 'hybrid';
export type TransferStatus = 'pending' | 'sent' | 'delivered' | 'failed';
export type IqubeType = 'content' | 'code' | 'data' | 'hybrid';
export type ExecutionEnvironment = 'browser' | 'node' | 'blockchain';

export interface AgentInfo {
  id: string;
  type: string;
  name: string;
}

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
