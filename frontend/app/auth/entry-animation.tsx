import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { useAuthStore } from '../../src/store/authStore';

const LotusOrnament = () => (
  <Svg width={12} height={12} viewBox="0 0 12 12" fill="none" style={{ aspectRatio: 1 }}>
    <Path d="M11.6554 6.08004C11.5544 5.90256 11.3862 5.77311 11.1888 5.72082C10.8343 5.62956 10.4679 5.59287 10.1023 5.61202C10.2984 4.63922 10.1513 3.8698 10.0014 3.41354C9.87753 3.02521 9.47899 2.79444 9.08053 2.88034C8.58184 2.9914 8.10766 3.1927 7.68137 3.47431C7.36916 2.83655 6.91461 2.27904 6.35277 1.84481C6.0731 1.63506 5.68856 1.63506 5.40889 1.84481C4.84693 2.27891 4.39235 2.83645 4.08029 3.47431C3.654 3.1927 3.17982 2.9914 2.68113 2.88034C2.28267 2.79444 1.88413 3.02521 1.76028 3.41354C1.61326 3.8698 1.46623 4.63873 1.65932 5.61202C1.29373 5.59287 0.927358 5.62956 0.572824 5.72082C0.37541 5.77311 0.207297 5.90256 0.106272 6.08004C0.000550359 6.26185 -0.0277012 6.47852 0.0278597 6.68137C0.193999 7.29739 0.704167 8.46916 2.24937 9.39246C3.79458 10.3158 5.15209 10.3128 5.88328 10.3128C6.61448 10.3128 7.97443 10.3128 9.50984 9.39246C11.055 8.46916 11.5652 7.29739 11.7313 6.68137C11.7876 6.47884 11.7603 6.2622 11.6554 6.08004ZM2.50617 3.65466C2.50739 3.64961 2.51233 3.64639 2.51745 3.64731C2.97345 3.75032 3.40378 3.94489 3.78233 4.21923C3.60997 4.78309 3.52437 5.36988 3.52847 5.95948C3.52847 6.87789 3.71323 7.62574 3.97493 8.22755C3.60288 7.85518 3.28097 7.4359 3.01732 6.98031C2.13421 5.44246 2.31798 4.23589 2.50617 3.65466ZM2.6532 8.71959C1.34617 7.93939 0.922249 6.98276 0.784047 6.47553C1.14466 6.38675 1.51885 6.3673 1.88672 6.4182C2.00953 6.74717 2.15952 7.06535 2.33514 7.36943C2.76633 8.11284 3.33124 8.77013 4.00139 9.30817C3.52751 9.17193 3.07358 8.97404 2.65124 8.71959H2.6532ZM5.88083 9.45029C5.42359 9.11018 4.31259 8.06681 4.31259 5.95948C4.31259 3.87813 5.40938 2.82643 5.88083 2.47162C6.35228 2.82741 7.44907 3.87911 7.44907 5.96046C7.44907 8.06681 6.33807 9.11018 5.88083 9.45029ZM7.97933 4.21923C8.35792 3.94507 8.78825 3.75066 9.24422 3.6478C9.24933 3.64688 9.25427 3.6501 9.25549 3.65515C9.44368 4.23589 9.62746 5.44246 8.74434 6.98031C8.48092 7.4365 8.15899 7.8563 7.78673 8.22902C8.04843 7.62819 8.23319 6.87935 8.23319 5.96095C8.23744 5.37086 8.15184 4.78356 7.97933 4.21923ZM10.9776 6.47651C10.8419 6.97884 10.4189 7.93743 9.11092 8.71959C8.68855 8.97387 8.23461 9.17159 7.76076 9.30768C8.43091 8.76964 8.99582 8.11235 9.42701 7.36894C9.60263 7.06486 9.75262 6.74668 9.87543 6.4177C10.2432 6.36703 10.6173 6.38682 10.9776 6.47602V6.47651Z" fill="#D4AF37"/>
  </Svg>
);

const DharmaIcon = () => (
  <Svg width={31} height={31} viewBox="0 0 24 24" fill="none" stroke="#FFA652" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ aspectRatio: 1 }}>
    <Circle cx={12} cy={12} r={10} />
    <Circle cx={12} cy={12} r={3} />
    <Path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19" />
  </Svg>
);

const SafetyIcon = () => (
  <Svg width={31} height={31} viewBox="0 0 24 24" fill="none" stroke="#FFA652" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ aspectRatio: 1 }}>
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </Svg>
);

const TrustedIcon = () => (
  <Svg width={31} height={31} viewBox="0 0 24 24" fill="none" stroke="#FFA652" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ aspectRatio: 1 }}>
    <Path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <Path d="M22 4L12 14.01l-3-3" />
  </Svg>
);

const CommunityIcon = () => (
  <Svg width={31} height={31} viewBox="0 0 24 24" fill="none" stroke="#FFA652" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ aspectRatio: 1 }}>
    <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <Circle cx={9} cy={7} r={4} />
    <Path d="M23 21v-2a4 4 0 00-3-3.87" />
    <Path d="M16 3.13a4 4 0 010 7.75" />
  </Svg>
);

