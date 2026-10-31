/**
 * File: frontend/src/components/AudioVisualizerFallback.tsx
 *
 * Web Audio API Tanpura Drone & Meditative Audio Visualizer.
 *
 * Provides a zero-dependency, synthesis-based Tanpura drone whenever
 * the local `/assets/tanpura-loop.mp3` file is missing or fails to load.
 *
 * Audio Architecture:
 * - Fundamental C3 (130.81 Hz) + Fifth G3 (196.00 Hz) + Sub-octave C2 (65.41 Hz).
 * - Biquad Lowpass filter (450 Hz) creates a warm, acoustic wooden resonance.
 * - Dynamic GainNode dynamically bound to `tanpuraVolume` from `useStoryStore`.
 * - Full SSR-safe guarding (`typeof window !== 'undefined'`) and AudioContext cleanup.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useStoryStore } from '../store/useStoryStore';
import { isReducedMotionPreferred } from '../utils/hapticAndVisualFeedback';

interface TanpuraDroneFallbackProps {
  /** If true, the synthesized drone will activate when store playback is active */
  enabled?: boolean;
}

export const TanpuraDroneFallback: React.FC<TanpuraDroneFallbackProps> = ({
  enabled = true,
}) => {
  const { isTanpuraEnabled, isPlaying, tanpuraVolume } = useStoryStore();

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const isRunningRef = useRef<boolean>(false);

  // Initialize or resume Web Audio Tanpura Drone
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const shouldPlay = enabled && isTanpuraEnabled && isPlaying;

    if (shouldPlay && !isRunningRef.current) {
      try {
        const AudioCtxClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

        if (!AudioCtxClass) return;

        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
          audioCtxRef.current = new AudioCtxClass();
        }

        const ctx = audioCtxRef.current;

        // If audio context is suspended, resume it
        if (ctx.state === 'suspended') {
          ctx.resume().catch((err) => console.log('[TanpuraWebAudio] Resume notice:', err));
        }

        // Master Gain
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(
          Math.max(0, Math.min(0.4, tanpuraVolume)),
          ctx.currentTime
        );
        masterGainRef.current = masterGain;

        // Warm Lowpass Filter (eliminates harsh high frequencies, mimics hollow gourd)
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, ctx.currentTime);
        filter.Q.setValueAtTime(2.5, ctx.currentTime);

        masterGain.connect(filter);
        filter.connect(ctx.destination);

        // Acoustic Frequencies: C3 (130.81Hz), G3 (196.00Hz), C2 (65.41Hz)
        const frequencies = [
          { freq: 130.81, gain: 0.28 }, // Sa (Tonic)
          { freq: 196.00, gain: 0.18 }, // Pa (Fifth)
          { freq: 65.41, gain: 0.22 },  // Kharaj Sa (Lower Octave)
        ];

        oscillatorsRef.current = frequencies.map(({ freq, gain }) => {
          const osc = ctx.createOscillator();
          const oscGain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);

          // Subtle detune for natural chorus pulsation
          const detuneAmount = (Math.random() - 0.5) * 4;
          osc.detune.setValueAtTime(detuneAmount, ctx.currentTime);

          oscGain.gain.setValueAtTime(gain, ctx.currentTime);

          osc.connect(oscGain);
          oscGain.connect(masterGain);

          osc.start();
          return osc;
        });

        isRunningRef.current = true;
      } catch (audioInitErr) {
        console.warn('[TanpuraWebAudio] Synthesis init warning:', audioInitErr);
      }
    } else if (!shouldPlay && isRunningRef.current) {
      // Stop and clean up oscillators
      try {
        oscillatorsRef.current.forEach((osc) => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {}
        });
        oscillatorsRef.current = [];
        isRunningRef.current = false;
      } catch (stopErr) {
        console.warn('[TanpuraWebAudio] Stop warning:', stopErr);
      }
    }

    return () => {
      // Cleanup on unmount
      oscillatorsRef.current.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {}
      });
      oscillatorsRef.current = [];
      isRunningRef.current = false;

      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [enabled, isTanpuraEnabled, isPlaying]);

  // Dynamically update master gain when volume slider changes
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      const clamped = Math.max(0, Math.min(0.4, tanpuraVolume));
      masterGainRef.current.gain.setTargetAtTime(
        clamped,
        audioCtxRef.current.currentTime,
        0.05
      );
    }
  }, [tanpuraVolume]);

  return null; // Headless audio drone provider
};

/**
 * Visual meditative sound wave animation displayed in the player bar.
 * Respects prefers-reduced-motion.
 */
export const AudioVisualizerWaves: React.FC<{ isPlaying: boolean }> = ({ isPlaying }) => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(isReducedMotionPreferred());
  }, []);

  if (reducedMotion) {
    return (
      <span className="text-xs text-amber-400 font-mono">
        {isPlaying ? '● स्पंदन' : '○ शांत'}
      </span>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="flex items-center gap-0.5 h-4 px-1"
      title={isPlaying ? 'ध्वनि स्पंदन सक्रिय' : 'विराम'}
    >
      {[0.4, 0.8, 0.5, 0.9, 0.6, 0.3].map((heightScale, i) => (
        <span
          key={`bar_${i}`}
          className={`w-0.5 rounded-full bg-amber-400 transition-all duration-300 ${
            isPlaying ? 'animate-pulse' : 'opacity-40'
          }`}
          style={{
            height: isPlaying ? `${Math.round(heightScale * 14)}px` : '3px',
            animationDelay: `${i * 120}ms`,
          }}
        />
      ))}
    </div>
  );
};
