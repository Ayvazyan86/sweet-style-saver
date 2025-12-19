import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTelegram } from '@/hooks/useTelegram';
import { GlassCard } from '@/components/mini-app/GlassCard';
import { ArrowLeft, UserPlus, ShoppingCart, HelpCircle, Clock, CheckCircle, XCircle, Hourglass } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

type Status = 'pending' | 'approved' | 'rejected' | 'awaiting_partners' | 'active' | 'expired';

interface ApplicationItem {
  id: string;
  type: 'partner' | 'order' | 'question';
  title: string;
  status: Status;
  rejectionReason?: string;
  createdAt: string;
}

const StatusBadge = ({ status }: { status: Status }) => {
  const { t } = useLanguage();
  
  const configs: Record<Status, { icon: React.ReactNode; color: string; label: string }> = {
    pending: { 
      icon: <Clock className="w-3.5 h-3.5" />, 
      color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      label: t('pending')
    },
    approved: { 
      icon: <CheckCircle className="w-3.5 h-3.5" />, 
      color: 'bg-green-500/20 text-green-400 border-green-500/30',
      label: t('approved')
    },
    rejected: { 
      icon: <XCircle className="w-3.5 h-3.5" />, 
      color: 'bg-red-500/20 text-red-400 border-red-500/30',
      label: t('rejected')
    },
    awaiting_partners: { 
      icon: <Hourglass className="w-3.5 h-3.5" />, 
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      label: t('awaitingPartners')
    },
    active: { 
      icon: <CheckCircle className="w-3.5 h-3.5" />, 
      color: 'bg-primary/20 text-primary border-primary/30',
      label: t('active')
    },
    expired: { 
      icon: <XCircle className="w-3.5 h-3.5" />, 
      color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      label: t('expired')
    },
  };

  const config = configs[status];

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
      config.color
    )}>
      {config.icon}
      {config.label}
    </span>
  );
};

const TypeIcon = ({ type }: { type: 'partner' | 'order' | 'question' }) => {
  const icons = {
    partner: <UserPlus className="w-5 h-5 text-white" />,
    order: <ShoppingCart className="w-5 h-5 text-white" />,
    question: <HelpCircle className="w-5 h-5 text-white" />,
  };
  
  const gradients = {
    partner: 'bg-gradient-primary',
    order: 'bg-gradient-gold',
    question: 'bg-gradient-to-br from-emerald-500 to-teal-600',
  };

  return (
    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', gradients[type])}>
      {icons[type]}
    </div>
  );
};

export default function MyApplications() {
  const { t } = useLanguage();
  const { user } = useTelegram();
  const navigate = useNavigate();
  
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchApplications();
    }
  }, [user?.id]);

  const fetchApplications = async () => {
    try {
      // Получаем профиль пользователя
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('telegram_id', user?.id || 0)
        .maybeSingle();

      if (!profile) {
        setLoading(false);
        return;
      }

      // Параллельно получаем все заявки
      const [partnersRes, ordersRes, questionsRes] = await Promise.all([
        supabase
          .from('partner_applications')
          .select('id, name, status, rejection_reason, created_at')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('orders')
          .select('id, text, status, rejection_reason, created_at')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('questions')
          .select('id, text, status, rejection_reason, created_at')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false }),
      ]);

      const items: ApplicationItem[] = [];

      partnersRes.data?.forEach(p => {
        items.push({
          id: p.id,
          type: 'partner',
          title: `Заявка партнёра: ${p.name}`,
          status: p.status as Status,
          rejectionReason: p.rejection_reason || undefined,
          createdAt: p.created_at,
        });
      });

      ordersRes.data?.forEach(o => {
        items.push({
          id: o.id,
          type: 'order',
          title: o.text.substring(0, 50) + (o.text.length > 50 ? '...' : ''),
          status: o.status as Status,
          rejectionReason: o.rejection_reason || undefined,
          createdAt: o.created_at,
        });
      });

      questionsRes.data?.forEach(q => {
        items.push({
          id: q.id,
          type: 'question',
          title: q.text.substring(0, 50) + (q.text.length > 50 ? '...' : ''),
          status: q.status as Status,
          rejectionReason: q.rejection_reason || undefined,
          createdAt: q.created_at,
        });
      });

      // Сортируем по дате
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setApplications(items);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-xl bg-card/50 flex items-center justify-center border border-white/10 hover:border-primary/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{t('myApplications')}</h1>
          <p className="text-sm text-muted-foreground">История ваших заявок</p>
        </div>
      </div>

      <div className="space-y-4 max-w-md mx-auto">
        {loading ? (
          // Skeleton loading
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-card/50 rounded-2xl animate-pulse" />
          ))
        ) : applications.length === 0 ? (
          <GlassCard className="text-center py-12">
            <p className="text-muted-foreground">У вас пока нет заявок</p>
          </GlassCard>
        ) : (
          applications.map(app => (
            <GlassCard key={`${app.type}-${app.id}`}>
              <div className="flex gap-4">
                <TypeIcon type={app.type} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium text-foreground truncate">{app.title}</h3>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">{formatDate(app.createdAt)}</p>
                  {app.status === 'rejected' && app.rejectionReason && (
                    <p className="text-sm text-red-400 mt-2">
                      Причина: {app.rejectionReason}
                    </p>
                  )}
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}
