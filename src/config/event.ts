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
export const prizes: { title: string; detail: string }[] = []
export const sponsors: { name: string; logo?: string; url?: string }[] = []

export const faqs = [
  { question: 'When and where is the hackathon?', answer: `${event.name} is listed for ${event.date} at ${event.time} in ${event.venue}. These details are awaiting organizer reconfirmation.` },
  { question: 'What is the registration fee?', answer: `The registration page lists ${event.fee}. Please check the registration page for the latest information.` },
  { question: 'What is the allowed team size?', answer: `The registration page lists teams of ${event.teamSize}.` },
  { question: 'How do I register?', answer: 'Use any Register Now link on this page to open the existing Happenium registration page.' },
  { question: 'When does registration close?', answer: `The listed closing date is ${event.registrationCloses}. Please confirm this on the registration page.` },
] as const
