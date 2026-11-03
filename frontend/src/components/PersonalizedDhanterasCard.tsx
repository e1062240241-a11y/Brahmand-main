import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Image as RNImage,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../store/authStore';
import {
  DHANTERAS_CITIES,
  DHANTERAS_2026_CONFIG,
  DhanterasCityMuhurat,
  detectUserDhanterasCity,
} from '../utils/dhanterasMuhurat';
import { DhanterasShareCard } from './DhanterasShareCard';
import { shareFestivalCard } from '../utils/shareFestivalCard';

const safeCaptureRef = async (ref: any, options: any): Promise<{ uri: string | null; error?: string }> => {
  try {
    const ViewShot = require('react-native-view-shot');
    const capture = ViewShot?.captureRef || ViewShot?.default?.captureRef || ViewShot;
    if (typeof capture === 'function') {
      const uri = await capture(ref, options);
      return { uri };
    }
    return { uri: null, error: 'captureRef is not a function' };
  } catch (e: any) {
    return { uri: null, error: e?.message || String(e) };
  }
};

export const PersonalizedDhanterasCard: React.FC<{ festival?: any }> = React.memo(
  function PersonalizedDhanterasCard() {
    const user = useAuthStore((state) => state.user);
    const [selectedCity, setSelectedCity] = useState<DhanterasCityMuhurat>(DHANTERAS_CITIES[0]);
    const [isSharing, setIsSharing] = useState<boolean>(false);
    const shareCardRef = useRef<any>(null);

    useEffect(() => {
      let isMounted = true;
      detectUserDhanterasCity(user).then((res) => {
        if (isMounted && res.city) {
          setSelectedCity(res.city);
        }
      });
      return () => {
        isMounted = false;
      };
    }, [user]);

    const handleShareDhanteras = async () => {
      if (isSharing) return;
      try {
        setIsSharing(true);
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (_e) {}

        const sender = user?.name ? `${user.name} जी` : 'आपके परिवार';
        const msg = `🪙 *शुभ धनतेरस की हार्दिक शुभकामनाएं!* ✨\n\n📍 हमारे शहर *${selectedCity.hindiCity}* में धनतेरस पूजा शुभ मुहूर्त: *${selectedCity.muhurat}* (शुक्रवार, 6 नवंबर 2026)\n\n🪔 *प्रदोष काल:* ${selectedCity.pradoshKaal}\n✨ *स्थिर वृषभ लग्न:* ${selectedCity.vrishabhaLagna}\n🛍️ *खरीदारी चौघड़िया:* दोपहर 12:02 – 1:24 PM (शुभ) • रात 8:46 – 10:24 PM (लाभ)\n\n— *${sender}* की ओर से आरोग्य, सुख व समृद्धि की अनंत मंगलकामनाएं 🙏\n\n📲 *और जानने के लिए डाउनलोड करें ब्रह्मांड ऐप:*\nhttps://play.google.com/store/apps/details?id=com.brahmand.app`;

        let imageUri: string | null = null;
        if (shareCardRef.current) {
          await new Promise((res) => setTimeout(res, 350));
          const captureResult = await safeCaptureRef(shareCardRef, {
            format: 'png',
            quality: 0.95,
            result: 'tmpfile',
          });
          imageUri = captureResult.uri;
        }

        // Guaranteed fallback to pre-rendered Dhanteras Gold Coin card
        if (!imageUri) {
          try {
            const fallbackSource = RNImage.resolveAssetSource(
              require('../../assets/images/festivals/dhanteras_share_card_fallback.jpg')
            );
            if (fallbackSource?.uri) {
              imageUri = fallbackSource.uri;
            }
          } catch (_err) {}
        }

        await shareFestivalCard(
          imageUri,
          'Dhanteras',
          msg,
          'whatsapp'
        );
      } catch (err) {
        console.warn('[PersonalizedDhanterasCard] Share error:', err);
      } finally {
        setIsSharing(false);
      }
    };

    return (
      <View style={styles.container}>
        {/* ========================================================
            1. HERO PUJA MUHURAT (Prominent & Clean Typography)
        ======================================================== */}
        <View style={styles.heroSection}>
          {/* City Display */}
          <View style={styles.cityHeaderRow}>
            <Ionicons name="location-sharp" size={16} color="#78350F" />
            <Text style={styles.cityTitleText}>
              {selectedCity.hindiCity} ({selectedCity.cityName})
            </Text>
          </View>

          <Text style={styles.festivalDateHeader}>
            धनतेरस पूजा शुभ मुहूर्त • शुक्रवार, 6 नवंबर 2026
          </Text>

          {/* Grand Bold Muhurat Display */}
          <Text style={styles.mainMuhuratTime}>{selectedCity.muhurat}</Text>

          {/* Duration Badge */}
          <View style={styles.durationPill}>
            <Ionicons name="time-outline" size={14} color="#78350F" />
            <Text style={styles.durationText}>
              पूजा अवधि: {DHANTERAS_2026_CONFIG.pujaDuration}
            </Text>
          </View>

          {/* Key Astrological Pillars: Pradosh Kaal & Vrishabha Lagna */}
          <View style={styles.astrologicalHighlights}>
            <View style={styles.astroItem}>
              <Ionicons name="sunny-outline" size={15} color="#B45309" />
              <Text style={styles.astroLabel}>प्रदोष काल:</Text>
              <Text style={styles.astroValue}>{selectedCity.pradoshKaal}</Text>
            </View>
            <View style={styles.astroItem}>
              <Ionicons name="time-outline" size={15} color="#B45309" />
              <Text style={styles.astroLabel}>वृषभ (स्थिर) लग्न:</Text>
              <Text style={styles.astroValue}>{selectedCity.vrishabhaLagna}</Text>
            </View>
          </View>

          {/* Important Sacred Note */}
          <View style={styles.importantNoteBox}>
            <Ionicons name="ribbon-outline" size={16} color="#92400E" style={{ marginTop: 1 }} />
            <Text style={styles.importantNoteText}>
              प्रदोष काल में स्थिर वृषभ लग्न के दौरान मां लक्ष्मी और कुबेर देव की पूजा करने से घर में धन-समृद्धि का स्थाई वास होता है।
            </Text>
          </View>

          {/* Share Happy Dhanteras Gold Coin Card Button */}
          <TouchableOpacity
            style={styles.shareCardButton}
            onPress={handleShareDhanteras}
            activeOpacity={0.85}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Share Happy Dhanteras Card on WhatsApp"
          >
            <LinearGradient
              colors={['#D97706', '#92400E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.shareBtnGradient}
            >
              <Ionicons name="logo-whatsapp" size={19} color="#FFFFFF" />
              <Text style={styles.shareBtnText}>
                {isSharing ? 'कार्ड तैयार हो रहा है...' : 'शुभ धनतेरस कार्ड शेयर करें'}
              </Text>
              <Ionicons name="share-social-outline" size={16} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionDivider} />

        {/* ========================================================
            2. TITHI WINDOW (Authentic Panchang)
        ======================================================== */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>कार्तिक कृष्ण त्रयोदशी तिथि</Text>

          <View style={styles.tithiTimeline}>
            <View style={styles.tithiStep}>
              <View style={[styles.timelineDot, { backgroundColor: '#059669' }]} />
              <View style={styles.tithiStepContent}>
                <Text style={styles.tithiStepLabel}>तिथि प्रारंभ</Text>
                <Text style={styles.tithiStepTime}>{DHANTERAS_2026_CONFIG.trayodashiStart}</Text>
              </View>
            </View>

            <View style={styles.timelineConnector} />

            <View style={styles.tithiStep}>
              <View style={[styles.timelineDot, { backgroundColor: '#B45309' }]} />
              <View style={styles.tithiStepContent}>
                <Text style={styles.tithiStepLabel}>तिथि समाप्त</Text>
                <Text style={styles.tithiStepTime}>{DHANTERAS_2026_CONFIG.trayodashiEnd}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.tithiClarificationText}>
            • {DHANTERAS_2026_CONFIG.dateRuleExplanation}
          </Text>
        </View>

        <View style={styles.sectionDivider} />

        {/* ========================================================
            3. KHARIDARI CHOGHADIYA (SHOPPING SLOTS)
        ======================================================== */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>खरीदारी के शुभ मुहूर्त (चौघड़िया)</Text>
          <Text style={styles.sectionSubCaption}>
            6 नवंबर सुबह 10:30 AM (त्रयोदशी प्रारंभ) के बाद नई वस्तु, आभूषण व बर्तन खरीदना अति शुभ है:
          </Text>

          <View style={styles.choghadiyaList}>
            {DHANTERAS_2026_CONFIG.shopping.choghadiyaSlots.map((slot, idx) => (
              <View key={idx} style={styles.choghadiyaCardRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.choghadiyaNameRow}>
                    <Text style={styles.choghadiyaSlotName}>{slot.name}</Text>
                    <View style={styles.slotTagBadge}>
                      <Text style={styles.slotTagText}>{slot.tag}</Text>
                    </View>
                  </View>
                  <Text style={styles.choghadiyaSlotTime}>{slot.time}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Important Rahu Kaal Alert */}
          <View style={styles.rahuKaalAlert}>
            <Ionicons name="warning" size={18} color="#DC2626" style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rahuTitle}>
                राहु काल निषेध: {DHANTERAS_2026_CONFIG.shopping.rahuKaal.time}
              </Text>
              <Text style={styles.rahuSubText}>
                {DHANTERAS_2026_CONFIG.shopping.rahuKaal.warning}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionDivider} />

        {/* ========================================================
            4. KYA KHARIDE AUR KYA NA KHARIDE (Attractive Typography)
        ======================================================== */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>क्या खरीदें व क्या न खरीदें</Text>
          <Text style={styles.sectionSubCaption}>
            धनतेरस पर की गई खरीदारी वर्षभर सुख, आरोग्य और वैभव की वृद्धि करती है।
          </Text>

          {/* SUBSECTION: KYA KHARIDE (SHUBH KHARIDARI) */}
          <View style={styles.shoppingSubSection}>
            <View style={styles.subSectionTitleRow}>
              <View style={styles.greenCheckIconCircle}>
                <Ionicons name="checkmark-sharp" size={14} color="#065F46" />
              </View>
              <Text style={styles.subSectionTitleGreen}>शुभ वस्तुएं (अवश्य खरीदें)</Text>
            </View>

            <View style={styles.itemsListContainer}>
              {DHANTERAS_2026_CONFIG.shopping.whatToBuy.map((item, index) => (
                <View key={index} style={styles.pointerRow}>
                  <Text style={styles.greenPointerBullet}>•</Text>
                  <Text style={styles.buyItemHeading}>{item.item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* SUBSECTION: KYA NA KHARIDE (VARJIT VASTUYEIN) */}
          <View style={[styles.shoppingSubSection, { marginTop: 16 }]}>
            <View style={styles.subSectionTitleRow}>
              <View style={styles.redCrossIconCircle}>
                <Ionicons name="close-sharp" size={14} color="#991B1B" />
              </View>
              <Text style={styles.subSectionTitleRed}>वर्जित वस्तुएं (खरीदारी से बचें)</Text>
            </View>

            <View style={styles.itemsListContainer}>
              {DHANTERAS_2026_CONFIG.shopping.whatToAvoid.map((item, index) => (
                <View key={index} style={styles.pointerRow}>
                  <Text style={styles.redPointerBullet}>•</Text>
                  <Text style={styles.avoidItemHeading}>{item.item}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.sectionDivider} />

        {/* ========================================================
            5. YAM DEEP DAAN (Special Ritual Alert)
        ======================================================== */}
        <View style={styles.sectionContainer}>
          <View style={styles.yamHeaderRow}>
            <View style={styles.flameIconCircle}>
              <Ionicons name="flame" size={18} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionHeader}>यम दीप दान (अकाल मृत्यु भय निवारण)</Text>
              <Text style={styles.yamTimeSubtitle}>6 नवंबर, शाम प्रदोष काल (सूर्यास्त के तुरंत बाद)</Text>
            </View>
          </View>

          <View style={styles.yamInstructionsContainer}>
            <View style={styles.yamPointRow}>
              <Text style={styles.yamPointNumber}>१.</Text>
              <Text style={styles.yamPointText}>
                घर के मुख्य द्वार (दहलीज) के बाहर, <Text style={styles.yamHighlight}>दक्षिण दिशा</Text> की ओर मुख करके एक चौमुखा (४ बत्तियों वाला) दीपक जलाएं।
              </Text>
            </View>

            <View style={styles.yamPointRow}>
              <Text style={styles.yamPointNumber}>२.</Text>
              <Text style={styles.yamPointText}>
                दीपक में सरसों या तिल का तेल डालें। दीपक जलाने के बाद परिवार का कोई भी सदस्य उसे पीछे मुड़कर न देखे।
              </Text>
            </View>

            <View style={styles.yamPointRow}>
              <Text style={styles.yamPointNumber}>३.</Text>
              <Text style={styles.yamPointText}>
                यह दीप दान यमराज को प्रसन्न करने तथा परिवार को समस्त व्याधियों व अकाल मृत्यु के भय से मुक्त रखने हेतु किया जाता है।
              </Text>
            </View>
          </View>
        </View>

        {/* Off-screen Render of Dhanteras Gold Coin Share Card */}
        <View style={styles.offscreenShareContainer} pointerEvents="none">
          <View collapsable={false} style={{ width: 440, height: 780, backgroundColor: 'transparent' }}>
            <DhanterasShareCard
              ref={shareCardRef}
              userName={user?.name || ''}
              cityName={selectedCity.hindiCity}
              muhurat={selectedCity.muhurat}
              pradoshKaal={selectedCity.pradoshKaal}
              vrishabhaLagna={selectedCity.vrishabhaLagna}
            />
          </View>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },

  // 1. Hero Puja Muhurat
  heroSection: {
    paddingVertical: 4,
    alignItems: 'center',
  },
  cityHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    width: '100%',
    marginBottom: 8,
  },
  cityTitleText: {
    color: '#431407',
    fontSize: 15,
    fontWeight: '700',
  },
  festivalDateHeader: {
    color: '#78350F',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  mainMuhuratTime: {
    color: '#3B1103',
    fontSize: Platform.OS === 'android' ? 33 : 36,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(120, 53, 15, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  durationText: {
    color: '#78350F',
    fontSize: 12.5,
    fontWeight: '700',
  },
  astrologicalHighlights: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
    marginVertical: 4,
  },
  astroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  astroLabel: {
    color: '#78350F',
    fontSize: 13,
    fontWeight: '600',
  },
  astroValue: {
    color: '#1C1917',
    fontSize: 13,
    fontWeight: '700',
  },
  importantNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#B45309',
    paddingLeft: 10,
    paddingVertical: 4,
    marginTop: 12,
    width: '100%',
  },
  importantNoteText: {
    color: '#78350F',
    fontSize: 12.5,
    lineHeight: 18,
    flex: 1,
    fontWeight: '500',
  },
  shareCardButton: {
    width: '100%',
    marginTop: 14,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  shareBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  offscreenShareContainer: {
    position: 'absolute',
    left: -9999,
    top: -9999,
    opacity: 0,
  },

  // Divider
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(120, 53, 15, 0.12)',
    marginVertical: 18,
  },

  // Sections Common
  sectionContainer: {
    paddingVertical: 2,
  },
  sectionHeader: {
    color: '#431407',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  sectionSubCaption: {
    color: '#78350F',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },

  // 2. Tithi Timeline
  tithiTimeline: {
    paddingVertical: 6,
    paddingLeft: 6,
  },
  tithiStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tithiStepContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    paddingVertical: 3,
  },
  tithiStepLabel: {
    color: '#78350F',
    fontSize: 13.5,
    fontWeight: '600',
  },
  tithiStepTime: {
    color: '#1C1917',
    fontSize: 14,
    fontWeight: '700',
  },
  timelineConnector: {
    width: 2,
    height: 16,
    backgroundColor: 'rgba(120, 53, 15, 0.25)',
    marginLeft: 4,
    marginVertical: 2,
  },
  tithiClarificationText: {
    color: '#78350F',
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 8,
    paddingLeft: 2,
  },

  // 3. Choghadiya List
  choghadiyaList: {
    gap: 8,
    marginTop: 2,
  },
  choghadiyaCardRow: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(120, 53, 15, 0.08)',
  },
  choghadiyaNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  choghadiyaSlotName: {
    color: '#1C1917',
    fontSize: 14.5,
    fontWeight: '700',
  },
  slotTagBadge: {
    borderWidth: 1,
    borderColor: '#059669',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  slotTagText: {
    color: '#065F46',
    fontSize: 11,
    fontWeight: '700',
  },
  choghadiyaSlotTime: {
    color: '#78350F',
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 2,
  },
  rahuKaalAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
    paddingLeft: 10,
    paddingVertical: 4,
    marginTop: 14,
  },
  rahuTitle: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  rahuSubText: {
    color: '#7F1D1D',
    fontSize: 12,
    lineHeight: 16,
  },

  // 4. Kya Kharide & Kya Na Kharide
  shoppingSubSection: {
    marginTop: 4,
  },
  subSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 10,
  },
  greenCheckIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(5, 150, 105, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subSectionTitleGreen: {
    color: '#065F46',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  redCrossIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subSectionTitleRed: {
    color: '#991B1B',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  itemsListContainer: {
    gap: 7,
    paddingLeft: 4,
  },
  pointerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greenPointerBullet: {
    color: '#059669',
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '800',
  },
  redPointerBullet: {
    color: '#DC2626',
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '800',
  },
  buyItemHeading: {
    color: '#1C1917',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  avoidItemHeading: {
    color: '#1C1917',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },

  // 5. Yam Deep Daan
  yamHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  flameIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(217, 119, 6, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yamTimeSubtitle: {
    color: '#92400E',
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 1,
  },
  yamInstructionsContainer: {
    gap: 8,
    marginTop: 4,
    paddingLeft: 2,
  },
  yamPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  yamPointNumber: {
    color: '#B45309',
    fontSize: 13.5,
    fontWeight: '800',
    width: 18,
  },
  yamPointText: {
    color: '#1C1917',
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  yamHighlight: {
    color: '#92400E',
    fontWeight: '700',
  },
});

export default PersonalizedDhanterasCard;
