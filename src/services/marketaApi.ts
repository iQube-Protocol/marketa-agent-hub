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
    await delay(200);
    // Mock config - in production this would call the bridge endpoint
    // GET /api/marketa/lvb/bridge?action=config
    
    // Check URL for test mode override
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get('mode') || testMode;
    
    // Sample Partner Account for testing
    if (modeParam === 'partner') {
      const partnerConfig: TenantConfig = {
        role: 'partnerAdmin',
        tenant_id: 'tenant_agq_partner_001',
        persona_id: 'persona_partner_test_001',
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
    
    // Sample Analyst Account
    if (modeParam === 'analyst') {
      const analystConfig: TenantConfig = {
        role: 'analyst',
        tenant_id: 'tenant_agq_001',
        persona_id: 'persona_analyst_001',
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
    
    // Default: Admin Account
    const mockConfig: TenantConfig = {
      role: 'agqAdmin',
      tenant_id: 'tenant_agq_001',
      persona_id: 'persona_admin_001',
      feature_flags: {
        qubetalk_enabled: true,
        make_enabled: true,
        partner_rewards_phase2_enabled: false,
      },
      partner_name: 'AGQ Admin',
      partner_code: 'AGQ',
    };
    
    // Set tenant context for subsequent API calls
    setTenantContext({
      tenant_id: mockConfig.tenant_id,
      persona_id: mockConfig.persona_id,
    });
    
    return mockConfig;
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
    await delay(300);
    return [
      {
        id: CAMPAIGN_21_AWAKENINGS_ID,
        name: '21 Awakenings',
        description: 'A 21-day journey of daily video insights and share-to-earn opportunities',
        type: 'sequence',
        status: 'available',
        duration_days: 22, // Includes day 0 explainer
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
  },

  /** Join a campaign - POST /api/marketa/partner/campaigns?action=join */
  async joinCampaign(data: {
    campaignId: string;
    channels?: string[];
    start_date?: string;
  }): Promise<PartnerJoinResponse> {
    await delay(400);
    // In production: POST /api/marketa/partner/campaigns?action=join
    // Headers: x-tenant-id, x-persona-id
    return {
      success: true,
      participant: {
        id: `participant_${Date.now()}`,
        campaign_id: data.campaignId,
        tenant_id: tenantContext.tenant_id || '',
        persona_id: tenantContext.persona_id || '',
        joined_at: new Date().toISOString(),
        channels: data.channels || [],
        status: 'active',
      },
      joined_at: new Date().toISOString(),
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
    await delay(300);
    
    // Generate 22 sequence items (day 0-21) for 21 Awakenings
    const sequenceItems: MarketaSequenceItem[] = [];
    
    // Day 0 - Main Explainer
    sequenceItems.push({
      day_number: 0,
      title: 'Welcome to 21 Awakenings',
      description: 'An introduction to your 21-day journey of awakening and transformation.',
      asset_ref: 'smart_content_qubes:21aw_explainer_main',
      cta_url: 'https://content.qriptopian.io/21awakenings/day0-explainer',
      thumbnail_url: 'https://content.qriptopian.io/21awakenings/thumbnails/day0.jpg',
      explainer: true,
      status: 'delivered',
    });
    
    // Day 1 - With explainer tag
    sequenceItems.push({
      day_number: 1,
      title: 'The First Awakening',
      description: 'Begin your journey with the first awakening - understanding your digital identity.',
      asset_ref: 'smart_content_qubes:21aw_day1_awakening',
      cta_url: 'https://content.qriptopian.io/21awakenings/day1',
      thumbnail_url: 'https://content.qriptopian.io/21awakenings/thumbnails/day1.jpg',
      explainer: true,
      status: 'delivered',
    });
    
    // Days 2-21
    const dayTitles = [
      'Identity Sovereignty', 'Data Ownership', 'Privacy Fundamentals', 
      'Decentralized Trust', 'Digital Autonomy', 'Reputation Systems',
      'Verified Credentials', 'Token Economics', 'Community Building',
      'Value Exchange', 'Smart Contracts', 'Governance Models',
      'Sustainable Growth', 'Network Effects', 'Innovation Mindset',
      'Collaborative Action', 'Future Vision', 'Integration Practice',
      'Mastery Application', 'Community Leadership'
    ];
    
    for (let i = 2; i <= 21; i++) {
      sequenceItems.push({
        day_number: i,
        title: `Day ${i}: ${dayTitles[i - 2] || 'Awakening ' + i}`,
        description: `Daily insight for day ${i} of your awakening journey.`,
        asset_ref: `smart_content_qubes:21aw_day${i}`,
        cta_url: `https://content.qriptopian.io/21awakenings/day${i}`,
        thumbnail_url: i === 8 ? null : `https://content.qriptopian.io/21awakenings/thumbnails/day${i}.jpg`, // Day 8 test case for null thumbnail
        explainer: false,
        status: i <= 5 ? 'delivered' : 'pending',
      });
    }
    
    return {
      campaign: {
        id: campaignId,
        name: '21 Awakenings',
        description: 'A 21-day journey of daily video insights and share-to-earn opportunities through the Qriptopian ecosystem.',
        type: 'sequence',
        status: 'active',
        creator_role: 'admin',
        start_date: '2024-02-01',
        channels: ['x', 'instagram', 'tiktok', 'linkedin'],
        created_at: '2024-01-15T10:00:00Z',
        updated_at: new Date().toISOString(),
      },
      marketa_sequence_items: sequenceItems,
      marketa_partner_rewards: [
        {
          id: 'reward_knyt_share',
          reward_type: 'knyt',
          reward_value: '50 KNYT per share',
          reward_terms: 'Earn KNYT tokens for each verified share through Smart Actions',
        },
        {
          id: 'reward_qc_completion',
          reward_type: 'qc',
          reward_value: '500 Qc',
          reward_terms: 'Complete all 21 days to earn bonus Qc tokens',
        },
      ],
    };
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
    await delay(300);
    return {
      status: 'active',
      current_day: 5,
      total_days: 22,
      is_joined: true,
      joined_at: '2024-02-01T10:00:00Z',
      receipts: [
        { id: 'r1', channel: 'x', status: 'delivered', url: 'https://x.com/status/day5' },
        { id: 'r2', channel: 'instagram', status: 'delivered', url: 'https://instagram.com/p/day5' },
      ],
    };
  },

  /**
   * Track partner engagement events
   * POST /api/marketa/partner/events
   * Used for analytics in Marketa agent
   */
  async trackPartnerEvent(event: PartnerEventPayload): Promise<{ success: boolean; event_id: string }> {
    await delay(100);
    console.log('[Marketa Event]', event);
    // In production: POST /api/marketa/partner/events
    // Headers: x-tenant-id, x-persona-id
    return {
      success: true,
      event_id: `event_${Date.now()}_${event.event_type}`,
    };
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
    return {
      publishing_method: 'make',
      make_webhook_url: '',
      webhook_health: {
        status: 'unknown',
      },
    };
  },

  /** Update partner settings */
  async updatePartnerSettings(settings: Partial<PartnerSettings>): Promise<PartnerSettings> {
    await delay(400);
    return {
      publishing_method: settings.publishing_method || 'manual',
      make_webhook_url: settings.make_webhook_url,
      webhook_health: {
        status: settings.make_webhook_url ? 'unknown' : 'unknown',
      },
    };
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
