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
}

function PassportBadgeScreen({ observedBadges }: { observedBadges: any[] }) {
  const router = useRouter();
  const { badgeTitle } = useLocalSearchParams<{ badgeTitle?: string }>();
  const loadPassport = usePassportStore((state) => state.loadPassport);
  const badges = observedBadges;
  
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadPassport();
  }, []);

  // Map and expand badges by their count so they generate multiple items if completed multiple times
  const flattenedBadges: FlattenedBadge[] = [];
  
  const filteredBadges = badgeTitle 
    ? badges.filter(b => {
        const bt = badgeTitle.toLowerCase();
        const t = b.title?.toLowerCase() || '';
        
        // Match specific badge categories to avoid cross-matching
        if (bt.includes('yatra')) {
          return t.includes('yatra') || t.includes('journey');
        }
        if (bt.includes('book')) {
          return t.includes('book');
        }
        if (bt.includes('jaap')) {
          return t.includes('jaap');
        }
        
        // Fallback exact match
        return t === bt;
      })
    : badges;

  // If the store is empty or the specific badge isn't found, inject a fallback
  const activeBadges = filteredBadges.length > 0 ? filteredBadges : (
    badgeTitle ? [
      {
        id: `demo_${badgeTitle.replace(/\s+/g, '_')}`,
        title: badgeTitle,
        description: `Complete your ${badgeTitle} to unlock this badge!`,
        earned_at: new Date().toISOString(),
        count: 1
      }
    ] : [
      {
        id: 'demo_gita_1',
        title: 'Bhagawad Gita',
        description: 'Completed reading Bhagawad Gita',
        earned_at: new Date().toISOString(),
        count: 2
      }
    ]
  );

  activeBadges.forEach((badge) => {
    const loopCount = badge.count || 1;
    for (let i = 0; i < loopCount; i++) {
      flattenedBadges.push({
        id: `${badge.id}_instance_${i}`,
        title: badge.title,
        description: badge.description,
        earned_at: badge.earned_at,
        instanceIndex: i
      });
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
      return require('../../../assets/images/bhagavad_gita_3d_new.png');
    } else if (cleanTitle.includes('mahabharat')) {
      return require('../../../assets/images/mahabharata.jpg');
    } else if (cleanTitle.includes('ramayan') || cleanTitle.includes('ramcharit')) {
      return require('../../../assets/images/Ramcharitmanas.jpg');
    }
    return require('../../../assets/images/community_medal_icon.png');
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
        activeOpacity={selectionMode ? 0.8 : 1}
        onPress={() => selectionMode && handleSelectItem(item.id)}
      >
        <Text style={styles.badgeTitleText}>{item.title}</Text>
        
        {isGita ? (
          <Image 
            source={require('../../../assets/images/PhotoshopPreview_Image 1.png')} 
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
});

const enhance = withObservables([], () => ({
  observedBadges: database.get('passport_badges').query().observe(),
}));

export default enhance(PassportBadgeScreen);
