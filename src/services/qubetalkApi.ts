/** QubeTalk API Client for agent-to-agent communication */

import { supabase } from '@/integrations/supabase/client';
import { getTenantHeaders } from '@/services/marketaApi';
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

const isLocalhost = () => ['localhost', '127.0.0.1'].includes(window.location.hostname);

const buildContextHeaders = (): Record<string, string> => {
  const tenantHeaders = getTenantHeaders();
  const fallbackTenantId = window.localStorage.getItem('marketa_tenant_id') || undefined;
  const fallbackPersonaId = window.localStorage.getItem('marketa_persona_id') || undefined;
  const modeParam = new URLSearchParams(window.location.search).get('mode') || window.localStorage.getItem('marketa_mode') || '';
  const devOverride = isLocalhost() || modeParam === 'admin';

  return {
    ...tenantHeaders,
    ...(fallbackTenantId ? { 'x-tenant-id': fallbackTenantId } : {}),
    ...(fallbackPersonaId ? { 'x-persona-id': fallbackPersonaId } : {}),
    ...(devOverride ? { 'x-dev-override': 'true' } : {}),
  };
};

const getTenantId = (): string | undefined => {
  const headers = buildContextHeaders();
  return headers['x-tenant-id'];
};

const proxyInvoke = async <T>(request: ProxyRequest): Promise<T> => {
  const headers = buildContextHeaders();

  const { data, error } = await supabase.functions.invoke('qubetalk-proxy', {
    body: request,
    headers,
  });

  if (error) throw new Error(error.message);
  return data as T;
};

async function directInvoke<T>(request: ProxyRequest): Promise<T> {
  // Local dev fallback: go straight to platform via Vite `/api` proxy to avoid Supabase Edge auth issues.
  const headers = buildContextHeaders();
  const tenantId = getTenantId();

  const endpoint = request.endpoint;
  const method = request.method ?? 'GET';

  // Map to platform API paths
  const path =
    endpoint === '/messages'
      ? '/api/marketa/qubetalk'
      : endpoint === '/channels'
        ? '/api/marketa/qubetalk/channels'
        : '/api/marketa/qubetalk/transfers';

  const url = new URL(path, window.location.origin);
  if (tenantId) url.searchParams.set('tenant_id', tenantId);
  if (request.query) {
    for (const [k, v] of Object.entries(request.query)) {
      if (v === undefined || v === null) continue;
      url.searchParams.set(k, String(v));
    }
  }

  const body =
    method === 'GET'
      ? undefined
      : JSON.stringify({
          ...(typeof request.body === 'object' && request.body ? (request.body as Record<string, unknown>) : {}),
          ...(tenantId ? { tenant_id: tenantId } : {}),
        });

  const resp = await fetch(url.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body,
  });

  const text = await resp.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!resp.ok) {
    const msg = (json as any)?.error || `QubeTalk request failed (${resp.status})`;
    throw new Error(msg);
  }
  return json as T;
}

async function invoke<T>(request: ProxyRequest): Promise<T> {
  try {
    return await proxyInvoke<T>(request);
  } catch (e) {
    // In dev it is safe to fall back to same-origin `/api` proxy.
    if (isLocalhost()) {
      return directInvoke<T>(request);
    }
    throw e;
  }
}

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
    const data = await invoke<ListResponse<QubeTalkMessage, 'messages'>>({
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

    return invoke<QubeTalkMessage>({
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
    const data = await invoke<ListResponse<ContentTransfer, 'transfers'>>({
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
    return invoke<ContentTransfer>({
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
    const data = await invoke<ListResponse<QubeTalkChannel, 'channels'>>({
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
    return invoke<QubeTalkChannel>({
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
