import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder, Image, Dimensions, ImageBackground, useWindowDimensions, Platform, Keyboard } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from '../utils/i18n';

const { width: staticWidth, height: staticHeight } = Dimensions.get('window');
const FAB_SIZE = 60;

export default function FloatingMenu({ bottomOffset = 90 }) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const scaleFactor = Platform.OS === 'android' ? Math.min(1, (windowWidth * 0.95) / 360) : 1;

  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [fabExpanded, setFabExpanded] = useState(false);
  const fabScale = useRef(new Animated.Value(0)).current;
  const fabRotation = useRef(new Animated.Value(0)).current;
  const fabItemAnims = useRef(Array.from({ length: 7 }, () => new Animated.Value(0))).current;

  const scaledScale = Platform.OS === 'android'
    ? fabScale.interpolate({
        inputRange: [0, 1],
        outputRange: [0, scaleFactor]
      })
    : fabScale;

  // Draggable state
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (Platform.OS === 'android') {
          return false;
        }
        // Only start dragging if moved significantly (prevent blocking tap)
        return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (evt, gestureState) => {
        pan.flattenOffset();
        // Snap to edges (optional, or just bound it)
        // Ensure it stays within bounds
        const currentX = (pan.x as any)._value;
        const currentY = (pan.y as any)._value;
        
        let newX = currentX;
        let newY = currentY;
        
        // Prevent going offscreen left (max right is 0, since initial position is right: 20)
        // Wait, right is 20. x=0 means right=20.
        // x goes negative to move left.
        const currentWidth = Platform.OS === 'android' ? Dimensions.get('window').width : staticWidth;
        const currentHeight = Platform.OS === 'android' ? Dimensions.get('window').height : staticHeight;
        const maxLeft = -(currentWidth - FAB_SIZE - 40);
        if (newX > 0) newX = 0;
        if (newX < maxLeft) newX = maxLeft;
        
        // y bounds (y=0 means bottom = bottomOffset)
        // y goes negative to move up
        const maxUp = -(currentHeight - bottomOffset - insets.top - FAB_SIZE - 50);
        const maxDown = 0; // Don't go below initial position
        
        if (newY > maxDown) newY = maxDown;
        if (newY < maxUp) newY = maxUp;

        Animated.spring(pan, {
          toValue: { x: newX, y: newY },
          useNativeDriver: false,
          friction: 5
        }).start();
      }
    })
  ).current;

  const toggleFab = useCallback(() => {
    const toOpen = !fabExpanded;
    setFabExpanded(toOpen);
    if (toOpen) {
      Animated.parallel([
        Animated.spring(fabScale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
        Animated.timing(fabRotation, { toValue: 1, duration: 300, useNativeDriver: true }),
        ...fabItemAnims.map((anim, i) =>
          Animated.spring(anim, { toValue: 1, friction: 5, tension: 50, delay: i * 40, useNativeDriver: true })
        ),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fabScale, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(fabRotation, { toValue: 0, duration: 200, useNativeDriver: true }),
        ...fabItemAnims.map(anim => Animated.timing(anim, { toValue: 0, duration: 150, useNativeDriver: true })),
      ]).start();
    }
  }, [fabExpanded, fabScale, fabRotation, fabItemAnims]);

  const menuItems = [
    { icon: 'hand-heart', label: 'Blood', color: '#E53935', route: '/community-request/blood-request' },
    { icon: 'hospital', label: 'ICU', color: '#8E24AA', route: '/community-request/icu' },
    { icon: 'food-apple', label: 'Food', color: '#F57C00', route: '/community-request/food' },
    { icon: 'home-heart', label: 'Shelter', color: '#43A047', route: '/community-request/shelter' },
    { icon: 'police-badge', label: 'Legal', color: '#1E88E5', route: '/community-request/legal' },
    { icon: 'car-emergency', label: 'Vehicle', color: '#546E7A', route: '/community-request/vehicle' },
    { icon: 'toolbox', label: 'Tools', color: '#8D6E63', route: '/community-request/tools' },
  ];

  return (
    <>
      {fabExpanded && (
        <TouchableOpacity style={fabStyles.overlay} activeOpacity={1} onPress={toggleFab}>
          <BlurView intensity={20} tint={Platform.OS === 'android' ? 'light' : 'dark'} style={StyleSheet.absoluteFill}>
            <View style={StyleSheet.absoluteFill}>
              <Animated.View
                style={[
                  fabStyles.menuContainer,
                  Platform.OS === 'android' ? {
                    top: windowHeight / 2 - 180,
                    transform: [{ scale: scaledScale }],
                    opacity: fabScale,
                  } : {
                    transform: [{ scale: fabScale }],
                    opacity: fabScale,
                  },
                ]}
              >
                <View style={fabStyles.menuCircle}>
                    
                    {[
                      { key: 'festival', label: t('festival'), icon: 'calendar-outline' as const, route: '/festivals' },
                      { key: 'kundli', label: t('kundli'), icon: 'planet-outline' as const, route: '/astrology' },
                      { key: 'brahmandPassport', label: t('brahmandPassport'), icon: 'compass-outline' as const, route: '/passport' },
                      { key: 'myKrishna', label: t('myKrishna'), icon: 'heart-outline' as const, route: '/my-krishna' },
                      { key: 'panchang', label: t('panchang'), icon: 'today-outline' as const, route: '/panchang' },
                      { key: 'brahmandLibrary', label: t('brahmandLibrary'), icon: 'library-outline' as const, route: '/library' },
                    ].map((item, index) => {
                      const totalItems = 6;
                      const angleStep = (2 * Math.PI) / totalItems;
                      const startAngle = -Math.PI / 2; // Start from top
                      const angle = startAngle + index * angleStep;
                      const radius = 112;
                      const itemSize = 70;
                      const itemRadius = 35;
                      const centerX = 180 - itemSize / 2;
                      const centerY = 180 - itemSize / 2 - 10;
                      const x = centerX + radius * Math.cos(angle);
                      const y = centerY + radius * Math.sin(angle);
                      
                      return (
                        <Animated.View
                          key={item.key}
                          style={[
                            fabStyles.menuItem,
                            {
                              left: x - 5,
                              top: y,
                              transform: [
                                { scale: fabItemAnims[index] },
                              ],
                              opacity: fabItemAnims[index],
                            },
                          ]}
                        >
                          <TouchableOpacity
                            style={fabStyles.menuItemButton}
                            activeOpacity={0.8}
                            onPress={() => {
                              Keyboard.dismiss();
                              toggleFab();
                              const targetRoute = item.route;
                              setTimeout(() => {
                                router.push(targetRoute as any);
                              }, 60);
                            }}
                          >
                            <ImageBackground 
                              source={require('../../assets/images/tab-bar/back.webp')} 
                              style={{ width: itemSize, height: itemSize, justifyContent: 'center', alignItems: 'center', borderRadius: itemRadius, overflow: 'hidden' }} 
                              imageStyle={{ borderRadius: itemRadius, resizeMode: 'cover' }}
                            >
                              {item.key === 'myKrishna' ? (
                                <ExpoImage source={require('../../assets/images/tab-bar/my_krishna.webp')} style={{ width: 48, height: 48 }} contentFit="contain" />
                              ) : item.key === 'festival' ? (
                                <Image source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/custom_festival_icon_2.webp' }} style={{ width: 36, height: 36 }} resizeMode="contain" />
                              ) : item.key === 'kundli' ? (
                                <Image source={require('../../assets/images/tab-bar/hand_eye_phosphor.webp')} style={{ width: 36, height: 36 }} resizeMode="contain" />
                              ) : item.key === 'brahmandPassport' ? (
                                <Image source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/custom_passport_icon.webp' }} style={{ width: 48, height: 48 }} resizeMode="contain" />
                              ) : item.key === 'panchang' ? (
                                <Image source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/panchang_icon_3.webp' }} style={{ width: 34, height: 34 }} resizeMode="contain" />
                              ) : item.key === 'brahmandLibrary' ? (
                                <Image source={{ uri: 'https://brahmandfeed23.b-cdn.net/assets/library_icon_3.webp' }} style={{ width: 34, height: 34 }} resizeMode="contain" />
                              ) : (
                                <Ionicons name={item.icon as any} size={28} color="#FFF" />
                              )}
                            </ImageBackground>
                          </TouchableOpacity>
                          <Text style={fabStyles.menuItemLabel}>
                            {item.label}
                          </Text>
                        </Animated.View>
                      );
                    })}

                    {/* Center - SOS */}
                    <Animated.View
                      style={[
                        fabStyles.centerButton,
                        {
                          transform: [{ scale: fabItemAnims[7] }],
                          opacity: fabItemAnims[7],
                        },
                      ]}
                    >
                      <TouchableOpacity
                        style={fabStyles.centerButtonOuterRing}
                        activeOpacity={0.85}
                        onPress={() => {
                          toggleFab();
                          setTimeout(() => {
                            router.push('/sos');
                          }, 200);
                        }}
                      >
                        <View style={fabStyles.sosRedButton}>
                          <Text style={fabStyles.sosRedText}>SOS</Text>
                        </View>
                      </TouchableOpacity>
                      <Text style={fabStyles.centerLabel}>SOS</Text>
                    </Animated.View>
                  </View>
                </Animated.View>
              </View>
          </BlurView>
        </TouchableOpacity>
      )}

      <Animated.View
        {...(Platform.OS === 'android' ? {} : panResponder.panHandlers)}
        style={[
          fabStyles.fab,
          { 
            bottom: bottomOffset + insets.bottom,
            transform: Platform.OS === 'android' ? [] : [
              { translateX: pan.x },
              { translateY: pan.y }
            ]
          },
          fabExpanded && { opacity: 0 },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={0.85}
          onPress={toggleFab}
        >
          <ExpoImage
            source={require('../../assets/images/tab-bar/my_krishna.webp')}
            style={fabStyles.fabIcon}
            contentFit="cover"
          />
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}



const fabStyles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 9999, justifyContent: 'center', alignItems: 'center' },
  menuContainer: { position: 'absolute', width: 360, height: 360, alignSelf: 'center', top: staticHeight / 2 - 180 },
  menuCircle: {
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: '#FFEFE8',
    borderWidth: 7,
    borderColor: '#FFD5B8',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#FF7B00',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        overflow: 'hidden',
      },
      android: {
        elevation: 4,
      },
    }),
  },
  menuItem: { position: 'absolute', width: 80, alignItems: 'center' },
  menuItemButton: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 3 },
  menuItemLabel: { color: '#000', fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 3, lineHeight: 12, width: 80 },
  centerButton: {
    position: 'absolute',
    left: 136,
    top: 126,
    alignItems: 'center',
    width: 88,
  },
  centerButtonOuterRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFE3E3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFCDD2',
    shadowColor: '#FF1744',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  sosRedButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FF2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  sosRedText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  centerLabel: { color: '#000', fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 3 },
  fab: { position: 'absolute', right: 20, width: 64, height: 64, borderRadius: 32, backgroundColor: '#FF7B00', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 8, zIndex: 9999, borderWidth: 3.5, borderColor: '#FFD5B8' },
  fabIcon: { width: 44, height: 44, borderRadius: 22 },
});
