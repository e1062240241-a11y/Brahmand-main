import React from 'react';
import { ImageBackground, StyleSheet, View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from './home.styles';
import { HOME_CARD_TEXTURES, HomeCardTextureKey } from './homeConstants';

export function HomeCardTextureBg({
    texture,
    borderRadius = 15,
    children,
}: {
    texture: HomeCardTextureKey;
    borderRadius?: number;
    children: React.ReactNode;
}) {
    return (
        <ImageBackground
            source={HOME_CARD_TEXTURES[texture]}
            style={[StyleSheet.absoluteFillObject, { borderRadius, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.65)' }]}
            imageStyle={{ borderRadius, resizeMode: 'cover' }}
            resizeMode="cover"
        >
            {Platform.OS === 'web' ? (
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]} />
            ) : (
                <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFillObject} />
            )}
            <LinearGradient
                colors={['rgba(255, 255, 255, 0.45)', 'rgba(255, 255, 255, 0.0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.cardTextureContent}>{children}</View>
        </ImageBackground>
    );
}
