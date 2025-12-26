import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Pencil, 
  Trash2, 
  Plus,
  Loader2,
  GripVertical,
  Briefcase
} from 'lucide-react';
type Profession = {
  id: string;
  name: string;
  category_id: string | null;
  sort_order: number | null;
  is_active: boolean | null;
  created_at: string;
};

export default function AdminProfessions() {
  const queryClient = useQueryClient();
  const [editingProfession, setEditingProfession] = useState<Profession | null>(null);
  const [deletingProfession, setDeletingProfession] = useState<Profession | null>(null);
  const [isAddingProfession, setIsAddingProfession] = useState(false);
  const [newProfession, setNewProfession] = useState({ name: '' });

  const { data: professions, isLoading } = useQuery({
    queryKey: ['admin-professions'],
    queryFn: async () => {
      const { data, error } = await api.professions.list();
      if (error) throw new Error(error);
      return data as Profession[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (profession: { name: string }) => {
      const { error } = await api.professions.create({
        name: profession.name,
      });
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-professions'] });
      setIsAddingProfession(false);
      setNewProfession({ name: '' });
      toast.success('Профессия добавлена');
    },
    onError: (error) => {
      toast.error('Ошибка добавления: ' + error.message);
    },
  });

  const editMutation = useMutation({
    mutationFn: async (profession: Partial<Profession> & { id: string }) => {
      const { error } = await api.professions.update(profession.id, {
        name: profession.name,
        is_active: profession.is_active
      });
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-professions'] });
      setEditingProfession(null);
      toast.success('Профессия обновлена');
    },
    onError: (error) => {
      toast.error('Ошибка обновления: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.professions.delete(id);
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-professions'] });
      setDeletingProfession(null);
      toast.success('Профессия удалена');
    },
    onError: (error) => {
      toast.error('Ошибка удаления: ' + error.message);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await api.professions.update(id, { is_active });
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-professions'] });
    },
    onError: (error) => {
      toast.error('Ошибка: ' + error.message);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            Профессии
          </h1>
          <p className="text-muted-foreground">Управление списком профессий для партнёров</p>
        </div>
        <Button onClick={() => setIsAddingProfession(true)} className="bg-gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Добавить
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : professions?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Профессии не найдены
            </div>
          ) : (
            <div className="space-y-2">
              {professions?.map((profession) => (
                <div 
                  key={profession.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    <div>
                      <p className="font-medium text-foreground">{profession.name}</p>
                    </div>
                    {!profession.is_active && (
                      <Badge variant="secondary">Скрыта</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={profession.is_active ?? true}
                      onCheckedChange={(checked) => toggleMutation.mutate({ id: profession.id, is_active: checked })}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingProfession(profession)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingProfession(profession)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Profession Dialog */}
      <Dialog open={isAddingProfession} onOpenChange={setIsAddingProfession}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Добавить профессию</DialogTitle>
            <DialogDescription>Создайте новую профессию</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="prof-name">Название *</Label>
              <Input
                id="prof-name"
                value={newProfession.name}
                onChange={(e) => setNewProfession({ ...newProfession, name: e.target.value })}
                placeholder="Например: Риэлтор"
                className="bg-input border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingProfession(false)}>
              Отмена
            </Button>
            <Button
              className="bg-gradient-primary"
              onClick={() => addMutation.mutate(newProfession)}
              disabled={!newProfession.name || addMutation.isPending}
            >
              {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Добавить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profession Dialog */}
      <Dialog open={!!editingProfession} onOpenChange={() => setEditingProfession(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Редактировать профессию</DialogTitle>
          </DialogHeader>
          {editingProfession && (
            <EditProfessionForm
              profession={editingProfession}
              onSave={(data) => editMutation.mutate({ id: editingProfession.id, ...data })}
              onCancel={() => setEditingProfession(null)}
              isLoading={editMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingProfession} onOpenChange={() => setDeletingProfession(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить профессию?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить профессию "{deletingProfession?.name}"?
              Это может повлиять на существующие профили партнёров.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingProfession && deleteMutation.mutate(deletingProfession.id)}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Удалить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditProfessionForm({ 
  profession, 
  onSave, 
  onCancel,
  isLoading 
}: { 
  profession: Profession;
  onSave: (data: Partial<Profession>) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: profession.name,
    is_active: profession.is_active ?? true,
  });

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="edit-prof-name">Название *</Label>
        <Input
          id="edit-prof-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="bg-input border-border"
        />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="edit-prof-active">Активна</Label>
        <Switch
          id="edit-prof-active"
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
