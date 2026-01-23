/** API Client for Marketa Console - Mock implementation */

import type {
  Partner,
  Pack,
  Campaign,
  DeliveryLog,
  CRMEvent,
  KPIStats,
  ReportSummary,
  ChannelPerformance,
  TimeSeriesData,
  Segment,
  PublishTarget,
  PublishResult,
  Phase,
  Channel,
  PackType,
} from './types';

import type {
  TenantConfig,
  PartnerPack,
  CustomCampaign,
  CampaignCatalogItem,
  TenantPerformance,
  WebhookTestResult,
  MakeSetupGuide,
  PartnerSettings,
  DeliveryReceipt,
  MarketaCampaignDetail,
  MarketaSequenceItem,
  PartnerEventPayload,
  PartnerJoinResponse,
} from './configTypes';

// Campaign constants
export const CAMPAIGN_21_AWAKENINGS_ID = 'campaign_1768709183190_qq6f0x0sj';

// Simulated delay for realistic UX
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const AGENTIQ_API_URL = (import.meta as any).env?.VITE_AGENTIQ_API_URL as string | undefined;
const PUBLIC_PERSONA_ID = (import.meta as any).env?.VITE_PUBLIC_PERSONA_ID as string | undefined;

const PERSONA_STORAGE_KEY = 'marketa_persona_id';
const TENANT_STORAGE_KEY = 'marketa_tenant_id';
const MODE_STORAGE_KEY = 'marketa_mode';
const HANDLE_CACHE_STORAGE_KEY = 'marketa_handle_id_cache_v1';
const PARTNER_SETTINGS_STORAGE_KEY = 'marketa_partner_settings_v1';

function resolveBridgeContext(): { tenant_id?: string; persona_id?: string; mode?: 'admin' | 'partner' | 'analyst' } {
  const urlParams = new URLSearchParams(window.location.search);
  const personaParam = urlParams.get('persona') || undefined;
  const tenantParam = urlParams.get('tenant') || undefined;
  const modeParam = (urlParams.get('mode') as 'admin' | 'partner' | 'analyst' | null) || undefined;

  const storedPersona = window.localStorage.getItem(PERSONA_STORAGE_KEY) || undefined;
  const storedTenant = window.localStorage.getItem(TENANT_STORAGE_KEY) || undefined;
  const storedMode = (window.localStorage.getItem(MODE_STORAGE_KEY) as 'admin' | 'partner' | 'analyst' | null) || undefined;

  const persona_id = personaParam || storedPersona || (PUBLIC_PERSONA_ID || undefined);
  const tenant_id = tenantParam || storedTenant || undefined;
  const mode = modeParam || storedMode || undefined;

  if (personaParam) window.localStorage.setItem(PERSONA_STORAGE_KEY, personaParam);
  if (tenantParam) window.localStorage.setItem(TENANT_STORAGE_KEY, tenantParam);
  if (modeParam) window.localStorage.setItem(MODE_STORAGE_KEY, modeParam);

  return { tenant_id, persona_id, mode };
}

function getBridgeHeaders(): Record<string, string> {
  const resolved = resolveBridgeContext();
  return {
    ...getTenantHeaders(),
    ...(resolved.tenant_id ? { 'x-tenant-id': resolved.tenant_id } : {}),
    ...(resolved.persona_id ? { 'x-persona-id': resolved.persona_id } : {}),
  };
}

function partnerSettingsStorageKey(): string {
  const ctx = resolveBridgeContext();
  const tenant = ctx.tenant_id || 'unknown-tenant';
  const persona = ctx.persona_id || 'unknown-persona';
  return `${PARTNER_SETTINGS_STORAGE_KEY}:${tenant}:${persona}`;
}

