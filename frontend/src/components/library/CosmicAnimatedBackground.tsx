import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Platform, StyleProp, ViewStyle, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export interface CosmicAnimatedBackgroundProps {
  style?: StyleProp<ViewStyle>;
  showKaalChakra?: boolean;
  speed?: number;
  starCount?: number;
  particleCount?: number;
  overlayOpacity?: number;
  interactive?: boolean;
}

/**
 * Builds the standalone HTML, CSS and JavaScript bundle for the cosmic animation.
 * Features:
 * - Multi-layer CSS keyframe nebulae (Golden Brahmajyoti, Mystic Violet, Ethereal Cyan)
 * - HTML5 Canvas starfield with twinkling phases, depths and diffraction spikes
 * - Sacred Kaal Chakra (The Eternal Cosmic Wheel of Time) with sacred geometry
 * - Upward floating divine golden stardust (Brahma-Kanas)
 * - Luminous shooting stars with fading gradient tails
 * - Interactive pointer/touch gravity & sparkle ripples
 */
function buildCosmicAnimationHtml(options: {
  showKaalChakra: boolean;
  speed: number;
  starCount: number;
  particleCount: number;
  interactive: boolean;
}): string {
  const { showKaalChakra, speed, starCount, particleCount, interactive } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Cosmic Katha Animation</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
    }

    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #05040a;
    }

    #universe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: radial-gradient(circle at 50% 45%, #14092b 0%, #0c061a 50%, #050409 100%);
    }

    /* CSS Multi-layer Swirling Nebulae */
    .nebula {
      position: absolute;
      border-radius: 50%;
      filter: blur(60px);
      pointer-events: none;
      mix-blend-mode: screen;
      opacity: 0.65;
      will-change: transform, opacity;
    }

    .nebula-gold {
      width: 120vw;
      height: 120vw;
      max-width: 600px;
      max-height: 600px;
      top: -15%;
      left: -15%;
      background: radial-gradient(circle, rgba(245, 158, 11, 0.32) 0%, rgba(217, 119, 6, 0.12) 45%, transparent 70%);
      animation: swirl-cw 34s ease-in-out infinite alternate;
    }

    .nebula-violet {
      width: 130vw;
      height: 130vw;
      max-width: 650px;
      max-height: 650px;
      bottom: -20%;
      right: -20%;
      background: radial-gradient(circle, rgba(139, 92, 246, 0.28) 0%, rgba(99, 102, 241, 0.12) 45%, transparent 72%);
      animation: swirl-ccw 40s ease-in-out infinite alternate;
    }

    .nebula-cyan {
      width: 85vw;
      height: 85vw;
      max-width: 440px;
      max-height: 440px;
      top: 35%;
      left: 15%;
      background: radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, rgba(14, 165, 233, 0.06) 50%, transparent 70%);
      animation: pulse-glow 20s ease-in-out infinite alternate;
    }

    @keyframes swirl-cw {
      0% {
        transform: rotate(0deg) scale(0.95) translate(0, 0);
      }
      50% {
        transform: rotate(180deg) scale(1.12) translate(25px, 15px);
      }
      100% {
        transform: rotate(360deg) scale(0.95) translate(0, 0);
      }
    }

    @keyframes swirl-ccw {
      0% {
        transform: rotate(360deg) scale(1.08) translate(0, 0);
      }
      50% {
        transform: rotate(180deg) scale(0.92) translate(-25px, -20px);
      }
      100% {
        transform: rotate(0deg) scale(1.08) translate(0, 0);
      }
    }

    @keyframes pulse-glow {
      0% {
        transform: scale(0.88);
        opacity: 0.45;
      }
      50% {
        transform: scale(1.16);
        opacity: 0.8;
      }
      100% {
        transform: scale(0.88);
        opacity: 0.45;
      }
    }

    /* Vignette Edge Shading */
    .vignette {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: radial-gradient(ellipse at center, transparent 30%, rgba(4, 3, 8, 0.7) 100%);
    }

    /* Canvas for Stardust, Stars, Kaal Chakra */
    #cosmic-canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: block;
      touch-action: none;
    }
  </style>
