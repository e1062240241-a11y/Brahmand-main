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
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Map of category names to their respective local assets
const CATEGORY_VECTOR_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  gym: 'dumbbell',
  travel: 'airplane',
  halvai: 'food-variant',
  beauty: 'flower-poppy',
  decorator: 'palette',
  astrologer: 'orbit',
  electrician: 'flash',
  panditji: 'bell-ring',
  carpenter: 'hammer',
  plumber: 'wrench',
  'general store': 'store',
  dairy: 'cow',
  salon: 'content-cut',
  cow: 'cow',
  general_store_icon: 'store',
  lightning: 'flash',
  panditji_icon: 'bell-ring',
  plumber_icon: 'wrench',
  salon_icon: 'content-cut',
  siren: 'alert-circle',
  hammer: 'hammer',
};

const getCategoryVectorIcon = (category: string): keyof typeof MaterialCommunityIcons.glyphMap => {
  const normalized = category.toLowerCase().trim();
  if (CATEGORY_VECTOR_ICONS[normalized]) {
    return CATEGORY_VECTOR_ICONS[normalized];
  }
  for (const key of Object.keys(CATEGORY_VECTOR_ICONS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return CATEGORY_VECTOR_ICONS[key];
    }
  }
  return 'store'; // fallback
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
  categories = ['GYM', 'Travel', 'Halvai', 'Beauty', 'Decorator'],
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

  const handlePress = (category: string) => {
    if (onCategoryPress) {
      onCategoryPress(category);
    } else {
      router.push(`/vendor/category/${category}` as any);
    }
  };

  const renderItem = (category: string, index: number) => {
    const isActive = activeCategory?.toLowerCase() === category.toLowerCase();
    
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
        <MaterialCommunityIcons
          name={getCategoryVectorIcon(category)}
          size={imageSize}
          color={isActive ? '#FF8D57' : tintColor}
        />
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.horizontalContainer, containerStyle]}
      >
        {categories.map((cat, i) => renderItem(cat, i))}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.gridContainer, containerStyle]}>
      {categories.map((cat, i) => renderItem(cat, i))}
    </View>
  );
};

const styles = StyleSheet.create({
  horizontalContainer: {
    paddingHorizontal: 24,
    gap: 40,
    marginBottom: 24,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    gap: 16,
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
