import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
 View, 
 Text, 
 StyleSheet, 
 ScrollView, 
 TouchableOpacity, 
 RefreshControl,
 Image, 
 TextInput,
 Animated,
 Modal,
 Platform,
 Dimensions,
 ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FlashList } from '@shopify/flash-list';
import { getTemples } from '../../src/services/api';
import { database } from '../../src/database';
import { FONTS } from '../../src/constants/theme';
import { DEFAULT_TEMPLE_IMAGE, getTempleImageByName, getTempleImageById } from '../../src/constants/templeImages';
import { useTranslation } from '../../src/utils/i18n';
const SafeFlashList = FlashList as any;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FLASH_LIST_CONTENT_STYLE = { paddingBottom: 40 } as const;

const JYOTIRLING_TEMPLES = [
  { id: 'jyotirling-somnath-temple-gujarat', name: 'Somnath Temple', location: 'Gujarat', deity: 'Lord Shiva' },
  { id: 'jyotirling-kedarnath-temple-uttarakhand', name: 'Kedarnath Temple', location: 'Uttarakhand', deity: 'Lord Shiva' },
  { id: 'jyotirling-mahakaleshwar-temple-ujjain', name: 'Mahakaleshwar Temple', location: 'Ujjain, Madhya Pradesh', deity: 'Lord Shiva' },
  { id: 'jyotirling-kashi-vishwanath-temple-varanasi', name: 'Kashi Vishwanath Temple', location: 'Varanasi, Uttar Pradesh', deity: 'Lord Shiva' },
  { id: 'jyotirling-bhimashankar-temple-maharashtra', name: 'Bhimashankar Temple', location: 'Pune, Maharashtra', deity: 'Lord Shiva' },
  { id: 'jyotirling-ramanathaswamy-temple-rameswaram', name: 'Ramanathaswamy Temple', location: 'Tamil Nadu', deity: 'Lord Shiva' },
];

const BADA_CHAR_DHAM_IDS = [
  'chardham-badrinath-temple-uttarakhand',
  'chardham-dwarkadhish-temple-dwarka',
  'chardham-jagannath-temple-puri',
  'jyotirling-ramanathaswamy-temple-rameswaram',
];

const CHOTA_CHAR_DHAM_IDS = [
  'chardham-badrinath-temple-uttarakhand',
  'jyotirling-kedarnath-temple-uttarakhand',
  'chardham-gangotri-temple-uttarakhand',
  'chardham-yamunotri-temple-uttarakhand',
];

const HEALING_TEMPLE_IDS = [
  // 1-15: Mental & Emotional Wellbeing Shrines
  'healing-ramanasramam-tiruvannamalai',
  'healing-dhyanalinga-isha-coimbatore',
  'jyotirling-mahakaleshwar-temple-ujjain',
  'healing-virupaksha-temple-hampi',
  'healing-anandamayi-ma-ashram-haridwar',
  'sacred-golden-temple-amritsar',
  'hanuman-mehendipur-balaji-temple-dausa',
  'shaktipeeth-kamakhya-temple-guwahati',
  'healing-parmarth-niketan-rishikesh',
  'healing-sri-aurobindo-ashram-puducherry',
  'sacred-belur-math-ramakrishna-mission',
  'healing-sarnath-buddhist-monastery',
  'sacred-mahabodhi-temple-bodh-gaya',
  'devi-kollur-mookambika-temple',
  'devi-chottanikara-temple-kochi',

  // 16-34: Physical Health & Recovery Shrines
  'sacred-vaitheeswaran-koil-mayiladuthurai',
  'jyotirling-baidyanath-temple-deoghar',
  'healing-parli-vaijnath-temple',
  'healing-dhanvantari-temple-kerala',
  'sacred-suchindram-thanumalayan-temple',
  'healing-ghati-subramanya-temple',
  'panchbhoota-srikalahasteeswara-temple-srikalahasti',
  'sacred-kukke-subramanya-temple',
  'jyotirling-trimbakeshwar-temple-nashik',
  'jyotirling-omkareshwar-temple-madhya-pradesh',
  'jyotirling-ramanathaswamy-temple-rameswaram',
  'jyotirling-kashi-vishwanath-temple-varanasi',
  'jyotirling-somnath-temple-gujarat',
  'jyotirling-nageshwar-temple-dwarka',
  'jyotirling-grishneshwar-temple-ellora',
  'jyotirling-mallikarjuna-temple-srisailam',
  'jyotirling-kedarnath-temple-uttarakhand',
  'jyotirling-bhimashankar-temple-maharashtra',
  'healing-mangaladevi-temple-mangalore'
];

