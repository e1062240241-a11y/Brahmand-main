import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder, Image, Dimensions, ImageBackground } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from '../utils/i18n';

const { width, height } = Dimensions.get('window');
const FAB_SIZE = 60;

export default function FloatingMenu({ bottomOffset = 90 }) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [fabExpanded, setFabExpanded] = useState(false);
  const fabScale = useRef(new Animated.Value(0)).current;
  const fabRotation = useRef(new Animated.Value(0)).current;
  const fabItemAnims = useRef(Array.from({ length: 7 }, () => new Animated.Value(0))).current;

  // Draggable state
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
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
        const maxLeft = -(width - FAB_SIZE - 40);
        if (newX > 0) newX = 0;
        if (newX < maxLeft) newX = maxLeft;
        
        // y bounds (y=0 means bottom = bottomOffset)
        // y goes negative to move up
        const maxUp = -(height - bottomOffset - insets.top - FAB_SIZE - 50);
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
    { icon: 'hand-heart', label: 'Blood', color: '#E53935', route: '/community-request/blood' },
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
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill}>
            <View style={StyleSheet.absoluteFill}>
              <Animated.View
                style={[
                  fabStyles.menuContainer,
                  {
                    transform: [{ scale: fabScale }],
                    opacity: fabScale,
                  },
                ]}
              >
                <View style={fabStyles.outerRing}>
                  <View style={fabStyles.innerCircle}>
                    <View style={fabStyles.dottedRing} />
                    
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
                      const radius = 120;
                      const centerX = 140 - 40; // center of 280 - half of 80
                      const centerY = 140 - 40 - 12; // shift up by 12px for visual centering with text
                      const x = centerX + radius * Math.cos(angle);
                      const y = centerY + radius * Math.sin(angle);
                      
                      return (
                        <Animated.View
                          key={item.key}
                          style={[
                            fabStyles.menuItem,
                            {
                              left: x,
                              top: y,
                              transform: [
                                { scale: fabItemAnims[index] },
                              ],
                              opacity: fabItemAnims[index],
                            },
                          ]}
                        >
                          <TouchableOpacity
                            style={[
                              fabStyles.menuItemButton,
                              { backgroundColor: 'transparent', shadowOpacity: 0 }
                            ]}
                            activeOpacity={0.8}
                            onPress={() => {
                              toggleFab();
                              setTimeout(() => {
                                router.push(item.route as any);
                              }, 200);
                            }}
                          >
                            {item.key === 'myKrishna' ? (
                              <ImageBackground source={require('../../assets/images/tab-bar/back.png')} style={{ alignSelf: 'stretch', height: 80, aspectRatio: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <ExpoImage source={require('../../assets/images/tab-bar/my_krishna.png')} style={{ width: 80, height: 80 }} contentFit="contain" />
                              </ImageBackground>
                            ) : item.key === 'festival' ? (
                              <ImageBackground source={require('../../assets/images/tab-bar/back.png')} style={{ alignSelf: 'stretch', height: 80, aspectRatio: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <Image source={require('../../assets/images/custom_festival_icon_2.png')} style={{ width: 44, height: 44 }} resizeMode="contain" />
                              </ImageBackground>
                            ) : item.key === 'kundli' ? (
                              <ImageBackground source={require('../../assets/images/tab-bar/back.png')} style={{ alignSelf: 'stretch', height: 80, aspectRatio: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <Image source={require('../../assets/images/tab-bar/hand_eye_phosphor.png')} style={{ width: 52, height: 52 }} resizeMode="contain" />
                              </ImageBackground>
                            ) : item.key === 'brahmandPassport' ? (
                              <ImageBackground source={require('../../assets/images/tab-bar/back.png')} style={{ alignSelf: 'stretch', height: 80, aspectRatio: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <Image source={require('../../assets/images/custom_passport_icon.png')} style={{ width: 62, height: 62 }} resizeMode="contain" />
                              </ImageBackground>
                            ) : item.key === 'panchang' ? (
                              <ImageBackground source={require('../../assets/images/tab-bar/back.png')} style={{ alignSelf: 'stretch', height: 80, aspectRatio: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <Image
                                  source={require('../../assets/images/panchang_icon_3.png')}
                                  style={{ width: 36, height: 36 }}
                                  resizeMode="contain"
                                />
                              </ImageBackground>
                            ) : item.key === 'brahmandLibrary' ? (
                              <ImageBackground source={require('../../assets/images/tab-bar/back.png')} style={{ alignSelf: 'stretch', height: 80, aspectRatio: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <Image source={require('../../assets/images/library_icon_3.png')} style={{ width: 36, height: 36 }} resizeMode="contain" />
                              </ImageBackground>
                            ) : (
                              <Ionicons name={item.icon as any} size={28} color="#FFF" />
                            )}
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
                        style={fabStyles.centerButtonInner}
                        activeOpacity={0.85}
                        onPress={() => {
                          toggleFab();
                          setTimeout(() => {
                            router.push('/sos');
                          }, 200);
                        }}
                      >
                        <Image
                          source={require('../../assets/images/sos_icon_3.png')}
                          style={{ width: 102, height: 102, borderRadius: 51, alignSelf: 'center' }}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                      <Text style={fabStyles.centerLabel}>SOS</Text>
                    </Animated.View>
                  </View>
                </View>
              </Animated.View>
            </View>
          </BlurView>
        </TouchableOpacity>
      )}

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          fabStyles.fab,
          { 
            bottom: bottomOffset + insets.bottom,
            transform: [
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
            source={require('../../assets/images/tab-bar/my_krishna.png')}
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
  menuContainer: { position: 'absolute', width: 360, height: 360, alignSelf: 'center', top: height / 2 - 180 },
  outerRing: { width: 360, height: 360, borderRadius: 180, backgroundColor: '#FFEEE7', justifyContent: 'center', alignItems: 'center' },
  innerCircle: { width: 280, height: 280, borderRadius: 140, backgroundColor: '#FFEEE7', position: 'relative' },
  dottedRing: { position: 'absolute', top: 40, left: 40, width: 200, height: 200, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255, 123, 0, 0.15)', borderStyle: 'dashed' },
  menuItem: { position: 'absolute', width: 80, alignItems: 'center' },
  menuItemButton: { width: 80, alignItems: 'center' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 3 },
  menuItemLabel: { color: '#000', fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 4, lineHeight: 13 },
  centerButton: { position: 'absolute', left: 90, top: 78, alignItems: 'center', width: 100, height: 100 },
  centerButtonInner: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 4, borderColor: '#FFF', shadowColor: '#FF3B30', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  sosImageLarge: { width: 40, height: 40, marginBottom: 2 },
  centerLabel: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  fab: { position: 'absolute', right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#FF7B00', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 8, zIndex: 9999 },
  fabIcon: { width: '100%', height: '100%' },
});
