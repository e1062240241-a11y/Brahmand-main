import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface AnimatedFullScreenMediaViewerProps {
  mediaUrl: string | null;
  onClose: () => void;
  CommunityMediaItem: React.ComponentType<{ media: any; style: any; isActive?: boolean }>;
}

export const AnimatedFullScreenMediaViewer: React.FC<AnimatedFullScreenMediaViewerProps> = ({
  mediaUrl,
  onClose,
  CommunityMediaItem,
}) => {
  const [visible, setVisible] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<string | null>(null);

  const scale = useRef(new Animated.Value(0.75)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (mediaUrl) {
      setCurrentMedia(mediaUrl);
      setVisible(true);
      translateY.setValue(0);
      scale.setValue(0.75);
      bgOpacity.setValue(0);

      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          tension: 70,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(bgOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (visible) {
      triggerDismiss();
    }
  }, [mediaUrl]);

  const triggerDismiss = () => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 0.75,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(bgOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setCurrentMedia(null);
      onClose();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 8 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (_, gestureState) => {
        translateY.setValue(gestureState.dy);
        const dragDistance = Math.abs(gestureState.dy);
        const newOpacity = Math.max(0.2, 1 - dragDistance / 400);
        bgOpacity.setValue(newOpacity);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dy) > 100 || Math.abs(gestureState.vy) > 0.5) {
          const exitDirection = gestureState.dy > 0 ? 600 : -600;
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: exitDirection,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(bgOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setVisible(false);
            setCurrentMedia(null);
            onClose();
          });
        } else {
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              tension: 80,
              friction: 8,
              useNativeDriver: true,
            }),
            Animated.timing(bgOpacity, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  if (!visible || !currentMedia) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="none" onRequestClose={triggerDismiss}>
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.96)',
          opacity: bgOpacity,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity
          style={{ position: 'absolute', top: 50, right: 20, zIndex: 30, padding: 12 }}
          onPress={triggerDismiss}
        >
          <Ionicons name="close" size={32} color="#FFF" />
        </TouchableOpacity>

        <Animated.View
          {...panResponder.panHandlers}
          style={{
            width: Dimensions.get('window').width,
            height: Dimensions.get('window').height * 0.85,
            justifyContent: 'center',
            alignItems: 'center',
            transform: [{ translateY }, { scale }],
          }}
        >
          <CommunityMediaItem
            media={{ uri: currentMedia }}
            style={{ width: Dimensions.get('window').width, height: Dimensions.get('window').height * 0.85 }}
            isActive={true}
          />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default AnimatedFullScreenMediaViewer;