const renderSafeText = (val: any): string => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string' || typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    if (val.name) return String(val.name);
    if (val.name_hi) return String(val.name_hi);
    if (val.title) return String(val.title);
    if (val.label) return String(val.label);
    if (val.value) return String(val.value);
    return '';
  }
  return String(val);
};

const getTempleDisplayName = (item: any) => renderSafeText(item.name);

const getTempleLocation = (item: any) => {
  if (typeof item.location === 'string') return item.location;
  if (typeof item.location === 'object' && item.location !== null) {
    const { area, city, state } = item.location;
    const parts = [area, city, state]
      .filter(Boolean)
      .map(val => (typeof val === 'object' ? renderSafeText(val) : String(val)))
      .filter(Boolean);
    if (parts.length > 0) return parts.join(', ');
  }
  return renderSafeText(item.location) || 'Unknown Location';
};

const getTempleDeityLabel = (item: any) => renderSafeText(item.deity);

interface TempleCardProps {
  item: any;
  onPress: (item: any) => void;
  t: (key: string) => string;
}

const TempleCard = React.memo(({ item, onPress, t }: TempleCardProps) => {
  const displayName = getTempleDisplayName(item);
  const location = getTempleLocation(item);
  const deityLabel = getTempleDeityLabel(item);
  const rawCat = renderSafeText(item.category);
  const categoryLabel = t('language') === 'hi' && rawCat === 'Jyotirlinga' ? 'ज्योतिर्लिंग' : (rawCat || 'Sacred');

  const imageSource = useMemo(() => {
    return (
      getTempleImageById(item.id) || 
      getTempleImageByName(displayName) ||
      getTempleImageByName(item.name) || 
      (item.image_url && typeof item.image_url === 'string' && item.image_url.startsWith('http') ? { uri: item.image_url } : null) || 
      DEFAULT_TEMPLE_IMAGE
    );
  }, [item.id, item.name, displayName, item.image_url]);

  return (
    <TouchableOpacity 
      style={styles.templeItemCard}
      activeOpacity={0.7}
      onPress={() => onPress(item)}
    >
      <Image 
        source={imageSource} 
        style={styles.templeItemImage} 
        fadeDuration={0}
      />
      <View style={styles.templeItemInfo}>
        <Text style={styles.templeItemName}>{displayName}</Text>
        <View style={styles.templeItemLocRow}>
          <Ionicons name="location" size={14} color="#888" />
          <Text style={styles.templeItemLocText}>{location}</Text>
        </View>
        <Text style={styles.templeItemDeity}>
          {t('language') === 'hi' ? `${deityLabel} को समर्पित` : `Dedicated to ${deityLabel}`}
        </Text>
        <View style={styles.templeItemTag}>
          <Ionicons name="sparkles" size={12} color="#D35400" />
          <Text style={styles.templeItemTagText}>{categoryLabel}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#BBB" />
    </TouchableOpacity>
  );
});

interface FilterOptionProps {
  location: string;
  isSelected: boolean;
  onPress: (location: string) => void;
}

const FilterOption = React.memo(({ location, isSelected, onPress }: FilterOptionProps) => {
  return (
    <TouchableOpacity
      style={styles.filterOption}
      onPress={() => onPress(location)}
    >
      <View style={[styles.filterCheckbox, isSelected && styles.filterCheckboxActive]}>
        {isSelected && <Ionicons name="checkmark" size={16} color="#FF6600" />}
      </View>
      <Text style={[styles.filterOptionText, isSelected && styles.filterOptionTextActive]}>
        {location}
      </Text>
    </TouchableOpacity>
  );
});