const IconItem = ({ icon: Icon, label, isWide }: any) => (
  <View style={[styles.iconItemContainer, isWide && styles.iconItemContainerWide]}>
    <View style={styles.iconEllipse}>
      <Icon />
    </View>
    <Text style={styles.iconLabel}>{label}</Text>
  </View>
);

export default function EntryAnimationScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [agreed, setAgreed] = useState(true);

  const containerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (token) {
      router.replace('/home');
      return;
    }

    Animated.timing(containerOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [containerOpacity, router, token]);

  const handleContinue = () => {
    if (!agreed) return;

    Animated.timing(containerOpacity, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      router.push('/auth/phone');
    });
  };

  const handleOpenPrivacyPolicy = () => {
    router.push('/privacy-policy');
  };

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <View style={styles.content}>
        
        {/* Main Content Card (Rectangle 1506) */}
        <View style={styles.card}>
          <View style={styles.imageContainer}>
            <Image
              source={require('../../assets/images/icon.png')}
              style={styles.lotusImage}
              resizeMode="contain"
            />
            <Text style={styles.title}>BRAHMAND</Text>
          </View>
          
          <View style={styles.contentContainer}>
            <View style={styles.dividerContainer}>
              <View style={styles.line} />
              <View style={styles.ornamentWrapper}>
                <LotusOrnament />
              </View>
              <View style={styles.line} />
            </View>
            
            <Text style={styles.subtitle}>The Daily Sanatan Community</Text>
          </View>
        </View>

        {/* Icons Row */}
        <View style={styles.iconsRow}>
          <IconItem icon={DharmaIcon} label="Dharma" />
          <IconItem icon={SafetyIcon} label="Safety" />
          <IconItem icon={TrustedIcon} label="Trusted" />
          <IconItem icon={CommunityIcon} label="Community" isWide={true} />
        </View>

        {/* Checkbox and Terms Section */}
        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            style={[styles.checkbox, agreed && styles.checkboxChecked]}
            onPress={() => setAgreed(!agreed)}
            activeOpacity={0.8}
          >
            {agreed && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          <Text style={styles.termsText}>
            I agree to the{' '}
            <Text style={styles.termsLink} onPress={handleOpenPrivacyPolicy}>
              Terms of Condition and Privacy Policy
            </Text>
          </Text>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.continueButton, !agreed && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!agreed}
          activeOpacity={0.9}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>

        {/* Admin Login Helper */}
        <TouchableOpacity
          style={styles.adminLoginButton}
          onPress={() => router.push('/admin/login')}
          activeOpacity={0.8}
        >
          <Text style={styles.adminLoginText}>Login as Admin</Text>
        </TouchableOpacity>

      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    width: '100%',
  },
  card: {
    width: 357,
    height: 474,
    backgroundColor: '#000000',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#322B20',
    overflow: 'hidden',
    alignItems: 'center',
  },
  imageContainer: {
    width: 357,
    height: 364,
    borderRadius: 22,
    overflow: 'hidden',
  },
  lotusImage: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.5 }, { translateY: -15 }],
  },
  title: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    fontSize: 32,
    fontFamily: 'Cinzel',
    fontWeight: '500',
    color: '#E6C87A',
    letterSpacing: 14,
    textAlign: 'center',
    paddingLeft: 14,
    fontStyle: 'normal',
    lineHeight: 36,
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 248,
    height: 12,
    marginVertical: 12,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#D4AF37',
    opacity: 0.8,
  },
  ornamentWrapper: {
    marginHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Poppins',
    color: '#F5EEDC',
    letterSpacing: 1,
    textAlign: 'center',
    lineHeight: 20,
  },
  iconsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: 329,
    height: 84,
    gap: 32,
    marginTop: 24,
    marginBottom: 24,
  },
  iconItemContainer: {
    width: 45,
    alignItems: 'center',
  },
  iconItemContainerWide: {
    width: 66,
  },
  iconEllipse: {
    width: 45,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#FFA652',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconLabel: {
    color: '#FFA652',
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: -0.15,
    textAlign: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: '#F5EEDC',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: 'transparent',
  },
  checkmark: {
    fontSize: 10,
    color: '#F5EEDC',
    fontWeight: '700',
    lineHeight: 12,
  },
  termsText: {
    color: '#F5EEDC',
    fontFamily: 'Poppins',
    fontSize: 12,
    lineHeight: 16,
  },
  termsLink: {
    textDecorationLine: 'underline',
    fontWeight: '700',
  },
  continueButton: {
    width: 359,
    height: 56,
    backgroundColor: '#FF7B00',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(143, 76, 56, 0.30)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 30,
    alignSelf: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins',
    fontWeight: '600',
    fontSize: 20,
    lineHeight: 24,
  },
  adminLoginButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  adminLoginText: {
    color: '#666666',
    fontSize: 14,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});
