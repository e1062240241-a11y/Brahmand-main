import templeDataDump from '../../src/constants/templeDataDump.json';
import { resolveTempleTransport } from '../../src/data/templeTransportResolver';
import { resolveTempleFestivals } from '../../src/data/templeFestivalResolver';
import { SPECIAL_TEMPLE_DATA } from '../../src/data/templeStaticData';
import { FALLBACK_TEMPLE_BY_ID } from '../../src/data/templeFallbackData';
import { getYoutubeVideoId, getYoutubeAppUrl, getYoutubeEmbedUrl } from '../../src/utils/youtubeUtils';
import { AMENITY_MAP, GUIDELINE_ICONS } from '../../src/data/templeDisplayMaps';
import {
  resolveOfficialWebsiteRule,
  resolveOfficialHelplineRule,
  resolveDarshanDetailsRule,
  resolveAuthenticTempleDetailsRule,
  resolveFacilitiesRule,
  resolveVisitorGuidelinesRule,
  TempleMatchContext,
  VisitorGuideline,
} from '../../src/data/temples';
import { DEFAULT_VISITOR_GUIDELINES } from '../../src/data/temples/rules/defaultVisitorGuidelines';
import {
  getCategoryBadge,
  getSpecialTempleKey,
  formatTempleLocation,

} from '../../src/data/templeHelpers';
// accessibility: placeholder
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Linking, Platform, Modal, Animated, Dimensions, Share } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { getTemple } from '../../src/services/api';
import { database } from '../../src/database';
import { Q } from '@nozbe/watermelondb';
import { COLORS, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { resolveTempleImage } from '../../src/constants/templeImages';
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

  const templeKey = useMemo(() => getSpecialTempleKey(temple?.name || resolvedTempleId || ''), [temple?.name, resolvedTempleId]);
  const locationStr = useMemo(() => formatTempleLocation(temple), [temple]);
  const specialTempleData = SPECIAL_TEMPLE_DATA[templeKey] || null;
  const resolvedCoords = temple?.coords || specialTempleData?.coords || null;
  const resolvedYoutubeUrl = temple?.youtube_url || specialTempleData?.youtubeUrl || null;
  const isCurrentlyLive = Boolean(resolvedYoutubeUrl);

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

    try {
      // 1. Search the rich JSON dump by Name, Slug, or ID
      let localName = '';
      try {
        const localRecord = await database.get('temples').find(resolvedTempleId).catch(() => null);
        if (localRecord) localName = (localRecord as any)._raw.name || '';
      } catch (e) {}

      const dumpedTemple = (templeDataDump as any[]).find((t: any) =>
        (localName && t.name.toLowerCase() === localName.toLowerCase()) ||
        t.slug === resolvedTempleId ||
        t.id === resolvedTempleId
      );

      if (dumpedTemple) {
        finalTempleData = mapBackendResponseToFrontend(dumpedTemple);
      }

      // 2. Fallback to Firestore Backend / Static Data
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
  const templeContact = temple?.contact && typeof temple.contact === 'string' && temple.contact.trim() ? temple.contact.trim() : null;







  // Helper to resolve accurate, temple-specific authentic facilities
  const getAuthenticTempleFacilities = (): string[] => {
    if (temple?.facilities && Array.isArray(temple.facilities) && temple.facilities.length > 0) {
      return temple.facilities;
    }
    const nameLower = (temple?.name || '').toLowerCase();
    const idLower = (resolvedTempleId || '').toLowerCase();
    const keyLower = (templeKey || '').toLowerCase();
    const match = (str: string) => nameLower.includes(str) || idLower.includes(str) || keyLower.includes(str);
    return [];
  };






  const getAuthenticVisitorGuidelines = () => [];
  /*
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
  */

  // Rule Engine Context and Resolvers for Official Data, Darshan, Facilities, & Guidelines
  const matchCtx: TempleMatchContext = useMemo(() => ({
    temple,
    templeId: resolvedTempleId,
    templeKey,
    templeContact,
    specialTempleData,
    fallbackTemple: FALLBACK_TEMPLE_BY_ID[resolvedTempleId],
    locationStr,
  }), [temple, resolvedTempleId, templeKey, templeContact, specialTempleData, locationStr]);

  const officialWebsiteUrl = useMemo(() => {
    const rawWebsite = temple?.website || temple?.official_website || temple?.website_url;
    if (rawWebsite && typeof rawWebsite === 'string' && rawWebsite.trim() && !rawWebsite.includes('google.com/search')) {
      return rawWebsite.trim();
    }
    return resolveOfficialWebsiteRule(matchCtx)?.website || null;
  }, [temple, matchCtx]);

  const officialHelplineNo = useMemo(() => {
    const matched = resolveOfficialHelplineRule(matchCtx);
    if (matched) return matched.helpline;
    if (templeContact) return templeContact;
    return null;
  }, [matchCtx, templeContact]);

  const authenticFacilities = useMemo(() => {
    return resolveFacilitiesRule(matchCtx)?.facilities || [];
  }, [matchCtx]);

  const authenticVisitorGuidelines = useMemo(() => {
    const res = resolveVisitorGuidelinesRule(matchCtx);
    return (res && res.length > 0) ? res : DEFAULT_VISITOR_GUIDELINES;
  }, [matchCtx]);

  const authenticDarshanDetails = useMemo(() => {
    return resolveDarshanDetailsRule(matchCtx)?.darshan || null;
  }, [matchCtx]);

  const authenticJyotirlingaDetails = useMemo(() => {
    return resolveAuthenticTempleDetailsRule(matchCtx)?.details || null;
  }, [matchCtx]);

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
              aartis={(() => {
                const parseTimeString = (timeStr: string): { minutes: number; formatted: string } | null => {
                  if (!timeStr) return null;
                  const cleaned = timeStr.trim();
                  const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
                  if (!match) return null;
                  let hour = parseInt(match[1], 10);
                  const minute = parseInt(match[2], 10);
                  const period = match[3].toUpperCase();
                  if (period === 'PM' && hour !== 12) hour += 12;
                  if (period === 'AM' && hour === 12) hour = 0;
                  const minutes = hour * 60 + minute;
                  return { minutes, formatted: cleaned.toUpperCase() };
                };

                const openTimeObj = parseTimeString(authenticDarshanDetails?.opening || '4:00 AM') || { minutes: 240, formatted: '4:00 AM' };
                const closeTimeObj = parseTimeString(authenticDarshanDetails?.closing || '9:00 PM') || { minutes: 1260, formatted: '9:00 PM' };
                const startMins = openTimeObj.minutes;
                const endMins = closeTimeObj.minutes > startMins ? closeTimeObj.minutes : closeTimeObj.minutes + 1440;
                const totalSpan = Math.max(endMins - startMins, 60);

                const palette = ['#2563EB', '#D97706', '#7C3AED', '#059669', '#DC2626', '#0891B2'];
                const aartiSessions = authenticDarshanDetails?.aartis ? Object.entries(authenticDarshanDetails.aartis) : [];

                const formattedAartis = aartiSessions.map(([name, rawTime]: [string, any], idx: number) => {

                  // If rawTime is a range like "4:00 AM - 5:00 AM", take start time
                  const singleTime = rawTime.split('-')[0].trim();
                  const parsed = parseTimeString(singleTime);
                  let pos = 50;
                  if (parsed) {
                    let mins = parsed.minutes;
                    if (mins < startMins && mins + 1440 <= endMins) {
                      mins += 1440;
                    }
                    pos = Math.round(((mins - startMins) / totalSpan) * 100);
                  } else {
                    // Fallback distribution if parsing fails
                    pos = Math.round(((idx + 1) / (aartiSessions.length + 1)) * 100);
                  }

                  return {
                    id: `aarti-${idx}-${name}`,
                    name,
                    time: rawTime,
                    color: palette[idx % palette.length],
                    positionPercent: Math.min(Math.max(pos, 3), 94),
                  };
                });

                return formattedAartis.length > 0 ? formattedAartis : undefined;
              })()}
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
                .filter((g: any) => {
                  if (!hasTopShoeAmenity) return true;
                  const titleLower = (g.title || '').toLowerCase();
                  // Filter out duplicate shoe stand section from guidelines if already shown in top amenities grid
                  return !(titleLower.includes('shoe') || titleLower.includes('footwear'));
                })
                .map((g: any, idx: number) => {
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