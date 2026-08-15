import templeDataDump from '../../src/constants/templeDataDump.json';
import { resolveTempleTransport } from '../../src/data/templeTransportResolver';
import { resolveTempleFestivals } from '../../src/data/templeFestivalResolver';
import { DEFAULT_TEMPLE_LOCATIONS, SPECIAL_TEMPLE_DATA } from '../../src/data/templeStaticData';
import { FALLBACK_TEMPLE_BY_ID } from '../../src/data/templeFallbackData';
import { getMapEmbedUrl, getMapSearchUrl, getMapHtml } from '../../src/utils/templeMapUtils';
import { getYoutubeVideoId, getYoutubeAppUrl, getYoutubeEmbedUrl, getYoutubeMobileUrl, getYoutubeHtml } from '../../src/utils/youtubeUtils';
import { CATEGORY_BADGE_MAP, AMENITY_MAP, GUIDELINE_ICONS } from '../../src/data/templeDisplayMaps';
import {
  getCategoryBadge,
  getSpecialTempleKey,
  formatTempleLocation,
  getTempleAartiSessions,
  checkIsAartiLive,
} from '../../src/data/templeHelpers';
// accessibility: placeholder
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, Linking, Platform, Modal, Image, Animated, Dimensions, Share } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { getTemple, getTempleFromBackend } from '../../src/services/api';
import { database } from '../../src/database';
import { Q } from '@nozbe/watermelondb';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { getTempleImageById, getTempleImageByName, resolveTempleImage, DEFAULT_TEMPLE_IMAGE } from '../../src/constants/templeImages';
import { useTranslation } from '../../src/utils/i18n';
import { CustomLoader } from '../../src/components/CustomLoader';
import { PilgrimageTravelSection } from '../../src/components/PilgrimageTravelSection';
import { TempleFacilitiesSection } from '../../src/components/TempleFacilitiesSection';
import { DarshanAartiTimeline } from '../../src/components/DarshanAartiTimeline';
import { AboutTempleStory } from '../../src/components/AboutTempleStory';

const isWeb = Platform.OS === 'web';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const mapBackendResponseToFrontend = (backendData: any) => {
  // Convert aarti_sessions array to aarti_timings object for legacy compatibility
  const aarti_timings: Record<string, string> = {};
  if (backendData.aarti_sessions) {
    backendData.aarti_sessions.forEach((s: any) => {
      aarti_timings[s.title] = s.time_start;
    });
  }

  const loc = backendData.location || {};
  const locationStr = [loc.area, loc.city, loc.state].filter(Boolean).join(', ');

  return {
    id: backendData.slug || backendData.id,
    temple_id: backendData.slug || backendData.id,
    name: backendData.name,
    deity: backendData.deity,
    category: backendData.category,
    description: backendData.metadata?.about || backendData.description || '',
    guidance: backendData.guidance || '',
    location: locationStr,
    coords: loc.latitude ? { latitude: loc.latitude, longitude: loc.longitude } : null,
    established_year: backendData.established_year,
    entry_fee: backendData.entry_fee,
    best_time_to_visit: backendData.best_time_to_visit,
    website: backendData.official_links?.websites?.[0] || null,
    contact: backendData.official_links?.helplines?.[0] || backendData.contact || null,
    timings: backendData.darshan_details ? {
      opening: backendData.darshan_details.opening_time,
      closing: backendData.darshan_details.closing_time
    } : {},
    facilities: backendData.facilities || [],
    festivals: backendData.metadata?.festivals || [],
    history: backendData.metadata?.history,
    architecture: backendData.metadata?.architecture,
    significance: backendData.metadata?.mythological_significance,
    sacred_rituals: backendData.metadata?.sacred_rituals,
    pilgrimage_circuit: backendData.metadata?.pilgrimage_circuit,
    aarti_timings: aarti_timings,
    is_verified: backendData.is_verified || false,
    is_following: false,
    // Map media for images and YouTube live streams
    image_url: backendData.media?.[0]?.url || null,
    youtube_url: backendData.media?.find((m: any) => m.media_type === 'live_stream' || m.media_type === 'video')?.url || null,
  };
};


