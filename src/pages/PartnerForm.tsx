import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTelegram } from '@/hooks/useTelegram';
import { GlassCard } from '@/components/mini-app/GlassCard';
import { FormInput } from '@/components/mini-app/FormInput';

const getInitialFormData = (userName: string): PartnerFormData => ({
  name: userName,
  birthDate: '',
  professions: [],
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
  office_address: '',
  photo_url: '',
  logo_url: '',
});
import { ProfessionSelect } from '@/components/mini-app/ProfessionSelect';
import { DateInput } from '@/components/mini-app/DateInput';
import { SubmitButton } from '@/components/mini-app/SubmitButton';
import { PhotoUpload } from '@/components/mini-app/PhotoUpload';
import { CityAutocomplete } from '@/components/mini-app/CityAutocomplete';
import { AddressAutocomplete } from '@/components/mini-app/AddressAutocomplete';
import { PartnerPreviewCard } from '@/components/mini-app/PartnerPreviewCard';
import { TemplateSelect, CardTemplate } from '@/components/mini-app/TemplateSelect';
import { FormStepTabs, FormStep } from '@/components/mini-app/FormStepTabs';
import { SuccessAnimation } from '@/components/mini-app/SuccessAnimation';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';

import { 
  ArrowLeft, ArrowRight, User, Briefcase, Phone, 
  Loader2, Eye, LayoutTemplate, ZoomIn, Image, Camera, 
  Share2, Building2, Video, MapPin
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

// 7 steps now: Photo, Personal, Work, Contacts, Video, Office, Template
const STEPS: FormStep[] = [
  { id: 1, title: 'Фото', shortTitle: 'Фото', icon: Camera },
  { id: 2, title: 'Личные данные', shortTitle: 'Личное', icon: User },
  { id: 3, title: 'Деятельность', shortTitle: 'Работа', icon: Briefcase },
  { id: 4, title: 'Контакты', shortTitle: 'Контакты', icon: Share2 },
  { id: 5, title: 'Видеоплатформы', shortTitle: 'Видео', icon: Video },
  { id: 6, title: 'Офис', shortTitle: 'Офис', icon: Building2 },
  { id: 7, title: 'Шаблон', shortTitle: 'Шаблон', icon: LayoutTemplate },
];

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
  }),
};

interface PartnerFormData {
  name: string;
  birthDate: string;
  professions: string[];
  city: string;
  agency_name: string;
  agency_description: string;
  self_description: string;
  phone: string;
  tg_channel: string;
  website: string;
  youtube: string;
  rutube: string;
  dzen: string;
  vk_video: string;
  office_address: string;
  photo_url: string;
  logo_url: string;
}

