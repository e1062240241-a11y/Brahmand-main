import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { COLORS } from '../src/constants/theme';
import { BrandedLoading } from '../src/components/BrandedLoading';

export default function IndexRoute() {
  const { token, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <BrandedLoading />
    );
  }

  if (token) {
    return <Redirect href="/home" />;
  }

  return <Redirect href="/auth/entry-animation" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
