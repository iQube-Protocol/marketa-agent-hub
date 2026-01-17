/** RBAC and Configuration Types for Marketa Console */

export type Role = 'partnerAdmin' | 'agqAdmin' | 'analyst';

export type CampaignType = 'wpp' | 'custom' | 'sequence';

export interface FeatureFlags {
  qubetalk_enabled: boolean;
  make_enabled: boolean;
  partner_rewards_phase2_enabled: boolean;
}

export interface TenantConfig {
  role: Role;
  tenant_id: string;
  persona_id: string;
  feature_flags: FeatureFlags;
  partner_name?: string;
  partner_code?: string;
}

export interface RewardsMetadata {
  reward_type: 'coupon' | 'claim_link' | 'access';
  reward_value: string;
  reward_terms: string;
  reward_claim_url: string;
}

export interface DeliveryReceipt {
  id: string;
  channel: string;
  status: 'pending' | 'delivered' | 'failed';
  url?: string;
  delivered_at?: string;
  error?: string;
}

export interface PartnerPack {
  id: string;
  week_of: string;
  status: 'pending' | 'approved' | 'published' | 'rejected';
  items: PartnerPackItem[];
  channels: string[];
  created_at: string;
  updated_at: string;
}

export interface PartnerPackItem {
  id: string;
  type: 'hero' | 'short' | 'newsletter' | 'community';
  content: string;
  media_url?: string;
  cta?: string;
  hashtags: string[];
  skip?: boolean;
}

export interface SequenceCampaign {
  id: string;
  name: string;
  description: string;
  type: 'sequence';
  total_days: number;
  days: SequenceDay[];
  share_to_earn_enabled: boolean;
}

export interface SequenceDay {
  day: number;
  title: string;
  content_id: string;
  preview_url?: string;
  share_link?: string;
  status?: 'pending' | 'delivered' | 'skipped';
}

export interface CustomCampaign {
  id: string;
  name: string;
  description: string;
  type: CampaignType;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  creator_role: 'admin' | 'partner';
  start_date?: string;
  end_date?: string;
  channels: string[];
  rewards?: RewardsMetadata;
  partner_participation?: PartnerParticipation[];
  created_at: string;
  updated_at: string;
}

export interface PartnerParticipation {
  tenant_id: string;
  partner_name: string;
  status: 'pending' | 'joined' | 'active' | 'completed';
  joined_at?: string;
  channels: string[];
  deployment_status?: 'pending' | 'deployed' | 'failed';
}

export interface CampaignCatalogItem {
  id: string;
  name: string;
  description: string;
  type: CampaignType;
  status: 'available' | 'active' | 'completed';
  start_date?: string;
  duration_days?: number;
  channels: string[];
  rewards?: RewardsMetadata;
  is_joined?: boolean;
}

export interface PerformanceMetrics {
  clicks: number;
  impressions: number;
  activations: number;
  conversions: number;
  rewards_knyt: number;
  rewards_qc: number;
}

export interface TenantPerformance {
  period: string;
  metrics: PerformanceMetrics;
  campaigns: {
    campaign_id: string;
    campaign_name: string;
    metrics: PerformanceMetrics;
  }[];
}

export interface WebhookTestResult {
  success: boolean;
  message: string;
  latency_ms?: number;
  last_success_at?: string;
}

export interface MakeSetupGuide {
  steps: {
    step: number;
    title: string;
    description: string;
    action_url?: string;
  }[];
}

export interface PartnerSettings {
  publishing_method: 'make' | 'manual' | 'community';
  make_webhook_url?: string;
  webhook_health?: {
    status: 'healthy' | 'unhealthy' | 'unknown';
    last_success_at?: string;
  };
}
