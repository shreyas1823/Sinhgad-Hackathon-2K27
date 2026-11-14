import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import './hero-globe.css'

const GlobeScene = lazy(() => import('./globe/GlobeScene'))

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2'))
  } catch {
    return false
  }
}

export default function HeroGlobe() {
  const container = useRef<HTMLDivElement>(null)
  const [canRender] = useState(() => supportsWebGL())
  const [inViewport, setInViewport] = useState(true)
  const [pageVisible, setPageVisible] = useState(() => !document.hidden)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const renderContinuously = !reducedMotion && inViewport && pageVisible

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onMotionChange = () => setReducedMotion(media.matches)
    media.addEventListener('change', onMotionChange)
    onMotionChange()
    return () => media.removeEventListener('change', onMotionChange)
  }, [])

  useEffect(() => {
    const element = container.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => {
      setInViewport(entry.isIntersecting && entry.intersectionRatio >= 0.05)
    }, { threshold: [0, 0.05] })
    const onVisibilityChange = () => setPageVisible(!document.hidden)
    observer.observe(element)
    document.addEventListener('visibilitychange', onVisibilityChange)
    onVisibilityChange()
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  return (
    <div
      ref={container}
      className="hero-globe-entrance relative h-full w-full touch-pan-y"
      role="img"
      aria-label="Interactive digital globe with glowing geographic networks; drag to rotate"
    >
      <div className="pointer-events-none absolute inset-[12%] rounded-full bg-cyan-500/10 blur-[70px]" aria-hidden="true" />
      {canRender === false ? (
        <div className="globe-fallback flex h-full items-center justify-center rounded-full border border-cyan-400/20 bg-surface/40 p-8 text-center text-sm text-muted">
          Interactive globe unavailable: this browser does not support WebGL.
        </div>
      ) : (
        <Suspense fallback={<div className="h-full w-full" />}>
          <GlobeScene reducedMotion={Boolean(reducedMotion)} renderContinuously={renderContinuously} />
        </Suspense>
      )}
    </div>
  )
}
