import { useRef } from 'react'
import type { PointerEvent } from 'react'
import { ArrowUpRight } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { tracks } from '../config/event'
import type { ProblemStatement } from '../config/event'
import TracksSculpture from './TracksSculpture'

gsap.registerPlugin(ScrollTrigger, useGSAP)

function SpotlightCard({ statement }: { statement?: ProblemStatement }) {
  const card = useRef<HTMLElement>(null)
  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse' || !window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - bounds.left
    const y = event.clientY - bounds.top
    const element = card.current
    if (!element) return
    element.style.setProperty('--spot-x', `${x}px`)
    element.style.setProperty('--spot-y', `${y}px`)
    element.style.setProperty('--tilt-x', `${((y / bounds.height) - .5) * -3}deg`)
    element.style.setProperty('--tilt-y', `${((x / bounds.width) - .5) * 3}deg`)
  }
  const onPointerLeave = () => {
    card.current?.style.setProperty('--tilt-x', '0deg')
    card.current?.style.setProperty('--tilt-y', '0deg')
  }

  return <article ref={card} className={`track-card${statement ? '' : ' track-card-announcement'}`} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
    <div className="track-card-surface">
      {statement ? <>
        <div className="track-card-meta"><span>{statement.id}</span><span>{statement.category}</span></div>
        <div className="track-card-content"><h3>{statement.title}</h3><p>{statement.description}</p></div>
        <div className="track-card-footer">{statement.tags?.length ? <ul aria-label="Tags">{statement.tags.map(tag => <li key={tag}>{tag}</li>)}</ul> : <span />}{statement.detailsUrl && <a href={statement.detailsUrl} className="track-card-link">Details <ArrowUpRight size={16} aria-hidden="true" /></a>}</div>
      </> : <>
        <span className="track-card-meta">01 / OPEN POSSIBILITIES</span>
        <div className="track-card-content"><p>Problem statements and innovation tracks will be announced soon.</p></div>
        <TracksSculpture />
        <span className="track-card-corner" aria-hidden="true">↗</span>
      </>}
    </div>
  </article>
}

export default function TracksSection() {
  const section = useRef<HTMLElement>(null)
  const rounds = [
    { key: 'round1', label: 'Round 1', statements: tracks.round1 },
    { key: 'round2', label: 'Round 2', statements: tracks.round2 },
  ] as const
  const hasStatements = rounds.some(round => round.statements.length > 0)

  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const cards = gsap.utils.toArray<HTMLElement>('.track-card')
    const reveal = gsap.from(cards, { opacity: 0, y: 22, duration: .7, stagger: .12, ease: 'power2.out', paused: true, immediateRender: false, onComplete: () => gsap.set(cards, { clearProps: 'opacity,transform' }) })
    ScrollTrigger.create({ trigger: section.current, start: 'top 78%', once: true, onEnter: () => reveal.play() })
  }, { scope: section })

  return <section ref={section} className="announcement-section section-wrap" id="tracks" aria-labelledby="tracks-title">
    <div className="announcement-heading"><p className="section-label">Innovation tracks / 03</p><h2 id="tracks-title">The next challenge is <em>taking shape.</em></h2></div>
    {hasStatements ? rounds.filter(round => round.statements.length).map(round => <div className="tracks-round" key={round.key}><h3 className="tracks-round-label">{round.label}</h3><div className="tracks-grid">{round.statements.map(statement => <SpotlightCard key={statement.id} statement={statement} />)}</div></div>) : <div className="tracks-grid"><SpotlightCard /></div>}
  </section>
}
