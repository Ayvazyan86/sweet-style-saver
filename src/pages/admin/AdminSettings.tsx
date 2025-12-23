import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  GripVertical,
  Users,
  ShoppingCart,
  HelpCircle,
  Send,
  Save
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type CustomFieldDefinition = Tables<'custom_field_definitions'>;

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
          <PartnerFormSettings />
        </TabsContent>

        <TabsContent value="order-form">
          <OrderFormSettings />
        </TabsContent>

        <TabsContent value="question-form">
          <QuestionFormSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ========== Partner Form Settings ==========
function PartnerFormSettings() {
  const queryClient = useQueryClient();

  const { data: fields } = useQuery({
    queryKey: ['admin-custom-fields'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_field_definitions')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as CustomFieldDefinition[];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('custom_field_definitions')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-custom-fields'] });
    },
    onError: (error) => {
      toast.error('Ошибка: ' + error.message);
    },
  });

  const toggleRequiredMutation = useMutation({
    mutationFn: async ({ id, is_required }: { id: string; is_required: boolean }) => {
      const { error } = await supabase
        .from('custom_field_definitions')
        .update({ is_required })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-custom-fields'] });
    },
    onError: (error) => {
      toast.error('Ошибка: ' + error.message);
    },
  });

  const standardFields = [
    { key: 'name', label: 'ФИО', required: true },
    { key: 'age', label: 'Возраст', required: false },
    { key: 'city', label: 'Город', required: false },
    { key: 'phone', label: 'Телефон', required: true },
    { key: 'profession', label: 'Профессия', required: false },
    { key: 'categories', label: 'Категории', required: true },
    { key: 'self_description', label: 'О себе', required: false },
    { key: 'agency_name', label: 'Название агентства', required: false },
    { key: 'agency_description', label: 'Описание агентства', required: false },
    { key: 'tg_channel', label: 'Telegram канал', required: false },
    { key: 'website', label: 'Сайт', required: false },
    { key: 'youtube', label: 'YouTube', required: false },
    { key: 'office_address', label: 'Адрес офиса', required: false },
    { key: 'photo', label: 'Фото', required: false },
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Форма "Стать партнёром"
        </CardTitle>
        <CardDescription>
          Настройка полей формы регистрации партнёров
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-medium mb-4 text-foreground">Стандартные поля</h3>
          <div className="space-y-2">
            {standardFields.map((field) => (
              <div 
                key={field.key}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/30"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium text-foreground">{field.label}</p>
                    <p className="text-sm text-muted-foreground">Поле: {field.key}</p>
                  </div>
                  {field.required && <Badge>Обязательное</Badge>}
                </div>
                <Badge variant="outline">Системное</Badge>
              </div>
            ))}
          </div>
        </div>

        {fields && fields.length > 0 && (
          <div>
            <h3 className="font-medium mb-4 text-foreground">Дополнительные поля</h3>
            <div className="space-y-2">
              {fields.map((field) => (
                <div 
                  key={field.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/30"
                >
                  <div className="flex items-center gap-4">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    <div>
                      <p className="font-medium text-foreground">{field.label}</p>
                      <p className="text-sm text-muted-foreground">
                        Тип: {field.field_type} | Ключ: {field.key}
                      </p>
                    </div>
                    {field.is_required && <Badge>Обязательное</Badge>}
                    {!field.is_active && <Badge variant="secondary">Скрыто</Badge>}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground">Обязательное</Label>
                      <Switch
                        checked={field.is_required ?? false}
                        onCheckedChange={(checked) => toggleRequiredMutation.mutate({ id: field.id, is_required: checked })}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground">Активно</Label>
                      <Switch
                        checked={field.is_active ?? true}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: field.id, is_active: checked })}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ========== Order Form Settings ==========
function OrderFormSettings() {
  const orderFields = [
    { key: 'categories', label: 'Категории', required: true },
    { key: 'title', label: 'Заголовок', required: false },
    { key: 'text', label: 'Описание заказа', required: true },
    { key: 'city', label: 'Город', required: false },
    { key: 'budget', label: 'Бюджет', required: false },
    { key: 'contact', label: 'Контакт', required: false },
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Форма "Хочу заказать"
        </CardTitle>
        <CardDescription>
          Настройка полей формы создания заказа
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {orderFields.map((field) => (
            <div 
              key={field.key}
              className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/30"
            >
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-medium text-foreground">{field.label}</p>
                  <p className="text-sm text-muted-foreground">Поле: {field.key}</p>
                </div>
                {field.required && <Badge>Обязательное</Badge>}
              </div>
              <Badge variant="outline">Системное</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ========== Question Form Settings ==========
function QuestionFormSettings() {
  const questionFields = [
    { key: 'categories', label: 'Категории', required: true },
    { key: 'text', label: 'Вопрос', required: true },
    { key: 'details', label: 'Детали', required: false },
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          Форма "Задать вопрос"
        </CardTitle>
        <CardDescription>
          Настройка полей формы вопросов
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {questionFields.map((field) => (
            <div 
              key={field.key}
              className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/30"
            >
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-medium text-foreground">{field.label}</p>
                  <p className="text-sm text-muted-foreground">Поле: {field.key}</p>
                </div>
                {field.required && <Badge>Обязательное</Badge>}
              </div>
              <Badge variant="outline">Системное</Badge>
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
