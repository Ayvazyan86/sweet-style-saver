import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  FileText, 
  ShoppingBag, 
  HelpCircle,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';

interface StatsCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon: React.ElementType;
  trend?: number;
  color?: 'primary' | 'success' | 'warning' | 'destructive';
}

function StatsCard({ title, value, description, icon: Icon, trend, color = 'primary' }: StatsCardProps) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-accent/10 text-accent-foreground',
    destructive: 'bg-destructive/10 text-destructive',
  };

  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
            {trend !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className={`h-3 w-3 ${trend >= 0 ? 'text-success' : 'text-destructive'}`} />
                <span className={`text-xs ${trend >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {trend >= 0 ? '+' : ''}{trend}% за 7 дней
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  // Fetch partner applications stats
  const { data: applicationsStats, isLoading: loadingApplications } = useQuery({
    queryKey: ['admin-stats-applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_applications')
        .select('id, status, created_at');
      
      if (error) throw error;
      
      const total = data.length;
      const pending = data.filter(a => a.status === 'pending').length;
      const approved = data.filter(a => a.status === 'approved').length;
      const rejected = data.filter(a => a.status === 'rejected').length;
      
      // Last 7 days
      const weekAgo = subDays(new Date(), 7);
      const thisWeek = data.filter(a => new Date(a.created_at!) >= weekAgo).length;
      const twoWeeksAgo = subDays(new Date(), 14);
      const lastWeek = data.filter(a => {
        const date = new Date(a.created_at!);
        return date >= twoWeeksAgo && date < weekAgo;
      }).length;
      
      const trend = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0;
      
      return { total, pending, approved, rejected, thisWeek, trend };
    },
  });

  // Fetch partners stats
  const { data: partnersStats, isLoading: loadingPartners } = useQuery({
    queryKey: ['admin-stats-partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_profiles')
        .select('id, status, partner_type, created_at');
      
      if (error) throw error;
      
      const total = data.length;
      const active = data.filter(p => p.status === 'active').length;
      const inactive = data.filter(p => p.status === 'inactive').length;
      const stars = data.filter(p => p.partner_type === 'star').length;
      const paid = data.filter(p => p.partner_type === 'paid').length;
      const free = data.filter(p => p.partner_type === 'free').length;
      
      return { total, active, inactive, stars, paid, free };
    },
  });

  // Fetch orders stats
  const { data: ordersStats, isLoading: loadingOrders } = useQuery({
    queryKey: ['admin-stats-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, status, created_at');
      
      if (error) throw error;
      
      const total = data.length;
      const pending = data.filter(o => o.status === 'pending').length;
      const approved = data.filter(o => o.status === 'approved').length;
      const active = data.filter(o => o.status === 'active').length;
      
      return { total, pending, approved, active };
    },
  });

  // Fetch questions stats
  const { data: questionsStats, isLoading: loadingQuestions } = useQuery({
    queryKey: ['admin-stats-questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('id, status, created_at');
      
      if (error) throw error;
      
      const total = data.length;
      const pending = data.filter(q => q.status === 'pending').length;
      const approved = data.filter(q => q.status === 'approved').length;
      
      return { total, pending, approved };
    },
  });

  const isLoading = loadingApplications || loadingPartners || loadingOrders || loadingQuestions;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Статистика</h1>
        <p className="text-muted-foreground">Обзор данных системы</p>
      </div>

      {/* Main stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Всего заявок"
          value={applicationsStats?.total || 0}
          description={`${applicationsStats?.thisWeek || 0} за неделю`}
          icon={FileText}
          trend={applicationsStats?.trend}
          color="primary"
        />
        <StatsCard
          title="Партнёров"
          value={partnersStats?.total || 0}
          description={`${partnersStats?.active || 0} активных`}
          icon={Users}
          color="success"
        />
        <StatsCard
          title="Заказов"
          value={ordersStats?.total || 0}
          description={`${ordersStats?.active || 0} активных`}
          icon={ShoppingBag}
          color="warning"
        />
        <StatsCard
          title="Вопросов"
          value={questionsStats?.total || 0}
          description={`${questionsStats?.pending || 0} на модерации`}
          icon={HelpCircle}
          color="primary"
        />
      </div>

      {/* Detailed sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications breakdown */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Заявки партнёров
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent-foreground" />
                <span className="text-sm">Ожидают модерации</span>
              </div>
              <Badge className="bg-accent text-accent-foreground">
                {applicationsStats?.pending || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm">Одобрено</span>
              </div>
              <Badge className="bg-success/10 text-success">
                {applicationsStats?.approved || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm">Отклонено</span>
              </div>
              <Badge className="bg-destructive/10 text-destructive">
                {applicationsStats?.rejected || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Partners breakdown */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-success" />
              Партнёры
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Звёзды</span>
              <Badge className="bg-primary/10 text-primary">
                ⭐ {partnersStats?.stars || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Платные</span>
              <Badge className="bg-success/10 text-success">
                {partnersStats?.paid || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Бесплатные</span>
              <Badge variant="secondary">
                {partnersStats?.free || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-sm text-muted-foreground">Неактивные</span>
              <Badge variant="outline" className="text-muted-foreground">
                {partnersStats?.inactive || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Orders breakdown */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-accent-foreground" />
              Заказы
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent-foreground" />
                <span className="text-sm">На модерации</span>
              </div>
              <Badge className="bg-accent text-accent-foreground">
                {ordersStats?.pending || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm">Одобрено</span>
              </div>
              <Badge className="bg-success/10 text-success">
                {ordersStats?.approved || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm">Активные</span>
              </div>
              <Badge className="bg-primary/10 text-primary">
                {ordersStats?.active || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Questions breakdown */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Вопросы
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent-foreground" />
                <span className="text-sm">На модерации</span>
              </div>
              <Badge className="bg-accent text-accent-foreground">
                {questionsStats?.pending || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm">Одобрено</span>
              </div>
              <Badge className="bg-success/10 text-success">
                {questionsStats?.approved || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
