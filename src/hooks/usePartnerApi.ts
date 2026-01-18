/** Partner-specific hooks for Marketa API */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketaApi, CAMPAIGN_21_AWAKENINGS_ID } from '@/services/marketaApi';
import { useConfig } from '@/contexts/ConfigContext';
import type { PartnerEventPayload, MarketaCampaignDetail } from '@/services/configTypes';

/** Hook for fetching campaign catalog */
export function useCampaignCatalog() {
  return useQuery({
    queryKey: ['partner', 'campaignCatalog'],
    queryFn: () => marketaApi.getCampaignCatalog(),
    staleTime: 60000,
  });
}

/** Hook for fetching full campaign detail with sequence items */
export function useCampaignDetailFull(campaignId: string) {
  return useQuery({
    queryKey: ['partner', 'campaignDetailFull', campaignId],
    queryFn: () => marketaApi.getCampaignDetailFull(campaignId),
    enabled: !!campaignId,
  });
}

/** Hook for fetching campaign status */
export function useCampaignStatus(campaignId: string) {
  return useQuery({
    queryKey: ['partner', 'campaignStatus', campaignId],
    queryFn: () => marketaApi.getCampaignStatus(campaignId),
    enabled: !!campaignId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

/** Hook for joining a campaign */
export function useJoinCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { campaignId: string; channels?: string[]; start_date?: string }) =>
      marketaApi.joinCampaign(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['partner', 'campaignCatalog'] });
      queryClient.invalidateQueries({ queryKey: ['partner', 'campaignStatus', variables.campaignId] });
    },
  });
}

/** Hook for tracking partner events */
export function useTrackEvent() {
  const { config } = useConfig();
  
  return useMutation({
    mutationFn: (event: Omit<PartnerEventPayload, 'tenant_id' | 'persona_id'>) =>
      marketaApi.trackPartnerEvent({
        ...event,
        tenant_id: config.tenant_id,
        persona_id: config.persona_id,
      }),
  });
}

/** 
 * Custom hook for 21 Awakenings campaign 
 * Provides campaign data, status, and event tracking in one hook
 */
export function use21AwakeningsCampaign() {
  const campaignId = CAMPAIGN_21_AWAKENINGS_ID;
  const { config } = useConfig();
  
  const detailQuery = useCampaignDetailFull(campaignId);
  const statusQuery = useCampaignStatus(campaignId);
  const joinMutation = useJoinCampaign();
  const trackEventMutation = useTrackEvent();
  
  // Sort sequence items by day_number ascending
  const sortedSequenceItems = detailQuery.data?.marketa_sequence_items
    ?.slice()
    .sort((a, b) => a.day_number - b.day_number) || [];
  
  // Separate explainer days
  const explainerDays = sortedSequenceItems.filter(item => item.explainer);
  const regularDays = sortedSequenceItems.filter(item => !item.explainer);
  
  // Track sequence view event
  const trackSequenceView = (dayNumber: number, assetRef: string) => {
    trackEventMutation.mutate({
      campaign_id: campaignId,
      event_type: 'sequence_view',
      sequence_day: dayNumber,
      asset_ref: assetRef,
    });
  };
  
  // Track asset click event
  const trackAssetClick = (dayNumber: number, assetRef: string) => {
    trackEventMutation.mutate({
      campaign_id: campaignId,
      event_type: 'asset_click',
      sequence_day: dayNumber,
      asset_ref: assetRef,
    });
  };
  
  // Track CTA click event
  const trackCtaClick = (dayNumber: number, assetRef: string) => {
    trackEventMutation.mutate({
      campaign_id: campaignId,
      event_type: 'cta_click',
      sequence_day: dayNumber,
      asset_ref: assetRef,
    });
  };
  
  // Track share completed event
  const trackShareCompleted = (dayNumber: number, assetRef: string) => {
    trackEventMutation.mutate({
      campaign_id: campaignId,
      event_type: 'share_completed',
      sequence_day: dayNumber,
      asset_ref: assetRef,
    });
  };
  
  // Join the campaign
  const joinCampaign = (channels?: string[]) => {
    return joinMutation.mutateAsync({
      campaignId,
      channels,
    });
  };
  
  return {
    // Data
    campaignId,
    campaign: detailQuery.data?.campaign,
    sequenceItems: sortedSequenceItems,
    explainerDays,
    regularDays,
    rewards: detailQuery.data?.marketa_partner_rewards || [],
    
    // Status
    status: statusQuery.data,
    isJoined: statusQuery.data?.is_joined ?? false,
    currentDay: statusQuery.data?.current_day,
    totalDays: statusQuery.data?.total_days,
    
    // Loading states
    isLoading: detailQuery.isLoading || statusQuery.isLoading,
    isJoining: joinMutation.isPending,
    
    // Actions
    joinCampaign,
    trackSequenceView,
    trackAssetClick,
    trackCtaClick,
    trackShareCompleted,
    
    // Refetch
    refetch: () => {
      detailQuery.refetch();
      statusQuery.refetch();
    },
  };
}

/** Hook for partner pack queue */
export function usePackQueue() {
  return useQuery({
    queryKey: ['partner', 'packQueue'],
    queryFn: () => marketaApi.getPackQueue(),
  });
}

/** Hook for partner tenant performance */
export function useTenantPerformance() {
  return useQuery({
    queryKey: ['partner', 'tenantPerformance'],
    queryFn: () => marketaApi.getTenantPerformance(),
    staleTime: 60000,
  });
}

/** Hook for partner settings */
export function usePartnerSettings() {
  return useQuery({
    queryKey: ['partner', 'settings'],
    queryFn: () => marketaApi.getPartnerSettings(),
  });
}

/** Hook for updating partner settings */
export function useUpdatePartnerSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: Parameters<typeof marketaApi.updatePartnerSettings>[0]) =>
      marketaApi.updatePartnerSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner', 'settings'] });
    },
  });
}

/** Hook for testing partner webhook */
export function useTestPartnerWebhook() {
  return useMutation({
    mutationFn: (webhookUrl: string) => marketaApi.testWebhook_partner(webhookUrl),
  });
}
