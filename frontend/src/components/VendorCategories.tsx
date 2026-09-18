import React, { useMemo, useCallback } from 'react';
import { 
  TouchableOpacity, 
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

interface CategoryAssetSource {
  uri: string;
}

// Map of category names to their respective local assets
const CATEGORY_IMAGES: Record<string, CategoryAssetSource> = {
  gym: { uri: 'https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/gym.webp' },
  travel: { uri: 'https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/travel.webp' },
  catering: { uri: 'https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/halvai.webp' },
  beauty: { uri: 'https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/Beauty.webp' },
  decorator: { uri: 'https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/Decorator.webp' },
  astrologer: { uri: 'https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/Astrologer.webp' },
  electrician: { uri: 'https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/Electrician.webp' },
  panditji: { uri: 'https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/panditji.webp' },
  carpenter: { uri: 'https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/carpener.webp' },
  plumber: { uri: 'https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/plumber.webp' },
  'general store': { uri: 'https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/generalstore.webp' },
  dairy: { uri: 'https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/dairy.webp' },
  salon: { uri: 'https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/salon.webp' },
  cow: { uri: 'https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/cow.webp' },
  general_store_icon: { uri: 'https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/general_store.webp' },
  lightning: { uri: 'https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/lightning.webp' },
  panditji_icon: { uri: 'https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/panditji_icon.webp' },
  plumber_icon: { uri: 'https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/plumber_icon.webp' },
  salon_icon: { uri: 'https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/salon_icon.webp' },
  siren: { uri: 'https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/siren.webp' },
  hammer: { uri: 'https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/hammer_custom.webp' },
};

const DEFAULT_FALLBACK_IMAGE: CategoryAssetSource = {
  uri: 'https://brahmandfeed23.b-cdn.net/assets/tab-bar/rashi/vendor/Decorator.webp',
};

const getCategoryIconSource = (category: string): CategoryAssetSource => {
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
  return DEFAULT_FALLBACK_IMAGE;
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

interface CategoryItemProps {
  category: string;
  isActive: boolean;
  imageSize: number;
  itemStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  onPress: (category: string) => void;
}

// Varnish fix: Extract memoized CategoryItem to eliminate inline function closures and style object creations during render pass
const CategoryItem = React.memo<CategoryItemProps>(({
  category,
  isActive,
  imageSize,
  itemStyle,
  textStyle,
  onPress,
}) => {
  const finalImageSize = Platform.OS === 'android' ? 26 : imageSize;
  const imageStyle = useMemo(
    () => ({ width: finalImageSize, height: finalImageSize }),
    [finalImageSize]
  );

  const handlePress = useCallback(() => {
    onPress(category);
  }, [category, onPress]);

  const source = useMemo(() => getCategoryIconSource(category), [category]);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[
        styles.categoryItem,
        isActive && styles.activeItem,
        itemStyle,
      ]}
      onPress={handlePress}
    >
      <View style={[styles.iconCircle, isActive && styles.activeIconCircle]}>
        <ExpoImage
          source={source}
          style={imageStyle}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
      </View>
      <Text
        style={[
          styles.categoryText,
          isActive && styles.activeText,
          textStyle,
        ]}
        numberOfLines={1}
      >
        {category}
      </Text>
    </TouchableOpacity>
  );
});
CategoryItem.displayName = 'CategoryItem';

const DEFAULT_CATEGORIES = ['GYM', 'Travel', 'Catering', 'Beauty', 'Decorator'];

// Varnish fix: Wrap component with React.memo and prevent random reshuffling on parent render passes
export const VendorCategories = React.memo<VendorCategoriesProps>(({
  categories = DEFAULT_CATEGORIES,
  activeCategory,
  onCategoryPress,
  horizontal = true,
  containerStyle,
  itemStyle,
  textStyle,
  imageSize = 24,
}) => {
  const router = useRouter();

  // Stable category key ensures list is only reshuffled when item contents actually change, preserving order stability across parent re-renders
  const categoriesKey = categories.join(',');
  const shuffledCategories = useMemo(() => {
    const list = [...categories];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }, [categoriesKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePress = useCallback((category: string) => {
    if (onCategoryPress) {
      onCategoryPress(category);
    } else {
      router.push(`/vendor/category/${category}` as any);
    }
  }, [onCategoryPress, router]);

  return (
    <View style={[horizontal ? styles.horizontalContainer : styles.gridContainer, containerStyle]}>
      {shuffledCategories.map((cat, i) => {
        const isActive = activeCategory?.toLowerCase() === cat.toLowerCase();
        return (
          <CategoryItem
            key={`${cat}-${i}`}
            category={cat}
            isActive={isActive}
            imageSize={imageSize}
            itemStyle={itemStyle}
            textStyle={textStyle}
            onPress={handlePress}
          />
        );
      })}
    </View>
  );
});
VendorCategories.displayName = 'VendorCategories';

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
