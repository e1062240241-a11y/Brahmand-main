import * as React from 'react';
import { Image } from 'expo-image';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, BORDER_RADIUS } from '../constants/theme';

interface AvatarProps {
  name: string;
  photo?: any;
  size?: number;
  shape?: 'circle' | 'square' | 'rounded';
}

export const Avatar: React.FC<AvatarProps> = ({ name, photo, size = 48, shape = 'circle' }) => {
  const initials = React.useMemo(() => {
    return (name || 'U')
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [name]);

  const borderRadius = shape === 'circle' ? size / 2 : shape === 'rounded' ? 12 : 0;

  const hasPhoto =
    photo &&
    photo !== 'nan' &&
    photo !== 'NaN' &&
    photo !== 'None' &&
    photo !== '';

  const source = React.useMemo(() => {
    if (!hasPhoto) return null;
    const isRequiredAsset = typeof photo === 'number' || (typeof photo === 'object' && photo !== null);
    if (isRequiredAsset) return photo;
    
    const photoStr = String(photo);
    const isUrl = photoStr.startsWith('http') || photoStr.startsWith('https://');
    const uri = (isUrl || photoStr.startsWith('data:')) ? photoStr : `data:image/jpeg;base64,${photoStr}`;
    return { uri };
  }, [photo, hasPhoto]);

  if (hasPhoto && source) {
    const isRequiredAsset = typeof photo === 'number' || (typeof photo === 'object' && photo !== null);
    
    if (isRequiredAsset) {
      return Platform.OS === 'web' ? (
        <img 
          src={photo}
          style={{ width: size, height: size, borderRadius, objectFit: 'cover' }}
          alt={name}
        />
      ) : (
        <Image
          source={source}
          style={[styles.image, { width: size, height: size, borderRadius }]}
          contentFit="cover"
          transition={0}
          cachePolicy="memory-disk"
        />
      );
    }
    
    return Platform.OS === 'web' ? (
      <img 
        src={source.uri}
        style={{ width: size, height: size, borderRadius, objectFit: 'cover' }}
        alt={name}
      />
    ) : (
      <Image
        source={source}
        style={[styles.image, { width: size, height: size, borderRadius }]}
        contentFit="cover"
        transition={0}
        cachePolicy="memory-disk"
      />
    );
  }

  return (
    <LinearGradient
      colors={['#FF8D57', '#FF5500']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.placeholderGradient, { width: size, height: size, borderRadius }]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: 'transparent',
  },
  placeholderGradient: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  initials: {
    color: COLORS.textWhite,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