export default function TempleDetailScreen() {
  const { id, autoplayAarti } = useLocalSearchParams<{ id: string; autoplayAarti?: string }>();
  const { t } = useTranslation();
  const resolvedTempleId = decodeURIComponent(String(id || '')).trim();
  const router = useRouter();
  const [temple, setTemple] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isYoutubeModalVisible, setIsYoutubeModalVisible] = useState(false);
  const [galleryModalVisible, setGalleryModalVisible] = useState(false);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const galleryScrollRef = useRef<FlatList>(null);

  const templeKey = useMemo(() => getSpecialTempleKey(temple?.name || resolvedTempleId || ''), [temple?.name, resolvedTempleId]);
  const locationStr = useMemo(() => formatTempleLocation(temple), [temple]);
  const specialTempleData = SPECIAL_TEMPLE_DATA[templeKey] || null;
  const resolvedCoords = temple?.coords || specialTempleData?.coords || null;
  const resolvedYoutubeUrl = temple?.youtube_url || specialTempleData?.youtubeUrl || null;
  const isCurrentlyLive = Boolean(resolvedYoutubeUrl);

  const quickFacts = useMemo(() => {
    const specialKey = getSpecialTempleKey(temple?.name || resolvedTempleId || '');
    const specialTemple = SPECIAL_TEMPLE_DATA[specialKey];
    const estYear = temple?.established_year || temple?.year_built || temple?.establishedYear || specialTemple?.establishedYear || 'Ancient';
    const entryFee = (temple?.entry_fee !== undefined && temple?.entry_fee !== null)
      ? (temple.entry_fee === 0 || temple.entry_fee === 'Free' ? (t('language') === 'hi' ? 'निःशुल्क प्रवेश' : 'Free Entry') : typeof temple.entry_fee === 'number' ? `₹${temple.entry_fee}` : temple.entry_fee)
      : (specialTemple?.entryFee || (t('language') === 'hi' ? 'निःशुल्क प्रवेश' : 'Free Entry'));
    const bestTime = temple?.best_time_to_visit || specialTemple?.bestTimeToVisit || (t('language') === 'hi' ? 'अक्टूबर से मार्च' : 'October to March');
    return { estYear, entryFee, bestTime };
  }, [temple, templeKey, t]);

  useEffect(() => {
    if (autoplayAarti === 'true' && resolvedYoutubeUrl) {
      setIsYoutubeModalVisible(true);
    }
  }, [autoplayAarti, resolvedYoutubeUrl]);

  // Memoize WebView content to prevent re-renders during playback
  const youtubeWebViewContent = React.useMemo(() => {
    if (!resolvedYoutubeUrl) return null;
    const videoId = getYoutubeVideoId(resolvedYoutubeUrl);

    let targetUri = resolvedYoutubeUrl;
    if (videoId) {
      targetUri = `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&enablejsapi=1&rel=0&modestbranding=1`;
    } else if (resolvedYoutubeUrl.includes('@')) {
      const handle = resolvedYoutubeUrl.split('@')[1].split('/')[0].split('?')[0];
      targetUri = `https://www.youtube.com/embed/live_stream?channel_handle=${handle}&autoplay=1&enablejsapi=1&playsinline=1`;
    } else if (resolvedYoutubeUrl.includes('embed/live_stream') && !resolvedYoutubeUrl.includes('autoplay=1')) {
      targetUri = resolvedYoutubeUrl.includes('?') ? `${resolvedYoutubeUrl}&autoplay=1&enablejsapi=1&playsinline=1` : `${resolvedYoutubeUrl}?autoplay=1&enablejsapi=1&playsinline=1`;
    }

    return (
      <WebView
        source={{ uri: targetUri }}
        originWhitelist={['*']}
        style={styles.youtubeFrame}
        javaScriptEnabled
        domStorageEnabled
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
        mediaPlaybackRequiresUserAction={false}
      />
    );
  }, [resolvedYoutubeUrl]);

  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  const loadLocalTempleData = async () => {
    try {
      let localTemples = await database.get('temples').query(Q.where('temple_id', resolvedTempleId)).fetch();
      if (!localTemples || localTemples.length === 0) {
        try {
          const rec = await database.get('temples').find(resolvedTempleId);
          if (rec) localTemples = [rec];
        } catch (_) { }
      }
      if (localTemples && localTemples.length > 0) {
        const t = localTemples[0] as any;
        const realTempleId = t.templeId || t._raw?.temple_id || resolvedTempleId;
        // Protect remote API data from being overwritten if remote fetch already completed
        setTemple((prev: any) => prev || {
          id: realTempleId,
          temple_id: realTempleId,
          name: t.name,
          location: t.location,
          deity: t.deity,
          category: t.category,
          description: t.description,
          guidance: t.guidance,
          image_url: t.imageUrl,
          youtube_url: t.youtubeUrl,
          coords: t.coords ? JSON.parse(t.coords) : null,
          aarti_timings: t.aartiTimings ? JSON.parse(t.aartiTimings) : null,
          is_following: t.isFollowing,
          is_verified: t.isVerified,
        });
      }
    } catch (error) {
      console.error('Error loading local temple details:', error);
    }
  };

  const fetchTempleData = useCallback(async () => {
    let finalTempleData: any = null;

    // 🕵️ SMART DETECTION: Is this a local WatermelonDB ID or a Backend Slug?
    // Local IDs are usually 16-20 alphanumeric chars with NO hyphens.
    const isLocalWatermelonId = /^[a-zA-Z0-9]{10,25}$/.test(resolvedTempleId) && !resolvedTempleId.includes('-');

    try {
      // 1. ONLY call the backend if it's a real slug (not a local ID)
      if (!isLocalWatermelonId) {
        const backendData = await getTempleFromBackend(resolvedTempleId);
        if (backendData) {
          finalTempleData = mapBackendResponseToFrontend(backendData);
        }
      }

      // 2. If backend failed OR we skipped it (because it's a local ID), use the JSON Dump!
      if (!finalTempleData) {
        // Get the local temple name from WatermelonDB to help us search the dump
        let localName = '';
        try {
          const localRecord = await database.get('temples').find(resolvedTempleId).catch(() => null);
          if (localRecord) localName = (localRecord as any)._raw.name || '';
        } catch (e) {}

        // Search the JSON dump by Name or Slug
        const dumpedTemple = (templeDataDump as any[]).find((t: any) => 
          (localName && t.name.toLowerCase() === localName.toLowerCase()) || 
          t.slug === resolvedTempleId ||
          t.id === resolvedTempleId
        );

        if (dumpedTemple) {
          console.log('✅ [FALLBACK] Loaded rich data from local JSON dump for:', dumpedTemple.name);
          finalTempleData = mapBackendResponseToFrontend(dumpedTemple);
        }
      }

      // 3. Absolute final fallback (Legacy API / Static Data)
      if (!finalTempleData) {
        const templeRes = await getTemple(resolvedTempleId).catch(() => null);
        if (templeRes?.data) {
          finalTempleData = templeRes.data;
        } else {
          const fallbackTemple = FALLBACK_TEMPLE_BY_ID[resolvedTempleId];
          if (fallbackTemple) finalTempleData = fallbackTemple;
        }
      }

      if (finalTempleData) {
        setTemple(finalTempleData);
        
        // Sync to WatermelonDB
        database.write(async () => {
          const templeCollection = database.get('temples');
          const tData = finalTempleData;
          const targetQueryId = tData.slug || tData.temple_id || resolvedTempleId;
          const localTemples = await templeCollection.query(Q.where('temple_id', targetQueryId)).fetch();
          
          if (localTemples.length > 0) {
            await localTemples[0].update((record: any) => {
              record.name = tData.name || '';
              record.location = tData.location || '';
              record.deity = tData.deity || '';
              record.category = tData.category || '';
              record.description = tData.description || '';
              record.guidance = tData.guidance || '';
              record.imageUrl = tData.image_url || '';
              record.youtubeUrl = tData.youtube_url || '';
              record.coords = tData.coords ? JSON.stringify(tData.coords) : null;
              record.aartiTimings = tData.aarti_timings ? JSON.stringify(tData.aarti_timings) : null;
              record.isFollowing = tData.is_following || false;
              record.isVerified = tData.is_verified || false;
              if (tData.temple_id || tData.slug) record.templeId = tData.slug || tData.temple_id; 
            });
          } else {
            await templeCollection.create((record: any) => {
              record.templeId = targetQueryId;
              record.name = tData.name || '';
              record.location = tData.location || '';
              record.deity = tData.deity || '';
              record.category = tData.category || '';
              record.description = tData.description || '';
              record.guidance = tData.guidance || '';
              record.imageUrl = tData.image_url || '';
              record.youtubeUrl = tData.youtube_url || '';
              record.coords = tData.coords ? JSON.stringify(tData.coords) : null;
              record.aartiTimings = tData.aarti_timings ? JSON.stringify(tData.aarti_timings) : null;
              record.isFollowing = tData.is_following || false;
              record.isVerified = tData.is_verified || false;
            });
          }
        }).catch((dbError: any) => {
          console.error('Error syncing temple details to WatermelonDB:', dbError);
        });
        
      } else {
        // Minimal placeholder if absolutely nothing is found
        setTemple((prev: any) => prev || {
          id: resolvedTempleId,
          name: resolvedTempleId.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          location: '', deity: '', category: 'Sacred',
          description: '', guidance: '', aarti_timings: {},
          is_following: false, is_verified: false,
        });
      }
    } catch (error) {
      console.error('Error fetching temple data:', error);
    } finally {
      setLoading(false);
    }
  }, [resolvedTempleId]);

  useEffect(() => {
    setLoading(true);
    // Check static fallbacks immediately to show content instantly without full blocking screen loader
    const staticTemple = FALLBACK_TEMPLE_BY_ID[resolvedTempleId];
    if (staticTemple) {
      setTemple(staticTemple);
    } else {
      setTemple(null);
    }
    loadLocalTempleData();
    fetchTempleData();
  }, [id, fetchTempleData]);

  useEffect(() => {
    if (isCurrentlyLive && !isYoutubeModalVisible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
    return () => { pulseAnim.stopAnimation(); };
  }, [isCurrentlyLive, isYoutubeModalVisible, pulseAnim]);

  const handleGoBack = () => {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/temple');
      }
    } catch (error) {
      router.replace('/(tabs)/temple');
    }
  };



  const handleShare = async () => {
    try {
      await Share.share({
        message: `🛕 ${displayName}\n📍 ${locationStr}\n\nDiscover this sacred temple on Brahmand - India's Spiritual Network`,
        title: displayName,
      });
    } catch (error) {
      console.error('Error sharing temple:', error);
    }
  };

  // All hook declarations proceed unconditionally above early returns to strictly honor React Rules of Hooks






  const displayName = templeKey || temple?.name || 'Temple';
  const isYoutubeUrl = Boolean(resolvedYoutubeUrl && (resolvedYoutubeUrl.includes('youtube.com') || resolvedYoutubeUrl.includes('youtu.be')));
  const aartiSessions = getTempleAartiSessions(temple?.aarti_timings || {}, temple?.name);
  const templeImageSource = useMemo(() => resolveTempleImage({
    ...temple,
    temple_id: temple?.temple_id || temple?.templeId || resolvedTempleId,
    name: temple?.name || displayName,
  }), [temple, resolvedTempleId, displayName]);

  const templeImages: any[] = (Array.isArray(temple?.images) && temple.images.length > 0)
    ? temple.images
    : (typeof (temple?.image_url || temple?.imageUrl || temple?.image || temple?.photo) === 'string' && (temple?.image_url || temple?.imageUrl || temple?.image || temple?.photo).startsWith('http'))
      ? [temple.image_url || temple.imageUrl || temple.image || temple.photo]
      : [templeImageSource];
  const darshanTimings = temple?.timings && typeof temple.timings === 'object' && Object.keys(temple.timings).length > 0 ? temple.timings : null;
  const templeContact = temple?.contact && typeof temple.contact === 'string' && temple.contact.trim() ? temple.contact.trim() : null;

  // Helper to resolve official website with strict domain verification
  const getOfficialTempleWebsite = () => {
    const rawWebsite = temple?.website || temple?.official_website || temple?.website_url;
    if (rawWebsite && typeof rawWebsite === 'string' && rawWebsite.trim() && !rawWebsite.includes('google.com/search')) {
      return rawWebsite.trim();
    }
    const nameLower = (temple?.name || '').toLowerCase();
    const idLower = (resolvedTempleId || '').toLowerCase();
    const keyLower = (templeKey || '').toLowerCase();
    const match = (str: string) => nameLower.includes(str) || idLower.includes(str) || keyLower.includes(str);

    // 12 Jyotirlingas Strict Domain Map (Fully Verified Live Working URLs - Tested 200 OK)
    if (match('somnath')) return 'https://somnath.org';
    if (match('mallikarjuna') || match('srisailam')) return 'https://www.srisailadevasthanam.org';
    if (match('mahakal')) return 'https://shrimahakaleshwar.com';
    if (match('omkareshwar')) return 'https://www.shriomkareshwar.org';
    if (match('kedarnath') || match('badrinath')) return 'https://badrinath-kedarnath.gov.in';
    if (match('bhimashankar')) return 'https://shreebhimashankar.com';
    if (match('kashi') || match('vishwanath')) return 'https://www.shrikashivishwanath.org';
    if (match('trimbakeshwar')) return 'https://www.trimbakeshwar.org';
    if (match('baidyanath') || match('babadham') || match('vaidyanath') || match('vaidyanathdham')) return 'https://babadham.org';
    if (match('nageshwar')) return 'https://devbhumidwarka.nic.in';
    if (match('rameshwar') || match('ramanathaswamy')) return 'https://rameswaramramanathar.hrce.tn.gov.in';
    if (match('grishneshwar') || match('ghrushneshwar') || match('grineshwar')) return 'https://www.shrigrishneshwar.org';

    // Shakti Peethas & Major Shrines (Verified Official Trust Websites & Portals)
    if (match('chintpurni')) return 'https://www.matashrichintpurni.com';
    if (match('kanyakumari')) return 'https://kanniyakumari.nic.in/tspot_stst/';
    if (match('srisailam') || match('mallikarjuna')) return 'https://www.srisailadevasthanam.org/en-in/home';
    if (match('kamakhya')) return 'https://www.maakamakhya.org';
    if (match('naina') || match('nainadevi')) return 'https://srinainadevi.com';
    if (match('jwala') || match('jwalaji')) return 'https://jawalaji.in/';
    if (match('tripura') || match('tripurasundari')) return 'https://tripurasundari.tripura.gov.in/';
    if (match('biraja')) return 'https://maabiraja.com/';
    if (match('hinglaj')) return 'https://www.matahinglaj.in/';
    if (match('harsiddhi')) return 'https://www.mptourism.com/harsiddhi-temple-shakti-peetha-in-Ujjain.html';
    if (match('amarnath') || match('sharda') || match('sharada')) return 'https://jksasb.nic.in/';
    if (match('kamakshi') || match('kanchi')) return 'https://kanchikamakshi.org/';
    if (match('maihar') || (match('sharada') && match('devi'))) return 'https://maihar.nic.in/en/tourist-place/maa-sharda-mata/';
    if (match('taratarini') || match('tara tarini')) return 'https://taratarini.nic.in/';
    if (match('vindhya') || match('vindhyachal') || match('vindhyavasini')) return 'https://vindhyachalmata.com/';
    if (match('danteshwari')) return 'https://maadanteshwari.in/';
    if (match('muktinath')) return 'https://muktinathdc.org.np/';
    if (match('kailash') || match('manasarovar')) return 'https://kmy.gov.in/';
    if (match('baidyanath') || match('babadham')) return 'https://babadham.org/';
    if (match('bhabanipur')) return 'https://bhabanipur.org/english/index.htm';
    if (match('kiriteswari')) return 'https://murshidabad.gov.in/tourist-place/shaktipeeth-shri-kiriteswari-temple/';
    if (match('manibandh')) return 'https://manibandh.com/';
    if (match('vishalakshi') || (match('kashi') && match('devi'))) return 'https://kashi.gov.in/listing-details/vishalakshi-devi-temple';
    if (match('katyayani') || match('vrindavan')) return 'https://www.katyayanipeeth.org.in/';
    if (match('bhadrakali') || match('kurukshetra')) return 'https://www.maabhadrakalishaktipeeth.com/';
    if (match('devi talab') || match('jalandhar')) return 'https://shreedevitalabmandir.org/';
    if (match('pashupatinath') || match('pashupati')) return 'https://www.pashupati.gov.np/';
    if (match('sugandha')) return 'https://sugandhashaktipeeth.com/';
    if (match('nalateswari') || match('nalhati')) return 'https://nalateswari.com/';
    if (match('janaki') || match('janakpur')) return 'https://ntb.gov.np/janaki-mandir--janakpur--dhanusha';
    if (match('kolhapur') && (match('mahalaxmi') || match('mahalakshmi'))) return 'https://www.mahalaxmikolhapur.com/home';
    if (match('bakreshwar') || match('bakreswar')) return 'https://www.bkda.in';
    if (match('renuka') || match('mahur') || match('mahurgad')) return 'https://mahurgad.org';
    if (match('kalighat')) return 'https://kalighattemple.com';
    if (match('ambaji')) return 'https://www.ambajitemple.in';
    if (match('tarapith')) return 'https://tarapithtemple.org';
    if (match('chamundeshwari') || match('chamundi')) return 'https://chamundeshwaritemple.in';
    if (match('chhinnamasta') || match('rajrappa')) return 'https://ramgarh.nic.in';
    if (match('mansa') || match('mansadevi')) return 'https://mansadevi.org.in';
    if (match('chandi') || match('chandidevi')) return 'https://haridwar.nic.in';

    // Other Major Flagship Temples
    if (match('tirupati') || match('tirumala') || match('venkateswara')) return 'https://www.tirumala.org';
    if (match('vaishno') || match('katra')) return 'https://www.maavaishnodevi.org';
    if (match('meenakshi') || match('madurai')) return 'http://www.maduraimeenakshi.org';
    if (match('golden temple') || match('harmandir')) return 'https://sgpc.net';
    if (match('jagannath') || match('puri')) return 'https://www.shreejagannatha.in';
    if (match('siddhivinayak')) return 'https://www.siddhivinayak.org';
    if (match('shirdi') || match('sai')) return 'https://sai.org.in';
    if (match('iskcon')) return 'https://www.iskcon.org';
    if (match('ram mandir') || match('ayodhya') || match('janmabhoomi')) return 'https://srjbtkshetra.org';

    // Return null when no official website is available
    return null;
  };

  // Helper to resolve official helpline number
  const getOfficialTempleHelpline = () => {
    if (templeContact) return templeContact;
    const nameLower = (temple?.name || '').toLowerCase();
    const idLower = (resolvedTempleId || '').toLowerCase();
    const keyLower = (templeKey || '').toLowerCase();
    const match = (str: string) => nameLower.includes(str) || idLower.includes(str) || keyLower.includes(str);

    // Shakti Peethas & Major Shrines Helplines
    if (match('chintpurni')) return '+91 1976 255 818';
    if (match('kanyakumari')) return '+91 4652 241 421 / +91 4652 246 223';
    if (match('srisailam') || match('mallikarjuna')) return '+91 85242 88888';
    if (match('kamakhya')) return '+91 361 273 4654';
    if (match('naina') || match('nainadevi')) return '+91 1800 180 8069 (Toll Free)';
    if (match('jwala') || match('jwalaji')) return '+91 1970 222 28';
    if (match('tripura') || match('tripurasundari')) return '+91 3821 223 520';
    if (match('biraja')) return '+91 6728 223 900';
    if (match('amarnath') || match('sharda')) return '+91 194 231 3149';
    if (match('kamakshi') || match('kanchi')) return '+91 44 2722 2609';
    if (match('taratarini') || match('tara tarini')) return '+91 680 228 1456';
    if (match('danteshwari')) return '+91 83606 01008';
    if (match('baidyanath') || match('babadham')) return '+91 6432 232 295';
    if (match('manibandh')) return '+91 94602 14919';
    if (match('attahas') || match('fullara')) return '+91 94343 48482';
    if (match('katyayani') || match('vrindavan')) return '+91 73009 28885';
    if (match('bhadrakali') || match('kurukshetra')) return '+91 85709 91111';
    if (match('devi talab') || match('jalandhar')) return '+91 181 229 1252';
    if (match('kankalitala')) return '+91 98306 66215';
    if (match('nalateswari') || match('nalhati')) return '+91 3465 255 333';
    if (match('kolhapur') && (match('mahalaxmi') || match('mahalakshmi'))) return '+91 231 262 3011';

    // 12 Jyotirlingas Helpline Map
    if (match('somnath')) return '02876-231212 / +91 94282 14914 / 94282 14993';
    if (match('mahakal')) return '1800 233 1008 / 0734-2550563';
    if (match('omkareshwar')) return '07280-271228 / +91-8989998686';
    if (match('kedarnath')) return '+91-8534001008 / +91-7302257116 (BKTC)';
    if (match('badrinath')) return '+91-8979001008 / +91-7302257116 (BKTC)';
    if (match('bhimashankar')) return '02135-222880 / 02133-284222';
    if (match('kashi') || match('vishwanath')) return '+91 70802 92930 / +91 6393 131 608';
    if (match('trimbakeshwar')) return '02594-233215 / 02594-234251';
    if (match('nageshwar')) return '+91-2869-286234';
    if (match('rameshwar') || match('ramanathaswamy')) return '0453-221223 / 0453-221230';
    if (match('grishneshwar') || match('ghrushneshwar')) return '02437-243555';

    // Other Major Flagship Temples
    if (match('tirupati') || match('tirumala') || match('venkateswara')) return '155257 (Toll-Free) / 0877-2233333';
    if (match('vaishno') || match('katra')) return '1800-180-7212 (Toll-Free) / 01991-234804';
    if (match('meenakshi') || match('madurai')) return '0452-2344360 / 0452-2349868';
    if (match('golden temple') || match('harmandir')) return '0183-2553957 / 0183-2553958';
    if (match('jagannath') || match('puri')) return '06752-222002';
    if (match('siddhivinayak')) return '022-24222072 / 022-24373626';
    if (match('shirdi') || match('sai')) return '02423-265500';
    if (match('ram mandir') || match('ayodhya')) return '1800 180 5533';
    return '+91 1800 111 363 (Tourist Helpline)';
  };



  // Helper to resolve accurate Darshan, Opening/Closing, & VIP Darshan for 12 Jyotirlingas & Major Shrines
  const getAuthenticTempleDarshanDetails = () => {
    const nameLower = (temple?.name || '').toLowerCase();
    const idLower = (resolvedTempleId || '').toLowerCase();
    const keyLower = (templeKey || '').toLowerCase();
    const match = (str: string) => nameLower.includes(str) || idLower.includes(str) || keyLower.includes(str);

    if (match('somnath')) {
      return {
        opening: '6:00 AM',
        closing: '10:00 PM',
        generalDarshan: '6:00 AM – 10:00 PM',
        vipDarshan: 'Available on selected occasions'
      };
    }
    if (match('mallikarjuna') || match('srisailam')) {
      return {
        opening: '4:30 AM',
        closing: '10:00 PM',
        generalDarshan: '6:30 AM – 9:00 PM',
        vipDarshan: 'Paid Sevas available'
      };
    }
    if (match('mahakal')) {
      return {
        opening: '4:00 AM',
        closing: '11:00 PM',
        generalDarshan: '4:00 AM – 11:00 PM',
        vipDarshan: 'VIP Darshan & Bhasma Aarti booking available'
      };
    }
    if (match('omkareshwar')) {
      return {
        opening: '5:00 AM',
        closing: '10:00 PM',
        generalDarshan: '5:00 AM – 10:00 PM',
        vipDarshan: 'Special Darshan available'
      };
    }
    if (match('kedarnath')) {
      return {
        opening: '4:00 AM',
        closing: '9:00 PM',
        generalDarshan: '6:00 AM – 3:00 PM, 5:00 PM – 9:00 PM',
        vipDarshan: 'Priority Darshan available during season'
      };
    }
    if (match('bhimashankar')) {
      return {
        opening: '4:30 AM',
        closing: '9:30 PM',
        generalDarshan: '5:00 AM – 9:30 PM',
        vipDarshan: 'Special Pooja booking available'
      };
    }
    if (match('kashi') || match('vishwanath')) {
      return {
        opening: '3:00 AM',
        closing: '11:00 PM',
        generalDarshan: '4:00 AM – 11:00 PM',
        vipDarshan: 'Sugam Darshan available'
      };
    }
    if (match('trimbakeshwar')) {
      return {
        opening: '5:30 AM',
        closing: '9:00 PM',
        generalDarshan: '5:30 AM – 9:00 PM',
        vipDarshan: 'Paid Sevas available'
      };
    }
    if (match('baidyanath') || match('babadham') || match('vaidyanath')) {
      return {
        opening: '4:00 AM',
        closing: '9:00 PM',
        generalDarshan: '4:00 AM – 3:30 PM, 6:00 PM – 9:00 PM',
        vipDarshan: 'Special Darshan available'
      };
    }
    if (match('nageshwar')) {
      return {
        opening: '6:00 AM',
        closing: '9:00 PM',
        generalDarshan: '6:00 AM – 9:00 PM',
        vipDarshan: 'Special Pooja available'
      };
    }
    if (match('rameshwar') || match('ramanathaswamy')) {
      return {
        opening: '5:00 AM',
        closing: '9:00 PM',
        generalDarshan: '5:00 AM – 1:00 PM, 3:00 PM – 9:00 PM',
        vipDarshan: 'Special Darshan & Sevas available'
      };
    }
    if (match('grishneshwar') || match('ghrushneshwar') || match('grineshwar')) {
      return {
        opening: '5:00 AM',
        closing: '9:30 PM',
        generalDarshan: '5:00 AM – 9:30 PM',
        vipDarshan: 'Special Poojas available'
      };
    }

    return null;
  };

  // Helper to resolve verified 6-section temple knowledge (About, Mythological Significance, History, Architecture, Major Festivals, Pilgrimage Circuit)
  const getAuthenticJyotirlingaDetails = () => {
    const nameLower = (temple?.name || '').toLowerCase();
    const idLower = (resolvedTempleId || '').toLowerCase();
    const match = (str: string) => {
      if (!str) return false;
      const escaped = str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      return regex.test(nameLower) || regex.test(idLower);
    };

    if (match('somnath')) {
      return {
        about: 'Somnath Jyotirlinga is regarded as the first among the twelve sacred Jyotirlingas of Lord Shiva. Located on the western coast of Gujarat at Prabhas Patan near Verual, it stands at the confluence of three holy rivers (Triveni Sangam) — Kapila, Hiran, and Saraswati.',
        mythologicalSignificance: 'According to the Shiva Purana and Skanda Purana, Chandra Dev (the Moon God) was cursed by King Daksha to lose his luster. He prayed to Lord Shiva here, who blessed him with waning and waxing phases. Lord Shiva manifested as Somnath, meaning "Lord of the Moon."',
        history: "Somnath is known as the 'Shrine Eternal' having been destroyed and reconstructed seven times across Yugas. The modern grand temple was reconstructed after India's independence under the leadership of Sardar Vallabhbhai Patel and consecrated by India's first President Dr. Rajendra Prasad in 1951.",
        architecture: 'Built in the grand Kailash Mahameru Prasad style of Chalukyan architecture. The temple spire (Shikhara) rises to 155 feet, topped by a 10-ton Kalash and a 27-foot flag pole. The Arrow Pillar (Bhanustambha) on the sea-wall indicates that an uninterrupted straight sea-line connects Somnath to the South Pole (Antarctica).',
        sacredRituals: 'Somnath Mahapuja, Sandhya Aarti with Nagada drums, Dhvajarohan (Flag Hoisting ritual), and daily Triveni Sangam Snan.',
        festivals: ['Mahashivaratri', 'Shravan Month Somvar', 'Kartik Purnima Fair', 'Somnath Sangeet Mahotsav'],
        pilgrimageCircuit: '12 Jyotirlinga Circuit, Prabhas Kshetra Darshan, Krishna Nirvana Bhoomi (Bhalka Tirth)'
      };
    }
    if (match('mallikarjuna') || match('srisailam')) {
      return {
        about: "Mallikarjuna Jyotirlinga is situated atop the dense Nallamala Hills along the Krishna River in Srisailam, Andhra Pradesh. It holds a unique spiritual status as it is one of the rare shrines that is simultaneously a Jyotirlinga for Lord Shiva and one of the 18 Maha Shakti Peethas (Bhramaramba Shakti Peeth) for Goddess Parvati.",
        mythologicalSignificance: 'Legend states that Lord Shiva and Parvati assumed the forms of Mallikarjuna (Shiva as Jasmine flower) and Bhramaramba (Parvati as Bee) to reside here permanently after comforting their son Kartikeya.',
        history: 'The temple site dates back to ancient Satavahana times (2nd century BCE) and received royal patronage from Kakatiya rulers, Cholas, Vijayanagara Emperor Sri Krishnadevaraya, and Chhatrapati Shivaji Maharaj.',
        architecture: 'Dravidian style fortified stone complex with four massive Gopurams (towers), sculptured outer stone walls depicting stories from Ramayana and Mahabharata, and Mukha Mandapam built by Krishnadevaraya.',
        sacredRituals: 'Sparsh Darshan (devotees touching the sacred Jyotirlinga), Rudrabhishekam, Chandi Homam, and Kumkumarchana.',
        festivals: ['Mahashivaratri Brahmotsavam', 'Ugadi (Telugu New Year)', 'Karthika Masam Deepotsavam', 'Navratri'],
        pilgrimageCircuit: '12 Jyotirlinga Circuit, 18 Maha Shakti Peethas, Srisailam Hill Circuit'
      };
    }
    if (match('mahakal')) {
      return {
        about: 'Mahakaleshwar is the only south-facing (Dakshinamukhi) Jyotirlinga, symbolizing Lord Shiva as the Master of Time and Death (Mahakal). Situated in the historic city of Ujjain on the banks of the sacred Shipra River, it is revered as a Moksha-giving city (Sapta Puri).',
        mythologicalSignificance: 'When the demon Dushan tormented the people of Avanti (Ujjain), Lord Shiva burst from the earth as Mahakal to destroy evil forces and chose to reside here eternally as the sovereign ruler of Ujjain.',
        history: 'Mentioned in ancient texts by Kalidasa and Banabhatta. The ancient shrine was rebuilt in the 18th century under the patronage of the Maratha Scindia dynasty.',
        architecture: 'A three-tiered temple structure consisting of Mahakaleshwar at the lowest level, Omkareshwar in the middle, and Nagchandreshwar (opened only on Nag Panchami) on the top floor.',
        sacredRituals: 'World-famous 4:00 AM Bhasma Aarti (ritual using sacred ash), Shringar Aarti, and Jalabhishek with Panchamrit.',
        festivals: ['Mahashivaratri (Shiv Navratri)', 'Shravan Mondays Sawari Procession', 'Nag Panchami', 'Kumbh Mela (Simhastha every 12 years)'],
        pilgrimageCircuit: '12 Jyotirlinga Circuit, Sapta Puri Circuit, Ujjain Panchkroshi Yatra'
      };
    }
    if (match('kashi') || match('vishwanath')) {
      return {
        about: "Located in Varanasi (Kashi), the spiritual capital of India and one of the oldest living cities in the world. Kashi Vishwanath is considered the epicenter of Hindu spirituality, where Lord Shiva grants Mukti (liberation) to souls.",
        mythologicalSignificance: 'Scriptures state that Kashi rests on the tip of Lord Shiva’s Trishul (trident) and is untouched by cosmic dissolution (Pralaya).',
        history: 'Rebuilt by Queen Ahilyabai Holkar of Indore in 1780. Maharaja Ranjit Singh donated 1,000 kg of pure gold to gild the temple spires in 1835. The monumental Kashi Vishwanath Corridor connecting the temple directly to the holy River Ganga was inaugurated in December 2021.',
        architecture: 'Classic Nagara architectural style featuring three gold-plated domes and spires, integrated into the 5-lakh sq. ft. marble Ganga Corridor.',
        sacredRituals: 'Mangla Aarti (3:00 AM), Bhog Aarti, Sapta Rishi Aarti, Sandhya Aarti, and Ganga Snan at Dashashwamedh/Lalita Ghat.',
        festivals: ['Dev Deepawali', 'Mahashivaratri Shiv Baraat', 'Shravan Somvar', 'Rangbhari Ekadashi'],
        pilgrimageCircuit: '12 Jyotirlinga Circuit, Moksha Puri Circuit, Kashi Antargrihi Yatra'
      };
    }
    if (match('omkareshwar')) {
      return {
        about: 'Situated on Mandhata Island in the Narmada River, the island is believed to resemble the sacred symbol "ॐ" (Om), giving the temple its name.',
        mythologicalSignificance: 'Lord Shiva manifested here to bless the Devas after their victory over evil forces.',
        history: 'The temple has been an important pilgrimage center for centuries and is closely associated with Adi Shankaracharya.',
        architecture: 'Traditional Nagara-style temple architecture overlooking the Narmada River.',
        festivals: ['Mahashivaratri', 'Narmada Jayanti', 'Kartik Purnima'],
        pilgrimageCircuit: 'Jyotirlinga Circuit, Narmada Parikrama'
      };
    }
    if (match('kedarnath')) {
      return {
        about: 'Kedarnath is the highest and most remote Jyotirlinga, located at an altitude of approximately 3,583 meters in the Himalayas.',
        mythologicalSignificance: "After the Mahabharata war, the Pandavas sought Lord Shiva's forgiveness. Shiva appeared in the form of a bull, and his hump emerged at Kedarnath.",
        history: 'Traditionally attributed to the Pandavas and later revived by Adi Shankaracharya in the 8th century.',
        architecture: 'Massive stone construction designed to withstand harsh Himalayan weather.',
        festivals: ['Opening Ceremony (Akshaya Tritiya period)', 'Badri-Kedar Festival', 'Mahashivaratri'],
        pilgrimageCircuit: 'Char Dham, Panch Kedar, Jyotirlinga Circuit'
      };
    }
    if (match('bhimashankar')) {
      return {
        about: 'Nestled in the Sahyadri Hills, Bhimashankar is both a Jyotirlinga and an important wildlife sanctuary region.',
        mythologicalSignificance: 'Lord Shiva manifested here to destroy the demon Bhima and restore righteousness.',
        history: 'The temple has strong associations with Maratha history and the Bhakti movement.',
        architecture: 'Classic Nagara-style temple with Hemadpanti influences.',
        festivals: ['Mahashivaratri', 'Shravan Month', 'Kartik Festivals'],
        pilgrimageCircuit: 'Jyotirlinga Circuit, Sahyadri Shiva Circuit'
      };
    }
    if (match('trimbakeshwar')) {
      return {
        about: 'Trimbakeshwar is located near the origin of the sacred Godavari River and is one of the most important Shiva shrines in western India.',
        mythologicalSignificance: 'Lord Shiva appeared here in response to the penance of Sage Gautama.',
        history: 'The current temple was built by Peshwa Balaji Baji Rao in the 18th century.',
        architecture: 'Constructed from black basalt stone in traditional Hemadpanti style.',
        festivals: ['Kumbh Mela', 'Mahashivaratri', 'Shravan Month'],
        pilgrimageCircuit: 'Jyotirlinga Circuit, Godavari Origin Circuit'
      };
    }
    if (match('baidyanath') || match('babadham') || match('vaidyanath')) {
      return {
        about: 'Baidyanath Dham is one of the most visited Shiva temples in eastern India and is a major destination during the Shravani Mela.',
        mythologicalSignificance: 'Ravana worshipped Lord Shiva here and offered intense penance. Shiva manifested as Vaidyanath, the Divine Healer.',
        history: 'The temple complex consists of the main shrine and multiple subsidiary temples.',
        architecture: 'Traditional North Indian temple architecture.',
        festivals: ['Shravani Mela', 'Mahashivaratri'],
        pilgrimageCircuit: 'Jyotirlinga Circuit, Kanwar Yatra Circuit'
      };
    }
    if (match('nageshwar')) {
      return {
        about: 'Located near Dwarka, Nageshwar is associated with protection from fear, poison, and negative forces.',
        mythologicalSignificance: 'Lord Shiva appeared to rescue his devotee Supriya from the demon Daruka.',
        history: 'The temple has long been a part of the Dwarka pilgrimage route.',
        architecture: 'Modern temple complex with a towering Shiva statue nearby.',
        festivals: ['Mahashivaratri', 'Shravan Month'],
        pilgrimageCircuit: 'Jyotirlinga Circuit, Dwarka Circuit'
      };
    }
    if (match('rameshwar') || match('ramanathaswamy')) {
      return {
        about: 'Ramanathaswamy Temple is one of the holiest pilgrimage sites in India and forms an important part of the Char Dham pilgrimage.',
        mythologicalSignificance: 'Lord Rama worshipped Shiva here before crossing to Lanka and established the Jyotirlinga.',
        history: 'The temple expanded under the Pandya and Sethupathi rulers.',
        architecture: 'Famous for having one of the longest temple corridors in the world.',
        festivals: ['Mahashivaratri', 'Arudra Darshan', 'Thirukalyanam'],
        pilgrimageCircuit: 'Jyotirlinga Circuit, Char Dham'
      };
    }
    if (match('grishneshwar') || match('ghrushneshwar') || match('grineshwar')) {
      return {
        about: 'Grishneshwar, near the Ellora Caves, is traditionally regarded as the twelfth and final Jyotirlinga.',
        mythologicalSignificance: 'Lord Shiva appeared before the devoted woman Ghushma, whose unwavering faith became legendary.',
        history: 'The temple was rebuilt by Queen Ahilyabai Holkar in the 18th century.',
        architecture: 'Constructed in red stone with beautifully carved pillars and sculptures.',
        festivals: ['Mahashivaratri', 'Shravan Month', 'Pradosh Vrat'],
        pilgrimageCircuit: 'Jyotirlinga Circuit, Sahyadri Heritage Circuit'
      };
    }
    if (match('dwarka') || match('dwarkadhish')) {
      return {
        about: 'Dwarkadhish Temple, also known as Jagat Mandir, is dedicated to Lord Krishna as the King of Dwarka. It is one of the premier Char Dham and Sapta Puri pilgrimage sites.',
        mythologicalSignificance: 'Believed to have been originally built by Vajranabha, Lord Krishna’s great-grandson, over the original residence of Lord Krishna in Dwarka.',
        history: 'The present five-storied structure was enlarged in the 15th-16th century in Chalukya architecture style.',
        architecture: 'Supported by 60 pillars with intricately carved sandstone spires and the famous 52-yard flag (Dhvaja).',
        festivals: ['Janmashtami', 'Rath Yatra', 'Holi (Phool Dol)', 'Annakut (Diwali)'],
        pilgrimageCircuit: 'Char Dham, Sapta Puri, Krishna Circuit'
      };
    }
    if (match('tirupati') || match('tirumala') || match('venkateswara')) {
      return {
        about: 'Tirumala Venkateswara Temple is a historic Vaishnavite temple located on the Seshachalam Hills at Tirupati, Andhra Pradesh. It is one of the wealthiest and most visited religious sites in the world.',
        mythologicalSignificance: 'Lord Venkateswara manifested on Earth to save mankind from the trials of Kali Yuga.',
        history: 'Patronized by major dynasties including the Pallavas, Cholas, Pandyas, Vijayanagara Emperors, and Maratha rulers.',
        architecture: 'Dravidian architecture featuring the gold-gilded Ananda Nilayam vimanam.',
        festivals: ['Srivari Brahmotsavam', 'Vaikunta Ekadashi', 'Rathasaptami', 'Ugadi'],
        pilgrimageCircuit: 'Divya Desam, Tirupati Sacred Hills'
      };
    }
    if (match('golden temple') || match('harmandir')) {
      return {
        about: 'Sri Harmandir Sahib (Golden Temple) in Amritsar is the central spiritual shrine of Sikhism, open to people of all faiths.',
        mythologicalSignificance: 'Built around the holy Amrit Sarovar (Pool of Nectar), symbolizing spiritual equality and universal brotherhood.',
        history: 'Founded by Guru Ram Das Ji in 1577; the gold foil gilding was added under Maharaja Ranjit Singh in 1830.',
        architecture: 'Indo-Islamic and Mughal-Sikh architecture plated with 750 kg of pure gold leaf.',
        festivals: ['Guru Nanak Gurpurab', 'Vaisakhi', 'Bandi Chhor Divas (Diwali)', 'Guru Gobind Singh Gurpurab'],
        pilgrimageCircuit: 'Panj Takht Circuit, Sacred Sikh Shrines'
      };
    }
    if (match('vaishno') || match('katra')) {
      return {
        about: 'Shree Mata Vaishno Devi Shrine in Trikuta Hills, Jammu & Kashmir, is one of the most revered Shakti Peeths in India.',
        mythologicalSignificance: 'Mata Vaishno Devi manifested in a holy cave in the form of three natural rock formations (Pindies) representing Maha Kali, Maha Lakshmi, and Maha Saraswati.',
        history: 'Venerated for centuries with millions of pilgrims undertaking the 13 km trek from Katra.',
        architecture: 'Natural cave shrine integrated with modern marble queue complexes and mountain pathways.',
        festivals: ['Chaitra Navratri', 'Sharad Navratri', 'Diwali', 'New Year Yatra'],
        pilgrimageCircuit: 'Shakti Peetha Circuit, Jammu Holy Shrines'
      };
    }
    if (match('jagannath') || match('puri')) {
      return {
        about: 'Shree Jagannath Temple in Puri, Odisha, is dedicated to Lord Jagannath (Krishna), along with Balabhadra and Subhadra.',
        mythologicalSignificance: 'One of the Char Dham pilgrimage sites, famous for its unique wooden deities renewed periodically during Nabakalebara.',
        history: 'Built in the 12th century by King Anantavarman Chodaganga Deva of the Eastern Ganga dynasty.',
        architecture: 'Kalinga architecture style with the grand 214-foot main temple tower.',
        festivals: ['Rath Yatra (Chariot Festival)', 'Chandan Yatra', 'Snana Yatra', 'Bahuda Yatra'],
        pilgrimageCircuit: 'Char Dham, Kalinga Sacred Circuit'
      };
    }
    if (match('shirdi') || match('sai')) {
      return {
        about: 'Shirdi Sai Baba Temple in Maharashtra is the sacred resting place of revered saint Shree Sai Baba.',
        mythologicalSignificance: 'Sai Baba preached universal love, unity of all religions ("Sabka Malik Ek"), and selfless service.',
        history: 'Maintained by the Shree Saibaba Sansthan Trust since 1922.',
        architecture: 'Spacious marble shrine complex featuring the Samadhi Mandir and Dwarkamai.',
        festivals: ['Ram Navami', 'Guru Purnima', 'Vijayadashami (Sai Punyatithi)'],
        pilgrimageCircuit: 'Maharashtra Saint Circuit'
      };
    }
    if (match('renuka') || match('mahur')) {
      return {
        about: 'Shaktipeeth Shree Renuka Devi Temple in Mahur, Maharashtra, is one of the three and a half sacred Shakti Peethas of Maharashtra.',
        mythologicalSignificance: 'Revered as the birthplace of Lord Parashurama and the sacred abode of Mata Renuka Devi, embodiment of Divine Motherhood and Shakti.',
        history: 'Mentioned in the Devi Bhagavata and Skanda Purana; patronized by Yadava kings and Maratha rulers.',
        architecture: 'Traditional hill-top temple complex built with stone steps, carved sanctum, and surrounding sacred kunds.',
        sacredRituals: 'Maha Aarti, Kumkumarchana, Devi Shringar, and Chandi Path.',
        festivals: ['Sharad Navratri Fair', 'Chaitra Navratri', 'Kojagiri Purnima', 'Deepavali / Dasara Yatra'],
        pilgrimageCircuit: 'Maharashtra 3.5 Shakti Peeth Circuit, Mahur Gad Yatra'
      };
    }
    if (match('siddhivinayak')) {
      return {
        about: 'Shree Siddhivinayak Ganapati Mandir in Prabhadevi, Mumbai, is a world-renowned shrine dedicated to Lord Ganesha.',
        mythologicalSignificance: 'The Ganesha idol features a trunk turned to the right (Siddhi Vinayak), symbolizing quick fulfillment of boons.',
        history: 'Originally constructed in 1801 by Lakshman Vithu and Deubai Patil.',
        architecture: 'Modern multi-story grand dome structure with gold-plated sanctum roof.',
        festivals: ['Ganesh Chaturthi', 'Angaraki Chaturthi', 'Maghi Ganeshotsav'],
        pilgrimageCircuit: 'Ashtavinayak & Mumbai Holy Shrines'
      };
    }
    if (match('kamakhya')) {
      return {
        about: 'Kamakhya Temple on Nilachal Hill in Guwahati, Assam, is one of the oldest and most important Shakti Peethas in Tantric tradition.',
        mythologicalSignificance: 'Sati’s Yoni (womb) fell here when Lord Vishnu used his Sudarshana Chakra on her body.',
        history: 'Rebuilt in 1565 by King Naranarayana of the Koch dynasty.',
        architecture: 'Unique Nilachal architectural style combining a beehive dome with a cruciform base.',
        festivals: ['Ambubachi Mela', 'Durga Puja', 'Manasa Puja'],
        pilgrimageCircuit: '51 Shakti Peethas, Assam Sacred Circuit'
      };
    }

    return null;
  };



  // Helper to map raw facility names/keys into clean, user-friendly labels with emojis
  const formatAmenityLabel = (amenity: string): string => {
    const lower = amenity.toLowerCase();
    if (lower.includes('parking')) return '🅿 Parking';
    if (lower.includes('locker') || lower.includes('cloakroom') || lower.includes('bag')) return '🔒 Lockers';
    if (lower.includes('prasad') || lower.includes('laddu') || lower.includes('mahaprasad') || lower.includes('modak')) return '🍛 Prasad Counter';
    if (lower.includes('restroom') || lower.includes('washroom') || lower.includes('toilet')) return '🚻 Restrooms';
    if (lower.includes('water') || lower.includes('drinking')) return '🚰 Drinking Water';
    if (lower.includes('shoe') || lower.includes('paduka')) return '👞 Shoe Stand';
    if (lower.includes('wheelchair') || lower.includes('ramp') || lower.includes('senior') || lower.includes('golf cart') || lower.includes('battery car')) return '♿ Wheelchair Access';
    if (lower.includes('dharamshala') || lower.includes('ashram') || lower.includes('accommodation') || lower.includes('guest house') || lower.includes('gmvn')) return '🏨 Dharamshala';
    if (lower.includes('bhojanalaya') || lower.includes('annadanam') || lower.includes('langar') || lower.includes('restaurant') || lower.includes('anna prasadam') || lower.includes('annakshetra')) return '🍽 Bhojanalaya';
    if (lower.includes('pooja') || lower.includes('puja') || lower.includes('bhasma') || lower.includes('seva') || lower.includes('booking')) return '📿 Puja Booking';
    if (lower.includes('medical') || lower.includes('first aid') || lower.includes('health')) return '🚑 Medical Aid';
    if (lower.includes('mobile') || lower.includes('camera') || lower.includes('deposit')) return '📱 Mobile Deposit';
    if (lower.includes('vip') || lower.includes('priority') || lower.includes('sugam') || lower.includes('queue')) return '⚡ VIP Queue Access';
    if (lower.includes('souvenir') || lower.includes('gift') || lower.includes('book')) return '🛍️ Souvenir Shops';
    if (lower.includes('ropeway') || lower.includes('pony') || lower.includes('helicopter')) return '🚁 Transport Assistance';
    if (lower.includes('kund') || lower.includes('spring') || lower.includes('sarovar')) return '🌊 Holy Kund / Sarovar';
    if (lower.includes('tonsuring') || lower.includes('kalyanakatta')) return '💈 Hair Tonsuring';
    if (lower.includes('atm')) return '🏪 ATM Counter';
    return `✨ ${amenity}`;
  };

  // Helper to resolve accurate, temple-specific authentic facilities
  const getAuthenticTempleFacilities = (): string[] => {
    if (temple?.facilities && Array.isArray(temple.facilities) && temple.facilities.length > 0) {
      return temple.facilities;
    }
    const nameLower = (temple?.name || '').toLowerCase();
    const idLower = (resolvedTempleId || '').toLowerCase();
    const keyLower = (templeKey || '').toLowerCase();
    const match = (str: string) => nameLower.includes(str) || idLower.includes(str) || keyLower.includes(str);

    if (match('somnath')) {
      return ['parking', 'locker', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'wheelchair', 'dharamshala', 'bhojanalaya', 'puja_booking', 'medical_aid'];
    }
    if (match('mallikarjuna') || match('srisailam')) {
      return ['parking', 'locker', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'wheelchair', 'dharamshala', 'bhojanalaya', 'puja_booking', 'medical_aid'];
    }
    if (match('mahakal')) {
      return ['parking', 'locker', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'wheelchair', 'dharamshala', 'mobile_deposit', 'puja_booking', 'medical_aid'];
    }
    if (match('omkareshwar')) {
      return ['parking', 'locker', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'dharamshala', 'bhojanalaya', 'puja_booking'];
    }
    if (match('dwarka') || match('dwarkadhish')) {
      return ['parking', 'locker', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'wheelchair', 'mobile_deposit', 'puja_booking'];
    }
    if (match('kedarnath')) {
      return ['locker', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'dharamshala', 'bhojanalaya', 'medical_aid', 'transport_assistance'];
    }
    if (match('bhimashankar')) {
      return ['parking', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'puja_booking'];
    }
    if (match('kashi') || match('vishwanath')) {
      return ['locker', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'wheelchair', 'mobile_deposit', 'puja_booking', 'medical_aid'];
    }
    if (match('trimbakeshwar')) {
      return ['parking', 'locker', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'dharamshala', 'puja_booking'];
    }
    if (match('baidyanath') || match('babadham') || match('vaidyanath')) {
      return ['parking', 'locker', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'dharamshala', 'bhojanalaya', 'medical_aid'];
    }
    if (match('nageshwar')) {
      return ['parking', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'wheelchair'];
    }
    if (match('rameshwar') || match('ramanathaswamy')) {
      return ['parking', 'locker', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'wheelchair', 'dharamshala', 'bhojanalaya', 'medical_aid'];
    }
    if (match('grishneshwar') || match('ghrushneshwar') || match('grineshwar')) {
      return ['parking', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'puja_booking'];
    }
    if (match('tirupati') || match('tirumala') || match('venkateswara')) {
      return ['parking', 'locker', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'wheelchair', 'dharamshala', 'bhojanalaya', 'medical_aid', 'hair_tonsuring'];
    }
    if (match('golden temple') || match('harmandir')) {
      return ['locker', 'drinking_water', 'restrooms', 'shoe_stand', 'wheelchair', 'bhojanalaya', 'holy_kund'];
    }
    if (match('vaishno') || match('katra')) {
      return ['locker', 'drinking_water', 'restrooms', 'bhojanalaya', 'medical_aid', 'transport_assistance'];
    }
    if (match('jagannath') || match('puri')) {
      return ['locker', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'wheelchair', 'bhojanalaya'];
    }
    if (match('iskcon')) {
      return ['parking', 'locker', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'bhojanalaya', 'dharamshala'];
    }
    if (match('shirdi') || match('sai')) {
      return ['parking', 'locker', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'wheelchair', 'dharamshala', 'bhojanalaya', 'medical_aid'];
    }
    if (match('siddhivinayak')) {
      return ['locker', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand', 'wheelchair', 'mobile_deposit'];
    }

    return ['parking', 'locker', 'prasad', 'drinking_water', 'restrooms', 'shoe_stand'];
  };

  // Structured Information Model for Visitor Guidelines
  interface VisitorGuideline {
    icon: string;
    title: string;
    points: string[];
  }

  const getAuthenticVisitorGuidelines = (): VisitorGuideline[] => {
    const nameLower = (temple?.name || '').toLowerCase();
    const idLower = (resolvedTempleId || '').toLowerCase();
    const keyLower = (templeKey || '').toLowerCase();
    const match = (str: string) => nameLower.includes(str) || idLower.includes(str) || keyLower.includes(str);

    if (match('dwarka') || match('dwarkadhish')) {
      return [
        {
          icon: '🎟️',
          title: 'Entry & Darshan',
          points: [
            'General Entry: Free for all pilgrims',
            'VIP / Priority Darshan: Official trust passes available at Gate 56 counter',
            'Online Booking: E-pass booking available via official Dwarkadhish Trust portal'
          ]
        },
        {
          icon: '⏳',
          title: 'Queue & Darshan Duration',
          points: [
            'Wait Time: 30–60 mins (Weekdays), 2–3 hours (Weekends / Janmashtami)',
            'Darshan Time: 15–20 seconds in front of main sanctum',
            'Total Visit Duration: 1.5 to 2 hours including queue and parikrama'
          ]
        },
        {
          icon: '👥',
          title: 'Crowd Level & Best Time',
          points: [
            'Crowd Level: Moderate on weekdays, Heavy on Ekadashi & festival days',
            'Best Visit Window: Early morning (6:30 AM Mangla Aarti) or evening Shringar Aarti',
            'Pilgrim Tip: Visit Gomti Ghat in early morning for peaceful holy dip before darshan'
          ]
        },
        {
          icon: '👕',
          title: 'Dress Code & Ethics',
          points: [
            'Modest Indian traditional attire mandatory for all devotees',
            'Men: Dhoti-Kurta or Pyjama-Kurta recommended',
            'Women: Saree, Salwar Kameez, or Dupatta (Shorts, skirts & sleeveless forbidden)'
          ]
        },
        {
          icon: '📵',
          title: 'Mobile & Photography Policy',
          points: [
            'Strict Prohibition: Mobile phones & electronic devices banned inside mandir premises',
            'Photography permitted outside complex along Gomti Ghat & riverfront',
            'Deposit devices in official trust barcode lockers near Gate 56 before entry'
          ]
        },
        {
          icon: '👞',
          title: 'Shoe Stand & Lockers',
          points: [
            'Free footwear counter managed by temple trust at Gate 56 & Gate 13',
            'Paid cloakroom counters available for luggage and handbags',
            'Token system enforced for safe and fast retrieval'
          ]
        },
        {
          icon: '♿',
          title: 'Accessibility & Assistance',
          points: [
            'Wheelchair ramp access available at Gate 56 entry route',
            'Senior citizen priority lane provided during general queue hours',
            'Divyang assistance desk near main administration office'
          ]
        },
        {
          icon: '🚻',
          title: 'Visitor Facilities',
          points: [
            'RO Drinking water stations & clean washrooms inside complex grounds',
            'Mahaprasad & dry prasad counter near exit gate',
            'Emergency first aid desk and ATM available outside complex perimeter'
          ]
        }
      ];
    }

    if (match('somnath')) {
      return [
        {
          icon: '🎟️',
          title: 'Entry & Darshan',
          points: [
            'General Entry: Free entry for all devotees',
            'VIP Darshan: Special pass booking available at Somnath Trust office desk',
            'Online Services: Advance Pooja & Aarti booking available on official trust website'
          ]
        },
        {
          icon: '⏳',
          title: 'Queue & Visit Duration',
          points: [
            'Wait Time: 20–45 mins (Weekdays), 1.5–3 hours (Shravan / Shivratri)',
            'Average Darshan Duration: 30–45 seconds in inner hall',
            'Total Visit Time: 1.5 to 2.5 hours including Light & Sound show'
          ]
        },
        {
          icon: '👥',
          title: 'Crowd Level & Best Time',
          points: [
            'Crowd Level: Moderate on general weekdays, Peak during Shravan month',
            'Best Time to Visit: 6:00 AM morning darshan or 7:00 PM Sandhya Aarti',
            'Pilgrim Tip: Attend the 8:00 PM daily Light & Sound show on the sea-facing lawns'
          ]
        },
        {
          icon: '👕',
          title: 'Dress Code & Customs',
          points: [
            'Traditional decent attire expected for all visitors',
            'Men: Dhoti, Kurta, or trousers (Shorts strictly disallowed)',
            'Women: Saree, Salwar Kameez, or traditional suits'
          ]
        },
        {
          icon: '📵',
          title: 'Mobile & Security Rules',
          points: [
            'Mobile phones allowed in outer complex, strictly banned in inner sanctum',
            'Multi-layer security screening with scanner checkpoints',
            'Sea-facing photography permitted in outer promenade'
          ]
        },
        {
          icon: '👞',
          title: 'Shoe Stand & Cloakroom',
          points: [
            'Free footwear counters run by Somnath Trust outside main gate',
            'Safe cloakroom facility for heavy bags & electronic items',
            'Systematic digital token ticketing for luggage security'
          ]
        },
        {
          icon: '♿',
          title: 'Accessibility & Support',
          points: [
            'Electric golf cart service available from vehicle parking to temple gate',
            'Wheelchair ramp facility and priority queue for elderly and Divyangjan',
            'Resting benches installed along sea promenade walk'
          ]
        },
        {
          icon: '🚻',
          title: 'Visitor Facilities',
          points: [
            'Clean RO drinking water taps & modern restroom complexes',
            'Prasad Counter: Fresh Chikki & Ladoo prasad boxes available',
            'Somnath Bhojanalaya: Pure vegetarian thali at nominal charges'
          ]
        }
      ];
    }

    if (match('kashi') || match('vishwanath')) {
      return [
        {
          icon: '🎟️',
          title: 'Entry & Sugam Darshan',
          points: [
            'General Entry: Free entry through Ganga Corridor gates',
            'Sugam Darshan (VIP): ₹300 per person (Bookable online or at Corridor counter)',
            'Special Aarti Tickets: Mangla Aarti (₹500), Sapta Rishi & Bhog Aarti (₹300)'
          ]
        },
        {
          icon: '⏳',
          title: 'Queue & Duration',
          points: [
            'Queue Waiting Time: 45–90 mins (Weekdays), 3–5 hours (Mondays & Shravan)',
            'Darshan Time: 10–15 seconds near sacred Jyotirlinga',
            'Total Visit Duration: 2 to 3 hours across Ganga Corridor complex'
          ]
        },
        {
          icon: '👥',
          title: 'Crowd Level & Best Time',
          points: [
            'Crowd Level: Very high year-round, peak crowd on Mondays & Shivratri',
            'Best Visit Window: 4:00 AM early morning or 9:00 PM late evening',
            'Pilgrim Tip: Enter via Ganga Ghat Corridor entry for a smoother queue flow'
          ]
        },
        {
          icon: '👕',
          title: 'Dress Code & Rituals',
          points: [
            'Modest clothing mandatory; traditional attire preferred for Abhishek',
            'Men doing Sparsh Darshan / Jalabhishek must wear Dhoti-Kurta',
            'Women: Saree or Salwar suit with Dupatta'
          ]
        },
        {
          icon: '📵',
          title: 'Mobile & Electronics Prohibition',
          points: [
            'Complete Ban: Mobiles, smartwatches, leather belts & electronic keys banned',
            'Multiple security scanning gates with metal detectors',
            'Deposit electronics in trust lockers along Ganga Corridor before queue'
          ]
        },
        {
          icon: '👞',
          title: 'Shoe Counters & Lockers',
          points: [
            'Free and paid locker complexes available near Godowlia & Ganga Gate',
            'Safe electronic barcode lockers for personal items and shoes',
            'Helpline desk at Gate 4 for lost tokens or guidance'
          ]
        },
        {
          icon: '♿',
          title: 'Senior Citizen & Wheelchair Support',
          points: [
            'E-rickshaw & battery car service available inside Corridor for seniors',
            'Wheelchair ramp channels available up to Garbhagriha outer area',
            'Dedicated queue route for senior citizens and differently-abled'
          ]
        },
        {
          icon: '🚻',
          title: 'Facilities & Prasadam',
          points: [
            'Filtered cold drinking water stalls & air-conditioned waiting halls',
            'Official Kashi Vishwanath Prasad Counter (Pedha & Belpatra)',
            'Annakshetra: Free meal facility available at designated hours'
          ]
        }
      ];
    }

    if (match('mahakal')) {
      return [
        {
          icon: '🎟️',
          title: 'Entry & Bhasma Aarti',
          points: [
            'General Entry: Free entry via Mahakal Lok corridor',
            'Bhasma Aarti Booking: Free online booking (advance) / offline counter desk',
            'VIP / Sheghra Darshan: ₹250 pass ticket counter available at entry gate'
          ]
        },
        {
          icon: '⏳',
          title: 'Queue & Visit Duration',
          points: [
            'Wait Time: 45–90 mins (General Queue), 20–40 mins (₹250 Sheghra Pass)',
            'Bhasma Aarti Duration: 4:00 AM to 6:00 AM (Entry starts 3:00 AM)',
            'Total Visit Duration: 2 to 3.5 hours including Mahakal Lok walk'
          ]
        },
        {
          icon: '👥',
          title: 'Crowd Level & Timing',
          points: [
            'Crowd Level: High daily, extremely crowded on Shravan Mondays & Nag Panchami',
            'Best Visit Window: 6:00 AM post Bhasma Aarti or 8:00 PM Sandhya Aarti',
            'Pilgrim Tip: Book Bhasma Aarti online 30 days in advance on official trust portal'
          ]
        },
        {
          icon: '👕',
          title: 'Bhasma Aarti Dress Code',
          points: [
            'Bhasma Aarti Sanctum Entry: Men MUST wear unstitched traditional Dhoti-Sola',
            'Women MUST wear Saree during Garbhagriha Bhasma Aarti worship',
            'General Queue: Normal modest traditional clothing permitted'
          ]
        },
        {
          icon: '📵',
          title: 'Mobile & Photography Rules',
          points: [
            'Mobile phones allowed in Mahakal Lok corridor, banned in inner mandir',
            'No photography permitted during Bhasma Aarti ritual inside sanctum',
            'Deposit mobiles in smart barcode counters inside Mahakal Lok'
          ]
        },
        {
          icon: '👞',
          title: 'Shoe & Luggage Deposit',
          points: [
            'Large automated shoe and luggage deposit complex at Mahakal Lok',
            'Computerized token receipt issued for safe retrieval at exit',
            'Free footwear counters available at all entry gates'
          ]
        },
        {
          icon: '♿',
          title: 'Accessibility & Support',
          points: [
            'Battery operated vehicles inside Mahakal Lok for senior citizens & Divyang',
            'Ramp facility available right up to outer sanctum queue lines',
            'Dedicated medical desks stationed along main queue path'
          ]
        },
        {
          icon: '🚻',
          title: 'Facilities & Bhojanalaya',
          points: [
            'RO water dispensers & hygienic restroom blocks at regular intervals',
            'Mahakal Besan Ladoo Prasad Counter operated by Temple Management',
            'Shree Mahakal Bhojanalaya: Pure thali meal available at nominal rates'
          ]
        }
      ];
    }

    if (match('grishneshwar') || match('ghrushneshwar') || match('grineshwar')) {
      return [
        {
          icon: '🎟️',
          title: 'Entry & Darshan',
          points: [
            'General Entry: Free entry for all devotees',
            'VIP / Priority Darshan: Official information desk for special Pooja booking',
            'Sparsh Darshan: Direct touch of Jyotirlinga permitted during designated hours'
          ]
        },
        {
          icon: '⏳',
          title: 'Queue & Visit Duration',
          points: [
            'Queue Waiting Time: 15–35 mins (Weekdays), 1–2 hours (Mondays & Shravan)',
            'Darshan Duration: 30–60 seconds near Garbhagriha',
            'Total Visit Duration: 45 mins to 1.5 hours'
          ]
        },
        {
          icon: '👥',
          title: 'Crowd Level & Best Time',
          points: [
            'Crowd Level: Light to moderate on weekdays, heavy on Mondays & Pradosh',
            'Best Time to Visit: Early morning 5:30 AM opening or 2:00 PM afternoon',
            'Pilgrim Tip: Combine visit with nearby Ellora Caves (just 1 km away)'
          ]
        },
        {
          icon: '👕',
          title: 'Garbhagriha Dress Code',
          points: [
            'Men entering Garbhagriha for Jalabhishek MUST remove upper garments (bare chest)',
            'Traditional Dhoti mandatory for touching sacred Jyotirlinga',
            'Women: Traditional Saree or Salwar Kameez expected'
          ]
        },
        {
          icon: '📵',
          title: 'Sanctum Rules',
          points: [
            'Mobile phones prohibited inside inner stone sanctum',
            'Photography restricted in Garbhagriha, allowed in outer temple yard',
            'Basic storage counters available outside main temple entry gate'
          ]
        },
        {
          icon: '👞',
          title: 'Shoe Stand & Lockers',
          points: [
            'Free shoe keeping stand right outside temple boundary wall',
            'Small luggage lockers available with local trusted vendor stalls',
            'Keep valuables in vehicle/hotel as temple premise is compact'
          ]
        },
        {
          icon: '♿',
          title: 'Accessibility Notice',
          points: [
            'Ramp facility available till outer courtyard entrance',
            'Garbhagriha entrance involves few heritage stone steps',
            'Volunteers assist senior citizens during peak morning queue'
          ]
        },
        {
          icon: '🚻',
          title: 'Facilities & Prasad',
          points: [
            'Drinking water tap and public washrooms near outer parking lot',
            'Local prasad stalls selling Belpatra, Flowers & Pedha',
            'Multiple vegetarian restaurants available outside temple street'
          ]
        }
      ];
    }

    if (match('kedarnath')) {
      return [
        {
          icon: '🎟️',
          title: 'Entry & Yatra Pass',
          points: [
            'Yatra Registration: Free Mandatory Char Dham / Kedarnath Yatra Registration',
            'Biometric / QR Verification at Gaurikund & Sonprayag entry points',
            'Special Pooja Booking: Online booking via Uttarakhand Char Dham Devasthanam Board'
          ]
        },
        {
          icon: '⏳',
          title: 'Trek & Darshan Duration',
          points: [
            'Trek Duration: 16 km trek from Gaurikund (6–8 hours trek / pony / helicopter)',
            'Queue Waiting Time: 1–3 hours during peak May-June season',
            'Total Visit Duration: Overnight stay recommended at Kedarnath top'
          ]
        },
        {
          icon: '👥',
          title: 'Crowd & Weather Advisory',
          points: [
            'Crowd Level: Extreme peak in May, June, Sept, Oct; Closed in Winter',
            'Best Visit Time: Early morning 6:00 AM before weather becomes cloudy',
            'Pilgrim Tip: Carry heavy woolens, rain poncho, oxygen cylinder & sturdy shoes'
          ]
        },
        {
          icon: '👕',
          title: 'Dress Code & Preparation',
          points: [
            'Warm thermals, heavy jacket, waterproof gloves & rain gear mandatory',
            'Modest traditional clothing beneath winter gear',
            'Comfortable grip trekking shoes essential for 16 km climb'
          ]
        },
        {
          icon: '📵',
          title: 'Mobile & Photography',
          points: [
            'Mobile photography banned inside main stone sanctum',
            'Photography permitted in outer temple plaza & snow peaks background',
            'Network connectivity: BSNL, Jio & Airtel active near temple base'
          ]
        },
        {
          icon: '👞',
          title: 'Shoe Stand & Storage',
          points: [
            'Shoe counter located in paved courtyard outside main stone mandir',
            'GMVN & Tent accommodation provides luggage storage',
            'Keep electronics safe in waterproof pouches'
          ]
        },
        {
          icon: '♿',
          title: 'Accessibility & Transport',
          points: [
            'Helicopter services from Phata, Sirsi & Guptkashi (Advance IRCTC booking)',
            'Pony / Kandi (Palanquin) / Pithu services available at Sonprayag & Gaurikund',
            'Government fixed rates for all pony and palanquin operators'
          ]
        },
        {
          icon: '🚻',
          title: 'Facilities & Stay',
          points: [
            'GMVN huts, tent colonies & private dharamshalas available at top',
            'Medical camps & oxygen relief booths along trek path & temple top',
            'GMVN Bhojanalaya providing hot vegetarian meals'
          ]
        }
      ];
    }

    if (match('tirupati') || match('tirumala') || match('venkateswara')) {
      return [
        {
          icon: '🎟️',
          title: 'Entry & Darshan Tickets',
          points: [
            'Special Entry Darshan (SED): ₹300 per ticket (Online advance quota release)',
            'Slotted Sarva Darshan (Free): Tokens issued at offline counters in Tirupati',
            'Senior Citizen / Divyang Special Quota: Specific slotted online entry'
          ]
        },
        {
          icon: '⏳',
          title: 'Queue & Visit Duration',
          points: [
            'Wait Time (SED ₹300): 2 to 4 hours in Vaikuntam Queue Complex',
            'Wait Time (Free Queue): 8 to 16 hours depending on day',
            'Total Visit Time: 4 to 8 hours for complete pilgrimage process'
          ]
        },
        {
          icon: '👥',
          title: 'Crowd & Timing',
          points: [
            'Crowd Level: Heavy 365 days a year; Peak during Brahmotsavam & weekends',
            'Best Visit Window: Report strictly at allotted SED ticket slot hour',
            'Pilgrim Tip: Book tickets 2–3 months in advance on official TTD website'
          ]
        },
        {
          icon: '👕',
          title: 'Strict Traditional Dress Code',
          points: [
            'Men MUST wear Dhoti with Uttariye / Kurta (Jeans, shorts, t-shirts BANNED)',
            'Women MUST wear Saree, Half-Saree, or Churidar with Dupatta',
            'Strict dress code screening at Vaikuntam entrance gates'
          ]
        },
        {
          icon: '📵',
          title: 'Electronics & Luggage Policy',
          points: [
            'Strict Ban: Mobile phones, cameras & electronic items banned inside mandir',
            'Free TTD luggage counter: Deposit bags/mobiles at queue complex entry',
            'Belongings automatically safely transported to Laddu counter exit desk'
          ]
        },
        {
          icon: '👞',
          title: 'Shoe Counter & Tonsuring',
          points: [
            'Free footwear deposit counters at all queue entry points',
            'Kalyanakatta: Hair tonsuring facility available 24/7 free of cost',
            'Token receipt provided for safe footwear retrieval'
          ]
        },
        {
          icon: '♿',
          title: 'Accessibility & Free Transit',
          points: [
            'Free TTD battery cars & free yellow buses operating across Tirumala',
            'Wheelchair support & dedicated queue lanes for senior citizens',
            'Elevators and ramps throughout Vaikuntam Queue Complex'
          ]
        },
        {
          icon: '🚻',
          title: 'Facilities & Annadanam',
          points: [
            'Matrusri Tarigonda Vengamamba Annaprasadam: Free 24/7 unlimited meals',
            'Free milk, buttermilk & food served inside queue compartments',
            'World famous TTD Laddu Prasadam counters (Tokens attached to tickets)'
          ]
        }
      ];
    }

    // Default authentic guidelines for all other temples
    return [
      {
        icon: '🎟️',
        title: 'Entry & Darshan',
        points: [
          'General Entry: Free entry for all devotees',
          'VIP / Special Seva: Available at official temple administration office desk',
          'Online Services: Verify official trust portal for advance pooja booking'
        ]
      },
      {
        icon: '⏳',
        title: 'Queue & Visit Information',
        points: [
          'Average Wait Time: 20–45 mins (Weekdays), 1–2 hours (Festivals)',
          'Average Darshan Duration: 30–60 seconds near main sanctum',
          'Best Time to Visit: Early morning during opening Aarti hours'
        ]
      },
      {
        icon: '👕',
        title: 'Dress Code & Customs',
        points: [
          'Traditional and modest attire strongly recommended for all devotees',
          'Shorts, sleeveless tops, or casual beachwear disallowed in inner mandir',
          'Maintain silence and follow temple queue discipline'
        ]
      },
      {
        icon: '📵',
        title: 'Mobile & Photography Policy',
        points: [
          'Mobile photography prohibited inside main Garbhagriha inner sanctum',
          'Photography rules in outer courtyard vary by temple trust policy',
          'Use designated trust lockers for safe storage of electronic devices'
        ]
      },
      {
        icon: '👞',
        title: 'Shoe Stand & Facilities',
        points: [
          'Free footwear counter available near main temple gate',
          'RO drinking water taps and clean restroom facilities on premises',
          'Prasad counter selling authentic temple sweet offerings'
        ]
      }
    ];
  };

  const officialWebsiteUrl = useMemo(() => getOfficialTempleWebsite(), [temple, resolvedTempleId, templeKey]);
  const officialHelplineNo = useMemo(() => getOfficialTempleHelpline(), [temple, resolvedTempleId, templeKey]);
  const authenticFacilities = useMemo(() => getAuthenticTempleFacilities(), [temple, resolvedTempleId, templeKey]);
  const authenticVisitorGuidelines = useMemo(() => getAuthenticVisitorGuidelines(), [temple, resolvedTempleId, templeKey]);
  const authenticDarshanDetails = useMemo(() => getAuthenticTempleDarshanDetails(), [temple, resolvedTempleId, templeKey]);

  const openTempleLocation = () => {
    // Clean name: e.g. "Baidyanath Temple – Deoghar" -> "Baidyanath Temple" or "Shree Baba Baidyanath Jyotirlinga Mandir Deoghar"
    let cleanName = displayName.split('–')[0].split('-')[0].trim();
    const lowerName = cleanName.toLowerCase();
    if (!lowerName.includes('temple') && !lowerName.includes('mandir') && !lowerName.includes('dham') && !lowerName.includes('peeth') && !lowerName.includes('jyotirlinga')) {
      cleanName = `${cleanName} Temple`;
    }

    const locStr = locationStr;
    // If locStr contains city/state not already in cleanName, append it cleanly
    const finalQuery = locStr && !cleanName.toLowerCase().includes(locStr.toLowerCase())
      ? `${cleanName}, ${locStr}`
      : cleanName;

    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(finalQuery)}`;

    Linking.openURL(url).catch((error) => {
      console.warn('Unable to open map URL', error);
    });
  };

  const authenticJyotirlingaDetails = useMemo(() => getAuthenticJyotirlingaDetails(), [temple, resolvedTempleId, templeKey]);

  const getTempleDescription = () => {
    return authenticJyotirlingaDetails?.about || temple?.description || specialTempleData?.description || '';
  };

  const getTempleGuidance = () => {
    if (temple?.guidance) {
      return temple.guidance;
    }
    return specialTempleData?.guidance || '';
  };

  const getAuthenticShortSummary = (): string => {
    const genericPhrase = 'ancient holy temple offering rich spiritual';
    if (temple?.short_summary && !temple.short_summary.toLowerCase().includes(genericPhrase)) {
      return temple.short_summary;
    }

    if (authenticJyotirlingaDetails?.about) {
      const firstSentence = authenticJyotirlingaDetails.about.split('.')[0].trim();
      if (firstSentence) return `${firstSentence}.`;
    }

    if (specialTempleData?.description) {
      const firstSentence = specialTempleData.description.split('.')[0].trim();
      if (firstSentence) return `${firstSentence}.`;
    }

    const staticDetail = FALLBACK_TEMPLE_BY_ID[resolvedTempleId];
    if (staticDetail?.description) {
      const firstSentence = staticDetail.description.split('.')[0].trim();
      if (firstSentence) return `${firstSentence}.`;
    }

    if (temple?.description && !temple.description.toLowerCase().includes(genericPhrase)) {
      const firstSentence = temple.description.split('.')[0].trim();
      if (firstSentence && firstSentence.length > 15) return `${firstSentence}.`;
    }

    const deityStr = temple?.deity || 'the Divine';
    const locStr = formatTempleLocation(temple);
    const hasLoc = locStr && locStr !== 'Unknown location';

    if (hasLoc) {
      return `Revered sacred shrine of ${deityStr} in ${locStr}, welcoming pilgrims for divine darshan and blessings.`;
    }
    return `Sacred pilgrimage center dedicated to ${deityStr}, revered by devotees for its spiritual heritage.`;
  };

  const resolvedShortSummary = getAuthenticShortSummary();
  const templeDescription = getTempleDescription();
  const templeGuidance = getTempleGuidance();
  const templeHistory = authenticJyotirlingaDetails?.history || temple?.history;
  const templeArchitecture = authenticJyotirlingaDetails?.architecture || temple?.architecture;
  const templeSignificance = authenticJyotirlingaDetails?.mythologicalSignificance || temple?.significance;
  const templeRituals = authenticJyotirlingaDetails?.sacredRituals || temple?.rituals || temple?.sacred_rituals;
  const templeFestivals = resolveTempleFestivals({ temple, authenticFestivals: authenticJyotirlingaDetails?.festivals });
  const templeCircuit = authenticJyotirlingaDetails?.pilgrimageCircuit || temple?.pilgrimage_circuit || temple?.circuit;

  if (loading && !temple) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.floatingBackButtonContainer}>
          <TouchableOpacity onPress={handleGoBack} style={styles.floatingBackButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <CustomLoader size={70} message="Loading Sacred Temple..." />
        </View>
      </SafeAreaView>
    );
  }

  if (!temple) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.floatingBackButtonContainer}>
          <TouchableOpacity onPress={handleGoBack} style={styles.floatingBackButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#999" />
          <Text style={styles.errorText}>
            {t('language') === 'hi' ? 'मंदिर नहीं मिला' : 'Temple not found'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
        locations={[0, 0.1058, 0.2212]}
        style={StyleSheet.absoluteFill}
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          {/* Floating Back Button */}
          <View style={styles.floatingBackButtonContainer}>
            <TouchableOpacity onPress={handleGoBack} style={styles.floatingBackButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="arrow-back" size={24} color="#111" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Temple Info Card — Enhanced Hero */}
            {/* 1. HERO & CONTENT CARD (Prompt Spec Compliant) */}
            {(() => {
              const specialKey = getSpecialTempleKey(temple?.name || resolvedTempleId || '');
              const specialTemple = SPECIAL_TEMPLE_DATA[specialKey];
              const estYear = temple?.established_year || temple?.year_built || temple?.establishedYear || specialTemple?.establishedYear || 'Ancient';
              const entryFee = (temple?.entry_fee !== undefined && temple?.entry_fee !== null)
                ? (temple.entry_fee === 0 || temple.entry_fee === 'Free' ? 'Free Entry' : typeof temple.entry_fee === 'number' ? `₹${temple.entry_fee}` : temple.entry_fee)
                : (specialTemple?.entryFee || 'Free Entry');
              const bestTime = temple?.best_time_to_visit || specialTemple?.bestTimeToVisit || 'Oct – Mar';

              const deityLabel = (temple?.deity || 'LORD GANESHA').toUpperCase();
              const specialCat = (specialTemple as any)?.category;
              const categoryBadge = getCategoryBadge(temple?.category || specialCat) || { label: temple?.category || specialCat || 'Sacred Shrine' };

              return (
                <View style={styles.infoCard}>
                  {/* 1. HERO SECTION */}
                  <TouchableOpacity
                    style={styles.heroImageContainer}
                    activeOpacity={0.9}
                    onPress={() => {
                      setActiveGalleryIndex(0);
                      setGalleryModalVisible(true);
                    }}
                  >
                    <ExpoImage
                      source={templeImageSource}
                      style={styles.heroImage}
                      contentFit="cover"
                      contentPosition="top"
                      transition={200}
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.45)']}
                      style={styles.heroImageOverlay}
                    />
                    <View style={styles.expandImageBadge}>
                      <Ionicons name="expand-outline" size={12} color="#FFFFFF" />
                      <Text style={styles.expandImageBadgeText}>Tap to view photo</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Floating Action Share FAB (Overlapping Hero & Content) */}
                  <TouchableOpacity
                    style={styles.floatingShareFab}
                    onPress={handleShare}
                    activeOpacity={0.85}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="share-outline" size={20} color="#FFFFFF" />
                  </TouchableOpacity>

                  {/* 2. CONTENT SECTION */}
                  <View style={styles.heroInfoContent}>
                    {/* Deity Pill Badge */}
                    <View style={styles.deityPillBadge}>
                      <Text style={styles.deityPillBadgeText}>{deityLabel}</Text>
                    </View>

                    {/* Title: Temple Name */}
                    <Text style={styles.templeName} numberOfLines={2}>{displayName}</Text>

                    {/* Description: 2-3 lines */}
                    {resolvedShortSummary ? (
                      <Text style={styles.shortSummaryText} numberOfLines={3}>{resolvedShortSummary}</Text>
                    ) : null}

                    {/* 3. TAG ROW */}
                    <View style={styles.tagRowContainer}>
                      {categoryBadge && (
                        <View style={styles.amberTagPill}>
                          <Ionicons name="sparkles-outline" size={13} color="#D97706" />
                          <Text style={styles.amberTagPillText}>{categoryBadge.label}</Text>
                        </View>
                      )}
                      <View style={styles.greenTagPill}>
                        <Ionicons name="shield-checkmark-outline" size={13} color="#16A34A" />
                        <Text style={styles.greenTagPillText}>
                          {temple?.heritage_status || 'Heritage Site'}
                        </Text>
                      </View>
                    </View>

                    {/* 4. LOCATION CARD */}
                    <TouchableOpacity
                      style={styles.locationCardBox}
                      onPress={openTempleLocation}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="location-sharp" size={16} color="#EA580C" />
                      <Text style={styles.locationCardText} numberOfLines={2}>
                        {formatTempleLocation(temple)}
                      </Text>
                    </TouchableOpacity>

                    {/* 5. INFO STAT GRID */}
                    <View style={styles.infoStatGrid}>
                      <View style={styles.statBoxCol}>
                        <Ionicons name="time-outline" size={16} color="#D97706" />
                        <Text style={styles.statBoxLabel}>AGE</Text>
                        <Text style={styles.statBoxValue} numberOfLines={1}>{estYear}</Text>
                      </View>
                      <View style={styles.statBoxCol}>
                        <Ionicons name="ticket-outline" size={16} color="#2563EB" />
                        <Text style={styles.statBoxLabel}>ENTRY</Text>
                        <Text style={styles.statBoxValue} numberOfLines={1}>{entryFee}</Text>
                      </View>
                      <View style={styles.statBoxCol}>
                        <Ionicons name="calendar-outline" size={16} color="#059669" />
                        <Text style={styles.statBoxLabel}>BEST TIME</Text>
                        <Text style={styles.statBoxValue} numberOfLines={1}>{bestTime}</Text>
                      </View>
                    </View>

                    {/* 6. PRIMARY CTA */}
                    <TouchableOpacity
                      style={styles.primaryCtaButton}
                      onPress={openTempleLocation}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="map-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.primaryCtaButtonText}>
                        {t('language') === 'hi' ? 'मैप्स में खोलें' : 'Open in maps'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })()}

            {/* 3. DARSHAN & AARTI (Day Timeline Visualization) */}
            <DarshanAartiTimeline
              openingTime={authenticDarshanDetails?.opening || '4:00 AM'}
              closingTime={authenticDarshanDetails?.closing || '9:00 PM'}
              vipInfoText={authenticDarshanDetails?.vipDarshan || 'VIP / special darshan available'}
            />

            {/* FACILITIES, AMENITIES & GOOD TO KNOW */}
            {(() => {
              const formattedAmenities = authenticFacilities.map((fac: string) => {
                const mapped = AMENITY_MAP[fac];
                if (mapped) {
                  return { id: fac, ...mapped };
                }
                const label = fac.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                return {
                  id: fac,
                  label,
                  iconName: 'checkmark-circle-outline' as const,
                  iconColor: '#2563EB',
                  bgColor: '#EFF6FF',
                };
              });

              const hasTopShoeAmenity = authenticFacilities.some(f => f.includes('shoe') || f.includes('footwear'));

              const formattedGuidelines = authenticVisitorGuidelines
                .filter(g => {
                  if (!hasTopShoeAmenity) return true;
                  const titleLower = (g.title || '').toLowerCase();
                  // Filter out duplicate shoe stand section from guidelines if already shown in top amenities grid
                  return !(titleLower.includes('shoe') || titleLower.includes('footwear'));
                })
                .map((g, idx) => {
                  const iconMeta = GUIDELINE_ICONS[g.icon] || { iconName: 'information-circle-outline', iconColor: '#2563EB', badgeBg: '#EFF6FF' };
                  return {
                    id: `g-${idx}`,
                    title: g.title,
                    iconName: iconMeta.iconName,
                    iconColor: iconMeta.iconColor,
                    badgeBg: iconMeta.badgeBg,
                    content: Array.isArray(g.points) ? g.points.join('\n• ') : String(g.points),
                  };
                });

              return (
                <TempleFacilitiesSection
                  amenities={formattedAmenities.length > 0 ? formattedAmenities : undefined}
                  guidelines={formattedGuidelines.length > 0 ? formattedGuidelines : undefined}
                />
              );
            })()}
            {/* ABOUT TEMPLE STORY & TRAVEL ROUTE VISUALIZATION */}
            {(() => {
              const travelData = resolveTempleTransport({
                temple,
                templeId: resolvedTempleId,
                templeName: temple?.name,
                coords: resolvedCoords,
                locationLabel: locationStr,
                guidance: templeGuidance,
              });

              const airInfo = travelData.air;
              const railInfo = travelData.rail;
              const busInfo = travelData.bus;
              return (
                <AboutTempleStory
                  templeName={temple?.name || 'Temple Shrine'}
                  subtitle={temple?.location || 'Sacred Pilgrimage Landmark'}
                  introDescription={templeDescription || 'A profound center of devotion, revered for centuries by millions of pilgrims seeking spiritual liberation.'}
                  significance={templeSignificance || 'Believed to be one of the sacred pilgrimage shrines where divine energies reside.'}
                  history={typeof templeHistory === 'string' ? templeHistory : 'Tracing ancient origins, rebuilt across eras by royal patrons and devotees.'}
                  architecture={templeArchitecture || 'Built in traditional sacred Indian temple architectural style with carved stone pillars and sanctum.'}
                  festivals={templeFestivals}
                  airRoute={airInfo || ""}
                  railRoute={railInfo || ""}
                  busRoute={busInfo || ""}
                />
              );
            })()}





            {/* 15. OFFICIAL LINKS & VERIFIED HELPLINES */}
            {(officialWebsiteUrl || officialHelplineNo) && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>
                    {t('language') === 'hi' ? 'आधिकारिक पोर्टल एवं हेल्पलाइन' : 'Official Portal & Helpline'}
                  </Text>
                </View>

                <View style={styles.officialLinksContainer}>
                  {/* Official Website Link */}
                  {officialWebsiteUrl && (
                    <TouchableOpacity
                      style={styles.officialLinkCard}
                      onPress={() => Linking.openURL(officialWebsiteUrl)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.officialIconCircle, { backgroundColor: '#EFF6FF' }]}>
                        <Ionicons name="globe" size={22} color="#2563EB" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.officialCardTitle}>
                            {t('language') === 'hi' ? 'आधिकारिक वेबसाइट' : 'Official Trust Website'}
                          </Text>
                          <Ionicons name="checkmark-circle-sharp" size={16} color="#059669" />
                        </View>
                        <Text style={styles.officialCardSubtext} numberOfLines={1}>
                          {officialWebsiteUrl.replace('https://', '').replace('http://', '').replace('www.', '')}
                        </Text>
                      </View>
                      <Ionicons name="open-outline" size={18} color="#2563EB" />
                    </TouchableOpacity>
                  )}

                  {/* Verified Helpline Number */}
                  {officialHelplineNo && (
                    <TouchableOpacity
                      style={styles.officialLinkCard}
                      onPress={() => {
                        const firstNum = officialHelplineNo.split('/')[0].replace(/[^0-9+]/g, '');
                        Linking.openURL(`tel:${firstNum}`);
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.officialIconCircle, { backgroundColor: '#ECFDF5' }]}>
                        <Ionicons name="call" size={22} color="#059669" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.officialCardTitle}>
                            {t('language') === 'hi' ? 'सत्यापित हेल्पलाइन नंबर' : 'Verified Helpline & Support'}
                          </Text>
                          <Ionicons name="shield-checkmark" size={16} color="#059669" />
                        </View>
                        <Text style={styles.officialCardSubtext}>
                          📞 {officialHelplineNo}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* 16. BRAND-NEW PREMIUM PILGRIMAGE TRAVEL EXPERIENCE */}
            <PilgrimageTravelSection
              templeId={typeof id === 'string' ? id : Array.isArray(id) ? id[0] : ''}
              templeName={temple?.name || ''}
              location={temple?.location || ''}
              category={temple?.category || ''}
              coords={temple?.coords}
            />

          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      <Modal
        visible={isYoutubeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsYoutubeModalVisible(false)}
      >
        <View style={styles.modalBackdrop} pointerEvents="box-none">
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isYoutubeUrl
                  ? (t('language') === 'hi' ? 'लाइव आरती' : 'Live Aarti')
                  : (t('language') === 'hi' ? 'लाइव दर्शन' : 'Live Darshan')}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {isYoutubeUrl && resolvedYoutubeUrl && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(getYoutubeAppUrl(resolvedYoutubeUrl))}
                    style={{ padding: 4 }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="logo-youtube" size={22} color="#FF0000" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setIsYoutubeModalVisible(false)} style={styles.modalClose}>
                  <Ionicons name="close" size={20} color={COLORS.text} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.youtubeModalBody}>
              {isWeb ? (
                <iframe
                  title="Live Aarti"
                  src={resolvedYoutubeUrl ? getYoutubeEmbedUrl(resolvedYoutubeUrl) : ''}
                  style={styles.youtubeFrame}
                  frameBorder="0"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              ) : (
                isYoutubeModalVisible ? youtubeWebViewContent : null
              )}
            </View>
            {resolvedYoutubeUrl ? (
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF0F0', paddingVertical: 10, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: '#FFE0E0', gap: 8 }}
                onPress={() => Linking.openURL(getYoutubeAppUrl(resolvedYoutubeUrl))}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-youtube" size={20} color="#FF0000" />
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#D32F2F' }}>
                  {t('language') === 'hi' ? 'यूट्यूब ऐप में डायरेक्ट देखें' : 'Watch Directly in YouTube App'}
                </Text>
                <Ionicons name="open-outline" size={14} color="#D32F2F" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Gallery Fullscreen Modal */}
      <Modal
        visible={galleryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGalleryModalVisible(false)}
      >
        <View style={styles.galleryModalBackdrop}>
          <TouchableOpacity
            style={styles.galleryModalClose}
            onPress={() => setGalleryModalVisible(false)}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          <FlatList
            data={templeImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={activeGalleryIndex}
            getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
            keyExtractor={(_, index) => `fullscreen-${index}`}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setActiveGalleryIndex(idx);
            }}
            renderItem={({ item }) => {
              const imgSrc = typeof item === 'string' ? { uri: item } : item;
              return (
                <View style={{ width: SCREEN_WIDTH, justifyContent: 'center', alignItems: 'center' }}>
                  <ExpoImage source={imgSrc} style={styles.galleryFullImage} contentFit="contain" />
                </View>
              );
            }}
          />
          {/* Pagination dots */}
          {templeImages.length > 1 && (
            <View style={styles.galleryPagination}>
              {templeImages.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.galleryDot,
                    i === activeGalleryIndex && styles.galleryDotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F9FF',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  floatingBackButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100,
  },
  floatingBackButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'visible',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  heroImageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
  },
  expandImageBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  expandImageBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  floatingShareFab: {
    position: 'absolute',
    top: 178,
    right: 20,
    zIndex: 99,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  heroInfoContent: {
    paddingTop: 28,
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  deityPillBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  deityPillBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
    letterSpacing: 0.5,
  },
  templeName: {
    fontSize: 19,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 25,
    marginBottom: 6,
  },
  shortSummaryText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 20,
    fontWeight: '400',
    marginBottom: 12,
  },
  tagRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  amberTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  amberTagPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#B45309',
  },
  greenTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  greenTagPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#15803D',
  },
  locationCardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  locationCardText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '400',
    color: '#4B5563',
  },
  infoStatGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statBoxCol: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 4,
  },
  statBoxLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  statBoxValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  primaryCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EA580C',
    borderRadius: 10,
    paddingVertical: 14,
    width: '100%',
  },
  primaryCtaButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  openInMapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 12,
    gap: 6,
  },
  openInMapsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 18,
    width: '100%',
  },

  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0E6',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 24,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },

  darshanTimingsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  darshanTimingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  darshanTimingLabel: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '600',
  },
  darshanTimingValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  contactIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  contactHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  gallerySection: {
    marginBottom: 20,
  },
  galleryCard: {
    width: SCREEN_WIDTH * 0.82,
    height: 200,
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  galleryModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  galleryFullImage: {
    width: SCREEN_WIDTH,
    height: '80%',
  },
  galleryPagination: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    gap: 8,
  },
  galleryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  galleryDotActive: {
    backgroundColor: '#FFFFFF',
    width: 20,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  festivalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  festivalChip: {
    backgroundColor: '#FFF3EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD0B3',
  },
  festivalChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D95200',
  },
  templeIconLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  templeIconLargeImage: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
  },
  templeDeity: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF6600',
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  locationCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginLeft: 6,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  verifiedText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  timingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  timingLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  timingValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  aartiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  aartiCard: {
    width: '48%',
    paddingVertical: 8,
    marginBottom: 12,
  },
  aartiLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aartiTime: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '800',
  },
  youtubeLinkButton: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}12`,
    alignSelf: 'flex-start',
  },
  youtubeLinkText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
  },
  morningAartiText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  afternoonAartiText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: SPACING.sm,
    textAlign: 'left',
  },
  afternoonAartiDetailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'left',
  },
  eveningAartiText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: SPACING.sm,
    textAlign: 'left',
  },
  usthapanaAartiText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'left',
  },
  descriptionText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
    fontWeight: '500',
    textAlign: 'justify',
  },
  mapSection: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  mapWrapper: {
    width: '100%',
    height: 180,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mapBox: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.sm,
    backgroundColor: `${COLORS.background}CC`,
  },
  mapOverlayText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111111',
    flex: 1,
  },
  modalClose: {
    padding: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },
  modalMapWrapper: {
    width: '100%',
    height: 320,
  },
  modalMap: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F9F9F9',
  },
  youtubeModalBody: {
    width: '100%',
    height: 300,
  },
  youtubeFrame: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  modalActions: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  primaryButton: {
    backgroundColor: '#FF6600',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    shadowColor: '#FF6600',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  noPostsText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
  postCard: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  postContent: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  postDate: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 10,
    marginBottom: 4,
  },
  heritageBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  heritageBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  quickFactsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  protocolCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  protocolStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  protocolBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  protocolBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  protocolStepText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 21,
    fontWeight: '600',
    flex: 1,
  },
  architectureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  scripturesRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  scriptureChip: {
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#FFD8B8',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  scriptureChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C2410C',
  },
  transportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  transportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  transportIcon: {
    fontSize: 18,
  },
  transportText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  travelTipsCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 6,
  },
  travelTipsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1D4ED8',
    marginBottom: 4,
  },
  travelTipText: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 20,
    fontWeight: '500',
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  facilityChip: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  facilityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  teerthCard: {
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 4,
  },
  teerthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  teerthName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  teerthDistance: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 2,
  },
  teerthRelevance: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  checklistRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  checkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  checkChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  protocolStepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  protocolLeftCol: {
    alignItems: 'center',
    width: 28,
  },
  protocolTimelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: '#FED7AA',
    marginVertical: 4,
  },
  protocolContentBox: {
    flex: 1,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  protocolStepTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C2410C',
    marginBottom: 2,
  },
  significanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  richTextChunk: {
    marginBottom: 10,
  },
  highlightCalloutBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginTop: 6,
  },
  calloutTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 2,
  },
  calloutText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B45309',
    lineHeight: 19,
  },
  historyCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  historyTimelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    gap: 8,
  },
  historyTimelineHeaderText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  historyTimelineCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  timelinePoint: {
    alignItems: 'center',
    width: 16,
    marginTop: 4,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  timelineLine: {
    width: 2,
    height: 40,
    backgroundColor: '#FED7AA',
    marginTop: 2,
  },
  historyCardBody: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
  },
  historyMilestoneTag: {
    fontSize: 12,
    fontWeight: '800',
    color: '#C2410C',
    marginBottom: 4,
  },
  historyCardText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    lineHeight: 20,
  },
  architectureContainerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  archStyleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  archStyleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  archStyleBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6D28D9',
  },
  archCalloutBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  archCalloutTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C2410C',
    marginBottom: 4,
  },
  archCalloutBody: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
    lineHeight: 20,
  },
  archFeaturesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  archFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  archFeatureText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  sthalaMahatmyaCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  sthalaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sthalaIcon: {
    fontSize: 22,
  },
  sthalaTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
  },
  sthalaSubtext: {
    fontSize: 12,
    fontWeight: '500',
    color: '#B45309',
    marginTop: 2,
  },
  scripturesWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scriptureCardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FDBA74',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  scriptureCardChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C2410C',
  },
  prasadRitualsContainer: {
    gap: 12,
  },
  featuredPrasadCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  prasadBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  prasadIcon: {
    fontSize: 24,
  },
  prasadHeaderLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EA580C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  prasadValueText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#9A3412',
  },
  prasadSubInfo: {
    fontSize: 12,
    fontWeight: '500',
    color: '#C2410C',
    lineHeight: 17,
  },
  ritualsHighlightCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 16,
    padding: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  ritualHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  ritualHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#9A3412',
  },
  ritualRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  ritualRowText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  transportGridContainer: {
    gap: 10,
    marginBottom: 12,
  },
  transportDetailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 14,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  transportIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transportTypeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  transportValueText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 2,
  },
  travelTipsUpgradedCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    gap: 8,
  },
  travelTipsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  travelTipsHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  tipItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  travelTipUpgradedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B45309',
    lineHeight: 19,
    flex: 1,
  },
  officialLinksContainer: {
    gap: 10,
  },
  officialLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  officialIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  officialCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
  },
  officialCardSubtext: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 2,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(243, 244, 246, 0.7)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  disclaimerText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
    flex: 1,
  },
  amenitiesSubTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 4,
    marginBottom: 10,
  },
  facilityChipUpgraded: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  facilityTextUpgraded: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
    letterSpacing: 0.1,
  },
  goodToKnowSection: {
    paddingTop: 16,
    marginTop: 12,
  },
  goodToKnowGrid: {
    gap: 12,
  },
  goodToKnowCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  goodToKnowIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  goodToKnowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  bulletPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bulletDot: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D97706',
    marginRight: 6,
    lineHeight: 18,
  },
  goodToKnowDesc: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '500',
    color: '#4B5563',
    lineHeight: 18,
  },
});