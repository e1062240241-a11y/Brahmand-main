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

const DEFAULT_OVERLAY_COLORS = ['rgba(255, 255, 255, 0.45)', 'rgba(255, 255, 255, 0.0)'];
const GRADIENT_START = { x: 0, y: 0 };
const GRADIENT_END = { x: 1, y: 1 };
const DEFAULT_BORDER_RADIUS = 15;

// ⚡ Bolt: Wrapped in React.memo and extracted inline allocations to prevent unnecessary memory churn during parent re-renders.
// Expected Impact: Reduces garbage collection pressure and prevents re-renders when parent active index timers change.
export const HomeCardTextureBg = React.memo(function HomeCardTextureBg({
    texture,
    borderRadius = DEFAULT_BORDER_RADIUS,
    children,
}: HomeCardTextureBgProps) {
    const overlayColors = CARD_TEXTURE_OVERLAY[texture] || DEFAULT_OVERLAY_COLORS;

    const containerStyle = borderRadius === DEFAULT_BORDER_RADIUS
        ? [localStyles.container, localStyles.defaultBorderRadius]
        : [localStyles.container, { borderRadius }];

    const imageStyle = borderRadius === DEFAULT_BORDER_RADIUS
        ? localStyles.defaultImageStyle
        : { borderRadius, resizeMode: 'cover' as const };

    return (
        <ImageBackground
            source={HOME_CARD_TEXTURES[texture]}
            style={containerStyle}
            imageStyle={imageStyle}
            resizeMode="cover"
        >
            {Platform.OS === 'web' ? (
                <View style={[StyleSheet.absoluteFill, localStyles.webBlurFallback]} />
            ) : (
                <BlurView intensity={25} tint="light" style={StyleSheet.absoluteFill} />
            )}
            <LinearGradient
                colors={overlayColors}
                start={GRADIENT_START}
                end={GRADIENT_END}
                style={StyleSheet.absoluteFill}
            />
            <View style={homeStyles.cardTextureContent}>{children}</View>
        </ImageBackground>
    );
});

HomeCardTextureBg.displayName = 'HomeCardTextureBg';

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
    defaultBorderRadius: {
        borderRadius: DEFAULT_BORDER_RADIUS,
    },
    defaultImageStyle: {
        borderRadius: DEFAULT_BORDER_RADIUS,
        resizeMode: 'cover',
    },
});
