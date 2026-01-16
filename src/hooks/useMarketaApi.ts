/** Custom hooks for Marketa API data fetching */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketaApi } from '@/services/marketaApi';
import type { Partner, Pack, Phase, Channel, PackType, Segment, PublishTarget } from '@/services/types';

/** Hook for fetching KPI stats */
export function useKPIStats(phase?: Phase) {
  return useQuery({
    queryKey: ['kpiStats', phase],
    queryFn: () => marketaApi.getKPIStats(phase),
    staleTime: 30000,
  });
}

/** Hook for fetching recent activity */
export function useRecentActivity() {
  return useQuery({
    queryKey: ['recentActivity'],
    queryFn: () => marketaApi.getRecentActivity(),
    staleTime: 10000,
  });
}

/** Hook for fetching partners list */
export function usePartners() {
  return useQuery({
    queryKey: ['partners'],
    queryFn: () => marketaApi.getPartners(),
  });
}

/** Hook for fetching single partner */
export function usePartner(id: string) {
  return useQuery({
    queryKey: ['partner', id],
    queryFn: () => marketaApi.getPartner(id),
    enabled: !!id,
  });
}

/** Hook for creating partner */
export function useCreatePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Partner, 'id' | 'createdAt' | 'updatedAt'>) => 
      marketaApi.createPartner(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
    },
  });
}

/** Hook for updating partner */
export function useUpdatePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Partner> }) => 
      marketaApi.updatePartner(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      queryClient.invalidateQueries({ queryKey: ['partner', id] });
    },
  });
}

/** Hook for deleting partner */
export function useDeletePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => marketaApi.deletePartner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] });
    },
  });
}

/** Hook for testing webhook */
export function useTestWebhook() {
  return useMutation({
    mutationFn: (partnerId: string) => marketaApi.testWebhook(partnerId),
  });
}

/** Hook for fetching packs list */
export function usePacks() {
  return useQuery({
    queryKey: ['packs'],
    queryFn: () => marketaApi.getPacks(),
  });
}

/** Hook for fetching single pack */
export function usePack(id: string) {
  return useQuery({
    queryKey: ['pack', id],
    queryFn: () => marketaApi.getPack(id),
    enabled: !!id,
  });
}

/** Hook for generating pack */
export function useGeneratePack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: {
      type: PackType;
      partnerId?: string;
      phase: Phase;
      channels: Channel[];
      weekOf: string;
      tone: string;
    }) => marketaApi.generatePack(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packs'] });
    },
  });
}

/** Hook for approving pack */
export function useApprovePack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => marketaApi.approvePack(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['packs'] });
      queryClient.invalidateQueries({ queryKey: ['pack', id] });
    },
  });
}

/** Hook for requesting edits */
export function useRequestEdits() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, feedback }: { id: string; feedback: string }) => 
      marketaApi.requestEdits(id, feedback),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['packs'] });
      queryClient.invalidateQueries({ queryKey: ['pack', id] });
    },
  });
}

/** Hook for regenerating pack */
export function useRegeneratePack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => marketaApi.regeneratePack(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['packs'] });
      queryClient.invalidateQueries({ queryKey: ['pack', id] });
    },
  });
}

/** Hook for publishing */
export function usePublish() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ 
      packId, 
      targets, 
      dryRun, 
      scheduledAt 
    }: { 
      packId: string; 
      targets: PublishTarget[]; 
      dryRun: boolean; 
      scheduledAt?: string;
    }) => marketaApi.publish(packId, targets, dryRun, scheduledAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentActivity'] });
    },
  });
}

/** Hook for segment preview */
export function useSegmentPreview() {
  return useMutation({
    mutationFn: (segment: Omit<Segment, 'id' | 'name' | 'count'>) => 
      marketaApi.previewSegment(segment),
  });
}

/** Hook for report summary */
export function useReportSummary(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['reportSummary', startDate, endDate],
    queryFn: () => marketaApi.getReportSummary(startDate, endDate),
  });
}

/** Hook for campaign performance */
export function useCampaignPerformance(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['campaignPerformance', startDate, endDate],
    queryFn: () => marketaApi.getCampaignPerformance(startDate, endDate),
  });
}

/** Hook for channel performance */
export function useChannelPerformance() {
  return useQuery({
    queryKey: ['channelPerformance'],
    queryFn: () => marketaApi.getChannelPerformance(),
  });
}
