/** QubeTalk Client Component - Glass morphism UI for agent communication */

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { 
  MessageSquare, 
  Send, 
  Upload, 
  Settings, 
  Hash,
  Box,
  Code,
  FileJson,
  Check,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Zap,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  useChannels, 
  useMessages, 
  useSendMessage, 
  useQubeTalkConfig,
  useTransfers,
  useSendTransfer,
} from '@/hooks/useQubeTalk';
import { qubetalkApi } from '@/services/qubetalkApi';
import type { QubeTalkMessage, QubeTalkChannel, ContentTransfer } from '@/services/qubetalkTypes';
import { CHANNEL_CONFIG } from '@/services/qubetalkTypes';

// Message bubble component
function MessageBubble({ message }: { message: QubeTalkMessage }) {
  const isOutgoing = message.message_type === 'outgoing';
  
  return (
    <div className={cn('flex gap-3 mb-4', isOutgoing && 'flex-row-reverse')}>
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0',
        isOutgoing 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted text-muted-foreground'
      )}>
        {message.from_agent.name.charAt(0)}
      </div>
      <div className={cn(
        'max-w-[70%] rounded-2xl px-4 py-2',
        isOutgoing 
          ? 'bg-primary text-primary-foreground rounded-br-md' 
          : 'glass-panel rounded-bl-md'
      )}>
        <p className="text-sm font-medium mb-1">{message.from_agent.name}</p>
        <p className="text-sm">{message.content.text}</p>
        {message.content.payload && (
          <Badge variant="secondary" className="mt-2">
            {message.content.type === 'iqube_transfer' && <Box className="w-3 h-3 mr-1" />}
            {message.content.type === 'code_snippet' && <Code className="w-3 h-3 mr-1" />}
            {message.content.type === 'content_transfer' && <FileJson className="w-3 h-3 mr-1" />}
            Attachment
          </Badge>
        )}
        <p className="text-xs opacity-60 mt-1">
          {new Date(message.created_at).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

// Channel item component with type indicator
function ChannelItem({ 
  channel, 
  isActive, 
  onClick,
  channelType,
}: { 
  channel: QubeTalkChannel; 
  isActive: boolean; 
  onClick: () => void;
  channelType: 'essential' | 'optional';
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left',
        isActive 
          ? 'bg-primary/10 text-primary border border-primary/20' 
          : 'hover:bg-muted/50',
        channelType === 'optional' && 'opacity-80'
      )}
    >
      {channelType === 'essential' ? (
        <Zap className="w-4 h-4 shrink-0 text-primary" />
      ) : (
        <Wrench className="w-4 h-4 shrink-0 text-muted-foreground" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{channel.name}</p>
        {channel.description && (
          <p className="text-xs text-muted-foreground truncate">{channel.description}</p>
        )}
      </div>
    </button>
  );
}

// Transfer item component
function TransferItem({ transfer }: { transfer: ContentTransfer }) {
  const statusColors = {
    pending: 'bg-warning/10 text-warning border-warning/20',
    sent: 'bg-info/10 text-info border-info/20',
    delivered: 'bg-success/10 text-success border-success/20',
    failed: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  return (
    <div className="glass-panel p-3 mb-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{transfer.content.name}</span>
        <Badge className={statusColors[transfer.status]}>
          {transfer.status === 'delivered' && <Check className="w-3 h-3 mr-1" />}
          {transfer.status === 'failed' && <AlertCircle className="w-3 h-3 mr-1" />}
          {transfer.status === 'pending' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
          {transfer.status}
        </Badge>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>To: {transfer.to_agent}</span>
        <span>•</span>
        <span>{transfer.transfer_method}</span>
        {transfer.iqube_ref && (
          <>
            <span>•</span>
            <Badge variant="outline" className="text-xs">
              <Box className="w-3 h-3 mr-1" />
              iQube
            </Badge>
          </>
        )}
      </div>
    </div>
  );
}

export function QubeTalkClient() {
  const config = useQubeTalkConfig();
  const { data: channels, isLoading: channelsLoading } = useChannels();
  const { data: transfers } = useTransfers();
  const [activeChannel, setActiveChannel] = useState<string>('marketa-lvb-aigent-z');
  const { data: messages, isLoading: messagesLoading } = useMessages(activeChannel);
  const sendMessage = useSendMessage();
  const sendTransfer = useSendTransfer();
  
  const [messageInput, setMessageInput] = useState('');
  const [contentType, setContentType] = useState<'text' | 'json' | 'iqube' | 'code'>('text');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadContent, setUploadContent] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [showOptionalChannels, setShowOptionalChannels] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Separate essential and optional channels
  const channelList = Array.isArray(channels) ? channels : [];
  const essentialChannelIds = CHANNEL_CONFIG.essential.map(c => c.channel_id);
  const optionalChannelIds = CHANNEL_CONFIG.optional.map(c => c.channel_id);
  const essentialChannels = channelList.filter(c => essentialChannelIds.includes(c.id));
  const optionalChannels = channelList.filter(c => optionalChannelIds.includes(c.id));

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    
    sendMessage.mutate({
      content: messageInput,
      channelId: activeChannel,
      contentType: 'text',
    });
    setMessageInput('');
  };

  const handleUpload = () => {
    if (!uploadContent.trim() || !uploadName.trim()) return;

    try {
      const parsedContent = JSON.parse(uploadContent);
      
      if (contentType === 'iqube') {
        const iqube = qubetalkApi.createIqube('hybrid', parsedContent, {
          title: uploadName,
          description: 'Uploaded via QubeTalk client',
          tags: ['upload', 'thin-client'],
        });
        
        sendMessage.mutate({
          content: `Sending iQube: ${uploadName}`,
          channelId: activeChannel,
          contentType: 'iqube_transfer',
          payload: iqube,
        });
      } else {
        sendMessage.mutate({
          content: `Sending content: ${uploadName}`,
          channelId: activeChannel,
          contentType: 'content_transfer',
          payload: parsedContent,
        });
      }
      
      setUploadDialogOpen(false);
      setUploadContent('');
      setUploadName('');
    } catch {
      console.error('Invalid JSON');
    }
  };

  const handleGenerateConfigIqube = () => {
    const configIqube = qubetalkApi.createIqube('hybrid', {
      client_version: '1.0.0',
      ui_components: ['Dashboard', 'Partners', 'Campaigns', 'Publish', 'Segments', 'Reports', 'QubeTalk'],
      feature_flags: {
        qubetalk_enabled: true,
        iqube_support: true,
        code_snippets: true,
      },
      styling_config: {
        theme: 'light',
        glass_morphism: true,
        primary_color: 'hsl(346, 77%, 50%)',
      },
      environment: config.environment,
    }, {
      title: 'Lovable Thin Client Configuration',
      description: 'Complete setup and configuration of Marketa Console thin client',
      tags: ['configuration', 'thin-client', 'setup', 'marketa'],
    });

    sendTransfer.mutate({
      toAgent: 'aigent-z',
      content: configIqube.content.payload,
      contentType: 'hybrid',
      name: 'Client Configuration iQube',
      iqubeFormat: configIqube,
    });

    sendMessage.mutate({
      content: 'Sending client configuration iQube for comparison...',
      channelId: activeChannel,
      contentType: 'iqube_transfer',
      payload: configIqube,
    });
  };

  return (
    <div className="h-full flex rounded-xl overflow-hidden border border-border/50 glass-container">
      {/* Sidebar */}
      <div className="w-64 border-r border-border/50 flex flex-col bg-card/30 backdrop-blur-sm">
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              QubeTalk
            </h2>
            <Badge variant="outline" className="text-xs">
              {config.environment}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Agent-to-agent communication
          </p>
        </div>

        <Tabs defaultValue="channels" className="flex-1 flex flex-col">
          <TabsList className="m-2 grid grid-cols-2">
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="transfers">Transfers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="channels" className="flex-1 m-0">
            <ScrollArea className="h-full px-2 pb-2">
              {channelsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Essential Channels */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground px-3 py-1 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Essential Channels
                    </p>
                    <div className="space-y-1">
                      {essentialChannels.map((channel) => (
                        <ChannelItem
                          key={channel.id}
                          channel={channel}
                          isActive={activeChannel === channel.id}
                          onClick={() => setActiveChannel(channel.id)}
                          channelType="essential"
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Optional/Development Channels */}
                  <Collapsible open={showOptionalChannels} onOpenChange={setShowOptionalChannels}>
                    <CollapsibleTrigger className="w-full">
                      <p className="text-xs font-medium text-muted-foreground px-3 py-1 flex items-center gap-1 hover:text-foreground transition-colors">
                        {showOptionalChannels ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                        <Wrench className="w-3 h-3" />
                        Development Channels
                      </p>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="space-y-1 mt-1">
                        {optionalChannels.map((channel) => (
                          <ChannelItem
                            key={channel.id}
                            channel={channel}
                            isActive={activeChannel === channel.id}
                            onClick={() => setActiveChannel(channel.id)}
                            channelType="optional"
                          />
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="transfers" className="flex-1 m-0">
            <ScrollArea className="h-full px-2 pb-2">
              {(() => {
                const transferList = Array.isArray(transfers) ? transfers : [];
                if (transferList.length === 0) {
                  return (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No transfers yet
                    </p>
                  );
                }
                return transferList.map((transfer) => (
                  <TransferItem key={transfer.transfer_id} transfer={transfer} />
                ));
              })()}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="p-2 border-t border-border/50">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={handleGenerateConfigIqube}
          >
            <Settings className="w-4 h-4 mr-2" />
            Send Config iQube
          </Button>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-background/50 backdrop-blur-sm">
        {/* Header */}
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">
              #{channelList.find(c => c.id === activeChannel)?.name || 'Channel'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {channelList.find(c => c.id === activeChannel)?.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={contentType} onValueChange={(v) => setContentType(v as typeof contentType)}>
              <SelectTrigger className="w-28 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="iqube">iQube</SelectItem>
                <SelectItem value="code">Code</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {messagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
              <p>No messages yet</p>
              <p className="text-sm">Start a conversation with the agents</p>
            </div>
          ) : (
            <>
              {messages?.map((message) => (
                <MessageBubble key={message.message_id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-border/50">
          <div className="flex gap-2">
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Upload className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Upload Content</DialogTitle>
                  <DialogDescription>
                    Send JSON, iQube, or code snippet to the channel
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Input
                    placeholder="Content name"
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                  />
                  <Textarea
                    placeholder="Paste JSON content here..."
                    className="font-mono text-sm h-48"
                    value={uploadContent}
                    onChange={(e) => setUploadContent(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpload}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Input
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={sendMessage.isPending}>
              {sendMessage.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
