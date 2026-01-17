/** Partner Packs List - View pack queue */

import { PartnerLayout } from '@/components/layout/PartnerLayout';
import { useQuery } from '@tanstack/react-query';
import { marketaApi } from '@/services/marketaApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Clock, CheckCircle2, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, variant: 'outline' as const, color: 'text-warning' },
  approved: { label: 'Approved', icon: CheckCircle2, variant: 'secondary' as const, color: 'text-success' },
  published: { label: 'Published', icon: CheckCircle2, variant: 'default' as const, color: 'text-primary' },
  rejected: { label: 'Rejected', icon: XCircle, variant: 'destructive' as const, color: 'text-destructive' },
};

export default function PartnerPacksList() {
  const { data: packs, isLoading } = useQuery({
    queryKey: ['partner', 'packQueue'],
    queryFn: () => marketaApi.getPackQueue(),
  });

  const pendingPacks = packs?.filter(p => p.status === 'pending') || [];
  const approvedPacks = packs?.filter(p => p.status === 'approved' || p.status === 'published') || [];

  if (isLoading) {
    return (
      <PartnerLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PartnerLayout>
    );
  }

  return (
    <PartnerLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Content Packs</h1>
          <p className="text-muted-foreground">
            Review and approve weekly content packs for publishing
          </p>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending ({pendingPacks.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Approved ({approvedPacks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingPacks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No pending packs</h3>
                  <p className="text-sm text-muted-foreground">
                    You're all caught up! New packs will appear here when ready.
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingPacks.map(pack => (
                <PackCard key={pack.id} pack={pack} />
              ))
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approvedPacks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No approved packs yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Approved packs will appear here with delivery status.
                  </p>
                </CardContent>
              </Card>
            ) : (
              approvedPacks.map(pack => (
                <PackCard key={pack.id} pack={pack} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PartnerLayout>
  );
}

interface PackCardProps {
  pack: {
    id: string;
    week_of: string;
    status: 'pending' | 'approved' | 'published' | 'rejected';
    channels: string[];
    items: { id: string; type: string; content: string }[];
  };
}

function PackCard({ pack }: PackCardProps) {
  const status = statusConfig[pack.status];
  const StatusIcon = status.icon;

  return (
    <Card className="card-hover">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Week of {pack.week_of}
            </CardTitle>
            <CardDescription className="mt-1">
              {pack.items.length} content items ready for review
            </CardDescription>
          </div>
          <Badge variant={status.variant} className="gap-1">
            <StatusIcon className={`h-3 w-3 ${status.color}`} />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Preview first item */}
          {pack.items[0] && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wide">
                {pack.items[0].type}
              </p>
              <p className="text-sm line-clamp-2">{pack.items[0].content}</p>
            </div>
          )}

          {/* Channels */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5 flex-wrap">
              {pack.channels.map(channel => (
                <Badge key={channel} variant="outline" className="text-xs">
                  {channel}
                </Badge>
              ))}
            </div>
            <Button asChild>
              <Link to={`/p/packs/${pack.id}`}>
                {pack.status === 'pending' ? 'Review & Approve' : 'View Details'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
