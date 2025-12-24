import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTelegram } from '@/hooks/useTelegram';
import { useFormFieldSettings } from '@/hooks/useFormFieldSettings';
import { GlassCard } from '@/components/mini-app/GlassCard';
import { FormInput } from '@/components/mini-app/FormInput';
import { CategorySelect } from '@/components/mini-app/CategorySelect';
import { SubmitButton } from '@/components/mini-app/SubmitButton';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function QuestionForm() {
  const { t } = useLanguage();
  const { hapticFeedback } = useTelegram();
  const navigate = useNavigate();
  const { getLabel, isRequired, isVisible } = useFormFieldSettings('question');
  
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    text: '',
    details: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (isRequired('category', true) && selectedCategory.length === 0) {
      newErrors.category = t('selectCategories');
    }
    if (isRequired('text', true) && !formData.text.trim()) {
      newErrors.text = t('required');
    }
    if (isRequired('details') && !formData.details.trim()) {
      newErrors.details = t('required');
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
        description: 'Раздел вопросов находится в разработке',
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
          <h1 className="text-xl font-bold text-foreground">{t('askQuestion')}</h1>
          <p className="text-sm text-muted-foreground">Задайте вопрос экспертам</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Ваш вопрос</h2>
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

            {isVisible('text', true) && (
              <FormInput
                label={getLabel('text', t('questionText'))}
                required={isRequired('text', true)}
                multiline
                value={formData.text}
                onChange={e => updateField('text', e.target.value)}
                placeholder={t('enterQuestionText')}
                error={errors.text}
              />
            )}

            {isVisible('details', true) && (
              <FormInput
                label={getLabel('details', t('details'))}
                required={isRequired('details')}
                multiline
                value={formData.details}
                onChange={e => updateField('details', e.target.value)}
                placeholder="Дополнительный контекст или детали..."
                error={errors.details}
              />
            )}
          </div>
        </GlassCard>

        <SubmitButton loading={loading} variant="secondary">
          {t('submit')}
        </SubmitButton>
      </form>
    </div>
  );
}
