/** React hooks for QubeTalk integration */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qubetalkApi } from '@/services/qubetalkApi';
import type { ContentType, Iqube } from '@/services/qubetalkTypes';

// Configuration hook
export function useQubeTalkConfig() {
  return qubetalkApi.getConfig();
}

// Channels
export function useChannels() {
  return useQuery({
    queryKey: ['qubetalk', 'channels'],
    queryFn: () => qubetalkApi.getChannels(),
    retry: false,
  });
}

export function useCreateChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      qubetalkApi.createChannel(name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qubetalk', 'channels'] });
    },
  });
}

// Messages
export function useMessages(channelId?: string) {
  return useQuery({
    queryKey: ['qubetalk', 'messages', channelId],
    queryFn: () => qubetalkApi.getMessages(channelId),
    refetchInterval: 3000, // Poll for new messages
    retry: false,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      content,
      channelId,
      contentType,
      payload,
    }: {
      content: string;
      channelId: string;
      contentType?: 'text' | 'content_transfer' | 'iqube_transfer' | 'code_snippet';
      payload?: unknown;
    }) => qubetalkApi.sendMessage(content, channelId, contentType, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qubetalk', 'messages'] });
    },
  });
}

// Transfers
export function useTransfers() {
  return useQuery({
    queryKey: ['qubetalk', 'transfers'],
    queryFn: () => qubetalkApi.getTransfers(),
    retry: false,
  });
}

export function useSendTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      toAgent,
      content,
      contentType,
      name,
      iqubeFormat,
    }: {
      toAgent: string;
      content: unknown;
      contentType: ContentType;
      name: string;
      iqubeFormat?: Iqube;
    }) => qubetalkApi.sendTransfer(toAgent, content, contentType, name, iqubeFormat),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qubetalk', 'transfers'] });
    },
  });
}

// iQube helpers
export function useCreateIqube() {
  return (
    type: 'content' | 'code' | 'data' | 'hybrid',
    payload: unknown,
    metadata: { title: string; description: string; tags?: string[] }
  ) => qubetalkApi.createIqube(type, payload, metadata);
}

export function useValidateIqube() {
  return (iqube: Iqube) => qubetalkApi.validateIqube(iqube);
}
