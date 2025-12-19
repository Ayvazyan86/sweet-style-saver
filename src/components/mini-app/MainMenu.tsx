import { useLanguage } from '@/contexts/LanguageContext';
import { useTelegram } from '@/hooks/useTelegram';
import { GlassCard } from './GlassCard';
import { UserPlus, ShoppingCart, HelpCircle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  onClick: () => void;
}

const MenuItem = ({ icon, title, description, gradient, onClick }: MenuItemProps) => (
  <GlassCard 
    hoverable 
    onClick={onClick}
    className="group"
  >
    <div className="flex items-center gap-4">
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${gradient} shadow-lg`}>
        {icon}
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

export const MainMenu = () => {
  const { t } = useLanguage();
  const { user, hapticFeedback, isTestMode } = useTelegram();
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    hapticFeedback('light');
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      {/* Header */}
      <div className="text-center mb-8 pt-4">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow-primary">
          <span className="text-3xl">🚀</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {user?.first_name ? `Привет, ${user.first_name}!` : 'Добро пожаловать!'}
        </h1>
        <p className="text-muted-foreground">Выберите действие</p>
      </div>

      {/* Menu Items */}
      <div className="space-y-4 max-w-md mx-auto">
        <MenuItem
          icon={<UserPlus className="w-7 h-7 text-white" />}
          title={t('becomePartner')}
          description="Станьте партнёром и получайте заказы"
          gradient="bg-gradient-primary"
          onClick={() => handleNavigate('/partner-form')}
        />
        
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
        {isTestMode && (
          <p className="mt-2 text-xs text-amber-500/80 bg-amber-500/10 rounded-lg py-2 px-4 inline-block">
            🧪 Режим тестирования (без Telegram)
          </p>
        )}
      </div>
    </div>
  );
};
