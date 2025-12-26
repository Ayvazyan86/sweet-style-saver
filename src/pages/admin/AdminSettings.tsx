import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  Settings, 
  Pencil, 
  Loader2,
  Users,
  ShoppingCart,
  HelpCircle,
  Send,
  Save,
  X,
  Check
} from 'lucide-react';

interface FormFieldSetting {
  id: string;
  form_type: string;
  field_key: string;
  label: string;
  label_en: string | null;
  is_visible: boolean;
  is_required: boolean;
  sort_order: number;
}

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('telegram');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Настройки</h1>
          <p className="text-muted-foreground">Настройки системы и форм</p>
        </div>
        <Settings className="h-6 w-6 text-muted-foreground" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-card border border-border flex-wrap h-auto">
          <TabsTrigger value="telegram" className="data-[state=active]:bg-primary/10">
            <Send className="h-4 w-4 mr-2" />
            Telegram
          </TabsTrigger>
          <TabsTrigger value="partner-form" className="data-[state=active]:bg-primary/10">
            <Users className="h-4 w-4 mr-2" />
            Стать партнёром
          </TabsTrigger>
          <TabsTrigger value="order-form" className="data-[state=active]:bg-primary/10">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Хочу заказать
          </TabsTrigger>
          <TabsTrigger value="question-form" className="data-[state=active]:bg-primary/10">
            <HelpCircle className="h-4 w-4 mr-2" />
            Задать вопрос
          </TabsTrigger>
        </TabsList>

        <TabsContent value="telegram">
          <TelegramSettings />
        </TabsContent>

        <TabsContent value="partner-form">
          <FormFieldSettings formType="partner" title="Стать партнёром" icon={<Users className="h-5 w-5" />} />
        </TabsContent>

        <TabsContent value="order-form">
          <FormFieldSettings formType="order" title="Хочу заказать" icon={<ShoppingCart className="h-5 w-5" />} />
        </TabsContent>

        <TabsContent value="question-form">
          <FormFieldSettings formType="question" title="Задать вопрос" icon={<HelpCircle className="h-5 w-5" />} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ========== Form Field Settings (Universal for all forms) ==========
function FormFieldSettings({ formType, title, icon }: { formType: string; title: string; icon: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const { data: fields, isLoading } = useQuery({
    queryKey: ['form-field-settings', formType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_field_settings')
        .select('*')
        .eq('form_type', formType)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as FormFieldSetting[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<FormFieldSetting> }) => {
      const { error } = await supabase
        .from('form_field_settings')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-field-settings', formType] });
      toast.success('Настройки сохранены');
    },
    onError: (error) => {
      toast.error('Ошибка: ' + error.message);
    },
  });

  const startEdit = (field: FormFieldSetting) => {
    setEditingId(field.id);
    setEditLabel(field.label);
  };

  const saveEdit = (id: string) => {
    if (editLabel.trim()) {
      updateMutation.mutate({ id, updates: { label: editLabel.trim() } });
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditLabel('');
  };

  const toggleVisibility = (id: string, is_visible: boolean) => {
    updateMutation.mutate({ id, updates: { is_visible } });
  };

  const toggleRequired = (id: string, is_required: boolean) => {
    updateMutation.mutate({ id, updates: { is_required } });
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          Форма "{title}"
        </CardTitle>
        <CardDescription>
          Настройка полей формы: названия, видимость, обязательность
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {fields?.map((field) => (
            <div 
              key={field.id}
              className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/30"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {editingId === field.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="bg-input border-border max-w-xs"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(field.id);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                    />
                    <Button size="sm" variant="ghost" onClick={() => saveEdit(field.id)}>
                      <Check className="h-4 w-4 text-green-500" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{field.label}</p>
                      <p className="text-sm text-muted-foreground">Поле: {field.field_key}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => startEdit(field)}>
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                )}
                
                {field.is_required && <Badge>Обязательное</Badge>}
                {!field.is_visible && <Badge variant="secondary">Скрыто</Badge>}
              </div>
              
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground whitespace-nowrap">Обязательное</Label>
                  <Switch
                    checked={field.is_required}
                    onCheckedChange={(checked) => toggleRequired(field.id, checked)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground whitespace-nowrap">Видимо</Label>
                  <Switch
                    checked={field.is_visible}
                    onCheckedChange={(checked) => toggleVisibility(field.id, checked)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ========== Telegram Settings ==========
function TelegramSettings() {
  const queryClient = useQueryClient();
  const [channelId, setChannelId] = useState('');
  const [discussionChatId, setDiscussionChatId] = useState('');
  const [adminChatId, setAdminChatId] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['telegram-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .in('key', ['telegram_channel_id', 'telegram_discussion_chat_id', 'telegram_admin_chat_id']);
      
      if (error) throw error;
      
      const result: Record<string, string> = {};
      data?.forEach(item => {
        result[item.key] = item.value;
      });
      return result;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: { key: string; value: string }[]) => {
      for (const update of updates) {
        const { error } = await supabase
          .from('settings')
          .update({ value: update.value })
          .eq('key', update.key);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram-settings'] });
      toast.success('Настройки Telegram сохранены');
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error('Ошибка сохранения: ' + error.message);
    },
  });

  const handleEdit = () => {
    setChannelId(settings?.telegram_channel_id || '');
    setDiscussionChatId(settings?.telegram_discussion_chat_id || '');
    setAdminChatId(settings?.telegram_admin_chat_id || '');
    setIsEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate([
      { key: 'telegram_channel_id', value: channelId },
      { key: 'telegram_discussion_chat_id', value: discussionChatId },
      { key: 'telegram_admin_chat_id', value: adminChatId },
    ]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Настройки Telegram
          </CardTitle>
          <CardDescription>
            Настройки бота и каналов для уведомлений
          </CardDescription>
        </div>
        {!isEditing && (
          <Button onClick={handleEdit} variant="outline">
            <Pencil className="h-4 w-4 mr-2" />
            Редактировать
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Токен бота</strong> хранится в защищённых переменных окружения и не может быть изменён через интерфейс.
          </p>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="channel-id">ID канала для публикации партнёров</Label>
              <Input
                id="channel-id"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                placeholder="Например: -1001234567890"
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discussion-chat-id">ID чата обсуждений</Label>
              <Input
                id="discussion-chat-id"
                value={discussionChatId}
                onChange={(e) => setDiscussionChatId(e.target.value)}
                placeholder="Например: -1001234567890"
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-chat-id">ID администратора для уведомлений</Label>
              <Input
                id="admin-chat-id"
                value={adminChatId}
                onChange={(e) => setAdminChatId(e.target.value)}
                placeholder="Например: 264133466"
                className="bg-input border-border"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={updateMutation.isPending} className="bg-gradient-primary">
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Сохранить
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Отмена
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-border bg-secondary/30">
              <p className="text-sm text-muted-foreground">ID канала</p>
              <p className="font-mono text-foreground">{settings?.telegram_channel_id || 'Не задан'}</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-secondary/30">
              <p className="text-sm text-muted-foreground">ID чата обсуждений</p>
              <p className="font-mono text-foreground">{settings?.telegram_discussion_chat_id || 'Не задан'}</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-secondary/30">
              <p className="text-sm text-muted-foreground">ID администратора</p>
              <p className="font-mono text-foreground">{settings?.telegram_admin_chat_id || 'Не задан'}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
