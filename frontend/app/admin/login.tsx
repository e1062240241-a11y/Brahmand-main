import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { adminPanelLogin } from '../../src/services/api';
import { useAdminStore } from '../../src/store/adminStore';
import { Ionicons } from '@expo/vector-icons';

export default function AdminLoginScreen() {
  const router = useRouter();
  const { isAdminAuthenticated, setAdminSession } = useAdminStore();
  const [username, setUsername] = useState('Admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // UI states for focus
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  useEffect(() => {
    if (isAdminAuthenticated) {
      router.replace('/admin');
    }
  }, [isAdminAuthenticated, router]);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Missing details', 'Please enter username and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await adminPanelLogin({
        username: username.trim(),
        password: password.trim(),
      });

      await setAdminSession(response.data.token, response.data.admin);
      router.replace('/admin');
    } catch (error: any) {
      const detail = error?.response?.data?.detail || 'Admin login failed';
      Alert.alert('Login failed', detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.headerIconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={40} color={COLORS.primary} />
          </View>
        </View>
        
        <Text style={styles.title}>Brahmand Admin</Text>
        <Text style={styles.subtitle}>Control Panel & Verifications</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Username</Text>
          <View style={[
            styles.inputWrapper, 
            usernameFocused && styles.inputWrapperFocused
          ]}>
            <Ionicons 
              name="person-outline" 
              size={20} 
              color={usernameFocused ? COLORS.primary : COLORS.textSecondary} 
              style={styles.inputIcon} 
            />
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              placeholderTextColor={COLORS.textLight}
              autoCapitalize="none"
              onFocus={() => setUsernameFocused(true)}
              onBlur={() => setUsernameFocused(false)}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password</Text>
          <View style={[
            styles.inputWrapper, 
            passwordFocused && styles.inputWrapperFocused
          ]}>
            <Ionicons 
              name="lock-closed-outline" 
              size={20} 
              color={passwordFocused ? COLORS.primary : COLORS.textSecondary} 
              style={styles.inputIcon} 
            />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={COLORS.textLight}
              secureTextEntry
              autoCapitalize="none"
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
          onPress={handleLogin} 
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.loginBtnContent}>
              <Text style={styles.loginButtonText}>Access Dashboard</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.replace('/')} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back-outline" size={16} color={COLORS.primary} style={{ marginRight: 4 }} />
          <Text style={styles.backText}>Back to App</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    gap: SPACING.md,
    shadowColor: '#CC5200',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(232, 224, 216, 0.6)',
  },
  headerIconContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 102, 0, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 102, 0, 0.15)',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: -SPACING.sm,
    marginBottom: SPACING.sm,
    fontWeight: '500',
  },
  inputContainer: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBF7',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFFFFF',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md - 2,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  backText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
