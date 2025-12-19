import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Search, 
  Loader2, 
  Eye, 
  Check, 
  X,
  Clock,
  MapPin,
  DollarSign,
  User,
  Phone
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function AdminOrders() {
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          category:categories(name),
          profile:profiles(first_name, last_name, username, telegram_id)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'approved',
          moderated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Заказ одобрен');
      setSelectedOrder(null);
    },
    onError: () => {
      toast.error('Ошибка при одобрении заказа');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'rejected',
          rejection_reason: reason,
          moderated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Заказ отклонён');
      setRejectDialogOpen(false);
      setSelectedOrder(null);
      setRejectReason('');
    },
    onError: () => {
      toast.error('Ошибка при отклонении заказа');
    }
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'На модерации', variant: 'secondary' },
      approved: { label: 'Одобрен', variant: 'default' },
      rejected: { label: 'Отклонён', variant: 'destructive' },
      awaiting_partners: { label: 'Ожидает партнёров', variant: 'outline' },
      active: { label: 'Активен', variant: 'default' },
      expired: { label: 'Истёк', variant: 'secondary' }
    };
    
    const config = statusConfig[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredOrders = orders?.filter(order => 
    order.title?.toLowerCase().includes(search.toLowerCase()) ||
    order.text?.toLowerCase().includes(search.toLowerCase()) ||
    order.city?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingOrders = filteredOrders?.filter(o => o.status === 'pending') || [];
  const processedOrders = filteredOrders?.filter(o => o.status !== 'pending') || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Заказы</h1>
          <p className="text-muted-foreground">
            {pendingOrders.length} на модерации, {processedOrders.length} обработано
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по названию, тексту, городу..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {pendingOrders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">На модерации</h2>
          <div className="grid gap-4">
            {pendingOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onView={() => setSelectedOrder(order)}
                onApprove={() => approveMutation.mutate(order.id)}
                onReject={() => {
                  setSelectedOrder(order);
                  setRejectDialogOpen(true);
                }}
                getStatusBadge={getStatusBadge}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Все заказы</h2>
        <div className="grid gap-4">
          {processedOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onView={() => setSelectedOrder(order)}
              getStatusBadge={getStatusBadge}
            />
          ))}
        </div>
        {processedOrders.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Заказы не найдены</p>
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={!!selectedOrder && !rejectDialogOpen} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Детали заказа</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedOrder.status)}
                <span className="text-sm text-muted-foreground">
                  {format(new Date(selectedOrder.created_at), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                </span>
              </div>
              
              <div className="grid gap-4">
                {selectedOrder.title && (
                  <InfoItem icon={Eye} label="Название" value={selectedOrder.title} />
                )}
                <InfoItem icon={User} label="Текст" value={selectedOrder.text} />
                <InfoItem icon={MapPin} label="Город" value={selectedOrder.city || 'Не указан'} />
                <InfoItem icon={DollarSign} label="Бюджет" value={selectedOrder.budget || 'Не указан'} />
                <InfoItem icon={Phone} label="Контакт" value={selectedOrder.contact || 'Не указан'} />
                <InfoItem 
                  icon={Clock} 
                  label="Категория" 
                  value={selectedOrder.category?.name || 'Не указана'} 
                />
                {selectedOrder.rejection_reason && (
                  <InfoItem 
                    icon={X} 
                    label="Причина отклонения" 
                    value={selectedOrder.rejection_reason} 
                  />
                )}
              </div>

              {selectedOrder.status === 'pending' && (
                <div className="flex gap-2 pt-4">
                  <Button onClick={() => approveMutation.mutate(selectedOrder.id)} className="flex-1">
                    <Check className="h-4 w-4 mr-2" />
                    Одобрить
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => setRejectDialogOpen(true)}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Отклонить
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отклонить заказ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Укажите причину отклонения..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialogOpen(false);
                  setRejectReason('');
                }}
                className="flex-1"
              >
                Отмена
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedOrder && rejectMutation.mutate({ 
                  orderId: selectedOrder.id, 
                  reason: rejectReason 
                })}
                disabled={!rejectReason.trim()}
                className="flex-1"
              >
                Отклонить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrderCard({ 
  order, 
  onView, 
  onApprove, 
  onReject,
  getStatusBadge 
}: { 
  order: any;
  onView: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  getStatusBadge: (status: string) => JSX.Element;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {getStatusBadge(order.status)}
              <span className="text-xs text-muted-foreground">
                {format(new Date(order.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
              </span>
            </div>
            <h3 className="font-medium text-foreground truncate">
              {order.title || order.text?.slice(0, 50)}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {order.text}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              {order.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {order.city}
                </span>
              )}
              {order.budget && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {order.budget}
                </span>
              )}
              {order.category?.name && (
                <span>{order.category.name}</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onView}>
              <Eye className="h-4 w-4" />
            </Button>
            {onApprove && (
              <Button variant="default" size="sm" onClick={onApprove}>
                <Check className="h-4 w-4" />
              </Button>
            )}
            {onReject && (
              <Button variant="destructive" size="sm" onClick={onReject}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">{value}</p>
      </div>
    </div>
  );
}