</head>
<body>
  <div id="universe">
    <div class="nebula nebula-gold"></div>
    <div class="nebula nebula-violet"></div>
    <div class="nebula nebula-cyan"></div>
    <canvas id="cosmic-canvas"></canvas>
    <div class="vignette"></div>
  </div>

  <script>
    (function () {
      const canvas = document.getElementById('cosmic-canvas');
      const ctx = canvas.getContext('2d');
      const showKaalChakra = ${showKaalChakra};
      const speedMultiplier = ${speed};
      const STAR_COUNT = ${starCount};
      const PARTICLE_COUNT = ${particleCount};
      const isInteractive = ${interactive};

      let width = 0;
      let height = 0;
      let dpr = 1;

      function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(dpr, dpr);
      }

      window.addEventListener('resize', resize);
      resize();

      // ==========================================
      // 1. STARFIELD (Layered Depth & Twinkle)
      // ==========================================
      const STAR_PALETTES = [
        '#FFFFFF', // Pure starlight
        '#FEF3C7', // Warm gold
        '#FDE68A', // Deep gold
        '#BAE6FD', // Celestial cyan
        '#E9D5FF', // Mystical violet
      ];

      const stars = [];
      for (let i = 0; i < STAR_COUNT; i++) {
        const layer = Math.random();
        let radius, baseAlpha, speedVal;

        if (layer < 0.6) {
          // Deep far stars
          radius = 0.5 + Math.random() * 0.7;
          baseAlpha = 0.25 + Math.random() * 0.45;
          speedVal = 0.0015 + Math.random() * 0.0025;
        } else if (layer < 0.9) {
          // Mid twinkling stars
          radius = 1.0 + Math.random() * 0.9;
          baseAlpha = 0.45 + Math.random() * 0.4;
          speedVal = 0.0025 + Math.random() * 0.0035;
        } else {
          // Bright prominent beacon stars
          radius = 1.8 + Math.random() * 1.0;
          baseAlpha = 0.75 + Math.random() * 0.25;
          speedVal = 0.0035 + Math.random() * 0.004;
        }

        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius,
          baseAlpha,
          speed: speedVal * speedMultiplier,
          phase: Math.random() * Math.PI * 2,
          color: STAR_PALETTES[Math.floor(Math.random() * STAR_PALETTES.length)],
          hasSpike: layer > 0.92,
        });
      }

      // ==========================================
      // 2. DIVINE GOLDEN STARDUST (Brahma-Kanas)
      // ==========================================
      const particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: 1.2 + Math.random() * 2.2,
          alpha: 0.25 + Math.random() * 0.65,
          vy: -(0.25 + Math.random() * 0.55) * speedMultiplier,
          swayAmp: 0.4 + Math.random() * 0.8,
          swaySpeed: (0.0012 + Math.random() * 0.0018) * speedMultiplier,
          swayPhase: Math.random() * Math.PI * 2,
          hue: 38 + Math.random() * 14, // Golden-amber hue 38 to 52
        });
      }

      // ==========================================
      // 3. SHOOTING STARS / METEORS
      // ==========================================
      const shootingStars = [];
      let nextMeteorTime = performance.now() + 2500;

      function spawnMeteor() {
        const startX = Math.random() * (width * 0.8);
        const startY = Math.random() * (height * 0.4);
        const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.35; // ~45 deg
        const speed = (6 + Math.random() * 5) * speedMultiplier;
        const length = 90 + Math.random() * 90;

        shootingStars.push({
          x: startX,
          y: startY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          length,
          alpha: 1.0,
          decay: 0.018 + Math.random() * 0.012,
          color: Math.random() > 0.4 ? '#FDE68A' : '#E0F2FE',
        });
      }

      // ==========================================
      // 4. INTERACTION TOUCH / SPARKLE RIPPLES
      // ==========================================
      const ripples = [];
      let pointerX = -100;
      let pointerY = -100;

      if (isInteractive) {
        function addTouchSparks(clientX, clientY) {
          pointerX = clientX;
          pointerY = clientY;
          for (let k = 0; k < 4; k++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 0.8 + Math.random() * 2.2;
            ripples.push({
              x: clientX,
              y: clientY,
              vx: Math.cos(angle) * spd,
              vy: Math.sin(angle) * spd,
              alpha: 0.9,
              radius: 1.5 + Math.random() * 2.0,
              decay: 0.03 + Math.random() * 0.02,
            });
          }
        }

        window.addEventListener('pointermove', function (e) {
          addTouchSparks(e.clientX, e.clientY);
        });

        window.addEventListener('touchmove', function (e) {
          if (e.touches && e.touches[0]) {
            addTouchSparks(e.touches[0].clientX, e.touches[0].clientY);
          }
        }, { passive: true });
      }

      // ==========================================
      // 5. SACRED KAAL CHAKRA (The Wheel of Time)
      // ==========================================
      function drawKaalChakra(centerX, centerY, radius, time) {
        const rotCw = time * 0.00028 * speedMultiplier;
        const rotCcw = -time * 0.00018 * speedMultiplier;

        ctx.save();
        ctx.translate(centerX, centerY);

        // Core Golden Bindu Glow
        const binduGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.32);
        binduGrad.addColorStop(0, 'rgba(251, 191, 36, 0.4)');
        binduGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.15)');
        binduGrad.addColorStop(1, 'rgba(217, 119, 6, 0)');
        ctx.fillStyle = binduGrad;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.32, 0, Math.PI * 2);
        ctx.fill();

        // Innermost Radiant Ring & Bindu Dot
        ctx.strokeStyle = 'rgba(253, 230, 138, 0.65)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.08, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(254, 243, 199, 0.85)';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        // Inner 12-Spoke Solar Wheel (Dwadasha Adityas)
        ctx.save();
        ctx.rotate(rotCw);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.38)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 12; i++) {
          const a = (i * Math.PI) / 6;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * (radius * 0.08), Math.sin(a) * (radius * 0.08));
          ctx.lineTo(Math.cos(a) * (radius * 0.48), Math.sin(a) * (radius * 0.48));
          ctx.stroke();
        }

        // Inner Petal Arc Ring
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.42)';
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.48, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Middle 24-Hora Ring (Counter-rotating)
        ctx.save();
        ctx.rotate(rotCcw);
        ctx.strokeStyle = 'rgba(217, 119, 6, 0.3)';
        ctx.lineWidth = 0.8;
        for (let j = 0; j < 24; j++) {
          const a2 = (j * Math.PI) / 12;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a2) * (radius * 0.52), Math.sin(a2) * (radius * 0.52));
          ctx.lineTo(Math.cos(a2) * (radius * 0.68), Math.sin(a2) * (radius * 0.68));
          ctx.stroke();
        }

        // Dotted Ring
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.72, 0, Math.PI * 2);
        ctx.setLineDash([3, 7]);
        ctx.strokeStyle = 'rgba(253, 230, 138, 0.45)';
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Outermost Great Celestial Ring with Orbital Beads
        ctx.save();
        ctx.rotate(rotCw * 0.5);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();

        // 8 Cardinal Beads on the Outer Ring
        ctx.fillStyle = 'rgba(254, 243, 199, 0.75)';
        for (let b = 0; b < 8; b++) {
          const ba = (b * Math.PI) / 4;
          const bx = Math.cos(ba) * radius;
          const by = Math.sin(ba) * radius;
          ctx.beginPath();
          ctx.arc(bx, by, 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        ctx.restore();
      }

      // ==========================================
      // MAIN ANIMATION LOOP (60 FPS)
      // ==========================================
      function render(time) {
        ctx.clearRect(0, 0, width, height);

        // A. Draw Sacred Kaal Chakra (Upper Center Backdrop)
        if (showKaalChakra) {
          const chakraRadius = Math.min(width, height) * 0.32;
          const chakraCenterX = width * 0.5;
          const chakraCenterY = height * 0.38;
          drawKaalChakra(chakraCenterX, chakraCenterY, chakraRadius, time);
        }

        // B. Render Stars
        for (let i = 0; i < stars.length; i++) {
          const s = stars[i];
          const twinkle = Math.sin(time * s.speed + s.phase);
          const currentAlpha = Math.max(0.12, Math.min(1.0, s.baseAlpha + twinkle * 0.38));

          ctx.fillStyle = s.color;
          ctx.globalAlpha = currentAlpha;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.fill();

          // 4-Point Cross Spike for Bright Stars
          if (s.hasSpike && currentAlpha > 0.6) {
            ctx.strokeStyle = s.color;
            ctx.lineWidth = 0.6;
            ctx.globalAlpha = currentAlpha * 0.5;
            const spikeLen = s.radius * 3.6;

            ctx.beginPath();
            ctx.moveTo(s.x - spikeLen, s.y);
            ctx.lineTo(s.x + spikeLen, s.y);
            ctx.moveTo(s.x, s.y - spikeLen);
            ctx.lineTo(s.x, s.y + spikeLen);
            ctx.stroke();
          }
        }

        // C. Render Divine Golden Stardust (Brahma-Kanas)
        ctx.globalAlpha = 1.0;
        for (let j = 0; j < particles.length; j++) {
          const p = particles[j];

          // Upward float & gentle horizontal sway
          p.y += p.vy;
          p.x += Math.sin(time * p.swaySpeed + p.swayPhase) * p.swayAmp;

          // Interactive subtle gravity pull towards pointer
          if (isInteractive && pointerX > 0) {
            const dx = pointerX - p.x;
            const dy = pointerY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120 && dist > 1) {
              p.x += (dx / dist) * 0.45;
              p.y += (dy / dist) * 0.45;
            }
          }

          // Wrap around top to bottom
          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }

          // Soft Glowing Particle Halo
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2.2);
          grad.addColorStop(0, 'hsla(' + p.hue + ', 95%, 72%, ' + p.alpha + ')');
          grad.addColorStop(0.5, 'hsla(' + p.hue + ', 90%, 55%, ' + (p.alpha * 0.4) + ')');
          grad.addColorStop(1, 'hsla(' + p.hue + ', 90%, 50%, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }

        // D. Shooting Stars
        if (time > nextMeteorTime) {
          spawnMeteor();
          nextMeteorTime = time + 3500 + Math.random() * 4500;
        }

        for (let m = shootingStars.length - 1; m >= 0; m--) {
          const met = shootingStars[m];
          met.x += met.vx;
          met.y += met.vy;
          met.alpha -= met.decay;

          if (met.alpha <= 0) {
            shootingStars.splice(m, 1);
            continue;
          }

          const tailX = met.x - (met.vx / Math.hypot(met.vx, met.vy)) * met.length;
          const tailY = met.y - (met.vy / Math.hypot(met.vx, met.vy)) * met.length;

          const metGrad = ctx.createLinearGradient(tailX, tailY, met.x, met.y);
          metGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          metGrad.addColorStop(0.7, met.color);
          metGrad.addColorStop(1, '#FFFFFF');

          ctx.strokeStyle = metGrad;
          ctx.lineWidth = 1.8;
          ctx.globalAlpha = met.alpha;
          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(met.x, met.y);
          ctx.stroke();
        }

        // E. Touch Sparkle Ripples
        for (let r = ripples.length - 1; r >= 0; r--) {
          const rip = ripples[r];
          rip.x += rip.vx;
          rip.y += rip.vy;
          rip.alpha -= rip.decay;

          if (rip.alpha <= 0) {
            ripples.splice(r, 1);
            continue;
          }

          ctx.fillStyle = '#FEF08A';
          ctx.globalAlpha = rip.alpha;
          ctx.beginPath();
          ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = 1.0;
        requestAnimationFrame(render);
      }

      requestAnimationFrame(render);
    })();
  </script>
