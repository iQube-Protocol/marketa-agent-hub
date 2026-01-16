import { Link } from 'react-router-dom';
import { Package, Users, Send, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const actions = [
  {
    label: 'Generate Pack',
    description: 'Create new marketing content pack',
    icon: Package,
    href: '/campaigns?action=generate',
    variant: 'default' as const,
  },
  {
    label: 'View Partners',
    description: 'Manage partner relationships',
    icon: Users,
    href: '/partners',
    variant: 'secondary' as const,
  },
  {
    label: 'Publish Campaign',
    description: 'Send approved packs to channels',
    icon: Send,
    href: '/publish',
    variant: 'secondary' as const,
  },
];

export function QuickActions() {
  return (
    <Card className="card-elevated h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.label} to={action.href}>
              <Button
                variant={action.variant}
                className="h-auto w-full justify-start gap-4 p-4 text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background/50">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{action.label}</p>
                  <p className="text-xs opacity-80">{action.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
