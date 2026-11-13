import { useRef } from 'react'
import { ArrowUpRight } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { event } from '../config/event'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export default function RegistrationSection() {
  const section = useRef<HTMLElement>(null)

  useGSAP(() => {
    const scope = section.current
    if (!scope || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const elements = gsap.utils.toArray<HTMLElement>('.closing-reveal', scope)
    const reveal = gsap.from(elements, {
      opacity: 0, y: 24, duration: .75, stagger: .1, ease: 'power2.out',
      paused: true, immediateRender: false,
      onComplete: () => gsap.set(elements, { clearProps: 'opacity,transform' }),
    })
    ScrollTrigger.create({ trigger: scope, start: 'top 78%', once: true, onEnter: () => reveal.play() })
  }, { scope: section })

  return <section ref={section} className="closing" id="register" aria-labelledby="closing-title">
    <div className="closing-atmosphere" aria-hidden="true"><span className="closing-orbit closing-orbit-one" /><span className="closing-orbit closing-orbit-two" /><span className="closing-core" /></div>
    <div className="closing-content">
      <p className="section-label closing-label closing-reveal"><span className="closing-label-line" aria-hidden="true" /> The next step / Register</p>
      <h2 id="closing-title" className="closing-reveal">Your Next Big Idea <em>Starts Here.</em></h2>
      <p className="closing-copy closing-reveal">Bring your team, your curiosity and your drive to build. Begin with the existing registration page.</p>
      <div className="closing-action closing-reveal"><a className="button-primary magnetic-button" href={event.registrationUrl} target="_blank" rel="noopener noreferrer">Register Now <ArrowUpRight size={20} aria-hidden="true" /></a><span>Opens the Happenium registration page</span></div>
      <p className="closing-note closing-reveal">The registration page lists teams of {event.teamSize} and a registration deadline of {event.registrationCloses}. Please verify these details on that page; they await organizer reconfirmation.</p>
    </div>
  </section>
}
