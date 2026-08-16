/**
 * Audio Chime and Voice Announcement Utility for Queue Calls
 */

let isAudioMuted = false;

export function setAudioMuted(muted: boolean): void {
  isAudioMuted = muted;
  if (typeof window !== 'undefined' && muted && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function getAudioMuted(): boolean {
  return isAudioMuted;
}

export type ChimeType = 'new_ticket' | 'call_pit' | 'wash_done' | 'paid_pickup' | 'test';

export function playAudioChime(type: ChimeType = 'test'): void {
  if (isAudioMuted) return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
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
 * Enhanced voice announcement with distinct tones, pitch and rates depending on the event
 */
export function announceQueueVoice(
  text: string,
  type: ChimeType = 'test',
  options?: { rate?: number; pitch?: number }
): void {
  if (isAudioMuted) return;

  // Play specialized chime first
  playAudioChime(type);

  const delay = type === 'new_ticket' ? 550 : 700;

  setTimeout(() => {
    if (isAudioMuted) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';

      // Vary rate and pitch based on type to create distinct voices
      if (type === 'new_ticket') {
        utterance.rate = options?.rate ?? 0.95;
        utterance.pitch = options?.pitch ?? 1.12; // Friendly, welcoming tone
      } else if (type === 'call_pit') {
        utterance.rate = options?.rate ?? 0.88;
        utterance.pitch = options?.pitch ?? 1.02; // Clear, directive operational tone
      } else if (type === 'wash_done') {
        utterance.rate = options?.rate ?? 0.9;
        utterance.pitch = options?.pitch ?? 1.08; // Informative, pleasant customer notification
      } else if (type === 'paid_pickup') {
        utterance.rate = options?.rate ?? 0.92;
        utterance.pitch = options?.pitch ?? 1.05; // Warm, appreciative checkout tone
      } else {
        utterance.rate = options?.rate ?? 0.9;
        utterance.pitch = options?.pitch ?? 1.0;
      }

      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find(
        (v) =>
          v.lang.includes('id') ||
          v.lang.includes('ID') ||
          v.name.toLowerCase().includes('indonesia')
      );
      if (idVoice) {
        utterance.voice = idVoice;
      }

      window.speechSynthesis.speak(utterance);
    }
  }, delay);
}
