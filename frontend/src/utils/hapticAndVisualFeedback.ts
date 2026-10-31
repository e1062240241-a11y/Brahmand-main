/**
 * File: frontend/src/utils/hapticAndVisualFeedback.ts
 *
 * Sensory Polish & Tactile Feedback for Brahmand Library - Cosmic Storyteller Mode ("मैं समय हूँ").
 *
 * Provides Mala-bead sensory rhythm on dramatic dialogue and scene cue transitions:
 * 1. Primary: 30ms subtle tactile vibration (Mala-bead click).
 * 2. Visual Fallback: Temporary 300ms golden aura pulse for iOS Safari / devices without vibration motors.
 * 3. Accessibility: Respects prefers-reduced-motion by suppressing visual pulse and limiting vibration.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Checks if the user prefers reduced motion for accessibility.
 */
export function isReducedMotionPreferred(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Unified feedback trigger:
 * - Fires a 30ms Mala-bead vibration if supported.
 * - If vibration is unsupported (e.g. iOS Safari) and motion is permitted, invokes onVisualPulse.
 */
export function triggerCueFeedback(onVisualPulse?: (pulsing: boolean) => void): void {
  const reducedMotion = isReducedMotionPreferred();

  // 1. Tactile feedback (30ms Mala bead tap)
  let vibrationSucceeded = false;
  if (!reducedMotion && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      vibrationSucceeded = navigator.vibrate(30);
    } catch {
      vibrationSucceeded = false;
    }
  }

  // 2. Visual pulse fallback (300ms golden border aura)
  // Used when vibration is unavailable (iOS Safari) or failed, provided reduced motion is NOT active
  if (!reducedMotion && onVisualPulse) {
    // If vibration succeeded, we don't strictly need visual pulse, but for cross-platform harmony
    // we fire visual pulse if vibration was not available or as subtle augmentation.
    if (!vibrationSucceeded) {
      onVisualPulse(true);
      setTimeout(() => {
        onVisualPulse(false);
      }, 300);
    }
  }
}

/**
 * React hook for components needing synchronized tactile + visual fallback feedback.
 */
export function useCueFeedback(pulseDurationMs: number = 300) {
  const [isVisualPulsing, setIsVisualPulsing] = useState<boolean>(false);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trigger = useCallback(() => {
    const reducedMotion = isReducedMotionPreferred();

    // 1. Tactile vibration
    let vibrated = false;
    if (!reducedMotion && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        vibrated = navigator.vibrate(30);
      } catch {
        vibrated = false;
      }
    }

    // 2. Visual pulse fallback
    if (!reducedMotion && !vibrated) {
      if (pulseTimerRef.current) {
        clearTimeout(pulseTimerRef.current);
      }
      setIsVisualPulsing(true);
      pulseTimerRef.current = setTimeout(() => {
        setIsVisualPulsing(false);
      }, pulseDurationMs);
    }
  }, [pulseDurationMs]);

  useEffect(() => {
    return () => {
      if (pulseTimerRef.current) {
        clearTimeout(pulseTimerRef.current);
      }
    };
  }, []);

  return {
    isVisualPulsing,
    triggerFeedback: trigger,
  };
}
