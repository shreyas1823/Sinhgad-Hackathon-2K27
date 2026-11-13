import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { event, sponsors } from '../config/event'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export default function SponsorsSection() {
  const section = useRef<HTMLElement>(null)

  useGSAP(() => {
    const scope = section.current
    if (!scope || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const panels = gsap.utils.toArray<HTMLElement>('.sponsor-reveal', scope)
    const reveal = gsap.from(panels, {
      opacity: 0, y: 20, duration: .7, stagger: .13, ease: 'power2.out',
      paused: true, immediateRender: false,
      onComplete: () => gsap.set(panels, { clearProps: 'opacity,transform' }),
    })
    ScrollTrigger.create({ trigger: scope, start: 'top 78%', once: true, onEnter: () => reveal.play() })
  }, { scope: section })

  return <section ref={section} className="sponsors-section section-wrap" id="sponsors" aria-labelledby="sponsors-title">
    <div className="section-intro sponsors-intro">
      <p className="section-label">Sponsors & partners / 06</p>
      <h2 id="sponsors-title">Built through <em>connection.</em></h2>
      <p>Meet the host institution. Confirmed partners will be introduced here.</p>
    </div>
    <div className="sponsors-layout">
      <article className="sponsor-host sponsor-reveal">
        <div className="sponsor-host-top"><span>Host Institution</span><span aria-hidden="true">01 / FOUNDATION</span></div>
        <div className="sponsor-host-content">
          <span className="sponsor-host-emblem" aria-hidden="true"><span /></span>
          <h3>{event.college}</h3>
        </div>
        <div className="sponsor-host-bottom"><span>{event.name}</span><span aria-hidden="true">↗</span></div>
      </article>
      <div className="sponsor-partners sponsor-reveal">
        <div className="sponsor-partners-top"><span>Partners & Sponsors</span><span aria-hidden="true">02 / CONNECTIONS</span></div>
        {sponsors.length ? <div className="sponsor-partner-content">
          <h3>Our partners & sponsors</h3>
          <ul className="sponsor-grid" aria-label="Confirmed sponsors and partners">{sponsors.map((sponsor) => <li key={sponsor.name}>
            {sponsor.url ? <a className="sponsor-entry" href={sponsor.url} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${sponsor.name}`}>
              {sponsor.logo && <img src={sponsor.logo} alt="" loading="lazy" />}
              <span>{sponsor.name}</span>
            </a> : <div className="sponsor-entry">{sponsor.logo && <img src={sponsor.logo} alt="" loading="lazy" />}<span>{sponsor.name}</span></div>}
          </li>)}</ul>
        </div> : <div className="sponsor-partner-content sponsor-announcement">
          <span className="sponsor-announcement-line" aria-hidden="true" />
          <p className="sponsor-announcement-label">THE NEXT CONNECTIONS</p>
          <h3>Sponsor and partner announcements are coming soon.</h3>
          <p>Confirmed organizations will be featured here when details are ready to share.</p>
        </div>}
        <div className="sponsor-partners-bottom"><span>{sponsors.length ? 'CONFIRMED ORGANIZATIONS' : 'OFFICIAL UPDATES TO FOLLOW'}</span><span aria-hidden="true">↗</span></div>
      </div>
    </div>
  </section>
}
