import { useEffect, useRef } from 'react'

const spacing = 32

export default function HeroDotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const hero = canvas?.parentElement
    const context = canvas?.getContext('2d')
    if (!canvas || !hero || !context) return
    const media = window.matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)')
    const viewport = { visible: true, energy: 0, frame: 0, pointerX: -1000, pointerY: -1000, width: 0, height: 0 }

    const draw = () => {
      viewport.frame = 0
      context.clearRect(0, 0, viewport.width, viewport.height)
      for (let y = spacing / 2; y < viewport.height; y += spacing) {
        for (let x = spacing / 2; x < viewport.width; x += spacing) {
          const dx = x - viewport.pointerX
          const dy = y - viewport.pointerY
          const distance = Math.hypot(dx, dy)
          const influence = media.matches ? Math.max(0, 1 - distance / 150) * viewport.energy : 0
          const displacement = influence * 5
          const drawX = x + (distance ? dx / distance * displacement : 0)
          const drawY = y + (distance ? dy / distance * displacement : 0)
          context.beginPath()
          context.arc(drawX, drawY, 1 + influence * .55, 0, Math.PI * 2)
          context.fillStyle = `rgba(139, 166, 255, ${.12 + influence * .28})`
          context.fill()
        }
      }
      viewport.energy *= .91
      if (viewport.energy > .012 && viewport.visible) viewport.frame = requestAnimationFrame(draw)
    }
    const resize = () => {
      const rect = hero.getBoundingClientRect()
      viewport.width = rect.width
      viewport.height = rect.height
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(viewport.width * pixelRatio)
      canvas.height = Math.round(viewport.height * pixelRatio)
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      draw()
    }
    const move = (event: PointerEvent) => {
      if (!media.matches || event.pointerType !== 'mouse' || !viewport.visible) return
      const rect = hero.getBoundingClientRect()
      viewport.pointerX = event.clientX - rect.left
      viewport.pointerY = event.clientY - rect.top
      viewport.energy = 1
      if (!viewport.frame) viewport.frame = requestAnimationFrame(draw)
    }
    const leave = () => { viewport.energy = Math.max(viewport.energy, .45); viewport.pointerX = -1000; viewport.pointerY = -1000; if (!viewport.frame && viewport.visible) viewport.frame = requestAnimationFrame(draw) }
    const observer = new IntersectionObserver(([entry]) => {
      viewport.visible = entry.isIntersecting
      if (!viewport.visible) { cancelAnimationFrame(viewport.frame); viewport.frame = 0 }
      else draw()
    })
    const resizeObserver = new ResizeObserver(resize)
    observer.observe(hero)
    resizeObserver.observe(hero)
    hero.addEventListener('pointermove', move, { passive: true })
    hero.addEventListener('pointerleave', leave)
    media.addEventListener('change', draw)
    resize()
    return () => {
      cancelAnimationFrame(viewport.frame)
      observer.disconnect()
      resizeObserver.disconnect()
      hero.removeEventListener('pointermove', move)
      hero.removeEventListener('pointerleave', leave)
      media.removeEventListener('change', draw)
    }
  }, [])

  return <canvas ref={canvasRef} className="hero-dot-grid" aria-hidden="true" />
}
