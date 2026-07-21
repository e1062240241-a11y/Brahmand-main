import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, Image, Platform, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle, Mask } from 'react-native-svg';
import { useAuthStore } from '../../src/store/authStore';
import { FONTS } from '../../src/constants/theme';

const LotusOrnament = () => (
  <Svg width={12} height={12} viewBox="0 0 12 12" fill="none" style={{ aspectRatio: 1 }}>
    <Path d="M11.6554 6.08004C11.5544 5.90256 11.3862 5.77311 11.1888 5.72082C10.8343 5.62956 10.4679 5.59287 10.1023 5.61202C10.2984 4.63922 10.1513 3.8698 10.0014 3.41354C9.87753 3.02521 9.47899 2.79444 9.08053 2.88034C8.58184 2.9914 8.10766 3.1927 7.68137 3.47431C7.36916 2.83655 6.91461 2.27904 6.35277 1.84481C6.0731 1.63506 5.68856 1.63506 5.40889 1.84481C4.84693 2.27891 4.39235 2.83645 4.08029 3.47431C3.654 3.1927 3.17982 2.9914 2.68113 2.88034C2.28267 2.79444 1.88413 3.02521 1.76028 3.41354C1.61326 3.8698 1.46623 4.63873 1.65932 5.61202C1.29373 5.59287 0.927358 5.62956 0.572824 5.72082C0.37541 5.77311 0.207297 5.90256 0.106272 6.08004C0.000550359 6.26185 -0.0277012 6.47852 0.0278597 6.68137C0.193999 7.29739 0.704167 8.46916 2.24937 9.39246C3.79458 10.3158 5.15209 10.3128 5.88328 10.3128C6.61448 10.3128 7.97443 10.3128 9.50984 9.39246C11.055 8.46916 11.5652 7.29739 11.7313 6.68137C11.7876 6.47884 11.7603 6.2622 11.6554 6.08004ZM2.50617 3.65466C2.50739 3.64961 2.51233 3.64639 2.51745 3.64731C2.97345 3.75032 3.40378 3.94489 3.78233 4.21923C3.60997 4.78309 3.52437 5.36988 3.52847 5.95948C3.52847 6.87789 3.71323 7.62574 3.97493 8.22755C3.60288 7.85518 3.28097 7.4359 3.01732 6.98031C2.13421 5.44246 2.31798 4.23589 2.50617 3.65466ZM2.6532 8.71959C1.34617 7.93939 0.922249 6.98276 0.784047 6.47553C1.14466 6.38675 1.51885 6.3673 1.88672 6.4182C2.00953 6.74717 2.15952 7.06535 2.33514 7.36943C2.76633 8.11284 3.33124 8.77013 4.00139 9.30817C3.52751 9.17193 3.07358 8.97404 2.65124 8.71959H2.6532ZM5.88083 9.45029C5.42359 9.11018 4.31259 8.06681 4.31259 5.95948C4.31259 3.87813 5.40938 2.82643 5.88083 2.47162C6.35228 2.82741 7.44907 3.87911 7.44907 5.96046C7.44907 8.06681 6.33807 9.11018 5.88083 9.45029ZM7.97933 4.21923C8.35792 3.94507 8.78825 3.75066 9.24422 3.6478C9.24933 3.64688 9.25427 3.6501 9.25549 3.65515C9.44368 4.23589 9.62746 5.44246 8.74434 6.98031C8.48092 7.4365 8.15899 7.8563 7.78673 8.22902C8.04843 7.62819 8.23319 6.87935 8.23319 5.96095C8.23744 5.37086 8.15184 4.78356 7.97933 4.21923ZM10.9776 6.47651C10.8419 6.97884 10.4189 7.93743 9.11092 8.71959C8.68855 8.97387 8.23461 9.17159 7.76076 9.30768C8.43091 8.76964 8.99582 8.11235 9.42701 7.36894C9.60263 7.06486 9.75262 6.74668 9.87543 6.4177C10.2432 6.36703 10.6173 6.38682 10.9776 6.47602V6.47651Z" fill="#D4AF37" />
  </Svg>
);