</body>
</html>`;
}

/**
 * ── Native wallpaper (Android / iOS) ──
 * Pure React Native + Reanimated ambient scene. The previous WebView
 * (TextureView) implementation never painted reliably on Android —
 * it showed a black screen and glitched over sibling content — so
 * native platforms now draw the cosmic scene with ordinary views.
 * Web keeps the original HTML/Canvas iframe.
 */

/** Deterministic PRNG so stars/particles don't reshuffle every render. */
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface StarSpec {
  x: number;
  y: number;
  size: number;
  delay: number;
  dur: number;
  warm: boolean;
}

interface ParticleSpec {
  x: number;
  size: number;
  delay: number;
  dur: number;
}

const TwinkleStar: React.FC<{ spec: StarSpec }> = ({ spec }) => {
  const o = useSharedValue(0.35);
  useEffect(() => {
    o.value = withDelay(
      spec.delay,
      withRepeat(
        withTiming(1, { duration: spec.dur, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      )
    );
  }, [o, spec.delay, spec.dur]);
  const animated = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: `${spec.x}%`,
          top: `${spec.y}%`,
          width: spec.size,
          height: spec.size,
          borderRadius: spec.size / 2,
          backgroundColor: spec.warm ? '#FDE68A' : '#E2E8F0',
        },
        animated,
      ]}
    />
  );
};

const RisingParticle: React.FC<{ spec: ParticleSpec; height: number }> = ({
  spec,
  height,
}) => {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(
      spec.delay,
      withRepeat(withTiming(1, { duration: spec.dur, easing: Easing.linear }), -1, false)
    );
  }, [p, spec.delay, spec.dur]);
  const animated = useAnimatedStyle(() => {
    const t = p.value;
    const opacity = t < 0.1 ? t / 0.1 : t > 0.8 ? (1 - t) / 0.2 : 1;
    return {
      opacity,
      transform: [{ translateY: -t * (height + 16) }],
    };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: `${spec.x}%`,
          bottom: -6,
          width: spec.size,
          height: spec.size,
          borderRadius: spec.size / 2,
          backgroundColor: 'rgba(253, 196, 74, 0.9)',
        },
        animated,
      ]}
    />
  );
};

/** Soft radial-ish glow faked with three nested translucent circles. */
const NebulaBlob: React.FC<{
  rgb: string;
  size: number;
  cx: number;
  cy: number;
  dur: number;
  delay: number;
}> = ({ rgb, size, cx, cy, dur, delay }) => {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: dur, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      )
    );
  }, [pulse, delay, dur]);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: 0.94 + pulse.value * 0.12 }],
  }));
  const circle = (inset: number, alpha: number) => ({
    position: 'absolute' as const,
    left: inset,
    top: inset,
    width: size - inset * 2,
    height: size - inset * 2,
    borderRadius: (size - inset * 2) / 2,
    backgroundColor: `rgba(${rgb}, ${alpha})`,
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: `${cx}%`,
          top: `${cy}%`,
          width: size,
          height: size,
          marginLeft: -size / 2,
          marginTop: -size / 2,
        },
        animated,
      ]}
    >
      <View style={circle(0, 0.05)} />
      <View style={circle(size * 0.14, 0.05)} />
      <View style={circle(size * 0.3, 0.06)} />
    </Animated.View>
  );
};

/** Sacred Kaal Chakra: spinning rings + spokes with a static center glyph. */
const KaalChakra: React.FC<{ speed: number }> = ({ speed }) => {
  const rot = useSharedValue(0);
  useEffect(() => {
    const safeSpeed = speed > 0 ? speed : 1;
    rot.value = withRepeat(
      withTiming(1, { duration: 42000 / safeSpeed, easing: Easing.linear }),
      -1,
      false
    );
  }, [rot, speed]);
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value * 360}deg` }] }));
  return (
    <View style={styles.chakraPos} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFillObject, spin]}>
        <View style={styles.chakraRingOuter} />
        <View style={styles.chakraRingInner} />
        {[0, 45, 90, 135].map((deg) => (
          <View
            key={deg}
            style={[styles.chakraSpoke, { transform: [{ rotate: `${deg}deg` }] }]}
          />
        ))}
      </Animated.View>
      <View style={styles.chakraGlyphWrap}>
        <Text style={styles.chakraGlyph}>☸</Text>
      </View>
    </View>
  );
};

