import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Image,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, G, Ellipse } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Local Image References matching the app assets
const shamikJiPhoto = require('../assets/images/shamik_pathak_ji.jpg');

// ================= CUSTOM SVG ICONS (0 DEPENDENCY & 0 QUESTION MARKS) =================

const TrishulIcon = ({ size = 26, color = '#D85A00' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L13.5 6H10.5L12 2Z" fill={color} />
    <Path d="M12 6V22" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    <Path d="M5.5 5.5C5.5 10 7.5 12 12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" fill="none" />
    <Path d="M5.5 3L7 7H4L5.5 3Z" fill={color} />
    <Path d="M18.5 5.5C18.5 10 16.5 12 12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" fill="none" />
    <Path d="M18.5 3L20 7H17L18.5 3Z" fill={color} />
    <Path d="M9.5 15H14.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
  </Svg>
);

const HeartIcon = ({ size = 24, color = '#D85A00' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </Svg>
);

const OmIcon = ({ size = 26, color = '#D85A00' }) => (
  <Text style={{ fontSize: size - 2, color, fontWeight: '900', lineHeight: size + 2 }}>ॐ</Text>
);

const MoneyBagIcon = ({ size = 24, color = '#D85A00' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M15 4c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm-6 0c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm3-2c-2.76 0-5 2.24-5 5h10c0-2.76-2.24-5-5-5zm7.39 8.24c-.39-.77-1.12-1.31-1.98-1.5-.78-1.2-2.13-2-3.66-2h-3.5c-1.53 0-2.88.8-3.66 2-.86.19-1.59.73-1.98 1.5C.99 11.45.98 13.88 2.02 16c1.19 2.43 3.7 4 6.48 4h7c2.78 0 5.29-1.57 6.48-4 1.04-2.12 1.03-4.55-.59-5.76zM13 15h-2v1h-1.5v-1H9v-2h3.5v-1H9v-1h1.5v-1H12v1h1.5v1H15v2h-3.5v1H15v1z" />
  </Svg>
);

const MeditatingShivaIcon = ({ size = 26, color = '#D85A00' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Circle cx="12" cy="6" r="3" />
    <Path d="M12 10c-3 0-5 1.5-6 3v2c0 .55.45 1 1 1h10c.55 0 1-.45 1-1v-2c-1-1.5-3-3-6-3z" />
    <Path d="M4 17c0 1.66 3.58 3 8 3s8-1.34 8-3c0-.85-.94-1.63-2.5-2.15-.3.85-1.1 1.45-2.05 1.45h-6.9c-.95 0-1.75-.6-2.05-1.45C4.94 15.37 4 16.15 4 17z" />
  </Svg>
);

const GuruAvatarIcon = ({ size = 30, color = '#8A5A2B' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Circle cx="12" cy="7" r="3.5" />
    <Path d="M12 12c-4 0-7 2-7 5v2h14v-2c0-3-3-5-7-5z" />
    <Circle cx="12" cy="4" r="1" fill="#D85A00" />
  </Svg>
);

const NamasteIcon = ({ size = 16, color = '#8A5A2B' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M13.5 2c-.3 0-.6.1-.8.4L11 4.5l-1.7-2.1c-.2-.3-.5-.4-.8-.4-.6 0-1 .4-1 1v8.5l-1.8-1.8c-.4-.4-1-.4-1.4 0s-.4 1 0 1.4L8.5 15c2.3 2.3 5 4 8.5 4h.5c.6 0 1-.4 1-1V3c0-.6-.4-1-1-1h-4c-.3 0-.6.1-.8.4L13 4.5 12.3 2.4c-.2-.3-.5-.4-.8-.4z" />
  </Svg>
);

const shivlingImg = require('../assets/images/shivling_artwork.png');

// High quality Shivling Artwork for Section 3
const ShivlingArtwork = () => (
  <View style={styles.shivlingArtWrapper}>
    <Image
      source={shivlingImg}
      style={{ width: '100%', height: '100%', borderRadius: 16 }}
      resizeMode="cover"
    />
  </View>
);

export default function ShravanPaathPage() {
  const router = useRouter();
  const [interested, setInterested] = useState(false);

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'आचार्य शमिक जी के साथ श्रावण मास शिव कथा में भाग लें एवं पूर्व-पंजीकरण करें: https://brahmand.app/shravan-paath',
      });
    } catch (_error) {}
  };

  const handleInterested = () => {
    setInterested(true);
    Alert.alert(
      'रिमाइंडर सेट हो गया!',
      'आपको LIVE शुरू होने से पहले WhatsApp और ऐप नोटिफिकेशन द्वारा सूचित कर दिया जाएगा।'
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#E9D6BF" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        bounces={false}
      >
        {/* ================= HERO SECTION WITH BACKDROP ================= */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#E5C79E', '#F5E4CE', '#FAF4E8']}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Top Bar Navigation Buttons */}
          <SafeAreaView style={styles.topNavigation}>
            <TouchableOpacity
              style={styles.navCircleBtn}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-back" size={22} color="#3D2E24" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navCircleBtn}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social-outline" size={20} color="#3D2E24" />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Hero Content Grid (Left Copy + Right Pandit Ji Image) */}
          <View style={styles.heroGrid}>
            {/* Left Content Area */}
            <View style={styles.heroLeft}>
              {/* Badge Row */}
              <View style={styles.liveBadgeRow}>
                <View style={styles.livePill}>
                  <View style={styles.liveDot} />
                  <Text style={styles.livePillText}>LIVE</Text>
                </View>
                <Text style={styles.shravanVisheshText}>🔱 श्रावण विशेष 🔱</Text>
              </View>

              {/* Main Headline */}
              <Text style={styles.heroTitleMain}>श्रावण मास</Text>
              <View style={styles.subTitleRow}>
                <Text style={styles.ornamentArrow}>⤝</Text>
                <Text style={styles.heroTitleSub}>शिव कथा</Text>
                <Text style={styles.ornamentArrow}>⤞</Text>
              </View>

              {/* Date & Time Card */}
              <View style={styles.dateCard}>
                <View style={styles.dateCardTop}>
                  <Ionicons name="calendar-outline" size={16} color="#B85C00" style={{ marginRight: 6 }} />
                  <Text style={styles.dateCardTitle}>13 अगस्त – 11 सितंबर</Text>
                </View>
                <Text style={styles.dateCardSubtitle}>
                  हर दिन | <Text style={styles.liveHighlight}>LIVE</Text> केवल श्रावण माह में
                </Text>
              </View>

              {/* Acharya Name Badge */}
              <View style={styles.acharyaBadge}>
                <Text style={styles.acharyaBadgeText}>⤝ Acharya Shamik Ji ⤞</Text>
              </View>
            </View>

            {/* Right Pandit Ji Full Portrait */}
            <View style={styles.heroRight}>
              {/* Glowing Om Backdrop Overlay */}
              <View style={styles.omHaloBackdrop}>
                <OmIcon size={80} color="rgba(212, 175, 55, 0.45)" />
              </View>

              <Image
                source={shamikJiPhoto}
                style={styles.panditJiImage}
                resizeMode="cover"
              />
            </View>
          </View>
        </View>

        {/* ================= MAIN CARDS CONTAINER ================= */}
        <View style={styles.cardsWrapper}>

          {/* SECTION 1: ABOUT ACHARYA SHAMIK JI */}
          <View style={styles.sectionCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardHeaderTitle}>About Acharya Shamik Ji</Text>
              <Text style={styles.cardOrnament}>⤝</Text>
            </View>

            <View style={styles.aboutContentRow}>
              <View style={styles.guruAvatarCircle}>
                <GuruAvatarIcon size={28} color="#8A5A2B" />
              </View>
              <View style={styles.aboutTextWrapper}>
                <Text style={styles.aboutTextParagraph}>
                  आचार्य शमिक जी एक आध्यात्मिक गुरु, ज्योतिषाचार्य एवं वेदों के गूढ़ ज्ञाता हैं।
                </Text>
                <Text style={[styles.aboutTextParagraph, { marginTop: 6 }]}>
                  उनके श्रीमुख से शिव कथा सुनना जीवन में शांति, सकारात्मकता और आध्यात्मिक ऊर्जा का संचार करता है।
                </Text>
              </View>
            </View>
          </View>

          {/* SECTION 2: SHRAVAN MAH ME SHIV JAAP KE FAYDE */}
          <View style={styles.sectionCard}>
            <View style={styles.cardHeaderCentered}>
              <Text style={styles.cardOrnament}>⤝</Text>
              <Text style={styles.cardHeaderTitleCentered}>
                श्रावण माह में शिव जाप करने के फायदे
              </Text>
              <Text style={styles.cardOrnament}>⤞</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.benefitsRowContainer}
            >
              {/* Benefit Item 1 */}
              <View style={styles.benefitCol}>
                <View style={styles.benefitIconBox}>
                  <TrishulIcon size={24} color="#D85A00" />
                </View>
                <Text style={styles.benefitLabel}>मन की शांति और स्थिरता</Text>
              </View>

              {/* Benefit Item 2 */}
              <View style={styles.benefitCol}>
                <View style={styles.benefitIconBox}>
                  <HeartIcon size={22} color="#D85A00" />
                </View>
                <Text style={styles.benefitLabel}>स्वास्थ्य और ऊर्जा में वृद्धि</Text>
              </View>

              {/* Benefit Item 3 */}
              <View style={styles.benefitCol}>
                <View style={styles.benefitIconBox}>
                  <OmIcon size={24} color="#D85A00" />
                </View>
                <Text style={styles.benefitLabel}>नकारात्मकता से मुक्ति</Text>
              </View>

              {/* Benefit Item 4 */}
              <View style={styles.benefitCol}>
                <View style={styles.benefitIconBox}>
                  <MoneyBagIcon size={22} color="#D85A00" />
                </View>
                <Text style={styles.benefitLabel}>धन, समृद्धि और सौभाग्य की प्राप्ति</Text>
              </View>

              {/* Benefit Item 5 */}
              <View style={styles.benefitCol}>
                <View style={styles.benefitIconBox}>
                  <MeditatingShivaIcon size={24} color="#D85A00" />
                </View>
                <Text style={styles.benefitLabel}>भगवान शिव की विशेष कृपा</Text>
              </View>
            </ScrollView>
          </View>

          {/* SECTION 3: WHAT TO EXPECT IN THIS SHIV PAATH */}
          <View style={styles.sectionCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardHeaderTitle}>What to expect in this Shiv Paath</Text>
              <Text style={styles.cardOrnament}>⤝</Text>
            </View>

            <View style={styles.expectFlexRow}>
              {/* Left Column: Bullet List */}
              <View style={styles.expectListCol}>
                {/* Bullet 1 */}
                <View style={styles.bulletRow}>
                  <View style={styles.bulletIconCircle}>
                    <Ionicons name="book-outline" size={16} color="#8A5A2B" />
                  </View>
                  <Text style={styles.bulletText}>
                    शिव महिमा और पुराणों की अमृतमयी कथाएं
                  </Text>
                </View>

                {/* Bullet 2 */}
                <View style={styles.bulletRow}>
                  <View style={styles.bulletIconCircle}>
                    <Ionicons name="mic-outline" size={16} color="#8A5A2B" />
                  </View>
                  <Text style={styles.bulletText}>
                    दैनिक शिव जाप और मंत्रों का उच्चारण
                  </Text>
                </View>

                {/* Bullet 3 */}
                <View style={styles.bulletRow}>
                  <View style={styles.bulletIconCircle}>
                    <NamasteIcon size={16} color="#8A5A2B" />
                  </View>
                  <Text style={styles.bulletText}>
                    भक्ति, ध्यान और आध्यात्मिक मार्गदर्शन
                  </Text>
                </View>

                {/* Bullet 4 */}
                <View style={styles.bulletRow}>
                  <View style={styles.bulletIconCircle}>
                    <Ionicons name="chatbubbles-outline" size={16} color="#8A5A2B" />
                  </View>
                  <Text style={styles.bulletText}>
                    प्रश्नोत्तर सत्र – अपने प्रश्नों का समाधान
                  </Text>
                </View>
              </View>

              {/* Right Column: Shivling Artwork */}
              <ShivlingArtwork />
            </View>
          </View>

          {/* PRIMARY INTERESTED ACTION BUTTON */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleInterested}
            style={styles.ctaButtonWrapper}
          >
            <LinearGradient
              colors={interested ? ['#388E3C', '#2E7D32'] : ['#F25C05', '#E05300']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.ctaButtonGradient}
            >
              <View style={styles.ctaBellIconBox}>
                <Ionicons name={interested ? "checkmark-sharp" : "notifications"} size={22} color="#FFFFFF" />
              </View>

              <View style={styles.ctaTextCol}>
                <Text style={styles.ctaMainTitle}>
                  {interested ? 'पंजीकरण सफल हुआ!' : 'मैं Interested हूँ'}
                </Text>
                <Text style={styles.ctaSubTitle}>
                  {interested ? 'आपको रिमाइंडर भेज दिया जाएगा' : 'LIVE शुरू होने से पहले मुझे रिमाइंडर भेजें'}
                </Text>
              </View>

              <View style={styles.ctaArrowCircle}>
                <Ionicons name="arrow-forward" size={18} color="#F25C05" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* SOCIAL PROOF FOOTER BAR */}
          <View style={styles.socialProofBar}>
            <View style={styles.socialProofLeft}>
              <View style={styles.socialPeopleIconBox}>
                <Ionicons name="people" size={16} color="#D85A00" />
              </View>
              <View style={styles.socialProofTextCol}>
                <Text style={styles.socialProofCountText}>
                  <Text style={{ fontWeight: '800' }}>10,245+</Text> लोग पहले ही जुड़ चुके हैं
                </Text>
                <Text style={styles.socialProofSubText}>
                  आप भी जुड़ें और इस दिव्य अनुभव का हिस्सा बनें।
                </Text>
              </View>
            </View>

            {/* Avatar Stack */}
            <View style={styles.avatarStackRow}>
              <View style={[styles.avatarMini, { zIndex: 5 }]}>
                <Ionicons name="person" size={12} color="#FFF" />
              </View>
              <View style={[styles.avatarMini, { zIndex: 4, marginLeft: -8 }]}>
                <Ionicons name="person" size={12} color="#FFF" />
              </View>
              <View style={[styles.avatarMini, { zIndex: 3, marginLeft: -8 }]}>
                <Ionicons name="person" size={12} color="#FFF" />
              </View>
              <View style={styles.avatarPlusBadge}>
                <Text style={styles.avatarPlusText}>+9K</Text>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FAF4E8',
  },
  scrollContainer: {
    paddingBottom: 40,
  },

  /* HERO SECTION STYLES */
  heroSection: {
    width: '100%',
    paddingTop: 10,
    paddingBottom: 24,
    paddingHorizontal: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  topNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  heroGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  heroLeft: {
    flex: 1,
    paddingRight: 10,
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E53935',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
  },
  livePillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  shravanVisheshText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4E3629',
  },
  heroTitleMain: {
    fontSize: 32,
    fontWeight: '900',
    color: '#3D2A1D',
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  subTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ornamentArrow: {
    fontSize: 18,
    color: '#D85A00',
    fontWeight: '700',
    marginHorizontal: 4,
  },
  heroTitleSub: {
    fontSize: 26,
    fontWeight: '800',
    color: '#D85A00',
  },
  dateCard: {
    backgroundColor: 'rgba(255, 252, 247, 0.9)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E8D5C0',
    marginBottom: 12,
    shadowColor: '#3D2A1D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  dateCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#3D2A1D',
  },
  dateCardSubtitle: {
    fontSize: 11,
    color: '#6E5648',
  },
  liveHighlight: {
    color: '#E53935',
    fontWeight: '800',
  },
  acharyaBadge: {
    backgroundColor: '#3D2E24',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  acharyaBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  heroRight: {
    width: SCREEN_WIDTH * 0.42,
    height: 230,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  omHaloBackdrop: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    zIndex: 1,
  },
  panditJiImage: {
    width: '100%',
    height: '100%',
    zIndex: 2,
    borderRadius: 20,
  },

  /* CARDS WRAPPER */
  cardsWrapper: {
    paddingHorizontal: 16,
    marginTop: -8,
  },
  sectionCard: {
    backgroundColor: '#FFFDF7',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0E4D2',
    shadowColor: '#3D2A1D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#3D2A1D',
  },
  cardOrnament: {
    fontSize: 16,
    color: '#D85A00',
    fontWeight: '700',
  },
  cardHeaderCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  cardHeaderTitleCentered: {
    fontSize: 15,
    fontWeight: '800',
    color: '#3D2A1D',
    marginHorizontal: 6,
    textAlign: 'center',
  },

  /* ABOUT ACHARYA STYLES */
  aboutContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  guruAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5EAD6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E8D5C0',
  },
  aboutTextWrapper: {
    flex: 1,
  },
  aboutTextParagraph: {
    fontSize: 13,
    lineHeight: 19,
    color: '#4E3E33',
  },

  /* BENEFITS STYLES */
  benefitsRowContainer: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  benefitCol: {
    width: 82,
    alignItems: 'center',
    marginRight: 12,
  },
  benefitIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF4EE',
    borderWidth: 1,
    borderColor: '#FCE0D0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitLabel: {
    fontSize: 11,
    lineHeight: 15,
    color: '#3D2A1D',
    fontWeight: '600',
    textAlign: 'center',
  },

  /* WHAT TO EXPECT STYLES */
  expectFlexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expectListCol: {
    flex: 1,
    paddingRight: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bulletIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F5EAD6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  bulletText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3D2A1D',
    flex: 1,
    lineHeight: 16,
  },
  shivlingArtWrapper: {
    width: 100,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E8D5C0',
  },

  /* CTA BUTTON STYLES */
  ctaButtonWrapper: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#F25C05',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  ctaButtonGradient: {
    height: 64,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  ctaBellIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaTextCol: {
    flex: 1,
    paddingHorizontal: 12,
  },
  ctaMainTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  ctaSubTitle: {
    color: '#FFEFE5',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  ctaArrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* SOCIAL PROOF BAR STYLES */
  socialProofBar: {
    backgroundColor: '#FFFDF7',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F0E4D2',
  },
  socialProofLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  socialPeopleIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF4EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  socialProofTextCol: {
    flex: 1,
  },
  socialProofCountText: {
    fontSize: 11,
    color: '#3D2A1D',
  },
  socialProofSubText: {
    fontSize: 10,
    color: '#8A7263',
    marginTop: 1,
  },
  avatarStackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  avatarMini: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#D85A00',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFDF7',
  },
  avatarPlusBadge: {
    backgroundColor: '#FFE4D6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: -4,
  },
  avatarPlusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D85A00',
  },
});
