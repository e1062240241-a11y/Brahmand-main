import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';

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

  const [swiped, setSwiped] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !swiped,
      onStartShouldSetPanResponderCapture: () => !swiped,
      onMoveShouldSetPanResponder: () => !swiped,
      onMoveShouldSetPanResponderCapture: () => !swiped,
      onPanResponderGrant: () => {
        // user started swiping
      },
      onPanResponderMove: (_, gestureState) => {
        if (swiped) return;
        if (gestureState.dx > 0 && gestureState.dx <= slideDistance) {
          slideAnim.setValue(gestureState.dx);
        } else if (gestureState.dx > slideDistance) {
          slideAnim.setValue(slideDistance);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (swiped) return;
        if (gestureState.dx >= slideDistance * 0.5) {
          setSwiped(true);
          Animated.timing(slideAnim, {
            toValue: slideDistance,
            duration: 150,
            useNativeDriver: false,
          }).start(() => {
            onSwipeComplete();
          });
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        if (!swiped) {
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
    <View style={styles.container} {...panResponder.panHandlers}>
      <Animated.Text style={[styles.text, { opacity: textOpacity }]}>
        {title}
      </Animated.Text>
      <Animated.View
        style={[styles.circle, { transform: [{ translateX: slideAnim }] }]}
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
    backgroundColor: '#E8630A',
    borderRadius: 28,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  text: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    color: '#FFF',
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
  },
  icon: {
    color: '#E8630A',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