const DharmaIcon = () => (
  <Svg width={31} height={31} viewBox="0 0 31 31" fill="none" style={{ aspectRatio: 1 }}>
    <Path d="M30.42 15.707C30.1591 15.2484 29.7248 14.9141 29.2148 14.7789C28.2989 14.5433 27.3524 14.4485 26.4079 14.4979C26.9144 11.9848 26.5345 9.99709 26.1547 8.8184C25.8337 7.81538 24.8041 7.21954 23.7746 7.44093C22.4863 7.72786 21.2613 8.24789 20.16 8.97538C19.3535 7.32781 18.1792 5.88755 16.7277 4.76578C16.0053 4.22391 15.0118 4.22391 14.2893 4.76578C12.8356 5.88684 11.6591 7.32715 10.8508 8.97538C9.74948 8.24789 8.52448 7.72786 7.23619 7.44093C6.20672 7.21839 5.17675 7.81477 4.85728 8.8184C4.47747 9.99709 4.09766 11.9835 4.59648 14.4979C3.65202 14.4485 2.70555 14.5433 1.78964 14.7789C1.27965 14.9141 0.845344 15.2484 0.584375 15.707C0.311587 16.1763 0.238616 16.7355 0.381797 17.2591C0.81099 18.8518 2.12895 21.8789 6.12079 24.2642C10.1126 26.6494 13.6196 26.6418 15.5085 26.6418C17.3975 26.6418 20.9108 26.6418 24.8773 24.2642C28.8691 21.8789 30.1871 18.8518 30.6163 17.2591C30.7614 16.7363 30.6907 16.1772 30.42 15.707ZM7.15895 22.5259C3.78747 20.5103 2.69234 18.039 2.33532 16.7287C3.2668 16.4987 4.2336 16.4484 5.18392 16.5805C5.50119 17.4304 5.88867 18.2524 6.34236 19.0379C7.4563 20.9584 8.91567 22.6565 10.6469 24.0464C9.42272 23.6944 8.25003 23.1832 7.15895 22.5259ZM15.5022 24.4136C14.321 23.5349 11.4509 20.8395 11.4509 15.3955C11.4509 10.0186 14.2843 7.30167 15.5022 6.38506C16.7201 7.30421 19.5536 10.0211 19.5536 15.398C19.5536 20.8395 16.6834 23.5349 15.5022 24.4136ZM28.6691 16.7312C28.3184 18.0276 27.2258 20.5053 23.8467 22.5259C22.7556 23.1828 21.5829 23.6936 20.3588 24.0451C22.09 22.6552 23.5494 20.9572 24.6633 19.0367C25.117 18.2511 25.5045 17.4291 25.8218 16.5793C26.7718 16.4484 27.7381 16.5008 28.6691 16.7312Z" fill="#FFA652" />
  </Svg>
);

const SafetyIcon = () => (
  <Svg width={22.5} height={22.5} viewBox="0 0 23 23" fill="none">
    <Path d="M20.625 0H1.875C0.839466 0 0 0.805885 0 1.79999V8.09998C0 14.031 2.99062 17.6253 5.49961 19.5963C8.20195 21.7181 10.8902 22.4392 11.0074 22.4684C11.1686 22.5105 11.3385 22.5105 11.4996 22.4684C11.6168 22.4392 14.3016 21.7181 17.0074 19.5963C19.5094 17.6253 22.5 14.031 22.5 8.09998V1.79999C22.5 0.805885 21.6605 0 20.625 0ZM15 10.8H12.1875V13.5C12.1875 14.1928 11.4062 14.6258 10.7812 14.2794C10.4912 14.1186 10.3125 13.8215 10.3125 13.5V10.8H7.5C6.77831 10.8 6.32726 10.05 6.68808 9.45001C6.85554 9.17153 7.16505 8.99997 7.5 8.99997H10.3125V6.29998C10.3125 5.60716 11.0938 5.17415 11.7188 5.52056C12.0088 5.68133 12.1875 5.97845 12.1875 6.29998V8.99997H15C15.7217 8.99997 16.1727 9.74998 15.8119 10.35C15.6444 10.6284 15.3349 10.8 15 10.8Z" fill="#FFA652" />
  </Svg>
);

