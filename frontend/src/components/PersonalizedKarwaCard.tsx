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
  Image as RNImage,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../store/authStore';
import {
  detectUserMoonCity,
  CityMoonriseData,
  MAJOR_CITIES_MOONRISE,
  POPULAR_CITY_IDS,
  STORAGE_KEY_MANUAL_CITY,
  createCustomCityData,
  getInitialUserMoonCity,
} from '../utils/karwaMoonrise';
import { KarwaChauthShareCard } from './KarwaChauthShareCard';
import { shareFestivalCard } from '../utils/shareFestivalCard';
import { shareFestivalStoryPdf } from '../utils/generateFestivalStoryPdf';

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
  festival,
  onCityDetected,
}: {
  festival?: any;
  onCityDetected?: (city: CityMoonriseData) => void;
}) {
  const user = useAuthStore((state) => state.user);
  const [detectedCity, setDetectedCity] = useState<CityMoonriseData>(() => getInitialUserMoonCity(user));
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [showFullSankalp, setShowFullSankalp] = useState<boolean>(false);
  const [cityPickerVisible, setCityPickerVisible] = useState<boolean>(false);
  const [citySearchQuery, setCitySearchQuery] = useState<string>('');
  const [isChecklistExpanded, setIsChecklistExpanded] = useState<boolean>(true);
  const [isSharingPdf, setIsSharingPdf] = useState<boolean>(false);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState<boolean>(false);
  const shareCardRef = useRef<any>(null);

  // User profile derived attributes
  const rawName = (user?.name || '').trim();
  const fullName = rawName || 'करवा चौथ व्रती';
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
    AsyncStorage.setItem(STORAGE_KEY_MANUAL_CITY, JSON.stringify(city)).catch(() => {});
    setCityPickerVisible(false);
    setCitySearchQuery('');
    onCityDetected?.(city);
  };

  const toggleChecklistStep = (id: string) => {
    const willBeDone = !completedSteps.includes(id);
    try {
      if (willBeDone) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (_e) {}

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCompletedSteps((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id];
      AsyncStorage.setItem('@karwa_day_checklist_2026', JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  };

  const toggleChecklistExpanded = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_e) {}
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsChecklistExpanded((prev) => !prev);
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

  // Share Sacred Karwa Chauth Katha & Puja Vidhi PDF
  const handleSharePdf = async () => {
    if (isSharingPdf) return;
    try {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (_e) {}
      setIsSharingPdf(true);
      const festObj = festival || {
        id: 'karwa-chauth',
        name: 'Karwa Chauth',
        festival_name: 'Karwa Chauth',
        date: '2026-10-29',
      };
      await shareFestivalStoryPdf(festObj);
    } catch (err) {
      console.warn('[PersonalizedKarwaCard] PDF share error:', err);
    } finally {
      setIsSharingPdf(false);
    }
  };

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
        await new Promise((res) => setTimeout(res, 350));
        const captureResult = await safeCaptureRef(shareCardRef, {
          format: 'png',
          quality: 0.95,
          result: 'tmpfile',
        });
        imageUri = captureResult.uri;
      }

      // Guaranteed fallback to festive parchment card asset if snapshot is null
      if (!imageUri) {
        try {
          const fallbackSource = RNImage.resolveAssetSource(
            require('../../assets/images/festivals/karwa_chauth_share_bg.jpg')
          );
          if (fallbackSource?.uri) {
            imageUri = fallbackSource.uri;
          }
        } catch (_err) {}
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
          <View style={styles.heroTextCol}>
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
            <Text style={styles.sankalpTitle}>आपका व्यक्तिगत व्रत संकल्प</Text>
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

        {/* Sacred Karwa Chauth Wishes Share Button */}
        <TouchableOpacity
          style={styles.pdfShareBtn}
          activeOpacity={0.85}
          disabled={isSharingPdf}
          onPress={handleSharePdf}
        >
          {isSharingPdf ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="share-social-outline" size={16} color="#FBBF24" />
          )}
          <Text style={styles.pdfShareBtnText}>
            {isSharingPdf ? 'Preparing Wishes...' : 'Share Your Wishes'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* 2. Personalized Interactive 5-Step Day Tracker */}
      <View style={styles.trackerCard}>
        {/* Tracker Header */}
        <TouchableOpacity
          style={styles.trackerHeaderRow}
          activeOpacity={0.7}
          onPress={toggleChecklistExpanded}
        >
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.trackerMainTitle}>आपकी पावन व्रत दिनचर्या</Text>
          </View>

          <View style={styles.trackerTogglePill}>
            <Text style={styles.trackerTogglePillText}>
              {completedCount === totalCount ? 'पूर्ण ✓' : `${completedCount}/${totalCount}`}
            </Text>
            <Ionicons
              name={isChecklistExpanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color="#B45309"
            />
          </View>
        </TouchableOpacity>

        {/* Progress Bar Track */}
        <View style={styles.trackerProgressBarBg}>
          <LinearGradient
            colors={['#F59E0B', '#D97706', '#E11D48']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.trackerProgressBarFill,
              { width: `${Math.max(progressPercent > 0 ? 8 : 0, progressPercent)}%` },
            ]}
          />
        </View>

        {/* Dropdown Content */}
        {isChecklistExpanded && (
          <View style={styles.checklistDropdownBody}>
            {/* Checklist Timeline */}
            <View style={styles.timelineContainer}>
              {checklistSteps.map((step, idx) => {
                const isDone = completedSteps.includes(step.id);

                return (
                  <TouchableOpacity
                    key={step.id}
                    style={[
                      styles.checkItemCard,
                      isDone && styles.checkItemCardDone,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => toggleChecklistStep(step.id)}
                  >
                    {/* Circle Node */}
                    <View
                      style={[
                        styles.timelineCircleNode,
                        isDone && styles.timelineCircleNodeDone,
                      ]}
                    >
                      {isDone ? (
                        <Ionicons name="checkmark-sharp" size={13} color="#FFFFFF" />
                      ) : (
                        <Text style={styles.timelineNodeNumber}>{idx + 1}</Text>
                      )}
                    </View>

                    {/* Step Content Column */}
                    <View style={styles.stepContentCol}>
                      {/* Title & Status */}
                      <View style={styles.stepHeaderRow}>
                        <Text
                          style={[
                            styles.stepTitleText,
                            isDone && styles.stepTitleTextDone,
                          ]}
                        >
                          <Text style={styles.stepIconEmoji}>{step.icon} </Text>
                          {step.title}
                        </Text>
                        {isDone && (
                          <View style={styles.doneBadgePill}>
                            <Text style={styles.doneBadgeText}>पूर्ण ✓</Text>
                          </View>
                        )}
                      </View>

                      {/* Time Pill */}
                      <View style={styles.stepTimePill}>
                        <Ionicons name="time-outline" size={11} color="#B45309" />
                        <Text style={styles.stepTimeText} numberOfLines={1}>
                          {step.timeRange}
                        </Text>
                      </View>

                      {/* Description */}
                      <Text
                        style={[
                          styles.stepDescText,
                          isDone && styles.stepDescTextDone,
                        ]}
                      >
                        {step.desc}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Motivational Footer if all completed */}
            {completedCount === totalCount && (
              <View style={styles.celebrationFooter}>
                <Text style={styles.celebrationEmoji}>🎉 🌸 🪔</Text>
                <Text style={styles.celebrationTitle}>
                  समस्त करवा चौथ व्रत विधि पूर्ण!
                </Text>
                <Text style={styles.celebrationSub}>
                  माता पार्वती व शिव परिवार आपके दांपत्य जीवन में सदा सुख, प्रेम व अखंड सौभाग्य बनाए रखें।
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Hidden Off-screen Render of Sacred Karwa Chauth Share Image Card */}
      <View
        style={styles.offscreenShareContainer}
        pointerEvents="none"
      >
        <View collapsable={false} style={{ width: 576, height: 1024, backgroundColor: 'transparent' }}>
          <KarwaChauthShareCard
            ref={shareCardRef}
            userName={fullName}
            cityName={cityName}
            moonriseTime={moonriseTime}
          />
        </View>
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
              {/* Option to use typed city as custom city */}
              {citySearchQuery.trim().length > 0 && (
                <TouchableOpacity
                  style={styles.customCityOption}
                  activeOpacity={0.75}
                  onPress={() => {
                    const custom = createCustomCityData(citySearchQuery.trim());
                    handleSelectCity(custom);
                  }}
                >
                  <View style={styles.customCityOptionLeft}>
                    <Ionicons name="location" size={18} color="#D97706" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.customCityOptionName}>
                        {`📍 "${citySearchQuery.trim()}" चुनें`}
                      </Text>
                      <Text style={styles.customCityOptionSub}>
                        कस्टम शहर • स्वचालित चंद्रोदय गणना
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#D97706" />
                </TouchableOpacity>
              )}

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
    width: '100%',
    marginBottom: 8,
    overflow: 'hidden',
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

  // Sacred PDF Share Button
  pdfShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(217, 119, 6, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.55)',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginTop: 10,
  },
  pdfShareBtnText: {
    color: '#FFFBEB',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // 2. Interactive Tracker Card
  trackerCard: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 2,
    marginBottom: 14,
  },
  offscreenShareContainer: {
    position: 'absolute',
    left: -9999,
    top: -9999,
    width: 576,
    height: 1024,
    opacity: 1,
    zIndex: -999,
  },
  trackerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 6,
  },
  trackerHeaderIcon: {
    fontSize: 14,
  },
  trackerMainTitle: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  trackerSubTitle: {
    color: '#78716C',
    fontSize: 11,
    marginTop: 2,
  },
  trackerTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 0.8,
    borderColor: '#F59E0B',
  },
  trackerTogglePillText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '800',
  },
  trackerProgressBarBg: {
    height: 6,
    backgroundColor: 'rgba(203, 213, 225, 0.35)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  trackerProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  checklistDropdownBody: {
    marginTop: 2,
  },
  timelineContainer: {
    width: '100%',
    gap: 9,
  },
  checkItemCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.16)',
    shadowColor: '#78350F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
    overflow: 'hidden',
  },
  checkItemCardDone: {
    backgroundColor: '#FFFDF7',
    borderColor: '#FBBF24',
  },
  timelineCircleNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D6D3D1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    marginRight: 10,
    flexShrink: 0,
  },
  timelineCircleNodeDone: {
    backgroundColor: '#D97706',
    borderColor: '#B45309',
  },
  timelineNodeNumber: {
    color: '#78716C',
    fontSize: 10.5,
    fontWeight: '800',
  },
  stepContentCol: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    gap: 6,
    marginBottom: 4,
  },
  stepTitleText: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    color: '#1C1917',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.1,
    lineHeight: 18,
  },
  stepTitleTextDone: {
    color: '#854D0E',
  },
  stepIconEmoji: {
    fontSize: 13,
  },
  doneBadgePill: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 0.8,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    flexShrink: 0,
    marginLeft: 4,
  },
  doneBadgeText: {
    color: '#15803D',
    fontSize: 9.5,
    fontWeight: '800',
  },
  stepTimePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    marginBottom: 5,
    maxWidth: '100%',
  },
  stepTimeText: {
    color: '#B45309',
    fontSize: 10.5,
    fontWeight: '700',
    flexShrink: 1,
  },
  stepDescText: {
    color: '#78716C',
    fontSize: 11,
    lineHeight: 15,
    width: '100%',
    flexShrink: 1,
  },
  stepDescTextDone: {
    color: '#92400E',
  },
  celebrationFooter: {
    width: '100%',
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FEFCE8',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE047',
    alignItems: 'center',
    overflow: 'hidden',
  },
  celebrationEmoji: {
    fontSize: 18,
    marginBottom: 2,
  },
  celebrationTitle: {
    color: '#854D0E',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  celebrationSub: {
    color: '#A16207',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
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
  customCityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  customCityOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  customCityOptionName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  customCityOptionSub: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 1,
  },
});
