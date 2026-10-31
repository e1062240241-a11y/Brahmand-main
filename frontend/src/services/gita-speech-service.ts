import { Platform } from 'react-native';
import { API_URL } from './api';

export type SpeechLanguage = 'sanskrit' | 'hindi' | 'english';

export interface ReciteOptions {
  text: string;
  secondaryText?: string; // Optional: translation to recite right after Sanskrit shloka completes
  chapter?: number;
  verse?: number;
  type?: SpeechLanguage;
  rate?: number;
  pitch?: number;
  voiceGender?: 'female' | 'male';
  onStart?: () => void;
  onDone?: () => void;
  onStopped?: () => void;
  onError?: (error: any) => void;
}

let ExpoSpeech: any = null;
try {
  ExpoSpeech = require('expo-speech');
} catch (e) {
  ExpoSpeech = null;
}

let ExpoAudio: any = null;
try {
  ExpoAudio = require('expo-audio');
} catch (e) {
  ExpoAudio = null;
}

/**
 * Returns prioritized URLs for divine paused neural recitation (Swara voice).
 * Exact same gentle, sweet, devotional voice for both Sanskrit and Hindi.
 */
export const getVerseRecitationUrls = (
  chapter?: number,
  verse?: number,
  mode: 'sanskrit' | 'hindi' | 'both' = 'sanskrit',
  voiceGender: 'female' | 'male' = 'female',
  fallbackText: string = ''
): string[] => {
  const chosenVoice = voiceGender === 'male' ? 'madhur' : 'swara';
  const urls: string[] = [];

  if (API_URL) {
    if (typeof chapter === 'number' && typeof verse === 'number') {
      const ch = Math.max(1, Math.min(18, chapter));
      const v = Math.max(1, verse);
      urls.push(`${API_URL}/api/library/bhagavad-gita/audio/${ch}/${v}?mode=${mode}&voice=${chosenVoice}`);
    }
    if (fallbackText) {
      urls.push(`${API_URL}/api/library/bhagavad-gita/tts?text=${encodeURIComponent(fallbackText)}&lang=hi&voice=${chosenVoice}`);
    }
  }

  return urls;
};

/**
 * Refine Sanskrit Devanagari text for authentic pronunciation in speech engines:
 * 1. Clean Vedic cantillations, brackets, and verse numbering (e.g. ।।1.1।।).
 * 2. Smooth Avagraha ('ऽ') so Sandhi elisions flow naturally in speech.
 * 3. Restore Visarga ('ः') phonetics (which Hindi voices ignore/drop).
 * 4. Convert word/pada-final Anusvara ('ं') before space/danda to 'म्'.
 */
export const prepareSanskritForTTS = (text: string): string => {
  if (!text || typeof text !== 'string') return '';

  let t = text.trim();
  t = t.replace(/[\u1CD0-\u1CFF\u0951-\u0952\uA8E0-\uA8F1]/g, '');
  t = t.replace(/(?:।।|॥|\/\/|\|\|)\s*\d+(?:\.\d+)?\s*(?:।।|॥|\/\/|\|\|)/g, '');
  t = t.replace(/^\s*\d+(?:\.\d+)?\.?\s*/, '');
  t = t.replace(/\s*\d+(?:\.\d+)?\.?\s*$/, '');
  t = t.replace(/\([^)]*\)/g, '');
  t = t.replace(/\[[^\]]*\]/g, '');

  // Smooth Avagraha (ऽ) so Sandhi flows seamlessly
  t = t.replace(/ऽ/g, '');

  // Visarga phonetics
  t = t.replace(/ाः/g, 'ाह');
  t = t.replace(/िः/g, 'िहि');
  t = t.replace(/ीः/g, 'ीहि');
  t = t.replace(/ुः/g, 'ुहु');
  t = t.replace(/ूः/g, 'ूहु');
  t = t.replace(/ेः/g, 'ेहे');
  t = t.replace(/ैः/g, 'ैहे');
  t = t.replace(/ोः/g, 'ोहो');
  t = t.replace(/([क-ह]़?)ः/g, '$1ह');
  t = t.replace(/ः/g, 'ह');

  // Pada-ending Anusvara before punctuation/space/line-break -> 'म्'
  t = t.replace(/([क-ह]़?[ा-ौ]?)ं(?=[\s।॥,.\n]|$)/g, '$1म्');

  return t;
};

