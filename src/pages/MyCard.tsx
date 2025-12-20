import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTelegram } from '@/hooks/useTelegram';
import { usePartnerStatus } from '@/hooks/usePartnerStatus';
import { GlassCard } from '@/components/mini-app/GlassCard';
import { FormInput } from '@/components/mini-app/FormInput';
import { CategorySelect } from '@/components/mini-app/CategorySelect';
import { SubmitButton } from '@/components/mini-app/SubmitButton';
import { PhotoUpload } from '@/components/mini-app/PhotoUpload';
import { CityAutocomplete } from '@/components/mini-app/CityAutocomplete';
import { AddressAutocomplete } from '@/components/mini-app/AddressAutocomplete';
import { ArrowLeft, User, Briefcase, Phone, Save, Loader2, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'personal', title: 'Личные', icon: User },
  { id: 'work', title: 'Деятельность', icon: Briefcase },
  { id: 'contacts', title: 'Контакты', icon: Phone },
];

export default function MyCard() {
  const { t } = useLanguage();
  const { user, hapticFeedback } = useTelegram();
  const { isPartner, partnerProfile, isLoading: statusLoading, refetch } = usePartnerStatus();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  
  // Состояние для проверки Telegram канала
  const [tgChecking, setTgChecking] = useState(false);
  const [tgVerified, setTgVerified] = useState<boolean | null>(null);
  const [tgChannelInfo, setTgChannelInfo] = useState<{ title: string; type: string } | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
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
    rutube: '',
    dzen: '',
    vk_video: '',
    tg_video: '',
    office_address: '',
    photo_url: '',
  });

  // Загружаем данные партнёра
  useEffect(() => {
    if (partnerProfile) {
      setFormData({
        name: partnerProfile.name || '',
        age: partnerProfile.age?.toString() || '',
        profession: partnerProfile.profession || '',
        city: partnerProfile.city || '',
        agency_name: partnerProfile.agency_name || '',
        agency_description: partnerProfile.agency_description || '',
        self_description: partnerProfile.self_description || '',
        phone: partnerProfile.phone || '',
        tg_channel: partnerProfile.tg_channel || '',
        website: partnerProfile.website || '',
        youtube: partnerProfile.youtube || '',
        rutube: partnerProfile.rutube || '',
        dzen: partnerProfile.dzen || '',
        vk_video: partnerProfile.vk_video || '',
        tg_video: partnerProfile.tg_video || '',
        office_address: partnerProfile.office_address || '',
        photo_url: '',
      });
      
      // Загружаем категории партнёра
      loadPartnerCategories(partnerProfile.id);
    }
  }, [partnerProfile]);

  const loadPartnerCategories = async (profileId: string) => {
    const { data, error } = await supabase
      .from('partner_profile_categories')
      .select('category_id')
      .eq('profile_id', profileId);

    if (!error && data) {
      setSelectedCategories(data.map(c => c.category_id));
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Маска для телефона +7 (999) 123-45-67
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    let formatted = '+7';
    const phoneDigits = digits.startsWith('7') || digits.startsWith('8') 
      ? digits.slice(1) 
      : digits;
    
    if (phoneDigits.length > 0) {
      formatted += ' (' + phoneDigits.slice(0, 3);
    }
    if (phoneDigits.length >= 3) {
      formatted += ') ' + phoneDigits.slice(3, 6);
    }
    if (phoneDigits.length >= 6) {
      formatted += '-' + phoneDigits.slice(6, 8);
    }
    if (phoneDigits.length >= 8) {
      formatted += '-' + phoneDigits.slice(8, 10);
    }
    
    return formatted;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    updateField('phone', formatted);
  };

  // Проверка Telegram канала
  const checkTelegramChannel = useCallback(async (channel: string) => {
    if (!channel || !isValidTelegram(channel)) {
      setTgVerified(null);
      setTgChannelInfo(null);
      return;
    }

    setTgChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-telegram-channel', {
        body: { channel }
      });

      if (error) {
        setTgVerified(null);
        setTgChannelInfo(null);
        return;
      }

      if (data.exists) {
        setTgVerified(true);
        setTgChannelInfo({ title: data.channel.title, type: data.channel.type });
        if (errors.tg_channel) {
          setErrors(prev => ({ ...prev, tg_channel: '' }));
        }
      } else {
        setTgVerified(false);
        setTgChannelInfo(null);
      }
    } catch (err) {
      setTgVerified(null);
      setTgChannelInfo(null);
    } finally {
      setTgChecking(false);
    }
  }, [errors.tg_channel]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.tg_channel && isValidTelegram(formData.tg_channel)) {
        checkTelegramChannel(formData.tg_channel);
      } else {
        setTgVerified(null);
        setTgChannelInfo(null);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [formData.tg_channel, checkTelegramChannel]);

  // Валидаторы
  const isValidPhone = (phone: string) => {
    if (!phone) return true;
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 11 && cleaned.startsWith('7');
  };

  const isValidUrl = (url: string) => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return /^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}/.test(url);
    }
  };

  const isValidTelegram = (tg: string) => {
    if (!tg) return true;
    return /^@[a-zA-Z0-9_]{5,}$/.test(tg) || /^https?:\/\/(t\.me|telegram\.me)\//.test(tg);
  };

  // Валидаторы для видеоплатформ
  const isValidYoutube = (url: string) => {
    if (!url) return true;
    return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(url);
  };

  const isValidRutube = (url: string) => {
    if (!url) return true;
    return /^https?:\/\/(www\.)?rutube\.ru\//.test(url);
  };

  const isValidDzen = (url: string) => {
    if (!url) return true;
    return /^https?:\/\/(www\.)?(dzen\.ru|zen\.yandex\.ru)\//.test(url);
  };

  const isValidVkVideo = (url: string) => {
    if (!url) return true;
    return /^https?:\/\/(www\.)?(vk\.com\/video|vkvideo\.ru)/.test(url);
  };

  const isValidTgVideo = (url: string) => {
    if (!url) return true;
    return /^https?:\/\/(t\.me|telegram\.me)\//.test(url) || /^@[a-zA-Z0-9_]{5,}$/.test(url);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = t('required');
    if (!formData.age || parseInt(formData.age) < 16 || parseInt(formData.age) > 100) {
      newErrors.age = 'Введите корректный возраст (16-100)';
    }
    if (!formData.profession.trim()) newErrors.profession = t('required');
    if (selectedCategories.length === 0) newErrors.categories = t('selectCategories');
    
    if (formData.phone && !isValidPhone(formData.phone)) {
      newErrors.phone = 'Неверный формат телефона';
    }
    if (formData.tg_channel && !isValidTelegram(formData.tg_channel)) {
      newErrors.tg_channel = 'Введите @username или ссылку t.me/...';
    }
    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = 'Неверный формат URL';
    }
    if (formData.youtube && !isValidYoutube(formData.youtube)) {
      newErrors.youtube = 'Введите ссылку youtube.com или youtu.be';
    }
    if (formData.rutube && !isValidRutube(formData.rutube)) {
      newErrors.rutube = 'Введите ссылку rutube.ru';
    }
    if (formData.dzen && !isValidDzen(formData.dzen)) {
      newErrors.dzen = 'Введите ссылку dzen.ru';
    }
    if (formData.vk_video && !isValidVkVideo(formData.vk_video)) {
      newErrors.vk_video = 'Введите ссылку vk.com/video или vkvideo.ru';
    }
    if (formData.tg_video && !isValidTgVideo(formData.tg_video)) {
      newErrors.tg_video = 'Введите @username или ссылку t.me';
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

    if (!partnerProfile) {
      toast.error('Профиль партнёра не найден');
      return;
    }

    setLoading(true);
    hapticFeedback('light');

    try {
      // Обновляем профиль партнёра
      const { error: updateError } = await supabase
        .from('partner_profiles')
        .update({
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
          rutube: formData.rutube || null,
          dzen: formData.dzen || null,
          vk_video: formData.vk_video || null,
          tg_video: formData.tg_video || null,
          office_address: formData.office_address || null,
        })
        .eq('id', partnerProfile.id);

      if (updateError) throw updateError;

      // Обновляем категории
      // Удаляем старые
      await supabase
        .from('partner_profile_categories')
        .delete()
        .eq('profile_id', partnerProfile.id);

      // Добавляем новые
      if (selectedCategories.length > 0) {
        const categoryInserts = selectedCategories.map(categoryId => ({
          profile_id: partnerProfile.id,
          category_id: categoryId,
        }));

        const { error: catError } = await supabase
          .from('partner_profile_categories')
          .insert(categoryInserts);

        if (catError) throw catError;
      }

      // Вызываем edge function для обновления поста на канале
      if (partnerProfile.channel_post_id) {
        try {
          await supabase.functions.invoke('update-partner-post', {
            body: { 
              partner_profile_id: partnerProfile.id 
            }
          });
        } catch (postError) {
          console.error('Error updating channel post:', postError);
          // Не прерываем процесс, просто логируем
        }
      }

      hapticFeedback('success');
      toast.success('Карточка обновлена', {
        description: 'Изменения сохранены и опубликованы на канале',
      });
      
      setHasChanges(false);
      refetch();
    } catch (error) {
      console.error('Error updating partner profile:', error);
      hapticFeedback('error');
      toast.error(t('error'), {
        description: 'Не удалось сохранить изменения',
      });
    } finally {
      setLoading(false);
    }
  };

  // Если пользователь не партнёр, перенаправляем
  useEffect(() => {
    if (!statusLoading && !isPartner) {
      navigate('/partner-form');
    }
  }, [statusLoading, isPartner, navigate]);

  if (statusLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

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
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">Моя карточка</h1>
          <p className="text-sm text-muted-foreground">Редактирование профиля</p>
        </div>
        {hasChanges && (
          <div className="flex items-center gap-2 text-amber-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Есть изменения</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="max-w-md mx-auto mb-6">
        <div className="flex gap-2 bg-card/50 p-1 rounded-xl border border-white/10">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-medium text-sm transition-all',
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-lg' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.title}
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto">
        {/* Personal Tab */}
        {activeTab === 'personal' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <GlassCard>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Личные данные</h2>
                  <p className="text-sm text-muted-foreground">Основная информация</p>
                </div>
              </div>

              <div className="space-y-4">
                <PhotoUpload
                  value={formData.photo_url || undefined}
                  onChange={(url) => updateField('photo_url', url || '')}
                />

                <FormInput
                  label={t('name')}
                  required
                  value={formData.name}
                  onChange={e => updateField('name', e.target.value)}
                  placeholder={t('enterName')}
                  error={errors.name}
                  success={formData.name.trim().length >= 2}
                />

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
                  success={!!formData.age && parseInt(formData.age) >= 16 && parseInt(formData.age) <= 100}
                />

                <CityAutocomplete
                  value={formData.city}
                  onChange={(city) => updateField('city', city)}
                  label={t('city')}
                />

                <FormInput
                  label={t('profession')}
                  required
                  value={formData.profession}
                  onChange={e => updateField('profession', e.target.value)}
                  placeholder={t('enterProfession')}
                  error={errors.profession}
                  success={formData.profession.trim().length >= 2}
                />

                <CategorySelect
                  selectedIds={selectedCategories}
                  onChange={(cats) => {
                    setSelectedCategories(cats);
                    setHasChanges(true);
                  }}
                  multiple
                  error={errors.categories}
                />
              </div>
            </GlassCard>
          </div>
        )}

        {/* Work Tab */}
        {activeTab === 'work' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <GlassCard>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">О деятельности</h2>
                  <p className="text-sm text-muted-foreground">Ваш опыт и услуги</p>
                </div>
              </div>

              <div className="space-y-4">
                <FormInput
                  label={t('agencyName')}
                  value={formData.agency_name}
                  onChange={e => updateField('agency_name', e.target.value)}
                  placeholder="Название вашего агентства"
                  success={formData.agency_name.trim().length >= 2}
                />

                <FormInput
                  label={t('agencyDescription')}
                  multiline
                  value={formData.agency_description}
                  onChange={e => updateField('agency_description', e.target.value)}
                  placeholder="Чем занимается ваше агентство..."
                  success={formData.agency_description.trim().length >= 10}
                />

                <FormInput
                  label={t('selfDescription')}
                  multiline
                  value={formData.self_description}
                  onChange={e => updateField('self_description', e.target.value)}
                  placeholder="Расскажите о себе и своём опыте..."
                  success={formData.self_description.trim().length >= 10}
                />
              </div>
            </GlassCard>
          </div>
        )}

        {/* Contacts Tab */}
        {activeTab === 'contacts' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <GlassCard>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Контактные данные</h2>
                  <p className="text-sm text-muted-foreground">Как с вами связаться</p>
                </div>
              </div>

              <div className="space-y-4">
                <FormInput
                  label={t('phone')}
                  type="tel"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="+7 (999) 123-45-67"
                  error={errors.phone}
                  success={formData.phone && isValidPhone(formData.phone)}
                />

                <div className="space-y-2">
                  <FormInput
                    label={t('tgChannel')}
                    value={formData.tg_channel}
                    onChange={e => updateField('tg_channel', e.target.value)}
                    placeholder="@username или t.me/..."
                    error={errors.tg_channel}
                    success={tgVerified === true}
                  />
                  {tgChecking && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Проверяем канал...
                    </div>
                  )}
                  {tgVerified === true && tgChannelInfo && (
                    <div className="flex items-center gap-2 text-sm text-emerald-500">
                      <Check className="w-4 h-4" />
                      {tgChannelInfo.title} ({tgChannelInfo.type})
                    </div>
                  )}
                  {tgVerified === false && (
                    <div className="flex items-center gap-2 text-sm text-red-500">
                      <AlertCircle className="w-4 h-4" />
                      Канал не найден
                    </div>
                  )}
                </div>

                <FormInput
                  label={t('website')}
                  type="url"
                  value={formData.website}
                  onChange={e => updateField('website', e.target.value)}
                  placeholder="https://example.com"
                  error={errors.website}
                  success={formData.website && isValidUrl(formData.website)}
                />

                <FormInput
                  label="YouTube"
                  type="url"
                  value={formData.youtube}
                  onChange={e => updateField('youtube', e.target.value)}
                  placeholder="https://youtube.com/@channel"
                  error={errors.youtube}
                  success={formData.youtube && isValidYoutube(formData.youtube)}
                />

                <FormInput
                  label="Rutube"
                  type="url"
                  value={formData.rutube}
                  onChange={e => updateField('rutube', e.target.value)}
                  placeholder="https://rutube.ru/channel/..."
                  error={errors.rutube}
                  success={formData.rutube && isValidRutube(formData.rutube)}
                />

                <FormInput
                  label="Яндекс Дзен"
                  type="url"
                  value={formData.dzen}
                  onChange={e => updateField('dzen', e.target.value)}
                  placeholder="https://dzen.ru/..."
                  error={errors.dzen}
                  success={formData.dzen && isValidDzen(formData.dzen)}
                />

                <FormInput
                  label="VK Видео"
                  type="url"
                  value={formData.vk_video}
                  onChange={e => updateField('vk_video', e.target.value)}
                  placeholder="https://vk.com/video..."
                  error={errors.vk_video}
                  success={formData.vk_video && isValidVkVideo(formData.vk_video)}
                />

                <FormInput
                  label="Telegram видео"
                  value={formData.tg_video}
                  onChange={e => updateField('tg_video', e.target.value)}
                  placeholder="@channel или https://t.me/..."
                  error={errors.tg_video}
                  success={formData.tg_video && isValidTgVideo(formData.tg_video)}
                />

                <AddressAutocomplete
                  label={t('officeAddress')}
                  value={formData.office_address}
                  onChange={(address) => updateField('office_address', address)}
                  placeholder="Москва, ул. Примерная, д. 1, офис 123"
                  hint="Адрес проверяется через Yandex Geocoder"
                />
              </div>
            </GlassCard>
          </div>
        )}

        <div className="mt-6">
          <SubmitButton loading={loading} disabled={!hasChanges}>
            <Save className="w-5 h-5 mr-2" />
            Сохранить изменения
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