const TrustedIcon = () => (
  <Svg width={23} height={23} viewBox="0 0 23 23" fill="none">
    <Path d="M5.8869 20.4444V10.7678H8.15952C8.25081 10.7678 8.34664 10.7774 8.44702 10.7965C8.5474 10.8156 8.64324 10.8443 8.73452 10.8826L15.4429 13.5243C15.9175 13.7158 16.319 14.0125 16.6476 14.4145C16.9762 14.8165 17.1405 15.2759 17.1405 15.7928C17.1405 15.9459 17.0949 16.0703 17.0036 16.166C16.9123 16.2618 16.7937 16.3096 16.6476 16.3096H14.6488C14.2289 16.3096 13.8137 16.2761 13.403 16.2091C12.9923 16.1421 12.5861 16.0416 12.1845 15.9076L10.1857 15.2185L9.91191 16.0225L11.9655 16.769C12.4401 16.9413 12.933 17.0514 13.444 17.0993C13.9551 17.1471 14.4663 17.171 14.9774 17.171H20.3167C21.0833 17.171 21.7222 17.4725 22.2333 18.0755C22.7444 18.6785 23 19.4011 23 20.2434L14.4298 23L5.8869 20.4444ZM0 22.0812V10.7678H4.21667V22.0812H0ZM13.4167 9.13109L8.92619 4.42197L10.1036 3.18727L13.4167 6.69039L19.8238 0L20.9738 1.17728L13.4167 9.13109Z" fill="#FFA652" />
  </Svg>
);

const CommunityIcon = () => (
  <Svg width={22} height={23} viewBox="0 0 22 23" fill="none">
    <Path d="M21.829 21.5841C22.2206 22.128 21.902 22.911 21.2555 22.9935C21.2212 22.9979 21.1867 23 21.1522 23H0.847304C0.196029 23 -0.211019 22.2632 0.114596 21.6736C0.131513 21.643 0.150174 21.6135 0.170475 21.5852C0.919625 20.5354 1.91862 19.7089 3.06815 19.1878C0.662919 16.8934 1.53604 12.738 4.63977 11.7081C7.7435 10.6782 10.75 13.5462 10.0515 16.8705C9.8641 17.7626 9.41693 18.5721 8.77149 19.1878C9.60084 19.5624 10.3545 20.0984 10.9923 20.7673C11.6302 20.0984 12.3838 19.5624 13.2132 19.1878C10.808 16.8934 11.6811 12.738 14.7848 11.7081C17.8885 10.6782 20.8951 13.5462 20.1966 16.8705C20.0091 17.7626 19.562 18.5721 18.9165 19.1878C20.0714 19.7061 21.0757 20.5325 21.829 21.5841ZM0.33968 11.3278C0.713484 11.6208 1.24379 11.5417 1.52413 11.151C3.72383 8.08557 8.12321 8.08557 10.3229 11.151C10.6613 11.6226 11.3382 11.6226 11.6766 11.151C13.8763 8.08557 18.2757 8.08557 20.4753 11.151C20.8665 11.6955 21.675 11.5933 21.9307 10.967C22.0493 10.6763 22.0105 10.3415 21.829 10.0888C21.0798 9.0393 20.0808 8.21313 18.9313 7.69244C21.3366 5.39805 20.4634 1.24271 17.3597 0.212812C14.256 -0.817081 11.2494 2.05089 11.9479 5.37517C12.1354 6.26724 12.5825 7.07674 13.228 7.69244C12.3986 8.06712 11.645 8.60312 11.0071 9.27194C10.3693 8.60312 9.61565 8.06712 8.7863 7.69244C11.1915 5.39805 10.3184 1.24271 7.21468 0.212812C4.11094 -0.817081 1.1044 2.05089 1.8029 5.37517C1.99035 6.26724 2.43752 7.07674 3.08295 7.69244C1.92803 8.21127 0.923712 9.03798 0.170475 10.0899C-0.109873 10.4806 -0.0341235 11.0348 0.33968 11.3278Z" fill="#FFA652" />
  </Svg>
);

const CheckedCheckboxIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Mask id="path-1-inside-1_1642_26367" fill="white">
      <Path d="M0 4C0 1.79086 1.79086 0 4 0H12C14.2091 0 16 1.79086 16 4V12C16 14.2091 14.2091 16 12 16H4C1.79086 16 0 14.2091 0 12V4Z" />
    </Mask>
    <Path d="M4 0V2H12V0V-2H4V0ZM16 4H14V12H16H18V4H16ZM12 16V14H4V16V18H12V16ZM0 12H2V4H0H-2V12H0ZM4 16V14C2.89543 14 2 13.1046 2 12H0H-2C-2 15.3137 0.686292 18 4 18V16ZM16 12H14C14 13.1046 13.1046 14 12 14V16V18C15.3137 18 18 15.3137 18 12H16ZM12 0V2C13.1046 2 14 2.89543 14 4H16H18C18 0.686292 15.3137 -2 12 -2V0ZM4 0V-2C0.686292 -2 -2 0.686292 -2 4H0H2C2 2.89543 2.89543 2 4 2V0Z" fill="#F5EEDC" mask="url(#path-1-inside-1_1642_26367)" />
    <Path d="M11.1362 5.02246C11.475 4.68366 12.0394 4.80768 12.2173 5.23145L12.2476 5.32031L12.2642 5.40625C12.2905 5.60871 12.2223 5.81421 12.0757 5.96094L7.05811 10.9785C6.79901 11.2378 6.37882 11.2376 6.11963 10.9785L3.92432 8.7832C3.56302 8.4219 3.72861 7.8051 4.22217 7.67285L4.30811 7.65527C4.48156 7.63275 4.65737 7.68 4.79639 7.78613L4.86279 7.84473L6.58838 9.57031L11.1362 5.02246Z" fill="#F5EEDC" stroke="#F5EEDC" strokeWidth={0.7} />
  </Svg>
);

const UncheckedCheckboxIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Mask id="path-1-inside-1_1642_26367" fill="white">
      <Path d="M0 4C0 1.79086 1.79086 0 4 0H12C14.2091 0 16 1.79086 16 4V12C16 14.2091 14.2091 16 12 16H4C1.79086 16 0 14.2091 0 12V4Z" />
    </Mask>
    <Path d="M4 0V2H12V0V-2H4V0ZM16 4H14V12H16H18V4H16ZM12 16V14H4V16V18H12V16ZM0 12H2V4H0H-2V12H0ZM4 16V14C2.89543 14 2 13.1046 2 12H0H-2C-2 15.3137 0.686292 18 4 18V16ZM16 12H14C14 13.1046 13.1046 14 12 14V16V18C15.3137 18 18 15.3137 18 12H16ZM12 0V2C13.1046 2 14 2.89543 14 4H16H18C18 0.686292 15.3137 -2 12 -2V0ZM4 0V-2C0.686292 -2 -2 0.686292 -2 4H0H2C2 2.89543 2.89543 2 4 2V0Z" fill="#F5EEDC" mask="url(#path-1-inside-1_1642_26367)" />
  </Svg>
);

const IconItem = ({ icon: Icon, label, isWide, customWidth }: any) => (
  <View style={[
    styles.iconItemContainer,
    isWide && styles.iconItemContainerWide,
    customWidth !== undefined && { width: customWidth }
  ]}>
    <View style={styles.iconEllipse}>
      <Icon />
    </View>
    <Text style={styles.iconLabel}>{label}</Text>
  </View>
);

