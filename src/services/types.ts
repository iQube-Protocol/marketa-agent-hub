/** Core type definitions for Marketa Console */

export type Phase = 'codex1' | 'regcf' | 'pre_fairlaunch' | 'fairlaunch';

export type Channel = 
  | 'linkedin' 
  | 'x' 
  | 'instagram' 
  | 'tiktok' 
  | 'newsletter' 
  | 'discord' 
  | 'telegram' 
  | 'whatsapp' 
  | 'sms';

export type PackType = 'owned_wpp' | 'partner_wpp';

export type PackStatus = 'draft' | 'pending_approval' | 'approved' | 'sent' | 'rejected';

export type RoleType = 'affiliate' | 'influencer' | 'media' | 'strategic';

export type ValueTier = 0 | 1 | 2 | 3 | 4;

export type EngagementTier = 'cold' | 'warm' | 'active' | 'advocate';

export interface Partner {
  id: string;
  name: string;
  code: string;
  roleType: RoleType;
  channels: Channel[];
  webhookUrl?: string;
  webhookStatus: 'active' | 'inactive' | 'error';
  brandConstraints?: Record<string, unknown>;
  approvalContacts: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PackItem {
  id: string;
  threadLabel: string;
  modeLabel: string;
  cta: string;
  utmLinks: Record<Channel, string>;
  copy: string;
  hashtags: string[];
  platformVariants: Record<Channel, string>;
}

export interface Pack {
  id: string;
  type: PackType;
  partnerId?: string;
  partnerName?: string;
  phase: Phase;
  channels: Channel[];
  weekOf: string;
  tone: string;
  status: PackStatus;
  version: number;
  items: {
    hero?: PackItem;
    short1?: PackItem;
    short2?: PackItem;
    short3?: PackItem;
    newsletter?: PackItem;
    community?: PackItem;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  phase: Phase;
  packId: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  metrics: CampaignMetrics;
}

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  engagement: number;
}

export interface DeliveryLog {
  id: string;
  packId: string;
  channel: Channel;
  status: 'success' | 'failed' | 'pending';
  deliveredAt: string;
  url?: string;
  error?: string;
}

export interface CRMEvent {
  id: string;
  type: string;
  profileId: string;
  data: Record<string, unknown>;
  createdAt: string;
}

export interface Segment {
  id: string;
  name: string;
  valueTiers: ValueTier[];
  engagementTiers: EngagementTier[];
  mythosBias: boolean;
  logosBias: boolean;
  builderFlag: boolean;
  partnerAffinity?: string;
  emailOptIn: boolean;
  smsOptIn: boolean;
  whatsappOptIn: boolean;
  count?: number;
}

export interface KPIStats {
  packsPendingApproval: number;
  packsApproved: number;
  packsSent: number;
  rewardsKnyt: number;
  rewardsQc: number;
}

export interface ReportSummary {
  totalCampaigns: number;
  activePartners: number;
  totalDeliveries: number;
  engagementRate: number;
  conversionRate: number;
  rewardsIssued: number;
}

export interface ChannelPerformance {
  channel: Channel;
  deliveries: number;
  opens: number;
  clicks: number;
  conversions: number;
}

export interface TimeSeriesData {
  date: string;
  value: number;
}

export interface PublishTarget {
  type: 'owned' | 'partner';
  channel: Channel;
  partnerId?: string;
  segment?: string;
  webhookUrl?: string;
}

export interface PublishResult {
  target: PublishTarget;
  status: 'success' | 'failed';
  deliveryUrl?: string;
  error?: string;
  timestamp: string;
}
