import { useCallback, useRef } from 'react';

export const useSuccessSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playSuccessSound = useCallback(() => {
    try {
      // Create or reuse AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      
      // Resume context if suspended (required by browsers)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Create oscillator for a pleasant "ding" sound
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Pleasant high-pitched tone
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      oscillator.type = 'sine';

      // Quick fade in and out for a soft "ding"
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch (error) {
      // Silently fail if audio is not supported
      console.debug('Audio not supported:', error);
    }
  }, []);

  return { playSuccessSound };
};
