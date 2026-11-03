/**
 * File: frontend/src/constants/gitaCosmicMedia.ts
 *
 * Media configuration for Brahmand Library - Bhagavad Gita Katha Sangrah
 * Cinematic Cosmic Kurukshetra looping video & high-definition poster.
 */

import { API_URL } from '../services/api';

const API_BASE_URL = (API_URL || process.env.EXPO_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

export const GITA_COSMIC_MEDIA = {
  // Local bundled looping video asset (guaranteed offline / immediate playback on Android & iOS)
  videoLocal: require('../../assets/videos/gita_cosmic_katha_loop.mp4'),

  // Remote streaming video loop endpoint (HTTP 206 supported H.264 MP4)
  videoUrl: `${API_BASE_URL}/api/library/bhagavad-gita/cosmic-video`,
  
  // Remote streaming poster endpoint
  posterUrl: `${API_BASE_URL}/api/library/bhagavad-gita/cosmic-poster`,

  // Local bundled high-resolution poster asset fallback
  posterLocal: require('../../assets/images/gita_cosmic_katha.jpg'),

  // Theme labels
  themeTitleHi: 'काल-चेतना एवं कुरुक्षेत्र दृश्य',
  themeTitleEn: 'Cosmic Kurukshetra & Wheel of Time',
};
