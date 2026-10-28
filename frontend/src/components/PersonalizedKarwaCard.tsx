import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../store/authStore';
import {
  detectUserMoonCity,
  CityMoonriseData,
  MAJOR_CITIES_MOONRISE,
  POPULAR_CITY_IDS,
  STORAGE_KEY_MANUAL_CITY,
} from '../utils/karwaMoonrise';
import { KarwaChauthShareCard } from './KarwaChauthShareCard';
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

interface ChecklistItem {
  id: string;
  title: string;
  timeRange: string;
  icon: string;
  desc: string;
}

export const DEFAULT_SANKALP_SHORT =
  'मम आत्मनः अखंड सौभाग्य, सुहागस्य दीर्घायुष्य, आरोग्य, ऐश्वर्य वृद्धये करवा चौथ व्रतमहं करिष्ये।';

export const getPersonalizedSankalpFull = (
  cityNameFull: string,
  gotraName: string,
  fullName: string
) =>
  `ॐ विष्णुर्विष्णुर्विष्णुः। श्रीमद्भगवतो महापुरुषस्य विष्णोराज्ञया प्रवर्तमानस्य... ${cityNameFull}, ${gotraName} ${fullName} अहं मम पतिश्चायुरारोग्यसौभाग्यपुत्रपौत्रादि धनधान्यसमृद्ध्यर्थं श्रीउमामहेश्वरसायुज्यसिद्ध्यर्थं च करवा चौथ व्रतमहं करिष्ये।`;

