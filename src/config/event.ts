// Details transcribed from the existing registration page. Organizers must reconfirm before launch.
export const event = {
  name: 'National Level Sinhgad Hackathon 2K27',
  college: 'SKN Sinhgad College of Engineering',
  date: '26 February 2027',
  dateTime: '2027-02-26T10:00:00+05:30',
  dateConfirmed: false,
  time: '10:00 AM',
  venue: 'Pandharpur',
  fee: '₹50 per person',
  teamSize: '4–6 members',
  registrationCloses: '27 November 2026',
  registrationUrl: 'https://events.happenium.com/events/30/register',
} as const

export const navigation = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Tracks', href: '#tracks' },
  { label: 'Schedule', href: '#schedule' },
  { label: 'Prizes', href: '#prizes' },
  { label: 'Sponsors', href: '#sponsors' },
  { label: 'FAQ', href: '#faq' },
] as const

export type ProblemStatement = {
  id: string
  category: string
  title: string
  description: string
  tags?: string[]
  detailsUrl?: string
}

// Populate only with organizer-confirmed content. Each round can be published independently.
export const tracks: Record<'round1' | 'round2', ProblemStatement[]> = {
  round1: [],
  round2: [],
}
// Organizers publish Round 2 explicitly. The calendar never changes this flag.
export const schedule = {
  round2Published: false,
  round1: {
    title: 'Round 1 · Online round',
    date: '1–15 January 2027',
    location: 'Online participation',
    steps: ['Problem statements and submissions', 'Evaluation of submissions'],
  },
  results: {
    title: 'Round 1 results showcase',
    window: 'Expected in the last two weeks of January 2027',
  },
  round2: {
    title: 'Round 2 · On-site hackathon',
    date: event.date,
    location: event.venue,
    description: 'The detailed on-site programme will be shared by the organizers.',
  },
} as const
// Publish only after the organizers confirm every entry.
export const prizes: { published: boolean; awards: { title: string; detail: string }[] } = {
  published: false,
  awards: [],
}
export const sponsors: { name: string; logo?: string; url?: string }[] = []

type Faq = { question: string; answer: string; link?: { href: string; label: string } }

export const faqs: Faq[] = [
  { question: 'When and where is the hackathon?', answer: `${event.name} is listed for ${event.date} at ${event.time} in ${event.venue}. These details are awaiting organizer reconfirmation.` },
  { question: 'Is there a registration fee?', answer: `The registration page lists a fee of ${event.fee}. Please check that page for the latest information.` },
  { question: 'What is the team size?', answer: `The registration page lists teams of ${event.teamSize}. Please check that page for the latest information.` },
  { question: 'How can I register?', answer: 'Registration is available through the existing Happenium registration page.', link: { href: event.registrationUrl, label: 'Open registration page' } },
  { question: 'What is the registration deadline?', answer: `The listed deadline is ${event.registrationCloses}. Please verify it on the registration page.`, link: { href: event.registrationUrl, label: 'Verify registration deadline' } },
  { question: 'Are problem statements available?', answer: tracks.round1.length || tracks.round2.length ? 'Published problem statements are available in the Tracks section.' : 'Problem statements are not currently published. They will appear in the Tracks section when announced.', link: { href: '#tracks', label: 'View tracks' } },
  { question: 'Have prizes been announced?', answer: prizes.published && prizes.awards.length ? 'Confirmed prize details are available in the Prizes section.' : 'Prize details are not currently published. They will appear in the Prizes section when confirmed.', link: { href: '#prizes', label: 'View prizes' } },
  { question: 'Are sponsors confirmed?', answer: sponsors.length ? 'Confirmed organizations are listed in the Sponsors section.' : 'Sponsor details are not currently published. Confirmed organizations will appear in the Sponsors section.', link: { href: '#sponsors', label: 'View sponsors' } },
]
