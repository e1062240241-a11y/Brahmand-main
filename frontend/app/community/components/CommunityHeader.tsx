import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from '@/src/components/KeyboardAwareScrollView';

interface CommunityHeaderProps {
  communityId: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = ['My Posts', 'Feed', 'Requests', 'Events', 'Lost & Found', 'Festivals', 'Seva', 'Temple Updates'];

export const CommunityHeader = ({ communityId, activeTab, onTabChange }: CommunityHeaderProps) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/messages');
    }
  };

  return (
    <LinearGradient
      colors={['#FF8C3A', '#FFAD7D', '#FFD4AA', '#FFF1E8', '#FFFFFF']}
      locations={[0, 0.25, 0.55, 0.8, 1]}
      style={[styles.headerGradientContainer, { paddingTop: insets.top }]}
    >
      <View style={styles.headerTopRow}>
        <TouchableOpacity onPress={handleGoBack} style={styles.headerBackButton}>
          <Ionicons name="chevron-back" size={26} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitleText} numberOfLines={1}>
          Community
        </Text>

        <TouchableOpacity
          style={styles.headerCreateBtn}
          onPress={() => {
            router.push(`/community/create?id=${communityId}&category=${activeTab}`);
          }}
        >
          <Ionicons name="add" size={16} color="#FFF" />
          <Text style={styles.headerCreateBtnText}>Create</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.headerMembersText}>
        Members
      </Text>

      <Text style={styles.headerTaglineText}>
        Connect with your local community.
      </Text>

      <KeyboardAwareScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {TABS.map((tab, idx) => (
          <React.Fragment key={tab}>
             {idx === 1 && <View style={{ width: 1.5, height: 18, backgroundColor: 'rgba(0,0,0,0.15)', marginHorizontal: 2 }} />}
             <TouchableOpacity
               onPress={() => onTabChange(tab)}
               style={[styles.pillTab, activeTab === tab && styles.pillTabActive]}
             >
               {tab === 'My Posts' && (
                 <View style={[styles.pillIconWrap, activeTab === 'My Posts' && styles.pillIconWrapActive]}>
                   <Ionicons
                     name="person"
                     size={10}
                     color={activeTab === 'My Posts' ? '#FF6B00' : '#888'}
                   />
                 </View>
               )}
               <Text style={[styles.pillTabText, activeTab === tab && styles.pillTabTextActive]}>
                 {tab}
               </Text>
             </TouchableOpacity>
          </React.Fragment>
        ))}
      </KeyboardAwareScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  headerGradientContainer: {
    width: '100%',
    paddingBottom: 4,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 48,
    marginTop: 8,
  },
  headerBackButton: {
    position: 'absolute',
    left: 12,
    padding: 8,
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
    maxWidth: '50%',
    textAlign: 'center',
  },
  headerCreateBtn: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  headerCreateBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  headerMembersText: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(0,0,0,0.6)',
    fontWeight: '600',
    marginTop: 2,
  },
  headerTaglineText: {
    textAlign: 'center',
    fontSize: 13,
    color: 'rgba(0,0,0,0.8)',
    fontWeight: '500',
    marginTop: 6,
    marginHorizontal: 30,
    lineHeight: 18,
  },
  tabsContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  tabsContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  pillTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  pillTabActive: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  pillIconWrap: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  pillIconWrapActive: {
    backgroundColor: '#FFF',
  },
  pillTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  pillTabTextActive: {
    color: '#FFF',
  },
});
