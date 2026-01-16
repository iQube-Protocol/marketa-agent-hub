import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { usePacks, useApprovePack } from '@/hooks/useMarketaApi';
import { PackWizard } from '@/components/campaigns/PackWizard';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Package,
  CheckCircle,
  Clock,
  Send,
  FileX,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import type { Pack, PackStatus } from '@/services/types';

const statusConfig: Record<PackStatus, { icon: typeof Clock; label: string; className: string }> = {
  draft: { icon: FileX, label: 'Draft', className: 'bg-muted text-muted-foreground' },
  pending_approval: { icon: Clock, label: 'Pending', className: 'bg-warning/10 text-warning' },
  approved: { icon: CheckCircle, label: 'Approved', className: 'bg-success/10 text-success' },
  sent: { icon: Send, label: 'Sent', className: 'bg-info/10 text-info' },
  rejected: { icon: FileX, label: 'Rejected', className: 'bg-destructive/10 text-destructive' },
};

const phaseLabels = {
  codex1: 'Codex 1',
  regcf: 'Reg CF',
  pre_fairlaunch: 'Pre-Fairlaunch',
  fairlaunch: 'Fairlaunch',
};

export default function Campaigns() {
  const [searchParams] = useSearchParams();
  const [wizardOpen, setWizardOpen] = useState(searchParams.get('action') === 'generate');
  const { data: packs, isLoading } = usePacks();
  const approvePack = useApprovePack();
  const { toast } = useToast();

  const handleApprove = async (pack: Pack) => {
    try {
      await approvePack.mutateAsync(pack.id);
      toast({ title: 'Pack approved successfully' });
    } catch {
      toast({ title: 'Failed to approve pack', variant: 'destructive' });
    }
  };

  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
              Campaigns
            </h1>
            <p className="mt-1 text-muted-foreground">
              Generate and manage marketing content packs
            </p>
          </div>
          <Button onClick={() => setWizardOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Generate Pack
          </Button>
        </div>

        {/* Packs Table */}
        <Card className="card-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-primary" />
              Content Packs
              {packs && (
                <Badge variant="secondary" className="ml-2">
                  {packs.length}
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
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Partner</TableHead>
                      <TableHead>Phase</TableHead>
                      <TableHead>Week Of</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packs?.map((pack) => {
                      const status = statusConfig[pack.status];
                      const StatusIcon = status.icon;

                      return (
                        <TableRow key={pack.id} className="animate-fade-in">
                          <TableCell>
                            <Badge className={status.className}>
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {pack.type === 'owned_wpp' ? 'Owned' : 'Partner'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {pack.partnerName || '—'}
                          </TableCell>
                          <TableCell>
                            {phaseLabels[pack.phase]}
                          </TableCell>
                          <TableCell>
                            {format(new Date(pack.weekOf), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">v{pack.version}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                <Link to={`/campaigns/${pack.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              {pack.status === 'pending_approval' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-success hover:text-success"
                                  onClick={() => handleApprove(pack)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
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

        {/* Pack Wizard Dialog */}
        <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Generate Content Pack</DialogTitle>
            </DialogHeader>
            <PackWizard onComplete={() => setWizardOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
