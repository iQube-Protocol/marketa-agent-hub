/** Route Guard for RBAC-based access control */

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useConfig } from '@/contexts/ConfigContext';
import type { Role } from '@/services/configTypes';

interface RouteGuardProps {
  children: ReactNode;
  allowedRoles: Role[];
}

export function RouteGuard({ children, allowedRoles }: RouteGuardProps) {
  const { config } = useConfig();
  const location = useLocation();

  const isAllowed = allowedRoles.includes(config.role);

  if (!isAllowed) {
    // Redirect based on role
    const redirectPath = getRedirectPath(config.role);
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function getRedirectPath(role: Role): string {
  switch (role) {
    case 'anonymous':
      return '/p/campaigns';
    case 'partnerAdmin':
      return '/p/home';
    case 'analyst':
      return '/reports';
    case 'agqAdmin':
      return '/admin';
    default:
      return '/p/campaigns';
  }
}

/** Guard specifically for admin routes */
export function AdminGuard({ children }: { children: ReactNode }) {
  return (
    <RouteGuard allowedRoles={['agqAdmin']}>
      {children}
    </RouteGuard>
  );
}

/** Guard for partner routes */
export function PartnerGuard({ children }: { children: ReactNode }) {
  return (
    <RouteGuard allowedRoles={['anonymous', 'partnerAdmin', 'agqAdmin']}>
      {children}
    </RouteGuard>
  );
}

/** Guard for report routes - accessible by all roles */
export function ReportsGuard({ children }: { children: ReactNode }) {
  return (
    <RouteGuard allowedRoles={['agqAdmin', 'partnerAdmin', 'analyst']}>
      {children}
    </RouteGuard>
  );
}
