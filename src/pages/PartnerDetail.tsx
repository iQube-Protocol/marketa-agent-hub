import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MainLayout } from '@/components/layout/MainLayout';
import { usePartner, useCreatePartner, useUpdatePartner } from '@/hooks/useMarketaApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save } from 'lucide-react';
import type { Channel, RoleType } from '@/services/types';

const channels: { value: Channel; label: string }[] = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'discord', label: 'Discord' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'sms', label: 'SMS' },
];

const roleTypes: { value: RoleType; label: string }[] = [
  { value: 'affiliate', label: 'Affiliate' },
  { value: 'influencer', label: 'Influencer' },
  { value: 'media', label: 'Media' },
  { value: 'strategic', label: 'Strategic' },
];

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(2, 'Code must be at least 2 characters').max(20, 'Code must be at most 20 characters'),
  roleType: z.enum(['affiliate', 'influencer', 'media', 'strategic']),
  channels: z.array(z.string()).min(1, 'Select at least one channel'),
  webhookUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  approvalContacts: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

export default function PartnerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = id === 'new';

  const { data: partner, isLoading } = usePartner(isNew ? '' : id!);
  const createPartner = useCreatePartner();
  const updatePartner = useUpdatePartner();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      roleType: 'affiliate',
      channels: [],
      webhookUrl: '',
      approvalContacts: '',
    },
  });

  useEffect(() => {
    if (partner && !isNew) {
      form.reset({
        name: partner.name,
        code: partner.code,
        roleType: partner.roleType,
        channels: partner.channels,
        webhookUrl: partner.webhookUrl ?? '',
        approvalContacts: partner.approvalContacts.join(', '),
      });
    }
  }, [partner, isNew, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const basePayload = {
        name: values.name,
        code: values.code,
        roleType: values.roleType as RoleType,
        channels: values.channels as Channel[],
        webhookUrl: values.webhookUrl || undefined,
        approvalContacts: values.approvalContacts
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
      };

      if (isNew) {
        await createPartner.mutateAsync({
          ...basePayload,
          webhookStatus: 'inactive',
        });
        toast({ title: 'Partner created successfully' });
      } else {
        await updatePartner.mutateAsync({ id: id!, data: basePayload });
        toast({ title: 'Partner updated successfully' });
      }
      navigate('/partners');
    } catch {
      toast({
        title: isNew ? 'Failed to create partner' : 'Failed to update partner',
        variant: 'destructive',
      });
    }
  };

  if (!isNew && isLoading) {
    return (
      <MainLayout>
        <div className="p-6 lg:p-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <Card>
            <CardContent className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link to="/partners">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
              {isNew ? 'Add Partner' : 'Edit Partner'}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {isNew ? 'Create a new marketing partner' : `Editing ${partner?.name}`}
            </p>
          </div>
        </div>

        {/* Form */}
        <Card className="card-elevated max-w-2xl">
          <CardHeader>
            <CardTitle>Partner Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Partner Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Partner Code</FormLabel>
                      <FormControl>
                        <Input placeholder="ACME" {...field} />
                      </FormControl>
                      <FormDescription>
                        Unique identifier used in UTM links and tracking
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="roleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roleTypes.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="channels"
                  render={() => (
                    <FormItem>
                      <FormLabel>Channels</FormLabel>
                      <FormDescription>
                        Select the channels this partner uses
                      </FormDescription>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {channels.map((channel) => (
                          <FormField
                            key={channel.value}
                            control={form.control}
                            name="channels"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(channel.value)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value ?? [];
                                      field.onChange(
                                        checked
                                          ? [...current, channel.value]
                                          : current.filter((v) => v !== channel.value)
                                      );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  {channel.label}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="webhookUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Webhook URL (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://api.partner.com/webhook"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        URL to receive pack notifications
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="approvalContacts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Approval Contacts</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="john@partner.com, jane@partner.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Comma-separated email addresses for pack approvals
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={createPartner.isPending || updatePartner.isPending}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isNew ? 'Create Partner' : 'Save Changes'}
                  </Button>
                  <Link to="/partners">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
