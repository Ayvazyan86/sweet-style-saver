import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTelegram } from '@/hooks/useTelegram';
import { GlassCard } from '@/components/mini-app/GlassCard';
import { FormInput } from '@/components/mini-app/FormInput';
import { CategorySelect } from '@/components/mini-app/CategorySelect';
import { SubmitButton } from '@/components/mini-app/SubmitButton';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function PartnerForm() {
  const { t } = useLanguage();
  const { user, hapticFeedback } = useTelegram();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    name: user?.first_name || '',
    age: '',
    profession: '',
    city: '',
    agency_name: '',
    agency_description: '',
    self_description: '',
    phone: '',
    tg_channel: '',
    website: '',
    youtube: '',
    office_address: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = t('required');
    if (!formData.age || parseInt(formData.age) < 16 || parseInt(formData.age) > 100) {
      newErrors.age = 'Введите корректный возраст (16-100)';
    }
    if (!formData.profession.trim()) newErrors.profession = t('required');
    if (selectedCategories.length === 0) newErrors.categories = t('selectCategories');
    
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
      // Сначала создаём/находим профиль пользователя
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

      // Создаём заявку партнёра
      const { data: application, error: appError } = await supabase
        .from('partner_applications')
        .insert({
          user_id: profileId,
          name: formData.name,
          age: parseInt(formData.age),
          profession: formData.profession,
          city: formData.city || null,
          agency_name: formData.agency_name || null,
          agency_description: formData.agency_description || null,
          self_description: formData.self_description || null,
          phone: formData.phone || null,
          tg_channel: formData.tg_channel || null,
          website: formData.website || null,
          youtube: formData.youtube || null,
          office_address: formData.office_address || null,
        })
        .select('id')
        .single();

      if (appError) throw appError;

      // Добавляем категории
      const categoryInserts = selectedCategories.map(categoryId => ({
        application_id: application.id,
        category_id: categoryId,
      }));

      const { error: catError } = await supabase
        .from('partner_application_categories')
        .insert(categoryInserts);

      if (catError) throw catError;

      hapticFeedback('success');
      toast.success(t('applicationSent'), {
        description: t('applicationSentDesc'),
      });
      
      navigate('/my-applications');
    } catch (error) {
      console.error('Error submitting application:', error);
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
          <h1 className="text-xl font-bold text-foreground">{t('becomePartner')}</h1>
          <p className="text-sm text-muted-foreground">Заполните анкету</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
        {/* Основная информация */}
        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Основная информация</h2>
          </div>

          <div className="space-y-4">
            <FormInput
              label={t('name')}
              required
              value={formData.name}
              onChange={e => updateField('name', e.target.value)}
              placeholder={t('enterName')}
              error={errors.name}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label={t('age')}
                required
                type="number"
                min={16}
                max={100}
                value={formData.age}
                onChange={e => updateField('age', e.target.value)}
                placeholder="25"
                error={errors.age}
              />
              <FormInput
                label={t('city')}
                value={formData.city}
                onChange={e => updateField('city', e.target.value)}
                placeholder={t('enterCity')}
              />
            </div>

            <FormInput
              label={t('profession')}
              required
              value={formData.profession}
              onChange={e => updateField('profession', e.target.value)}
              placeholder={t('enterProfession')}
              error={errors.profession}
            />

            <CategorySelect
              selectedIds={selectedCategories}
              onChange={setSelectedCategories}
              multiple
              error={errors.categories}
            />
          </div>
        </GlassCard>

        {/* Агентство */}
        <GlassCard>
          <h2 className="text-lg font-semibold text-foreground mb-4">Об агентстве (опционально)</h2>
          
          <div className="space-y-4">
            <FormInput
              label={t('agencyName')}
              value={formData.agency_name}
              onChange={e => updateField('agency_name', e.target.value)}
              placeholder="Название вашего агентства"
            />

            <FormInput
              label={t('agencyDescription')}
              multiline
              value={formData.agency_description}
              onChange={e => updateField('agency_description', e.target.value)}
              placeholder={t('enterDescription')}
            />
          </div>
        </GlassCard>

        {/* О себе */}
        <GlassCard>
          <h2 className="text-lg font-semibold text-foreground mb-4">О себе</h2>
          
          <FormInput
            label={t('selfDescription')}
            multiline
            value={formData.self_description}
            onChange={e => updateField('self_description', e.target.value)}
            placeholder="Расскажите о себе и своём опыте..."
          />
        </GlassCard>

        {/* Контакты */}
        <GlassCard>
          <h2 className="text-lg font-semibold text-foreground mb-4">Контакты</h2>
          
          <div className="space-y-4">
            <FormInput
              label={t('phone')}
              type="tel"
              value={formData.phone}
              onChange={e => updateField('phone', e.target.value)}
              placeholder={t('enterPhone')}
            />

            <FormInput
              label={t('tgChannel')}
              value={formData.tg_channel}
              onChange={e => updateField('tg_channel', e.target.value)}
              placeholder="@username или ссылка"
            />

            <FormInput
              label={t('website')}
              type="url"
              value={formData.website}
              onChange={e => updateField('website', e.target.value)}
              placeholder={t('enterWebsite')}
            />

            <FormInput
              label={t('youtube')}
              value={formData.youtube}
              onChange={e => updateField('youtube', e.target.value)}
              placeholder="Ссылка на канал"
            />

            <FormInput
              label={t('officeAddress')}
              value={formData.office_address}
              onChange={e => updateField('office_address', e.target.value)}
              placeholder="Адрес офиса"
            />
          </div>
        </GlassCard>

        {/* Submit */}
        <SubmitButton loading={loading}>
          {t('submit')}
        </SubmitButton>
      </form>
    </div>
  );
}