function readPartnerSettings(): PartnerSettings | null {
  try {
    const raw = window.localStorage.getItem(partnerSettingsStorageKey());
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PartnerSettings;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writePartnerSettings(next: PartnerSettings) {
  try {
    window.localStorage.setItem(partnerSettingsStorageKey(), JSON.stringify(next));
  } catch {
    // ignore
  }
}

function resolveApiBaseUrl(): string {
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  if (isLocal) {
    // Prefer same-origin in local dev so Vite's `/api` proxy can handle CORS.
    return '';
  }
  return AGENTIQ_API_URL || '';
}

function readHandleCache(): Record<string, { persona_id?: string; tenant_id?: string }> {
  try {
    const raw = window.localStorage.getItem(HANDLE_CACHE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, { persona_id?: string; tenant_id?: string }>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeHandleCache(next: Record<string, { persona_id?: string; tenant_id?: string }>) {
  try {
    window.localStorage.setItem(HANDLE_CACHE_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export async function resolvePersonaAndTenant(input: string): Promise<{ persona_id?: string; tenant_id?: string }> {
  const trimmed = input.trim();
  if (!trimmed) return {};

  const cache = readHandleCache();
  const cached = cache[trimmed];
  if (cached?.persona_id || cached?.tenant_id) {
    return cached;
  }

  if (!trimmed.includes('@')) {
    const result = { persona_id: trimmed };
    writeHandleCache({ ...cache, [trimmed]: result });
    return result;
  }

  const baseUrl = resolveApiBaseUrl();
  const url = `${baseUrl}/api/identity/persona/${encodeURIComponent(trimmed)}`;

  const resp = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!resp.ok) {
    return {};
  }

  const data = (await resp.json()) as any;
  const persona_id = data?.id || data?.persona_id || data?.persona?.id || data?.persona?.persona_id;
  const tenant_id = data?.tenant_id || data?.persona?.tenant_id || data?.tenant?.tenant_id;
  const resolved = {
    ...(persona_id ? { persona_id: String(persona_id) } : {}),
    ...(tenant_id ? { tenant_id: String(tenant_id) } : {}),
  };

  writeHandleCache({ ...cache, [trimmed]: resolved });
  return resolved;
}

function getFallbackCampaignCatalog(): CampaignCatalogItem[] {
  return [
    {
      id: CAMPAIGN_21_AWAKENINGS_ID,
      name: '21 Awakenings',
      description: 'A 21-day journey of daily video insights and share-to-earn opportunities',
      type: 'sequence',
      status: 'available',
      duration_days: 22,
      channels: ['x', 'instagram', 'tiktok', 'linkedin'],
      is_joined: false,
    },
    {
      id: 'camp_regcf_launch',
      name: 'RegCF Launch Campaign',
      description: 'Coordinated launch campaign for the RegCF investment round',
      type: 'custom',
      status: 'active',
      start_date: '2024-02-01',
      channels: ['linkedin', 'newsletter', 'discord'],
      is_joined: true,
    },
  ];
}

function getFallbackCampaignDetail(campaignId: string): MarketaCampaignDetail {
  const now = new Date().toISOString();

  if (campaignId !== CAMPAIGN_21_AWAKENINGS_ID) {
    return {
      campaign: {
        id: campaignId,
        name: 'Campaign',
        description: 'Campaign details unavailable',
        type: 'custom',
        status: 'active',
        creator_role: 'admin',
        channels: [],
        created_at: now,
        updated_at: now,
      },
      marketa_sequence_items: [],
      marketa_partner_rewards: [],
    };
  }

  const items: MarketaSequenceItem[] = Array.from({ length: 21 }).map((_, idx) => {
    const day = idx + 1;
    return {
      day_number: day,
      title: `Day ${day}`,
      description: 'Daily awakening content',
      asset_ref: `awakenings/day-${day}`,
      cta_url: '',
      thumbnail_url: null,
      explainer: day === 1,
      status: 'pending',
    };
  });

  return {
    campaign: {
      id: CAMPAIGN_21_AWAKENINGS_ID,
      name: '21 Awakenings',
      description: 'A 21-day journey of daily video insights and share-to-earn opportunities',
      type: 'sequence',
      status: 'active',
      creator_role: 'admin',
      start_date: undefined,
      end_date: undefined,
      channels: ['x', 'instagram', 'tiktok', 'linkedin'],
      created_at: now,
      updated_at: now,
    },
    marketa_sequence_items: items,
    marketa_partner_rewards: [],
  };
}

async function bridgeGet<T>(action: string, query?: Record<string, string | number | boolean | undefined>): Promise<T> {
  const baseUrl = resolveApiBaseUrl();
  if (!baseUrl && !AGENTIQ_API_URL && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    throw new Error('Missing VITE_AGENTIQ_API_URL');
  }

  const params = new URLSearchParams({ action });
  Object.entries(query || {}).forEach(([k, v]) => {
    if (v === undefined) return;
    params.set(k, String(v));
  });

  const res = await fetch(`${baseUrl}/api/marketa/lvb/bridge?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getBridgeHeaders(),
    },
  });
  const json = await res.json();
  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || `Bridge GET failed (${action})`);
  }
  return json as T;
}

function getDevOverrideHeaders(): Record<string, string> {
  const modeQuery = new URLSearchParams(window.location.search).get('mode');
  if (modeQuery === 'admin') {
    return { 'x-dev-override': 'true' };
  }
  return {};
}

async function adminCampaignsGet<T>(query: Record<string, string | number | boolean | undefined>): Promise<T> {
  const baseUrl = resolveApiBaseUrl();
  const params = new URLSearchParams();
  Object.entries(query || {}).forEach(([k, v]) => {
    if (v === undefined) return;
    params.set(k, String(v));
  });

  const res = await fetch(`${baseUrl}/api/marketa/admin/campaigns?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getBridgeHeaders(),
      ...getDevOverrideHeaders(),
    },
  });
  const json = await res.json();
  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || `Admin campaigns GET failed (${params.get('action') || 'unknown'})`);
  }
  return json as T;
}

async function bridgePost<T>(action: string, body?: Record<string, unknown>): Promise<T> {
  const baseUrl = resolveApiBaseUrl();
  if (!baseUrl && !AGENTIQ_API_URL && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    throw new Error('Missing VITE_AGENTIQ_API_URL');
  }

  const res = await fetch(`${baseUrl}/api/marketa/lvb/bridge?action=${encodeURIComponent(action)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getBridgeHeaders(),
    },
    body: JSON.stringify(body || {}),
  });
  const json = await res.json();
  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || `Bridge POST failed (${action})`);
  }
  return json as T;
}

// Tenant context for API headers
let tenantContext: { tenant_id?: string; persona_id?: string } = {};

/** Set tenant context for all API calls */
export function setTenantContext(context: { tenant_id: string; persona_id: string }) {
  tenantContext = context;
}

/** Get headers with tenant context */
export function getTenantHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (tenantContext.tenant_id) {
    headers['x-tenant-id'] = tenantContext.tenant_id;
  }
  if (tenantContext.persona_id) {
    headers['x-persona-id'] = tenantContext.persona_id;
  }
  return headers;
}

// Mock data generators
const mockPartners: Partner[] = [
  {
    id: '1',
    name: 'Tech Influencer Network',
    code: 'TIN',
    roleType: 'influencer',
    channels: ['x', 'linkedin', 'instagram'],
    webhookUrl: 'https://hooks.make.com/tin-webhook',
    webhookStatus: 'active',
    approvalContacts: ['john@tin.co', 'sarah@tin.co'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
  },
  {
    id: '2',
    name: 'Crypto Media Group',
    code: 'CMG',
    roleType: 'media',
    channels: ['newsletter', 'telegram', 'discord'],
    webhookUrl: 'https://hooks.make.com/cmg-webhook',
    webhookStatus: 'active',
    approvalContacts: ['editor@cmg.io'],
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-18T11:00:00Z',
  },
  {
    id: '3',
    name: 'DeFi Affiliates',
    code: 'DFA',
    roleType: 'affiliate',
    channels: ['x', 'telegram'],
    webhookStatus: 'inactive',
    approvalContacts: ['partners@dfa.xyz'],
    createdAt: '2024-01-05T08:00:00Z',
    updatedAt: '2024-01-05T08:00:00Z',
  },
];

const mockPacks: Pack[] = [
  {
    id: '1',
    type: 'owned_wpp',
    phase: 'regcf',
    channels: ['linkedin', 'x', 'newsletter'],
    weekOf: '2024-01-22',
    tone: 'Professional & Inspiring',
    status: 'approved',
    version: 2,
    items: {
      hero: {
        id: 'h1',
        threadLabel: 'Main Announcement',
        modeLabel: 'Hero',
        cta: 'Join the Revolution',
        utmLinks: {} as Record<Channel, string>,
        copy: 'The future of marketing is here. AigentZ revolutionizes how brands connect with audiences.',
        hashtags: ['#AigentZ', '#MarketingAI', '#Web3'],
        platformVariants: {} as Record<Channel, string>,
      },
    },
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-21T14:30:00Z',
  },
  {
    id: '2',
    type: 'partner_wpp',
    partnerId: '1',
    partnerName: 'Tech Influencer Network',
    phase: 'regcf',
    channels: ['instagram', 'tiktok'],
    weekOf: '2024-01-22',
    tone: 'Casual & Engaging',
    status: 'pending_approval',
    version: 1,
    items: {},
    createdAt: '2024-01-21T09:00:00Z',
    updatedAt: '2024-01-21T09:00:00Z',
  },
  {
    id: '3',
    type: 'owned_wpp',
    phase: 'pre_fairlaunch',
    channels: ['discord', 'telegram'],
    weekOf: '2024-01-29',
    tone: 'Community-focused',
    status: 'draft',
    version: 1,
    items: {},
    createdAt: '2024-01-22T08:00:00Z',
    updatedAt: '2024-01-22T08:00:00Z',
  },
];

const mockDeliveryLogs: DeliveryLog[] = [
  { id: '1', packId: '1', channel: 'linkedin', status: 'success', deliveredAt: '2024-01-22T10:00:00Z', url: 'https://linkedin.com/post/123' },
  { id: '2', packId: '1', channel: 'x', status: 'success', deliveredAt: '2024-01-22T10:05:00Z', url: 'https://x.com/status/456' },
  { id: '3', packId: '1', channel: 'newsletter', status: 'pending', deliveredAt: '2024-01-22T10:10:00Z' },
  { id: '4', packId: '2', channel: 'instagram', status: 'failed', deliveredAt: '2024-01-22T11:00:00Z', error: 'Rate limit exceeded' },
];

const mockCRMEvents: CRMEvent[] = [
  { id: '1', type: 'signup', profileId: 'p1', data: { source: 'linkedin' }, createdAt: '2024-01-22T12:00:00Z' },
  { id: '2', type: 'engagement', profileId: 'p2', data: { action: 'click' }, createdAt: '2024-01-22T11:30:00Z' },
  { id: '3', type: 'conversion', profileId: 'p3', data: { amount: 500 }, createdAt: '2024-01-22T11:00:00Z' },
];

/** Marketa API Client */
export const marketaApi = {
  // Dashboard
  async getKPIStats(phase?: Phase): Promise<KPIStats> {
    await delay(300);
    return {
      packsPendingApproval: 3,
      packsApproved: 12,
      packsSent: 45,
      rewardsKnyt: 125000,
      rewardsQc: 8500,
    };
  },

  async getRecentActivity(): Promise<{ logs: DeliveryLog[]; events: CRMEvent[] }> {
    await delay(200);
    return {
      logs: mockDeliveryLogs,
      events: mockCRMEvents,
    };
  },

  // ============ Admin Campaign Management (Live) ==========

  async getAdminCampaigns(): Promise<Array<{ id: string; name: string; description: string; type: 'custom' | 'sequence' | 'wpp'; status: string; sequence_length?: number; created_at?: string }>> {
    const response = await adminCampaignsGet<{ success: boolean; campaigns: any[] }>({ action: 'list' });
    const campaigns = response.campaigns || [];
    return campaigns.map((c: any) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      type: c.campaign_type,
      status: c.status,
      sequence_length: c.sequence_length,
      created_at: c.created_at,
    }));
  },

  // Partners
  async getPartners(): Promise<Partner[]> {
    await delay(300);
    return mockPartners;
  },

  async getPartner(id: string): Promise<Partner | null> {
    await delay(200);
    return mockPartners.find(p => p.id === id) || null;
  },

  async createPartner(data: Omit<Partner, 'id' | 'createdAt' | 'updatedAt'>): Promise<Partner> {
    await delay(400);
    const partner: Partner = {
      ...data,
      id: String(Date.now()),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockPartners.push(partner);
    return partner;
  },

  async updatePartner(id: string, data: Partial<Partner>): Promise<Partner> {
    await delay(400);
    const index = mockPartners.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Partner not found');
    mockPartners[index] = { ...mockPartners[index], ...data, updatedAt: new Date().toISOString() };
    return mockPartners[index];
  },

  async deletePartner(id: string): Promise<void> {
    await delay(300);
    const index = mockPartners.findIndex(p => p.id === id);
    if (index !== -1) mockPartners.splice(index, 1);
  },

  async testWebhook(partnerId: string): Promise<{ success: boolean; message: string }> {
    await delay(500);
    return { success: true, message: 'Webhook responded with 200 OK' };
  },

  // Packs
  async getPacks(): Promise<Pack[]> {
    await delay(300);
    return mockPacks;
  },

  async getPack(id: string): Promise<Pack | null> {
    await delay(200);
    return mockPacks.find(p => p.id === id) || null;
  },

  async generatePack(config: {
    type: PackType;
    partnerId?: string;
    phase: Phase;
    channels: Channel[];
    weekOf: string;
    tone: string;
  }): Promise<Pack> {
    await delay(1500); // Simulate AI generation
    const pack: Pack = {
      id: String(Date.now()),
      ...config,
      status: 'draft',
      version: 1,
      items: {
        hero: {
          id: 'h' + Date.now(),
          threadLabel: 'Main Announcement',
          modeLabel: 'Hero',
          cta: 'Learn More',
          utmLinks: {} as Record<Channel, string>,
          copy: 'Generated content for your campaign...',
          hashtags: ['#AigentZ', '#Marketing'],
          platformVariants: {} as Record<Channel, string>,
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockPacks.push(pack);
    return pack;
  },

  async approvePack(id: string): Promise<Pack> {
    await delay(400);
    const pack = mockPacks.find(p => p.id === id);
    if (!pack) throw new Error('Pack not found');
    pack.status = 'approved';
    pack.updatedAt = new Date().toISOString();
    return pack;
  },

  async requestEdits(id: string, feedback: string): Promise<Pack> {
    await delay(400);
    const pack = mockPacks.find(p => p.id === id);
    if (!pack) throw new Error('Pack not found');
    pack.status = 'pending_approval';
    pack.updatedAt = new Date().toISOString();
    return pack;
  },

  async regeneratePack(id: string): Promise<Pack> {
    await delay(1500);
    const pack = mockPacks.find(p => p.id === id);
    if (!pack) throw new Error('Pack not found');
    pack.version += 1;
    pack.updatedAt = new Date().toISOString();
    return pack;
  },

  // Publishing
  async publish(packId: string, targets: PublishTarget[], dryRun: boolean, scheduledAt?: string): Promise<PublishResult[]> {
    await delay(800);
    return targets.map(target => ({
      target,
      status: Math.random() > 0.1 ? 'success' : 'failed',
      deliveryUrl: `https://${target.channel}.com/post/${Date.now()}`,
      timestamp: new Date().toISOString(),
    }));
  },

  // Segments
  async previewSegment(segment: Omit<Segment, 'id' | 'name' | 'count'>): Promise<{ count: number; sampleIds: string[] }> {
    await delay(400);
    return {
      count: Math.floor(Math.random() * 5000) + 500,
      sampleIds: ['p1', 'p2', 'p3', 'p4', 'p5'],
    };
  },

  // Reports
  async getReportSummary(startDate: string, endDate: string): Promise<ReportSummary> {
    await delay(300);
    return {
      totalCampaigns: 24,
      activePartners: 8,
      totalDeliveries: 1250,
      engagementRate: 0.142,
      conversionRate: 0.038,
      rewardsIssued: 45000,
    };
  },

  async getCampaignPerformance(startDate: string, endDate: string): Promise<TimeSeriesData[]> {
    await delay(300);
    const data: TimeSeriesData[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
      data.push({
        date: d.toISOString().split('T')[0],
        value: Math.floor(Math.random() * 1000) + 200,
      });
    }
    return data;
  },

  async getChannelPerformance(): Promise<ChannelPerformance[]> {
    await delay(300);
    const channels: Channel[] = ['linkedin', 'x', 'instagram', 'newsletter', 'discord', 'telegram'];
    return channels.map(channel => ({
      channel,
      deliveries: Math.floor(Math.random() * 500) + 100,
      opens: Math.floor(Math.random() * 300) + 50,
      clicks: Math.floor(Math.random() * 150) + 20,
      conversions: Math.floor(Math.random() * 50) + 5,
    }));
  },

  // Rewards
  async issueReward(profileId: string, type: 'knyt' | 'qc', amount: number): Promise<{ success: boolean }> {
    await delay(400);
    return { success: true };
  },

  // CRM
  async logCRMEvent(type: string, profileId: string, data: Record<string, unknown>): Promise<CRMEvent> {
    await delay(200);
    return {
      id: String(Date.now()),
      type,
      profileId,
      data,
      createdAt: new Date().toISOString(),
    };
  },

  // ============ RBAC & Config ============
  
  /** Get application config including role, tenant, and feature flags */
  async getConfig(testMode?: 'partner' | 'admin' | 'analyst'): Promise<TenantConfig> {
    const resolved = resolveBridgeContext();
    const modeQuery = new URLSearchParams(window.location.search).get('mode');
    const isPartnerRoute = window.location.pathname.startsWith('/p/');
    const modeParam = modeQuery || (isPartnerRoute ? 'partner' : (resolved.mode || testMode));

    // Explicit test override: keep existing behavior for dev testing
    if (modeParam === 'partner') {
      const partnerConfig: TenantConfig = {
        role: 'partnerAdmin',
        tenant_id: resolved.tenant_id || 'metaproof',
        persona_id: resolved.persona_id || '',
        feature_flags: {
          qubetalk_enabled: true,
          make_enabled: true,
          partner_rewards_phase2_enabled: false,
        },
        partner_name: 'Test Partner Account',
        partner_code: 'TPA',
      };
      setTenantContext({
        tenant_id: partnerConfig.tenant_id,
        persona_id: partnerConfig.persona_id,
      });
      return partnerConfig;
    }

    if (modeParam === 'analyst') {
      const analystConfig: TenantConfig = {
        role: 'analyst',
        tenant_id: resolved.tenant_id || 'metaproof',
        persona_id: resolved.persona_id || '',
        feature_flags: {
          qubetalk_enabled: false,
          make_enabled: false,
          partner_rewards_phase2_enabled: false,
        },
      };
      setTenantContext({
        tenant_id: analystConfig.tenant_id,
        persona_id: analystConfig.persona_id,
      });
      return analystConfig;
    }

    if (modeParam === 'admin') {
      const adminConfig: TenantConfig = {
        role: 'agqAdmin',
        tenant_id: resolved.tenant_id || 'metaproof',
        persona_id: resolved.persona_id || '',
        feature_flags: {
          qubetalk_enabled: true,
          make_enabled: true,
          partner_rewards_phase2_enabled: false,
        },
        partner_name: 'AGQ Admin',
        partner_code: 'AGQ',
      };
      window.localStorage.setItem(MODE_STORAGE_KEY, 'admin');
      setTenantContext({
        tenant_id: adminConfig.tenant_id,
        persona_id: adminConfig.persona_id,
      });
      return adminConfig;
    }

    if (!resolved.persona_id || !resolved.tenant_id) {
      // Allow app to render read-only shell even if bridge context is not present
      return {
        role: 'anonymous',
        tenant_id: resolved.tenant_id || 'metaproof',
        persona_id: resolved.persona_id || '',
        feature_flags: {
          qubetalk_enabled: false,
          make_enabled: false,
          partner_rewards_phase2_enabled: false,
        },
      };
    }

    const response = await bridgeGet<{ success: boolean; config: any }>('config');
    const cfg = response.config;

    const mapped: TenantConfig = {
      role: (cfg.role || 'partnerAdmin') as TenantConfig['role'],
      tenant_id: cfg.tenant_id,
      persona_id: cfg.persona_id,
      feature_flags: {
        qubetalk_enabled: Boolean(cfg.feature_flags?.qubetalk_enabled ?? true),
        make_enabled: Boolean(cfg.feature_flags?.make_integration ?? cfg.feature_flags?.make_enabled ?? false),
        partner_rewards_phase2_enabled: Boolean(cfg.feature_flags?.partner_rewards ?? false),
      },
      partner_name: cfg.tenant_name,
      partner_code: cfg.tenant_type,
    };

    setTenantContext({ tenant_id: mapped.tenant_id, persona_id: mapped.persona_id });
    return mapped;
  },

  // ============ Partner Pack Endpoints ============

  /** Get pack queue for partner */
  async getPackQueue(): Promise<PartnerPack[]> {
    await delay(300);
    return [
      {
        id: 'pp1',
        week_of: '2024-01-29',
        status: 'pending',
        channels: ['linkedin', 'x', 'instagram'],
        items: [
          {
            id: 'ppi1',
            type: 'hero',
            content: 'Unlock the future of decentralized identity with Qriptopian. Join the revolution today! 🚀',
            cta: 'Learn More',
            hashtags: ['#Qriptopian', '#Web3', '#DecentralizedIdentity'],
          },
          {
            id: 'ppi2',
            type: 'short',
            content: 'Your identity, your control. #Qriptopian',
            hashtags: ['#SelfSovereign', '#Privacy'],
          },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  },

  /** Get pack detail for partner */
  async getPackDetail(packId: string): Promise<PartnerPack | null> {
    await delay(200);
    const queue = await this.getPackQueue();
    return queue.find(p => p.id === packId) || null;
  },

  /** Approve and publish pack */
  async approvePack_partner(data: {
    packId: string;
    selectedChannels: string[];
    scheduleWindows?: { channel: string; time: string }[];
    edits?: Record<string, string>;
    comments?: string;
  }): Promise<{ success: boolean; receipts: DeliveryReceipt[] }> {
    await delay(500);
    return {
      success: true,
      receipts: data.selectedChannels.map(channel => ({
        id: `receipt_${Date.now()}_${channel}`,
        channel,
        status: 'pending',
      })),
    };
  },

  /** Request edits on a pack */
  async requestPackEdits(packId: string, feedback: string): Promise<{ success: boolean }> {
    await delay(400);
    return { success: true };
  },

  /** Get publish status and receipts */
  async getPublishStatus(packId: string): Promise<DeliveryReceipt[]> {
    await delay(300);
    return [
      { id: 'r1', channel: 'linkedin', status: 'delivered', url: 'https://linkedin.com/post/123', delivered_at: new Date().toISOString() },
      { id: 'r2', channel: 'x', status: 'delivered', url: 'https://x.com/status/456', delivered_at: new Date().toISOString() },
      { id: 'r3', channel: 'instagram', status: 'pending' },
    ];
  },

  // ============ Campaign Endpoints ============

  /** Get campaign catalog (available + active campaigns) */
  async getCampaignCatalog(): Promise<CampaignCatalogItem[]> {
    try {
      const response = await bridgeGet<{
        success: boolean;
        available_campaigns: any[];
        joined_campaigns: any[];
      }>('campaign_catalog');

      const byId = new Map<string, CampaignCatalogItem>();

      for (const c of response.available_campaigns || []) {
        byId.set(c.id, {
          id: c.id,
          name: c.name,
          description: c.description,
          type: c.campaign_type,
          status: c.status === 'completed' ? 'completed' : 'available',
          start_date: c.start_date,
          duration_days: typeof c.sequence_length === 'number' ? c.sequence_length + 1 : undefined,
          channels: c.channels || [],
          is_joined: false,
        });
      }

      for (const joined of response.joined_campaigns || []) {
        const campaign = joined.marketa_campaigns;
        if (!campaign?.id) continue;
        byId.set(campaign.id, {
          id: campaign.id,
          name: campaign.name,
          description: campaign.description,
          type: campaign.campaign_type,
          status: joined.status === 'completed' ? 'completed' : 'active',
          start_date: joined.start_date,
          duration_days: typeof campaign.sequence_length === 'number' ? campaign.sequence_length + 1 : undefined,
          channels: joined.channels || [],
          is_joined: true,
        });
      }

      const result = Array.from(byId.values());
      return result.length > 0 ? result : getFallbackCampaignCatalog();
    } catch {
      return getFallbackCampaignCatalog();
    }
  },

  /** Join a campaign - POST /api/marketa/partner/campaigns?action=join */
  async joinCampaign(data: {
    campaignId: string;
    channels?: string[];
    start_date?: string;
  }): Promise<PartnerJoinResponse> {
    const resolved = resolveBridgeContext();
    const startDate = data.start_date || new Date().toISOString().split('T')[0];

    if (!resolved.persona_id || !resolved.tenant_id) {
      throw new Error('Missing persona/tenant context for join');
    }

    const response = await bridgePost<{ success: boolean; config: any }>('join_campaign', {
      campaignId: data.campaignId,
      channels: data.channels || [],
      startDate,
      publishingMode: 'automation',
    });

    const config = response.config;
    const joinedAt = config.joined_at || new Date().toISOString();

    return {
      success: true,
      participant: {
        id: config.id || `participant_${Date.now()}`,
        campaign_id: config.campaign_id || data.campaignId,
        tenant_id: config.tenant_id || resolved.tenant_id,
        persona_id: resolved.persona_id,
        joined_at: joinedAt,
        channels: config.channels || data.channels || [],
        status: config.status === 'joined' ? 'active' : 'active',
      },
      joined_at: joinedAt,
    };
  },

  /** Propose a new campaign (partner) */
  async proposeCampaign(data: {
    name: string;
    objective: string;
    duration: number;
    channels: string[];
    assets?: string[];
    notes?: string;
  }): Promise<{ success: boolean; campaign_id: string }> {
    await delay(500);
    return { success: true, campaign_id: `camp_${Date.now()}` };
  },

  /** 
   * Get campaign detail with sequence items 
   * GET /api/marketa/admin/campaigns?action=detail&campaignId={campaign_id}
   * Returns campaign object, marketa_sequence_items[], marketa_partner_rewards[]
   */
  async getCampaignDetailFull(campaignId: string): Promise<MarketaCampaignDetail> {
    try {
      const response = await bridgeGet<{ success: boolean; campaign: any }>('campaign_detail', { campaignId });
      const c = response.campaign;

      const sequenceItems: MarketaSequenceItem[] = (c.marketa_sequence_items || []).map((item: any) => ({
        day_number: item.day_number,
        title: item.title,
        description: item.description || '',
        asset_ref: item.asset_ref,
        cta_url: item.cta_url || '',
        thumbnail_url: item.thumbnail_url ?? null,
        explainer: Boolean(item.explainer),
        status: item.status || 'pending',
      }));

      const rewards = (c.marketa_partner_rewards || [])
        .filter((r: any) => r.active !== false)
        .map((r: any, idx: number) => ({
          id: r.id || `${r.reward_type || 'reward'}_${idx}`,
          reward_type: r.reward_type,
          reward_value: r.reward_value,
          reward_terms: r.reward_terms,
          reward_claim_url: r.reward_claim_url,
        }));

      return {
        campaign: {
          id: c.id,
          name: c.name,
          description: c.description,
          type: c.campaign_type,
          status: c.status,
          creator_role: c.created_by_persona_id ? 'partner' : 'admin',
          start_date: c.start_date,
          end_date: c.end_date,
          channels: c.channels || [],
          created_at: c.created_at || new Date().toISOString(),
          updated_at: c.updated_at || new Date().toISOString(),
        },
        marketa_sequence_items: sequenceItems,
        marketa_partner_rewards: rewards,
      };
    } catch {
      return getFallbackCampaignDetail(campaignId);
    }
  },

  /** Get campaign detail (legacy - for backwards compatibility) */
  async getCampaignDetail(campaignId: string): Promise<CustomCampaign | null> {
    const fullDetail = await this.getCampaignDetailFull(campaignId);
    return fullDetail.campaign;
  },

  /** Get campaign status (for partners) */
  async getCampaignStatus(campaignId: string): Promise<{
    status: string;
    current_day?: number;
    total_days?: number;
    is_joined: boolean;
    joined_at?: string;
    receipts: DeliveryReceipt[];
  }> {
    try {
      const response = await bridgeGet<{ success: boolean; config: any; recent_delivery_logs?: any[] }>('campaign_status', { campaignId });
      const cfg = response.config;
      const logs = response.recent_delivery_logs || [];
      const sequenceLength = cfg?.marketa_campaigns?.sequence_length;
      const totalDays = typeof sequenceLength === 'number' ? sequenceLength + 1 : undefined;

      const receipts: DeliveryReceipt[] = logs.map((l: any, idx: number) => ({
        id: l.id || `receipt_${idx}_${l.platform || l.channel || 'unknown'}`,
        channel: l.platform || l.channel || 'unknown',
        status: l.status || 'pending',
        url: l.url,
        delivered_at: l.published_at,
      }));

      return {
        status: cfg.status || 'active',
        current_day: cfg.current_day,
        total_days: totalDays,
        is_joined: true,
        joined_at: cfg.joined_at,
        receipts,
      };
    } catch {
      return {
        status: 'available',
        current_day: undefined,
        total_days: campaignId === CAMPAIGN_21_AWAKENINGS_ID ? 22 : undefined,
        is_joined: false,
        joined_at: undefined,
        receipts: [],
      };
    }
  },

  /**
   * Track partner engagement events
   * POST /api/marketa/partner/events
   * Used for analytics in Marketa agent
   */
  async trackPartnerEvent(event: PartnerEventPayload): Promise<{ success: boolean; event_id: string }> {
    const resolved = resolveBridgeContext();
    const personaId = event.persona_id || resolved.persona_id;

    const baseUrl = resolveApiBaseUrl();

    // If we can't attribute the event, don't hard-fail the UI.
    if ((!baseUrl && !AGENTIQ_API_URL) || !personaId) {
      console.log('[Marketa Event]', event);
      return {
        success: true,
        event_id: `event_${Date.now()}_${event.event_type}`,
      };
    }

    try {
      const res = await fetch(`${baseUrl}/api/engagement/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getBridgeHeaders(),
        },
        body: JSON.stringify({
          personaId,
          eventType: 'marketa_partner_event',
          contentId: event.asset_ref || event.campaign_id,
          contentType: 'marketa_campaign',
          metadata: {
            ...event,
            source: 'marketa-agent-hub',
          },
        }),
      });

      const json = await res.json();
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error || 'Engagement tracking failed');
      }

      return {
        success: true,
        event_id: json?.eventId || `event_${Date.now()}_${event.event_type}`,
      };
    } catch (err) {
      console.warn('[Marketa Event] Failed to send to server, falling back to local log', err);
      console.log('[Marketa Event]', event);
      return {
        success: true,
        event_id: `event_${Date.now()}_${event.event_type}`,
      };
    }
  },

  // ============ Partner Settings ============

  /** Test webhook connection */
  async testWebhook_partner(webhookUrl: string): Promise<WebhookTestResult> {
    await delay(600);
    return {
      success: true,
      message: 'Webhook responded with 200 OK',
      latency_ms: 145,
      last_success_at: new Date().toISOString(),
    };
  },

  /** Get Make setup guide */
  async getMakeSetupGuide(): Promise<MakeSetupGuide> {
    await delay(200);
    return {
      steps: [
        { step: 1, title: 'Create Make Account', description: 'Sign up for a free Make.com account', action_url: 'https://www.make.com/en/register' },
        { step: 2, title: 'Create New Scenario', description: 'Create a new scenario and add a Webhook trigger' },
        { step: 3, title: 'Configure Webhook', description: 'Copy the webhook URL and paste it in Partner Settings' },
        { step: 4, title: 'Add Social Actions', description: 'Add modules for LinkedIn, X, Instagram posting' },
        { step: 5, title: 'Test Integration', description: 'Use the Test button to verify your webhook works' },
      ],
    };
  },

  /** Get partner settings */
  async getPartnerSettings(): Promise<PartnerSettings> {
    await delay(200);
    const persisted = readPartnerSettings();
    if (persisted) return persisted;

    const initial: PartnerSettings = {
      publishing_method: 'make',
      make_webhook_url: '',
      webhook_health: {
        status: 'unknown',
      },
    };
    writePartnerSettings(initial);
    return initial;
  },

  /** Update partner settings */
  async updatePartnerSettings(settings: Partial<PartnerSettings>): Promise<PartnerSettings> {
    await delay(400);
    const current = readPartnerSettings() || {
      publishing_method: 'manual',
      make_webhook_url: '',
      webhook_health: { status: 'unknown' as const },
    };

    const next: PartnerSettings = {
      publishing_method: settings.publishing_method || current.publishing_method || 'manual',
      make_webhook_url: settings.make_webhook_url ?? current.make_webhook_url,
      webhook_health: {
        status: (settings.make_webhook_url ?? current.make_webhook_url) ? 'healthy' : 'unknown',
      },
    };

    writePartnerSettings(next);
    return next;
  },

  // ============ Partner Reports ============

  /** Get tenant performance (partner-scoped) */
  async getTenantPerformance(): Promise<TenantPerformance> {
    await delay(300);
    return {
      period: 'last_30_days',
      metrics: {
        clicks: 1250,
        impressions: 45000,
        activations: 89,
        conversions: 23,
        rewards_knyt: 12500,
        rewards_qc: 850,
      },
      campaigns: [
        {
          campaign_id: 'camp_21awakenings',
          campaign_name: '21 Awakenings',
          metrics: {
            clicks: 650,
            impressions: 22000,
            activations: 45,
            conversions: 12,
            rewards_knyt: 6500,
            rewards_qc: 450,
          },
        },
      ],
    };
  },

  /** Get campaign-specific performance */
  async getCampaignPerformance_partner(campaignId: string): Promise<{
    campaign_id: string;
    metrics: {
      clicks: number;
      impressions: number;
      activations: number;
      conversions: number;
      rewards_knyt: number;
      rewards_qc: number;
    };
    daily_data: { date: string; clicks: number; impressions: number }[];
  }> {
    await delay(300);
    return {
      campaign_id: campaignId,
      metrics: {
        clicks: 650,
        impressions: 22000,
        activations: 45,
        conversions: 12,
        rewards_knyt: 6500,
        rewards_qc: 450,
      },
      daily_data: [
        { date: '2024-01-25', clicks: 45, impressions: 1200 },
        { date: '2024-01-26', clicks: 52, impressions: 1350 },
        { date: '2024-01-27', clicks: 48, impressions: 1100 },
      ],
    };
  },
};
