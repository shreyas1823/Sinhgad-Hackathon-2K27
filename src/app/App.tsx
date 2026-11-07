import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { ArrowDownRight, ArrowUpRight, ArrowUp, Menu, X, Plus, Minus, Volume2, VolumeX } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import Lenis from 'lenis'
import HeroGlobe from '../components/HeroGlobe'
import MagneticCursor from '../components/MagneticCursor'
import HeroDotGrid from '../components/HeroDotGrid'
import TracksSculpture from '../components/TracksSculpture'
import { event, navigation, faqs, tracks, schedule, prizes, sponsors } from '../config/event'
import { useNavigationSound } from '../components/useNavigationSound'

gsap.registerPlugin(ScrollTrigger, useGSAP)

// Vite removes this import and panel from production builds.
const SoundPreview = import.meta.env.DEV ? lazy(() => import('../components/SoundPreview')) : null

const story = [
  { number: '01', word: 'Imagine.', detail: 'Every possibility begins with a different question.' },
  { number: '02', word: 'Innovate.', detail: 'Curiosity becomes a direction. Ideas find their shape.' },
  { number: '03', word: 'Build.', detail: 'What comes next starts with what we make together.' },
]

function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true, syncTouch: false, anchors: true })
    const update = () => ScrollTrigger.update()
    const tick = (time: number) => lenis.raf(time * 1000)
    lenis.on('scroll', update)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(tick)
      lenis.off('scroll', update)
      lenis.destroy()
    }
  }, [])
  return null
}

