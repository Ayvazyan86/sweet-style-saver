import { useLanguage } from '@/contexts/LanguageContext';
import { useTelegram } from '@/hooks/useTelegram';
import { usePartnerStatus } from '@/hooks/usePartnerStatus';
import { GlassCard } from './GlassCard';
import { UserPlus, ShoppingCart, HelpCircle, ChevronRight, User, Loader2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  onClick: () => void;
  loading?: boolean;
}

const MenuItem = ({ icon, title, description, gradient, onClick, loading }: MenuItemProps) => (
  <GlassCard 
    hoverable 
    onClick={onClick}
    className="group"
  >
    <div className="flex items-center gap-4">
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${gradient} shadow-lg`}>
        {loading ? (
          <Loader2 className="w-7 h-7 text-white animate-spin" />
        ) : (
          icon
        )}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
    </div>
  </GlassCard>
);

// Компонент статуса заявки
const ApplicationStatus = ({ status, rejectionReason }: { status: 'pending' | 'approved' | 'rejected', rejectionReason?: string | null }) => {
  const statusConfig = {
    pending: {
      icon: Clock,
      title: 'Заявка на модерации',
      description: 'Ваша заявка рассматривается. Мы уведомим вас о результате.',
      bgClass: 'bg-amber-500/10 border-amber-500/20',
      iconClass: 'text-amber-500',
      textClass: 'text-amber-500',
    },
    approved: {
      icon: CheckCircle,
      title: 'Заявка одобрена',
      description: 'Поздравляем! Ваша карточка партнёра скоро появится.',
      bgClass: 'bg-emerald-500/10 border-emerald-500/20',
      iconClass: 'text-emerald-500',
      textClass: 'text-emerald-500',
    },
    rejected: {
      icon: XCircle,
      title: 'Заявка отклонена',
      description: rejectionReason || 'Вы можете подать новую заявку.',
      bgClass: 'bg-destructive/10 border-destructive/20',
      iconClass: 'text-destructive',
      textClass: 'text-destructive',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn(
      'rounded-xl border p-4 mb-4',
      config.bgClass
    )}>
      <div className="flex items-start gap-3">
        <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', config.iconClass)} />
        <div>
          <h3 className={cn('font-semibold', config.textClass)}>{config.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
        </div>
      </div>
    </div>
  );
};

export const MainMenu = () => {
  const { t } = useLanguage();
  const { user, hapticFeedback } = useTelegram();
  const { isPartner, pendingApplication, isLoading: partnerLoading } = usePartnerStatus();
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    hapticFeedback('light');
    navigate(path);
  };

  // Если нет пользователя Telegram - показываем сообщение
  if (!user) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow-primary">
            <span className="text-3xl">📱</span>
          </div>
          <h1 className="text-xl font-bold text-foreground mb-3">
            Откройте в Telegram
          </h1>
          <p className="text-muted-foreground">
            Это приложение работает только внутри Telegram. Откройте бота @av_rekomenduet_bot для начала работы.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      {/* Header */}
      <div className="text-center mb-8 pt-4">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow-primary">
          <span className="text-3xl">🚀</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Привет, {user.first_name}!
        </h1>
        <p className="text-muted-foreground">Выберите действие</p>
      </div>

      {/* Menu Items */}
      <div className="space-y-4 max-w-md mx-auto">
        {/* Статус заявки */}
        {pendingApplication && !isPartner && (
          <ApplicationStatus 
            status={pendingApplication.status} 
            rejectionReason={pendingApplication.rejection_reason}
          />
        )}

        {/* Динамический пункт меню: Стать партнёром / Моя карточка */}
        {isPartner ? (
          <MenuItem
            icon={<User className="w-7 h-7 text-white" />}
            title="Моя карточка"
            description="Редактируйте вашу карточку партнёра"
            gradient="bg-gradient-primary"
            onClick={() => handleNavigate('/my-card')}
            loading={partnerLoading}
          />
        ) : pendingApplication?.status === 'pending' ? null : (
          <MenuItem
            icon={<UserPlus className="w-7 h-7 text-white" />}
            title={t('becomePartner')}
            description={pendingApplication?.status === 'rejected' ? 'Подать новую заявку' : 'Станьте партнёром и получайте заказы'}
            gradient="bg-gradient-primary"
            onClick={() => handleNavigate('/partner-form')}
            loading={partnerLoading}
          />
        )}
        
        <MenuItem
          icon={<ShoppingCart className="w-7 h-7 text-white" />}
          title={t('wantToOrder')}
          description="Найдите исполнителя для вашего заказа"
          gradient="bg-gradient-gold"
          onClick={() => handleNavigate('/order-form')}
        />
        
        <MenuItem
          icon={<HelpCircle className="w-7 h-7 text-white" />}
          title={t('askQuestion')}
          description="Задайте вопрос экспертам"
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          onClick={() => handleNavigate('/question-form')}
        />
      </div>

      {/* Footer */}
      <div className="text-center mt-8 text-sm text-muted-foreground">
        <p>@av_rekomenduet_bot</p>
      </div>
    </div>
  );
};