/**
 * Clean Hindi translation text for natural, accurate speech recitation:
 * 1. Strip verse numbers like ।।1.1।।, 1.1, ।।3.1 -- 3.2।।
 * 2. Strip footnote annotations like (टिप्पणी प0 1.2), [टिप्पणी...]
 * 3. Remove Sanskrit glosses in parentheses like (युयुत्सव:) so colons/brackets are not read aloud
 * 4. Clean corrupt duplicate matras (e.g. मेरेे -> मेरे)
 * 5. Replace double hyphens with natural commas
 */
export const cleanHindiForTTS = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  let t = text.trim();
  t = t.replace(/^(?:।।|॥|\/\/|\|\|)?\s*\d+(?:\.\d+)?(?:\s*--\s*\d+(?:\.\d+)?)?\s*(?:।।|॥|\/\/|\|\|)?\.?\s*/g, '');
  t = t.replace(/(?:।।|॥|\/\/|\|\|)\s*\d+(?:\.\d+)?\s*(?:।।|॥|\/\/|\|\|)/g, '');
  t = t.replace(/\s*\([^)]*टिप्पणी[^)]*\)\s*/g, ' ');
  t = t.replace(/\s*\[[^\]]*टिप्पणी[^\]]*\]\s*/g, ' ');
  t = t.replace(/\s*\([^)]*प0[^)]*\)\s*/g, ' ');
  t = t.replace(/\s*\(\s*([^)]*?):?\s*\)\s*/g, ' ');
  t = t.replace(/\s*\[\s*([^\]]*?):?\s*\]\s*/g, ' ');
  t = t.replace(/([\u093E-\u094C])[\u093E-\u094C]+/g, '$1');
  t = t.replace(/\s*--\s*/g, ', ');
  t = t.replace(/\s*-\s*/g, ' ');
  t = t.replace(/\s+/g, ' ').trim();
  return t;
};

/**
 * Split text into rhythmic chanting segments with natural breath pauses.
 * Breaks speaker headings, lines, dandas, and sentences into chunks with pause durations.
 */
export const splitIntoMeditativeSegments = (
  rawText: string,
  isSanskrit: boolean = true
): Array<{ text: string; pauseMs: number }> => {
  if (!rawText || typeof rawText !== 'string') return [];

  if (isSanskrit) {
    const t = prepareSanskritForTTS(rawText);
    if (!t) return [];

    const segments: Array<{ text: string; pauseMs: number }> = [];

    // Speaker heading check (e.g. धृतराष्ट्र उवाच, सञ्जय उवाच, श्रीभगवानुवाच, अर्जुन उवाच)
    const speakerMatch = t.match(/^([^\n]+उवाच[^\n]*)(?:\n+|।+|\s+)/);
    let rest = t;
    if (speakerMatch) {
      segments.push({ text: speakerMatch[1].trim(), pauseMs: 300 });
      rest = t.slice(speakerMatch[0].length).trim();
    }

    // Split lines / dandas
    const rawLines = rest.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    for (const line of rawLines) {
      const subLines = line.split(/[।॥]/).map((s) => s.trim()).filter(Boolean);
      if (!subLines.length) continue;
      for (let i = 0; i < subLines.length; i++) {
        const isLast = i === subLines.length - 1;
        segments.push({ text: subLines[i], pauseMs: isLast ? 350 : 250 });
      }
    }
    return segments;
  } else {
    const cleanHindi = cleanHindiForTTS(rawText);
    if (!cleanHindi) return [];
    const sentences = cleanHindi.split(/(?<=[.?!।;])\s+/).map((s) => s.trim()).filter(Boolean);
    const finalSentences = sentences.length ? sentences : [cleanHindi];
    return finalSentences.map((s, idx) => ({
      text: s,
      pauseMs: idx === finalSentences.length - 1 ? 350 : 250,
    }));
  }
};

