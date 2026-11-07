import { useEffect, useId, useRef, useState } from 'react'

export default function TracksSculpture() {
  const container = useRef<HTMLDivElement>(null)
  const [image, setImage] = useState<string>()
  const gradient = useId()

  useEffect(() => {
    const target = container.current
    const device = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
    if (!target || device.connection?.saveData || (device.deviceMemory !== undefined && device.deviceMemory <= 4)) return
    const lifecycle = new AbortController()
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      void import('./renderTracksSculpture').then(({ renderTracksSculpture }) => {
        if (!lifecycle.signal.aborted) setImage(renderTracksSculpture())
      }).catch(() => { /* The decorative vector fallback remains visible. */ })
    }, { rootMargin: '160px' })
    observer.observe(target)
    return () => { lifecycle.abort(); observer.disconnect() }
  }, [])

  return <div ref={container} className="tracks-sculpture" aria-hidden="true">
    {image ? <img src={image} alt="" width={512} height={512} draggable={false} /> : <svg viewBox="0 0 300 300" focusable="false">
      <defs><linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#b8d8ff" /><stop offset=".5" stopColor="#6a78e8" /><stop offset="1" stopColor="#51408e" /></linearGradient></defs>
      <g stroke="#a6b9ff" strokeWidth="1" strokeLinejoin="round" fill={`url(#${gradient})`}>
        <path d="m62 185 102-44 94 45-102 58Z" /><path d="m62 185 94 47 102-46v14l-102 58-94-58Z" opacity=".5" />
        <path d="m79 148 90-43 70 39-90 48Z" /><path d="m79 148 70 44 90-48v15l-90 48-70-44Z" opacity=".65" />
        <path d="m121 111 70-42 26 68Z" /><path d="m121 111 96 26v15l-96-26Z" opacity=".5" />
        <ellipse cx="100" cy="105" rx="24" ry="23" fill="#c8d8ef" />
      </g>
    </svg>}
  </div>
}