export default function TempleScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedTempleSection, setSelectedTempleSection] = useState<'Jyotirling' | 'Others'>('Jyotirling');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [temples, setTemples] = useState<any[]>([]); // Synced temples for uniqueLocations
  const [displayTemples, setDisplayTemples] = useState<any[]>([]); // Paginated display items
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Jyotirlinga' | 'Shakti Peetha' | 'Char Dham' | 'Healing Temples' | 'Sacred'>('Char Dham');
  const [charDhamSubFilter, setCharDhamSubFilter] = useState<'all' | 'bada' | 'chota'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('[CATEGORY CHANGED]', selectedCategory, charDhamSubFilter);
  }, [selectedCategory, charDhamSubFilter]);

  const PAGE_SIZE = 20;

  const loadMoreTemples = useCallback(async (pageNum: number, isReset: boolean = false) => {
    try {
      setLoading(true);
      // Fetch records from database
      const allLocalTemples = await database.get('temples').query().fetch();
      
      const isJyotirlinga = (t: any) => {
        const category = (t.category || '').trim().toLowerCase();
        const categoryIds = Array.isArray(t.category_ids)
          ? t.category_ids.map((c: string) => String(c).toLowerCase())
          : [];
        return category === 'jyotirlinga' || categoryIds.includes('jyotirlinga');
      };

      const isShaktiPeetha = (t: any) => {
        const category = (t.category || '').trim().toLowerCase();
        const categoryIds = Array.isArray(t.category_ids)
          ? t.category_ids.map((c: string) => String(c).toLowerCase())
          : [];
        return category.includes('shakti') || categoryIds.some((c: string) => c.includes('shakti'));
      };

      const isBadaCharDham = (t: any) => {
        const tid = (t.templeId || t.temple_id || t.id || '').toLowerCase();
        return BADA_CHAR_DHAM_IDS.includes(tid);
      };

      const isChotaCharDham = (t: any) => {
        const tid = (t.templeId || t.temple_id || t.id || '').toLowerCase();
        return CHOTA_CHAR_DHAM_IDS.includes(tid);
      };

      const isCharDham = (t: any) => {
        return isBadaCharDham(t) || isChotaCharDham(t);
      };

      const isHealingTemple = (t: any) => {
        const tid = (t.templeId || t.temple_id || t.id || '').toLowerCase();
        return HEALING_TEMPLE_IDS.includes(tid);
      };

      const jyotisByJs = allLocalTemples.filter(isJyotirlinga);

      let filteredRecords = allLocalTemples;
      if (selectedCategory === 'Jyotirlinga') {
        filteredRecords = jyotisByJs;
      } else if (selectedCategory === 'Shakti Peetha') {
        const rawShaktiList = allLocalTemples.filter(isShaktiPeetha);
        // Sort: Temples with verified website or helpline come first
        filteredRecords = rawShaktiList.sort((a: any, b: any) => {
          const aId = (a.templeId || a.temple_id || a.id || '').toLowerCase();
          const aName = (a.name || '').toLowerCase();
          const bId = (b.templeId || b.temple_id || b.id || '').toLowerCase();
          const bName = (b.name || '').toLowerCase();

          const hasInfo = (id: string, name: string) => {
            return (
              name.includes('chintpurni') || name.includes('kanyakumari') || name.includes('srisailam') ||
              name.includes('kamakhya') || name.includes('naina') || name.includes('jwala') ||
              name.includes('tripura') || name.includes('biraja') || name.includes('hinglaj') ||
              name.includes('harsiddhi') || name.includes('sharda') || name.includes('amarnath') ||
              name.includes('kamakshi') || name.includes('maihar') || name.includes('taratarini') ||
              name.includes('vindhya') || name.includes('danteshwari') || name.includes('muktinath') ||
              name.includes('kailash') || name.includes('baidyanath') || name.includes('bhabanipur') ||
              name.includes('kiriteswari') || name.includes('manibandh') || name.includes('vishalakshi') ||
              name.includes('katyayani') || name.includes('bhadrakali') || name.includes('devi talab') ||
              name.includes('pashupati') || name.includes('sugandha') || name.includes('attahas') ||
              name.includes('kankalitala') || name.includes('nalateswari') || name.includes('janaki') ||
              name.includes('kolhapur') || id.includes('chintpurni') || id.includes('kamakhya')
            );
          };

          const aHas = hasInfo(aId, aName) ? 1 : 0;
          const bHas = hasInfo(bId, bName) ? 1 : 0;
          return bHas - aHas;
        });
      } else if (selectedCategory === 'Char Dham') {
        if (charDhamSubFilter === 'bada') {
          filteredRecords = allLocalTemples.filter(isBadaCharDham);
        } else if (charDhamSubFilter === 'chota') {
          filteredRecords = allLocalTemples.filter(isChotaCharDham);
        } else {
          filteredRecords = allLocalTemples.filter(isCharDham);
        }
      } else if (selectedCategory === 'Healing Temples') {
        filteredRecords = allLocalTemples.filter(isHealingTemple);
      } else if (selectedCategory === 'Sacred') {
        filteredRecords = allLocalTemples.filter((t: any) => !isJyotirlinga(t) && !isShaktiPeetha(t) && !isCharDham(t) && !isHealingTemple(t));
      }

      if (searchQuery.trim().length > 0) {
        const q = searchQuery.trim().toLowerCase();
        filteredRecords = filteredRecords.filter((t: any) => 
          (t.name || '').toLowerCase().includes(q)
        );
      }

      if (selectedLocations.size > 0) {
        filteredRecords = filteredRecords.filter((t: any) => 
          Array.from(selectedLocations).some(loc => (t.location || '').toLowerCase().includes(loc.toLowerCase()))
        );
      }

      const skipCount = (pageNum - 1) * PAGE_SIZE;
      const paginatedSlice = filteredRecords.slice(skipCount, skipCount + PAGE_SIZE);

      let formatted = paginatedSlice.map((t: any) => ({
        id: t.templeId || t.temple_id || t.id,
        name: t.name,
        location: t.location,
        deity: t.deity,
        category: t.category || 'Sacred',
        image_url: t.imageUrl || t.image_url || '',
        is_verified: t.isVerified ?? true,
      }));

      // Fallback if local DB returned 0 records total
      if (formatted.length === 0 && selectedCategory === 'Jyotirlinga') {
        formatted = JYOTIRLING_TEMPLES.map(j => ({
          id: j.id,
          name: j.name,
          location: j.location,
          deity: j.deity,
          category: 'Jyotirlinga',
          image_url: '',
          is_verified: true,
        }));
      }

      if (isReset) {
        setDisplayTemples(formatted);
      } else {
        setDisplayTemples(prev => [...prev, ...formatted]);
      }

      setHasMore(skipCount + PAGE_SIZE < filteredRecords.length);
      setPage(pageNum);
    } catch (err) {
      console.error('[TempleScreen] Error loading temples from DB:', err);
      const baseline = JYOTIRLING_TEMPLES.map(j => ({
        id: j.id,
        name: j.name,
        location: j.location,
        deity: j.deity,
        category: 'Jyotirlinga',
        image_url: '',
        is_verified: true,
      }));
      setDisplayTemples(selectedCategory === 'Jyotirlinga' ? baseline : []);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedLocations, temples]);

  // Fallback to API data if WatermelonDB hasn't populated displayTemples
  useEffect(() => {
    if (displayTemples.length === 0 && temples.length > 0) {
      const isJyotirlinga = (t: any) => {
        const category = (t.category || '').trim().toLowerCase();
        const categoryIds = Array.isArray(t.category_ids)
          ? t.category_ids.map((c: string) => String(c).toLowerCase())
          : [];
        return category === 'jyotirlinga' || categoryIds.includes('jyotirlinga');
      };

      const isShaktiPeetha = (t: any) => {
        const category = (t.category || '').trim().toLowerCase();
        const categoryIds = Array.isArray(t.category_ids)
          ? t.category_ids.map((c: string) => String(c).toLowerCase())
          : [];
        return category.includes('shakti') || categoryIds.some((c: string) => c.includes('shakti'));
      };

      const isBadaCharDham = (t: any) => {
        const tid = (t.id || t.temple_id || '').toLowerCase();
        return BADA_CHAR_DHAM_IDS.includes(tid);
      };

      const isChotaCharDham = (t: any) => {
        const tid = (t.id || t.temple_id || '').toLowerCase();
        return CHOTA_CHAR_DHAM_IDS.includes(tid);
      };

      const isCharDham = (t: any) => {
        return isBadaCharDham(t) || isChotaCharDham(t);
      };

      const isHealingTemple = (t: any) => {
        const tid = (t.templeId || t.temple_id || t.id || '').toLowerCase();
        if (HEALING_TEMPLE_IDS.includes(tid)) return true;

        const category = (t.category || '').trim().toLowerCase();
        const name = (t.name || '').trim().toLowerCase();
        const desc = (t.description || '').trim().toLowerCase();
        const categoryIds = Array.isArray(t.category_ids)
          ? t.category_ids.map((c: string) => String(c).toLowerCase())
          : [];
        return (
          category.includes('healing') ||
          categoryIds.some((c: string) => c.includes('healing')) ||
          name.includes('healing') ||
          name.includes('baidyanath') ||
          name.includes('baba dham') ||
          desc.includes('healer') ||
          desc.includes('healing')
        );
      };

      let filtered = [...temples];
      if (selectedCategory !== 'All') {
        if (selectedCategory === 'Jyotirlinga') {
          filtered = filtered.filter(isJyotirlinga);
        } else if (selectedCategory === 'Shakti Peetha') {
          filtered = filtered.filter(isShaktiPeetha);
        } else if (selectedCategory === 'Char Dham') {
          if (charDhamSubFilter === 'bada') {
            filtered = filtered.filter(isBadaCharDham);
          } else if (charDhamSubFilter === 'chota') {
            filtered = filtered.filter(isChotaCharDham);
          } else {
            filtered = filtered.filter(isCharDham);
          }
        } else if (selectedCategory === 'Healing Temples') {
          filtered = filtered.filter(isHealingTemple);
        } else {
          filtered = filtered.filter((t: any) => !isJyotirlinga(t) && !isShaktiPeetha(t) && !isCharDham(t) && !isHealingTemple(t));
        }
      }
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.trim().toLowerCase();
        filtered = filtered.filter((t: any) => 
          (t.name || '').toLowerCase().includes(q) ||
          (getTempleLocation(t) || '').toLowerCase().includes(q) ||
          (t.deity || '').toLowerCase().includes(q)
        );
      }
      setDisplayTemples(filtered.map((t: any) => ({
        id: t.temple_id || t.id,
        name: t.name,
        location: t.location,
        deity: t.deity,
        category: t.category,
        image_url: t.image_url,
        is_verified: t.is_verified,
      })));
    }
  }, [temples, displayTemples.length, selectedCategory, searchQuery]);

  // Reset pagination on filter or search parameters change
  useEffect(() => {
    loadMoreTemples(1, true);
  }, [searchQuery, selectedCategory, selectedLocations, loadMoreTemples]);

  const loadLocalTemples = useCallback(async () => {
    try {
      const localTemples = await database.get('temples').query().fetch();
      let formattedTemples: any[] = [];
      if (localTemples && localTemples.length > 0) {
        formattedTemples = localTemples.map((t: any) => ({
          id: t.templeId,
          name: t.name,
          location: t.location,
          deity: t.deity,
          category: t.category,
          image_url: t.imageUrl,
          is_verified: t.isVerified,
        }));
      }
      
      // Always merge baseline static JYOTIRLING_TEMPLES so category filter never shows empty list
      const existingIds = new Set(formattedTemples.map(t => t.id));
      const baselineTemples = JYOTIRLING_TEMPLES.map(j => ({
        id: j.id,
        name: j.name,
        location: j.location,
        deity: j.deity,
        category: 'Jyotirlinga',
        image_url: '',
        is_verified: true,
      }));
      
      for (const bt of baselineTemples) {
        if (!existingIds.has(bt.id)) {
          formattedTemples.push(bt);
        }
      }
      
      setTemples(formattedTemples);
    } catch (error) {
      console.error('Error loading local temples:', error);
      // Fallback baseline
      setTemples(JYOTIRLING_TEMPLES.map(j => ({
        id: j.id,
        name: j.name,
        location: j.location,
        deity: j.deity,
        category: 'Jyotirlinga',
      })));
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const response = await getTemples();
      if (response.data) {
        // Sync with WatermelonDB
        try {
          await database.write(async () => {
            const templeCollection = database.get('temples');
            const localTemples = await templeCollection.query().fetch();
            const localTemplesMap = new Map(localTemples.map((t: any) => [t.templeId, t]));

            const recordsToCreateOrUpdate = response.data.map((temple: any) => {
              const templeKey = String(temple.temple_id || temple.id);
              const existingRecord = localTemplesMap.get(templeKey) as any;
              if (existingRecord) {
                return existingRecord.prepareUpdate((record: any) => {
                  record.name = temple.name || '';
                  record.location = typeof temple.location === 'object' ? [temple.location.area, temple.location.city, temple.location.state].filter(Boolean).join(', ') : (temple.location || '');
                  record.deity = temple.deity || '';
                  record.category = temple.category || (temple.temple_id && temple.temple_id.startsWith('jyotirling-') ? 'Jyotirlinga' : 'Sacred');
                  record.imageUrl = temple.image_url || '';
                  record.isVerified = temple.is_verified || false;
                });
              } else {
                return templeCollection.prepareCreate((record: any) => {
                  record.templeId = templeKey;
                  record.name = temple.name || '';
                  record.location = typeof temple.location === 'object' ? [temple.location.area, temple.location.city, temple.location.state].filter(Boolean).join(', ') : (temple.location || '');
                  record.deity = temple.deity || '';
                  record.category = temple.category || (temple.temple_id && temple.temple_id.startsWith('jyotirling-') ? 'Jyotirlinga' : 'Sacred');
                  record.imageUrl = temple.image_url || '';
                  record.isVerified = temple.is_verified || false;
                });
              }
            });

            if (recordsToCreateOrUpdate.length > 0) {
              await database.batch(recordsToCreateOrUpdate);
            }
          });
        } catch (dbError) {
          console.error('Error syncing temples to WatermelonDB:', dbError);
        }

        // Release full raw API list from state to free RAM, keeping only light mapped list for filters
        const lightList = response.data.map((t: any) => ({
          id: t.temple_id || t.id,
          name: t.name,
          location: t.location,
          deity: t.deity,
          category: t.category,
        }));
        setTemples(lightList);
      }
    } catch (error) {
      console.error('Error fetching temples from API:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLocalTemples();
    fetchData();
  }, [loadLocalTemples, fetchData]);

  const openTempleDetails = useCallback((item: any) => {
    router.push(`/temple/${encodeURIComponent(String(item.id))}`);
  }, [router]);

  const uniqueLocations = useMemo(() => {
    return Array.from(new Set((temples || []).map(t => {
      const loc = getTempleLocation(t);
      return loc.split(',').pop()?.trim() || loc;
    }))).sort();
  }, [temples]);

  const toggleLocationFilter = useCallback((location: string) => {
    setSelectedLocations(prev => {
      const newLocs = new Set(prev);
      if (newLocs.has(location)) newLocs.delete(location);
      else newLocs.add(location);
      return newLocs;
    });
  }, []);

  const onPressAll = useCallback(() => {
    console.log('[CATEGORY TAB PRESSED] All');
    setSelectedCategory('All');
  }, []);
  const onPressJyotirlinga = useCallback(() => {
    console.log('[CATEGORY TAB PRESSED] Jyotirlinga');
    setSelectedCategory('Jyotirlinga');
  }, []);
  const onPressSacred = useCallback(() => {
    console.log('[CATEGORY TAB PRESSED] Sacred');
    setSelectedCategory('Sacred');
  }, []);

  const onPressCloseFilter = useCallback(() => setShowFilterModal(false), []);
  const onPressOpenFilter = useCallback(() => setShowFilterModal(true), []);
  const onPressGoBack = useCallback(() => router.back(), [router]);
  const onPressJaapTab = useCallback(() => router.push('/jaap' as any), [router]);

  const onEndReached = useCallback(() => {
    if (hasMore && !loading) {
      loadMoreTemples(page + 1, false);
    }
  }, [hasMore, loading, page, loadMoreTemples]);

  const onRefresh = useCallback(async () => {
    await fetchData();
    await loadMoreTemples(1, true);
  }, [fetchData, loadMoreTemples]);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <View style={{ paddingHorizontal: 20 }}>
      <TempleCard
        item={item}
        onPress={openTempleDetails}
        t={t}
      />
    </View>
  ), [openTempleDetails, t]);

  const keyExtractor = useCallback((item: any) => item.id, []);

  const ListHeader = useCallback(() => (
    <View>
      {/* Hero Section */}
      <View style={styles.heroRowLayout}>
        <View style={styles.heroLeftContent}>
          <TouchableOpacity style={styles.heroBackButton} onPress={onPressGoBack}>
            <Ionicons name="arrow-back" size={28} color="#2D1B13" />
          </TouchableOpacity>
          
          <Text style={styles.heroDiscoverText}>{t('language') === 'hi' ? 'खोजें' : 'Discover'}</Text>
          <Text style={styles.heroSacredText}>{t('language') === 'hi' ? 'पवित्र' : 'Sacred'}</Text>
          <Text style={styles.heroSacredText}>{t('language') === 'hi' ? 'मंदिर' : 'Temples'}</Text>
          
          <View style={styles.ornateDivider}>
            <LinearGradient
              colors={['rgba(255, 102, 0, 0)', 'rgba(255, 102, 0, 0.5)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ornateLineGradient}
            />
            <View style={styles.ornateDiamond}>
              <View style={styles.diamondInner} />
            </View>
            <LinearGradient
              colors={['rgba(255, 102, 0, 0.5)', 'rgba(255, 102, 0, 0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ornateLineGradient}
            />
          </View>

          <Text style={styles.heroSubtitleBlended}>
            {t('language') === 'hi' 
              ? 'दिव्य स्थानों की यात्रा करें, आशीर्वाद लें\nऔर आध्यात्मिकता से जुड़ें।' 
              : 'Explore divine places, seek blessings\nand connect with spirituality.'}
          </Text>
        </View>

        <View style={styles.heroRightImageContainer}>
          <Image 
            source={require('../../assets/images/image temple/SomnathTemple.webp')} 
            style={styles.heroSideImage} 
            resizeMode="cover"
          />
          <LinearGradient
            colors={['#FFFCEB', 'rgba(255, 252, 235, 0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.heroLeftMask}
          />
          <View style={styles.heroAncientOverlay} />
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBarWrapper}>
          <Ionicons name="search-outline" size={22} color="#111" style={{ marginRight: 12 }} />
          <TextInput 
            placeholder={t('language') === 'hi' ? 'मंदिर का नाम खोजें...' : 'Search temple name...'}
            style={styles.searchInputField}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#888"
          />
          <TouchableOpacity onPress={onPressOpenFilter}>
            <Ionicons name="options-outline" size={22} color="#FF6600" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryPillsRow} contentContainerStyle={{ paddingHorizontal: 20 }}>
        <TouchableOpacity 
          style={[styles.catPill, selectedCategory === 'All' && styles.catPillActive]}
          onPress={onPressAll}
        >
          <MaterialCommunityIcons name="home-variant" size={18} color={selectedCategory === 'All' ? "#FF6600" : "#555"} style={{ marginRight: 6 }} />
          <Text style={[styles.catPillText, selectedCategory === 'All' && styles.catPillTextActive]}>{t('language') === 'hi' ? 'सभी मंदिर' : 'All Temples'}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.catPill, selectedCategory === 'Jyotirlinga' && styles.catPillActive]}
          onPress={onPressJyotirlinga}
        >
          <Text style={{ fontSize: 18, marginRight: 6 }}>🔱</Text>
          <Text style={[styles.catPillText, selectedCategory === 'Jyotirlinga' && styles.catPillTextActive]}>{t('language') === 'hi' ? 'ज्योतिर्लिंग' : 'Jyotirlinga'}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.catPill, selectedCategory === 'Sacred' && styles.catPillActive]}
          onPress={onPressSacred}
        >
          <Ionicons name="sparkles-outline" size={16} color={selectedCategory === 'Sacred' ? "#FF6600" : "#555"} style={{ marginRight: 6 }} />
          <Text style={[styles.catPillText, selectedCategory === 'Sacred' && styles.catPillTextActive]}>{t('language') === 'hi' ? 'पवित्र' : 'Sacred'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  ), [searchQuery, selectedCategory, onPressAll, onPressJyotirlinga, onPressSacred, onPressOpenFilter, onPressGoBack, t]);

  const ListEmpty = useCallback(() => (
    <View style={{ alignItems: 'center', marginTop: 40 }}>
      {loading && displayTemples.length === 0 ? (
        <ActivityIndicator size="large" color="#FF6600" />
      ) : (
        <Text style={{ color: '#888', fontFamily: FONTS.medium }}>
          {t('language') === 'hi' ? 'आपकी खोज से मेल खाता कोई मंदिर नहीं मिला।' : 'No temples found matching your search.'}
        </Text>
      )}
    </View>
  ), [loading, displayTemples.length, t]);

  return (
    <LinearGradient
      colors={['#FF8D57', '#EA9B76', '#FFEEE5']}
      locations={[0, 0.0913, 0.25]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Tab Switcher */}
      <View style={styles.topTabsContainer}>
        <View style={styles.topTabsInner}>
          <TouchableOpacity 
            style={styles.topTabButton}
            onPress={onPressJaapTab}
          >
            <Text style={styles.topTabText}>{t('jaap')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.topTabButton, styles.topTabButtonActive]}
            activeOpacity={1}
          >
            <Text style={[styles.topTabText, styles.topTabTextActive]}>{t('temple')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <SafeFlashList
        data={displayTemples}
        renderItem={renderItem}
        estimatedItemSize={120}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        keyExtractor={keyExtractor}
        contentContainerStyle={FLASH_LIST_CONTENT_STYLE}
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={onPressCloseFilter}
      >
        <TouchableOpacity 
          style={styles.filterModalOverlay} 
          activeOpacity={1} 
          onPress={onPressCloseFilter}
        >
          <View style={styles.filterModalContent}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>{t('language') === 'hi' ? 'स्थान अनुसार फ़िल्टर करें' : 'Filter by Location'}</Text>
              <TouchableOpacity onPress={onPressCloseFilter}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.filterOptionsList}>
              {uniqueLocations.map((location) => (
                <FilterOption
                  key={location}
                  location={location}
                  isSelected={selectedLocations.has(location)}
                  onPress={toggleLocationFilter}
                />
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentScroll: { flex: 1 },
  topTabsContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 5 },
  topTabsInner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(243, 244, 246, 0.5)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.5)',
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  topTabButton: { 
    flex: 1, 
    height: 34, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  topTabButtonActive: { 
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 2, height: 0 },
    elevation: 5,
  },
  topTabText: { fontSize: 14, fontFamily: FONTS.bold, color: '#8E8E93' },
  topTabTextActive: { color: '#EA4C0F' },

  heroRowLayout: { flexDirection: 'row', width: '100%', marginBottom: 20, paddingBottom: 25 },
  heroLeftContent: { flex: 1, paddingLeft: 20, paddingTop: 15, justifyContent: 'center' },
  heroRightImageContainer: { width: '50%', height: 345, position: 'relative', overflow: 'hidden' },
  heroSideImage: { width: '100%', height: '100%', transform: [{ scale: 1.6 }] },
  heroLeftMask: { position: 'absolute', left: 0, top: 0, width: '75%', height: '100%', zIndex: 2 },
  heroAncientOverlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(184, 134, 11, 0.28)', zIndex: 1 },
  
  heroBackButton: { marginBottom: 15 },
  heroDiscoverText: { fontSize: 42, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontWeight: 'bold', color: '#2D1B13', letterSpacing: -0.5 },
  heroSacredText: { fontSize: 42, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontWeight: 'bold', color: '#FF6600', marginTop: -10, letterSpacing: -0.5 },
  
  ornateDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 15, width: '90%' },
  ornateLineGradient: { flex: 1, height: 1.5 },
  ornateDiamond: { width: 14, height: 14, backgroundColor: 'transparent', marginHorizontal: 6, justifyContent: 'center', alignItems: 'center' },
  diamondInner: { width: 7, height: 7, backgroundColor: '#FF6600', transform: [{ rotate: '45deg' }] },
  
  heroSubtitleBlended: { fontSize: 14, color: '#4E342E', fontFamily: FONTS.medium, lineHeight: 20, opacity: 0.9 },

  searchSection: { paddingHorizontal: 20, marginBottom: 20 },
  searchBarWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 30, paddingHorizontal: 20, paddingVertical: 14, elevation: 4, shadowOpacity: 0.1, shadowRadius: 10 },
  searchInputField: { flex: 1, fontSize: 14, color: '#333', fontFamily: FONTS.medium },

  categoryPillsRow: { marginBottom: 20, backgroundColor: 'transparent', paddingVertical: 10 },
  catPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, marginRight: 12 },
  catPillActive: { backgroundColor: '#FFF5EB' },
  catPillText: { fontSize: 14, fontFamily: FONTS.bold, color: '#555' },
  catPillTextActive: { color: '#FF6600' },

  templeListContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  templeItemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', height: 127, alignSelf: 'stretch', borderRadius: 16, padding: 12, marginBottom: 15, elevation: 2, shadowOpacity: 0.05, shadowRadius: 5, overflow: 'hidden' },
  templeItemImage: { width: 80, height: 95, borderRadius: 15 },
  templeItemInfo: { flex: 1, marginLeft: 15 },
  templeItemName: { fontSize: 16, fontFamily: FONTS.bold, color: '#111', marginBottom: 4 },
  templeItemLocRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  templeItemLocText: { fontSize: 12, color: '#888', marginLeft: 4, fontFamily: FONTS.medium },
  templeItemDeity: { fontSize: 11, color: '#555', fontFamily: FONTS.medium, marginBottom: 6 },
  templeItemTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF4E5', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  templeItemTagText: { fontSize: 10, fontFamily: FONTS.bold, color: '#D35400', marginLeft: 4 },

  filterModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  filterModalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%', paddingBottom: 40 },
  filterModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  filterModalTitle: { fontSize: 18, fontFamily: FONTS.bold, color: '#111' },
  filterOptionsList: { padding: 20 },
  filterOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  filterCheckbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#DDD', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  filterCheckboxActive: { borderColor: '#FF6600', backgroundColor: '#FFFBF1' },
  filterOptionText: { fontSize: 16, color: '#444', fontFamily: FONTS.regular },
  filterOptionTextActive: { color: '#FF6600', fontFamily: FONTS.bold },
});
