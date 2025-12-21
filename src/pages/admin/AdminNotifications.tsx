import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Bell, Edit, Save, X, Info } from 'lucide-react';

interface NotificationTemplate {
  id: string;
  key: string;
  name: string;
  template: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminNotifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [editedTemplate, setEditedTemplate] = useState('');
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');

  const { data: templates, isLoading } = useQuery({
    queryKey: ['notification-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .order('key');
      
      if (error) throw error;
      return data as NotificationTemplate[];
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, template, description }: { id: string; name: string; template: string; description: string }) => {
      const { error } = await supabase
        .from('notification_templates')
        .update({ name, template, description })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      toast({
        title: 'Шаблон обновлён',
        description: 'Изменения сохранены успешно',
      });
      setEditingTemplate(null);
    },
    onError: (error) => {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleEdit = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setEditedName(template.name);
    setEditedTemplate(template.template);
    setEditedDescription(template.description || '');
  };

  const handleSave = () => {
    if (!editingTemplate) return;
    
    updateMutation.mutate({
      id: editingTemplate.id,
      name: editedName,
      template: editedTemplate,
      description: editedDescription,
    });
  };

  const getVariablesForKey = (key: string): string[] => {
    const variablesMap: Record<string, string[]> = {
      'new_application': ['{name}', '{profession_line}', '{city_line}', '{phone_line}'],
      'application_approved': ['{name}'],
      'application_rejected': ['{name}', '{rejection_reason_line}'],
      'new_order': ['{text}', '{city_line}', '{budget_line}', '{contact}'],
      'new_question': ['{text}', '{details_line}'],
    };
    return variablesMap[key] || [];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Уведомления</h1>
          <p className="text-muted-foreground">Управление шаблонами Telegram-уведомлений</p>
        </div>
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Переменные в шаблонах</p>
              <p>Используйте переменные в фигурных скобках, например <code className="bg-muted px-1 rounded">{'{name}'}</code>. 
              Переменные с суффиксом <code className="bg-muted px-1 rounded">_line</code> автоматически скрываются, если значение пустое.</p>
              <p className="mt-1">Поддерживается HTML-разметка Telegram: <code className="bg-muted px-1 rounded">&lt;b&gt;</code>, <code className="bg-muted px-1 rounded">&lt;i&gt;</code>, <code className="bg-muted px-1 rounded">&lt;a href=""&gt;</code></p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {templates?.map((template) => (
          <Card key={template.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Редактировать
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-3">
                <pre className="text-sm whitespace-pre-wrap font-mono">{template.template}</pre>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {getVariablesForKey(template.key).map((variable) => (
                  <span key={variable} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                    {variable}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактирование шаблона</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название</Label>
              <Input
                id="name"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Input
                id="description"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="template">Шаблон сообщения</Label>
              <Textarea
                id="template"
                value={editedTemplate}
                onChange={(e) => setEditedTemplate(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
              {editingTemplate && (
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="text-xs text-muted-foreground mr-1">Доступные переменные:</span>
                  {getVariablesForKey(editingTemplate.key).map((variable) => (
                    <button
                      key={variable}
                      type="button"
                      className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded hover:bg-primary/20 transition-colors"
                      onClick={() => setEditedTemplate(prev => prev + variable)}
                    >
                      {variable}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>
              <X className="h-4 w-4 mr-1" />
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              <Save className="h-4 w-4 mr-1" />
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
