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
  gym: require('../../assets/images/tab-bar/rashi/vendor/gym.png'),
  travel: require('../../assets/images/tab-bar/rashi/vendor/travel.png'),
  catering: require('../../assets/images/tab-bar/rashi/vendor/halvai.png'),
  beauty: require('../../assets/images/tab-bar/rashi/vendor/Beauty.png'),
  decorator: require('../../assets/images/tab-bar/rashi/vendor/Decorator.png'),
  astrologer: require('../../assets/images/tab-bar/rashi/vendor/Astrologer.jpg'),
  electrician: require('../../assets/images/tab-bar/rashi/vendor/Electrician.jpg'),
  panditji: require('../../assets/images/tab-bar/rashi/vendor/panditji.jpg'),
  carpenter: require('../../assets/images/tab-bar/rashi/vendor/carpener.png'),
  plumber: require('../../assets/images/tab-bar/rashi/vendor/plumber.png'),
  'general store': require('../../assets/images/tab-bar/rashi/vendor/generalstore.jpg'),
  dairy: require('../../assets/images/tab-bar/rashi/vendor/dairy.jpg'),
  salon: require('../../assets/images/tab-bar/rashi/vendor/salon.png'),
  cow: require('../../assets/images/tab-bar/rashi/vendor/cow.png'),
  general_store_icon: require('../../assets/images/tab-bar/rashi/vendor/general_store.png'),
  lightning: require('../../assets/images/tab-bar/rashi/vendor/lightning.png'),
  panditji_icon: require('../../assets/images/tab-bar/rashi/vendor/panditji_icon.png'),
  plumber_icon: require('../../assets/images/tab-bar/rashi/vendor/plumber_icon.png'),
  salon_icon: require('../../assets/images/tab-bar/rashi/vendor/salon_icon.png'),
  siren: require('../../assets/images/tab-bar/rashi/vendor/siren.png'),
  hammer: require('../../assets/images/tab-bar/rashi/vendor/hammer_custom.png'),
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
  return require('../../assets/images/tab-bar/rashi/vendor/Decorator.png');
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
    const finalImageSize = Platform.OS === 'android' ? 28 : imageSize;
    
    return (
      <TouchableOpacity
        key={`${category}-${index}`}
        style={[
          styles.categoryItem,
          isActive && styles.activeItem,
          itemStyle
        ]}
        onPress={() => handlePress(category)}
      >
        {Platform.OS === 'android' ? (
          <ExpoImage
            source={getCategoryIconSource(category)}
            style={[
              { width: finalImageSize, height: finalImageSize, tintColor: isActive ? '#FF8D57' : tintColor },
              styles.image
            ]}
            contentFit="contain"
          />
        ) : (
          <Image
            source={getCategoryIconSource(category)}
            style={[
              { width: finalImageSize, height: finalImageSize, tintColor: isActive ? '#FF8D57' : tintColor },
              styles.image
            ]}
            resizeMode="contain"
          />
        )}
        <Text 
          style={[
            styles.categoryText,
            isActive && styles.activeText,
            textStyle
          ]}
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
    marginHorizontal: 24,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    gap: 8,
  },
  activeItem: {
    opacity: 0.9,
  },
  image: {
    // Standard constraints
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  activeText: {
    color: '#FF8D57',
  },
});

export default VendorCategories;
