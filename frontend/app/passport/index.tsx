import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Dimensions, Platform, TouchableOpacity, ImageBackground } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { usePassportStore } from '../../src/store/passportStore';
import { COLORS, SPACING } from '../../src/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

// Make it vertically taller (approx +2cm) and wider on screens
const baseWidth = windowWidth * 0.42;
let PASSPORT_WIDTH = Math.min(Math.max(baseWidth, 160), 260); // increased width
let PASSPORT_HEIGHT = PASSPORT_WIDTH * 2.25; // significantly increased height multiplier

// Prevent vertical overflow on very small phones
const maxPossibleHeight = windowHeight * 0.68;
if (PASSPORT_HEIGHT > maxPossibleHeight) {
  PASSPORT_HEIGHT = maxPossibleHeight;
  PASSPORT_WIDTH = PASSPORT_HEIGHT / 2.25;
}

const isCompactLayout = windowWidth < 520;

export default function PassportCoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const journeys = usePassportStore((state) => state.journeys);
  const totalJaap = usePassportStore((state) => state.total_jaap);
  const badges = usePassportStore((state) => state.badges);
  const loadPassport = usePassportStore((state) => state.loadPassport);

  const flipAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Generate random secure looking passport ID once
  const pNoTemp = useRef(`BR${Math.floor(100000 + Math.random() * 900000)}`);
  const displayName = (user?.name || 'SEEKER').toUpperCase();
  const displaySl = user?.sl_id ? user.sl_id.toUpperCase().replace(/^SL-/, '') : pNoTemp.current;

  useEffect(() => {
    loadPassport();

    // Constant breathing/pulsing animation for the texts to look magical and alive
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        })
      ])
    ).start();

    // After 3.5 seconds, realistically flip it open
    Animated.sequence([
      Animated.delay(3500),
      Animated.timing(flipAnim, {
        toValue: 1,
        duration: 1500, // slower, smooth realistic book opening
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const coverRotateY = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-180deg'] // Opens fully flat so you can read both pages like a book
  });

  const coverSkewY = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '-4deg', '0deg'] // Softer skew for a more even open book appearance
  });

  const translateY = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10] // Slight upward adjustment when open to balance top/bottom spacing
  });

  const frontCoverOpacity = flipAnim.interpolate({
    inputRange: [0, 0.499, 0.5, 1],
    outputRange: [1, 1, 0, 0] // Hides the cover art once it flips beyond viewing angle
  });

  const insideCoverOpacity = flipAnim.interpolate({
    inputRange: [0, 0.499, 0.5, 1],
    outputRange: [0, 0, 1, 1] // Shows the backface of the cover
  });

  // Keep the open book perfectly centered. 
  // When closed, it is centered (0). When open, shift it right by exactly half a page so the spine aligns to the center.
  const translateX = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, PASSPORT_WIDTH * 0.5]
  });

  // Add subtle table scale zoom effectively focusing on the passport when opened
  const scaleZoom = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1] // Zoom in slightly when opened for a better look at details
  });

  const actionOpacity = flipAnim.interpolate({
    inputRange: [0.7, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });

  const mrzName = displayName.replace(/\s/g, '<').padEnd(30, '<');

  const textPulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1.02] // smooth subtle breathing effect for title
  });

  const textGlowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1] // breathing opacity
  });

  return (
<SafeAreaView style={[styles.container, { paddingBottom: insets.bottom + 12 }]} edges={['top', 'left', 'right', 'bottom']}>
      {/* Attractive Cosmic / Brahmand Background Gradient */}
      <LinearGradient 
        colors={['#0f172a', '#312e81', '#000000']} 
        style={StyleSheet.absoluteFillObject}
      />
      <Animated.View style={[styles.deskArea, { paddingBottom: insets.bottom + 12, transform: [{ scale: scaleZoom }, { translateX }, { translateY }] }]}>
        
        <View style={styles.passportShadowContainer}>
          {/* Inner Pages / Identity Data Page */}
          <View style={styles.innerPage}>
            {/* Subtle paper texture overlay */}
            <ImageBackground 
              source={{ uri: 'https://www.transparenttextures.com/patterns/rice-paper-2.png' }} 
              style={StyleSheet.absoluteFillObject} 
              imageStyle={{ opacity: 0.15 }}
            />
            
            {/* Inner Top Header */}
            <View style={styles.innerHeader}>
              <Text style={styles.innerCountryName}>BRAHMAND PASSPORT</Text>
              <Text style={styles.innerPassportText}>ब्रह्मांड पारपत्र</Text>
            </View>

<View style={[styles.innerContent, isCompactLayout && styles.innerContentColumn]}>
              
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#8b0000', textAlign: 'center', marginBottom: 10 }}>SPIRITUAL RECORD</Text>
                
                <View style={[styles.statsMiniGrid, { borderTopWidth: 0, paddingHorizontal: 10 }]}>
                    <View style={{ alignItems: 'center', marginBottom: 15 }}>
                        <Text style={styles.detailLabelSpace}>Total Journeys</Text>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111' }}>{journeys.length}</Text>
                    </View>
                    <View style={{ alignItems: 'center', marginBottom: 15 }}>
                        <Text style={styles.detailLabelSpace}>Jaap Count</Text>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111' }}>{totalJaap}</Text>
                    </View>
                </View>

                <View style={{ alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)', paddingTop: 15, marginHorizontal: 10 }}>
                    <Text style={styles.detailLabelSpace}>Earned Badges</Text>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111' }}>{badges.length}</Text>
                </View>

                {/* Decorative stamp-like visual */}
                <View style={{ marginTop: 30, alignItems: 'center', opacity: 0.8 }}>
                    <View style={{ width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: '#cca25e', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-15deg' }] }}>
                        <Text style={{ color: '#cca25e', fontSize: 10, fontWeight: 'bold' }}>BRAHMAND</Text>
                        <Text style={{ color: '#cca25e', fontSize: 8 }}>VALID</Text>
                    </View>
                </View>
              </View>

            </View>

            {/* Book Spine Crease Shadow (Right Page) */}
            <LinearGradient
                colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.spineShadowLeft}
            />
          </View>

          {/* FRONT COVER - Positioned on the left boundary and rotated */}
          <Animated.View style={[
            styles.coverPivotWrapper, 
            { transform: [{ perspective: 1200 }, { rotateY: coverRotateY }, { skewY: coverSkewY }] }
          ]}>
            <Animated.View style={[styles.frontCover, { opacity: frontCoverOpacity }]}>
              {/* Deep Maroon / Saffron cover */}
              <LinearGradient
                colors={['#8B0000', '#ea580c', '#4a0404']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              {/* Leathery Overlay fake */}
              <ImageBackground 
                source={{ uri: 'https://www.transparenttextures.com/patterns/leather.png' }} 
                style={StyleSheet.absoluteFillObject} 
                imageStyle={{ opacity: 0.2 }}
              />
              <View style={styles.coverBorder}>
                <View style={[styles.coverInnerBorder, { justifyContent: 'space-between', paddingVertical: 20 }]}>
                    
                    {/* Top Section: Photo and Name */}
                    <View style={{ alignItems: 'center', marginTop: 15 }}>
                        <View style={[styles.photoContainer, { width: isCompactLayout ? PASSPORT_WIDTH * 0.28 : PASSPORT_WIDTH * 0.45, marginBottom: 12 }]}>
                            <Image
                                source={{ uri: user?.photo || 'https://images.unsplash.com/photo-1517292987719-0369a794ec0f?auto=format&fit=crop&w=500&q=80' }}
                                style={[styles.innerPhoto, { borderColor: '#d4af37', borderWidth: 2, borderRadius: 6 }]}
                            />
                        </View>
                        <Animated.Text style={{ color: '#FFD700', fontSize: 14, fontWeight: '800', letterSpacing: 1, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 2, transform: [{ scale: textPulseScale }] }}>
                            {displayName}
                        </Animated.Text>
                    </View>

                    {/* Middle Section: Emblem */}
                    <View style={{ alignItems: 'center', marginTop: 10 }}>
                        <Image 
                            source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Ashoka_Chakra.svg' }}
                            style={{ width: 45, height: 45, marginVertical: 15, opacity: 0.95 }}
                            tintColor="#FFD700"
                        />
                    </View>

                    {/* Bottom Section */}
                    <View style={{ alignItems: 'center', marginBottom: 25 }}>
                        <Animated.Text style={{ color: '#FFD700', fontSize: 20, fontWeight: '900', letterSpacing: 2, textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: {width: 2, height: 2}, textShadowRadius: 4, transform: [{ scale: textPulseScale }], opacity: textGlowOpacity, textAlign: 'center' }}>BRAHMAND{'\n'}PASSPORT</Animated.Text>
                    </View>

                </View>
              </View>
            </Animated.View>

            {/* INSIDE OF FRONT COVER (Identity Details move here) */}
            <Animated.View style={[
                styles.frontCover, 
                { position: 'absolute', right: 0, opacity: insideCoverOpacity, transform: [{ rotateY: '180deg' }] }
            ]}>
              <ImageBackground 
                source={{ uri: 'https://www.transparenttextures.com/patterns/rice-paper-2.png' }} 
                style={StyleSheet.absoluteFillObject} 
                imageStyle={{ opacity: 0.3 }}
              />
              <View style={{ flex: 1, backgroundColor: 'rgba(255, 253, 245, 0.95)' }}>
                 
                 <View style={{ flex: 1, padding: isCompactLayout ? 8 : 12 }}>
                     {/* Centered Photo Layout */}
                     <View style={{ alignItems: 'center', marginTop: isCompactLayout ? 2 : 5, marginBottom: isCompactLayout ? 8 : 15 }}>
                         <View style={[styles.photoContainer, { width: PASSPORT_WIDTH * 0.35 }]}>
                             <Image
                                 source={{ uri: user?.photo || 'https://images.unsplash.com/photo-1517292987719-0369a794ec0f?auto=format&fit=crop&w=500&q=80' }}
                                 style={[styles.innerPhoto, { borderColor: '#111', borderWidth: 2, borderRadius: 6 }]}
                             />
                         </View>
                     </View>
                     
                     {/* Details below photo */}
                     <View style={[styles.detailsPanel, { width: isCompactLayout ? '100%' : PASSPORT_WIDTH * 0.52 }]}> 
                         <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: isCompactLayout ? 4 : 8 }}>
                             <View>
                                 <Text style={[styles.detailLabelSpace, { color: '#333' }]}>Type</Text>
                                 <Text style={[styles.detailValue, { color: '#111' }]}>P</Text>
                             </View>
                             <View>
                                 <Text style={[styles.detailLabelSpace, { color: '#333', textAlign: 'right' }]}>Code</Text>
                                 <Text style={[styles.detailValue, { color: '#111', textAlign: 'right' }]}>BHM</Text>
                             </View>
                         </View>

                         <Text style={[styles.detailLabelSpace, { color: '#333' }]}>Passport No. (SL)</Text>
                         <Text style={[styles.detailValueB, { color: '#111', fontSize: 12 }]} numberOfLines={1} adjustsFontSizeToFit>SL-{displaySl}</Text>

                         <Text style={{ ...styles.detailLabelSpace, color: '#333', marginTop: isCompactLayout ? 4 : 8 }}>Given Name(s) / दिया गया नाम</Text>
                         <Text style={[styles.detailValueB, { color: '#111', fontSize: 12 }]} numberOfLines={2} adjustsFontSizeToFit>{displayName}</Text>

                         <Text style={{ ...styles.detailLabelSpace, color: '#333', marginTop: isCompactLayout ? 4 : 8 }}>Nationality / राष्ट्रीयता</Text>
                         <Text style={[styles.detailValueB, { color: '#111', fontSize: 12 }]} numberOfLines={1} adjustsFontSizeToFit>SANATANI / सनातनी</Text>

                         <Text style={{ ...styles.detailLabelSpace, color: '#333', marginTop: isCompactLayout ? 4 : 8 }}>Place of Birth / जन्म स्थान</Text>
                         <Text style={[styles.detailValueB, { color: '#111', fontSize: 12 }]} numberOfLines={1} adjustsFontSizeToFit>BHARATVARSH</Text>
                     </View>
                     
                     {/* Signature box */}
                     <View style={{ marginTop: 'auto', marginBottom: 10 }}>
                         <Text style={{ fontSize: 8, color: '#333', paddingLeft: 5 }}>Signature / हस्ताक्षर</Text>
                         <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'serif', fontSize: 16, paddingLeft: 5, marginTop: 2, color: '#111' }}>
                             {user?.name || 'Seeker'}
                         </Text>
                     </View>
                 </View>

                 {/* MRZ Machine Readable Zone */}
                 <View style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
                   <Text style={[styles.mrzText, { fontSize: 8, color: '#111' }]} numberOfLines={2}>
                     P&lt;BHM{mrzName}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
                     {'\n'}{pNoTemp.current}&lt;&lt;&lt;9IND900101M291231&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;02
                   </Text>
                 </View>

                 <Image 
                     source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Ashoka_Chakra.svg' }}
                     style={{ position: 'absolute', width: 100, height: 100, opacity: 0.05, top: '30%', left: '20%' }}
                 />
              </View>

              {/* Book Spine Crease Shadow (Left Page) */}
              <LinearGradient
                  colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.5)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.spineShadowRight}
              />
            </Animated.View>
          </Animated.View>

        </View>
      </Animated.View>

      {/* Buttons that fade in after turning pages, placed absolute to center the book vertically */}
      <Animated.View style={[styles.afterOpenActions, { opacity: actionOpacity, bottom: insets.bottom + 18 }]}> 
        <TouchableOpacity style={styles.exploreButton} onPress={() => router.push('/passport/timeline' as any)}>
          <Text style={styles.exploreButtonText}>Turn Pages &amp; View Stamps</Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.primary} style={{ marginLeft: SPACING.sm }} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.addJourneyButton} onPress={() => router.push('/passport/journey/new' as any)}>
          <Ionicons name="add-circle-outline" size={16} color="white" style={{ marginRight: SPACING.xs }} />
          <Text style={styles.addJourneyText}>Log a New Journey</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Gradient handles background
    justifyContent: 'center',
    alignItems: 'center',
  },
  deskArea: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: '100%',
    paddingHorizontal: SPACING.sm,
    overflow: 'visible',
  },
  passportShadowContainer: {
    width: PASSPORT_WIDTH,
    maxWidth: '100%',
    height: PASSPORT_HEIGHT,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 25,
  },
  coverPivotWrapper: {
    position: 'absolute',
    width: PASSPORT_WIDTH * 2,
    height: PASSPORT_HEIGHT,
    left: -PASSPORT_WIDTH, // Exactly overlays the right half over the passport container
    alignItems: 'flex-end',
    overflow: 'visible',
    zIndex: 100, // On top of inner page
  },
  frontCover: {
    width: PASSPORT_WIDTH,
    height: PASSPORT_HEIGHT,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    overflow: 'hidden',
    // removed backfaceVisibility to fix android black out bug when rotating
  },
  coverBorder: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#d4af37', // Gold borders
    margin: 8,
    borderRadius: 6,
    padding: 2,
  },
  coverInnerBorder: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d4af37', // Gold inner border
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  coverCountry: {
    color: '#d4af37', // Gold text
    fontSize: 22, 
    fontWeight: '900',
    letterSpacing: 3,
    textAlign: 'center',
    lineHeight: 28,
  },
  coverSubtitleTop: {
    color: '#d4af37', 
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
  },
  coverEmblem: {
    width: 65,
    height: 65,
    opacity: 0.95,
    marginVertical: 15, 
  },
  coverTitle: {
    color: '#d4af37',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 5,
    marginTop: 'auto',
  },
  coverSubtitle: {
    color: '#d4af37',
    fontSize: 16, 
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 4,
  },
  innerPage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fffdf5', // Natural paper
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    overflow: 'hidden',
  },
  innerHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#d4af37',
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  innerCountryName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
    letterSpacing: 1,
  },
  innerPassportText: {
    fontSize: 11,
    color: '#333',
    letterSpacing: 2,
    marginTop: 2,
  },
  innerContent: {
    flexDirection: 'row',
    padding: 16,
    flex: 1,
  },
  innerContentColumn: {
    flexDirection: 'column',
  },
  photoContainer: {
    width: PASSPORT_WIDTH * 0.33,
    alignItems: 'center',
    position: 'relative',
  },
  innerPhoto: {
    width: '100%',
    aspectRatio: 3/4,
    borderWidth: 1,
    borderColor: '#a3a3a3',
    borderRadius: 2,
  },
  watermark: {
    position: 'absolute',
    width: 40,
    height: 40,
    opacity: 0.1,
    bottom: -15,
    right: -10,
  },
  detailsContainer: {
    flex: 1,
    minWidth: 120,
    maxWidth: '100%',
    paddingLeft: 16,
    flexShrink: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailRowValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 9,
    color: '#666',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 11,
    color: '#111',
    fontWeight: 'bold',
  },
  detailLabelSpace: {
    fontSize: isCompactLayout ? 9 : 10,
    color: '#444',
    fontWeight: '700',
    marginTop: isCompactLayout ? 6 : 10,
    lineHeight: isCompactLayout ? 14 : 18,
    flexWrap: 'wrap',
  },
  detailValueB: {
    fontSize: isCompactLayout ? 12 : 14,
    color: '#111',
    fontWeight: '700',
    letterSpacing: 0.25,
    lineHeight: isCompactLayout ? 18 : 22,
    flexWrap: 'wrap',
  },
  detailsPanel: {
    alignSelf: 'center',
    flexShrink: 1,
    paddingHorizontal: 4,
    minWidth: 120,
    maxWidth: '100%',
  },
  statsMiniGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  mrzContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0d8c0',
  },
  mrzText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    color: '#000',
    letterSpacing: 0.5,
    lineHeight: 16,
    fontWeight: '700',
  },
  afterOpenActions: {
    position: 'absolute',
    bottom: 25,
    alignItems: 'center',
    width: '100%',
    zIndex: 200,
  },
  exploreButton: {
    flexDirection: 'row',
    backgroundColor: '#fffdf5',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  addJourneyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  addJourneyText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  spineShadowLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 25,
    zIndex: 10,
  },
  spineShadowRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 25,
    zIndex: 10,
  },
});
