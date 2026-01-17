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
    queryKey: ['marketa', 'config'],
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

  if (error || !config) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-lg font-semibold">Configuration Error</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Unable to load application configuration. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const contextValue: ConfigContextValue = {
    config,
    isAdmin: config.role === 'agqAdmin',
    isPartner: config.role === 'partnerAdmin',
    isAnalyst: config.role === 'analyst',
    hasFeature: (feature: keyof FeatureFlags) => config.feature_flags[feature] ?? false,
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
