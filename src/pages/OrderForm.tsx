import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTelegram } from '@/hooks/useTelegram';
import { GlassCard } from '@/components/mini-app/GlassCard';
import { FormInput } from '@/components/mini-app/FormInput';
import { CategorySelect } from '@/components/mini-app/CategorySelect';
import { SubmitButton } from '@/components/mini-app/SubmitButton';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function OrderForm() {
  const { t } = useLanguage();
  const { user, hapticFeedback } = useTelegram();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    title: '',
    text: '',
    city: '',
    budget: '',
    contact: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Форматирование бюджета - только цифры с разделителями
  const formatBudget = (value: string) => {
    // Убираем всё кроме цифр
    const digits = value.replace(/\D/g, '');
    // Форматируем с пробелами (10 000)
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBudget(e.target.value);
    updateField('budget', formatted);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (selectedCategory.length === 0) newErrors.category = t('selectCategories');
    if (!formData.title.trim()) newErrors.title = t('required');
    if (!formData.text.trim()) newErrors.text = t('required');
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      hapticFeedback('error');
      return;
    }

    setLoading(true);
    hapticFeedback('light');

    try {
      // Находим или создаём профиль
      let profileId: string;
      
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('telegram_id', user?.id || 0)
        .maybeSingle();

      if (existingProfile) {
        profileId = existingProfile.id;
      } else {
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            telegram_id: user?.id || Math.floor(Math.random() * 1000000000),
            username: user?.username,
            first_name: user?.first_name,
            last_name: user?.last_name,
            language_code: user?.language_code || 'ru',
          })
          .select('id')
          .single();

        if (profileError) throw profileError;
        profileId = newProfile.id;
      }

      // Создаём заказ (используем первую категорию как основную)
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: profileId,
          category_id: selectedCategory[0],
          title: formData.title,
          text: formData.text,
          city: formData.city || null,
          budget: formData.budget || null,
          contact: formData.contact || null,
        })
        .select('id')
        .single();

      if (orderError) throw orderError;

      // Добавляем все выбранные категории в связующую таблицу
      if (selectedCategory.length > 0) {
        const categoryInserts = selectedCategory.map(categoryId => ({
          order_id: order.id,
          category_id: categoryId,
        }));

        const { error: catError } = await supabase
          .from('order_categories')
          .insert(categoryInserts);

        if (catError) throw catError;
      }

      hapticFeedback('success');
      toast.success(t('applicationSent'), {
        description: t('applicationSentDesc'),
      });
      
      navigate('/');
    } catch (error) {
      console.error('Error submitting order:', error);
      hapticFeedback('error');
      toast.error(t('error'), {
        description: t('errorDesc'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-xl bg-card/50 flex items-center justify-center border border-white/10 hover:border-primary/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{t('wantToOrder')}</h1>
          <p className="text-sm text-muted-foreground">Опишите ваш заказ</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Детали заказа</h2>
          </div>

          <div className="space-y-4">
            <CategorySelect
              selectedIds={selectedCategory}
              onChange={setSelectedCategory}
              multiple={true}
              error={errors.category}
            />

            <FormInput
              label="Заголовок заказа"
              required
              value={formData.title}
              onChange={e => updateField('title', e.target.value)}
              placeholder="Кратко опишите задачу"
              error={errors.title}
            />

            <FormInput
              label="Описание заказа"
              required
              multiline
              value={formData.text}
              onChange={e => updateField('text', e.target.value)}
              placeholder="Подробно опишите, что вам нужно..."
              error={errors.text}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label={t('city')}
                value={formData.city}
                onChange={e => updateField('city', e.target.value)}
                placeholder={t('enterCity')}
              />
              <FormInput
                label={t('budget')}
                value={formData.budget}
                onChange={handleBudgetChange}
                placeholder="10 000 ₽"
              />
            </div>

            <FormInput
              label={t('contact')}
              value={formData.contact}
              onChange={e => updateField('contact', e.target.value)}
              placeholder="@username или телефон"
            />
          </div>
        </GlassCard>

        <SubmitButton loading={loading} variant="gold">
          {t('submit')}
        </SubmitButton>
      </form>
    </div>
  );
}
