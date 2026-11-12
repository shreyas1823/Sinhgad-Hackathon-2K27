import { useEffect } from 'react'

const selector = '.magnetic-button, .site-nav > a:not(.nav-register), .button-text'
const enabledQuery = '(min-width: 900px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'

export default function MagneticCursor() {
  useEffect(() => {
    const media = window.matchMedia(enabledQuery)
    const cursor = document.createElement('span')
    cursor.className = 'interaction-cursor'
    cursor.setAttribute('aria-hidden', 'true')
    cursor.innerHTML = '<span class="cursor-frame"></span><span class="cursor-dot"></span>'
    const frameElement = cursor.firstElementChild as HTMLElement
    const dot = cursor.lastElementChild as HTMLElement
    let frame = 0
    let active: HTMLElement | null = null
    let x = 0
    let y = 0
    let frameX = 0
    let frameY = 0
    let hasPointer = false

    const reset = () => {
      document.documentElement.classList.remove('custom-cursor-active')
      active?.style.removeProperty('--mag-x')
      active?.style.removeProperty('--mag-y')
      active = null
      cursor.classList.remove('is-visible', 'is-interactive', 'is-cta', 'is-pressed')
      cancelAnimationFrame(frame)
      frame = 0
    }
    const tick = () => {
      frame = 0
      if (!media.matches || !hasPointer) return
      frameX += (x - frameX) * .28
      frameY += (y - frameY) * .28
      frameElement.style.translate = `${frameX}px ${frameY}px`
      if (Math.abs(x - frameX) + Math.abs(y - frameY) > .25) frame = requestAnimationFrame(tick)
    }
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') { hasPointer = false; reset(); return }
      if (!media.matches) return
      if (event.target instanceof Element && event.target.closest('input, textarea, [contenteditable]:not([contenteditable="false"])')) {
        hasPointer = false
        reset()
        return
      }
      x = event.clientX
      y = event.clientY
      if (!hasPointer) { frameX = x; frameY = y; hasPointer = true }
      dot.style.translate = `${x}px ${y}px`
      cursor.classList.add('is-visible')
      document.documentElement.classList.add('custom-cursor-active')
      const targets = document.querySelectorAll<HTMLElement>(selector)
      let nearest: HTMLElement | null = null
      let distance = 72
      let dx = 0
      let dy = 0
      targets.forEach((target) => {
        const rect = target.getBoundingClientRect()
        const offsetX = x - (rect.left + rect.width / 2)
        const offsetY = y - (rect.top + rect.height / 2)
        const edgeDistance = Math.hypot(Math.max(0, Math.abs(offsetX) - rect.width / 2), Math.max(0, Math.abs(offsetY) - rect.height / 2))
        if (edgeDistance < distance) { nearest = target; distance = edgeDistance; dx = offsetX; dy = offsetY }
      })
      if (active !== nearest) {
        active?.style.removeProperty('--mag-x')
        active?.style.removeProperty('--mag-y')
      }
      active = nearest
      const selected = nearest as HTMLElement | null
      cursor.classList.toggle('is-interactive', Boolean(selected))
      cursor.classList.toggle('is-cta', Boolean(selected?.matches('.magnetic-button')))
      if (selected) {
        const strength = Math.max(0, 1 - distance / 72)
        selected.style.setProperty('--mag-x', `${Math.max(-7, Math.min(7, dx * .12 * strength))}px`)
        selected.style.setProperty('--mag-y', `${Math.max(-7, Math.min(7, dy * .12 * strength))}px`)
      }
      if (!frame) frame = requestAnimationFrame(tick)
    }
    const onDown = () => { if (media.matches) cursor.classList.add('is-pressed') }
    const onUp = () => cursor.classList.remove('is-pressed')
    const onLeave = () => { hasPointer = false; reset() }
    document.body.append(cursor)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('blur', onLeave)
    document.addEventListener('pointerleave', onLeave)
    media.addEventListener('change', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('blur', onLeave)
      document.removeEventListener('pointerleave', onLeave)
      media.removeEventListener('change', onLeave)
      reset()
      cursor.remove()
    }
  }, [])
  return null
}
