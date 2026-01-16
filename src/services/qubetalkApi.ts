/** QubeTalk API Client for agent-to-agent communication - LIVE DATA */

import type {
  QubeTalkMessage,
  ContentTransfer,
  QubeTalkChannel,
  QubeTalkConfig,
  Iqube,
  ContentType,
  AgentInfo,
} from './qubetalkTypes';
import { AGENTS } from './qubetalkTypes';

// Environment configuration
export const getQubeTalkConfig = (): QubeTalkConfig => {
  const isProduction = window.location.hostname === 'dev-beta.aigentz.me';
  return {
    baseUrl: isProduction ? 'https://dev-beta.aigentz.me' : 'https://dev-beta.aigentz.me', // Always use production API
    apiEndpoint: '/api/marketa/qubetalk',
    environment: isProduction ? 'production' : 'development',
  };
};

// Default agent info for this client (Marketa LVB - Thin Client)
const CLIENT_AGENT: AgentInfo = AGENTS.MARKETA_LVB;

// Helper for API calls
const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const config = getQubeTalkConfig();
  const url = `${config.baseUrl}${config.apiEndpoint}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`QubeTalk API error: ${response.status} - ${errorText}`);
  }

  return response.json();
};

/** QubeTalk API Client - Live Implementation */
export const qubetalkApi = {
  // Configuration
  getConfig: getQubeTalkConfig,
  getClientAgent: () => CLIENT_AGENT,

  // Messages
  async getMessages(channelId?: string): Promise<QubeTalkMessage[]> {
    const endpoint = channelId ? `/messages?channel_id=${channelId}` : '/messages';
    return apiCall<QubeTalkMessage[]>(endpoint);
  },

  async sendMessage(
    content: string,
    channelId: string,
    contentType: 'text' | 'content_transfer' | 'iqube_transfer' | 'code_snippet' = 'text',
    payload?: unknown
  ): Promise<QubeTalkMessage> {
    const message = {
      from_agent: CLIENT_AGENT,
      content: {
        type: contentType,
        text: content,
        payload: payload ? {
          content_type: contentType === 'iqube_transfer' ? 'iqube' : 'json',
          data: payload,
        } : undefined,
      },
      channel_id: channelId,
    };

    return apiCall<QubeTalkMessage>('/messages', {
      method: 'POST',
      body: JSON.stringify(message),
    });
  },

  // Content Transfers
  async getTransfers(): Promise<ContentTransfer[]> {
    return apiCall<ContentTransfer[]>('/transfers');
  },

  async sendTransfer(
    toAgent: string,
    content: unknown,
    contentType: ContentType,
    name: string,
    iqubeFormat?: Iqube
  ): Promise<ContentTransfer> {
    const transfer = {
      from_agent: CLIENT_AGENT.id,
      to_agent: toAgent,
      content_type: iqubeFormat ? 'iqube' : 'content',
      content: {
        type: contentType,
        name,
        data: content,
        iqube_format: iqubeFormat,
      },
      iqube_ref: iqubeFormat?.iqube_id,
      transfer_method: iqubeFormat ? 'iqube' : 'raw_json',
    };

    return apiCall<ContentTransfer>('/transfers', {
      method: 'POST',
      body: JSON.stringify(transfer),
    });
  },

  // Channels
  async getChannels(): Promise<QubeTalkChannel[]> {
    return apiCall<QubeTalkChannel[]>('/channels');
  },

  async createChannel(name: string, description?: string): Promise<QubeTalkChannel> {
    const channel = {
      name,
      description,
      participants: [CLIENT_AGENT.id],
    };

    return apiCall<QubeTalkChannel>('/channels', {
      method: 'POST',
      body: JSON.stringify(channel),
    });
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
