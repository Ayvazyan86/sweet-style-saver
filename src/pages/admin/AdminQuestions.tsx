import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
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
  HelpCircle,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function AdminQuestions() {
  const [search, setSearch] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const queryClient = useQueryClient();

  const { data: questions, isLoading } = useQuery({
    queryKey: ['admin-questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
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
    mutationFn: async (questionId: string) => {
      const { error } = await supabase
        .from('questions')
        .update({ 
          status: 'approved',
          moderated_at: new Date().toISOString()
        })
        .eq('id', questionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
      toast.success('Вопрос одобрен');
      setSelectedQuestion(null);
    },
    onError: () => {
      toast.error('Ошибка при одобрении вопроса');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ questionId, reason }: { questionId: string; reason: string }) => {
      const { error } = await supabase
        .from('questions')
        .update({ 
          status: 'rejected',
          rejection_reason: reason,
          moderated_at: new Date().toISOString()
        })
        .eq('id', questionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
      toast.success('Вопрос отклонён');
      setRejectDialogOpen(false);
      setSelectedQuestion(null);
      setRejectReason('');
    },
    onError: () => {
      toast.error('Ошибка при отклонении вопроса');
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

  const filteredQuestions = questions?.filter(question => 
    question.text?.toLowerCase().includes(search.toLowerCase()) ||
    question.details?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingQuestions = filteredQuestions?.filter(q => q.status === 'pending') || [];
  const processedQuestions = filteredQuestions?.filter(q => q.status !== 'pending') || [];

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
          <h1 className="text-2xl font-bold text-foreground">Вопросы</h1>
          <p className="text-muted-foreground">
            {pendingQuestions.length} на модерации, {processedQuestions.length} обработано
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по тексту вопроса..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {pendingQuestions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">На модерации</h2>
          <div className="grid gap-4">
            {pendingQuestions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                onView={() => setSelectedQuestion(question)}
                onApprove={() => approveMutation.mutate(question.id)}
                onReject={() => {
                  setSelectedQuestion(question);
                  setRejectDialogOpen(true);
                }}
                getStatusBadge={getStatusBadge}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Все вопросы</h2>
        <div className="grid gap-4">
          {processedQuestions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              onView={() => setSelectedQuestion(question)}
              getStatusBadge={getStatusBadge}
            />
          ))}
        </div>
        {processedQuestions.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Вопросы не найдены</p>
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={!!selectedQuestion && !rejectDialogOpen} onOpenChange={() => setSelectedQuestion(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Детали вопроса</DialogTitle>
          </DialogHeader>
          {selectedQuestion && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedQuestion.status)}
                <span className="text-sm text-muted-foreground">
                  {format(new Date(selectedQuestion.created_at), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                </span>
              </div>
              
              <div className="grid gap-4">
                <InfoItem icon={HelpCircle} label="Вопрос" value={selectedQuestion.text} />
                {selectedQuestion.details && (
                  <InfoItem icon={FileText} label="Детали" value={selectedQuestion.details} />
                )}
                <InfoItem 
                  icon={FileText} 
                  label="Категория" 
                  value={selectedQuestion.category?.name || 'Не указана'} 
                />
                {selectedQuestion.rejection_reason && (
                  <InfoItem 
                    icon={X} 
                    label="Причина отклонения" 
                    value={selectedQuestion.rejection_reason} 
                  />
                )}
              </div>

              {selectedQuestion.status === 'pending' && (
                <div className="flex gap-2 pt-4">
                  <Button onClick={() => approveMutation.mutate(selectedQuestion.id)} className="flex-1">
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
            <DialogTitle>Отклонить вопрос</DialogTitle>
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
                onClick={() => selectedQuestion && rejectMutation.mutate({ 
                  questionId: selectedQuestion.id, 
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

function QuestionCard({ 
  question, 
  onView, 
  onApprove, 
  onReject,
  getStatusBadge 
}: { 
  question: any;
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
              {getStatusBadge(question.status)}
              <span className="text-xs text-muted-foreground">
                {format(new Date(question.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
              </span>
            </div>
            <h3 className="font-medium text-foreground line-clamp-2">
              {question.text}
            </h3>
            {question.details && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {question.details}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              {question.category?.name && (
                <span>{question.category.name}</span>
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
