/** Partner Campaign Catalog - View and join campaigns */

import { PartnerLayout } from '@/components/layout/PartnerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Megaphone, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  ArrowRight,
  Loader2,
  Sparkles 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCampaignCatalog } from '@/hooks/usePartnerApi';
import { CAMPAIGN_21_AWAKENINGS_ID } from '@/services/marketaApi';

export default function PartnerCampaignCatalog() {
  const { data: campaigns, isLoading, error } = useCampaignCatalog();

  const availableCampaigns = campaigns?.filter(c => c.status === 'available' && !c.is_joined) || [];
  const activeCampaigns = campaigns?.filter(c => c.is_joined || c.status === 'active') || [];

  if (isLoading) {
    return (
      <PartnerLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PartnerLayout>
    );
  }

  if (error) {
    return (
      <PartnerLayout>
        <div className="p-6 lg:p-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Unable to load campaigns</CardTitle>
              <CardDescription>
                This usually means the live bridge request is missing identity headers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                {(error as any)?.message || 'Unknown error'}
              </div>
              <div className="text-sm text-muted-foreground">
                Try adding query params:
                <span className="ml-2 font-mono">?tenant=metaproof&amp;persona=&lt;YOUR_PERSONA_ID&gt;</span>
              </div>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Reload
              </Button>
            </CardContent>
          </Card>
        </div>
      </PartnerLayout>
    );
  }

  return (
    <PartnerLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Campaigns</h1>
            <p className="text-muted-foreground">
              Join coordinated campaigns or propose your own
            </p>
          </div>
          <Button asChild>
            <Link to="/p/campaigns/new">
              <Plus className="mr-2 h-4 w-4" />
              Propose Campaign
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="available" className="space-y-4">
          <TabsList>
            <TabsTrigger value="available" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Available ({availableCampaigns.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-2">
              <Megaphone className="h-4 w-4" />
              My Campaigns ({activeCampaigns.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            {availableCampaigns.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No available campaigns</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    Check back soon for new coordinated campaigns, or propose your own!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {availableCampaigns.map(campaign => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {activeCampaigns.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No active campaigns</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    Join an available campaign or propose your own to get started.
                  </p>
                  <Button asChild className="mt-4">
                    <Link to="/p/campaigns/new">Propose Campaign</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {activeCampaigns.map(campaign => (
                  <CampaignCard key={campaign.id} campaign={campaign} isActive />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PartnerLayout>
  );
}

interface CampaignCardProps {
  campaign: {
    id: string;
    name: string;
    description: string;
    type: string;
    status: string;
    duration_days?: number;
    channels: string[];
    is_joined?: boolean;
  };
  isActive?: boolean;
}

function CampaignCard({ campaign, isActive }: CampaignCardProps) {
  const isFeatured = campaign.name === '21 Awakenings';

  return (
    <Card className={`card-hover ${isFeatured ? 'border-primary/50 bg-primary/5' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {isFeatured && <Sparkles className="h-5 w-5 text-primary" />}
            <CardTitle className="text-lg">{campaign.name}</CardTitle>
          </div>
          <Badge variant={campaign.type === 'sequence' ? 'default' : 'secondary'}>
            {campaign.type}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {campaign.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Campaign details */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {campaign.duration_days && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {campaign.duration_days} days
              </span>
            )}
            {campaign.is_joined && (
              <span className="flex items-center gap-1 text-success">
                <CheckCircle2 className="h-4 w-4" />
                Joined
              </span>
            )}
          </div>

          {/* Channels */}
          <div className="flex flex-wrap gap-1.5">
            {campaign.channels.map(channel => (
              <Badge key={channel} variant="outline" className="text-xs">
                {channel}
              </Badge>
            ))}
          </div>

          {/* Action */}
          {isActive ? (
            <Button asChild className="w-full" variant="outline">
              <Link to={`/p/campaigns/${campaign.id}`}>
                View Status
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button asChild className="flex-1" variant="outline">
                <Link to={`/p/campaigns/${campaign.id}?preview=1`}>
                  View Campaign
                </Link>
              </Button>
              <Button asChild className="flex-1" variant="default">
                <Link to={`/p/campaigns/${campaign.id}`}>
                  Join Campaign
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
