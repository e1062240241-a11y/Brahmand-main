import React from 'react';
import { useRouter } from 'expo-router';
import JaapAppScreen from '../jaap-app/app/(tabs)/index';

export default function MantraJaapRoute() {
  const router = useRouter();

  return (
    <JaapAppScreen
      onExit={() => (router.canGoBack() ? router.back() : router.replace('/temple' as any))}
    />
  );
}