export default function EntryAnimationScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [agreed, setAgreed] = useState(false);

  const containerOpacity = useRef(new Animated.Value(0)).current;

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Design references: Width: 390, Height: 844
  // We compute scaling factor based on screen width/height to fit smaller devices
  const isAndroid = Platform.OS === 'android';
  const isSmallScreen = isAndroid && (screenWidth < 375 || screenHeight < 700);

  const cardWidth = isAndroid ? Math.min(357, screenWidth - 32) : 357;
  const cardHeight = isAndroid ? (screenHeight < 700 ? Math.min(380, screenHeight * 0.48) : 474) : 474;
  const imageContainerHeight = isAndroid ? (screenHeight < 700 ? Math.min(280, cardHeight - 100) : 364) : 364;

  const titleFontSize = isAndroid ? (screenHeight < 700 ? 22 : 28) : 28;

  const iconsRowWidth = isAndroid ? Math.min(329, screenWidth - 32) : 329;
  const iconsRowGap = isAndroid ? (screenWidth < 360 ? 12 : 32) : 32;
  const iconsRowMargin = isAndroid ? (isSmallScreen ? 12 : 24) : 24;

  const checkboxMarginBottom = isAndroid ? (isSmallScreen ? 16 : 24) : 24;

  const continueButtonWidth = isAndroid ? Math.min(359, screenWidth - 32) : 359;
  const continueButtonMargin = isAndroid ? (isSmallScreen ? 16 : 30) : 30;

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
        <View style={[styles.card, { width: cardWidth, height: cardHeight }]}>
          <View style={[styles.imageContainer, { width: cardWidth, height: imageContainerHeight }]}>
            <Image
              source={require('../../assets/images/icon.png')}
              style={styles.lotusImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.contentContainer}>
            <Text style={[styles.title, { fontSize: titleFontSize }]}>BRAHMAND</Text>
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
        <View style={[styles.iconsRow, { width: iconsRowWidth, gap: iconsRowGap, marginTop: iconsRowMargin, marginBottom: iconsRowMargin }]}>
          <IconItem icon={DharmaIcon} label="Dharma" />
          <IconItem icon={SafetyIcon} label="Safety" />
          <IconItem icon={TrustedIcon} label="Trusted" customWidth={44} />
          <IconItem icon={CommunityIcon} label="Community" isWide={true} />
        </View>

        {/* Checkbox and Terms Section */}
        <View style={[styles.checkboxContainer, { marginBottom: checkboxMarginBottom }]}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setAgreed(!agreed)}
            activeOpacity={0.8}
          >
            {agreed ? <CheckedCheckboxIcon /> : <UncheckedCheckboxIcon />}
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
          style={[styles.continueButton, { width: continueButtonWidth, marginBottom: continueButtonMargin }, !agreed && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!agreed}
          activeOpacity={0.9}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>

        {/* Admin Login Helper */}
        {Platform.OS === 'web' && (
          <TouchableOpacity
            style={styles.adminLoginButton}
            onPress={() => router.push('/admin/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.adminLoginText}>Login as Admin</Text>
          </TouchableOpacity>
        )}

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
    transform: [{ scale: 1.0 }],
  },
  title: {
    fontSize: Platform.OS === 'android' ? 20 : 32,
    fontFamily: FONTS.brandTitle, // LOCKED: Brand typography identity
    color: '#E6C87A',
    letterSpacing: Platform.OS === 'android' ? 8 : 14,
    textAlign: 'center',
    paddingLeft: Platform.OS === 'android' ? 8 : 14,
    fontStyle: 'normal',
    lineHeight: Platform.OS === 'android' ? 26 : 36,
    marginTop: 2,
    marginBottom: 5,
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 5,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 248,
    height: 12,
    marginTop: 4,
    marginBottom: 8,
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
    fontSize: 13,
    fontFamily: 'Poppins',
    color: '#F5EEDC',
    letterSpacing: 1,
    textAlign: 'center',
    lineHeight: 18,
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
    borderWidth: 2,
    borderColor: '#FFA652',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconLabel: {
    color: '#FFA652',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: '500',
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
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 16,
  },
  termsLink: {
    color: '#F5EEDC',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 16,
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
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
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro' : 'System',
    fontSize: 20,
    fontStyle: 'normal',
    fontWeight: '600',
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
