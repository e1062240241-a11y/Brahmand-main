import React, { createContext, useContext, useCallback, useRef } from 'react';
import { useSharedValue, withTiming, SharedValue } from 'react-native-reanimated';

interface TabBarContextType {
  tabBarTranslateY: SharedValue<number>;
  showTabBar: () => void;
  hideTabBar: () => void;
  isVisible: React.MutableRefObject<boolean>;
}

const TabBarContext = createContext<TabBarContextType | undefined>(undefined);

export const TabBarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const tabBarTranslateY = useSharedValue(0);
  const isVisible = useRef(true);

  const showTabBar = useCallback(() => {
    if (!isVisible.current) {
      tabBarTranslateY.value = withTiming(0, { duration: 300 });
      isVisible.current = true;
    }
  }, []);

  const hideTabBar = useCallback(() => {
    if (isVisible.current) {
      tabBarTranslateY.value = withTiming(100, { duration: 300 });
      isVisible.current = false;
    }
  }, []);

  return (
    <TabBarContext.Provider value={{ tabBarTranslateY, showTabBar, hideTabBar, isVisible }}>
      {children}
    </TabBarContext.Provider>
  );
};

export const useTabBar = () => {
  const context = useContext(TabBarContext);
  if (!context) {
    throw new Error('useTabBar must be used within a TabBarProvider');
  }
  return context;
};
