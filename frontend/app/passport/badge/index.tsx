import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  FlatList, 
  Modal, 
  Platform,
  Alert 
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { usePassportStore } from '../../../src/store/passportStore';
import { useAuthStore } from '../../../src/store/authStore';
import { useLanguageStore } from '../../../src/utils/i18n';
import withObservables from '@nozbe/with-observables';
import { database } from '../../../src/database';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';

const { width: windowWidth } = Dimensions.get('window');

interface FlattenedBadge {
  id: string;
  title: string;
  description: string;
  earned_at: string;
  instanceIndex: number;
  isLocked?: boolean;
  unlockRule?: string;
}

const PRESET_BADGES = [
  {
    title: 'First Yatra',
    description: 'Log your first travel journey to unlock this badge!',
    unlockRule: 'Go to Travel Logs and record a new yatra journey.',
    matcher: (title: string) => title.toLowerCase().includes('yatra') || title.toLowerCase().includes('first journey'),
  },
  {
    title: 'Book Finisher',
    description: 'Complete reading your first holy book to earn this badge!',
    unlockRule: 'Finish reading any holy scripture (Gita, Ramayana, etc.) in the library.',
    matcher: (title: string) => title.toLowerCase().includes('book') || title.toLowerCase().includes('finisher'),
  },
  {
    title: 'First Jaap Milestone',
    description: 'Complete a full mala cycle of chants to earn this badge!',
    unlockRule: 'Start Chanting in Ekant or Live Jaap rooms and complete 108 chants.',
    matcher: (title: string) => title.toLowerCase().includes('jaap') || title.toLowerCase().includes('milestone') || title.toLowerCase().includes('first jaap') || title.toLowerCase().includes('1000 jaaps'),
  },
  {
    title: 'Daily Jaap Sadhak',
    description: 'Complete the daily Sadhana target on any day!',
    unlockRule: 'Complete 1 full Hanuman Chalisa jaap and 5 Malas (540 chants) of other jaaps in a single calendar day.',
    matcher: (title: string) => title.toLowerCase().includes('daily jaap sadhak') || title.toLowerCase().includes('sadhana'),
  }
];

