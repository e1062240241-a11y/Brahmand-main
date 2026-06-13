import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgXml } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';

import { getNakshatraReport, searchBirthCity, updateExtendedProfile, saveKundliProfile, getSavedKundlis, deleteSavedKundli } from '../src/services/api';
import { BORDER_RADIUS, COLORS, SPACING } from '../src/constants/theme';
import { useAuthStore } from '../src/store/authStore';
import { BrandedLoading } from '../src/components/BrandedLoading';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_SIZE = SCREEN_WIDTH - 80;

const ASTRO_TABS = [
  { key: 'charts', label: 'Vedic Charts', icon: 'grid-outline' },
  { key: 'planets', label: 'Planets', icon: 'planet-outline' },
  { key: 'doshas', label: 'Doshas', icon: 'warning-outline' },
  { key: 'dashas', label: 'Dasha Timings', icon: 'time-outline' },
  { key: 'remedies', label: 'Remedies', icon: 'color-palette-outline' },
];

export default function AstrologyScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Birth Details Input Fields
  const [name, setName] = useState(user?.name || '');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [dob, setDob] = useState(user?.date_of_birth || '');
  const [tob, setTob] = useState(user?.time_of_birth || '');
  const [lat, setLat] = useState(user?.place_of_birth_latitude?.toString() || user?.home_location?.latitude?.toString() || '28.6139');
  const [lon, setLon] = useState(user?.place_of_birth_longitude?.toString() || user?.home_location?.longitude?.toString() || '77.2090');
  const [tz, setTz] = useState('5.5');

  // Date/Time Picker helper and states
  const parseDateTime = (dateStr: string, timeStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hours, minutes] = timeStr.split(':').map(Number);
      if (year && month && day) {
        return new Date(year, month - 1, day, hours || 12, minutes || 0);
      }
    } catch (e) {}
    return new Date();
  };

  const [dateVal, setDateVal] = useState<Date>(() => parseDateTime(user?.date_of_birth || '', user?.time_of_birth || ''));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // City Search State
  const [cityQuery, setCityQuery] = useState('');
  const [selectedCityName, setSelectedCityName] = useState('');
  const [cityResults, setCityResults] = useState<any[]>([]);
  const [searchingCity, setSearchingCity] = useState(false);
  
  const [showForm, setShowForm] = useState(true);
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('charts');
  const [activeChartDiv, setActiveChartDiv] = useState<'D1' | 'D9'>('D1');
  const [selectedDosha, setSelectedDosha] = useState<any>(null);

  // Tab mode: 'my_profile' | 'new_chart' | 'saved_profiles'
  const [activeModeTab, setActiveModeTab] = useState<'my_profile' | 'new_chart' | 'saved_profiles'>('my_profile');
  const [savedProfiles, setSavedProfiles] = useState<any[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  // Freezed variables for result card
  const [submittedName, setSubmittedName] = useState(user?.name || '');
  const [submittedGender, setSubmittedGender] = useState(user?.gender || 'male');
  const [submittedDob, setSubmittedDob] = useState(user?.date_of_birth || '');
  const [submittedTob, setSubmittedTob] = useState(user?.time_of_birth || '');

  const isMountedRef = useRef(true);

  const fetchSavedProfiles = useCallback(async () => {
    setLoadingProfiles(true);
    try {
      const response = await getSavedKundlis();
      setSavedProfiles(response.data || []);
    } catch (err) {
      console.log('Failed to fetch saved profiles:', err);
    } finally {
      if (isMountedRef.current) {
        setLoadingProfiles(false);
      }
    }
  }, []);

  const handleDeleteProfile = async (id: string) => {
    try {
      await deleteSavedKundli(id);
      fetchSavedProfiles();
    } catch (err) {
      console.log('Failed to delete saved profile:', err);
    }
  };

  useEffect(() => {
    if (activeModeTab === 'saved_profiles') {
      fetchSavedProfiles();
    }
  }, [activeModeTab, fetchSavedProfiles]);

  useEffect(() => {
    if (activeModeTab === 'my_profile' && user) {
      setName(user.name || '');
      setGender((user.gender as any) || 'male');
      setDob(user.date_of_birth || '');
      setTob(user.time_of_birth || '');
      setLat(user.place_of_birth_latitude?.toString() || user.home_location?.latitude?.toString() || '28.6139');
      setLon(user.place_of_birth_longitude?.toString() || user.home_location?.longitude?.toString() || '77.2090');
      setCityQuery(user.place_of_birth || '');
      setSelectedCityName(user.place_of_birth || '');
      if (user.date_of_birth) {
        setDateVal(parseDateTime(user.date_of_birth, user.time_of_birth || ''));
      }
    }
  }, [activeModeTab, user]);

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDateVal(prev => {
        const newDate = new Date(prev);
        newDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        return newDate;
      });
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const d = String(selectedDate.getDate()).padStart(2, '0');
      setDob(`${y}-${m}-${d}`);
    }
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowTimePicker(false);
    }
    if (selectedDate) {
      setDateVal(prev => {
        const newDate = new Date(prev);
        newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
        return newDate;
      });
      const h = String(selectedDate.getHours()).padStart(2, '0');
      const min = String(selectedDate.getMinutes()).padStart(2, '0');
      setTob(`${h}:${min}`);
    }
  };

  const handleCitySearch = useCallback(async () => {
    if (!cityQuery.trim() || cityQuery.trim().length < 2) return;
    try {
      setSearchingCity(true);
      setError('');
      const response = await searchBirthCity(cityQuery.trim());
      const results = response.data?.response || [];
      setCityResults(Array.isArray(results) ? results : []);
      if (results.length === 0) {
        setError('No cities found matching your search. You can still input coordinates manually.');
      }
    } catch (err: any) {
      console.log('City search error:', err);
      setError('City search failed. Please input coordinates manually.');
    } finally {
      if (isMountedRef.current) {
        setSearchingCity(false);
      }
    }
  }, [cityQuery]);

  const handleSelectCity = (city: any) => {
    Keyboard.dismiss();
    const nameVal = city.full_name || city.name;
    setSelectedCityName(nameVal);
    setCityQuery(nameVal);
    setCityResults([]);
    if (city.coordinates && city.coordinates.length >= 2) {
      setLat(city.coordinates[0].toString());
      setLon(city.coordinates[1].toString());
    }
    if (city.tz !== undefined) {
      setTz(city.tz.toString());
    }
  };

  // Debounced Auto-Search for Birth City as User Types
  useEffect(() => {
    if (cityQuery === selectedCityName) {
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      if (cityQuery.trim().length >= 2) {
        handleCitySearch();
      } else {
        setCityResults([]);
      }
    }, 600); // 600ms debounce delay

    return () => clearTimeout(delayDebounceFn);
  }, [cityQuery, selectedCityName, handleCitySearch]);

  // Parse location and query backend
  const handleGenerate = async () => {
    Keyboard.dismiss();
    const dobStr = (dob || '').trim();
    const tobStr = (tob || '').trim();
    const latStr = String(lat || '').trim();
    const lonStr = String(lon || '').trim();
    const tzStr = String(tz || '').trim();

    if (!name.trim()) {
      setError('Please enter your Name');
      return;
    }
    if (!dobStr) {
      setError('Please select your Date of Birth');
      return;
    }
    if (!tobStr) {
      setError('Please select your Time of Birth');
      return;
    }
    if (!latStr || isNaN(Number(latStr)) || !lonStr || isNaN(Number(lonStr))) {
      setError('Please search and select your birth place');
      return;
    }
    if (!tzStr || isNaN(Number(tzStr))) {
      setError('Please enter a valid Timezone Offset');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const params = {
        dob: dobStr,
        tob: tobStr,
        lat: parseFloat(latStr),
        lon: parseFloat(lonStr),
        tz: parseFloat(tzStr),
      };
      
      const response = await getNakshatraReport(params);
      if (isMountedRef.current) {
        setData(response.data || null);
        if (response.data) {
          setShowForm(false);
          setSubmittedName(name);
          setSubmittedGender(gender);
          setSubmittedDob(dobStr);
          setSubmittedTob(tobStr);
        }
      }

      // Update user profile in background if requested
      if (activeModeTab === 'my_profile') {
        try {
          await updateExtendedProfile({
            name: name,
            gender: gender,
            date_of_birth: dobStr,
            time_of_birth: tobStr,
            place_of_birth: cityQuery,
            place_of_birth_latitude: parseFloat(latStr),
            place_of_birth_longitude: parseFloat(lonStr),
          });
          if (user) {
            user.name = name;
            user.gender = gender;
            user.date_of_birth = dobStr;
            user.time_of_birth = tobStr;
            user.place_of_birth_latitude = parseFloat(latStr);
            user.place_of_birth_longitude = parseFloat(lonStr);
          }
        } catch (profileErr) {
          console.log('Failed to update user profile in background:', profileErr);
        }
      } else if (activeModeTab === 'new_chart' && saveToProfile) {
        try {
          await saveKundliProfile({
            name: name,
            gender: gender,
            date_of_birth: dobStr,
            time_of_birth: tobStr,
            place_of_birth: cityQuery,
            place_of_birth_latitude: parseFloat(latStr),
            place_of_birth_longitude: parseFloat(lonStr),
          });
        } catch (saveErr) {
          console.log('Failed to save Kundli profile:', saveErr);
        }
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err?.response?.data?.detail || err?.message || 'Failed to load Kundli report');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleCreateNew = () => {
    setName('');
    setGender('male');
    setDob('');
    setTob('');
    setCityQuery('');
    setSelectedCityName('');
    setLat('28.6139');
    setLon('77.2090');
    setTz('5.5');
    setActiveModeTab('new_chart');
    setShowForm(true);
    setData(null);
  };

  // Pre-load on mount and synchronize state with loaded user profile details
  useEffect(() => {
    isMountedRef.current = true;
    if (user) {
      if (user.name) {
        setName(user.name);
        setSubmittedName(user.name);
      }
      if (user.gender) {
        const g = user.gender.toLowerCase() as any;
        setGender(g);
        setSubmittedGender(g);
      }
      if (user.date_of_birth) {
        setDob(user.date_of_birth);
        setSubmittedDob(user.date_of_birth);
        setDateVal(parseDateTime(user.date_of_birth, user.time_of_birth || ''));
      }
      if (user.time_of_birth) {
        setTob(user.time_of_birth);
        setSubmittedTob(user.time_of_birth);
      }
      
      const userLat = user.place_of_birth_latitude?.toString() || user.home_location?.latitude?.toString();
      if (userLat) setLat(userLat);
      
      const userLon = user.place_of_birth_longitude?.toString() || user.home_location?.longitude?.toString();
      if (userLon) setLon(userLon);
      
      if (user.date_of_birth && user.time_of_birth) {
        const fetchDefault = async () => {
          try {
            setError('');
            setLoading(true);
            const params = {
              dob: user.date_of_birth,
              tob: user.time_of_birth,
              lat: parseFloat(userLat || '28.6139'),
              lon: parseFloat(userLon || '77.2090'),
              tz: 5.5,
            };
            const response = await getNakshatraReport(params);
            if (isMountedRef.current) {
              setData(response.data || null);
              if (response.data) {
                setShowForm(false);
                setSubmittedName(user.name || '');
                setSubmittedGender(user.gender?.toLowerCase() as any || 'male');
                setSubmittedDob(user.date_of_birth || '');
                setSubmittedTob(user.time_of_birth || '');
              }
            }
          } catch (err: any) {
            if (isMountedRef.current) {
              setError(err?.response?.data?.detail || err?.message || 'Failed to load Kundli report');
            }
          } finally {
            if (isMountedRef.current) {
              setLoading(false);
            }
          }
        };
        fetchDefault();
      }
    }
    return () => { isMountedRef.current = false; };
  }, [user]);

  const getMoonDetails = () => {
    const planets = data?.planets?.response;
    const planetsList = Array.isArray(planets) ? planets : [];
    const moon = planetsList.find((p: any) => p.name?.toLowerCase() === 'moon');
    const ascendant = planetsList.find((p: any) => p.name?.toLowerCase() === 'ascendant');
    
    return {
      nakshatra: moon?.nakshatra || '-',
      rashi: moon?.sign || '-',
      ascendant: ascendant?.sign || '-',
    };
  };

  const isDashaActive = (startStr: string, endStr: string) => {
    try {
      const parseDate = (dStr: string) => {
        const parts = dStr.split('-');
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      };
      const start = parseDate(startStr);
      const end = parseDate(endStr);
      const now = new Date();
      return now >= start && now <= end;
    } catch {
      return false;
    }
  };

  const { nakshatra, rashi, ascendant } = getMoonDetails();

  return (
    <LinearGradient 
      colors={['#FF8D57', '#EA9B76', '#FFEEE5']} 
      locations={[0, 0.2, 0.8]} 
      style={styles.container}
    >
      <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#5A3E2B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Janam Kundli</Text>
          {data ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity onPress={() => setShowForm(!showForm)} style={styles.editBtn}>
                <Ionicons name={showForm ? "chevron-up" : "create-outline"} size={20} color="#C67C4E" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateNew} style={styles.editBtn}>
                <Ionicons name="add" size={22} color="#C67C4E" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Birth Details Input Form Card */}
          {showForm && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Enter Birth Details</Text>
              
              <View style={styles.tabSelectorContainer}>
                <TouchableOpacity
                  style={[styles.tabSelectorBtn, activeModeTab === 'my_profile' && styles.tabSelectorBtnActive]}
                  onPress={() => setActiveModeTab('my_profile')}
                >
                  <Text style={[styles.tabSelectorText, activeModeTab === 'my_profile' && styles.tabSelectorTextActive]}>
                    My Profile
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabSelectorBtn, activeModeTab === 'new_chart' && styles.tabSelectorBtnActive]}
                  onPress={() => setActiveModeTab('new_chart')}
                >
                  <Text style={[styles.tabSelectorText, activeModeTab === 'new_chart' && styles.tabSelectorTextActive]}>
                    New Chart
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabSelectorBtn, activeModeTab === 'saved_profiles' && styles.tabSelectorBtnActive]}
                  onPress={() => setActiveModeTab('saved_profiles')}
                >
                  <Text style={[styles.tabSelectorText, activeModeTab === 'saved_profiles' && styles.tabSelectorTextActive]}>
                    Saved
                  </Text>
                </TouchableOpacity>
              </View>

              {activeModeTab === 'saved_profiles' ? (
                <View style={{ marginTop: 10 }}>
                  {loadingProfiles ? (
                    <BrandedLoading message="Loading saved profiles..." />
                  ) : savedProfiles.length === 0 ? (
                    <View style={styles.emptySavedContainer}>
                      <Ionicons name="folder-open-outline" size={40} color="#A88876" style={{ marginBottom: 10 }} />
                      <Text style={styles.emptySavedText}>No saved profiles yet.</Text>
                      <Text style={styles.emptySavedSub}>Generate a new Kundli with "Save this profile" checked to save details here.</Text>
                    </View>
                  ) : (
                    savedProfiles.map((item, idx) => (
                      <View key={item.id || idx} style={styles.savedProfileItemCard}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={styles.savedProfileName}>{item.name}</Text>
                          <Text style={styles.savedProfileSub}>
                            {item.gender?.toUpperCase()} | {item.date_of_birth} | {item.time_of_birth}
                          </Text>
                          <Text style={styles.savedProfileSub} numberOfLines={1}>
                            {item.place_of_birth}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <TouchableOpacity
                            style={styles.savedProfileLoadBtn}
                            onPress={() => {
                              setName(item.name || '');
                              setGender(item.gender?.toLowerCase() as any || 'male');
                              setDob(item.date_of_birth || '');
                              setTob(item.time_of_birth || '');
                              setLat(item.place_of_birth_latitude?.toString() || '28.6139');
                              setLon(item.place_of_birth_longitude?.toString() || '77.2090');
                              setCityQuery(item.place_of_birth || '');
                              setSelectedCityName(item.place_of_birth || '');
                              if (item.date_of_birth) {
                                setDateVal(parseDateTime(item.date_of_birth, item.time_of_birth || ''));
                              }
                              setActiveModeTab('new_chart');
                            }}
                          >
                            <Text style={styles.savedProfileLoadText}>Load</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.savedProfileDeleteBtn}
                            onPress={() => handleDeleteProfile(item.id)}
                          >
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              ) : (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>FIRST NAME</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter First Name"
                      placeholderTextColor="#A88876"
                      value={name}
                      onChangeText={setName}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>GENDER</Text>
                    <View style={styles.genderContainer}>
                      {(['male', 'female', 'other'] as const).map((g) => {
                        const isActive = gender === g;
                        return (
                          <TouchableOpacity
                            key={g}
                            onPress={() => setGender(g)}
                            style={[styles.genderButton, isActive && styles.genderButtonActive]}
                          >
                            <Text style={[styles.genderButtonText, isActive && styles.genderButtonTextActive]}>
                              {g.charAt(0).toUpperCase() + g.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>DATE OF BIRTH</Text>
                    {Platform.OS === 'web' ? (
                      <TextInput
                        style={styles.input}
                        placeholder="YYYY-MM-DD (e.g. 1995-05-15)"
                        placeholderTextColor="#A88876"
                        value={dob}
                        onChangeText={(val) => {
                          setDob(val);
                          const parsed = parseDateTime(val, tob);
                          if (parsed && !isNaN(parsed.getTime())) {
                            setDateVal(parsed);
                          }
                        }}
                        {...Platform.select({
                          web: { type: 'date' } as any,
                          default: {}
                        })}
                      />
                    ) : (
                      <>
                        <TouchableOpacity 
                          style={styles.pickerButton} 
                          onPress={() => {
                            if (!dateVal || isNaN(dateVal.getTime())) {
                              setDateVal(new Date());
                            }
                            setShowDatePicker(true);
                          }}
                        >
                          <Ionicons name="calendar-outline" size={20} color="#C67C4E" style={{ marginRight: 8 }} />
                          <Text style={dob ? styles.pickerButtonText : styles.pickerButtonPlaceholder}>
                            {dob ? dob : 'Select Date of Birth'}
                          </Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                          Platform.OS === 'ios' ? (
                            <Modal visible={showDatePicker} transparent animationType="fade">
                              <TouchableOpacity 
                                style={styles.modalOverlay}
                                activeOpacity={1}
                                onPress={() => setShowDatePicker(false)}
                              >
                                <TouchableOpacity activeOpacity={1} style={styles.modalPickerContainer}>
                                  <DateTimePicker
                                    value={dateVal}
                                    mode="date"
                                    display="inline"
                                    onChange={(event, selectedDate) => {
                                      if (selectedDate) {
                                        setDateVal(selectedDate);
                                        const y = selectedDate.getFullYear();
                                        const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                        const d = String(selectedDate.getDate()).padStart(2, '0');
                                        setDob(`${y}-${m}-${d}`);
                                      }
                                    }}
                                  />
                                  <TouchableOpacity 
                                    style={styles.modalDoneBtn} 
                                    onPress={() => setShowDatePicker(false)}
                                  >
                                    <Text style={styles.modalDoneText}>Done</Text>
                                  </TouchableOpacity>
                                </TouchableOpacity>
                              </TouchableOpacity>
                            </Modal>
                          ) : (
                            <DateTimePicker
                              value={dateVal}
                              mode="date"
                              display="default"
                              onChange={onDateChange}
                            />
                          )
                        )}
                      </>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>TIME OF BIRTH</Text>
                    {Platform.OS === 'web' ? (
                      <TextInput
                        style={styles.input}
                        placeholder="HH:MM (24-hour, e.g. 14:30)"
                        placeholderTextColor="#A88876"
                        value={tob}
                        onChangeText={(val) => {
                          setTob(val);
                          const parsed = parseDateTime(dob, val);
                          if (parsed && !isNaN(parsed.getTime())) {
                            setDateVal(parsed);
                          }
                        }}
                        {...Platform.select({
                          web: { type: 'time' } as any,
                          default: {}
                        })}
                      />
                    ) : (
                      <>
                        <TouchableOpacity 
                          style={styles.pickerButton} 
                          onPress={() => {
                            if (!dateVal || isNaN(dateVal.getTime())) {
                              setDateVal(new Date());
                            }
                            setShowTimePicker(true);
                          }}
                        >
                          <Ionicons name="time-outline" size={20} color="#C67C4E" style={{ marginRight: 8 }} />
                          <Text style={tob ? styles.pickerButtonText : styles.pickerButtonPlaceholder}>
                            {tob ? tob : 'Select Time of Birth'}
                          </Text>
                        </TouchableOpacity>
                        {showTimePicker && (
                          Platform.OS === 'ios' ? (
                            <Modal visible={showTimePicker} transparent animationType="fade">
                              <TouchableOpacity 
                                style={styles.modalOverlay}
                                activeOpacity={1}
                                onPress={() => setShowTimePicker(false)}
                              >
                                <TouchableOpacity activeOpacity={1} style={styles.modalPickerContainer}>
                                  <DateTimePicker
                                    value={dateVal}
                                    mode="time"
                                    display="spinner"
                                    is24Hour={true}
                                    onChange={(event, selectedDate) => {
                                      if (selectedDate) {
                                        setDateVal(selectedDate);
                                        const h = String(selectedDate.getHours()).padStart(2, '0');
                                        const min = String(selectedDate.getMinutes()).padStart(2, '0');
                                        setTob(`${h}:${min}`);
                                      }
                                    }}
                                  />
                                  <TouchableOpacity 
                                    style={styles.modalDoneBtn} 
                                    onPress={() => setShowTimePicker(false)}
                                  >
                                    <Text style={styles.modalDoneText}>Done</Text>
                                  </TouchableOpacity>
                                </TouchableOpacity>
                              </TouchableOpacity>
                            </Modal>
                          ) : (
                            <DateTimePicker
                              value={dateVal}
                              mode="time"
                              display="default"
                              is24Hour={true}
                              onChange={onTimeChange}
                            />
                          )
                        )}
                      </>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>SEARCH BIRTH PLACE / CITY</Text>
                    <View style={styles.searchRow}>
                      <TextInput
                        style={[styles.input, { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
                        placeholder="e.g. Mumbai, Delhi"
                        placeholderTextColor="#A88876"
                        value={cityQuery}
                        onChangeText={(val) => {
                          setCityQuery(val);
                          if (val.trim() === '') setCityResults([]);
                        }}
                        onSubmitEditing={handleCitySearch}
                      />
                      <TouchableOpacity 
                        style={styles.searchBtn} 
                        onPress={handleCitySearch}
                        disabled={searchingCity}
                      >
                        <Ionicons name="search" size={20} color="#FFF" />
                      </TouchableOpacity>
                    </View>

                    {cityResults.length > 0 && (
                      <View style={styles.searchResultsContainer}>
                        <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
                          {cityResults.map((item, idx) => (
                            <TouchableOpacity
                              key={idx}
                              style={styles.searchResultItem}
                              onPress={() => handleSelectCity(item)}
                            >
                              <Ionicons name="location-outline" size={16} color="#C67C4E" style={{ marginRight: 8 }} />
                              <View style={{ flex: 1 }}>
                                <Text style={styles.cityNameText}>{item.full_name || item.name}</Text>
                                <Text style={styles.citySubText}>
                                  Lat: {item.coordinates?.[0]} | Lon: {item.coordinates?.[1]}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>

                  {activeModeTab === 'new_chart' && (
                    <TouchableOpacity
                      style={styles.checkboxContainer}
                      onPress={() => setSaveToProfile(!saveToProfile)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={saveToProfile ? "checkbox" : "square-outline"}
                        size={20}
                        color={saveToProfile ? "#C67C4E" : "#8A7163"}
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.checkboxLabel}>Save this profile to my saved list</Text>
                    </TouchableOpacity>
                  )}

                  {error ? (
                    <View style={styles.errorBanner}>
                      <Ionicons name="alert-circle" size={18} color="#EF4444" style={{ marginRight: 6 }} />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate}>
                    <LinearGradient
                      colors={['#FF8D57', '#C67C4E']}
                      style={styles.gradientBtn}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.generateBtnText}>Generate Kundli</Text>
                      <Ionicons name="sparkles-outline" size={18} color="#FFF" style={{ marginLeft: 8 }} />
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {loading && (
            <View style={styles.loadingWrapper}>
              <BrandedLoading message="Aligning stars and charts..." />
            </View>
          )}

          {/* Render Kundli Dashboard if we have data and we're not loading */}
          {!loading && data && (
            <>
              {/* Personalized Header Card */}
              <View style={styles.personHeaderCard}>
                <View style={styles.personInfoRow}>
                  <Ionicons name="person-circle-outline" size={44} color="#C67C4E" style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.personName}>{`${submittedName || 'Guest'}'s Janam Kundli`}</Text>
                    <Text style={styles.personDetails}>
                      {submittedGender ? submittedGender.toUpperCase() : 'MALE'} | {submittedDob} | {submittedTob}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowForm(true)}
                    style={styles.headerCardEditBtn}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="create-outline" size={16} color="#C67C4E" style={{ marginRight: 4 }} />
                    <Text style={styles.headerCardEditText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Basic Nakshatra/Rashi Info Card */}
              <View style={styles.insightsCard}>
                <View style={styles.insightBox}>
                  <Text style={styles.insightLabel}>NAKSHATRA</Text>
                  <Text style={styles.insightValue}>{nakshatra}</Text>
                </View>
                <View style={styles.insightDivider} />
                <View style={styles.insightBox}>
                  <Text style={styles.insightLabel}>RASHI</Text>
                  <Text style={styles.insightValue}>{rashi}</Text>
                </View>
                <View style={styles.insightDivider} />
                <View style={styles.insightBox}>
                  <Text style={styles.insightLabel}>LAGNA</Text>
                  <Text style={styles.insightValue}>{ascendant}</Text>
                </View>
              </View>

              {/* Dashboard Tab Navigation */}
              <View style={styles.tabsWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScrollContent}>
                  {ASTRO_TABS.map((tab) => {
                    const isActive = activeTab === tab.key;
                    return (
                      <TouchableOpacity
                        key={tab.key}
                        onPress={() => setActiveTab(tab.key)}
                        style={[styles.tabButton, isActive && styles.tabButtonActive]}
                      >
                        <Ionicons 
                          name={tab.icon as any} 
                          size={16} 
                          color={isActive ? '#FFF' : '#7A5C4A'} 
                          style={{ marginRight: 6 }}
                        />
                        <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
                          {tab.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Tab Contents */}
              <View style={styles.tabContentWrapper}>
                
                {/* 1. Charts Tab */}
                {activeTab === 'charts' && (
                  <View style={styles.section}>
                    <View style={styles.chartToggleRow}>
                      <TouchableOpacity 
                        onPress={() => setActiveChartDiv('D1')} 
                        style={[styles.chartToggleBtn, activeChartDiv === 'D1' && styles.chartToggleBtnActive]}
                      >
                        <Text style={[styles.chartToggleText, activeChartDiv === 'D1' && styles.chartToggleTextActive]}>
                          Rasi Chart (D1)
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => setActiveChartDiv('D9')} 
                        style={[styles.chartToggleBtn, activeChartDiv === 'D9' && styles.chartToggleBtnActive]}
                      >
                        <Text style={[styles.chartToggleText, activeChartDiv === 'D9' && styles.chartToggleTextActive]}>
                          Navamsha Chart (D9)
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.chartContainer}>
                       {activeChartDiv === 'D1' ? (
                        data.chart_d1 ? (
                          <SvgXml xml={data.chart_d1.trim()} width={CHART_SIZE} height={CHART_SIZE} />
                        ) : (
                          <Text style={styles.noDataText}>Rasi Chart rendering not available</Text>
                        )
                      ) : (
                        data.chart_d9 ? (
                          <SvgXml xml={data.chart_d9.trim()} width={CHART_SIZE} height={CHART_SIZE} />
                        ) : (
                          <Text style={styles.noDataText}>Navamsha Chart rendering not available</Text>
                        )
                      )}
                    </View>
                    <Text style={styles.chartCaption}>
                      This chart shows the positions of the planets at your exact time and place of birth.
                    </Text>
                  </View>
                )}

                {/* 2. Planets Tab */}
                {activeTab === 'planets' && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Planetary Alignments</Text>
                    {data.planets?.response && Array.isArray(data.planets.response) ? (
                      data.planets.response.map((planet: any, index: number) => (
                        <View key={index} style={styles.planetRowCard}>
                          <View style={styles.planetHeaderRow}>
                            <View style={styles.planetNameCol}>
                              <MaterialCommunityIcons name="star-shooting-outline" size={18} color="#C67C4E" />
                              <Text style={styles.planetName}>{planet.name}</Text>
                            </View>
                            {planet.is_retro === 'true' && (
                              <View style={styles.retroBadge}>
                                <Text style={styles.retroText}>RETROGRADE</Text>
                              </View>
                            )}
                            <Text style={styles.planetDegree}>{planet.norm_degree?.toFixed(2)}°</Text>
                          </View>
                          
                          <View style={styles.planetGrid}>
                            <View style={styles.planetGridCol}>
                              <Text style={styles.planetGridLabel}>SIGN</Text>
                              <Text style={styles.planetGridValue}>{planet.sign}</Text>
                            </View>
                            <View style={styles.planetGridCol}>
                              <Text style={styles.planetGridLabel}>SIGN LORD</Text>
                              <Text style={styles.planetGridValue}>{planet.sign_lord}</Text>
                            </View>
                            <View style={styles.planetGridCol}>
                              <Text style={styles.planetGridLabel}>NAKSHATRA</Text>
                              <Text style={styles.planetGridValue}>{planet.nakshatra}</Text>
                            </View>
                            <View style={styles.planetGridCol}>
                              <Text style={styles.planetGridLabel}>HOUSE</Text>
                              <Text style={styles.planetGridValue}>{planet.house}th House</Text>
                            </View>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.noDataText}>No planetary data available</Text>
                    )}
                  </View>
                )}

                {/* 3. Doshas Tab */}
                {activeTab === 'doshas' && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Dosha Analysis</Text>
                    
                    {/* Manglik */}
                    <TouchableOpacity 
                      onPress={() => setSelectedDosha({
                        title: 'Manglik Dosha',
                        present: data.mangal_dosha?.response?.is_mangal_dosha_present,
                        badge: data.mangal_dosha?.response?.mangal_dosha_type || 'none',
                        desc: data.mangal_dosha?.response?.description || 'Manglik dosha status details.'
                      })}
                      style={styles.doshaCard}
                    >
                      <View style={styles.doshaHeader}>
                        <Text style={styles.doshaTitle}>Manglik Dosha</Text>
                        <View style={[styles.doshaBadge, data.mangal_dosha?.response?.is_mangal_dosha_present ? styles.doshaBadgeDanger : styles.doshaBadgeSafe]}>
                          <Text style={[styles.doshaBadgeText, data.mangal_dosha?.response?.is_mangal_dosha_present ? styles.doshaBadgeTextDanger : styles.doshaBadgeTextSafe]}>
                            {data.mangal_dosha?.response?.is_mangal_dosha_present ? 'Present' : 'Absent'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.doshaBrief} numberOfLines={2}>
                        {data.mangal_dosha?.response?.description || 'View details and calculations of Mars alignment.'}
                      </Text>
                    </TouchableOpacity>

                    {/* Kaal Sarp */}
                    <TouchableOpacity 
                      onPress={() => setSelectedDosha({
                        title: 'Kaal Sarp Dosha',
                        present: data.kaalsarp_dosha?.response?.type !== 'none',
                        badge: data.kaalsarp_dosha?.response?.type || 'none',
                        desc: data.kaalsarp_dosha?.response?.description || data.kaalsarp_dosha?.response?.one_line || 'Kaal Sarp details.'
                      })}
                      style={styles.doshaCard}
                    >
                      <View style={styles.doshaHeader}>
                        <Text style={styles.doshaTitle}>Kaal Sarp Dosha</Text>
                        <View style={[styles.doshaBadge, data.kaalsarp_dosha?.response?.type !== 'none' ? styles.doshaBadgeDanger : styles.doshaBadgeSafe]}>
                          <Text style={[styles.doshaBadgeText, data.kaalsarp_dosha?.response?.type !== 'none' ? styles.doshaBadgeTextDanger : styles.doshaBadgeTextSafe]}>
                            {data.kaalsarp_dosha?.response?.type !== 'none' ? 'Present' : 'Absent'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.doshaBrief} numberOfLines={2}>
                        {data.kaalsarp_dosha?.response?.one_line || 'View details of Rahu and Ketu alignments.'}
                      </Text>
                    </TouchableOpacity>

                    {/* Pitra Dosha */}
                    <TouchableOpacity 
                      onPress={() => setSelectedDosha({
                        title: 'Pitra Dosha',
                        present: data.pitra_dosha?.response?.is_pitra_dosha_present,
                        badge: data.pitra_dosha?.response?.is_pitra_dosha_present ? 'Active' : 'none',
                        desc: data.pitra_dosha?.response?.description || 'Pitra dosha details.'
                      })}
                      style={styles.doshaCard}
                    >
                      <View style={styles.doshaHeader}>
                        <Text style={styles.doshaTitle}>Pitra Dosha</Text>
                        <View style={[styles.doshaBadge, data.pitra_dosha?.response?.is_pitra_dosha_present ? styles.doshaBadgeDanger : styles.doshaBadgeSafe]}>
                          <Text style={[styles.doshaBadgeText, data.pitra_dosha?.response?.is_pitra_dosha_present ? styles.doshaBadgeTextDanger : styles.doshaBadgeTextSafe]}>
                            {data.pitra_dosha?.response?.is_pitra_dosha_present ? 'Present' : 'Absent'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.doshaBrief} numberOfLines={2}>
                        {data.pitra_dosha?.response?.description || 'View ancestors/karmic debts calculations.'}
                      </Text>
                    </TouchableOpacity>

                    {/* Sade Sati */}
                    <TouchableOpacity 
                      onPress={() => setSelectedDosha({
                        title: 'Sade Sati Status',
                        present: data.sadhesati_status?.response?.is_undergoing_sadhesati,
                        badge: data.sadhesati_status?.response?.is_undergoing_sadhesati ? 'Active' : 'none',
                        desc: data.sadhesati_status?.response?.description || 'Sade Sati details.'
                      })}
                      style={styles.doshaCard}
                    >
                      <View style={styles.doshaHeader}>
                        <Text style={styles.doshaTitle}>Saturn Sade Sati</Text>
                        <View style={[styles.doshaBadge, data.sadhesati_status?.response?.is_undergoing_sadhesati ? styles.doshaBadgeDanger : styles.doshaBadgeSafe]}>
                          <Text style={[styles.doshaBadgeText, data.sadhesati_status?.response?.is_undergoing_sadhesati ? styles.doshaBadgeTextDanger : styles.doshaBadgeTextSafe]}>
                            {data.sadhesati_status?.response?.is_undergoing_sadhesati ? 'Active' : 'Inactive'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.doshaBrief} numberOfLines={2}>
                        {data.sadhesati_status?.response?.description || 'View current Sade Sati transit calculations.'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* 4. Dashas Tab */}
                {activeTab === 'dashas' && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Vimshottari Dasha periods</Text>
                    {data.vimshottari_dasha?.response ? (
                      data.vimshottari_dasha.response.map((dasha: any, index: number) => {
                        const active = isDashaActive(dasha.start, dasha.end);
                        return (
                          <View key={index} style={[styles.dashaTimelineCard, active && styles.dashaTimelineCardActive]}>
                            <View style={styles.dashaCardHeader}>
                              <Text style={[styles.dashaPlanetName, active && styles.dashaPlanetActiveText]}>
                                {dasha.dasha} Dasha
                              </Text>
                              {active && (
                                <View style={styles.activeDashaBadge}>
                                  <Text style={styles.activeDashaText}>CURRENTLY ACTIVE</Text>
                                </View>
                              )}
                            </View>
                            <Text style={[styles.dashaDates, active && styles.dashaPlanetActiveText]}>
                              {dasha.start} to {dasha.end}
                            </Text>
                          </View>
                        );
                      })
                    ) : (
                      <Text style={styles.noDataText}>No dasha timeline available</Text>
                    )}
                  </View>
                )}

                {/* 5. Remedies Tab */}
                {activeTab === 'remedies' && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Gemstone Suggestions</Text>
                    
                    {/* Life Stone */}
                    {data.gem_suggestion?.response?.life_stone && (
                      <View style={styles.remedyCard}>
                        <Text style={styles.remedyLabel}>LIFE STONE (LAGNA)</Text>
                        <Text style={styles.remedyValue}>{data.gem_suggestion.response.life_stone.name}</Text>
                        <View style={styles.remedyGrid}>
                          <Text style={styles.remedyGridItem}>Metal: {data.gem_suggestion.response.life_stone.metal}</Text>
                          <Text style={styles.remedyGridItem}>Finger: {data.gem_suggestion.response.life_stone.finger}</Text>
                        </View>
                      </View>
                    )}

                    {/* Lucky Stone */}
                    {data.gem_suggestion?.response?.lucky_stone && (
                      <View style={styles.remedyCard}>
                        <Text style={styles.remedyLabel}>LUCKY STONE (9th LORD)</Text>
                        <Text style={styles.remedyValue}>{data.gem_suggestion.response.lucky_stone.name}</Text>
                        <View style={styles.remedyGrid}>
                          <Text style={styles.remedyGridItem}>Metal: {data.gem_suggestion.response.lucky_stone.metal}</Text>
                          <Text style={styles.remedyGridItem}>Finger: {data.gem_suggestion.response.lucky_stone.finger}</Text>
                        </View>
                      </View>
                    )}

                    <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Rudraksha Recommendation</Text>
                    {data.rudraksha_suggestion?.response ? (
                      <View style={styles.remedyCard}>
                        <Text style={styles.remedyLabel}>RECOMMENDED MUKHI</Text>
                        <Text style={styles.remedyValue}>{data.rudraksha_suggestion.response.recommendation}</Text>
                        <Text style={styles.remedyDesc}>
                          {data.rudraksha_suggestion.response.detail}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.noDataText}>No Rudraksha suggestion available</Text>
                    )}
                  </View>
                )}

              </View>
            </>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Dosha Details Modal */}
      <Modal
        visible={!!selectedDosha}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDosha(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="shield-checkmark" size={32} color="#FFF" />
            </View>
            <Text style={styles.modalTitle}>{selectedDosha?.title}</Text>
            
            <View style={[styles.modalBadge, selectedDosha?.present ? styles.doshaBadgeDanger : styles.doshaBadgeSafe]}>
              <Text style={selectedDosha?.present ? styles.doshaBadgeTextDanger : styles.doshaBadgeTextSafe}>
                {selectedDosha?.present ? 'Presence Detected' : 'No Affliction'}
              </Text>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalDesc}>{selectedDosha?.desc}</Text>
            </ScrollView>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedDosha(null)}>
              <Text style={styles.modalCloseText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
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
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#C67C4E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3F2C20',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#C67C4E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3F2C20',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A88876',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#FAF7F5',
    borderWidth: 1,
    borderColor: '#EFEAE6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#3F2C20',
    fontWeight: '600',
  },
  generateBtn: {
    marginTop: 8,
    borderRadius: 14,
    overflow: 'hidden',
  },
  gradientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  generateBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingWrapper: {
    paddingVertical: 40,
  },
  insightsCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 16,
    shadowColor: '#C67C4E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  insightBox: {
    alignItems: 'center',
    flex: 1,
  },
  insightLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A88876',
    letterSpacing: 0.8,
  },
  insightValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#C67C4E',
    marginTop: 4,
  },
  insightDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#F3EFEB',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  tabsWrapper: {
    marginBottom: 16,
  },
  tabsScrollContent: {
    paddingRight: 16,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 999,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  tabButtonActive: {
    backgroundColor: '#C67C4E',
    borderColor: '#C67C4E',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7A5C4A',
  },
  tabButtonTextActive: {
    color: '#FFF',
  },
  tabContentWrapper: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#C67C4E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3F2C20',
    marginBottom: 16,
  },
  chartToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F5EFEB',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  chartToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  chartToggleBtnActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7A5C4A',
  },
  chartToggleTextActive: {
    color: '#C67C4E',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8F4',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#F7EDE7',
  },
  chartCaption: {
    fontSize: 12,
    color: '#8A7163',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 12,
    paddingHorizontal: 8,
  },
  noDataText: {
    fontSize: 14,
    color: '#8A7163',
    textAlign: 'center',
    paddingVertical: 32,
  },
  planetRowCard: {
    backgroundColor: '#FFFBF9',
    borderWidth: 1,
    borderColor: '#F7EDE7',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  planetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  planetNameCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planetName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3F2C20',
    marginLeft: 6,
  },
  retroBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  retroText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D97706',
  },
  planetDegree: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C67C4E',
  },
  planetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: '#FDFBF9',
    paddingTop: 8,
  },
  planetGridCol: {
    width: '50%',
    paddingVertical: 4,
  },
  planetGridLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#A88876',
  },
  planetGridValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A463B',
    marginTop: 2,
  },
  doshaCard: {
    backgroundColor: '#FFFBF9',
    borderWidth: 1,
    borderColor: '#F7EDE7',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  doshaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  doshaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3F2C20',
  },
  doshaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  doshaBadgeDanger: {
    backgroundColor: '#FEE2E2',
  },
  doshaBadgeSafe: {
    backgroundColor: '#D1FAE5',
  },
  doshaBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  doshaBadgeTextDanger: {
    color: '#EF4444',
  },
  doshaBadgeTextSafe: {
    color: '#10B981',
  },
  doshaBrief: {
    fontSize: 13,
    color: '#7A5C4A',
    lineHeight: 18,
    marginTop: 8,
  },
  dashaTimelineCard: {
    backgroundColor: '#FFFBF9',
    borderWidth: 1,
    borderColor: '#F7EDE7',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  dashaTimelineCardActive: {
    backgroundColor: '#FFF2EB',
    borderColor: '#FFD8C4',
    borderWidth: 1.5,
  },
  dashaCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dashaPlanetName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3F2C20',
  },
  dashaPlanetActiveText: {
    color: '#3F2C20',
  },
  activeDashaBadge: {
    backgroundColor: '#FF7B00',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeDashaText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFF',
  },
  dashaDates: {
    fontSize: 14,
    color: '#7A5C4A',
    marginTop: 6,
  },
  remedyCard: {
    backgroundColor: '#FFFBF9',
    borderWidth: 1,
    borderColor: '#F7EDE7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  remedyLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A88876',
    letterSpacing: 0.5,
  },
  remedyValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#C67C4E',
    marginTop: 4,
  },
  remedyGrid: {
    flexDirection: 'row',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5EFEB',
    paddingTop: 8,
  },
  remedyGridItem: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#5A463B',
  },
  remedyDesc: {
    fontSize: 13,
    color: '#7A5C4A',
    lineHeight: 18,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF7B00',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#FF7B00',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalScroll: {
    maxHeight: 250,
    width: '100%',
    marginBottom: 24,
  },
  modalDesc: {
    color: '#311303',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 24,
  },
  modalCloseBtn: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FF7B00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  modalCloseText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  searchBtn: {
    backgroundColor: '#C67C4E',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultsContainer: {
    backgroundColor: '#FAF7F5',
    borderWidth: 1,
    borderColor: '#EFEAE6',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopWidth: 0,
    marginTop: -2,
    overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EFEB',
  },
  cityNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3F2C20',
  },
  citySubText: {
    fontSize: 11,
    color: '#8A7163',
    marginTop: 2,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    backgroundColor: '#FAF7F5',
    borderWidth: 1,
    borderColor: '#EFEAE6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#C67C4E',
    borderColor: '#C67C4E',
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7A5C4A',
  },
  genderButtonTextActive: {
    color: '#FFF',
  },
  pickerButton: {
    backgroundColor: '#FAF7F5',
    borderWidth: 1,
    borderColor: '#EFEAE6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 15,
    color: '#3F2C20',
    fontWeight: '600',
  },
  pickerButtonPlaceholder: {
    fontSize: 15,
    color: '#A88876',
    fontWeight: '500',
  },
  personHeaderCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#C67C4E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  personInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3F2C20',
  },
  personDetails: {
    fontSize: 12,
    color: '#8A7163',
    marginTop: 2,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
    paddingVertical: 4,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#3F2C20',
    fontWeight: '500',
  },
  modalPickerContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    width: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  modalDoneBtn: {
    marginTop: 15,
    backgroundColor: '#C67C4E',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 30,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  modalDoneText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tabSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#FAF7F5',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFEAE6',
  },
  tabSelectorBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabSelectorBtnActive: {
    backgroundColor: '#C67C4E',
  },
  tabSelectorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8A7163',
  },
  tabSelectorTextActive: {
    color: '#FFF',
  },
  emptySavedContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 16,
  },
  emptySavedText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3F2C20',
    marginBottom: 4,
  },
  emptySavedSub: {
    fontSize: 12,
    color: '#8A7163',
    textAlign: 'center',
    lineHeight: 16,
  },
  savedProfileItemCard: {
    backgroundColor: '#FAF7F5',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EFEAE6',
  },
  savedProfileName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3F2C20',
    marginBottom: 2,
  },
  savedProfileSub: {
    fontSize: 12,
    color: '#8A7163',
    marginTop: 1,
  },
  savedProfileLoadBtn: {
    backgroundColor: '#C67C4E',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  savedProfileLoadText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  savedProfileDeleteBtn: {
    padding: 6,
    backgroundColor: '#FCECEB',
    borderRadius: 8,
  },
  headerCardEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F5',
    borderWidth: 1,
    borderColor: '#EFEAE6',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  headerCardEditText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C67C4E',
  },
  pickerInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F5',
    borderWidth: 1,
    borderColor: '#EFEAE6',
    borderRadius: 12,
    paddingRight: 12,
  },
  pickerTextInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#3F2C20',
    fontWeight: '600',
  },
  pickerIconButton: {
    padding: 8,
  },
});
