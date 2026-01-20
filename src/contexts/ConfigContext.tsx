/** Config Context for RBAC and Tenant Configuration */

import { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { marketaApi } from '@/services/marketaApi';
import type { TenantConfig, Role, FeatureFlags } from '@/services/configTypes';
import { Loader2, AlertCircle } from 'lucide-react';

interface ConfigContextValue {
  config: TenantConfig;
  isAdmin: boolean;
  isPartner: boolean;
  isAnalyst: boolean;
  hasFeature: (feature: keyof FeatureFlags) => boolean;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

interface ConfigProviderProps {
  children: ReactNode;
}

export function ConfigProvider({ children }: ConfigProviderProps) {
  const { data: config, isLoading, error } = useQuery({
    queryKey: ['marketa', 'config', window.location.search],
    queryFn: () => marketaApi.getConfig(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading configuration...</p>
        </div>
      </div>
    );
  }

  const resolvedConfig: TenantConfig | null = config || null;

  const effectiveConfig: TenantConfig = resolvedConfig || {
    role: 'anonymous',
    tenant_id: 'metaproof',
    persona_id: '',
    feature_flags: {
      qubetalk_enabled: false,
      make_enabled: false,
      partner_rewards_phase2_enabled: false,
    },
  };

  if (error && !resolvedConfig) {
    console.error('Configuration Error', error);
  }

  const contextValue: ConfigContextValue = {
    config: effectiveConfig,
    isAdmin: effectiveConfig.role === 'agqAdmin',
    isPartner: effectiveConfig.role === 'partnerAdmin',
    isAnalyst: effectiveConfig.role === 'analyst',
    hasFeature: (feature: keyof FeatureFlags) => effectiveConfig.feature_flags[feature] ?? false,
  };

  return (
    <ConfigContext.Provider value={contextValue}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}

export function useRole(): Role {
  const { config } = useConfig();
  return config.role;
}

export function useFeatureFlags(): FeatureFlags {
  const { config } = useConfig();
  return config.feature_flags;
}
