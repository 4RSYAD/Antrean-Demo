/**
 * Audio Chime and Voice Announcement Utility for Queue Calls
 * Bulletproof Indonesian Text-To-Speech (TTS) & Web Audio Chimes
 */

let isAudioMuted = false;

// Maintain active utterances in global memory to prevent Chrome garbage collection cutoffs
const activeUtterances: SpeechSynthesisUtterance[] = [];

// Pre-cached Indonesian voice
let cachedIndoVoice: SpeechSynthesisVoice | null = null;

function loadVoices(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return;

  // Search for Indonesian voices with priority
  const indo =
    voices.find(
      (v) =>
        (v.lang === 'id-ID' || v.lang === 'id_ID' || v.lang.startsWith('id')) &&
        (v.name.toLowerCase().includes('indonesia') || v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('natural'))
    ) ||
    voices.find((v) => v.lang.startsWith('id') || v.lang.includes('ID')) ||
    voices.find((v) => v.name.toLowerCase().includes('indonesia'));

  if (indo) {
    cachedIndoVoice = indo;
  }
}

// Attach voice loader listener
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

export function setAudioMuted(muted: boolean): void {
  isAudioMuted = muted;
  if (typeof window !== 'undefined' && muted && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    activeUtterances.length = 0;
  }
}

export function getAudioMuted(): boolean {
  return isAudioMuted;
}

export type ChimeType = 'new_ticket' | 'call_pit' | 'wash_done' | 'paid_pickup' | 'test';

let globalAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!globalAudioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        globalAudioCtx = new AudioContextClass();
      }
    }
    if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume().catch(() => {});
    }
    return globalAudioCtx;
  } catch {
    return null;
  }
}

export function playAudioChime(type: ChimeType = 'test'): void {
  if (isAudioMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'new_ticket') {
      // Light cheerful double chime (F5 -> A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(698.46, now); // F5
      gain1.gain.setValueAtTime(0.22, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880.0, now + 0.18); // A5
      gain2.gain.setValueAtTime(0.25, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.6);
    } else if (type === 'call_pit') {
      // Attention chime (Triple ascending airport ping: C5 -> E5 -> G5)
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const start = now + idx * 0.18;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.28, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.5);
      });
    } else if (type === 'wash_done') {
      // Pleasant notice chime (Ding-Dong: G5 -> E5 -> C5)
      const notes = [783.99, 659.25, 523.25];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        const start = now + idx * 0.22;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.24, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.55);
      });
    } else if (type === 'paid_pickup') {
      // Warm departure chime (Arpeggio: C5 -> G5 -> C6)
      const notes = [523.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const start = now + idx * 0.16;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.26, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.65);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.65);
      });
    } else {
      // Standard airport chime
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const start = now + idx * 0.2;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.45);
      });
    }
  } catch (err) {
    console.warn('Audio Context chime error:', err);
  }
}

export function playAirportChime(): void {
  playAudioChime('paid_pickup');
}

/**
 * Phonetically formats Indonesian queue numbers for smooth, natural pronunciation.
 * E.g., "A-001" -> "A, kosong kosong satu" or "B-012" -> "B, kosong satu dua"
 */
export function formatSpokenIndonesian(rawText: string): string {
  return rawText
    // Format queue ticket codes like A-001, B-012, M-103
    .replace(/\b([A-Za-z])[- ]?0*(\d+)\b/g, (_match, letter, numStr) => {
      const spelledDigits = numStr
        .split('')
        .map((d: string) => {
          const map: Record<string, string> = {
            '0': 'nol',
            '1': 'satu',
            '2': 'dua',
            '3': 'tiga',
            '4': 'empat',
            '5': 'lima',
            '6': 'enam',
            '7': 'tujuh',
            '8': 'delapan',
            '9': 'sembilan'
          };
          return map[d] || d;
        })
        .join(' ');
      return `${letter.toUpperCase()}, ${spelledDigits}`;
    })
    .replace(/Pit Bay (\d+)/gi, 'Pit Bay $1')
    .replace(/Pit (\d+)/gi, 'Pit $1');
}

let speechTimeoutTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Enhanced voice announcement with distinct tones, pitch and rates depending on the event
 */
export function announceQueueVoice(
  text: string,
  type: ChimeType = 'test',
  options?: { rate?: number; pitch?: number; skipChime?: boolean }
): void {
  if (isAudioMuted) return;

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  // Clear pending announcement timeout if any
  if (speechTimeoutTimer) {
    clearTimeout(speechTimeoutTimer);
    speechTimeoutTimer = null;
  }

  // Cancel ongoing speech to prevent overlapping or stuck voice
  try {
    window.speechSynthesis.cancel();
    activeUtterances.length = 0;
  } catch {
    // ignore
  }

  // Play chime if not skipped
  if (!options?.skipChime) {
    playAudioChime(type);
  }

  const delay = options?.skipChime ? 0 : type === 'new_ticket' ? 450 : 600;

  speechTimeoutTimer = setTimeout(() => {
    if (isAudioMuted) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      // Ensure audio context and speech synthesis are active
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const spokenText = formatSpokenIndonesian(text);
      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.lang = 'id-ID';

      // Vary rate and pitch based on type to create distinct voices
      if (type === 'new_ticket') {
        utterance.rate = options?.rate ?? 0.95;
        utterance.pitch = options?.pitch ?? 1.1; // Friendly, welcoming tone
      } else if (type === 'call_pit') {
        utterance.rate = options?.rate ?? 0.9;
        utterance.pitch = options?.pitch ?? 1.02; // Clear, directive operational tone
      } else if (type === 'wash_done') {
        utterance.rate = options?.rate ?? 0.92;
        utterance.pitch = options?.pitch ?? 1.06; // Informative, pleasant customer notification
      } else if (type === 'paid_pickup') {
        utterance.rate = options?.rate ?? 0.92;
        utterance.pitch = options?.pitch ?? 1.05; // Warm, appreciative checkout tone
      } else {
        utterance.rate = options?.rate ?? 0.92;
        utterance.pitch = options?.pitch ?? 1.0;
      }

      // Voice selection
      if (!cachedIndoVoice) {
        loadVoices();
      }
      if (cachedIndoVoice) {
        utterance.voice = cachedIndoVoice;
      } else {
        const voices = window.speechSynthesis.getVoices();
        const idVoice = voices.find(
          (v) =>
            v.lang.includes('id') ||
            v.lang.includes('ID') ||
            v.name.toLowerCase().includes('indonesia')
        );
        if (idVoice) {
          utterance.voice = idVoice;
          cachedIndoVoice = idVoice;
        }
      }

      // Keep in active array to prevent Chrome GC cutoff bug
      activeUtterances.push(utterance);
      utterance.onend = () => {
        const idx = activeUtterances.indexOf(utterance);
        if (idx !== -1) activeUtterances.splice(idx, 1);
      };
      utterance.onerror = () => {
        const idx = activeUtterances.indexOf(utterance);
        if (idx !== -1) activeUtterances.splice(idx, 1);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
    }
  }, delay);
}
