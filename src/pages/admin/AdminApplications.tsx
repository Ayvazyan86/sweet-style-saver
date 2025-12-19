import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  FileText, 
  Check, 
  X, 
  Search,
  Loader2,
  Eye,
  User,
  Phone,
  MapPin,
  Globe,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Tables } from '@/integrations/supabase/types';

type PartnerApplication = Tables<'partner_applications'>;

export default function AdminApplications() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [viewingApplication, setViewingApplication] = useState<PartnerApplication | null>(null);
  const [rejectingApplication, setRejectingApplication] = useState<PartnerApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch pending applications
  const { data: applications, isLoading } = useQuery({
    queryKey: ['admin-applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_applications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PartnerApplication[];
    },
  });

  // Approve application mutation
  const approveMutation = useMutation({
    mutationFn: async (application: PartnerApplication) => {
      // Update application status
      const { error: updateError } = await supabase
        .from('partner_applications')
        .update({ 
          status: 'approved',
          moderated_at: new Date().toISOString()
        })
        .eq('id', application.id);
      
      if (updateError) throw updateError;

      // Create partner profile
      const { error: profileError } = await supabase
        .from('partner_profiles')
        .insert({
          user_id: application.user_id,
          application_id: application.id,
          name: application.name,
          age: application.age,
          profession: application.profession,
          city: application.city,
          agency_name: application.agency_name,
          agency_description: application.agency_description,
          self_description: application.self_description,
          phone: application.phone,
          tg_channel: application.tg_channel,
          website: application.website,
          youtube: application.youtube,
          office_address: application.office_address,
          status: 'active',
          partner_type: 'free'
        });
      
      if (profileError) throw profileError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
      setViewingApplication(null);
      toast.success('Заявка одобрена', { description: 'Партнёр создан' });
    },
    onError: (error) => {
      toast.error('Ошибка одобрения', { description: error.message });
    },
  });

  // Reject application mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from('partner_applications')
        .update({ 
          status: 'rejected',
          rejection_reason: reason,
          moderated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
      setRejectingApplication(null);
      setRejectionReason('');
      toast.success('Заявка отклонена');
    },
    onError: (error) => {
      toast.error('Ошибка отклонения', { description: error.message });
    },
  });

  // Filter applications
  const filteredApplications = applications?.filter(app => 
    app.name.toLowerCase().includes(search.toLowerCase()) ||
    app.phone?.toLowerCase().includes(search.toLowerCase()) ||
    app.city?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingApplications = filteredApplications?.filter(app => app.status === 'pending');
  const processedApplications = filteredApplications?.filter(app => app.status !== 'pending');

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-accent text-accent-foreground">Ожидает</Badge>;
      case 'approved':
        return <Badge className="bg-success text-success-foreground">Одобрена</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive text-destructive-foreground">Отклонена</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Модерация заявок</h1>
          <p className="text-muted-foreground">Одобрение и отклонение заявок партнёров</p>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <span className="text-muted-foreground">
            {pendingApplications?.length || 0} ожидают
          </span>
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

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Pending Applications */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent"></span>
                Ожидают модерации ({pendingApplications?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingApplications?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Нет заявок на модерацию
                </div>
              ) : (
                <div className="grid gap-4">
                  {pendingApplications?.map((app) => (
                    <ApplicationCard
                      key={app.id}
                      application={app}
                      onView={() => setViewingApplication(app)}
                      onApprove={() => approveMutation.mutate(app)}
                      onReject={() => setRejectingApplication(app)}
                      isApproving={approveMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Processed Applications */}
          {processedApplications && processedApplications.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Обработанные заявки ({processedApplications.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {processedApplications?.map((app) => (
                    <ApplicationCard
                      key={app.id}
                      application={app}
                      onView={() => setViewingApplication(app)}
                      showStatus
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* View Application Dialog */}
      <Dialog open={!!viewingApplication} onOpenChange={() => setViewingApplication(null)}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Заявка партнёра</DialogTitle>
            <DialogDescription>
              Подробная информация о заявке
            </DialogDescription>
          </DialogHeader>
          {viewingApplication && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                {viewingApplication.photo_url ? (
                  <img 
                    src={viewingApplication.photo_url} 
                    alt={viewingApplication.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-semibold">{viewingApplication.name}</h3>
                  {viewingApplication.profession && (
                    <p className="text-muted-foreground">{viewingApplication.profession}</p>
                  )}
                  {getStatusBadge(viewingApplication.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {viewingApplication.age && (
                  <InfoItem icon={User} label="Возраст" value={`${viewingApplication.age} лет`} />
                )}
                {viewingApplication.city && (
                  <InfoItem icon={MapPin} label="Город" value={viewingApplication.city} />
                )}
                {viewingApplication.phone && (
                  <InfoItem icon={Phone} label="Телефон" value={viewingApplication.phone} />
                )}
                {viewingApplication.website && (
                  <InfoItem icon={Globe} label="Сайт" value={viewingApplication.website} />
                )}
                <InfoItem 
                  icon={Calendar} 
                  label="Дата заявки" 
                  value={format(new Date(viewingApplication.created_at!), 'dd MMM yyyy HH:mm', { locale: ru })} 
                />
              </div>

              {viewingApplication.self_description && (
                <div>
                  <h4 className="font-medium mb-2">О себе</h4>
                  <p className="text-muted-foreground text-sm">{viewingApplication.self_description}</p>
                </div>
              )}

              {viewingApplication.agency_name && (
                <div>
                  <h4 className="font-medium mb-2">Агентство: {viewingApplication.agency_name}</h4>
                  {viewingApplication.agency_description && (
                    <p className="text-muted-foreground text-sm">{viewingApplication.agency_description}</p>
                  )}
                </div>
              )}

              {viewingApplication.rejection_reason && (
                <div className="p-4 bg-destructive/10 rounded-lg">
                  <h4 className="font-medium text-destructive mb-1">Причина отклонения</h4>
                  <p className="text-sm">{viewingApplication.rejection_reason}</p>
                </div>
              )}

              {viewingApplication.status === 'pending' && (
                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setViewingApplication(null);
                      setRejectingApplication(viewingApplication);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Отклонить
                  </Button>
                  <Button
                    className="bg-success text-success-foreground hover:bg-success/90"
                    onClick={() => approveMutation.mutate(viewingApplication)}
                    disabled={approveMutation.isPending}
                  >
                    {approveMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Одобрить
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectingApplication} onOpenChange={() => setRejectingApplication(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Отклонить заявку</DialogTitle>
            <DialogDescription>
              Укажите причину отклонения заявки "{rejectingApplication?.name}"
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Причина отклонения..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="bg-input border-border min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingApplication(null)}>
              Отмена
            </Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => rejectingApplication && rejectMutation.mutate({ 
                id: rejectingApplication.id, 
                reason: rejectionReason 
              })}
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
            >
              {rejectMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Отклонить'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ApplicationCard({ 
  application, 
  onView, 
  onApprove, 
  onReject,
  isApproving,
  showStatus
}: { 
  application: PartnerApplication;
  onView: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  isApproving?: boolean;
  showStatus?: boolean;
}) {
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-accent text-accent-foreground">Ожидает</Badge>;
      case 'approved':
        return <Badge className="bg-success text-success-foreground">Одобрена</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive text-destructive-foreground">Отклонена</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border">
      <div className="flex items-center gap-4">
        {application.photo_url ? (
          <img 
            src={application.photo_url} 
            alt={application.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{application.name}</h3>
            {showStatus && getStatusBadge(application.status)}
          </div>
          <p className="text-sm text-muted-foreground">
            {[application.profession, application.city].filter(Boolean).join(' • ') || 'Нет данных'}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(application.created_at!), 'dd MMM yyyy', { locale: ru })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onView}>
          <Eye className="h-4 w-4" />
        </Button>
        {onApprove && onReject && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={onReject}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onApprove}
              disabled={isApproving}
              className="text-success hover:text-success"
            >
              {isApproving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
