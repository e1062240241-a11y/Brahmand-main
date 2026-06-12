import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Modal, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const geetaCover = require('../../assets/images/featured_book_6.jpg');
const upanishadsCover = require('../../assets/images/featured_book_7.jpg');
const vedasCover = require('../../assets/images/ancient_new_2.jpg');
const puranasCover = require('../../assets/images/ancient_new_3.jpg');
const dharmaCover = require('../../assets/images/ancient_new_4.jpg');

export default function SacredScriptures() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Vedic Literature');

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFDFCC', '#FFECE0', '#FFF5F0']} style={StyleSheet.absoluteFillObject} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1B1C1C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sacred Scriptures</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#9E8878" style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search by book name, author or topic." 
            placeholderTextColor="#A09090"
          />
          <TouchableOpacity onPress={() => setFilterVisible(true)}>
            <MaterialCommunityIcons name="tune-vertical" size={20} color="#8A7060" />
          </TouchableOpacity>
        </View>

        {/* Featured Collection Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.accentBar} />
            <Text style={styles.sectionTitle}>Featured Collection</Text>
          </View>
          <Text style={styles.viewAllText}>View All ›</Text>
        </View>

        {/* Featured Card */}
        <View style={styles.featuredCard}>
          <Image source={geetaCover} style={styles.featuredImage} resizeMode="stretch" />
          <View style={styles.featuredContent}>
            <View style={styles.featuredTitleRow}>
              <Text style={styles.featuredTitle}>Bhagavad Geeta</Text>
              <Ionicons name="bookmark" size={20} color="#FF6B00" />
            </View>
            <Text style={styles.authorText}>By Sage Vyasa</Text>
            
            <View style={styles.metaRow}>
              <View style={styles.metaBadge}>
                <Ionicons name="book-outline" size={14} color="#FF6B00" />
                <Text style={styles.metaBadgeText}>18 Chapters</Text>
              </View>
              <View style={styles.metaBadgeGray}>
                <Ionicons name="time-outline" size={14} color="#666" />
                <Text style={styles.metaBadgeTextGray}>12h Reading</Text>
              </View>
            </View>
            
            <Text style={styles.quoteText}>
              {"\"The Song of God\"—a timeless conversation on dharma, yoga, and the path to liberation."}
            </Text>
            
            <TouchableOpacity 
              style={styles.startReadingBtn}
              onPress={() => router.push('/library/continue-reading' as any)}
            >
              <Text style={styles.startReadingText}>Begin Journey</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Ancient Collection Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.accentBar} />
            <Text style={styles.sectionTitle}>Ancient Collection</Text>
          </View>
          <Text style={styles.viewAllText}>View All ›</Text>
        </View>

        <View style={styles.ancientList}>
          {renderAncientCard('The Upanishads', '108 Principal Texts', 'Explorations of the true nature of reality (Brahman) and the...', upanishadsCover, 0.3)}
          {renderAncientCard('The Vedas', 'Rig, Sama, Yajur, Atharva', 'The foundation of all Hindu wisdom, consisting of hymns...', vedasCover, 0.15)}
          {renderAncientCard('The Puranas', '18 Maha-Puranas', 'Mythology, cosmology, and the genealogies of kings and sages.', puranasCover, 0)}
          {renderAncientCard('Dharma Shastras', 'Law & Ethics', 'Ancient texts on the duties, laws, and ethical conduct for...', dharmaCover, 0.4)}
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <Modal visible={filterVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalHeader, { paddingTop: insets.top > 0 ? insets.top + 10 : 30 }]}>
              <Text style={styles.modalTitle}>Filter</Text>
              <TouchableOpacity onPress={() => setFilterVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={{ paddingTop: 10 }}>
              <FilterItem icon="star-outline" label="Featured" active={activeFilter === 'Featured'} onPress={() => setActiveFilter('Featured')} />
              <FilterItem icon="book-open-outline" label="Vedic Literature" active={activeFilter === 'Vedic Literature'} onPress={() => setActiveFilter('Vedic Literature')} />
              <FilterItem icon="book-outline" label="Upanishads" active={activeFilter === 'Upanishads'} onPress={() => setActiveFilter('Upanishads')} />
              <FilterItem icon="book-outline" label="Bhagavad Gita" active={activeFilter === 'Bhagavad Gita'} onPress={() => setActiveFilter('Bhagavad Gita')} />
              <FilterItem icon="bookmark-outline" label="My Bookmarks" active={activeFilter === 'My Bookmarks'} onPress={() => setActiveFilter('My Bookmarks')} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  function renderAncientCard(title: string, subtitle: string, desc: string, img: any, progress: number) {
    return (
      <View style={styles.ancientCard}>
        <View style={styles.ancientImgBox}>
          <Image source={img} style={styles.ancientImg} resizeMode="stretch" />
        </View>
        <View style={styles.ancientInfo}>
          <Text style={styles.ancientTitle}>{title}</Text>
          <Text style={styles.ancientSubtitle}>{subtitle}</Text>
          <Text style={styles.ancientDesc} numberOfLines={3}>{desc}</Text>
          <View style={styles.ancientProgressBg}>
            <View style={[styles.ancientProgressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>
      </View>
    );
  }
}

const FilterItem = ({ icon, label, active, onPress }: any) => (
  <TouchableOpacity style={[styles.filterItem, active && styles.filterItemActive]} onPress={onPress}>
    <MaterialCommunityIcons name={icon as any} size={22} color={active ? '#1B1C1C' : '#666'} />
    <Text style={[styles.filterItemText, active && styles.filterItemTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F0' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 15 },
  backBtn: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1B1C1C' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 24, paddingHorizontal: 16, height: 50, marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, color: '#1B1C1C' },
  
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center' },
  accentBar: { width: 3, height: 18, backgroundColor: '#FF6B00', marginRight: 8, borderRadius: 2 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1B1C1C' },
  viewAllText: { fontSize: 13, color: '#FF6B00', fontWeight: '500' },
  
  featuredCard: { backgroundColor: '#FFF', marginHorizontal: 20, borderRadius: 20, overflow: 'hidden', marginBottom: 30, elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 15, shadowOffset: { width: 0, height: 8 } },
  featuredImage: { width: '100%', height: 180 },
  featuredContent: { padding: 20 },
  featuredTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  featuredTitle: { fontSize: 18, fontWeight: '700', color: '#B35900' },
  authorText: { fontSize: 13, color: '#666', marginBottom: 12 },
  metaRow: { flexDirection: 'row', marginBottom: 14 },
  metaBadge: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  metaBadgeText: { fontSize: 12, color: '#FF6B00', fontWeight: '600', marginLeft: 4 },
  metaBadgeGray: { flexDirection: 'row', alignItems: 'center' },
  metaBadgeTextGray: { fontSize: 12, color: '#666', marginLeft: 4 },
  quoteText: { fontSize: 13, fontStyle: 'italic', color: '#666', lineHeight: 20, marginBottom: 20 },
  startReadingBtn: { flexDirection: 'row', backgroundColor: '#FF6B00', borderRadius: 12, height: 48, justifyContent: 'center', alignItems: 'center' },
  startReadingText: { color: '#FFFFFF', fontSize: 16, fontWeight: '400', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif' },
  
  ancientList: { paddingHorizontal: 20, gap: 16 },
  ancientCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12, padding: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  ancientImgBox: { width: 70, height: 90, borderRadius: 8, overflow: 'hidden', marginRight: 14 },
  ancientImg: { width: '100%', height: '100%' },
  ancientInfo: { flex: 1, justifyContent: 'center' },
  ancientTitle: { fontSize: 18, color: '#1B1C1C', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontStyle: 'normal', fontWeight: '700', lineHeight: 24, marginBottom: 2 },
  ancientSubtitle: { fontSize: 16, color: '#5A4136', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontStyle: 'normal', fontWeight: '600', lineHeight: 24, marginBottom: 6 },
  ancientDesc: { alignSelf: 'stretch', fontSize: 14, color: '#8E7164', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontStyle: 'normal', fontWeight: '400', lineHeight: 20, marginBottom: 8 },
  ancientProgressBg: { height: 3, backgroundColor: '#EEE', borderRadius: 1.5, overflow: 'hidden', marginTop: 'auto' },
  ancientProgressFill: { height: '100%', backgroundColor: '#FF6B00', borderRadius: 1.5 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', flexDirection: 'row', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FAFAFA', width: '75%', height: '100%', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  modalTitle: { fontSize: 16, fontWeight: '600', color: '#B35900' },
  filterItem: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingHorizontal: 20, borderRadius: 8, marginHorizontal: 12, marginBottom: 4 },
  filterItemActive: { backgroundColor: '#FF6B00' },
  filterItemText: { fontSize: 14, color: '#666', marginLeft: 12 },
  filterItemTextActive: { color: '#1B1C1C', fontWeight: '700' }
});
