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

// QubeTalk defaults (used only when no explicit tenant/persona context is set).
// For partner usage, QubeTalk should follow the active Marketa tenant/persona.
const DEFAULT_TENANT_ID = 'metaproof';
const DEFAULT_PERSONA_FALLBACK = 'qriptiq@knyt';

const QUBETALK_TENANT_STORAGE_KEY = 'marketa_qubetalk_tenant_id';
const QUBETALK_PERSONA_STORAGE_KEY = 'marketa_qubetalk_persona_id';

function readQubeTalkContext(): { tenantId?: string; personaId?: string } {
  const urlParams = new URLSearchParams(window.location.search);
  const tenantId =
    urlParams.get('qt_tenant') ||
    window.localStorage.getItem(QUBETALK_TENANT_STORAGE_KEY) ||
    urlParams.get('tenant') ||
    window.localStorage.getItem('marketa_tenant_id') ||
    undefined;

  const personaId =
    urlParams.get('qt_persona') ||
    window.localStorage.getItem(QUBETALK_PERSONA_STORAGE_KEY) ||
    urlParams.get('persona_handle') ||
    window.localStorage.getItem('marketa_persona_handle') ||
    urlParams.get('persona') ||
    window.localStorage.getItem('marketa_persona_id') ||
    undefined;

  return { tenantId: tenantId || undefined, personaId: personaId || undefined };
}

function ensureDefaultQubeTalkContext() {
  try {
    const existingTenant = window.localStorage.getItem(QUBETALK_TENANT_STORAGE_KEY);
    const existingPersona = window.localStorage.getItem(QUBETALK_PERSONA_STORAGE_KEY);
    if (!existingTenant) {
      const inferredTenant =
        new URLSearchParams(window.location.search).get('tenant') ||
        window.localStorage.getItem('marketa_tenant_id') ||
        DEFAULT_TENANT_ID;
      window.localStorage.setItem(QUBETALK_TENANT_STORAGE_KEY, inferredTenant);
    }
    if (!existingPersona) {
      const inferredPersona =
        new URLSearchParams(window.location.search).get('persona_handle') ||
        window.localStorage.getItem('marketa_persona_handle') ||
        new URLSearchParams(window.location.search).get('persona') ||
        window.localStorage.getItem('marketa_persona_id') ||
        DEFAULT_PERSONA_FALLBACK;
      window.localStorage.setItem(QUBETALK_PERSONA_STORAGE_KEY, inferredPersona);
    }
  } catch {
    // ignore
  }
}

const buildContextHeaders = (): Record<string, string> => {
  ensureDefaultQubeTalkContext();
  const tenantHeaders = getTenantHeaders();
  const urlParams = new URLSearchParams(window.location.search);
  
  // Priority: URL param > localStorage > tenantHeaders > default
  const ctx = readQubeTalkContext();
  const tenantId = ctx.tenantId
    || tenantHeaders['x-tenant-id'] 
    || DEFAULT_TENANT_ID;
  
  // For persona, we MUST always send a value - default to a known metaproof handle
  // This is CRITICAL - the proxy requires x-persona-id to resolve to a CRM UUID
  const personaId =
    ctx.personaId
    || tenantHeaders['x-persona-id']
    || DEFAULT_PERSONA_FALLBACK;
  
  const modeParam = urlParams.get('mode') || window.localStorage.getItem('marketa_mode') || '';
  const devOverride = isLocalhost() || modeParam === 'admin' || modeParam === 'partner';

  // ALWAYS return both required headers - never omit x-persona-id
  const headers: Record<string, string> = {
    'x-tenant-id': tenantId || DEFAULT_TENANT_ID,
    'x-persona-id': personaId || DEFAULT_PERSONA_FALLBACK,
  };
  
  if (devOverride) {
    headers['x-dev-override'] = 'true';
  }
  
  return headers;
};

const getTenantId = (): string => {
  const headers = buildContextHeaders();
  return headers['x-tenant-id'] || DEFAULT_TENANT_ID;
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

function deriveChannelName(input: { id?: string; channel_id?: string; participants?: string[] }): string {
  const participants = Array.isArray(input.participants) ? input.participants : [];
  const has = (p: string) => participants.includes(p);

  // Marketa-specific common channels
  if (has('marketa-agq') && has('marketa-lvb')) return 'Marketa (AGQ) ↔ Marketa (LVB)';
  if (has('aigent-z') && has('marketa-lvb')) return 'Aigent Z ↔ Marketa (LVB)';
  if (has('aigent-z') && has('marketa-agq')) return 'Aigent Z ↔ Marketa (AGQ)';

  const id = input.id || input.channel_id;
  if (id) return id;
  if (participants.length > 0) return participants.join(', ');
  return 'Unnamed Channel';
}

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
    // Platform expects 'message' field for text, not nested content object
    // Also expects 'recipient_agent' for routing
    const body: Record<string, unknown> = {
      channel_id: channelId,
      message: content,
      recipient_agent: 'marketa-agq', // Default recipient
    };

    // For non-text types, include payload
    if (contentType !== 'text' && payload) {
      body.content = {
        type: contentType,
        data: payload,
      };
    }

    return invoke<QubeTalkMessage>({
      endpoint: '/messages',
      method: 'POST',
      body,
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
    // Match platform expected payload format
    return invoke<ContentTransfer>({
      endpoint: '/transfers',
      method: 'POST',
      body: {
        recipient_agent: toAgent || 'marketa-agq',
        content: {
          type: contentType,
          name,
          data: content,
          metadata: iqubeFormat ? { iqube: iqubeFormat } : undefined,
        },
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
      name: ch.name || deriveChannelName({ id: ch.id, channel_id: (ch as any).channel_id, participants: (ch as any).participants }),
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
