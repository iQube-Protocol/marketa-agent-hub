/** QubeTalk API Client for agent-to-agent communication */

import { supabase } from '@/integrations/supabase/client';
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
    baseUrl: 'https://dev-beta.aigentz.me',
    apiEndpoint: '/api/marketa/qubetalk',
    environment: isProduction ? 'production' : 'development',
  };
};

// Default agent info for this client (Marketa LVB - Thin Client)
const CLIENT_AGENT: AgentInfo = AGENTS.MARKETA_LVB;

type AllowedEndpoint = '/channels' | '/messages' | '/transfers';

type ProxyRequest = {
  endpoint: AllowedEndpoint;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
};

type ListResponse<TItem, TKey extends string> = {
  success?: boolean;
  total?: number;
} & {
  [K in TKey]?: TItem[];
};

const proxyInvoke = async <T>(request: ProxyRequest): Promise<T> => {
  const { data, error } = await supabase.functions.invoke('qubetalk-proxy', {
    body: request,
  });

  if (error) throw new Error(error.message);
  return data as T;
};

const unwrapList = <TItem, TKey extends string>(
  data: unknown,
  key: TKey
): TItem[] => {
  // Some upstreams return a bare array; others wrap in { success, [key]: [] }
  if (Array.isArray(data)) return data as TItem[];
  if (data && typeof data === 'object') {
    const maybe = (data as Record<string, unknown>)[key];
    if (Array.isArray(maybe)) return maybe as TItem[];
  }
  return [];
};

/** QubeTalk API Client - Live via Supabase Edge Function proxy */
export const qubetalkApi = {
  // Configuration
  getConfig: getQubeTalkConfig,
  getClientAgent: () => CLIENT_AGENT,

  // Messages
  async getMessages(channelId?: string): Promise<QubeTalkMessage[]> {
    const data = await proxyInvoke<ListResponse<QubeTalkMessage, 'messages'>>({
      endpoint: '/messages',
      method: 'GET',
      query: channelId ? { channel_id: channelId } : undefined,
    });

    return unwrapList<QubeTalkMessage, 'messages'>(data, 'messages');
  },

  async sendMessage(
    content: string,
    channelId: string,
    contentType: 'text' | 'content_transfer' | 'iqube_transfer' | 'code_snippet' = 'text',
    payload?: unknown
  ): Promise<QubeTalkMessage> {
    const messageContent: QubeTalkMessage['content'] = {
      type: contentType,
      text: content,
      payload: payload
        ? {
            content_type: contentType === 'iqube_transfer' ? 'iqube' : 'json',
            data: payload,
          }
        : undefined,
    };

    return proxyInvoke<QubeTalkMessage>({
      endpoint: '/messages',
      method: 'POST',
      body: {
        from_agent: CLIENT_AGENT,
        content: messageContent,
        channel_id: channelId,
      },
    });
  },

  // Content Transfers
  async getTransfers(): Promise<ContentTransfer[]> {
    const data = await proxyInvoke<ListResponse<ContentTransfer, 'transfers'>>({
      endpoint: '/transfers',
      method: 'GET',
    });

    return unwrapList<ContentTransfer, 'transfers'>(data, 'transfers');
  },

  async sendTransfer(
    toAgent: string,
    content: unknown,
    contentType: ContentType,
    name: string,
    iqubeFormat?: Iqube
  ): Promise<ContentTransfer> {
    return proxyInvoke<ContentTransfer>({
      endpoint: '/transfers',
      method: 'POST',
      body: {
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
        iqube_ref: iqubeFormat?.iqube_id,
        transfer_method: iqubeFormat ? 'iqube' : 'raw_json',
      },
    });
  },

  // Channels
  async getChannels(): Promise<QubeTalkChannel[]> {
    const data = await proxyInvoke<ListResponse<QubeTalkChannel, 'channels'>>({
      endpoint: '/channels',
      method: 'GET',
    });

    const raw = unwrapList<QubeTalkChannel, 'channels'>(data, 'channels');
    
    // Normalize: backend may return channel_id instead of id
    return raw.map((ch) => ({
      ...ch,
      id: ch.id || (ch as any).channel_id || 'unknown',
      name: ch.name || ch.id || (ch as any).channel_id || 'Unnamed Channel',
    }));
  },

  async createChannel(name: string, description?: string): Promise<QubeTalkChannel> {
    return proxyInvoke<QubeTalkChannel>({
      endpoint: '/channels',
      method: 'POST',
      body: { name, description, participants: [CLIENT_AGENT.id] },
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

