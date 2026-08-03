import React from 'react';
import { 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Text, 
  StyleSheet, 
  Platform, 
  View, 
  StyleProp, 
  ViewStyle, 
  TextStyle 
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';

// Map of category names to their respective local assets
const CATEGORY_IMAGES: Record<string, any> = {
  gym: require('../../assets/images/tab-bar/rashi/vendor/gym.webp'),
  travel: require('../../assets/images/tab-bar/rashi/vendor/travel.webp'),
  catering: require('../../assets/images/tab-bar/rashi/vendor/halvai.webp'),
  beauty: require('../../assets/images/tab-bar/rashi/vendor/Beauty.webp'),
  decorator: require('../../assets/images/tab-bar/rashi/vendor/Decorator.webp'),
  astrologer: require('../../assets/images/tab-bar/rashi/vendor/Astrologer.jpg'),
  electrician: require('../../assets/images/tab-bar/rashi/vendor/Electrician.jpg'),
  panditji: require('../../assets/images/tab-bar/rashi/vendor/panditji.jpg'),
  carpenter: require('../../assets/images/tab-bar/rashi/vendor/carpener.webp'),
  plumber: require('../../assets/images/tab-bar/rashi/vendor/plumber.webp'),
  'general store': require('../../assets/images/tab-bar/rashi/vendor/generalstore.jpg'),
  dairy: require('../../assets/images/tab-bar/rashi/vendor/dairy.jpg'),
  salon: require('../../assets/images/tab-bar/rashi/vendor/salon.webp'),
  cow: require('../../assets/images/tab-bar/rashi/vendor/cow.webp'),
  general_store_icon: require('../../assets/images/tab-bar/rashi/vendor/general_store.webp'),
  lightning: require('../../assets/images/tab-bar/rashi/vendor/lightning.webp'),
  panditji_icon: require('../../assets/images/tab-bar/rashi/vendor/panditji_icon.webp'),
  plumber_icon: require('../../assets/images/tab-bar/rashi/vendor/plumber_icon.webp'),
  salon_icon: require('../../assets/images/tab-bar/rashi/vendor/salon_icon.webp'),
  siren: require('../../assets/images/tab-bar/rashi/vendor/siren.webp'),
  hammer: require('../../assets/images/tab-bar/rashi/vendor/hammer_custom.webp'),
};

const getCategoryIconSource = (category: string) => {
  const normalized = category.toLowerCase().trim();
  if (CATEGORY_IMAGES[normalized]) {
    return CATEGORY_IMAGES[normalized];
  }
  // Substring match
  for (const key of Object.keys(CATEGORY_IMAGES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return CATEGORY_IMAGES[key];
    }
  }
  // Default fallback image
  return require('../../assets/images/tab-bar/rashi/vendor/Decorator.webp');
};

export interface VendorCategoriesProps {
  categories?: string[];
  activeCategory?: string;
  onCategoryPress?: (category: string) => void;
  horizontal?: boolean;
  tintColor?: string;
  containerStyle?: StyleProp<ViewStyle>;
  itemStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  imageSize?: number;
}

export const VendorCategories: React.FC<VendorCategoriesProps> = ({
  categories = ['GYM', 'Travel', 'Catering', 'Beauty', 'Decorator'],
  activeCategory,
  onCategoryPress,
  horizontal = true,
  tintColor = '#F26522',
  containerStyle,
  itemStyle,
  textStyle,
  imageSize = 24,
}) => {
  const router = useRouter();

  // Shuffle categories once on mount to keep order stable per session/mount lifecycle
  const [shuffledCategories] = React.useState(() => {
    const list = [...categories];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  });

  const handlePress = (category: string) => {
    if (onCategoryPress) {
      onCategoryPress(category);
    } else {
      router.push(`/vendor/category/${category}` as any);
    }
  };

  const renderItem = (category: string, index: number) => {
    const isActive = activeCategory?.toLowerCase() === category.toLowerCase();
    const finalImageSize = Platform.OS === 'android' ? 26 : imageSize;
    
    return (
      <TouchableOpacity
        key={`${category}-${index}`}
        activeOpacity={0.8}
        style={[
          styles.categoryItem,
          isActive && styles.activeItem,
          itemStyle
        ]}
        onPress={() => handlePress(category)}
      >
        <View style={[styles.iconCircle, isActive && styles.activeIconCircle]}>
          {Platform.OS === 'android' ? (
            <ExpoImage
              source={getCategoryIconSource(category)}
              style={[
                { width: finalImageSize, height: finalImageSize, tintColor: isActive ? '#FFFFFF' : '#FF6B00' },
                styles.image
              ]}
              contentFit="contain"
            />
          ) : (
            <Image
              source={getCategoryIconSource(category)}
              style={[
                { width: finalImageSize, height: finalImageSize, tintColor: isActive ? '#FFFFFF' : '#FF6B00' },
                styles.image
              ]}
              resizeMode="contain"
            />
          )}
        </View>
        <Text 
          style={[
            styles.categoryText,
            isActive && styles.activeText,
            textStyle
          ]}
          numberOfLines={1}
        >
          {category}
        </Text>
      </TouchableOpacity>
    );
  };

  if (horizontal) {
    return (
      <View style={[styles.horizontalContainer, containerStyle]}>
        {shuffledCategories.map((cat, i) => renderItem(cat, i))}
      </View>
    );
  }

  return (
    <View style={[styles.gridContainer, containerStyle]}>
      {shuffledCategories.map((cat, i) => renderItem(cat, i))}
    </View>
  );
};

const styles = StyleSheet.create({
  horizontalContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    gap: Platform.OS === 'android' ? 12 : 16,
    marginBottom: 24,
  },
  categoryItem: {
    alignItems: 'center',
    gap: 6,
  },
  activeItem: {
    opacity: 0.95,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFE2D5',
    shadowColor: '#D35400',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  activeIconCircle: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  image: {
    // Standard constraints
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2D1810',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  activeText: {
    color: '#FF6B00',
  },
});

export default VendorCategories;
