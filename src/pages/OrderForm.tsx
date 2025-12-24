import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTelegram } from '@/hooks/useTelegram';
import { useFormFieldSettings } from '@/hooks/useFormFieldSettings';
import { GlassCard } from '@/components/mini-app/GlassCard';
import { FormInput } from '@/components/mini-app/FormInput';
import { CategorySelect } from '@/components/mini-app/CategorySelect';
import { SubmitButton } from '@/components/mini-app/SubmitButton';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

export default function OrderForm() {
  const { t } = useLanguage();
  const { hapticFeedback } = useTelegram();
  const navigate = useNavigate();
  const { getLabel, isRequired, isVisible } = useFormFieldSettings('order');
  
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
    const digits = value.replace(/\D/g, '');
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBudget(e.target.value);
    updateField('budget', formatted);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (isRequired('category', true) && selectedCategory.length === 0) {
      newErrors.category = t('selectCategories');
    }
    if (isRequired('title', true) && !formData.title.trim()) {
      newErrors.title = t('required');
    }
    if (isRequired('text', true) && !formData.text.trim()) {
      newErrors.text = t('required');
    }
    if (isRequired('city') && !formData.city.trim()) {
      newErrors.city = t('required');
    }
    if (isRequired('budget') && !formData.budget.trim()) {
      newErrors.budget = t('required');
    }
    if (isRequired('contact') && !formData.contact.trim()) {
      newErrors.contact = t('required');
    }
    
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

    // Симуляция отправки (функционал временно отключён)
    setTimeout(() => {
      setLoading(false);
      hapticFeedback('success');
      toast.info('Функция временно недоступна', {
        description: 'Раздел заказов находится в разработке',
      });
    }, 1000);
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
            {isVisible('category', true) && (
              <CategorySelect
                selectedIds={selectedCategory}
                onChange={setSelectedCategory}
                multiple={true}
                error={errors.category}
              />
            )}

            {isVisible('title', true) && (
              <FormInput
                label={getLabel('title', 'Заголовок заказа')}
                required={isRequired('title', true)}
                value={formData.title}
                onChange={e => updateField('title', e.target.value)}
                placeholder="Кратко опишите задачу"
                error={errors.title}
              />
            )}

            {isVisible('text', true) && (
              <FormInput
                label={getLabel('text', 'Описание заказа')}
                required={isRequired('text', true)}
                multiline
                value={formData.text}
                onChange={e => updateField('text', e.target.value)}
                placeholder="Подробно опишите, что вам нужно..."
                error={errors.text}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              {isVisible('city', true) && (
                <FormInput
                  label={getLabel('city', t('city'))}
                  required={isRequired('city')}
                  value={formData.city}
                  onChange={e => updateField('city', e.target.value)}
                  placeholder={t('enterCity')}
                  error={errors.city}
                />
              )}
              {isVisible('budget', true) && (
                <FormInput
                  label={getLabel('budget', t('budget'))}
                  required={isRequired('budget')}
                  value={formData.budget}
                  onChange={handleBudgetChange}
                  placeholder="10 000 ₽"
                  error={errors.budget}
                />
              )}
            </div>

            {isVisible('contact', true) && (
              <FormInput
                label={getLabel('contact', t('contact'))}
                required={isRequired('contact')}
                value={formData.contact}
                onChange={e => updateField('contact', e.target.value)}
                placeholder="@username или телефон"
                error={errors.contact}
              />
            )}
          </div>
        </GlassCard>

        <SubmitButton loading={loading} variant="gold">
          {t('submit')}
        </SubmitButton>
      </form>
    </div>
  );
}