/**
 * Clean text specifically for speech recitation
 */
export const sanitizeForSpeech = (rawText: string, type: SpeechLanguage = 'sanskrit'): string => {
  if (!rawText || typeof rawText !== 'string') return '';

  if (type === 'sanskrit') {
    return prepareSanskritForTTS(rawText);
  }
  if (type === 'hindi') {
    return cleanHindiForTTS(rawText);
  }

  let text = rawText;
  text = text.replace(/[\u1CD0-\u1CFF\u0951-\u0952\uA8E0-\uA8F1]/g, '');
  text = text.replace(/(?:।।|॥|\/\/|\|\|)\s*\d+(?:\.\d+)?\s*(?:।।|॥|\/\/|\|\|)/g, '');
  text = text.replace(/^\s*\d+(?:\.\d+)?\.?\s*/, '');
  text = text.replace(/\s*\d+(?:\.\d+)?\.?\s*$/, '');
  text = text.replace(/\([^)]*\)/g, '');
  text = text.replace(/\[[^\]]*\]/g, '');
  text = text.replace(/।।|॥/g, '।');

  text = text.replace(/श्रीभगवानुवाच/g, 'श्री भगवान उवाच। ');
  text = text.replace(/सञ्जय उवाच/g, 'संजय उवाच। ');
  text = text.replace(/अर्जुन उवाच/g, 'अर्जुन उवाच। ');
  text = text.replace(/धृतराष्ट्र उवाच/g, 'धृतराष्ट्र उवाच। ');

  text = text.replace(/\n+/g, ' \n ').replace(/\s+/g, ' ').trim();
  return text;
};

class GitaSpeechService {
  private isCurrentlySpeaking: boolean = false;
  private currentStopCallback: (() => void) | null = null;
  private currentAudioPlayer: any = null;
  private currentAudioSubscription: any = null;
  private currentWebAudio: any = null;
  private isCancelled: boolean = false;