export default function PartnerForm() {
  const { t } = useLanguage();
  const { user, hapticFeedback } = useTelegram();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState<PartnerFormData>(() => {
    const storageKey = `form_draft_partner_form_${user?.id || 'guest'}`;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() < parsed.expiresAt) {
          return { ...getInitialFormData(user?.first_name || ''), ...parsed.data };
        }
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.error('Error loading form data:', error);
    }
    return getInitialFormData(user?.first_name || '');
  });

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Auto-save to localStorage
  useEffect(() => {
    const storageKey = `form_draft_partner_form_${user?.id || 'guest'}`;
    const saveData = () => {
      try {
        const storedData = {
          data: formData,
          timestamp: Date.now(),
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        };
        localStorage.setItem(storageKey, JSON.stringify(storedData));
        setLastSaved(new Date());
      } catch (error) {
        console.error('Error saving form data:', error);
      }
    };
    const timer = setTimeout(saveData, 500);
    return () => clearTimeout(timer);
  }, [formData, user?.id]);

  const clearSavedData = useCallback(() => {
    const storageKey = `form_draft_partner_form_${user?.id || 'guest'}`;
    localStorage.removeItem(storageKey);
  }, [user?.id]);

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

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
        
        const normalizedUsername = `@${data.channel.username}`;
        if (channel !== normalizedUsername) {
          setFormData(prev => ({ ...prev, tg_channel: normalizedUsername }));
        }
        
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
  }, [errors.tg_channel, setFormData]);

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
    const trimmed = tg.trim();
    if (/^@[a-zA-Z0-9_]{5,}$/.test(trimmed)) return true;
    if (/^[a-zA-Z0-9_]{5,}$/.test(trimmed)) return true;
    if (/^(https?:\/\/)?(t\.me|telegram\.me)\/[a-zA-Z0-9_]{5,}/.test(trimmed)) return true;
    return false;
  };

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

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    
    if (step === 1) {
      // Фото опционально
    }

    if (step === 2) {
      if (!formData.name.trim()) newErrors.name = t('required');
      if (!formData.birthDate) {
        newErrors.birthDate = 'Укажите дату рождения';
      } else {
        const birthDate = new Date(formData.birthDate);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 16 || age > 100) {
          newErrors.birthDate = 'Возраст должен быть от 16 до 100 лет';
        }
      }
      if (formData.professions.length === 0) newErrors.profession = 'Выберите профессию';
      
    }

    if (step === 4) {
      if (formData.phone && !isValidPhone(formData.phone)) {
        newErrors.phone = 'Неверный формат телефона';
      }
      if (formData.tg_channel && !isValidTelegram(formData.tg_channel)) {
        newErrors.tg_channel = 'Введите @username или ссылку t.me/...';
      }
      if (formData.website && !isValidUrl(formData.website)) {
        newErrors.website = 'Неверный формат URL';
      }
    }

    if (step === 5) {
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
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goToStep = (step: number) => {
    if (step === currentStep) return;
    setDirection(step > currentStep ? 1 : -1);
    setCurrentStep(step);
    hapticFeedback('light');
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep]);
      }
      setDirection(1);
      hapticFeedback('light');
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    } else {
      hapticFeedback('error');
    }
  };

  const prevStep = () => {
    setDirection(-1);
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
          age: formData.birthDate ? Math.floor((new Date().getTime() - new Date(formData.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null,
          profession: formData.professions.join(', ') || null,
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
          office_address: formData.office_address || null,
          photo_url: formData.photo_url || null,
          card_template_id: selectedTemplateId || null,
        })
        .select('id')
        .single();

      if (appError) throw appError;


      // Clear saved form data
      clearSavedData();

      hapticFeedback('success');
      setShowSuccess(true);
      
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

  const handleSuccessComplete = () => {
    navigate('/');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <GlassCard className="overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow-primary">
                <Camera className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Ваше фото</h2>
                <p className="text-sm text-muted-foreground">Добавьте аватар и логотип</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center py-6">
              <motion.div 
                className="flex flex-col items-center gap-3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="relative">
                  <PhotoUpload
                    value={formData.photo_url || undefined}
                    onChange={(url) => updateField('photo_url', url || '')}
                    icon={User}
                    hideLabel
                    className="w-28 h-28"
                  />
                  {formData.photo_url && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-success flex items-center justify-center"
                    >
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}
                </div>
                <span className="text-sm font-medium text-foreground">Ваше фото</span>
                <span className="text-xs text-muted-foreground">Будет на карточке</span>
              </motion.div>

              <div className="hidden sm:block w-px h-24 bg-gradient-to-b from-transparent via-border to-transparent" />

              <motion.div 
                className="flex flex-col items-center gap-3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="relative">
                  <PhotoUpload
                    value={formData.logo_url || undefined}
                    onChange={(url) => updateField('logo_url', url || '')}
                    icon={Image}
                    hideLabel
                    className="w-28 h-28"
                  />
                  {formData.logo_url && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-success flex items-center justify-center"
                    >
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}
                </div>
                <span className="text-sm font-medium text-foreground">Логотип</span>
                <span className="text-xs text-muted-foreground">Опционально</span>
              </motion.div>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-4">
              Рекомендуемый размер: 400×400 px, формат JPG или PNG
            </p>
          </GlassCard>
        );

      case 2:
        return (
          <GlassCard>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow-primary">
                <User className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Личные данные</h2>
                <p className="text-sm text-muted-foreground">Расскажите о себе</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-[1fr_140px] gap-4">
                <FormInput
                  label={t('name')}
                  required
                  value={formData.name}
                  onChange={e => updateField('name', e.target.value)}
                  placeholder={t('enterName')}
                  error={errors.name}
                  success={formData.name.trim().length >= 2}
                />
                <DateInput
                  label="Дата рождения"
                  value={formData.birthDate}
                  onChange={(val) => updateField('birthDate', val)}
                  error={errors.birthDate}
                  required
                />
              </div>

              <ProfessionSelect
                value={formData.professions}
                onChange={(value) => setFormData(prev => ({ ...prev, professions: value }))}
                error={errors.profession}
                required
                label="Профессия"
              />
            </div>
          </GlassCard>
        );

      case 3:
        return (
          <GlassCard>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-glow-gold">
                <Briefcase className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">О деятельности</h2>
                <p className="text-sm text-muted-foreground">Опишите ваш опыт</p>
              </div>
            </div>

            <div className="space-y-5">

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
        );

      case 4:
        return (
          <GlassCard>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Контакты</h2>
                <p className="text-sm text-muted-foreground">Как с вами связаться</p>
              </div>
            </div>

            <div className="space-y-5">
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
            </div>
          </GlassCard>
        );

      case 5:
        return (
          <GlassCard>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                <Video className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Видеоплатформы</h2>
                <p className="text-sm text-muted-foreground">Ваши каналы</p>
              </div>
            </div>

            <div className="space-y-4">
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
            </div>
          </GlassCard>
        );

      case 6:
        return (
          <div className="space-y-6">
            <GlassCard>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Офис</h2>
                  <p className="text-sm text-muted-foreground">Где вас найти</p>
                </div>
              </div>

              <div className="space-y-5">
                <CityAutocomplete
                  label={t('city')}
                  value={formData.city}
                  onChange={(value) => updateField('city', value)}
                  placeholder={t('enterCity')}
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

            {/* Preview Card */}
            <div className="animate-in fade-in duration-300">
              <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                <Eye className="w-4 h-4" />
                <span className="text-sm font-medium">Предпросмотр карточки</span>
              </div>
              <PartnerPreviewCard 
                data={{...formData, tg_video: ''}}
                categories={[]}
              />
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <GlassCard>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow-primary">
                  <LayoutTemplate className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Выбор шаблона</h2>
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
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <p className="text-xs text-muted-foreground">
                  Текст на баннере будет скорректирован на ваши данные после модерации
                </p>
                <div 
                  className="aspect-video rounded-2xl overflow-hidden border border-border/50 cursor-pointer relative group shadow-lg"
                  onClick={() => setBannerZoomOpen(true)}
                >
                  <img 
                    src={selectedTemplate.image_url} 
                    alt="Выбранный шаблон баннера"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                    <ZoomIn className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
                  </div>
                </div>
                
                {/* Zoom Modal */}
                <Dialog open={bannerZoomOpen} onOpenChange={setBannerZoomOpen}>
                  <DialogContent className="max-w-4xl w-[95vw] p-2 bg-background/95 backdrop-blur-xl">
                    <img 
                      src={selectedTemplate.image_url} 
                      alt="Увеличенный баннер"
                      className="w-full h-auto rounded-xl"
                    />
                  </DialogContent>
                </Dialog>
              </motion.div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Show success animation
  if (showSuccess) {
    return (
      <AnimatePresence>
        <SuccessAnimation 
          onComplete={handleSuccessComplete}
          message={t('applicationSent')}
          description={t('applicationSentDesc')}
        />
      </AnimatePresence>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => currentStep > 1 ? prevStep() : navigate('/')}
              className="w-10 h-10 rounded-xl bg-card/80 flex items-center justify-center border border-border/50 hover:border-primary/50 hover:bg-card transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">{t('becomePartner')}</h1>
              <p className="text-xs text-muted-foreground">
                Шаг {currentStep} из {STEPS.length} • {STEPS[currentStep - 1].title}
              </p>
            </div>
            {lastSaved && (
              <span className="text-[10px] text-muted-foreground/60">
                Сохранено
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Step Tabs */}
        <FormStepTabs
          steps={STEPS}
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={goToStep}
          allowNavigation={true}
        />

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="mt-6">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="mt-8 flex gap-3 pb-8">
            {currentStep > 1 && (
              <motion.button
                type="button"
                onClick={prevStep}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 py-4 px-6 rounded-xl bg-card/80 border border-border/50 text-foreground font-medium hover:border-primary/50 hover:bg-card transition-all duration-200 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Назад
              </motion.button>
            )}
            
            {currentStep < STEPS.length ? (
              <motion.button
                type="button"
                onClick={nextStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2",
                  "bg-gradient-primary text-primary-foreground shadow-glow-primary hover:shadow-glow-primary-lg"
                )}
              >
                Далее
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            ) : (
              <SubmitButton
                loading={loading}
                disabled={loading}
                className="flex-1"
              >
                {t('submit')}
              </SubmitButton>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