export const PersonalizedKarwaCard = React.memo(function PersonalizedKarwaCard({
  onCityDetected,
}: {
  onCityDetected?: (city: CityMoonriseData) => void;
}) {
  const user = useAuthStore((state) => state.user);
  const [detectedCity, setDetectedCity] = useState<CityMoonriseData>(MAJOR_CITIES_MOONRISE[0]);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [showFullSankalp, setShowFullSankalp] = useState<boolean>(false);
  const [cityPickerVisible, setCityPickerVisible] = useState<boolean>(false);
  const [citySearchQuery, setCitySearchQuery] = useState<string>('');
  const [isChecklistExpanded, setIsChecklistExpanded] = useState<boolean>(false);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState<boolean>(false);
  const shareCardRef = useRef<any>(null);

  // User profile derived attributes
  const rawName = (user?.name || '').trim();
  const firstName = rawName ? rawName.split(' ')[0] : 'भक्त';
  const fullName = rawName || 'करवा चौथ व्रती';
  const photoUrl = user?.photo;
  const gender = (user?.gender || '').toLowerCase();
  const isFemale = gender.includes('female') || gender.includes('महिला') || gender.includes('woman') || !gender;
  const isMale = gender.includes('male') || gender.includes('पुरुष') || gender.includes('man');

  const gotra = (user as any)?.gotra || '';
  const rashi = (user as any)?.rashi || '';
  const kuldevi = (user as any)?.kuldevi || '';

  // Detect user's accurate location & moonrise city
  useEffect(() => {
    let isMounted = true;
    detectUserMoonCity(user).then((city) => {
      if (isMounted && city) {
        setDetectedCity(city);
        onCityDetected?.(city);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Load interactive day-checklist from persistent storage
  useEffect(() => {
    const loadChecklist = async () => {
      try {
        const stored = await AsyncStorage.getItem('@karwa_day_checklist_2026');
        if (stored) {
          setCompletedSteps(JSON.parse(stored));
        }
      } catch (_e) {}
    };
    loadChecklist();
  }, []);

  const handleSelectCity = (city: CityMoonriseData) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_e) {}
    setDetectedCity(city);
    AsyncStorage.setItem(STORAGE_KEY_MANUAL_CITY, city.id).catch(() => {});
    setCityPickerVisible(false);
    setCitySearchQuery('');
    onCityDetected?.(city);
  };

  const toggleChecklistStep = (id: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_e) {}

    setCompletedSteps((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id];
      AsyncStorage.setItem('@karwa_day_checklist_2026', JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  };

  const cityName = detectedCity?.hindiCity?.split('/')[0]?.trim() || 'आपके शहर';
  const moonriseTime = detectedCity?.moonriseTime || '08:15 PM';

  // 5 practical sacred checklist steps tailored to devotee's city & day
  const checklistSteps: ChecklistItem[] = useMemo(() => [
    {
      id: 'step_sargi',
      title: 'सरगी ग्रहण',
      timeRange: '04:45 AM - 05:35 AM',
      icon: '🌅',
      desc: 'ब्रह्म मुहूर्त में सास द्वारा दी गई सरगी व जल ग्रहण',
    },
    {
      id: 'step_sankalp',
      title: 'निर्जला व्रत संकल्प',
      timeRange: 'सूर्योदय से पूर्व',
      icon: '🌸',
      desc: isFemale
        ? 'पतिदेव की दीर्घायु व अखंड सौभाग्य का पावन संकल्प'
        : isMale
        ? 'दांपत्य प्रेम व परिवार के कल्याण का पावन संकल्प'
        : 'अखंड सौभाग्य एवं दांपत्य सुख का संकल्प',
    },
    {
      id: 'step_puja_katha',
      title: 'संध्या पूजन व करवा चौथ व्रत कथा',
      timeRange: '05:43 PM - 07:01 PM',
      icon: '🪔',
      desc: 'माता पार्वती व शिव परिवार का पूजन, करवे फेरना व अमर व्रत कथा श्रवण',
    },
    {
      id: 'step_puja_ke_baad',
      title: 'बायना अर्पण व सास का आशीर्वाद (पूजा के बाद)',
      timeRange: 'संध्या पूजा संपन्न होने पर',
      icon: '🎁',
      desc: 'पूजा के बाद सास या बुजुर्गों को बायना (करवा व सुहाग सामग्री) देकर चरण स्पर्श व आशीर्वाद',
    },
    {
      id: 'step_arghya',
      title: `चंद्र दर्शन, अर्घ्य व पारण (${cityName})`,
      timeRange: `संभावित समय: ${moonriseTime}`,
      icon: '🌕',
      desc: 'छलनी से चंद्र व पति का दर्शन, अर्घ्य समर्पण व जल पीकर व्रत पूर्ण',
    },
  ], [cityName, moonriseTime, isFemale, isMale]);

  const completedCount = completedSteps.length;
  const totalCount = checklistSteps.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  // Filter cities for search modal
  const filteredCities = useMemo(() => {
    if (!citySearchQuery.trim()) return MAJOR_CITIES_MOONRISE;
    const q = citySearchQuery.toLowerCase().trim();
    return MAJOR_CITIES_MOONRISE.filter(
      (c) =>
        c.city.toLowerCase().includes(q) ||
        c.hindiCity.includes(q) ||
        c.state.toLowerCase().includes(q) ||
        c.hindiState.includes(q) ||
        c.aliases.some((a) => a.toLowerCase().includes(q))
    );
  }, [citySearchQuery]);

  // Personalized Vedic Sankalp
  const gotraName = gotra ? `${gotra} गोत्रोत्पन्न` : 'आत्मगोत्रोत्पन्न';
  const cityNameFull = detectedCity ? `${detectedCity.hindiCity} निवासी` : 'भारतवर्ष निवासी';
  const sankalpShort = DEFAULT_SANKALP_SHORT;
  const sankalpFull = useMemo(
    () => getPersonalizedSankalpFull(cityNameFull, gotraName, fullName),
    [cityNameFull, gotraName, fullName]
  );

  // Share festive greeting image card + text to WhatsApp
  const handleWhatsAppShare = async () => {
    if (isSharingWhatsApp) return;
    try {
      setIsSharingWhatsApp(true);
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_e) {}

      const sender = fullName || 'आपके परिवार';
      const msg = `🌙 *करवा चौथ की पावन मंगलकामनाएं!* ✨\n\n📍 हमारे शहर *${cityName}* में संभावित चंद्रोदय: *${moonriseTime}* (29 अक्टूबर)\n\n🌅 *सरगी:* 04:45 AM - 05:35 AM\n🪔 *संध्या पूजन व कथा:* 05:43 PM - 07:01 PM\n🎁 *बायना व आशीर्वाद:* संध्या पूजा के बाद\n🌕 *चंद्र दर्शन व अर्घ्य:* ${moonriseTime}\n\n— *${sender}* की ओर से अखंड सौभाग्य की मंगलकामनाएं 🙏\nhttps://brahmand.app/festival-detail?name=Karva%20Chauth`;

      let imageUri: string | null = null;
      if (shareCardRef.current) {
        await new Promise((res) => setTimeout(res, 300));
        const captureResult = await safeCaptureRef(shareCardRef, {
          format: 'png',
          quality: 0.95,
          result: 'tmpfile',
        });
        imageUri = captureResult.uri;
      }

      await shareFestivalCard(
        imageUri,
        'Karwa Chauth',
        msg,
        'whatsapp'
      );
    } catch (err) {
      console.warn('[PersonalizedKarwaCard] WhatsApp share error:', err);
    } finally {
      setIsSharingWhatsApp(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Unified Devotee & Festival Hero Banner */}
      <LinearGradient
        colors={['#700B1A', '#8B0000', '#4A0813']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroUnifiedCard}
      >
        <View style={styles.heroTopRow}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.avatarImg} contentFit="cover" />
          ) : (
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.avatarFallback}
            >
              <Text style={styles.avatarInitial}>{firstName.charAt(0)}</Text>
            </LinearGradient>
          )}

          <View style={styles.heroTextCol}>
            <View style={styles.badgeRow}>
              <View style={styles.festivalPill}>
                <Text style={styles.festivalPillText}>🪔 करवा चौथ महापर्व • 29 अक्टूबर</Text>
              </View>
            </View>

            <Text style={styles.devoteeName} numberOfLines={1}>
              {fullName} जी
            </Text>

            <Text style={styles.devoteeBlessing} numberOfLines={1}>
              {isFemale
                ? 'पति की दीर्घायु और अखंड सौभाग्य हेतु आपका पावन व्रत'
                : isMale
                ? 'धर्मपत्नी के उत्तम स्वास्थ्य व अखंड दांपत्य प्रेम हेतु आपका व्रत'
                : 'अखंड सौभाग्य, सुहाग की दीर्घायु और अटूट प्रेम का पावन व्रत'}
            </Text>
          </View>
        </View>

        {/* City Location & Moonrise Timing Bar with Interactive "शहर बदलें" Button */}
        <View style={styles.cityTimingBar}>
          <TouchableOpacity
            style={styles.citySelectorChip}
            activeOpacity={0.8}
            onPress={() => setCityPickerVisible(true)}
          >
            <Ionicons name="location-sharp" size={13} color="#FFD700" />
            <Text style={styles.citySelectorText} numberOfLines={1}>
              {cityName}
            </Text>
            <Text style={styles.citySelectorDropdownIcon}>▾ बदलें</Text>
          </TouchableOpacity>

          <View style={styles.moonriseTimingChip}>
            <Text style={{ fontSize: 13 }}>🌕</Text>
            <Text style={styles.moonriseTimingText}>
              चंद्रोदय: <Text style={styles.moonriseTimingHighlight}>{moonriseTime}</Text>
            </Text>
          </View>
        </View>

        {/* Heritage Attributes (Gotra / Kuldevi / Rashi) */}
        {(gotra || rashi || kuldevi) ? (
          <View style={styles.heritageRow}>
            {gotra ? (
              <View style={styles.heritageChip}>
                <Text style={styles.heritageChipLabel}>गोत्र:</Text>
                <Text style={styles.heritageChipVal}>{gotra}</Text>
              </View>
            ) : null}

            {rashi ? (
              <View style={styles.heritageChip}>
                <Text style={styles.heritageChipLabel}>राशि:</Text>
                <Text style={styles.heritageChipVal}>{rashi}</Text>
              </View>
            ) : null}

            {kuldevi ? (
              <View style={styles.heritageChip}>
                <Text style={styles.heritageChipLabel}>कुलदेवी:</Text>
                <Text style={styles.heritageChipVal}>माँ {kuldevi}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Personalized Vedic Sankalp Card */}
        <View style={styles.sankalpContainer}>
          <View style={styles.sankalpHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Ionicons name="sparkles" size={12} color="#FDE047" />
              <Text style={styles.sankalpTitle}>आपका व्यक्तिगत व्रत संकल्प</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowFullSankalp((prev) => !prev)}
              activeOpacity={0.8}
            >
              <Text style={styles.sankalpToggleBtn}>
                {showFullSankalp ? 'संक्षिप्त ▴' : 'सम्पूर्ण श्लोक ▾'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sankalpText}>
            {`"${showFullSankalp ? sankalpFull : sankalpShort}"`}
          </Text>
        </View>

        {/* Quick WhatsApp Share Pill with Sacred Festive Image Card */}
        <TouchableOpacity
          style={styles.quickSharePill}
          activeOpacity={0.85}
          disabled={isSharingWhatsApp}
          onPress={handleWhatsAppShare}
        >
          {isSharingWhatsApp ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="logo-whatsapp" size={15} color="#25D366" />
          )}
          <Text style={styles.quickSharePillText}>
            {isSharingWhatsApp
              ? 'शुभकामना कार्ड तैयार हो रहा है...'
              : `${cityName} का चंद्रोदय कार्ड व्हाट्सएप करें`}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* 2. Personalized Interactive 5-Step Day Tracker (Dropdown Accordion) */}
      <View style={styles.trackerCard}>
        <TouchableOpacity
          style={styles.trackerHeaderRow}
          activeOpacity={0.7}
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch (_e) {}
            setIsChecklistExpanded((prev) => !prev);
          }}
        >
          <View style={{ flex: 1, paddingRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.trackerMainTitle}>आपकी व्रत दिनचर्या व चेकलिस्ट</Text>
              <Ionicons
                name={isChecklistExpanded ? 'chevron-up-circle' : 'chevron-down-circle'}
                size={18}
                color="#B45309"
              />
            </View>
            <Text style={styles.trackerSubTitle}>
              {isChecklistExpanded
                ? `${cityName} में आपके करवा चौथ का क्रमवार पालन • टैप करके समेटें ▴`
                : `${completedCount}/${totalCount} पूर्ण • टैप करके चेकलिस्ट देखें ▾`}
            </Text>
          </View>

          <View style={styles.trackerProgressBadge}>
            <Text style={styles.trackerProgressText}>
              {completedCount}/{totalCount} पूर्ण
            </Text>
          </View>
        </TouchableOpacity>

        {/* Dropdown Content */}
        {isChecklistExpanded && (
          <View style={styles.checklistDropdownBody}>
            {/* Progress Bar Track */}
            <View style={styles.trackerProgressBarBg}>
              <View
                style={[
                  styles.trackerProgressBarFill,
                  { width: `${progressPercent}%` },
                ]}
              />
            </View>

            {/* Checklist Steps */}
            <View style={styles.checklistGrid}>
              {checklistSteps.map((step, idx) => {
                const isDone = completedSteps.includes(step.id);
                return (
                  <TouchableOpacity
                    key={step.id}
                    style={[styles.checkItemRow, isDone && styles.checkItemRowDone]}
                    activeOpacity={0.8}
                    onPress={() => toggleChecklistStep(step.id)}
                  >
                    <View style={[styles.checkbox, isDone && styles.checkboxDone]}>
                      {isDone ? (
                        <Ionicons name="checkmark" size={15} color="#1E1B4B" />
                      ) : (
                        <Text style={styles.stepNumberText}>{idx + 1}</Text>
                      )}
                    </View>

                    <View style={styles.checkTextCol}>
                      <View style={styles.checkTitleRow}>
                        <Text style={[styles.checkTitle, isDone && styles.checkTitleDone]}>
                          {step.icon} {step.title}
                        </Text>
                        <Text style={styles.checkTime}>{step.timeRange}</Text>
                      </View>
                      <Text style={[styles.checkDesc, isDone && styles.checkDescDone]}>
                        {step.desc}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* Hidden Off-screen Render of Sacred Karwa Chauth Share Image Card */}
      <View
        style={styles.offscreenShareContainer}
        pointerEvents="none"
        collapsable={false}
      >
        <KarwaChauthShareCard
          ref={shareCardRef}
          userName={fullName}
          cityName={cityName}
          moonriseTime={moonriseTime}
        />
      </View>

      {/* Interactive City Selector Modal */}
      <Modal
        visible={cityPickerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCityPickerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="location-sharp" size={20} color="#F59E0B" />
                <Text style={styles.modalTitle}>अपना शहर चुनें</Text>
              </View>
              <TouchableOpacity
                onPress={() => setCityPickerVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.modalSearchBox}>
              <Ionicons name="search" size={16} color="#64748B" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="शहर खोजें (उदा. जयपुर, मुंबई, लखनऊ, इंदौर)..."
                placeholderTextColor="#94A3B8"
                value={citySearchQuery}
                onChangeText={setCitySearchQuery}
                autoFocus={false}
              />
              {citySearchQuery ? (
                <TouchableOpacity onPress={() => setCitySearchQuery('')}>
                  <Ionicons name="close" size={16} color="#64748B" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Popular City Quick Chips */}
            {!citySearchQuery && (
              <View style={styles.popularCitiesSection}>
                <Text style={styles.popularLabel}>प्रमुख शहर:</Text>
                <View style={styles.popularChipsRow}>
                  {POPULAR_CITY_IDS.map((id) => {
                    const cityObj = MAJOR_CITIES_MOONRISE.find((c) => c.id === id);
                    if (!cityObj) return null;
                    const isSelected = cityObj.id === detectedCity.id;
                    return (
                      <TouchableOpacity
                        key={id}
                        style={[
                          styles.popularChip,
                          isSelected && styles.popularChipSelected,
                        ]}
                        onPress={() => handleSelectCity(cityObj)}
                      >
                        <Text
                          style={[
                            styles.popularChipText,
                            isSelected && styles.popularChipTextSelected,
                          ]}
                        >
                          {cityObj.hindiCity.split('/')[0].trim()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Scrollable City List */}
            <ScrollView
              style={styles.cityListScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {filteredCities.map((item) => {
                const isSelected = item.id === detectedCity.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.cityListItem,
                      isSelected && styles.cityListItemSelected,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleSelectCity(item)}
                  >
                    <View style={styles.cityListLeft}>
                      <Text
                        style={[
                          styles.cityListName,
                          isSelected && styles.cityListNameSelected,
                        ]}
                      >
                        {item.hindiCity} ({item.city})
                      </Text>
                      <Text style={styles.cityListState}>{item.hindiState}</Text>
                    </View>

                    <View style={styles.cityListRight}>
                      <Text
                        style={[
                          styles.cityListMoon,
                          isSelected && styles.cityListMoonSelected,
                        ]}
                      >
                        🌙 {item.moonriseTime}
                      </Text>
                      {isSelected ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color="#F59E0B"
                          style={{ marginLeft: 6 }}
                        />
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  // 1. Unified Hero Card
  heroUnifiedCard: {
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(254, 240, 138, 0.35)',
    shadowColor: '#8B0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarImg: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  avatarFallback: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FEF08A',
  },
  avatarInitial: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
  },
  heroTextCol: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  festivalPill: {
    backgroundColor: 'rgba(254, 240, 138, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
    borderWidth: 0.8,
    borderColor: '#FDE047',
  },
  festivalPillText: {
    color: '#FEF08A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  devoteeName: {
    color: '#FFFDF5',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  devoteeBlessing: {
    color: '#FDE68A',
    fontSize: 11,
    lineHeight: 15,
  },

  // City & Timing Bar
  cityTimingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 0.8,
    borderColor: 'rgba(254, 240, 138, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 10,
    gap: 6,
  },
  citySelectorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  citySelectorText: {
    color: '#FEF08A',
    fontSize: 12,
    fontWeight: '800',
    flexShrink: 1,
  },
  citySelectorDropdownIcon: {
    color: '#FDE047',
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 3,
  },
  moonriseTimingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moonriseTimingText: {
    color: '#E2E8F0',
    fontSize: 11.5,
    fontWeight: '600',
  },
  moonriseTimingHighlight: {
    color: '#FDE047',
    fontWeight: '800',
  },

  // Heritage Row
  heritageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 0.8,
    borderTopColor: 'rgba(254, 240, 138, 0.2)',
  },
  heritageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    gap: 3,
  },
  heritageChipLabel: {
    color: '#CBD5E1',
    fontSize: 9.5,
    fontWeight: '600',
  },
  heritageChipVal: {
    color: '#FEF08A',
    fontSize: 10,
    fontWeight: '700',
  },

  // Sankalp
  sankalpContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
    borderRadius: 12,
    padding: 9,
    marginTop: 8,
    borderWidth: 0.8,
    borderColor: 'rgba(254, 240, 138, 0.22)',
  },
  sankalpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  sankalpTitle: {
    color: '#FEF08A',
    fontSize: 10.5,
    fontWeight: '800',
  },
  sankalpToggleBtn: {
    color: '#FDE047',
    fontSize: 10,
    fontWeight: '700',
  },
  sankalpText: {
    color: '#FFF8E7',
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 15.5,
  },

  // WhatsApp Button
  quickSharePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(37, 211, 102, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.5)',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  quickSharePillText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },

  // 2. Interactive Tracker Card
  trackerCard: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 2,
    marginBottom: 12,
  },
  trackerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 4,
  },
  checklistDropdownBody: {
    marginTop: 6,
  },
  offscreenShareContainer: {
    position: 'absolute',
    left: -9999,
    top: -9999,
    opacity: 0.01,
    zIndex: -999,
  },
  trackerMainTitle: {
    color: '#1E293B',
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  trackerSubTitle: {
    color: '#64748B',
    fontSize: 10.5,
    marginTop: 1,
  },
  trackerProgressBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 0.8,
    borderColor: '#F59E0B',
  },
  trackerProgressText: {
    color: '#B45309',
    fontSize: 10.5,
    fontWeight: '800',
  },
  trackerProgressBarBg: {
    height: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  trackerProgressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  checklistGrid: {
    gap: 7,
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 9,
    borderWidth: 0.8,
    borderColor: '#E2E8F0',
    gap: 9,
  },
  checkItemRowDone: {
    backgroundColor: '#FEFCE8',
    borderColor: '#FDE047',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxDone: {
    backgroundColor: '#FDE047',
    borderColor: '#D97706',
  },
  stepNumberText: {
    color: '#94A3B8',
    fontSize: 10.5,
    fontWeight: '700',
  },
  checkTextCol: {
    flex: 1,
  },
  checkTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  checkTitle: {
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '700',
  },
  checkTitleDone: {
    color: '#854D0E',
    fontWeight: '800',
  },
  checkTime: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '700',
  },
  checkDesc: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 13.5,
  },
  checkDescDone: {
    color: '#92400E',
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 12,
  },
  modalSearchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
    padding: 0,
  },
  popularCitiesSection: {
    marginBottom: 10,
  },
  popularLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  popularChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  popularChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 0.8,
    borderColor: '#CBD5E1',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 10,
  },
  popularChipSelected: {
    backgroundColor: '#F59E0B',
    borderColor: '#D97706',
  },
  popularChipText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '600',
  },
  popularChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  cityListScroll: {
    maxHeight: 340,
  },
  cityListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 0.8,
    borderBottomColor: '#F1F5F9',
  },
  cityListItemSelected: {
    backgroundColor: '#FEFCE8',
    borderRadius: 10,
  },
  cityListLeft: {
    flex: 1,
  },
  cityListName: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '700',
  },
  cityListNameSelected: {
    color: '#B45309',
    fontWeight: '800',
  },
  cityListState: {
    color: '#64748B',
    fontSize: 10.5,
    marginTop: 1,
  },
  cityListRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cityListMoon: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  cityListMoonSelected: {
    color: '#D97706',
    fontWeight: '800',
  },
});
