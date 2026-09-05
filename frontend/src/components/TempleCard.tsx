import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  Platform,
  StyleSheet,
  ImageSourcePropType,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface TempleCardProps {
  item: any;
  safeItemId: string;
  safeName: string;
  imageSource: ImageSourcePropType | { uri: string };
  router: any;
  t: (key: string) => string;
  renderSafeText: (val: any) => string;
  getTranslatedTempleName: (name: string) => string;
  getTranslatedTempleLocation: (location: string, templeName?: string) => string;
  getTempleLocation: (temple: any) => string;
}

export const TempleCard = React.memo(({
  item,
  safeItemId,
  safeName,
  imageSource,
  router,
  t,
  renderSafeText,
  getTranslatedTempleName,
  getTranslatedTempleLocation,
  getTempleLocation,
}: TempleCardProps) => {
  const [currentSource, setCurrentSource] = useState(imageSource);
  const [hasError, setHasError] = useState(false);
  const targetId = item?.temple_id || item?.templeId || item?.id || safeItemId;

  useEffect(() => {
    setCurrentSource(imageSource);
    setHasError(false);
  }, [imageSource, targetId, safeName]);

  const rawDeity = renderSafeText(item?.deity) || 'LORD SHIVA';
  let formattedDeity = rawDeity;
  if (safeName.toLowerCase().includes('iskcon') || safeName.toLowerCase().includes('borivali')) {
    formattedDeity = 'LORD KRISHNA';
  }
  if (t('language') === 'hi') {
    if (formattedDeity.toUpperCase().includes('SHIVA')) formattedDeity = 'भगवान शिव';
    else if (formattedDeity.toUpperCase().includes('KRISHNA')) formattedDeity = 'भगवान कृष्ण';
    else if (formattedDeity.toUpperCase().includes('DURGA') || formattedDeity.toUpperCase().includes('SHAKTI')) formattedDeity = 'माँ दुर्गा';
    else if (formattedDeity.toUpperCase().includes('VISHNU')) formattedDeity = 'भगवान विष्णु';
    else if (formattedDeity.toUpperCase().includes('HANUMAN')) formattedDeity = 'भगवान हनुमान';
    else if (formattedDeity.toUpperCase().includes('GANESHA') || formattedDeity.toUpperCase().includes('GANESH')) formattedDeity = 'भगवान गणेश';
  }

  const isPressingRef = useRef(false);
  const handlePress = () => {
    if (isPressingRef.current) return;
    isPressingRef.current = true;
    try {
      router.push(`/temple/${encodeURIComponent(targetId)}`);
    } finally {
      setTimeout(() => {
        isPressingRef.current = false;
      }, 800);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.newTempleCard,
        pressed && Platform.OS === 'ios' && { opacity: 0.8 }
      ]}
      android_ripple={{ color: 'rgba(255, 107, 0, 0.15)', borderless: false }}
      onPress={handlePress}
    >
      {hasError ? (
        <View style={[styles.newTempleCardImg, { backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FED7AA' }]}>
          <MaterialCommunityIcons name="temple-hindu" size={40} color="#FF6B00" />
        </View>
      ) : (
        <Image
          source={currentSource}
          style={styles.newTempleCardImg}
          resizeMode="cover"
          onError={() => setHasError(true)}
        />
      )}
      <View style={styles.newTempleCardInfo}>
        <View>
          <Text style={styles.newTempleCardDeity} numberOfLines={1}>
            {formattedDeity}
          </Text>
          <Text style={styles.newTempleCardName} numberOfLines={2}>{getTranslatedTempleName(safeName)}</Text>
          <Text style={styles.newTempleCardLoc} numberOfLines={1}>{getTranslatedTempleLocation(getTempleLocation(item), safeName)}</Text>
        </View>
      </View>
    </Pressable>
  );
});

export const TempleCardImageItem = TempleCard;

const styles = StyleSheet.create({
  newTempleCard: {
    backgroundColor: '#FFF',
    minHeight: 127,
    alignSelf: 'stretch',
    borderRadius: 16,
    padding: 12,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  newTempleCardImg: {
    width: 80,
    height: 95,
    borderRadius: 12,
  },
  newTempleCardInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  newTempleCardDeity: {
    color: '#FF6B35',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
    alignSelf: 'flex-start',
  },
  newTempleCardName: {
    color: '#1C1C1E',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 2,
  },
  newTempleCardLoc: {
    color: 'rgba(0, 0, 0, 0.61)',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
});

export default TempleCard;
