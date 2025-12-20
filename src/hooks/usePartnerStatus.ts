import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTelegram } from './useTelegram';

interface PartnerProfile {
  id: string;
  name: string;
  profession: string | null;
  city: string | null;
  age: number | null;
  agency_name: string | null;
  agency_description: string | null;
  self_description: string | null;
  phone: string | null;
  tg_channel: string | null;
  website: string | null;
  youtube: string | null;
  office_address: string | null;
  partner_type: 'star' | 'paid' | 'free' | null;
  status: 'active' | 'inactive' | 'archived' | null;
  channel_post_id: number | null;
  user_id: string;
}

interface PartnerApplication {
  id: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
}

interface UsePartnerStatusResult {
  isPartner: boolean;
  partnerProfile: PartnerProfile | null;
  pendingApplication: PartnerApplication | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function usePartnerStatus(): UsePartnerStatusResult {
  const { user } = useTelegram();
  const [isPartner, setIsPartner] = useState(false);
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(null);
  const [pendingApplication, setPendingApplication] = useState<PartnerApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPartnerStatus = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Сначала находим профиль пользователя по telegram_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('telegram_id', user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (!profile) {
        setIsPartner(false);
        setPartnerProfile(null);
        setPendingApplication(null);
        setIsLoading(false);
        return;
      }

      // Проверяем наличие партнёрского профиля
      const { data: partnerData, error: partnerError } = await supabase
        .from('partner_profiles')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (partnerError) {
        throw partnerError;
      }

      if (partnerData) {
        setIsPartner(true);
        setPartnerProfile(partnerData as PartnerProfile);
        setPendingApplication(null);
      } else {
        setIsPartner(false);
        setPartnerProfile(null);

        // Проверяем наличие заявки
        const { data: appData, error: appError } = await supabase
          .from('partner_applications')
          .select('id, name, status, rejection_reason, created_at')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (appError) {
          throw appError;
        }

        if (appData) {
          setPendingApplication(appData as PartnerApplication);
        } else {
          setPendingApplication(null);
        }
      }
    } catch (err) {
      console.error('Error fetching partner status:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setIsPartner(false);
      setPartnerProfile(null);
      setPendingApplication(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPartnerStatus();
  }, [user?.id]);

  return {
    isPartner,
    partnerProfile,
    pendingApplication,
    isLoading,
    error,
    refetch: fetchPartnerStatus,
  };
}