function PassportBadgeScreen({ observedBadges = [] }: { observedBadges?: any[] }) {
  const router = useRouter();
  const { badgeTitle } = useLocalSearchParams<{ badgeTitle?: string }>();
  const loadPassport = usePassportStore((state) => state.loadPassport);
  const userName = useAuthStore((state) => state.user?.name || 'Sadhak');
  const isHindi = useLanguageStore((state) => state.language === 'hi');
  const badges = observedBadges;
  
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [selectedBadge, setSelectedBadge] = useState<FlattenedBadge | null>(null);

  useEffect(() => {
    loadPassport();
  }, []);

  // Map and expand badges by their count so they generate multiple items if completed multiple times
  const flattenedBadges: FlattenedBadge[] = [];
  
  // 1. Add all earned badges that match the filter (if any filter is present)
  const earnedMatches = badges.filter(b => {
    if (!badgeTitle) return true;
    const bt = badgeTitle.toLowerCase();
    const t = b.title?.toLowerCase() || '';
    if (bt.includes('yatra')) return t.includes('yatra') || t.includes('journey');
    if (bt.includes('book')) return t.includes('book');
    if (bt.includes('jaap')) return t.includes('jaap');
    return t === bt;
  });

  earnedMatches.forEach((badge) => {
    const loopCount = badge.count || 1;
    for (let i = 0; i < loopCount; i++) {
      flattenedBadges.push({
        id: `${badge.id}_instance_${i}`,
        title: badge.title,
        description: badge.description,
        earned_at: badge.earned_at,
        instanceIndex: i,
        isLocked: false
      });
    }
  });

  // 2. For each preset badge, if it is NOT earned (i.e. not matched by any badge in observedBadges),
  // and it matches the badgeTitle filter (or no filter is present), append it as locked!
  PRESET_BADGES.forEach((preset) => {
    const isEarned = badges.some(b => preset.matcher(b.title));
    if (!isEarned) {
      let filterMatches = true;
      if (badgeTitle) {
        const bt = badgeTitle.toLowerCase();
        const t = preset.title.toLowerCase();
        if (bt.includes('yatra')) filterMatches = t.includes('yatra');
        else if (bt.includes('book')) filterMatches = t.includes('book');
        else if (bt.includes('jaap')) filterMatches = t.includes('jaap');
        else filterMatches = t === bt;
      }

      if (filterMatches) {
        flattenedBadges.push({
          id: `locked_${preset.title.replace(/\s+/g, '_')}`,
          title: preset.title,
          description: preset.description,
          earned_at: '',
          instanceIndex: 0,
          isLocked: true,
          unlockRule: preset.unlockRule
        });
      }
    }
  });

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/passport/inner' as any);
    }
  };

  const getBadgeImage = (title: string) => {
    const cleanTitle = title.toLowerCase();
    if (cleanTitle.includes('gita')) {
      return { uri: 'https://brahmandfeed23.b-cdn.net/assets/bhagavad_gita_3d_new.webp' };
    } else if (cleanTitle.includes('mahabharat')) {
      return { uri: 'https://brahmandfeed23.b-cdn.net/assets/mahabharata.webp' };
    } else if (cleanTitle.includes('ramayan') || cleanTitle.includes('ramcharit')) {
      return { uri: 'https://brahmandfeed23.b-cdn.net/assets/Ramcharitmanas.webp' };
    }
    return { uri: 'https://brahmandfeed23.b-cdn.net/assets/community_medal_icon.webp' };
  };

  const handleShare = async () => {
    setMenuVisible(false);
    
    // Determine what to share
    const sharedText = badgeTitle 
      ? `Check out my completed reading badge for ${badgeTitle} from Brahmand!`
      : `Check out my completed reading badges from Brahmand!`;
      
    if (Platform.OS === 'web') {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Brahmand Badges',
            text: sharedText,
            url: window.location.href
          });
        } catch (error) {
          Alert.alert('Sharing', 'Could not open share menu');
        }
      } else {
        Alert.alert('Sharing', 'Web share is not supported on this browser.');
      }
    } else {
      // Native Share dialog
      Alert.alert(
        'Share Badge',
        sharedText,
        [
          { text: 'OK', onPress: () => {} }
        ]
      );
    }
  };

  const toggleSelectionMode = () => {
    setMenuVisible(false);
    setSelectionMode(!selectionMode);
    setSelectedItems({});
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderBadgeItem = ({ item }: { item: FlattenedBadge }) => {
    const isSelected = !!selectedItems[item.id];
    const isGita = item.title.toLowerCase().includes('gita');
    
    return (
      <TouchableOpacity 
        style={[
          styles.gridItem,
          selectionMode && isSelected && styles.gridItemSecondarySelected
        ]}
        activeOpacity={selectionMode ? 0.8 : 0.7}
        onPress={() => selectionMode ? handleSelectItem(item.id) : setSelectedBadge(item)}
      >
        <Text style={styles.badgeTitleText}>{item.title}</Text>
        
        {item.isLocked ? (
          <View style={styles.medalOuterLocked}>
            <LinearGradient
              colors={['#3A3F47', '#252830']}
              style={styles.medalGradient}
            />
            <View style={styles.medalInnerBorderLocked}>
              <Image 
                source={getBadgeImage(item.title)} 
                style={[styles.medalImage, { opacity: 0.25 }]} 
                contentFit="cover"
              />
              <View style={styles.lockIconOverlay}>
                <Ionicons name="lock-closed" size={32} color="#9CA3AF" />
              </View>
            </View>
            
            {/* Dark Ribbon */}
            <View style={styles.ribbonWrapperLocked}>
              <LinearGradient
                colors={['#4B5563', '#374151']}
                style={styles.ribbonGradient}
              />
              <Text style={styles.ribbonTextLocked} numberOfLines={1}>
                ★ LOCKED ★
              </Text>
            </View>
          </View>
        ) : isGita ? (
          <Image 
            source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/PhotoshopPreview_Image_1.webp' }} 
            style={styles.gitaBadgeImage} 
            contentFit="contain"
          />
        ) : (
          <View style={styles.medalOuter}>
            <LinearGradient
              colors={['#102E62', '#0A1C3C']}
              style={styles.medalGradient}
            />
            <View style={styles.medalInnerBorder}>
              <Image 
                source={getBadgeImage(item.title)} 
                style={styles.medalImage} 
                contentFit="cover"
              />
            </View>
            
            {/* Ornamental Gold Dotted Ring Overlay */}
            <View style={styles.dottedRing} pointerEvents="none" />
            
            {/* Gold Banner */}
            <View style={styles.ribbonWrapper}>
              <LinearGradient
                colors={['#ECC55E', '#C29831']}
                style={styles.ribbonGradient}
              />
              <Text style={styles.ribbonText} numberOfLines={1} adjustsFontSizeToFit>
                ★ COMPLETED ★
              </Text>
              <Text style={styles.ribbonSubText} numberOfLines={1} adjustsFontSizeToFit>
                FROM BRAHMAND
              </Text>
            </View>
          </View>
        )}

        {selectionMode && (
          <View style={styles.checkboxContainer}>
            <Ionicons 
              name={isSelected ? "checkbox" : "square-outline"} 
              size={22} 
              color={isSelected ? "#FF6F00" : "#888"} 
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      {/* Background Peach to Cream Gradient */}
      <LinearGradient 
        colors={['#FFB085', '#FFF7F2', '#FFFDFB']} 
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Badge</Text>
        <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(!menuVisible)}>
          <Ionicons name="ellipsis-vertical" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Dropdown Menu Modal */}
      {menuVisible && (
        <TouchableOpacity 
          style={styles.menuOverlay} 
          activeOpacity={1} 
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.dropdownMenu, { top: Platform.OS === 'ios' ? 90 : 60 }]}>
            <TouchableOpacity style={styles.menuItem} onPress={handleShare}>
              <Ionicons name="paper-plane-outline" size={18} color="#000" style={styles.menuIcon} />
              <Text style={styles.menuText}>Share</Text>
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity style={styles.menuItem} onPress={toggleSelectionMode}>
              <Ionicons name="crop-outline" size={18} color="#000" style={styles.menuIcon} />
              <Text style={styles.menuText}>
                {selectionMode ? "Cancel Select" : "Select"}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {/* Grid Content */}
      <FlatList
        data={flattenedBadges}
        renderItem={renderBadgeItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
      />

      {/* Badge Achievement Detail Modal */}
      <Modal
        visible={!!selectedBadge}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedBadge(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedBadge(null)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <LinearGradient
              colors={['#0F2244', '#081428']}
              style={styles.modalGradient}
            >
              {/* Outer Border (Silver/Grey for locked, Gold for unlocked) */}
              <View style={selectedBadge?.isLocked ? styles.modalSilverBorder : styles.modalGoldBorder}>
                {/* Dotted Ring */}
                <View style={selectedBadge?.isLocked ? styles.modalDottedRingLocked : styles.modalDottedRing} />
                
                {/* Close Button */}
                <TouchableOpacity 
                  style={styles.modalCloseButton} 
                  onPress={() => setSelectedBadge(null)}
                >
                  <Ionicons 
                    name="close" 
                    size={24} 
                    color={selectedBadge?.isLocked ? "#9CA3AF" : "#ECC55E"} 
                  />
                </TouchableOpacity>

                {/* Badge Image / Medal in Modal */}
                {selectedBadge && (
                  <View style={selectedBadge.isLocked ? styles.modalMedalContainerLocked : styles.modalMedalContainer}>
                    <View style={styles.modalMedalInner}>
                      <Image 
                        source={getBadgeImage(selectedBadge.title)} 
                        style={selectedBadge.isLocked ? [styles.modalMedalImage, { opacity: 0.3 }] : styles.modalMedalImage} 
                        contentFit="cover"
                      />
                    </View>
                    {selectedBadge.isLocked && (
                      <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="lock-closed" size={32} color="#9CA3AF" />
                      </View>
                    )}
                  </View>
                )}

                {/* 🧡 Engagement: Reframed badge modal headers from transactional English ("LOCKED ACHIEVEMENT" / "CERTIFICATE OF ACHIEVEMENT")
                    to Hindi primary devotional offering ("अभी अप्राप्त साधना" / "प्रमाणपत्र — दिव्य सिद्धि").
                    Lever: Reframing + Mother Tongue (Hindi Primary)
                    Why: Turns rigid certificate labels into culturally rich devotional milestones (bhavna).
                    UI: Text-only change, no structural or visual alterations. */}
                <Text style={selectedBadge?.isLocked ? styles.certificateHeaderLocked : styles.certificateHeader}>
                  {selectedBadge?.isLocked
                    ? (isHindi ? "अभी अप्राप्त साधना" : "LOCKED ACHIEVEMENT")
                    : (isHindi ? "प्रमाणपत्र — दिव्य सिद्धि" : "CERTIFICATE OF ACHIEVEMENT")}
                </Text>
                
                <View style={styles.certificateDivider} />
                
                <Text style={styles.badgeTitleDetail}>{selectedBadge?.title}</Text>
                <Text style={styles.badgeDescriptionDetail}>{selectedBadge?.description}</Text>
                
                {selectedBadge?.isLocked && (
                  <View style={styles.unlockCard}>
                    <LinearGradient
                      colors={['rgba(236, 197, 94, 0.15)', 'rgba(194, 152, 49, 0.05)']}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <Ionicons name="key-outline" size={20} color="#ECC55E" style={{ marginBottom: 4 }} />
                    <Text style={styles.unlockCardTitle}>HOW TO UNLOCK</Text>
                    <Text style={styles.unlockCardRule}>{selectedBadge.unlockRule}</Text>
                  </View>
                )}

                {!selectedBadge?.isLocked && (
                  <>
                    <Text style={styles.presentedToText}>This badge is proudly presented to</Text>
                    <Text style={styles.recipientNameText}>{userName}</Text>
                    
                    <Text style={styles.achievementDescText}>
                      For successfully achieving the milestone:
                    </Text>
                    
                    <View style={styles.certificateDivider} />

                    {/* Date & Signature Row */}
                    <View style={styles.certificateFooter}>
                      <View style={styles.footerCol}>
                        <Text style={styles.footerValue}>
                          {selectedBadge?.earned_at 
                            ? new Date(selectedBadge.earned_at).toLocaleDateString(undefined, { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              }) 
                            : new Date().toLocaleDateString(undefined, { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                        </Text>
                        <View style={styles.footerLine} />
                        <Text style={styles.footerLabel}>DATE OF ACHIEVEMENT</Text>
                      </View>
                      
                      <View style={styles.footerCol}>
                        <Text style={[styles.footerValue, styles.signatureFont]}>Brahmand</Text>
                        <View style={styles.footerLine} />
                        <Text style={styles.footerLabel}>AUTHORIZED SIGNATORY</Text>
                      </View>
                    </View>
                  </>
                )}
              </View>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.5,
  },
  menuButton: {
    padding: 8,
    marginRight: -8,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99,
  },
  dropdownMenu: {
    position: 'absolute',
    right: 16,
    width: 140,
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  menuDivider: {
    height: 0.8,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 12,
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  gridItem: {
    width: (windowWidth - 48) / 2,
    backgroundColor: 'transparent',
    alignItems: 'center',
    position: 'relative',
    padding: 8,
  },
  gridItemSecondarySelected: {
    opacity: 0.8,
  },
  checkboxContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFF',
    borderRadius: 6,
    padding: 2,
  },
  badgeTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  medalOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: '#C29831', // Gold outer rim
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 8,
    position: 'relative',
  },
  medalGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 70,
  },
  medalInnerBorder: {
    width: 114,
    height: 114,
    borderRadius: 57,
    borderWidth: 2,
    borderColor: '#ECC55E',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#0F2244',
  },
  medalOuterLocked: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: '#4B5563',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    position: 'relative',
  },
  medalInnerBorderLocked: {
    width: 114,
    height: 114,
    borderRadius: 57,
    borderWidth: 2,
    borderColor: '#6B7280',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#1F2937',
    position: 'relative',
  },
  lockIconOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ribbonWrapperLocked: {
    position: 'absolute',
    bottom: -12,
    width: 128,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4B5563',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
    paddingHorizontal: 4,
  },
  ribbonTextLocked: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#D1D5DB',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  medalImage: {
    width: '100%',
    height: '100%',
  },
  dottedRing: {
    position: 'absolute',
    width: 124,
    height: 124,
    borderRadius: 62,
    borderWidth: 1,
    borderColor: '#C29831',
    opacity: 0.6,
  },
  ribbonWrapper: {
    position: 'absolute',
    bottom: -12,
    width: 128,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ECC55E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'hidden',
    paddingHorizontal: 4,
  },
  ribbonGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  ribbonText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#000',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  ribbonSubText: {
    fontSize: 7,
    fontWeight: '800',
    color: '#000',
    textAlign: 'center',
    opacity: 0.9,
    marginTop: -1,
  },
  gitaBadgeImage: {
    width: 150,
    height: 150,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
  },
  modalGradient: {
    padding: 16,
  },
  modalGoldBorder: {
    borderWidth: 2,
    borderColor: '#C29831',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  modalDottedRing: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderWidth: 1,
    borderColor: '#ECC55E',
    borderStyle: 'dashed',
    borderRadius: 12,
    opacity: 0.4,
    pointerEvents: 'none',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 4,
  },
  modalMedalContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#ECC55E',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A1C3C',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  modalSilverBorder: {
    borderWidth: 2,
    borderColor: '#4B5563',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
    width: '100%',
  },
  modalDottedRingLocked: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderWidth: 1,
    borderColor: '#6B7280',
    borderStyle: 'dashed',
    borderRadius: 12,
    opacity: 0.4,
    pointerEvents: 'none',
  },
  modalMedalContainerLocked: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#4B5563',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    position: 'relative',
  },
  certificateHeaderLocked: {
    fontSize: 12,
    fontWeight: '900',
    color: '#9CA3AF',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 8,
  },
  unlockCard: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(236, 197, 94, 0.3)',
    overflow: 'hidden',
  },
  unlockCardTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ECC55E',
    letterSpacing: 1,
    marginBottom: 6,
    textAlign: 'center',
  },
  unlockCardRule: {
    fontSize: 12,
    color: '#E5E7EB',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
  },
  modalMedalInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: 'hidden',
  },
  modalMedalImage: {
    width: '100%',
    height: '100%',
  },
  certificateHeader: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ECC55E',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 8,
  },
  certificateDivider: {
    width: '80%',
    height: 1,
    backgroundColor: '#C29831',
    opacity: 0.4,
    marginVertical: 16,
  },
  presentedToText: {
    fontSize: 11,
    color: '#8E9AA8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  recipientNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    marginVertical: 8,
    letterSpacing: 0.5,
  },
  achievementDescText: {
    fontSize: 10,
    color: '#8E9AA8',
    textAlign: 'center',
    marginTop: 10,
  },
  badgeTitleDetail: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ECC55E',
    textAlign: 'center',
    marginTop: 4,
  },
  badgeDescriptionDetail: {
    fontSize: 12,
    color: '#D0D5DD',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 10,
    lineHeight: 16,
  },
  certificateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  footerCol: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  footerValue: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  signatureFont: {
    fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'serif',
    fontSize: 13,
    color: '#ECC55E',
    fontStyle: 'italic',
  },
  footerLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#C29831',
    opacity: 0.5,
    marginVertical: 4,
  },
  footerLabel: {
    fontSize: 7,
    fontWeight: '700',
    color: '#8E9AA8',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});

const enhance = withObservables([], () => ({
  observedBadges: database.get('passport_badges').query().observe(),
}));

export default enhance(PassportBadgeScreen);
