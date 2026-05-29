import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  ImageBackground,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function GlobalFAB() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [fabExpanded, setFabExpanded] = useState(false);
  const fabScale = useRef(new Animated.Value(0)).current;
  const fabRotation = useRef(new Animated.Value(0)).current;
  const fabItemAnims = useRef(
    Array.from({ length: 8 }, () => new Animated.Value(0))
  ).current;


  const pan = useRef(new Animated.ValueXY()).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Claim responder only if the user drags
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  const toggleFab = useCallback(() => {
    const toOpen = !fabExpanded;
    setFabExpanded(toOpen);
    if (toOpen) {
      Animated.parallel([
        Animated.spring(fabScale, {
          toValue: 1,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(fabRotation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        ...fabItemAnims.map((anim, i) =>
          Animated.spring(anim, {
            toValue: 1,
            friction: 5,
            tension: 50,
            delay: i * 40,
            useNativeDriver: true,
          })
        ),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fabScale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fabRotation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        ...fabItemAnims.map((anim) =>
          Animated.timing(anim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          })
        ),
      ]).start();
    }
  }, [fabExpanded, fabScale, fabRotation, fabItemAnims]);

  // Do not show FAB on authentication screens
  if (!pathname || pathname === '/' || pathname === '/index' || pathname.startsWith('/auth')) {
    return null;
  }

  return (
    <>
      {/* ─── Floating Action Button (FAB) Overlay ─── */}
      {fabExpanded && (
        <TouchableOpacity
          style={fabStyles.overlay}
          activeOpacity={1}
          onPress={toggleFab}
        >
          <Animated.View
            style={[
              fabStyles.menuContainer,
              {
                transform: [{ scale: fabScale }],
                opacity: fabScale,
              },
            ]}
          >
            {/* Outer decorative ring */}
            <View style={fabStyles.outerRing}>
              {/* Inner circle with items */}
              <View style={fabStyles.innerCircle}>
                {/* Decorative dotted ring */}
                <View style={fabStyles.dottedRing} />

                {/* Menu items arranged in a circle */}
                {[
                  { label: 'Festival', icon: 'calendar-outline' as const, route: '/festivals' },
                  { label: 'Kundli', icon: 'planet-outline' as const, route: '/astrology' },
                  { label: 'Brahmand\nPassport', icon: 'compass-outline' as const, route: '/passport' },
                  { label: 'My Krishna', icon: 'heart-outline' as const, route: '/my-krishna' },
                  { label: 'Panchang', icon: 'today-outline' as const, route: '/panchang' },
                  { label: 'Brahmand\nLibrary', icon: 'library-outline' as const, route: '/library' },
                  { label: 'Jyotish', icon: 'star-outline' as const, route: '/horoscope' },
                ].map((item, index) => {
                  // Position items in a circle (7 items, starting from top)
                  const totalItems = 7;
                  const angleStep = (2 * Math.PI) / totalItems;
                  const startAngle = -Math.PI / 2; // Start from top
                  const angle = startAngle + index * angleStep;
                  const radius = 120;
                  const centerX = 180 - 40; // center of 360 - half of 80
                  const centerY = 180 - 40;
                  const x = centerX + radius * Math.cos(angle);
                  const y = centerY + radius * Math.sin(angle);

                  return (
                    <Animated.View
                      key={item.label}
                      style={[
                        fabStyles.menuItem,
                        {
                          left: x,
                          top: y,
                          transform: [{ scale: fabItemAnims[index] }],
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
                        {item.label === 'My Krishna' ? (
                          <ImageBackground source={require('../../assets/images/orange_circle_bg.png')} style={{ width: 80, height: 80, aspectRatio: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Image source={require('../../assets/images/peacock_feather_icon.png')} style={{ width: 44, height: 44 }} resizeMode="contain" />
                          </ImageBackground>
                        ) : item.label === 'Festival' ? (
                          <ImageBackground source={require('../../assets/images/orange_circle_bg.png')} style={{ width: 80, height: 80, aspectRatio: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Image source={require('../../assets/images/custom_festival_icon_2.png')} style={{ width: 44, height: 44 }} resizeMode="contain" />
                          </ImageBackground>
                        ) : item.label === 'Kundli' ? (
                          <ImageBackground source={require('../../assets/images/orange_circle_bg.png')} style={{ width: 80, height: 80, aspectRatio: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Image source={require('../../assets/images/custom_kundli_icon.png')} style={{ width: 44, height: 44 }} resizeMode="contain" />
                          </ImageBackground>
                        ) : item.label.includes('Passport') ? (
                          <ImageBackground source={require('../../assets/images/orange_circle_bg.png')} style={{ width: 80, height: 80, aspectRatio: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Image source={require('../../assets/images/custom_passport_icon.png')} style={{ width: 44, height: 44 }} resizeMode="contain" />
                          </ImageBackground>
                        ) : item.label === 'Panchang' ? (
                          <ImageBackground source={require('../../assets/images/orange_circle_bg.png')} style={{ width: 80, height: 80, aspectRatio: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Image source={require('../../assets/images/panchang_icon_3.png')} style={{ width: 44, height: 44 }} resizeMode="contain" />
                          </ImageBackground>
                        ) : item.label.includes('Library') ? (
                          <ImageBackground source={require('../../assets/images/orange_circle_bg.png')} style={{ width: 80, height: 80, aspectRatio: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Image source={require('../../assets/images/library_icon_3.png')} style={{ width: 44, height: 44 }} resizeMode="contain" />
                          </ImageBackground>
                        ) : item.label === 'Jyotish' ? (
                          <ImageBackground source={require('../../assets/images/custom_jyotish_icon_3.png')} style={{ width: 80, height: 80, aspectRatio: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Image source={require('../../assets/images/siren_icon.png')} style={{ width: 44, height: 44 }} resizeMode="contain" />
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
        </TouchableOpacity>
      )}

      {/* FAB trigger button */}
      <Animated.View
        style={[
          fabStyles.fab,
          { bottom: 90 + insets.bottom },
          { transform: pan.getTranslateTransform() },
          fabExpanded && { opacity: 0 },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={0.85}
          onPress={toggleFab}
        >
          <Image
            source={require('../../assets/images/peacock_feather_icon.png')}
            style={fabStyles.fabIcon}
            resizeMode="cover"
          />
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

const fabStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    zIndex: 99999, // Ensure very high z-index
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 99,
  },
  menuContainer: {
    width: 380,
    height: 380,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerRing: {
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: '#FFD5B8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF7B00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  innerCircle: {
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: '#FFEEE7',
    position: 'relative',
  },
  dottedRing: {
    position: 'absolute',
    top: 40,
    left: 40,
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: 'rgba(255, 123, 0, 0.15)',
    borderStyle: 'dashed',
  },
  menuItem: {
    position: 'absolute',
    width: 80,
    alignItems: 'center',
  },
  menuItemButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF7B00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF5100',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  menuItemSos: {
    backgroundColor: '#FF0000',
  },
  sosButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  menuItemLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 13,
  },
  centerButton: {
    position: 'absolute',
    left: 126,
    top: 126,
    alignItems: 'center',
    width: 108,
  },
  centerButtonInner: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF7B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#FFD5B8',
  },
  centerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF7B00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF5100',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 100, // Make elevation very high for persistent visibility
    zIndex: 99999, // Super high zIndex
    borderWidth: 3,
    borderColor: '#FFD5B8',
  },
  fabIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
});
