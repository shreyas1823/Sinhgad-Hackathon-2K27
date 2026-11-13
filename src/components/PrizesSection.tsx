import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { prizes } from '../config/event'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const updates = [
  { index: '01', title: 'The announcement', detail: 'Official prize details will be shared here once confirmed.' },
  { index: '02', title: 'Stay in the loop', detail: 'Check back for the organizers’ confirmed award information.' },
]

export default function PrizesSection() {
  const section = useRef<HTMLElement>(null)
  const published = prizes.published && prizes.awards.length > 0

  useGSAP(() => {
    const scope = section.current
    if (!scope) return
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (motion.matches) return
    const targets = gsap.utils.toArray<HTMLElement>('.prize-reveal', scope)
    const animation = gsap.timeline({ paused: true })
      .from(targets[0], { opacity: 0, y: 24, duration: .65, ease: 'power2.out' })
      .from(targets.slice(1), { opacity: 0, y: 16, duration: .55, stagger: .1, ease: 'power2.out' }, '-=.3')
    const trigger = ScrollTrigger.create({ trigger: scope, start: 'top 78%', once: true, onEnter: () => animation.play() })
    const onMotionChange = () => { if (motion.matches) { animation.progress(1); trigger.kill() } }
    motion.addEventListener('change', onMotionChange)
    return () => motion.removeEventListener('change', onMotionChange)
  }, { scope: section })

  return <section ref={section} className="prizes-section section-wrap" id="prizes" aria-labelledby="prizes-title">
    <div className="prizes-heading">
      <p className="section-label">Prizes & rewards / 05</p>
      <h2 id="prizes-title">Make room for <em>the reveal.</em></h2>
      <p>Recognition for what comes next. The official details are on their way.</p>
    </div>
    <div className="prizes-layout">
      <article className="prize-feature prize-reveal">
        <div className="prize-feature-top"><span>Official announcement</span><span aria-hidden="true">✳</span></div>
        <div className="prize-feature-content">
          <span className="prize-feature-orbit" aria-hidden="true" />
          <p className="prize-overline">THE NEXT REVEAL</p>
          <h3>{published ? 'Confirmed prizes' : 'Prize details will be announced soon.'}</h3>
          <p>{published ? 'Explore the confirmed awards.' : 'The organizers are finalizing the details. Watch this space for the official announcement.'}</p>
        </div>
        <div className="prize-feature-bottom"><span>SINHGAD HACKATHON 2K27</span><span>COMING INTO FOCUS <span aria-hidden="true">↗</span></span></div>
      </article>
      <div className="prize-support">
        {published ? prizes.awards.map((award, index) => <article className="prize-support-card prize-reveal" key={`${award.title}-${index}`}><span className="prize-card-index">{String(index + 1).padStart(2, '0')} / CONFIRMED</span><h3>{award.title}</h3><p>{award.detail}</p></article>) : updates.map((update) => <article className="prize-support-card prize-reveal" key={update.index}><span className="prize-card-index">{update.index} / UPDATE</span><h3>{update.title}</h3><p>{update.detail}</p><span className="prize-card-mark" aria-hidden="true">↗</span></article>)}
      </div>
    </div>
  </section>
}
