import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Users, 
  Pencil, 
  Trash2, 
  Calendar, 
  Search,
  Loader2,
  Star,
  CreditCard,
  User
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Tables } from '@/integrations/supabase/types';

type PartnerProfile = Tables<'partner_profiles'>;

export default function AdminPartners() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingPartner, setEditingPartner] = useState<PartnerProfile | null>(null);
  const [deletingPartner, setDeletingPartner] = useState<PartnerProfile | null>(null);
  const [extendingPartner, setExtendingPartner] = useState<PartnerProfile | null>(null);
  const [extendDays, setExtendDays] = useState(30);

  // Fetch partners
  const { data: partners, isLoading } = useQuery({
    queryKey: ['admin-partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PartnerProfile[];
    },
  });

  // Edit partner mutation
  const editMutation = useMutation({
    mutationFn: async (partner: Partial<PartnerProfile> & { id: string }) => {
      const { error } = await supabase
        .from('partner_profiles')
        .update(partner)
        .eq('id', partner.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
      setEditingPartner(null);
      toast.success('Партнёр обновлён');
    },
    onError: (error) => {
      toast.error('Ошибка обновления', { description: error.message });
    },
  });

  // Delete partner mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('partner_profiles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
      setDeletingPartner(null);
      toast.success('Партнёр удалён');
    },
    onError: (error) => {
      toast.error('Ошибка удаления', { description: error.message });
    },
  });

  // Extend subscription mutation
  const extendMutation = useMutation({
    mutationFn: async ({ id, days }: { id: string; days: number }) => {
      const partner = partners?.find(p => p.id === id);
      const currentPaidUntil = partner?.paid_until ? new Date(partner.paid_until) : new Date();
      const newPaidUntil = addDays(currentPaidUntil > new Date() ? currentPaidUntil : new Date(), days);
      
      const { error } = await supabase
        .from('partner_profiles')
        .update({ 
          paid_until: newPaidUntil.toISOString(),
          partner_type: 'paid'
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
      setExtendingPartner(null);
      setExtendDays(30);
      toast.success('Подписка продлена');
    },
    onError: (error) => {
      toast.error('Ошибка продления', { description: error.message });
    },
  });

  // Filter partners by search
  const filteredPartners = partners?.filter(partner => 
    partner.name.toLowerCase().includes(search.toLowerCase()) ||
    partner.phone?.toLowerCase().includes(search.toLowerCase()) ||
    partner.city?.toLowerCase().includes(search.toLowerCase())
  );

  const getPartnerTypeBadge = (type: string | null) => {
    switch (type) {
      case 'star':
        return <Badge className="bg-accent text-accent-foreground"><Star className="h-3 w-3 mr-1" />Звезда</Badge>;
      case 'paid':
        return <Badge className="bg-primary text-primary-foreground"><CreditCard className="h-3 w-3 mr-1" />Платный</Badge>;
      default:
        return <Badge variant="secondary"><User className="h-3 w-3 mr-1" />Бесплатный</Badge>;
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success text-success-foreground">Активен</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Неактивен</Badge>;
      case 'archived':
        return <Badge variant="outline">Архив</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Партнёры</h1>
          <p className="text-muted-foreground">Управление карточками партнёров</p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <span className="text-muted-foreground">{partners?.length || 0}</span>
        </div>
      </div>

      {/* Search */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени, телефону или городу..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-input border-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Partners Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Список партнёров</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredPartners?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Партнёры не найдены
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Имя</TableHead>
                    <TableHead>Город</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Оплачено до</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPartners?.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell className="font-medium">{partner.name}</TableCell>
                      <TableCell>{partner.city || '-'}</TableCell>
                      <TableCell>{getPartnerTypeBadge(partner.partner_type)}</TableCell>
                      <TableCell>{getStatusBadge(partner.status)}</TableCell>
                      <TableCell>
                        {partner.paid_until 
                          ? format(new Date(partner.paid_until), 'dd MMM yyyy', { locale: ru })
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setExtendingPartner(partner)}
                            title="Продлить подписку"
                          >
                            <Calendar className="h-4 w-4 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingPartner(partner)}
                            title="Редактировать"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingPartner(partner)}
                            title="Удалить"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingPartner} onOpenChange={() => setEditingPartner(null)}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>Редактировать партнёра</DialogTitle>
            <DialogDescription>Измените данные партнёра</DialogDescription>
          </DialogHeader>
          {editingPartner && (
            <EditPartnerForm
              partner={editingPartner}
              onSave={(data) => editMutation.mutate({ id: editingPartner.id, ...data })}
              onCancel={() => setEditingPartner(null)}
              isLoading={editMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingPartner} onOpenChange={() => setDeletingPartner(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить партнёра?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить партнёра "{deletingPartner?.name}"? 
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingPartner && deleteMutation.mutate(deletingPartner.id)}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Удалить'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Extend Subscription Dialog */}
      <Dialog open={!!extendingPartner} onOpenChange={() => setExtendingPartner(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Продлить подписку</DialogTitle>
            <DialogDescription>
              Продление подписки для "{extendingPartner?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Текущая дата окончания</Label>
              <p className="text-sm text-muted-foreground">
                {extendingPartner?.paid_until 
                  ? format(new Date(extendingPartner.paid_until), 'dd MMMM yyyy', { locale: ru })
                  : 'Не установлена'}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="days">Количество дней</Label>
              <Input
                id="days"
                type="number"
                value={extendDays}
                onChange={(e) => setExtendDays(Number(e.target.value))}
                min={1}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Новая дата окончания</Label>
              <p className="text-sm font-medium text-primary">
                {format(
                  addDays(
                    extendingPartner?.paid_until && new Date(extendingPartner.paid_until) > new Date()
                      ? new Date(extendingPartner.paid_until)
                      : new Date(),
                    extendDays
                  ),
                  'dd MMMM yyyy',
                  { locale: ru }
                )}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendingPartner(null)}>
              Отмена
            </Button>
            <Button
              className="bg-gradient-primary"
              onClick={() => extendingPartner && extendMutation.mutate({ id: extendingPartner.id, days: extendDays })}
              disabled={extendMutation.isPending}
            >
              {extendMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Продлить'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Edit form component
function EditPartnerForm({ 
  partner, 
  onSave, 
  onCancel,
  isLoading 
}: { 
  partner: PartnerProfile;
  onSave: (data: Partial<PartnerProfile>) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: partner.name,
    city: partner.city || '',
    phone: partner.phone || '',
    profession: partner.profession || '',
    age: partner.age || '',
    self_description: partner.self_description || '',
    agency_name: partner.agency_name || '',
    agency_description: partner.agency_description || '',
    website: partner.website || '',
    youtube: partner.youtube || '',
    tg_channel: partner.tg_channel || '',
    office_address: partner.office_address || '',
    status: partner.status || 'active',
    partner_type: partner.partner_type || 'free',
    is_recommended: partner.is_recommended || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      age: formData.age ? Number(formData.age) : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Имя *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="bg-input border-border"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Город</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="bg-input border-border"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Телефон</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="bg-input border-border"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profession">Профессия</Label>
          <Input
            id="profession"
            value={formData.profession}
            onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
            className="bg-input border-border"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Статус</Label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            className="w-full h-10 px-3 rounded-md bg-input border border-border text-foreground"
          >
            <option value="active">Активен</option>
            <option value="inactive">Неактивен</option>
            <option value="archived">Архив</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="partner_type">Тип партнёра</Label>
          <select
            id="partner_type"
            value={formData.partner_type}
            onChange={(e) => setFormData({ ...formData, partner_type: e.target.value as any })}
            className="w-full h-10 px-3 rounded-md bg-input border border-border text-foreground"
          >
            <option value="free">Бесплатный</option>
            <option value="paid">Платный</option>
            <option value="star">Звезда</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_recommended"
          checked={formData.is_recommended}
          onChange={(e) => setFormData({ ...formData, is_recommended: e.target.checked })}
          className="rounded"
        />
        <Label htmlFor="is_recommended">Рекомендованный</Label>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Отмена
        </Button>
        <Button type="submit" className="bg-gradient-primary" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Сохранить'}
        </Button>
      </DialogFooter>
    </form>
  );
}
