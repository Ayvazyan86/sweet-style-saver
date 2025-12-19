import { useEffect, useState } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    query_id?: string;
    auth_date?: number;
    hash?: string;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    setText: (text: string) => void;
  };
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  colorScheme: 'light' | 'dark';
  viewportHeight: number;
  viewportStableHeight: number;
  isExpanded: boolean;
  platform: string;
  version: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

// Фиксированный тестовый ID для разработки
const getTestTelegramId = (): number => {
  return 264133466;
};

export const useTelegram = () => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    
    if (tg && tg.initDataUnsafe?.user) {
      tg.ready();
      tg.expand();
      setWebApp(tg);
      setUser(tg.initDataUnsafe.user);
      setIsReady(true);
      setIsTestMode(false);
    } else {
      // Режим тестирования без Telegram
      setIsReady(true);
      setIsTestMode(true);
      
      // Стабильный mock user для тестирования
      const testId = getTestTelegramId();
      setUser({
        id: testId,
        first_name: 'Тестовый',
        last_name: 'Пользователь',
        username: 'test_user_' + testId.toString().slice(-4),
        language_code: 'ru'
      });
      
      console.log('🧪 Режим тестирования активен. Telegram ID:', testId);
    }
  }, []);

  const hapticFeedback = (type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning') => {
    if (webApp?.HapticFeedback) {
      if (['light', 'medium', 'heavy', 'rigid', 'soft'].includes(type)) {
        webApp.HapticFeedback.impactOccurred(type as 'light' | 'medium' | 'heavy' | 'rigid' | 'soft');
      } else {
        webApp.HapticFeedback.notificationOccurred(type as 'error' | 'success' | 'warning');
      }
    }
  };

  return {
    webApp,
    user,
    isReady,
    isTestMode,
    initData: webApp?.initData || '',
    hapticFeedback,
    colorScheme: webApp?.colorScheme || 'dark',
  };
};
