import { lazy, Suspense, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

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
  const [canRender] = useState(() => supportsWebGL())
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      className="relative h-full w-full touch-pan-y"
      initial={reducedMotion ? false : { opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.9, ease: 'easeOut' }}
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
          <GlobeScene reducedMotion={Boolean(reducedMotion)} />
        </Suspense>
      )}
    </motion.div>
  )
}
