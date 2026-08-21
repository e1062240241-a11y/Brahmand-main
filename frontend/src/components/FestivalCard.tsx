import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import ViewShot from 'react-native-view-shot';

interface FestivalCardProps {
  festivalName: string;
  recipientName: string;
  customMessage: string;
  festivalDescription: string;
  backgroundImageUri: string;
}

export interface FestivalCardRef {
  capture: () => Promise<string>;
}

export const FestivalCard = forwardRef<FestivalCardRef, FestivalCardProps>(
  ({ festivalName, recipientName, customMessage, festivalDescription, backgroundImageUri }, ref) => {
    const viewRef = useRef<ViewShot>(null);

    useImperativeHandle(ref, () => ({
      capture: async () => {
        if (viewRef.current && viewRef.current.capture) {
          const uri = await viewRef.current.capture();
          return uri;
        }
        throw new Error('ViewShot capture failed');
      },
    }));

    return (
      <ViewShot
        ref={viewRef}
        options={{
          format: 'png',
          quality: 1,
          width: 360,
          height: 640,
        }}
      >
        <View style={styles.cardContainer}>
          {/* Background Image */}
          {backgroundImageUri ? (
            <Image source={{ uri: backgroundImageUri }} style={styles.backgroundImage} />
          ) : null}
          
          {/* Dark Overlay */}
          <View style={styles.overlay} />

          {/* Content */}
          <View style={styles.contentContainer}>
            {/* Festival Title */}
            <Text style={styles.festivalTitle}>✨ {festivalName} ✨</Text>

            {/* Recipient Name */}
            {recipientName ? (
              <Text style={styles.recipientText}>Dear {recipientName},</Text>
            ) : null}

            {/* Festival Description */}
            {festivalDescription ? (
              <Text style={styles.descriptionText}>{festivalDescription}</Text>
            ) : null}

            {/* Custom Message */}
            {customMessage ? (
              <Text style={styles.messageText}>{customMessage}</Text>
            ) : null}

            {/* Download Link Section - Clean & Minimal */}
            <View style={styles.downloadSection}>
              <Text style={styles.downloadLabel}>Download Brahmand App</Text>
              <Text style={styles.downloadLink}>play.google.com/store/apps/details?id=com.brahmand.app</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Made with ❤️ on Brahmand</Text>
          </View>
        </View>
      </ViewShot>
    );
  }
);

const styles = StyleSheet.create({
  cardContainer: {
    width: 360,
    height: 640,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 40,
  },
  festivalTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 20,
  },
  recipientText: {
    fontSize: 22,
    color: '#FFF',
    fontWeight: '600',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  descriptionText: {
    fontSize: 15,
    color: '#E0E0E0',
    lineHeight: 22,
    marginBottom: 16,
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  messageText: {
    fontSize: 17,
    color: '#FFF',
    lineHeight: 24,
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  downloadSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  downloadLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  downloadLink: {
    fontSize: 11,
    color: '#0066CC',
    fontWeight: '500',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  footer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
});

FestivalCard.displayName = 'FestivalCard';
