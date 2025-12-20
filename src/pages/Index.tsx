import { MainMenu } from '@/components/mini-app/MainMenu';
import { LandingPage } from '@/components/LandingPage';
import { useTelegram } from '@/hooks/useTelegram';

const Index = () => {
  const { webApp } = useTelegram();
  
  // If running inside Telegram WebApp, show the mini-app menu
  // Otherwise, show the landing page for web visitors
  if (webApp) {
    return <MainMenu />;
  }
  
  return <LandingPage />;
};

export default Index;
