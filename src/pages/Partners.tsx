import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { usePartners, useDeletePartner, useTestWebhook } from '@/hooks/useMarketaApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Wifi,
  WifiOff,
  AlertCircle,
  Users,
  Play,
} from 'lucide-react';
import type { Partner } from '@/services/types';

const webhookStatusConfig = {
  active: { icon: Wifi, label: 'Active', className: 'bg-success/10 text-success' },
  inactive: { icon: WifiOff, label: 'Inactive', className: 'bg-muted text-muted-foreground' },
  error: { icon: AlertCircle, label: 'Error', className: 'bg-destructive/10 text-destructive' },
};

const roleTypeLabels = {
  affiliate: 'Affiliate',
  influencer: 'Influencer',
  media: 'Media',
  strategic: 'Strategic',
};

export default function Partners() {
  const { data: partners, isLoading } = usePartners();
  const deletePartner = useDeletePartner();
  const testWebhook = useTestWebhook();
  const { toast } = useToast();

  const handleDelete = async (partner: Partner) => {
    if (confirm(`Delete partner "${partner.name}"?`)) {
      try {
        await deletePartner.mutateAsync(partner.id);
        toast({ title: 'Partner deleted successfully' });
      } catch {
        toast({ title: 'Failed to delete partner', variant: 'destructive' });
      }
    }
  };

  const handleTestWebhook = async (partner: Partner) => {
    try {
      const result = await testWebhook.mutateAsync(partner.id);
      toast({
        title: result.success ? 'Webhook test successful' : 'Webhook test failed',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });
    } catch {
      toast({ title: 'Webhook test failed', variant: 'destructive' });
    }
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
              Partners
            </h1>
            <p className="mt-1 text-muted-foreground">
              Manage your marketing partners and affiliates
            </p>
          </div>
          <Link to="/partners/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Partner
            </Button>
          </Link>
        </div>

        {/* Partners Table */}
        <Card className="card-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              All Partners
              {partners && (
                <Badge variant="secondary" className="ml-2">
                  {partners.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partner</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Role Type</TableHead>
                      <TableHead>Channels</TableHead>
                      <TableHead>Webhook</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partners?.map((partner) => {
                      const webhookStatus = webhookStatusConfig[partner.webhookStatus];
                      const WebhookIcon = webhookStatus.icon;

                      return (
                        <TableRow key={partner.id} className="animate-fade-in">
                          <TableCell className="font-medium">
                            {partner.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{partner.code}</Badge>
                          </TableCell>
                          <TableCell>
                            {roleTypeLabels[partner.roleType]}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {partner.channels.slice(0, 3).map((channel) => (
                                <Badge key={channel} variant="secondary" className="text-xs">
                                  {channel}
                                </Badge>
                              ))}
                              {partner.channels.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{partner.channels.length - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={webhookStatus.className}>
                              <WebhookIcon className="mr-1 h-3 w-3" />
                              {webhookStatus.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link to={`/partners/${partner.id}`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                {partner.webhookUrl && (
                                  <DropdownMenuItem onClick={() => handleTestWebhook(partner)}>
                                    <Play className="mr-2 h-4 w-4" />
                                    Test Webhook
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDelete(partner)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
