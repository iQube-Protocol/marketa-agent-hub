/** QubeTalk API Client for agent-to-agent communication */

import type {
  QubeTalkMessage,
  ContentTransfer,
  QubeTalkChannel,
  QubeTalkConfig,
  Iqube,
  ContentType,
  AgentInfo,
  ChannelDefinition,
} from './qubetalkTypes';
import { AGENTS, CHANNEL_CONFIG } from './qubetalkTypes';

// Environment configuration
export const getQubeTalkConfig = (): QubeTalkConfig => {
  const isProduction = window.location.hostname === 'dev-beta.aigentz.me';
  return {
    baseUrl: isProduction ? 'https://dev-beta.aigentz.me' : 'https://dev-beta.aigentz.me',
    apiEndpoint: '/api/marketa/qubetalk',
    environment: isProduction ? 'production' : 'development',
  };
};

// Default agent info for this client (Marketa LVB - Thin Client)
const CLIENT_AGENT: AgentInfo = AGENTS.MARKETA_LVB;

// Convert channel definitions to QubeTalkChannel format
const channelDefToChannel = (def: ChannelDefinition): QubeTalkChannel => ({
  id: def.channel_id,
  name: def.display_name,
  description: def.description,
  participants: def.participants,
  created_at: '2024-01-15T10:00:00Z',
  last_activity: new Date().toISOString(),
});

// Generate channels from configuration
const generateChannels = (): QubeTalkChannel[] => {
  const essential = CHANNEL_CONFIG.essential.map(channelDefToChannel);
  const optional = CHANNEL_CONFIG.optional.map(channelDefToChannel);
  return [...essential, ...optional];
};

// Local storage for mock messages
const mockChannels: QubeTalkChannel[] = generateChannels();
const mockMessages: QubeTalkMessage[] = [
  {
    message_id: 'msg_1',
    from_agent: AGENTS.AIGENT_Z,
    content: {
      type: 'text',
      text: 'Welcome to QubeTalk! I\'m Aigent Z, your AgentiQ ecosystem coordinator. How can I assist you today?',
    },
    message_type: 'incoming',
    channel_id: 'marketa-lvb-aigent-z',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    message_id: 'msg_2',
    from_agent: AGENTS.MARKETA_AGQ,
    content: {
      type: 'text',
      text: 'Configuration sync available. Send your client setup as an iQube for comparison with the thick platform.',
    },
    message_type: 'incoming',
    channel_id: 'marketa-lvb-marketa-agq',
    created_at: new Date(Date.now() - 1800000).toISOString(),
  },
];
const mockTransfers: ContentTransfer[] = [];

// Helper for API calls with fallback to mock
const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {},
  fallbackFn: () => T
): Promise<T> => {
  const config = getQubeTalkConfig();
  const url = `${config.baseUrl}${config.apiEndpoint}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      console.warn(`QubeTalk API returned ${response.status}, using fallback`);
      return fallbackFn();
    }

    return response.json();
  } catch (error) {
    // CORS or network error - use fallback
    console.warn('QubeTalk API unavailable (CORS/network), using local data:', error);
    return fallbackFn();
  }
};

/** QubeTalk API Client - Live with mock fallback */
export const qubetalkApi = {
  // Configuration
  getConfig: getQubeTalkConfig,
  getClientAgent: () => CLIENT_AGENT,

  // Messages
  async getMessages(channelId?: string): Promise<QubeTalkMessage[]> {
    const fallback = () => {
      if (channelId) {
        return mockMessages.filter(m => m.channel_id === channelId);
      }
      return mockMessages;
    };

    return apiCall<QubeTalkMessage[]>(
      channelId ? `/messages?channel_id=${channelId}` : '/messages',
      {},
      fallback
    );
  },

  async sendMessage(
    content: string,
    channelId: string,
    contentType: 'text' | 'content_transfer' | 'iqube_transfer' | 'code_snippet' = 'text',
    payload?: unknown
  ): Promise<QubeTalkMessage> {
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

    const fallback = () => {
      mockMessages.push(message);
      
      // Simulate response after a short delay
      setTimeout(() => {
        const response: QubeTalkMessage = {
          message_id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          from_agent: AGENTS.AIGENT_Z,
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
    };

    return apiCall<QubeTalkMessage>(
      '/messages',
      {
        method: 'POST',
        body: JSON.stringify({
          from_agent: CLIENT_AGENT,
          content: message.content,
          channel_id: channelId,
        }),
      },
      fallback
    );
  },

  // Content Transfers
  async getTransfers(): Promise<ContentTransfer[]> {
    return apiCall<ContentTransfer[]>('/transfers', {}, () => mockTransfers);
  },

  async sendTransfer(
    toAgent: string,
    content: unknown,
    contentType: ContentType,
    name: string,
    iqubeFormat?: Iqube
  ): Promise<ContentTransfer> {
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

    const fallback = () => {
      mockTransfers.push(transfer);
      return transfer;
    };

    return apiCall<ContentTransfer>(
      '/transfers',
      {
        method: 'POST',
        body: JSON.stringify({
          from_agent: CLIENT_AGENT.id,
          to_agent: toAgent,
          content_type: transfer.content_type,
          content: transfer.content,
          iqube_ref: transfer.iqube_ref,
          transfer_method: transfer.transfer_method,
        }),
      },
      fallback
    );
  },

  // Channels
  async getChannels(): Promise<QubeTalkChannel[]> {
    return apiCall<QubeTalkChannel[]>('/channels', {}, () => mockChannels);
  },

  async createChannel(name: string, description?: string): Promise<QubeTalkChannel> {
    const channel: QubeTalkChannel = {
      id: `channel_${Date.now()}`,
      name,
      description,
      participants: [CLIENT_AGENT.id],
      created_at: new Date().toISOString(),
    };

    const fallback = () => {
      mockChannels.push(channel);
      return channel;
    };

    return apiCall<QubeTalkChannel>(
      '/channels',
      {
        method: 'POST',
        body: JSON.stringify({ name, description, participants: [CLIENT_AGENT.id] }),
      },
      fallback
    );
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
