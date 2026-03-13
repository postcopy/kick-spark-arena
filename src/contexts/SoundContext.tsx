import { createContext, useContext, ReactNode } from 'react';
import { useSoundEffects, UseSoundEffectsReturn } from '@/hooks/useSoundEffects';

const SoundContext = createContext<UseSoundEffectsReturn | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const soundEffects = useSoundEffects();

  return (
    <SoundContext.Provider value={soundEffects}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
}
