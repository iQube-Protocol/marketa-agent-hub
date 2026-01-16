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

// Simulated delay for realistic UX
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
};
