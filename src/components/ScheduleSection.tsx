import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { schedule } from '../config/event'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export default function ScheduleSection() {
  const section = useRef<HTMLElement>(null)

  useEffect(() => {
    if (window.location.hash !== '#schedule') return
    const frame = requestAnimationFrame(() => section.current?.scrollIntoView({ behavior: 'instant' }))
    return () => cancelAnimationFrame(frame)
  }, [])

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('.schedule-intro > *', {
        y: 22, opacity: 0, duration: 0.7, stagger: 0.12, ease: 'power2.out',
        scrollTrigger: { trigger: '.schedule-intro', start: 'top 82%', once: true },
      })
      gsap.from('.schedule-round-one', {
        y: 28, opacity: 0, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: '.schedule-round-one', start: 'top 88%', once: true },
      })
      gsap.fromTo('.schedule-line-progress', { scaleY: 0 }, {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: '.schedule-timeline', start: 'top 75%', end: 'bottom 65%', scrub: 0.5 },
      })
      if (schedule.round2Published) {
        gsap.from('.schedule-round-two > *', {
          y: 18, opacity: 0, duration: 0.65, stagger: 0.1, ease: 'power2.out',
          scrollTrigger: { trigger: '.schedule-round-two', start: 'top 85%', once: true },
        })
      }
      return () => undefined
    })
    return () => mm.revert()
  }, { scope: section })

  return <section ref={section} className="schedule-section section-wrap" id="schedule" aria-labelledby="schedule-title">
    <div className="section-intro schedule-intro">
      <p className="section-label">Event schedule / 04</p>
      <h2 id="schedule-title">A timeline for <em>what’s next.</em></h2>
      <p>Follow the journey from the online round to the on-site hackathon. Details are tentative until confirmed by the organizers.</p>
    </div>
    <div className="schedule-timeline">
      <span className="schedule-line" aria-hidden="true"><span className="schedule-line-progress" /></span>
      <ol className="schedule-stage-list" aria-label="Hackathon stages">
      <li className="schedule-stage schedule-round-one">
        <span className="schedule-marker" aria-hidden="true">01</span>
        <article className="schedule-card">
          <div className="schedule-card-top"><span>01 / ONLINE ROUND</span><span>TENTATIVE</span></div>
          <h3>{schedule.round1.title}</h3>
          <p className="schedule-date">{schedule.round1.date} <span>·</span> {schedule.round1.location}</p>
          <ol className="schedule-steps">{schedule.round1.steps.map((step) => <li key={step}>{step}</li>)}</ol>
        </article>
      </li>
      <li className="schedule-stage schedule-results">
        <span className="schedule-marker" aria-hidden="true">02</span>
        <div className="schedule-milestone">
          <span className="schedule-eyebrow">UPCOMING MILESTONE · APPROXIMATE WINDOW</span>
          <h3>{schedule.results.title}</h3>
          <p>{schedule.results.window}. The exact date has not been announced.</p>
        </div>
      </li>
      {schedule.round2Published && <li className="schedule-stage schedule-round-two">
        <span className="schedule-marker" aria-hidden="true">03</span>
        <article className="schedule-card schedule-card-secondary">
          <div className="schedule-card-top"><span>03 / ON-SITE HACKATHON</span><span>PUBLISHED</span></div>
          <h3>{schedule.round2.title}</h3>
          <p className="schedule-date">{schedule.round2.date} <span>·</span> {schedule.round2.location}</p>
          <p className="schedule-description">{schedule.round2.description}</p>
        </article>
      </li>}
      </ol>
    </div>
  </section>
}