const NEBULAE = [
  { rgb: '124, 58, 237', size: 340, cx: 18, cy: 22, dur: 9000, delay: 0 },
  { rgb: '245, 158, 11', size: 300, cx: 82, cy: 64, dur: 11000, delay: 1500 },
  { rgb: '34, 211, 238', size: 320, cx: 58, cy: 10, dur: 13000, delay: 800 },
] as const;

const NativeCosmicWallpaper: React.FC<{
  showKaalChakra: boolean;
  speed: number;
  starCount: number;
  particleCount: number;
}> = ({ showKaalChakra, speed, starCount, particleCount }) => {
  const [height, setHeight] = useState(0);

  const stars = useMemo(() => {
    const rng = makeRng(0xc0ffee);
    const n = Math.max(0, Math.min(starCount, 70));
    return Array.from({ length: n }, (): StarSpec => {
      const warm = rng() > 0.55;
      return {
        x: rng() * 100,
        y: rng() * 100,
        size: warm ? 2 + rng() * 1.6 : 1.5 + rng() * 1.4,
        delay: Math.floor(rng() * 3000),
        dur: 1300 + Math.floor(rng() * 1500),
        warm,
      };
    });
  }, [starCount]);

  const particles = useMemo(() => {
    const rng = makeRng(0xbada55);
    const n = Math.max(0, Math.min(particleCount, 12));
    return Array.from({ length: n }, (): ParticleSpec => ({
      x: 5 + rng() * 90,
      size: 2 + rng() * 2,
      delay: Math.floor(rng() * 6000),
      dur: 6000 + Math.floor(rng() * 5000),
    }));
  }, [particleCount]);

  const safeSpeed = speed > 0 ? speed : 1;

  return (
    <View
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
    >
      <LinearGradient
        colors={['#0B0A1F', '#150C33', '#05040A']}
        locations={[0, 0.55, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {NEBULAE.map((n, i) => (
        <NebulaBlob key={`neb-${i}`} {...n} />
      ))}
      {stars.map((spec, i) => (
        <TwinkleStar key={`star-${i}`} spec={spec} />
      ))}
      {particles.map((spec, i) => (
        <RisingParticle key={`p-${i}`} spec={spec} height={height} />
      ))}
      {showKaalChakra && (
        <KaalChakra speed={safeSpeed} />
      )}
    </View>
  );
};

/**
 * CosmicAnimatedBackground
 * Ambient divine wallpaper. Web renders the original CSS + Canvas
 * animation via iframe; Android/iOS render a pure-RN Reanimated scene
 * (WebView backgrounds glitched badly on Android).
 */
export const CosmicAnimatedBackground: React.FC<CosmicAnimatedBackgroundProps> = ({
  style,
  showKaalChakra = true,
  speed = 1.0,
  starCount = 140,
  particleCount = 45,
  overlayOpacity = 0.35,
  interactive = true,
}) => {
  const htmlContent = useMemo(
    () =>
      buildCosmicAnimationHtml({
        showKaalChakra,
        speed,
        starCount,
        particleCount,
        interactive,
      }),
    [showKaalChakra, speed, starCount, particleCount, interactive]
  );

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {Platform.OS === 'web' ? (
        <iframe
          srcDoc={htmlContent}
          style={styles.webIframe as any}
          title="Cosmic Animation"
          tabIndex={-1}
        />
      ) : (
        <NativeCosmicWallpaper
          showKaalChakra={showKaalChakra}
          speed={speed}
          starCount={starCount}
          particleCount={particleCount}
        />
      )}

      {/* Soft gradient overlay for text readability */}
      {overlayOpacity > 0 && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: `rgba(6, 4, 12, ${overlayOpacity})` },
          ]}
          pointerEvents="none"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#05040A',
  },
  chakraPos: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 240,
    height: 240,
    marginLeft: -120,
    marginTop: -120,
  },
  chakraRingOuter: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.30)',
  },
  chakraRingInner: {
    position: 'absolute',
    left: 28,
    top: 28,
    right: 28,
    bottom: 28,
    borderRadius: 92,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.18)',
  },
  chakraSpoke: {
    position: 'absolute',
    left: '50%',
    marginLeft: -0.75,
    top: 14,
    bottom: 14,
    width: 1.5,
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
  },
  chakraGlyphWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chakraGlyph: {
    fontSize: 64,
    color: 'rgba(253, 230, 138, 0.55)',
  },
  webIframe: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderWidth: 0,
    backgroundColor: '#05040A',
  },
});

export default CosmicAnimatedBackground;