  /**
   * Check if speech synthesis or audio playback is supported on this platform/runtime
   */
  public isSpeechAvailable(): boolean {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined';
    }
    const hasExpoSpeech = ExpoSpeech !== null && typeof ExpoSpeech.speak === 'function';
    const hasExpoAudio = ExpoAudio !== null && typeof ExpoAudio.createAudioPlayer === 'function';
    return hasExpoSpeech || hasExpoAudio;
  }

  /**
   * Stop any currently ongoing speech or audio playback
   */
  public async stop(): Promise<void> {
    this.isCancelled = true;
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        if (this.currentWebAudio) {
          try {
            this.currentWebAudio.pause();
            this.currentWebAudio.currentTime = 0;
          } catch {}
          this.currentWebAudio = null;
        }
      }
      if (ExpoSpeech && typeof ExpoSpeech.stop === 'function') {
        try {
          await ExpoSpeech.stop();
        } catch {}
      }
      if (this.currentAudioPlayer) {
        try {
          this.currentAudioPlayer.pause();
          if (this.currentAudioSubscription?.remove) {
            this.currentAudioSubscription.remove();
          }
        } catch {}
        this.currentAudioPlayer = null;
        this.currentAudioSubscription = null;
      }
    } catch (e) {
      console.warn('GitaSpeechService: error stopping speech', e);
    } finally {
      this.isCurrentlySpeaking = false;
      if (this.currentStopCallback) {
        const cb = this.currentStopCallback;
        this.currentStopCallback = null;
        cb();
      }
    }
  }

  /**
   * Check if speech is currently playing
   */
  public async isSpeaking(): Promise<boolean> {
    if (this.currentAudioPlayer && this.currentAudioPlayer.playing) {
      return true;
    }
    if (this.currentWebAudio && !this.currentWebAudio.paused) {
      return true;
    }
    try {
      if (Platform.OS === 'web') {
        return typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis.speaking : false;
      }
      if (ExpoSpeech && typeof ExpoSpeech.isSpeakingAsync === 'function') {
        return await ExpoSpeech.isSpeakingAsync();
      }
    } catch {}
    return this.isCurrentlySpeaking;
  }

  /**
   * Stream audio from a URL list with automatic failover to the next mirror
   */
  private playAudioFromUrlList(
    urls: string[],
    rate: number = 1.0,
    onStart?: () => void,
    onDone?: () => void,
    onError?: (err: any) => void
  ): Promise<void> {
    return new Promise((resolve) => {
      let urlIndex = 0;

      const tryNextUrl = () => {
        if (this.isCancelled) {
          resolve();
          return;
        }

        if (urlIndex >= urls.length) {
          const err = new Error('All audio mirrors failed to load.');
          if (onError) onError(err);
          resolve();
          return;
        }

        const currentUrl = urls[urlIndex];
        urlIndex++;

        if (Platform.OS === 'web' && typeof Audio !== 'undefined') {
          try {
            if (this.currentWebAudio) {
              this.currentWebAudio.pause();
              this.currentWebAudio = null;
            }
            const webAudio = new Audio(currentUrl);
            this.currentWebAudio = webAudio;
            webAudio.playbackRate = rate;

            webAudio.onplay = () => {
              if (onStart) onStart();
            };
            webAudio.onended = () => {
              this.currentWebAudio = null;
              if (onDone) onDone();
              resolve();
            };
            webAudio.onerror = () => {
              console.warn(`[GitaSpeech] Mirror ${currentUrl} failed, trying next...`);
              tryNextUrl();
            };
            webAudio.play().catch(() => tryNextUrl());
          } catch {
            tryNextUrl();
          }
          return;
        }

        if (!ExpoAudio || typeof ExpoAudio.createAudioPlayer !== 'function') {
          tryNextUrl();
          return;
        }

        try {
          if (this.currentAudioPlayer) {
            try {
              this.currentAudioPlayer.pause();
              if (this.currentAudioSubscription?.remove) {
                this.currentAudioSubscription.remove();
              }
            } catch {}
            this.currentAudioPlayer = null;
            this.currentAudioSubscription = null;
          }

          const player = ExpoAudio.createAudioPlayer(currentUrl, { keepAudioSessionActive: true });
          this.currentAudioPlayer = player;

          if (typeof player.setPlaybackRate === 'function') {
            player.setPlaybackRate(rate);
          } else if ('playbackRate' in player) {
            player.playbackRate = rate;
          }

          let hasStarted = false;
          let hasFinished = false;

          const sub = player.addListener('playbackStatusUpdate', (status: any) => {
            if (this.isCancelled) return;

            if (status.error) {
              console.warn(`[GitaSpeech] Player error for ${currentUrl}:`, status.error);
              if (sub?.remove) sub.remove();
              tryNextUrl();
              return;
            }

            if (status.playing && !hasStarted) {
              hasStarted = true;
              if (onStart) onStart();
            }

            if (status.didJustFinish && !hasFinished) {
              hasFinished = true;
              if (sub?.remove) sub.remove();
              this.currentAudioPlayer = null;
              this.currentAudioSubscription = null;
              if (onDone) onDone();
              resolve();
            }
          });
          this.currentAudioSubscription = sub;

          player.play();
        } catch (err) {
          console.warn(`[GitaSpeech] Exception loading ${currentUrl}:`, err);
          tryNextUrl();
        }
      };

      tryNextUrl();
    });
  }

  /**
   * Speak verse text using the exact same sweet devotional voice (Swara) with rhythmic pauses.
   */
  public async speak(options: ReciteOptions): Promise<void> {
    const {
      text,
      secondaryText,
      chapter,
      verse,
      type = 'sanskrit',
      rate,
      voiceGender = 'female',
      onStart,
      onDone,
      onStopped,
      onError,
    } = options;

    await this.stop();
    this.isCancelled = false;
    this.isCurrentlySpeaking = true;
    this.currentStopCallback = onStopped || null;

    const finalRate = rate ?? 1.0;

    // Build the combined text if secondaryText is present
    const fullTextToSpeak = secondaryText
      ? `${text}\n\n${secondaryText}`
      : text;

    const mode: 'sanskrit' | 'hindi' | 'both' =
      secondaryText ? 'both' : (type === 'hindi' ? 'hindi' : 'sanskrit');

    // 1. Try paused backend neural audio with identical Swara voice for Sanskrit and Hindi
    const audioUrls = getVerseRecitationUrls(chapter, verse, mode, voiceGender, fullTextToSpeak);

    if (audioUrls.length > 0) {
      let playbackWorked = false;

      await this.playAudioFromUrlList(
        audioUrls,
        finalRate,
        () => {
          playbackWorked = true;
          if (onStart) onStart();
        },
        () => {
          this.isCurrentlySpeaking = false;
          this.currentStopCallback = null;
          if (onDone) onDone();
        },
        (err) => {
          console.warn('[GitaSpeech] Backend neural stream failed, trying offline fallback:', err);
        }
      );

      if (playbackWorked || this.isCancelled) {
        return;
      }
    }

    // 2. Offline fallback with deliberate segment pauses ("ruk ruk ke")
    await this.speakOfflineWithPauses(fullTextToSpeak, type, finalRate, onStart, onDone, onError);
  }

  /**
   * Offline fallback: Speaks segments one-by-one with intentional pauses between lines
   */
  private async speakOfflineWithPauses(
    rawText: string,
    type: SpeechLanguage,
    rate: number,
    onStart?: () => void,
    onDone?: () => void,
    onError?: (err: any) => void
  ): Promise<void> {
    const segments = splitIntoMeditativeSegments(rawText);
    if (!segments.length) {
      this.isCurrentlySpeaking = false;
      this.currentStopCallback = null;
      if (onDone) onDone();
      return;
    }

    const langCode = type === 'english' ? 'en-IN' : 'hi-IN';
    let index = 0;

    // Web Speech API
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const playNextWeb = () => {
        if (this.isCancelled) return;
        if (index >= segments.length) {
          this.isCurrentlySpeaking = false;
          this.currentStopCallback = null;
          if (onDone) onDone();
          return;
        }

        const seg = segments[index];
        index++;

        const utterance = new SpeechSynthesisUtterance(seg.text);
        utterance.lang = langCode;
        utterance.rate = Math.max(0.75, rate * 0.85); // Meditative, calm pace
        utterance.onstart = () => {
          if (index === 1 && onStart) onStart();
        };
        utterance.onend = () => {
          if (this.isCancelled) return;
          setTimeout(playNextWeb, seg.pauseMs);
        };
        utterance.onerror = (e) => {
          this.isCurrentlySpeaking = false;
          this.currentStopCallback = null;
          if (onError) onError(e);
        };
        window.speechSynthesis.speak(utterance);
      };

      playNextWeb();
      return;
    }

    // Native Expo Speech
    if (ExpoSpeech && typeof ExpoSpeech.speak === 'function') {
      const playNextNative = () => {
        if (this.isCancelled) return;
        if (index >= segments.length) {
          this.isCurrentlySpeaking = false;
          this.currentStopCallback = null;
          if (onDone) onDone();
          return;
        }

        const seg = segments[index];
        index++;

        try {
          ExpoSpeech.speak(seg.text, {
            language: langCode,
            rate: Math.max(0.75, rate * 0.85), // Meditative, calm pace
            pitch: 1.0,
            onStart: () => {
              if (index === 1 && onStart) onStart();
            },
            onDone: () => {
              if (this.isCancelled) return;
              setTimeout(playNextNative, seg.pauseMs);
            },
            onError: (err: any) => {
              this.isCurrentlySpeaking = false;
              this.currentStopCallback = null;
              if (onError) onError(err);
            },
          });
        } catch (err) {
          console.warn('[GitaSpeech] Native ExpoSpeech error:', err);
          this.isCurrentlySpeaking = false;
          this.currentStopCallback = null;
          if (onError) onError(err);
        }
      };

      playNextNative();
      return;
    }

    this.isCurrentlySpeaking = false;
    this.currentStopCallback = null;
    if (onError) onError(new Error('Audio playback engine is currently unavailable'));
  }
}

export const gitaSpeechService = new GitaSpeechService();
export default gitaSpeechService;
