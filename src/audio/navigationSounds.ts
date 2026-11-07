export type SoundPreset = 'original' | 'glassy' | 'pulse' | 'liquid' | 'hybridGlass' | 'hybridAtmosphere'

type Voice = {
  pitchHz: number
  endPitchHz: number
  glideSeconds?: number
  attackSeconds: number
  durationSeconds: number
  volume: number
  delaySeconds?: number
}

// Volumes are linear gain, not decibels. Keep combined voices quiet.
// Option D is the approved production hover sound; all presets remain available for preview.
export const navigationSounds: Record<SoundPreset, { label: string; description: string; voices: Voice[] }> = {
  original: {
    label: 'Original bubble pop', description: 'Earlier production sound',
    voices: [{ pitchHz: 480, endPitchHz: 260, glideSeconds: 0.075, attackSeconds: 0.008, durationSeconds: 0.1, volume: 0.035 }],
  },
  glassy: {
    label: 'A — Glassy Digital Chime', description: 'Crystalline tone with a delicate shimmer',
    voices: [
      { pitchHz: 1175, endPitchHz: 1150, attackSeconds: 0.006, durationSeconds: 0.22, volume: 0.021 },
      { pitchHz: 2349, endPitchHz: 2320, attackSeconds: 0.004, durationSeconds: 0.13, volume: 0.007, delaySeconds: 0.008 },
      { pitchHz: 3520, endPitchHz: 3460, attackSeconds: 0.004, durationSeconds: 0.09, volume: 0.003, delaySeconds: 0.012 },
    ],
  },
  pulse: {
    label: 'B — Futuristic UI Pulse', description: 'Minimal electronic blip with a gentle pitch lift',
    voices: [
      { pitchHz: 540, endPitchHz: 740, attackSeconds: 0.012, durationSeconds: 0.13, volume: 0.027 },
      { pitchHz: 1080, endPitchHz: 1480, attackSeconds: 0.014, durationSeconds: 0.1, volume: 0.004 },
    ],
  },
  liquid: {
    label: 'C — Liquid Bubble', description: 'Rounded, soft transient with a liquid resonance',
    voices: [
      { pitchHz: 680, endPitchHz: 320, attackSeconds: 0.009, durationSeconds: 0.16, volume: 0.028 },
      { pitchHz: 360, endPitchHz: 270, attackSeconds: 0.012, durationSeconds: 0.12, volume: 0.006, delaySeconds: 0.025 },
    ],
  },
  hybridGlass: {
    label: 'D — Hybrid glass tactility', description: 'Approved production navbar hover sound',
    voices: [
      { pitchHz: 560, endPitchHz: 390, attackSeconds: 0.007, durationSeconds: 0.11, volume: 0.017 },
      { pitchHz: 890, endPitchHz: 740, attackSeconds: 0.012, durationSeconds: 0.18, volume: 0.006, delaySeconds: 0.012 },
    ],
  },
  hybridAtmosphere: {
    label: 'E — Hybrid atmosphere', description: 'Low cinematic pulse with a delicate digital finish; audition only',
    voices: [
      { pitchHz: 290, endPitchHz: 210, attackSeconds: 0.018, durationSeconds: 0.25, volume: 0.015 },
      { pitchHz: 650, endPitchHz: 480, attackSeconds: 0.009, durationSeconds: 0.12, volume: 0.006, delaySeconds: 0.03 },
    ],
  },
}

export function synthesizeNavigationSound(audio: AudioContext, preset: SoundPreset) {
  navigationSounds[preset].voices.forEach((voice) => {
    const start = audio.currentTime + (voice.delaySeconds ?? 0)
    const end = start + voice.durationSeconds
    const oscillator = audio.createOscillator()
    const gain = audio.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(voice.pitchHz, start)
    oscillator.frequency.exponentialRampToValueAtTime(voice.endPitchHz, start + (voice.glideSeconds ?? voice.durationSeconds))
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(voice.volume, start + voice.attackSeconds)
    gain.gain.exponentialRampToValueAtTime(0.0001, end - 0.005)
    oscillator.connect(gain).connect(audio.destination)
    oscillator.start(start)
    oscillator.stop(end)
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect() }
  })
}
