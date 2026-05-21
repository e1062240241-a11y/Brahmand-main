import { Image } from 'expo-image';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS, BORDER_RADIUS } from '../constants/theme';

interface AvatarProps {
  name: string;
  photo?: any;
  size?: number;
  shape?: 'circle' | 'square' | 'rounded';
}

export const Avatar: React.FC<AvatarProps> = ({ name, photo, size = 48, shape = 'circle' }) => {
  const initials = (name || 'U')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const borderRadius = shape === 'circle' ? size / 2 : shape === 'rounded' ? 12 : 0;

  if (photo) {
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
          source={photo}
          style={[styles.image, { width: size, height: size, borderRadius }]}
          contentFit="cover"
          transition={200}
          cachePolicy="disk"
        />
      );
    }
    
    const photoStr = String(photo);
    const isUrl = photoStr.startsWith('http') || photoStr.startsWith('https://');
    const uri = (isUrl || photoStr.startsWith('data:')) ? photoStr : `data:image/jpeg;base64,${photoStr}`;
    
    return Platform.OS === 'web' ? (
      <img 
        src={uri}
        style={{ width: size, height: size, borderRadius, objectFit: 'cover' }}
        alt={name}
      />
    ) : (
      <Image
        source={{ uri }}
        style={[styles.image, { width: size, height: size, borderRadius }]}
        contentFit="cover"
        transition={200}
        cachePolicy="disk"
      />
    );
  }

  return (
    <View style={[styles.placeholder, { width: size, height: size, borderRadius }]}>
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: 'transparent',
  },
  placeholder: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: COLORS.textWhite,
    fontWeight: 'bold',
  },
});
