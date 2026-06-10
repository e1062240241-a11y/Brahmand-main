import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SwipeButtonProps {
  onSwipeComplete: () => void;
  title: string;
}

export default function SwipeButton({ onSwipeComplete, title }: SwipeButtonProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const buttonWidth = SCREEN_WIDTH - 50; 
  const circleWidth = 48;
  const padding = 4;
  const slideDistance = buttonWidth - circleWidth - (padding * 2);

  const swipedRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !swipedRef.current,
      onStartShouldSetPanResponderCapture: () => !swipedRef.current,
      onMoveShouldSetPanResponder: (_, gestureState) => !swipedRef.current && gestureState.dx > 0,
      onMoveShouldSetPanResponderCapture: (_, gestureState) => !swipedRef.current && gestureState.dx > 0,
      onPanResponderGrant: () => {
        // Stop any ongoing spring animations
        slideAnim.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        if (swipedRef.current) return;
        let newX = gestureState.dx;
        if (newX < 0) newX = 0;
        if (newX > slideDistance) newX = slideDistance;
        slideAnim.setValue(newX);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (swipedRef.current) return;
        if (gestureState.dx >= slideDistance * 0.6) {
          swipedRef.current = true;
          Animated.timing(slideAnim, {
            toValue: slideDistance,
            duration: 150,
            useNativeDriver: false,
          }).start(() => {
            onSwipeComplete();
            // Reset state after a delay in case the user navigates back
            setTimeout(() => {
              swipedRef.current = false;
              slideAnim.setValue(0);
            }, 1000);
          });
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        if (!swipedRef.current) {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      }
    })
  ).current;

  const textOpacity = slideAnim.interpolate({
    inputRange: [0, slideDistance * 0.5],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Svg height="100%" width="100%" style={{ position: 'absolute', borderRadius: 28, overflow: 'hidden' }}>
        <Defs>
          <RadialGradient id="grad" cx="50%" cy="50%" rx="66.59%" ry="50%" fx="50%" fy="50%">
            <Stop offset="0%" stopColor="#FFF" stopOpacity="1" />
            <Stop offset="40.87%" stopColor="#FFDED1" stopOpacity="1" />
            <Stop offset="100%" stopColor="#FFC085" stopOpacity="1" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad)" />
      </Svg>
      <Animated.Text style={[styles.text, { opacity: textOpacity }]}>
        {title}
      </Animated.Text>
      <Animated.View
        style={[styles.circle, { transform: [{ translateX: slideAnim }] }]}
        {...panResponder.panHandlers}
      >
        <Text style={styles.icon}>ॐ</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  text: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    color: '#D35400',
    fontSize: 18,
    fontWeight: 'bold',
  },
  circle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF4ED',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'absolute',
    left: 4,
    zIndex: 10,
  },
  icon: {
    color: '#E8630A',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

