/** Role-aware Admin Sidebar */

import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Package,
  Send,
  UsersRound,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MessageSquare,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useConfig } from '@/contexts/ConfigContext';
import { resolvePersonaAndTenant } from '@/services/marketaApi';

interface NavItem {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: ('agqAdmin' | 'partnerAdmin' | 'analyst')[];
  featureFlag?: 'qubetalk_enabled' | 'make_enabled' | 'partner_rewards_phase2_enabled';
}

const navItems: NavItem[] = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, roles: ['agqAdmin'] },
  { path: '/partners', label: 'Partners', icon: Users, roles: ['agqAdmin'] },
  { path: '/campaigns', label: 'Campaigns', icon: Package, roles: ['agqAdmin'] },
  { path: '/publish', label: 'Publish', icon: Send, roles: ['agqAdmin'] },
  { path: '/segments', label: 'Segments', icon: UsersRound, roles: ['agqAdmin'] },
  { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['agqAdmin', 'analyst'] },
  { path: '/qubetalk', label: 'QubeTalk', icon: MessageSquare, featureFlag: 'qubetalk_enabled' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { config, hasFeature } = useConfig();

  const devAdminPersonaId = (import.meta as any).env?.VITE_MARKETA_ADMIN_PERSONA_ID as string | undefined;
  const devPartnerPersonaId = (import.meta as any).env?.VITE_MARKETA_TEST_PARTNER_PERSONA_ID as string | undefined;

  const activePersonaId = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('persona') || window.localStorage.getItem('marketa_persona_id') || undefined;
  }, [location.search]);

  const activeTenantId = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('tenant') || window.localStorage.getItem('marketa_tenant_id') || '';
  }, [location.search]);

  async function switchPersona(next: { mode: 'admin' | 'partner'; personaId?: string; to: string }) {
    if (!next.personaId) return;
    const resolved = await resolvePersonaAndTenant(next.personaId);
    const personaId = resolved.persona_id || next.personaId;
    const tenantId = resolved.tenant_id || window.localStorage.getItem('marketa_tenant_id') || '';

    if (tenantId) window.localStorage.setItem('marketa_tenant_id', tenantId);
    window.localStorage.setItem('marketa_persona_id', personaId);
    navigate(`${next.to}?mode=${next.mode}${tenantId ? `&tenant=${encodeURIComponent(tenantId)}` : ''}&persona=${encodeURIComponent(personaId)}`);
  }

  // Filter nav items based on role and feature flags
  const filteredNavItems = navItems.filter((item) => {
    // Check role access
    if (item.roles && !item.roles.includes(config.role)) {
      return false;
    }
    // Check feature flag
    if (item.featureFlag && !hasFeature(item.featureFlag)) {
      return false;
    }
    return true;
  });

  // Get user display info
  const userInitials = config.role === 'agqAdmin' ? 'AD' : config.role === 'analyst' ? 'AN' : 'PA';
  const userName = config.role === 'agqAdmin' ? 'Admin' : config.role === 'analyst' ? 'Analyst' : config.partner_name || 'Partner';

  const navContextSearch = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const next = new URLSearchParams();
    ['mode', 'tenant', 'persona'].forEach((k) => {
      const v = params.get(k);
      if (v) next.set(k, v);
    });
    const qs = next.toString();
    return qs ? `?${qs}` : '';
  }, [location.search]);

  const withContext = useMemo(() => {
    return (to: string) => {
      const [rawPath, rawSearch = ''] = to.split('?');
      const targetParams = new URLSearchParams(rawSearch);
      const ctxParams = new URLSearchParams(navContextSearch.startsWith('?') ? navContextSearch.slice(1) : navContextSearch);

      ['mode', 'tenant', 'persona'].forEach((k) => {
        const v = ctxParams.get(k);
        // Don't overwrite explicit params in the target URL (e.g. switching mode=admin)
        if (v && !targetParams.get(k)) targetParams.set(k, v);
      });

      const merged = targetParams.toString();
      return merged ? `${rawPath}?${merged}` : rawPath;
    };
  }, [navContextSearch]);

  async function promptSetPersona() {
    const input = window.prompt('Enter persona id (uuid) or handle (email):', activePersonaId || '');
    if (!input) return;

    const resolved = await resolvePersonaAndTenant(input);
    const personaId = resolved.persona_id || input;

    let tenantId = resolved.tenant_id || activeTenantId || window.localStorage.getItem('marketa_tenant_id') || '';
    if (!tenantId) {
      tenantId = window.prompt('Enter tenant id:', '') || '';
    }

    if (tenantId) window.localStorage.setItem('marketa_tenant_id', tenantId);
    window.localStorage.setItem('marketa_persona_id', personaId);

    const params = new URLSearchParams(location.search);
    if (tenantId) params.set('tenant', tenantId);
    params.set('persona', personaId);
    if (!params.get('mode')) {
      params.set('mode', location.pathname.startsWith('/p/') ? 'partner' : 'admin');
    }
    navigate(`${location.pathname}?${params.toString()}`);
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        <Link to={withContext('/admin')} className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
            <Sparkles className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold text-sidebar-foreground">
              Marketa
            </span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 shrink-0 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          const linkContent = (
            <Link
              key={item.path}
              to={withContext(item.path)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.path} delayDuration={0}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return linkContent;
        })}

        {/* Custom Campaigns section for admin */}
        {config.role === 'agqAdmin' && (
          <>
            <div className={cn('my-4 border-t border-sidebar-border', collapsed && 'mx-2')} />
            {!collapsed && (
              <p className="mb-2 px-3 text-xs font-semibold uppercase text-sidebar-muted">
                Custom Campaigns
              </p>
            )}
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  to={withContext('/campaigns?type=custom')}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    location.search.includes('type=custom')
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  )}
                >
                  <Zap className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>21 Awakenings</span>}
                </Link>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" className="font-medium">
                  21 Awakenings
                </TooltipContent>
              )}
            </Tooltip>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                'flex w-full items-center gap-3 rounded-lg bg-sidebar-accent px-3 py-2 text-left hover:bg-sidebar-accent/80',
                collapsed && 'justify-center'
              )}
              aria-label="Switch persona"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
                {userInitials}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-sidebar-foreground">
                    {userName}
                  </p>
                  <p className="truncate text-xs text-sidebar-muted">
                    {activeTenantId}{activePersonaId ? ` • ${activePersonaId.slice(0, 8)}…` : ''}
                  </p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-64">
            <DropdownMenuItem onClick={() => void promptSetPersona()}>
              Set Persona / Tenant…
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                devPartnerPersonaId || activePersonaId
                  ? void switchPersona({
                      mode: 'partner',
                      personaId: devPartnerPersonaId || activePersonaId,
                      to: '/p/campaigns',
                    })
                  : navigate(withContext('/p/campaigns?mode=partner'))
              }
            >
              Test Partner
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                devAdminPersonaId || activePersonaId
                  ? void switchPersona({
                      mode: 'admin',
                      personaId: devAdminPersonaId || activePersonaId,
                      to: '/admin/campaigns',
                    })
                  : navigate(withContext('/admin/campaigns?mode=admin'))
              }
            >
              Admin
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
