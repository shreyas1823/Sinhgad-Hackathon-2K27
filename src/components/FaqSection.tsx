import { ArrowUpRight, Minus, Plus } from 'lucide-react'
import { faqs } from '../config/event'

export default function FaqSection() {
  return <section className="faq-section section-wrap" id="faq" aria-labelledby="faq-title">
    <div className="section-intro faq-intro">
      <p className="section-label">Questions / 08</p>
      <h2 id="faq-title">Good to <em>know.</em></h2>
      <p>The essentials, with updates as details are confirmed.</p>
    </div>
    <div className="faq-list">{faqs.map(({ question, answer, link }, index) => <details key={question}>
      <summary>
        <span className="faq-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        <span className="faq-question">{question}</span>
        <span className="faq-icon" aria-hidden="true"><Plus className="faq-plus" size={20} /><Minus className="faq-minus" size={20} /></span>
      </summary>
      <div className="faq-answer"><p>{answer}</p>{link && <a href={link.href} target={link.href.startsWith('http') ? '_blank' : undefined} rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}>{link.label}<ArrowUpRight size={16} aria-hidden="true" /></a>}</div>
    </details>)}</div>
  </section>
}
