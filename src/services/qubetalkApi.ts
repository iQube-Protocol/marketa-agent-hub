/** QubeTalk API Client for agent-to-agent communication */

import type {
  QubeTalkMessage,
  ContentTransfer,
  QubeTalkChannel,
  QubeTalkConfig,
  Iqube,
  ContentType,
  AgentInfo,
} from './qubetalkTypes';

// Environment configuration
export const getQubeTalkConfig = (): QubeTalkConfig => {
  const isProduction = window.location.hostname === 'dev-beta.aigentz.me';
  return {
    baseUrl: isProduction ? 'https://dev-beta.aigentz.me' : 'http://localhost:3003',
    apiEndpoint: '/api/marketa/qubetalk',
    environment: isProduction ? 'production' : 'development',
  };
};

// Simulated delay for realistic UX (mock implementation)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Default agent info for this client
const CLIENT_AGENT: AgentInfo = {
  id: 'lovable-thin-client',
  type: 'thin-client',
  name: 'Marketa Console',
};

// Mock data
const mockChannels: QubeTalkChannel[] = [
  {
    id: 'lovable-aigentz',
    name: 'Aigent Z',
    description: 'Direct communication with Aigent Z',
    participants: ['lovable-thin-client', 'aigent-z'],
    created_at: '2024-01-15T10:00:00Z',
    last_activity: new Date().toISOString(),
  },
  {
    id: 'lovable-marketa',
    name: 'Marketa',
    description: 'Configuration and data sharing with Marketa',
    participants: ['lovable-thin-client', 'marketa-agent'],
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'iqube-exchange',
    name: 'iQube Exchange',
    description: 'iQube distribution and sharing',
    participants: ['lovable-thin-client', 'aigent-z', 'marketa-agent'],
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'code-collaboration',
    name: 'Code Collaboration',
    description: 'Code snippet sharing and review',
    participants: ['lovable-thin-client', 'aigent-z'],
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'system-notifications',
    name: 'System',
    description: 'System alerts and updates',
    participants: ['lovable-thin-client'],
    created_at: '2024-01-15T10:00:00Z',
  },
];

const mockMessages: QubeTalkMessage[] = [
  {
    message_id: 'msg_1',
    from_agent: { id: 'aigent-z', type: 'coordinator', name: 'Aigent Z' },
    content: {
      type: 'text',
      text: 'Welcome to QubeTalk! I\'m Aigent Z, your AgentiQ ecosystem coordinator. How can I assist you today?',
    },
    message_type: 'incoming',
    channel_id: 'lovable-aigentz',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    message_id: 'msg_2',
    from_agent: { id: 'marketa-agent', type: 'marketing', name: 'Marketa Agent' },
    content: {
      type: 'text',
      text: 'Configuration sync available. Send your client setup as an iQube for comparison.',
    },
    message_type: 'incoming',
    channel_id: 'lovable-marketa',
    created_at: new Date(Date.now() - 1800000).toISOString(),
  },
];

const mockTransfers: ContentTransfer[] = [];

/** QubeTalk API Client */
export const qubetalkApi = {
  // Configuration
  getConfig: getQubeTalkConfig,
  getClientAgent: () => CLIENT_AGENT,

  // Messages
  async getMessages(channelId?: string): Promise<QubeTalkMessage[]> {
    await delay(200);
    if (channelId) {
      return mockMessages.filter(m => m.channel_id === channelId);
    }
    return mockMessages;
  },

  async sendMessage(
    content: string,
    channelId: string,
    contentType: 'text' | 'content_transfer' | 'iqube_transfer' | 'code_snippet' = 'text',
    payload?: unknown
  ): Promise<QubeTalkMessage> {
    await delay(300);
    const message: QubeTalkMessage = {
      message_id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from_agent: CLIENT_AGENT,
      content: {
        type: contentType,
        text: content,
        payload: payload ? {
          content_type: contentType === 'iqube_transfer' ? 'iqube' : 'json',
          data: payload,
        } : undefined,
      },
      message_type: 'outgoing',
      channel_id: channelId,
      created_at: new Date().toISOString(),
    };
    mockMessages.push(message);

    // Simulate response after a short delay
    setTimeout(() => {
      const response: QubeTalkMessage = {
        message_id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        from_agent: { id: 'aigent-z', type: 'coordinator', name: 'Aigent Z' },
        content: {
          type: 'text',
          text: contentType === 'iqube_transfer'
            ? 'iQube received and processed successfully. I\'ll analyze the content and respond shortly.'
            : contentType === 'code_snippet'
            ? 'Code snippet received. Reviewing for integration possibilities.'
            : 'Message received. Processing your request...',
        },
        message_type: 'incoming',
        channel_id: channelId,
        created_at: new Date().toISOString(),
      };
      mockMessages.push(response);
    }, 1500);

    return message;
  },

  // Content Transfers
  async getTransfers(): Promise<ContentTransfer[]> {
    await delay(200);
    return mockTransfers;
  },

  async sendTransfer(
    toAgent: string,
    content: unknown,
    contentType: ContentType,
    name: string,
    iqubeFormat?: Iqube
  ): Promise<ContentTransfer> {
    await delay(500);
    const transfer: ContentTransfer = {
      transfer_id: `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      from_agent: CLIENT_AGENT.id,
      to_agent: toAgent,
      content_type: iqubeFormat ? 'iqube' : 'content',
      content: {
        id: `content_${Date.now()}`,
        type: contentType,
        name,
        data: content,
        iqube_format: iqubeFormat,
        created_at: new Date().toISOString(),
      },
      status: 'sent',
      iqube_ref: iqubeFormat?.iqube_id,
      transfer_method: iqubeFormat ? 'iqube' : 'raw_json',
      created_at: new Date().toISOString(),
    };
    mockTransfers.push(transfer);
    return transfer;
  },

  // Channels
  async getChannels(): Promise<QubeTalkChannel[]> {
    await delay(200);
    return mockChannels;
  },

  async createChannel(name: string, description?: string): Promise<QubeTalkChannel> {
    await delay(300);
    const channel: QubeTalkChannel = {
      id: `channel_${Date.now()}`,
      name,
      description,
      participants: [CLIENT_AGENT.id],
      created_at: new Date().toISOString(),
    };
    mockChannels.push(channel);
    return channel;
  },

  // iQube helpers
  createIqube(
    type: 'content' | 'code' | 'data' | 'hybrid',
    payload: unknown,
    metadata: {
      title: string;
      description: string;
      tags?: string[];
    }
  ): Iqube {
    return {
      iqube_id: `iqube_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      version: '1.0.0',
      creator: CLIENT_AGENT.id,
      content: {
        payload,
        format: 'json',
        encoding: 'utf-8',
      },
      metadata: {
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags || [],
        dependencies: [],
        execution_context: {
          environment: 'browser',
          permissions: ['read', 'write'],
        },
      },
      delivery: {
        channels: ['qubetalk'],
        triggers: ['manual'],
        tracking: true,
      },
      created_at: new Date().toISOString(),
    };
  },

  validateIqube(iqube: Iqube): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!iqube.iqube_id) errors.push('Missing iqube_id');
    if (!iqube.type) errors.push('Missing type');
    if (!iqube.content?.payload) errors.push('Missing content payload');
    if (!iqube.metadata?.title) errors.push('Missing metadata title');
    return { valid: errors.length === 0, errors };
  },
};
