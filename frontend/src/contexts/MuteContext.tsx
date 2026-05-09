import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

type MuteContextType = {
  isGloballyMuted: boolean;
  toggleMute: () => void;
  setMuted: (v: boolean) => void;
};

const MuteContext = createContext<MuteContextType>({
  isGloballyMuted: false,
  toggleMute: () => {},
  setMuted: () => {},
});

export const useGlobalMute = () => useContext(MuteContext);

export const MuteProvider = ({ children }: { children: React.ReactNode }) => {
  const [isGloballyMuted, setIsGloballyMuted] = useState(false);

  const toggleMute = useCallback(() => {
    setIsGloballyMuted(prev => !prev);
  }, []);

  const setMuted = useCallback((v: boolean) => {
    setIsGloballyMuted(v);
  }, []);

  return (
    <MuteContext.Provider value={{ isGloballyMuted, toggleMute, setMuted }}>
      {children}
    </MuteContext.Provider>
  );
};

export default MuteContext;
