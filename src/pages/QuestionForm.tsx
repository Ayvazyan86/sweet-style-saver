import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTelegram } from '@/hooks/useTelegram';
import { GlassCard } from '@/components/mini-app/GlassCard';
import { FormInput } from '@/components/mini-app/FormInput';
import { CategorySelect } from '@/components/mini-app/CategorySelect';
import { SubmitButton } from '@/components/mini-app/SubmitButton';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function QuestionForm() {
  const { t } = useLanguage();
  const { user, hapticFeedback } = useTelegram();
  const navigate = useNavigate();
  
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
    
    if (selectedCategory.length === 0) newErrors.category = t('selectCategories');
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

      // Создаём вопрос (используем первую категорию как основную)
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .insert({
          user_id: profileId,
          category_id: selectedCategory[0],
          text: formData.text,
          details: formData.details || null,
        })
        .select('id')
        .single();

      if (questionError) throw questionError;

      // Добавляем все выбранные категории в связующую таблицу
      if (selectedCategory.length > 0) {
        const categoryInserts = selectedCategory.map(categoryId => ({
          question_id: question.id,
          category_id: categoryId,
        }));

        const { error: catError } = await supabase
          .from('question_categories')
          .insert(categoryInserts);

        if (catError) throw catError;
      }

      hapticFeedback('success');
      toast.success(t('applicationSent'), {
        description: t('applicationSentDesc'),
      });
      
      navigate('/');
    } catch (error) {
      console.error('Error submitting question:', error);
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
            <CategorySelect
              selectedIds={selectedCategory}
              onChange={setSelectedCategory}
              multiple={true}
              error={errors.category}
            />

            <FormInput
              label={t('questionText')}
              required
              multiline
              value={formData.text}
              onChange={e => updateField('text', e.target.value)}
              placeholder={t('enterQuestionText')}
              error={errors.text}
            />

            <FormInput
              label={t('details')}
              multiline
              value={formData.details}
              onChange={e => updateField('details', e.target.value)}
              placeholder="Дополнительный контекст или детали..."
            />
          </div>
        </GlassCard>

        <SubmitButton loading={loading} variant="secondary">
          {t('submit')}
        </SubmitButton>
      </form>
    </div>
  );
}
