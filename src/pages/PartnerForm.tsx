import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTelegram } from '@/hooks/useTelegram';
import { GlassCard } from '@/components/mini-app/GlassCard';
import { FormInput } from '@/components/mini-app/FormInput';
import { CategorySelect } from '@/components/mini-app/CategorySelect';
import { SubmitButton } from '@/components/mini-app/SubmitButton';
import { PhotoUpload } from '@/components/mini-app/PhotoUpload';
import { CityAutocomplete } from '@/components/mini-app/CityAutocomplete';
import { AddressAutocomplete } from '@/components/mini-app/AddressAutocomplete';
import { PartnerPreviewCard } from '@/components/mini-app/PartnerPreviewCard';
import { TemplateSelect, CardTemplate } from '@/components/mini-app/TemplateSelect';
import { Dialog, DialogContent } from '@/components/ui/dialog';

import { ArrowLeft, ArrowRight, User, Briefcase, Phone, Check, Loader2, Eye, LayoutTemplate, ZoomIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

const STEPS = [
  { id: 1, title: 'Личные данные', icon: User },
  { id: 2, title: 'Деятельность', icon: Briefcase },
  { id: 3, title: 'Контакты', icon: Phone },
  { id: 4, title: 'Шаблон', icon: Eye },
];

export default function PartnerForm() {
  const { t } = useLanguage();
  const { user, hapticFeedback } = useTelegram();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Загружаем категории для предпросмотра
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true);
      return data || [];
    },
  });
  
  // Состояние для проверки Telegram канала
  const [tgChecking, setTgChecking] = useState(false);
  const [tgVerified, setTgVerified] = useState<boolean | null>(null);
  const [tgChannelInfo, setTgChannelInfo] = useState<{ title: string; type: string } | null>(null);
  
  // Состояние для модального увеличения баннера
  const [bannerZoomOpen, setBannerZoomOpen] = useState(false);
  
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
    rutube: '',
    dzen: '',
    vk_video: '',
    tg_video: '',
    office_address: '',
    photo_url: '',
    logo_url: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Маска для телефона +7 (999) 123-45-67
  const formatPhone = (value: string) => {
    // Убираем всё кроме цифр
    const digits = value.replace(/\D/g, '');
    
    // Начинаем с +7
    let formatted = '+7';
    
    // Если пользователь ввёл 8 или 7 в начале, пропускаем
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

  // Проверка Telegram канала через API
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
        console.error('Error checking Telegram channel:', error);
        setTgVerified(null);
        setTgChannelInfo(null);
        return;
      }

      if (data.exists) {
        setTgVerified(true);
        setTgChannelInfo({ title: data.channel.title, type: data.channel.type });
        // Убираем ошибку если канал найден
        if (errors.tg_channel) {
          setErrors(prev => ({ ...prev, tg_channel: '' }));
        }
      } else {
        setTgVerified(false);
        setTgChannelInfo(null);
      }
    } catch (err) {
      console.error('Error checking Telegram channel:', err);
      setTgVerified(null);
      setTgChannelInfo(null);
    } finally {
      setTgChecking(false);
    }
  }, [errors.tg_channel]);

  // Debounced проверка Telegram канала
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
    if (!phone) return true; // Опциональное поле
    const cleaned = phone.replace(/\D/g, '');
    // Проверяем что есть ровно 11 цифр (7 + 10 цифр номера)
    return cleaned.length === 11 && cleaned.startsWith('7');
  };

  const isValidUrl = (url: string) => {
    if (!url) return true; // Опциональное поле
    try {
      new URL(url);
      return true;
    } catch {
      return /^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}/.test(url);
    }
  };

  const isValidTelegram = (tg: string) => {
    if (!tg) return true; // Опциональное поле
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

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    
    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = t('required');
      if (!formData.age || parseInt(formData.age) < 16 || parseInt(formData.age) > 100) {
        newErrors.age = 'Введите корректный возраст (16-100)';
      }
      if (selectedCategories.length === 0) newErrors.categories = t('selectCategories');
    }

    if (step === 3) {
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
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      hapticFeedback('light');
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      hapticFeedback('error');
    }
  };

  const prevStep = () => {
    hapticFeedback('light');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      hapticFeedback('error');
      return;
    }

    setLoading(true);
    hapticFeedback('light');

    try {
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
          rutube: formData.rutube || null,
          dzen: formData.dzen || null,
          vk_video: formData.vk_video || null,
          tg_video: formData.tg_video || null,
          office_address: formData.office_address || null,
          photo_url: formData.photo_url || null,
          card_template_id: selectedTemplateId || null,
        })
        .select('id')
        .single();

      if (appError) throw appError;

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
      
      navigate('/');
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
          onClick={() => currentStep > 1 ? prevStep() : navigate('/')}
          className="w-10 h-10 rounded-xl bg-card/50 flex items-center justify-center border border-white/10 hover:border-primary/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{t('becomePartner')}</h1>
          <p className="text-sm text-muted-foreground">Шаг {currentStep} из 4</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-md mx-auto mb-8">
        <div className="flex items-center justify-between relative">
          {/* Progress Line */}
          <div className="absolute left-0 right-0 top-5 h-0.5 bg-card">
            <div 
              className="h-full bg-gradient-primary transition-all duration-500"
              style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
          
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            
            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                    isCompleted && 'bg-gradient-primary shadow-glow-primary',
                    isCurrent && 'bg-primary/20 border-2 border-primary',
                    !isCompleted && !isCurrent && 'bg-card border border-white/10'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-primary-foreground" />
                  ) : (
                    <Icon className={cn(
                      'w-5 h-5',
                      isCurrent ? 'text-primary' : 'text-muted-foreground'
                    )} />
                  )}
                </div>
                <span className={cn(
                  'text-xs mt-2 font-medium',
                  isCurrent ? 'text-primary' : 'text-muted-foreground'
                )}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto">
        {/* Step 1: Личные данные */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <GlassCard>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Личные данные</h2>
                  <p className="text-sm text-muted-foreground">Расскажите о себе</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-6 justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <PhotoUpload
                      value={formData.photo_url || undefined}
                      onChange={(url) => updateField('photo_url', url || '')}
                    />
                    <span className="text-sm text-muted-foreground">Аватарка</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <PhotoUpload
                      value={formData.logo_url || undefined}
                      onChange={(url) => updateField('logo_url', url || '')}
                      className="border-dashed"
                    />
                    <span className="text-sm text-muted-foreground">Логотип</span>
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_80px] gap-4">
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
                </div>

                <CityAutocomplete
                  label={t('city')}
                  value={formData.city}
                  onChange={(value) => updateField('city', value)}
                  placeholder={t('enterCity')}
                />

                <CategorySelect
                  selectedIds={selectedCategories}
                  onChange={setSelectedCategories}
                  multiple
                  error={errors.categories}
                />
              </div>
            </GlassCard>
          </div>
        )}

        {/* Step 2: Деятельность */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <GlassCard>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">О деятельности</h2>
                  <p className="text-sm text-muted-foreground">Опишите ваш опыт</p>
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

        {/* Step 3: Контакты */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
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
                  placeholder="+7 (___) ___-__-__"
                  hint="Номер форматируется автоматически"
                  error={errors.phone}
                  success={!!formData.phone && formData.phone.length === 18 && isValidPhone(formData.phone)}
                />

                <div className="space-y-2">
                  <FormInput
                    label={t('tgChannel')}
                    value={formData.tg_channel}
                    onChange={e => updateField('tg_channel', e.target.value)}
                    placeholder="@username или https://t.me/..."
                    hint={
                      tgChecking 
                        ? "Проверяем канал..." 
                        : tgVerified && tgChannelInfo 
                          ? `✓ ${tgChannelInfo.title} (${tgChannelInfo.type === 'channel' ? 'канал' : tgChannelInfo.type === 'supergroup' ? 'группа' : tgChannelInfo.type})`
                          : tgVerified === false 
                            ? "Канал не найден или недоступен" 
                            : "Можно указать @username или полную ссылку"
                    }
                    error={errors.tg_channel}
                    success={tgVerified === true}
                  />
                  {tgChecking && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Проверяем существование канала...</span>
                    </div>
                  )}
                </div>

                <FormInput
                  label={t('website')}
                  type="url"
                  value={formData.website}
                  onChange={e => updateField('website', e.target.value)}
                  placeholder="https://example.com"
                  hint="Укажите полный адрес сайта с https://"
                  error={errors.website}
                  success={!!formData.website && isValidUrl(formData.website)}
                />

                <FormInput
                  label="YouTube"
                  value={formData.youtube}
                  onChange={e => updateField('youtube', e.target.value)}
                  placeholder="https://youtube.com/@channel"
                  error={errors.youtube}
                  success={!!formData.youtube && isValidYoutube(formData.youtube)}
                />

                <FormInput
                  label="Rutube"
                  value={formData.rutube}
                  onChange={e => updateField('rutube', e.target.value)}
                  placeholder="https://rutube.ru/channel/..."
                  error={errors.rutube}
                  success={!!formData.rutube && isValidRutube(formData.rutube)}
                />

                <FormInput
                  label="Яндекс Дзен"
                  value={formData.dzen}
                  onChange={e => updateField('dzen', e.target.value)}
                  placeholder="https://dzen.ru/..."
                  error={errors.dzen}
                  success={!!formData.dzen && isValidDzen(formData.dzen)}
                />

                <FormInput
                  label="VK Видео"
                  value={formData.vk_video}
                  onChange={e => updateField('vk_video', e.target.value)}
                  placeholder="https://vk.com/video..."
                  error={errors.vk_video}
                  success={!!formData.vk_video && isValidVkVideo(formData.vk_video)}
                />

                <FormInput
                  label="Telegram видео"
                  value={formData.tg_video}
                  onChange={e => updateField('tg_video', e.target.value)}
                  placeholder="@channel или https://t.me/..."
                  hint="Канал с видеоконтентом"
                  error={errors.tg_video}
                  success={!!formData.tg_video && isValidTgVideo(formData.tg_video)}
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

        {/* Step 4: Шаблон карточки */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <GlassCard>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <LayoutTemplate className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Выбор шаблона</h2>
                  <p className="text-sm text-muted-foreground">Выберите дизайн вашей карточки</p>
                </div>
              </div>

              <TemplateSelect
                value={selectedTemplateId}
                onChange={(templateId, template) => {
                  setSelectedTemplateId(templateId);
                  setSelectedTemplate(template);
                }}
              />
            </GlassCard>

            {/* Banner Preview */}
            {selectedTemplate && (
              <div className="mt-6 animate-fade-in">
                <p className="text-xs text-muted-foreground mb-3">
                  Текст на баннере будет скорректирован на ваши данные после модерации анкеты
                </p>
                <div 
                  className="aspect-video rounded-xl overflow-hidden border border-white/10 cursor-pointer relative group"
                  onClick={() => setBannerZoomOpen(true)}
                >
                  <img 
                    src={selectedTemplate.image_url} 
                    alt="Выбранный шаблон баннера"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                
                {/* Zoom Modal */}
                <Dialog open={bannerZoomOpen} onOpenChange={setBannerZoomOpen}>
                  <DialogContent className="max-w-4xl w-[95vw] p-2 bg-background/95 backdrop-blur-sm">
                    <img 
                      src={selectedTemplate.image_url} 
                      alt="Увеличенный баннер"
                      className="w-full h-auto rounded-lg"
                    />
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        )}

        {/* Preview Card - only on step 3 */}
        {currentStep === 3 && (
          <div className="mt-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-3 text-muted-foreground">
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">Так будет выглядеть ваша карточка</span>
            </div>
            <PartnerPreviewCard 
              data={formData}
              categories={selectedCategories.map(id => {
                const cat = categoriesData?.find(c => c.id === id);
                return { id, name: cat?.name || '' };
              }).filter(c => c.name)}
            />
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-6 flex gap-3">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="flex-1 py-4 px-6 rounded-xl bg-card/50 border border-white/10 text-foreground font-medium hover:border-primary/50 transition-colors"
            >
              Назад
            </button>
          )}
          
          {currentStep < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex-1 py-4 px-6 rounded-xl bg-gradient-primary text-white font-semibold shadow-glow-primary hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              Далее
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <SubmitButton loading={loading} className="flex-1">
              {t('submit')}
            </SubmitButton>
          )}
        </div>
      </form>
    </div>
  );
}
