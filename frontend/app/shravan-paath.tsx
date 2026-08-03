import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ShravanPaathPage() {
  const router = useRouter();

  return (
    <View style={styles.mainContainer}>
      {/* Signature App Theme Gradient: Top Half Orange fading into Bottom White */}
      <LinearGradient
        colors={['#FF8D57', '#EA9B76', '#FFEEE5', '#FFFFFF']}
        locations={[0, 0.12, 0.28, 1]}
        style={styles.gradientBg}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Top Header Navigation (Back Button Only) */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.topHeaderBack}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={24} color="#F25C05" />
          </TouchableOpacity>

          <View style={{ width: 40 }} />
        </View>

        {/* Root Content Area (Blank Layout Ready for Custom Design) */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Custom design components can be added here */}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradientBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topHeaderBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
});