function App() {
  const root = useRef<HTMLDivElement>(null)
  const nav = useRef<HTMLElement>(null)
  const navHover = useRef<HTMLElement | null>(null)
  const previousSection = useRef('home')
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [active, setActive] = useState('home')
  const { enabled: soundEnabled, toggle: toggleSound, play: playSound, playEffect, preset, setPreset, preview } = useNavigationSound()
  useGSAP(() => {
    const screen = document.getElementById('boot-screen')
    if (!screen) return
    const content = root.current?.querySelector<HTMLElement>('.hero-content')
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let entrance: gsap.core.Tween | undefined
    let fallback: number | undefined

    const removeLoader = () => {
      screen.removeEventListener('transitionend', onTransitionEnd)
      window.clearTimeout(fallback)
      screen.remove()
    }
    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target === screen && event.propertyName === 'opacity') removeLoader()
    }
    const stopListening = () => {
      content?.removeEventListener('focusin', finish)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('hashchange', finish)
      window.removeEventListener('pageshow', onPageShow)
      motion.removeEventListener('change', onMotionChange)
    }
    const revealContent = () => {
      content?.style.removeProperty('opacity')
      content?.style.removeProperty('transform')
      content?.classList.remove('is-entering')
      stopListening()
    }
    const finish = () => {
      entrance?.kill()
      revealContent()
      removeLoader()
    }
    const onScroll = () => { if (window.scrollY > 0) finish() }
    const onPageShow = (event: PageTransitionEvent) => { if (event.persisted) finish() }
    const onMotionChange = () => { if (motion.matches) finish() }
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    const belowHero = Boolean(window.location.hash && !['#home', '#main', '#hero-title'].includes(window.location.hash))

    try {
      if (!content || motion.matches || window.scrollY > 0 || belowHero || navigationEntry?.type === 'back_forward' || content.contains(document.activeElement)) {
        finish()
      } else {
        // useGSAP establishes this state in the layout phase, before the hero paints.
        content.classList.add('is-entering')
        entrance = gsap.fromTo(content, { opacity: 0, y: 12 }, {
          opacity: 1, y: 0, force3D: false, duration: 0.5, ease: 'power1.out', onComplete: revealContent,
        })
        content.addEventListener('focusin', finish)
        window.addEventListener('scroll', onScroll, { passive: true })
        window.addEventListener('hashchange', finish)
        window.addEventListener('pageshow', onPageShow)
        motion.addEventListener('change', onMotionChange)
        screen.addEventListener('transitionend', onTransitionEnd)
        screen.classList.add('is-ready')
        // Cleanup only: interrupted CSS transitions must not leave an overlay behind.
        fallback = window.setTimeout(removeLoader, 500)
      }
    } catch {
      // Content is visible by default if entrance setup is unavailable.
      finish()
    }
    return () => {
      stopListening()
      screen.removeEventListener('transitionend', onTransitionEnd)
      window.clearTimeout(fallback)
      content?.classList.remove('is-entering')
      // useGSAP reverts its tweens; retain the overlay for Strict Mode's setup replay.
    }
  }, { scope: root })
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) setActive(visible.target.id)
    }, { rootMargin: '-20% 0px -55% 0px', threshold: [0, 0.25, 0.5] })
    navigation.forEach(({ href }) => { const section = document.querySelector(href); if (section) observer.observe(section) })
    return () => { window.removeEventListener('scroll', onScroll); observer.disconnect() }
  }, [])
  useEffect(() => {
    if (previousSection.current === active) return
    previousSection.current = active
    playEffect('section')
  }, [active, playEffect])
  const onSiteClick = (clickEvent: MouseEvent<HTMLDivElement>) => {
    const target = clickEvent.target
    if (!(target instanceof Element) || target.closest('.sound-preview, .sound-toggle')) return
    const link = target.closest<HTMLAnchorElement>('a')
    if (link?.href === event.registrationUrl) { playEffect('register'); return }
    if (target.closest('button, summary, .button-text')) playEffect('button')
  }
  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        document.querySelector<HTMLButtonElement>('.menu-toggle')?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])
  useEffect(() => {
    const container = nav.current
    if (!container) return
    const indicator = container.querySelector<HTMLElement>('.nav-indicator')
    const position = () => {
      const target = navHover.current ?? container.querySelector<HTMLElement>('a[aria-current]')
      if (!target || !indicator || window.innerWidth < 900) {
        indicator?.classList.remove('is-visible')
        return
      }
      indicator.style.width = `${target.offsetWidth + 18}px`
      indicator.style.transform = `translateX(${target.offsetLeft - 9}px)`
      indicator.classList.add('is-visible')
    }
    position()
    window.addEventListener('resize', position)
    return () => window.removeEventListener('resize', position)
  }, [active])
  const setNavHover = (target: HTMLElement | null) => {
    navHover.current = target
    const container = nav.current
    const indicator = container?.querySelector<HTMLElement>('.nav-indicator')
    const selected = target ?? container?.querySelector<HTMLElement>('a[aria-current]')
    if (!indicator || !selected || window.innerWidth < 900) { indicator?.classList.remove('is-visible'); return }
    indicator.style.width = `${selected.offsetWidth + 18}px`
    indicator.style.transform = `translateX(${selected.offsetLeft - 9}px)`
    indicator.classList.add('is-visible')
  }
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add({ desktop: '(min-width: 900px)', motion: '(prefers-reduced-motion: no-preference)' }, (context) => {
      if (!context.conditions?.motion) return
      gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.7 } })
        .to('.hero-title', { y: -45, scale: 0.94, transformOrigin: 'left center', ease: 'none' }, 0)
        .to('.hero-copy', { y: -75, autoAlpha: 0.15, ease: 'none' }, 0)
        .to('.hero-kicker', { y: -35, autoAlpha: 0, ease: 'none' }, 0)
        .to('.hero-globe', { y: 95, x: 35, scale: 0.86, ease: 'none' }, 0)
        .to('.hero-halo', { y: -110, scale: 1.25, autoAlpha: 0.25, ease: 'none' }, 0)
        .to('.hero-orbit', { rotation: 25, y: -65, autoAlpha: 0.1, ease: 'none' }, 0)
      gsap.to('.terrain-back', { y: -115, ease: 'none', scrollTrigger: { trigger: '.passage', start: 'top bottom', end: 'bottom top', scrub: 0.7 } })
      gsap.to('.terrain-front', { y: -55, ease: 'none', scrollTrigger: { trigger: '.passage', start: 'top bottom', end: 'bottom top', scrub: 0.7 } })
      gsap.from('.passage-content', { y: 70, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: '.passage', start: 'top 80%', end: 'top 35%', scrub: 0.5 } })
      if (context.conditions?.desktop) {
        const panels = gsap.utils.toArray<HTMLElement>('.story-panel')
        const timeline = gsap.timeline({ scrollTrigger: { trigger: '.story', start: 'top top', end: '+=145%', pin: true, scrub: 0.7, anticipatePin: 1 } })
        panels.forEach((panel, index) => {
          if (index === 0) return
          timeline.to(panels[index - 1], { autoAlpha: 0, y: -45, duration: 0.45, ease: 'none' }, index - 0.25)
            .fromTo(panel, { autoAlpha: 0, y: 65 }, { autoAlpha: 1, y: 0, duration: 0.55, ease: 'none' }, index - 0.08)
            .to('.story-core', { rotation: index * 32, scale: 1 + index * 0.12, duration: 0.8, ease: 'none' }, index - 0.2)
        })
      }
    })
    return () => mm.revert()
  }, { scope: root })

  return <div ref={root} className="site-shell bg-background text-foreground" onClickCapture={onSiteClick}>
    <SmoothScroll />
    <MagneticCursor />
    {SoundPreview && new URLSearchParams(window.location.search).has('sound-preview') && <Suspense fallback={null}><SoundPreview enabled={soundEnabled} preset={preset} onSelect={setPreset} onPreview={preview} /></Suspense>}
    <a className="skip-link" href="#main">Skip to content</a>
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <a href="#home" className="brand" onClick={() => setMenuOpen(false)}>Sinhgad <span>Hackathon</span> 2K27<small>{event.college}</small></a>
      <nav ref={nav} className={`site-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Primary navigation" id="primary-nav" onPointerLeave={() => setNavHover(null)} onFocusCapture={(event) => { if (event.target instanceof HTMLAnchorElement && !event.target.classList.contains('nav-register')) setNavHover(event.target) }} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setNavHover(null) }}>
        <span className="nav-indicator" aria-hidden="true" />
        {navigation.map(({ label, href }) => <a key={href} href={href} aria-current={active === href.slice(1) ? 'location' : undefined} onPointerEnter={(event) => { if (event.pointerType === 'mouse') { playSound(); setNavHover(event.currentTarget) } }} onClick={() => setMenuOpen(false)}>{label}</a>)}
        <a className="nav-register magnetic-button" href={event.registrationUrl} target="_blank" rel="noopener noreferrer" onPointerEnter={(event) => { if (event.pointerType === 'mouse') playSound() }} onClick={() => setMenuOpen(false)}>Register Now <ArrowUpRight size={16} aria-hidden="true" /></a>
      </nav>
      <button className={`sound-toggle ${soundEnabled ? 'is-on' : ''}`} type="button" aria-label={`Turn navigation sound ${soundEnabled ? 'off' : 'on'}`} aria-pressed={soundEnabled} onClick={() => { void toggleSound() }}>{soundEnabled ? <Volume2 size={18} aria-hidden="true" /> : <VolumeX size={18} aria-hidden="true" />}<span className="sound-label">Sound {soundEnabled ? 'on' : 'off'}</span></button>
      <button className="menu-toggle" type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-controls="primary-nav" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={24} /> : <Menu size={24} />}</button>
    </header>
    <main id="main">
      <section className="hero" id="home" aria-labelledby="hero-title">
        <HeroDotGrid />
        <div className="hero-halo" aria-hidden="true" /><div className="hero-orbit" aria-hidden="true" />
        <div className="hero-inner">
          <div className="hero-content">
            <p className="eyebrow hero-kicker"><span className="eyebrow-dot" /> {event.name}</p>
            <h1 id="hero-title" className="hero-title">Build What <span>Comes Next.</span></h1>
            <div className="hero-copy"><p>Bring your ideas to life at the {event.name}. Connect, create and build solutions that make a difference.</p><div className="hero-actions"><a className="button-primary magnetic-button" href={event.registrationUrl} target="_blank" rel="noopener noreferrer">Register Now <ArrowUpRight size={18} aria-hidden="true" /></a><a className="button-text" href="#about">Explore Event <ArrowDownRight size={18} aria-hidden="true" /></a></div><p className="hero-meta">{event.date} <span>·</span> {event.venue}</p></div>
          </div>
          <div className="hero-globe"><HeroGlobe /></div>
        </div>
        <div className="scroll-cue" aria-hidden="true"><span>Scroll to explore</span><ArrowDownRight size={17} /></div>
      </section>
      <section className="passage" id="about" aria-labelledby="passage-title">
        <div className="passage-ambient" aria-hidden="true" /><div className="terrain terrain-back" aria-hidden="true" /><div className="terrain terrain-front" aria-hidden="true" />
        <div className="passage-content"><p className="section-label">About the hackathon <span> / 01</span></p><h2 id="passage-title">An idea can <em>travel</em> anywhere.</h2><p>{event.name} brings people together to turn promising ideas into practical solutions. It is a space to explore a problem, collaborate across perspectives and build something that can make a difference.</p></div>
        <span className="passage-coordinate" aria-hidden="true">POSSIBILITY / IN MOTION</span>
      </section>
      <section className="event-info section-wrap" id="event" aria-labelledby="event-title"><div className="section-intro"><p className="section-label">At a glance / 02</p><h2 id="event-title">The details, <em>in focus.</em></h2><p>Plan your next step with the event information currently listed on the registration page.</p></div><div className="info-layout"><div className="info-feature"><span className="info-index">01 / DATE & PLACE</span><strong>{event.date}</strong><span>{event.time} · {event.venue}</span></div><dl className="info-list"><div><dt>Registration fee</dt><dd>{event.fee}</dd></div><div><dt>Team size</dt><dd>{event.teamSize}</dd></div><div><dt>Registration closes</dt><dd>{event.registrationCloses}</dd></div></dl></div><p className="provisional">Event details are from the existing registration page and await organizer reconfirmation before public launch.</p></section>
      <section className="story" aria-labelledby="story-title">
        <div className="story-grid" aria-hidden="true" />
        <div className="story-heading"><p className="section-label">The creative process <span> / 02</span></p><h2 id="story-title">From thought to form.</h2></div>
        <div className="story-core" aria-hidden="true"><div className="core-inner" /><div className="core-ring core-ring-one" /><div className="core-ring core-ring-two" /></div>
        <div className="story-panels">{story.map((item) => <article className="story-panel" key={item.number}><span className="story-number">{item.number} / 03</span><h3>{item.word}</h3><p>{item.detail}</p></article>)}</div>
        <div className="story-progress" aria-hidden="true"><span /><span /><span /></div>
      </section>
      <section className="announcement-section section-wrap" id="tracks" aria-labelledby="tracks-title"><div className="announcement-heading"><p className="section-label">Innovation tracks / 03</p><h2 id="tracks-title">The next challenge is <em>taking shape.</em></h2></div><div className="announcement-panel"><span className="announcement-number">01 / OPEN POSSIBILITIES</span><p>{tracks.length ? 'Explore the confirmed problem statements.' : 'Problem statements and innovation tracks will be announced soon.'}</p><TracksSculpture /></div></section>
      <section className="schedule-section section-wrap" id="schedule" aria-labelledby="schedule-title"><div className="section-intro"><p className="section-label">Event schedule / 04</p><h2 id="schedule-title">A timeline for <em>what’s next.</em></h2><p>The detailed programme will be shared once it is confirmed by the organizers.</p></div><div className="timeline"><span className="timeline-line" aria-hidden="true" /><div className="timeline-item"><span className="timeline-dot" /><span>01</span><strong>{schedule.length ? 'Programme' : 'Schedule announcement'}</strong><p>{schedule.length ? 'Confirmed schedule entries will appear here.' : 'Session timings and the event flow are coming soon.'}</p></div></div></section>
      <section className="prizes-section section-wrap" id="prizes" aria-labelledby="prizes-title"><p className="section-label">Prizes & rewards / 05</p><div className="prizes-layout"><h2 id="prizes-title">Make room for <em>the reveal.</em></h2><div><svg className="prizes-spark" width="75" height="90" viewBox="0 0 80 96" fill="none" aria-hidden="true" focusable="false"><defs><linearGradient id="prize-spark-stroke" x1="12" y1="10" x2="68" y2="86" gradientUnits="userSpaceOnUse"><stop stopColor="#a6ddff" /><stop offset="1" stopColor="#a36bff" /></linearGradient></defs><path d="M40 10 47 39 68 48 47 57 40 86 33 57 12 48 33 39Z" stroke="url(#prize-spark-stroke)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" /></svg><p>{prizes.length ? 'Confirmed rewards will be published here.' : 'Prize details will be revealed by the organizers. Stay tuned for the official announcement.'}</p></div></div></section>
      <section className="sponsors-section section-wrap" id="sponsors" aria-labelledby="sponsors-title"><div className="section-intro"><p className="section-label">Sponsors & partners / 06</p><h2 id="sponsors-title">Built through <em>connection.</em></h2></div><div className="sponsor-surface"><div><span>HOST INSTITUTION</span><strong>{event.college}</strong></div><p>{sponsors.length ? 'Confirmed partners will be featured here.' : 'Sponsor and partner announcements are coming soon.'}</p></div></section>
      <section className="closing" id="register" aria-labelledby="closing-title"><p className="section-label">Join the experience / 07</p><h2 id="closing-title">Your Next Big Idea <em>Starts Here.</em></h2><p>Bring your team, your curiosity and your drive to build. The next step starts with registration.</p><a className="button-primary magnetic-button" href={event.registrationUrl} target="_blank" rel="noopener noreferrer">Register Now <ArrowUpRight size={18} aria-hidden="true" /></a><span className="closing-note">Teams of {event.teamSize} · Registration closes {event.registrationCloses}</span></section>
      <section className="faq-section section-wrap" id="faq" aria-labelledby="faq-title"><div className="section-intro"><p className="section-label">Questions / 08</p><h2 id="faq-title">Good to <em>know.</em></h2></div><div className="faq-list">{faqs.map(({ question, answer }) => <details key={question}><summary>{question}<span className="faq-icon" aria-hidden="true"><Plus className="faq-plus" size={20} /><Minus className="faq-minus" size={20} /></span></summary><p>{answer}</p></details>)}</div></section>
    </main>
    <footer className="site-footer"><div><a href="#home" className="brand">Sinhgad <span>Hackathon</span> 2K27<small>{event.college}</small></a><p>{event.name}</p></div><nav aria-label="Footer navigation">{navigation.map(({ label, href }) => <a href={href} key={href}>{label}</a>)}<a href={event.registrationUrl} target="_blank" rel="noopener noreferrer">Register Now <ArrowUpRight className="footer-icon" size={13} aria-hidden="true" /></a></nav><div className="footer-bottom"><span>© 2027 {event.college}</span><a href="#home">Back to top <ArrowUp className="footer-icon" size={12} aria-hidden="true" /></a></div></footer>
  </div>
}

export default App
