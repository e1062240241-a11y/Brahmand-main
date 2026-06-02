import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../../src/constants/theme';
import { getAllUsers, createCommunity, parseApiError } from '../../src/services/api';
import { Avatar } from '../../src/components/Avatar';

const { width } = Dimensions.get('window');

interface User {
  id: string;
  name: string;
  sl_id: string;
  photo?: string;
}

export default function CreateCommunityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    description: '',
    city: '',
    area: '',
    type: 'Local/Community',
    category: '',
    photo: '',
    cover_photo: '',
    admin_ids: [] as string[],
    member_ids: [] as string[],
  });

  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const CITIES = ['Mumbai', 'Pune', 'Indore', 'Delhi', 'Bangalore', 'Ahmedabad', 'Surat', 'Nagpur', 'Ujjain', 'Bhopal'];
  const CATEGORIES = ['Devotional', 'Social Service', 'Youth Group', 'Cultural', 'Educational', 'Senior Citizen'];

  // Users for selection
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedAdmins, setSelectedAdmins] = useState<User[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (step === 6 || step === 7) {
      const timer = setTimeout(() => {
        fetchUsers(searchQuery);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [step, searchQuery]);

  const fetchUsers = async (search?: string) => {
    setUsersLoading(true);
    try {
      const response = await getAllUsers(search);
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const pickImage = async (type: 'photo' | 'cover_photo') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'photo' ? [1, 1] : [16, 9],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setFormData({ ...formData, [type]: base64Image });
    }
  };

  const handleNext = () => {
    if (step === 3 && !formData.type) {
      Alert.alert('Selection Required', 'Please select a community type.');
      return;
    }
    if (step === 4 && (!formData.name || !formData.description || !formData.city)) {
      Alert.alert('Required Fields', 'Please fill in name, description, and city.');
      return;
    }
    if (step === 5 && !formData.category) {
      Alert.alert('Selection Required', 'Please select a community category.');
      return;
    }
    setStep(step + 1);
  };
  const handleBack = () => {
    if (step === 1) router.back();
    else setStep(step - 1);
  };

  const toggleAdmin = (user: User) => {
    if (selectedAdmins.find(u => u.id === user.id)) {
      setSelectedAdmins(selectedAdmins.filter(u => u.id !== user.id));
    } else {
      setSelectedAdmins([...selectedAdmins, user]);
    }
  };

  const toggleMember = (user: User) => {
    if (selectedMembers.find(u => u.id === user.id)) {
      setSelectedMembers(selectedMembers.filter(u => u.id !== user.id));
    } else {
      setSelectedMembers([...selectedMembers, user]);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        type: 'user_group', // Backend validation expects one of: area, city, state, country, user_group
        category: `${formData.type}${formData.category ? ` - ${formData.category}` : ''}`,
        admin_ids: selectedAdmins.map(u => u.id),
        member_ids: selectedMembers.map(u => u.id),
      };
      await createCommunity(payload);
      setStep(9);
    } catch (error: any) {
      Alert.alert('Error', parseApiError(error));
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER SCREENS ---

  // User explicitly said: 1st screen = Image 1 (Roles), 2nd screen = Image 2 (Landing)

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Create a Community</Text>
        <Text style={styles.subtitle}>Build a trusted and active community{"\n"}with a strong founding team.</Text>

        <View style={styles.rolesCard}>
          <View style={styles.roleItem}>
            <View style={[styles.roleIconBox, { backgroundColor: '#FFF5E6' }]}>
              <FontAwesome5 name="crown" size={20} color="#FF9933" />
            </View>
            <View style={styles.roleText}>
              <Text style={styles.roleTitle}>1 Owner</Text>
              <Text style={styles.roleSub}>Full control of the community</Text>
            </View>
          </View>

          <View style={styles.roleItem}>
            <View style={[styles.roleIconBox, { backgroundColor: '#E6F0FF' }]}>
              <Ionicons name="shield-checkmark" size={24} color="#3399FF" />
            </View>
            <View style={styles.roleText}>
              <Text style={styles.roleTitle}>Admins</Text>
              <Text style={styles.roleSub}>Help manage and moderate</Text>
            </View>
          </View>

          <View style={styles.roleItem}>
            <View style={[styles.roleIconBox, { backgroundColor: '#F0E6FF' }]}>
              <Ionicons name="people" size={24} color="#9933FF" />
            </View>
            <View style={styles.roleText}>
              <Text style={styles.roleTitle}>Members</Text>
              <Text style={styles.roleSub}>Core members to start the{"\n"}community</Text>
            </View>
          </View>

          <View style={[styles.roleItem, { borderBottomWidth: 0 }]}>
            <View style={[styles.roleIconBox, { backgroundColor: '#E6FFEB' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#33CC33" />
            </View>
            <View style={styles.roleText}>
              <Text style={styles.roleTitle}>Consensus Activated</Text>
              <Text style={styles.roleSub}>Community activates after{"\n"}invited team members join</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Community</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.tabsContainer}>
          <View style={styles.activeTab}><Text style={styles.activeTabText}>My Communities</Text></View>
          <View style={styles.inactiveTab}><Text style={styles.inactiveTabText}>Discover</Text></View>
        </View>

        <View style={styles.landingIllustBox}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800' }}
            style={styles.landingIllust}
          />
        </View>

        <Text style={styles.landingTitle}>Build your local community</Text>
        <Text style={styles.landingSub}>Bring people together, share{"\n"}updates and make an impact.</Text>

        <TouchableOpacity style={styles.mainCreateButton} onPress={handleNext}>
          <Ionicons name="add" size={24} color="#FFF" />
          <Text style={styles.mainCreateButtonText}>Create Community</Text>
        </TouchableOpacity>

        <View style={styles.howItWorks}>
          <Text style={styles.howTitle}>How it works?</Text>
          <View style={styles.howStep}>
            <View style={styles.howDot} />
            <Text style={styles.howText}>Invite team members (Admins & Members)</Text>
          </View>
          <View style={styles.howStep}>
            <View style={styles.howDot} />
            <Text style={styles.howText}>Everyone confirms their role</Text>
          </View>
          <View style={styles.howStep}>
            <View style={styles.howDot} />
            <Text style={styles.howText}>Community goes live!</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Create Community</Text>
          <Text style={styles.stepIndicator}>Step 1 of 5</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Select Community Type</Text>

        {[
          { id: 'Local/Community', title: 'Local/Community', sub: 'For people in the same city or area.', icon: 'people' },
          { id: 'Spiritual / Bhajan', title: 'Spiritual / Bhajan', sub: 'For kirtans, satsang, bhajan groups.', icon: 'pray' },
          { id: 'Seva / Volunteer', title: 'Seva / Volunteer', sub: 'For seva, donations and help activities.', icon: 'hand-heart' },
          { id: 'Youth / Student', title: 'Youth / Student', sub: 'For youth learning and activities.', icon: 'school' },
          { id: 'Other', title: 'Other', sub: 'Any other purpose.', icon: 'apps' }
        ].map(item => (
          <TouchableOpacity
            key={item.id}
            style={[styles.typeCard, formData.type === item.id && styles.selectedTypeCard]}
            onPress={() => setFormData({ ...formData, type: item.id })}
          >
            <View style={[styles.typeIconBox, { backgroundColor: formData.type === item.id ? '#FFF' : '#FFF5E6' }]}>
              {item.icon === 'pray' ? (
                <FontAwesome5 name="pray" size={20} color="#FF6600" />
              ) : item.icon === 'hand-heart' ? (
                <MaterialCommunityIcons name="hand-heart" size={24} color="#FF6600" />
              ) : (
                <Ionicons name={item.icon as any} size={24} color="#FF6600" />
              )}
            </View>
            <View style={styles.typeText}>
              <Text style={styles.typeTitle}>{item.title}</Text>
              <Text style={styles.typeSub}>{item.sub}</Text>
            </View>
            <View style={[styles.radio, formData.type === item.id && styles.radioSelected]}>
              {formData.type === item.id && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Create Community</Text>
          <Text style={styles.stepIndicator}>Step 2 of 5</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Basic Information</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Community Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter community name"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            maxLength={100}
          />
          <Text style={styles.charCount}>{formData.name.length}/100</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Short Name (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="E.g. Indore Seva Group"
            value={formData.short_name}
            onChangeText={(text) => setFormData({ ...formData, short_name: text })}
            maxLength={50}
          />
          <Text style={styles.charCount}>{formData.short_name.length}/50</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell people what this community is about"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <Text style={styles.charCount}>{formData.description.length}/500</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Location (City) *</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowCityPicker(!showCityPicker)}
          >
            <Text style={formData.city ? styles.selectorText : styles.selectorPlaceholder}>
              {formData.city || 'Select City'}
            </Text>
            <Ionicons name={showCityPicker ? "chevron-up" : "chevron-down"} size={20} color="#888" />
          </TouchableOpacity>
          {showCityPicker && (
            <View style={styles.dropdown}>
              {CITIES.map(city => (
                <TouchableOpacity
                  key={city}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setFormData({ ...formData, city });
                    setShowCityPicker(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{city}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Area / Locality (Optional)</Text>
          <TouchableOpacity style={styles.selector}>
            <Text style={formData.area ? styles.selectorText : styles.selectorPlaceholder}>
              {formData.area || 'Select area'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#888" />
          </TouchableOpacity>
        </View>
      </ScrollView>
      <TouchableOpacity
        style={[styles.continueButton, !formData.name || !formData.description ? styles.disabledButton : null]}
        onPress={handleNext}
        disabled={!formData.name || !formData.description}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Create Community</Text>
          <Text style={styles.stepIndicator}>Step 3 of 5</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.inputLabel}>Community Picture</Text>
         <TouchableOpacity
           style={styles.imageUploadBox}
           onPress={() => pickImage('photo')}
         >
           {formData.photo ? (
             <Image source={{ uri: formData.photo }} style={styles.previewImage} />
           ) : (
             <>
               <View style={styles.uploadIconBox}>
                  <FontAwesome5 name="image" size={40} color="#FF6600" />
               </View>
               <Text style={styles.uploadText}>Tap to upload Community Photo{"\n"}JPG, PNG up to 5MB</Text>
               <Text style={styles.uploadHint}>This is required</Text>
             </>
           )}
         </TouchableOpacity>

         <Text style={[styles.inputLabel, { marginTop: 24 }]}>Cover Photo (Optional)</Text>
         <TouchableOpacity
           style={styles.imageUploadBox}
           onPress={() => pickImage('cover_photo')}
         >
           {formData.cover_photo ? (
             <Image source={{ uri: formData.cover_photo }} style={styles.previewImageCover} />
           ) : (
             <>
               <View style={styles.uploadIconBox}>
                  <FontAwesome5 name="image" size={40} color="#FF6600" />
               </View>
               <Text style={styles.uploadText}>Tap to upload Cover Photo{"\n"}JPG, PNG up to 5MB</Text>
               <Text style={styles.uploadHint}>Add a banner image</Text>
             </>
           )}
         </TouchableOpacity>

        <View style={[styles.inputGroup, { marginTop: 24 }]}>
          <Text style={styles.inputLabel}>Community Category *</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
          >
            <Text style={formData.category ? styles.selectorText : styles.selectorPlaceholder}>
              {formData.category || 'Select category'}
            </Text>
            <Ionicons name={showCategoryPicker ? "chevron-up" : "chevron-down"} size={20} color="#888" />
          </TouchableOpacity>
          {showCategoryPicker && (
            <View style={styles.dropdown}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setFormData({ ...formData, category: cat });
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep6 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Create Community</Text>
          <Text style={styles.stepIndicator}>Step 5 of 6</Text>
        </View>
      </View>
      <View style={styles.searchHeader}>
        <Text style={styles.selectionTitle}>Select Initial Members</Text>
        <Text style={styles.selectionSub}>Select Admins and Members to start.</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or SL ID"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {usersLoading ? (
        <View style={styles.loadingBox}><ActivityIndicator color="#FF6600" /></View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => {
            const isAdmin = selectedAdmins.find(u => u.id === item.id);
            const isMember = selectedMembers.find(u => u.id === item.id);
            return (
              <TouchableOpacity
                style={[styles.userItem, (isAdmin || isMember) && styles.userItemActive]}
                onPress={() => isAdmin ? toggleAdmin(item) : toggleMember(item)}
              >
                <Avatar name={item.name} photo={item.photo} size={44} />
                <View style={styles.userInfo}>
                   <Text style={styles.userName}>{item.name}</Text>
                   <Text style={styles.userSlId}>{item.sl_id}</Text>
                </View>
                <View style={styles.roleBadges}>
                  <TouchableOpacity
                    style={[styles.roleBadge, isAdmin && styles.roleBadgeActive]}
                    onPress={() => toggleAdmin(item)}
                    disabled={!!isMember}
                  >
                    <Text style={[styles.roleBadgeText, isAdmin && styles.roleBadgeTextActive]}>Admin</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.roleBadge, isMember && styles.roleBadgeActive]}
                    onPress={() => toggleMember(item)}
                    disabled={!!isAdmin}
                  >
                    <Text style={[styles.roleBadgeText, isMember && styles.roleBadgeTextActive]}>Member</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <View style={styles.selectionFooter}>
        <Text style={styles.countInfo}>
          Admins: {selectedAdmins.length} | Members: {selectedMembers.length}
        </Text>
        <TouchableOpacity
          style={[styles.continueButton, (selectedAdmins.length + selectedMembers.length === 0) && styles.disabledButton]}
          onPress={handleNext}
          disabled={selectedAdmins.length + selectedMembers.length === 0}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep7 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Create Community</Text>
          <Text style={styles.stepIndicator}>Step 4 of 5</Text>
        </View>
      </View>
      <View style={styles.searchHeader}>
        <Text style={styles.selectionTitle}>Invite More Members</Text>
        <Text style={styles.selectionSub}>Invite other users to join your community.</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or SL ID"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        data={users.filter(u =>
          !selectedAdmins.find(a => a.id === u.id) &&
          !selectedMembers.find(m => m.id === u.id)
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }) => (
          <View style={styles.userItem}>
            <Avatar name={item.name} photo={item.photo} size={44} />
            <View style={styles.userInfo}>
               <Text style={styles.userName}>{item.name}</Text>
               <Text style={styles.userSlId}>{item.sl_id}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.inviteButton,
                selectedMembers.some(m => m.id === item.id) && { backgroundColor: '#FF6600' }
              ]}
              onPress={() => toggleMember(item)}
            >
              <Text style={[
                styles.inviteButtonText,
                selectedMembers.some(m => m.id === item.id) && { color: '#FFF' }
              ]}>
                {selectedMembers.some(m => m.id === item.id) ? 'Selected' : 'Invite'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
        <Text style={styles.continueButtonText}>Review Details</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep8 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Review Details</Text>
          <Text style={styles.stepIndicator}>Step 6 of 6</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.reviewCard}>
          <Text style={styles.reviewLabel}>COMMUNITY NAME</Text>
          <Text style={styles.reviewValue}>{formData.name}</Text>

          <Text style={[styles.reviewLabel, { marginTop: 16 }]}>TYPE</Text>
          <Text style={styles.reviewValue}>{formData.type}</Text>

          <Text style={[styles.reviewLabel, { marginTop: 16 }]}>DESCRIPTION</Text>
          <Text style={styles.reviewValue}>{formData.description}</Text>

          <Text style={[styles.reviewLabel, { marginTop: 16 }]}>LOCATION</Text>
          <Text style={styles.reviewValue}>{formData.city}{formData.area ? `, ${formData.area}` : ''}</Text>

          <Text style={[styles.reviewLabel, { marginTop: 16 }]}>TEAM MEMBERS</Text>
          <View style={styles.teamList}>
            {selectedAdmins.map(u => (
              <View key={u.id} style={styles.teamItem}>
                 <Avatar name={u.name} photo={u.photo} size={30} />
                 <Text style={styles.teamName}>{u.name} (Admin)</Text>
              </View>
            ))}
            {selectedMembers.map(u => (
              <View key={u.id} style={styles.teamItem}>
                 <Avatar name={u.name} photo={u.photo} size={30} />
                 <Text style={styles.teamName}>{u.name} (Member)</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.infoBox}>
           <Ionicons name="information-circle" size={20} color="#FF6600" />
           <Text style={styles.infoText}>By clicking "Create Community", you agree to our community guidelines and terms.</Text>
        </View>
      </ScrollView>
      <TouchableOpacity
        style={[styles.continueButton, loading && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.continueButtonText}>Create Community</Text>}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
      {step === 5 && renderStep5()}
      {step === 6 && renderStep6()}
      {step === 7 && renderStep7()}
      {step === 8 && renderStep8()}
      {step === 9 && (
        <View style={styles.successContainer}>
           <Ionicons name="checkmark-circle" size={100} color={COLORS.success} />
           <Text style={styles.successTitle}>Request Submitted!</Text>
           <Text style={styles.successSub}>
             Your community group creation request has been initiated. Invitations have been sent to your selected admins and members. Once they all accept, your local community group will be activated and become live!
           </Text>
           <TouchableOpacity style={styles.finishButton} onPress={() => router.replace('/(tabs)/messages')}>
             <Text style={styles.finishButtonText}>Back to Chats</Text>
           </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF7' },
  stepContainer: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 4 },
  headerTitleContainer: { flex: 1, alignItems: 'center', marginRight: 32 },
  headerTitle: { fontSize: 18, fontFamily: FONTS.bold, color: '#000' },
  stepIndicator: { fontSize: 12, color: '#888', marginTop: 2 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20 },
  title: { fontSize: 24, fontFamily: FONTS.bold, color: '#111', lineHeight: 32 },
  subtitle: { fontSize: 14, color: '#666', marginTop: 12, lineHeight: 20 },

  rolesCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginTop: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  roleIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleText: { flex: 1 },
  roleTitle: { fontSize: 16, fontFamily: FONTS.bold, color: '#111' },
  roleSub: { fontSize: 12, color: '#888', marginTop: 2, lineHeight: 16 },

  continueButton: {
    backgroundColor: '#FF6600',
    marginHorizontal: 24,
    marginBottom: 24,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  continueButtonText: { color: '#FFF', fontSize: 16, fontFamily: FONTS.bold },

  // Step 2 Styles
  tabsContainer: { flexDirection: 'row', marginTop: 10, marginBottom: 20 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#FF6600', paddingBottom: 8, marginRight: 20 },
  activeTabText: { fontSize: 15, fontFamily: FONTS.bold, color: '#000' },
  inactiveTab: { paddingBottom: 8 },
  inactiveTabText: { fontSize: 15, color: '#888' },
  landingIllustBox: {
    height: 200,
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
  },
  landingIllust: { width: '100%', height: '100%' },
  landingTitle: { fontSize: 20, fontFamily: FONTS.bold, color: '#000', textAlign: 'center' },
  landingSub: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  mainCreateButton: {
    backgroundColor: '#FF6600',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  mainCreateButtonText: { color: '#FFF', fontSize: 15, fontFamily: FONTS.bold },
  howItWorks: { marginTop: 30 },
  howTitle: { fontSize: 16, fontFamily: FONTS.bold, color: '#000', marginBottom: 12 },
  howStep: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  howDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF6600', marginRight: 12 },
  howText: { fontSize: 13, color: '#333' },

  // Step 3 Styles
  sectionTitle: { fontSize: 18, fontFamily: FONTS.bold, color: '#000', marginBottom: 20 },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  selectedTypeCard: { borderColor: '#FF6600', backgroundColor: '#FFF9F5' },
  typeIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  typeText: { flex: 1 },
  typeTitle: { fontSize: 15, fontFamily: FONTS.bold, color: '#111' },
  typeSub: { fontSize: 12, color: '#888', marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#DDD', justifyContent: 'center', alignItems: 'center' },
  radioSelected: { borderColor: '#FF6600' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF6600' },

  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  successTitle: { fontSize: 24, fontFamily: FONTS.bold, color: '#000', marginTop: 24 },
  successSub: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 12, lineHeight: 24 },
  finishButton: { backgroundColor: '#FF6600', width: '100%', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  finishButtonText: { color: '#FFF', fontSize: 16, fontFamily: FONTS.bold },

  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontFamily: FONTS.bold, color: '#333', marginBottom: 8 },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 15,
    color: '#000',
  },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 12 },
  charCount: { alignSelf: 'flex-end', fontSize: 10, color: '#888', marginTop: 4 },
  selector: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: { fontSize: 15, color: '#000' },
  selectorPlaceholder: { fontSize: 15, color: '#888' },
  disabledButton: { backgroundColor: '#FFCCB3' },

   imageUploadBox: {
     backgroundColor: '#FFF9F5',
     borderWidth: 2,
     borderColor: '#FF6600',
     borderRadius: 20,
     padding: 24,
     alignItems: 'center',
     borderStyle: 'dashed',
     elevation: 3,
     shadowColor: '#FF6600',
     shadowOpacity: 0.1,
     shadowRadius: 8,
     shadowOffset: { width: 0, height: 2 },
   },
   uploadIconBox: {
     width: 70,
     height: 70,
     borderRadius: 35,
     backgroundColor: '#FFE8D4',
     justifyContent: 'center',
     alignItems: 'center',
     marginBottom: 12,
     elevation: 3,
     shadowColor: '#FF6600',
     shadowOpacity: 0.15,
     shadowRadius: 8,
     shadowOffset: { width: 0, height: 2 },
   },
   uploadText: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 18 },
   uploadHint: { fontSize: 11, color: '#FF6600', fontFamily: FONTS.semiBold, textAlign: 'center', marginTop: 6 },
   previewImage: { width: 100, height: 100, borderRadius: 50 },
  previewImageCover: { width: '100%', height: 120, borderRadius: 12 },
  dropdown: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 12,
    marginTop: 4,
    paddingVertical: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 12 },
  dropdownItemText: { fontSize: 14, color: '#333' },

  searchHeader: { paddingHorizontal: 24, paddingBottom: 16 },
  selectionTitle: { fontSize: 20, fontFamily: FONTS.bold, color: '#000' },
  selectionSub: { fontSize: 13, color: '#666', marginTop: 4, marginBottom: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#000' },
  loadingBox: { padding: 40, alignItems: 'center' },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  userItemActive: { borderColor: '#FF6600', backgroundColor: '#FFF9F5' },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { fontSize: 15, fontFamily: FONTS.bold, color: '#111' },
  userSlId: { fontSize: 12, color: '#888', marginTop: 2 },
  roleBadges: { flexDirection: 'row', gap: 6 },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  roleBadgeActive: { backgroundColor: '#FF6600' },
  roleBadgeText: { fontSize: 11, color: '#666', fontFamily: FONTS.medium },
  roleBadgeTextActive: { color: '#FFF' },
  selectionFooter: { padding: 16, borderTopWidth: 1, borderTopColor: '#EEE', backgroundColor: '#FFF' },
  countInfo: { textAlign: 'center', fontSize: 13, color: '#666', marginBottom: 12 },
  inviteButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FFF5E6',
    borderWidth: 1,
    borderColor: '#FFE8D4',
  },
  inviteButtonText: { fontSize: 12, color: '#FF6600', fontFamily: FONTS.bold },

  reviewCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EEE',
    marginBottom: 20,
  },
  reviewLabel: { fontSize: 10, fontFamily: FONTS.bold, color: '#888', letterSpacing: 1 },
  reviewValue: { fontSize: 16, fontFamily: FONTS.medium, color: '#000', marginTop: 4 },
  teamList: { marginTop: 12, gap: 10 },
  teamItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  teamName: { fontSize: 14, color: '#333' },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF5E6',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 40,
  },
  infoText: { flex: 1, fontSize: 12, color: '#666', lineHeight: 18 },
});
