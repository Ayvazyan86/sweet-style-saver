import { useNavigate } from 'react-router-dom';
import { ExternalLink, UserPlus, Star, Shield, MessageCircle, ChevronRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Shield,
    title: 'Проверенные специалисты',
    description: 'Все партнёры проходят модерацию и рекомендованы лично',
  },
  {
    icon: Star,
    title: 'Только качество',
    description: 'Никакой рекламы за деньги — только реальные рекомендации',
  },
  {
    icon: MessageCircle,
    title: 'Прямой контакт',
    description: 'Связывайтесь с исполнителями напрямую через Telegram',
  },
];

const categories = [
  'Avito специалист', 'Дизайнер сайтов', 'Маркетолог', 'Юрист',
  'SMM специалист', 'Фотограф', 'Психолог', 'Риэлтор',
  'IT специалист', 'Косметолог', 'Фитнес-тренер', 'Стилист',
];

export const LandingPage = () => {
  const navigate = useNavigate();

  const openTelegramChannel = () => {
    window.open('https://t.me/av_rekomenduet', '_blank');
  };

  const openTelegramBot = () => {
    window.open('https://t.me/av_rekomenduet_bot', '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/20 rounded-full blur-[120px]" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 py-20 md:py-32">
          <div className="text-center">
            {/* Logo / Brand */}
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-primary shadow-glow-primary mb-8">
              <span className="text-5xl">🌟</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Айвазян{' '}
              <span className="text-gradient-primary">рекомендует</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Канал проверенных специалистов. Никакой рекламы за деньги — только реальные рекомендации от людей, с которыми я работал лично.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={openTelegramChannel}
                className="bg-gradient-primary hover:opacity-90 text-primary-foreground px-8 py-6 text-lg rounded-xl shadow-glow-primary"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Открыть канал
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                onClick={openTelegramBot}
                className="border-primary/30 hover:bg-primary/10 px-8 py-6 text-lg rounded-xl"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Стать партнёром
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
            Почему <span className="text-gradient-gold">нам доверяют</span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="group p-6 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-glow-primary"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 px-4 bg-card/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
            Категории специалистов
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Найдите профессионала в любой области — от IT до красоты
          </p>
          
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category, index) => (
              <span
                key={index}
                className="px-4 py-2 rounded-full bg-secondary/50 border border-border/50 text-foreground text-sm hover:border-primary/50 hover:bg-primary/10 transition-all cursor-default"
              >
                {category}
              </span>
            ))}
            <span className="px-4 py-2 rounded-full bg-gradient-primary text-primary-foreground text-sm font-medium">
              +20 категорий
            </span>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
            Как это <span className="text-gradient-primary">работает</span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Откройте бота', desc: 'Запустите @av_rekomenduet_bot в Telegram' },
              { step: '02', title: 'Заполните анкету', desc: 'Расскажите о своей деятельности и опыте' },
              { step: '03', title: 'Получите рекомендацию', desc: 'После проверки ваша карточка появится в канале' },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="text-7xl font-bold text-gradient-primary opacity-20 absolute -top-4 left-0">
                  {item.step}
                </div>
                <div className="relative z-10 pt-12">
                  <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
                {index < 2 && (
                  <ChevronRight className="hidden md:block absolute top-1/2 -right-4 w-8 h-8 text-primary/30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
            
            <div className="relative z-10 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Готовы стать партнёром?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                Присоединяйтесь к сообществу проверенных специалистов и получайте клиентов через рекомендации
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg"
                  onClick={openTelegramBot}
                  className="bg-gradient-gold hover:opacity-90 text-accent-foreground px-8 py-6 text-lg rounded-xl shadow-glow-gold"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Подать заявку
                </Button>
              </div>
              
              <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Бесплатно
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Без рекламы
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Только качество
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/50">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-muted-foreground text-sm">
            © 2024 Айвазян рекомендует • 
            <a href="https://t.me/av_rekomenduet" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
              @av_rekomenduet
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};