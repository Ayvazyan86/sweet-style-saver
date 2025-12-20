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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
  Settings, 
  Pencil, 
  Trash2, 
  Plus,
  Loader2,
  GripVertical,
  Tag,
  FileText,
  Users,
  ShoppingCart,
  HelpCircle
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Category = Tables<'categories'>;
type CustomFieldDefinition = Tables<'custom_field_definitions'>;

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('categories');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Настройки</h1>
          <p className="text-muted-foreground">Управление категориями и полями форм</p>
        </div>
        <Settings className="h-6 w-6 text-muted-foreground" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="categories" className="data-[state=active]:bg-primary/10">
            <Tag className="h-4 w-4 mr-2" />
            Категории
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

        <TabsContent value="categories">
          <CategoriesSettings />
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

// ========== Categories Settings ==========
function CategoriesSettings() {
  const queryClient = useQueryClient();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', name_en: '', slug: '' });

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as Category[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (category: { name: string; name_en: string; slug: string }) => {
      const maxSort = categories?.reduce((max, c) => Math.max(max, c.sort_order || 0), 0) || 0;
      const { error } = await supabase
        .from('categories')
        .insert({
          name: category.name,
          name_en: category.name_en || null,
          slug: category.slug || category.name.toLowerCase().replace(/\s+/g, '-'),
          sort_order: maxSort + 1,
          is_active: true
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setIsAddingCategory(false);
      setNewCategory({ name: '', name_en: '', slug: '' });
      toast.success('Категория добавлена');
    },
    onError: (error) => {
      toast.error('Ошибка добавления', { description: error.message });
    },
  });

  const editMutation = useMutation({
    mutationFn: async (category: Partial<Category> & { id: string }) => {
      const { error } = await supabase
        .from('categories')
        .update({
          name: category.name,
          name_en: category.name_en,
          slug: category.slug,
          is_active: category.is_active
        })
        .eq('id', category.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setEditingCategory(null);
      toast.success('Категория обновлена');
    },
    onError: (error) => {
      toast.error('Ошибка обновления', { description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setDeletingCategory(null);
      toast.success('Категория удалена');
    },
    onError: (error) => {
      toast.error('Ошибка удаления', { description: error.message });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('categories')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
    onError: (error) => {
      toast.error('Ошибка', { description: error.message });
    },
  });

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Категории профессий</CardTitle>
          <CardDescription>Управление списком категорий для партнёров и заказов</CardDescription>
        </div>
        <Button onClick={() => setIsAddingCategory(true)} className="bg-gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Добавить
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : categories?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Категории не найдены
          </div>
        ) : (
          <div className="space-y-2">
            {categories?.map((category) => (
              <div 
                key={category.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  <div>
                    <p className="font-medium text-foreground">{category.name}</p>
                    {category.name_en && (
                      <p className="text-sm text-muted-foreground">{category.name_en}</p>
                    )}
                  </div>
                  {!category.is_active && (
                    <Badge variant="secondary">Скрыта</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={category.is_active ?? true}
                    onCheckedChange={(checked) => toggleMutation.mutate({ id: category.id, is_active: checked })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingCategory(category)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingCategory(category)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add Category Dialog */}
      <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Добавить категорию</DialogTitle>
            <DialogDescription>Создайте новую категорию профессий</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название (RU) *</Label>
              <Input
                id="name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="Например: Маркетолог"
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name_en">Название (EN)</Label>
              <Input
                id="name_en"
                value={newCategory.name_en}
                onChange={(e) => setNewCategory({ ...newCategory, name_en: e.target.value })}
                placeholder="Например: Marketer"
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                value={newCategory.slug}
                onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                placeholder="Например: marketer"
                className="bg-input border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingCategory(false)}>
              Отмена
            </Button>
            <Button
              className="bg-gradient-primary"
              onClick={() => addMutation.mutate(newCategory)}
              disabled={!newCategory.name || addMutation.isPending}
            >
              {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Добавить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Редактировать категорию</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <EditCategoryForm
              category={editingCategory}
              onSave={(data) => editMutation.mutate({ id: editingCategory.id, ...data })}
              onCancel={() => setEditingCategory(null)}
              isLoading={editMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить категорию?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить категорию "{deletingCategory?.name}"?
              Это может повлиять на существующие заявки и профили партнёров.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingCategory && deleteMutation.mutate(deletingCategory.id)}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Удалить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function EditCategoryForm({ 
  category, 
  onSave, 
  onCancel,
  isLoading 
}: { 
  category: Category;
  onSave: (data: Partial<Category>) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: category.name,
    name_en: category.name_en || '',
    slug: category.slug,
    is_active: category.is_active ?? true,
  });

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="edit-name">Название (RU) *</Label>
        <Input
          id="edit-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="bg-input border-border"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-name_en">Название (EN)</Label>
        <Input
          id="edit-name_en"
          value={formData.name_en}
          onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
          className="bg-input border-border"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-slug">Slug (URL)</Label>
        <Input
          id="edit-slug"
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          className="bg-input border-border"
        />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="edit-active">Активна</Label>
        <Switch
          id="edit-active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Отмена
        </Button>
        <Button
          className="bg-gradient-primary"
          onClick={() => onSave(formData)}
          disabled={!formData.name || isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Сохранить'}
        </Button>
      </DialogFooter>
    </div>
  );
}

// ========== Partner Form Settings ==========
function PartnerFormSettings() {
  const queryClient = useQueryClient();

  const { data: fields, isLoading } = useQuery({
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
      toast.error('Ошибка', { description: error.message });
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
      toast.error('Ошибка', { description: error.message });
    },
  });

  // Стандартные поля формы партнёра (захардкожены в коде)
  const standardFields = [
    { key: 'name', label: 'ФИО', required: true, enabled: true },
    { key: 'age', label: 'Возраст', required: false, enabled: true },
    { key: 'city', label: 'Город', required: false, enabled: true },
    { key: 'phone', label: 'Телефон', required: true, enabled: true },
    { key: 'profession', label: 'Профессия', required: false, enabled: true },
    { key: 'categories', label: 'Категории', required: true, enabled: true },
    { key: 'self_description', label: 'О себе', required: false, enabled: true },
    { key: 'agency_name', label: 'Название агентства', required: false, enabled: true },
    { key: 'agency_description', label: 'Описание агентства', required: false, enabled: true },
    { key: 'tg_channel', label: 'Telegram канал', required: false, enabled: true },
    { key: 'website', label: 'Сайт', required: false, enabled: true },
    { key: 'youtube', label: 'YouTube', required: false, enabled: true },
    { key: 'office_address', label: 'Адрес офиса', required: false, enabled: true },
    { key: 'photo', label: 'Фото', required: false, enabled: true },
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

        <p className="text-sm text-muted-foreground">
          Для добавления новых полей обратитесь к разработчику. 
          Дополнительные поля настраиваются через таблицу custom_field_definitions.
        </p>
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
        <p className="text-sm text-muted-foreground mt-4">
          Поля формы заказа настраиваются на уровне кода.
        </p>
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
        <p className="text-sm text-muted-foreground mt-4">
          Поля формы вопросов настраиваются на уровне кода.
        </p>
      </CardContent>
    </Card>
  );
}
