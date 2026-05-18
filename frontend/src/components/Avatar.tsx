import { Image } from 'expo-image';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS, BORDER_RADIUS } from '../constants/theme';

interface AvatarProps {
  name: string;
  photo?: string;
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
    const isUrl = photo.startsWith('http') || photo.startsWith('https://');
    const uri = (isUrl || photo.startsWith('data:')) ? photo : `data:image/jpeg;base64,${photo}`;
    
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
