import { useCallback, useEffect, useRef, useState } from 'react'
import { synthesizeNavigationSound } from '../audio/navigationSounds'
import type { SoundPreset } from '../audio/navigationSounds'

type Effect = 'button' | 'section' | 'register' | 'toggle'

const assets: Record<Effect, { url: string; volume: number }> = {
  button: { url: '/audio/button-click.mp3', volume: 0.38 },
  section: { url: '/audio/section-whoosh.mp3', volume: 0.18 },
  register: { url: '/audio/register-click.mp3', volume: 0.3 },
  toggle: { url: '/audio/sound-toggle.mp3', volume: 0.28 },
}

export function useNavigationSound() {
  const [enabled, setEnabled] = useState(false)
  const [preset, setPreset] = useState<SoundPreset>('hybridGlass')
  const enabledRef = useRef(false)
  const context = useRef<AudioContext | null>(null)
  const media = useRef<Partial<Record<Effect, HTMLAudioElement>>>({})
  const lastHover = useRef(-Infinity)
  const lastSection = useRef(-Infinity)

  useEffect(() => () => {
    Object.values(media.current).forEach((audio) => { audio.pause(); audio.removeAttribute('src'); audio.load() })
    void context.current?.close()
  }, [])

  const getMedia = useCallback((effect: Effect) => {
    if (!media.current[effect]) {
      const audio = new Audio(assets[effect].url)
      audio.preload = 'auto'
      audio.volume = assets[effect].volume
      media.current[effect] = audio
    }
    return media.current[effect]
  }, [])

  const playEffect = useCallback((effect: Exclude<Effect, 'toggle'>) => {
    if (!enabledRef.current) return
    const now = performance.now()
    if (effect === 'section') {
      if (now - lastSection.current < 1100) return
      lastSection.current = now
    }
    const audio = getMedia(effect)
    if (!audio) return
    if (effect === 'section' && !audio.paused) return
    audio.currentTime = 0
    void audio.play().catch(() => { /* Keep navigation usable if media is unavailable. */ })
  }, [getMedia])

  const toggle = useCallback(async () => {
    if (enabledRef.current) {
      enabledRef.current = false
      setEnabled(false)
      ;(['button', 'section', 'register'] as const).forEach((effect) => media.current[effect]?.pause())
      void context.current?.suspend().catch(() => {})
      const audio = getMedia('toggle')
      if (audio) { audio.currentTime = 0; void audio.play().catch(() => {}) }
      return
    }
    try {
      const audio = context.current ?? new AudioContext()
      context.current = audio
      await audio.resume()
      if (audio.state !== 'running') return
      enabledRef.current = true
      setEnabled(true)
      const toggleAudio = getMedia('toggle')
      if (toggleAudio) { toggleAudio.currentTime = 0; void toggleAudio.play().catch(() => {}) }
    } catch { enabledRef.current = false; setEnabled(false) }
  }, [getMedia])

  const play = useCallback(() => {
    const audio = context.current
    if (!enabledRef.current || !audio || audio.state !== 'running') return
    const now = performance.now()
    if (now - lastHover.current < 160) return
    lastHover.current = now
    synthesizeNavigationSound(audio, preset)
  }, [preset])

  // The development panel can still audition every original preset independently.
  const preview = useCallback(async (candidate: SoundPreset) => {
    if (!enabledRef.current || !context.current) return
    try {
      await context.current.resume()
      const now = performance.now()
      if (context.current.state !== 'running' || now - lastHover.current < 260) return
      lastHover.current = now
      synthesizeNavigationSound(context.current, candidate)
    } catch { /* A blocked audio device should leave navigation usable. */ }
  }, [])

  return { enabled, toggle, play, playEffect, preset, setPreset, preview }
}
