import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../src/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../src/store/authStore';
import { useVendorStore } from '../src/store/vendorStore';
import { VendorKYCModal } from '../src/components/VendorKYCModal';
import { getKYCStatus } from '../src/services/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const CATEGORIES = [
  { id: 'blood', name: 'Blood Request', icon: 'tint', type: 'font-awesome', color: '#E53935', bg: '#FFEBEE' },
  { id: 'emergency', name: 'Emergency Help', icon: 'ambulance', type: 'font-awesome', color: '#FB8C00', bg: '#FFF3E0' },
  { id: 'food', name: 'Food / Grocery Help', icon: 'basket', type: 'material', color: '#F25C05', bg: '#FFF4EE' },
  { id: 'senior', name: 'Senior Citizen Support', icon: 'account-group', type: 'material', color: '#5C6BC0', bg: '#E8EAF6' },
  { id: 'gau-seva', name: 'Gau Seva / Animal Care', icon: 'cow', type: 'material', color: '#43A047', bg: '#E8F5E9' },
  { id: 'animal', name: 'Animal Care / Rescue', icon: 'paw', type: 'material', color: '#EF6C00', bg: '#FFF3E0' },
  { id: 'temple', name: 'Temple / Volunteer Help', icon: 'temple-hindu', type: 'material', color: '#FB8C00', bg: '#FFF3E0' },
  { id: 'other', name: 'Other Community Request', icon: 'help-circle', type: 'material', color: '#00796B', bg: '#E0F2F1' },
];

export default function CommunityRequestHub() {
  const router = useRouter();
  const { community_id } = useLocalSearchParams<{ community_id?: string }>();
  
  const { user, updateUser } = useAuthStore();
  const { myVendor, fetchMyVendor } = useVendorStore();
  
  const [showKycModal, setShowKycModal] = useState(false);
  const [kycModalVendorId, setKycModalVendorId] = useState<string | null>(myVendor?.id || null);
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);

  const isKycVerified =
    (user as any)?.kyc_status === 'verified' ||
    Boolean((user as any)?.is_verified) ||
    myVendor?.kyc_status === 'verified';

  const navigateToCategory = (categoryId: string) => {
    const params = community_id ? { community_id } : {};
    switch (categoryId) {
      case 'blood': router.push({ pathname: '/community-request/blood-request', params }); break;
      case 'emergency': router.push({ pathname: '/community-request/emergency-help', params }); break;
      case 'food': router.push({ pathname: '/community-request/food', params }); break;
      case 'senior': router.push({ pathname: '/senior-citizen/request', params }); break;
      case 'gau-seva': router.push({ pathname: '/community-request/gau-seva', params }); break;
      case 'animal': router.push({ pathname: '/community-request/animal-care', params }); break;
      case 'temple': router.push({ pathname: '/community-request/temple-help', params }); break;
      case 'other': router.push({ pathname: '/community-request/other', params }); break;
      default: break;
    }
  };

  const handleSelectCategory = async (categoryId: string) => {
    if (!isKycVerified) {
      let vendorId = myVendor?.id || null;
      if (!vendorId) {
        await fetchMyVendor();
        vendorId = useVendorStore.getState().myVendor?.id || null;
      }
      setKycModalVendorId(vendorId || '');
      setPendingCategory(categoryId);
      setShowKycModal(true);
      return;
    }
    
    navigateToCategory(categoryId);
  };

  const handleKycSuccess = async () => {
    setShowKycModal(false);
    try {
      const response = await getKYCStatus();
      const serverStatus = response?.data?.kyc_status || (response?.data?.is_verified ? 'verified' : null);
      updateUser({
        kyc_status: serverStatus,
        is_verified: Boolean(response?.data?.is_verified) || serverStatus === 'verified',
      } as any);
    } catch (error) {
      console.warn('Failed to refresh KYC status:', error);
    }

    if (pendingCategory) {
      const cat = pendingCategory;
      setPendingCategory(null);
      navigateToCategory(cat);
    }
  };

  const renderIcon = (cat: typeof CATEGORIES[0]) => {
    if (cat.type === 'font-awesome') return <FontAwesome5 name={cat.icon} size={24} color={cat.color} />;
    if (cat.type === 'material') return <MaterialCommunityIcons name={cat.icon as any} size={26} color={cat.color} />;
    return null;
  };

  const handleBack = () => {
    if (community_id) {
      router.replace(`/community/${community_id}`);
    } else {
      router.replace('/(tabs)/messages');
    }
  };

  useEffect(() => {
    const onBackPress = () => {
      handleBack();
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [community_id]);

  return (
    <View style={styles.mainContainer}>
      <LinearGradient colors={['#FDFBFB', '#EBEDEE']} style={styles.gradientBg} />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.topHeaderBack} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="#F25C05" />
          </TouchableOpacity>
          <Text style={styles.topHeaderText}>Community Requests</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Header Card */}
          <View style={styles.headerCard}>
            <View style={styles.headerTextCol}>
              <Text style={styles.headerTitle}>Help Your Community</Text>
              <Text style={styles.headerSubtitle}>Reach out and make a real difference in someone's life.</Text>
            </View>
          </View>

          {/* Categories Grid */}
          <View style={styles.gridContainer}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.catCard}
                activeOpacity={0.8}
                onPress={() => handleSelectCategory(cat.id)}
              >
                <View style={[styles.iconWrapper, { backgroundColor: cat.bg }]}>
                  {renderIcon(cat)}
                </View>
                <Text style={styles.catName} numberOfLines={2}>{cat.name}</Text>
                <View style={styles.arrowCircle}>
                  <Ionicons name="arrow-forward" size={14} color="#BBB" />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footerInfo}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#888" />
            <Text style={styles.footerText}>Secure and Verified Community Support</Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {/* KYC Modal for Community Request verification */}
      <VendorKYCModal
        visible={showKycModal}
        vendorId={kycModalVendorId || ''}
        allowUserKycFallback
        onClose={() => {
          setShowKycModal(false);
          setPendingCategory(null);
        }}
        onKycUpdated={handleKycSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  gradientBg: { ...StyleSheet.absoluteFillObject },
  safeArea: { flex: 1 },
  topHeader: { 
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingVertical: 14, 
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(0,0,0,0.03)' 
  },
  topHeaderBack: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topHeaderText: { color: '#F25C05', fontSize: 17, fontFamily: FONTS.bold, letterSpacing: 0.5 },
  scrollContent: { padding: 16, paddingTop: 10 },
  
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 4,
  },
  headerTextCol: { flex: 1 },
  headerTitle: { fontSize: 22, fontFamily: FONTS.bold, color: '#111' },
  headerSubtitle: { fontSize: 13, fontFamily: FONTS.regular, color: '#666', marginTop: 4, lineHeight: 18 },
  
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  catCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    position: 'relative',
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  catName: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: '#333',
    lineHeight: 20,
    paddingRight: 10,
  },
  arrowCircle: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    opacity: 0.8,
  },
  footerText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#888',
    marginLeft: 6,
  },
});