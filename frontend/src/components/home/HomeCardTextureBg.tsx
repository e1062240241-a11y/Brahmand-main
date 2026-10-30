import React from 'react';
import { ImageBackground, StyleSheet, View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { styles as homeStyles } from './home.styles';
import { HOME_CARD_TEXTURES, CARD_TEXTURE_OVERLAY, HomeCardTextureKey } from './homeConstants';

export interface HomeCardTextureBgProps {
    texture: HomeCardTextureKey;
    borderRadius?: number;
    children?: React.ReactNode;
}

export function HomeCardTextureBg({
    texture,
    borderRadius = 15,
    children,
}: HomeCardTextureBgProps) {
    const overlayColors = CARD_TEXTURE_OVERLAY[texture] || ['rgba(255, 255, 255, 0.45)', 'rgba(255, 255, 255, 0.0)'];

    return (
        <ImageBackground
            source={HOME_CARD_TEXTURES[texture]}
            style={[localStyles.container, { borderRadius }]}
            imageStyle={{ borderRadius, resizeMode: 'cover' }}
            resizeMode="cover"
        >
            {Platform.OS === 'web' ? (
                <View style={[StyleSheet.absoluteFill, localStyles.webBlurFallback]} />
            ) : (
                <BlurView intensity={25} tint="light" style={StyleSheet.absoluteFill} />
            )}
            <LinearGradient
                colors={overlayColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            <View style={homeStyles.cardTextureContent}>{children}</View>
        </ImageBackground>
    );
}

const localStyles = StyleSheet.create({
    container: {
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.65)',
    },
    webBlurFallback: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
});
