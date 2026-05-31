// WaveForm podcast data — real ElevenLabs TTS audio, multi-agent interject support

export const AGENT_PERSONAS = {
  Maya: {
    name: 'Maya Chen',
    role: 'Tech journalist & AI skeptic',
    color: '#9F67FF',
    voiceId: 'XrExE9yKIg1WjnnlVkGX',
    persona: 'Sharp tech journalist with an AI-skeptic edge. Pushes for precise definitions, references AI history and research. Will call out hype — but is genuinely curious.',
  },
  Leo: {
    name: 'Leo Grant',
    role: 'VC & startup operator',
    color: '#00D4AA',
    voiceId: 'IKne3meq5aSn9XLyUdCD',
    persona: 'Venture capitalist and serial operator. Cuts straight to market implications, capital flows, and what it means for founders. Practical, numbers-grounded, slightly provocative.',
  },
  Ava: {
    name: 'Ava Brooks',
    role: 'AI founder & builder',
    color: '#F357FF',
    voiceId: 'hpp4J3VqNfWAUOO0d1Us',
    persona: 'Builds production AI systems daily. Speaks from the trenches — not theory. Pragmatic and experiential, with a founder\'s urgency about what\'s possible right now.',
  },
};

export const colors = {
  background: '#08060F',
  surface: '#141022',
  surfaceAlt: '#1D1731',
  border: '#2D2448',
  primary: '#9F67FF',
  accent: '#F357FF',
  text: '#F7F3FF',
  textMuted: '#A698C8',
  success: '#7CFFB2',
};

export const images = {
  hero:       'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80',
  mic:        'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&q=80',
  studio:     'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&q=80',
  headphones: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
  server:     'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80',
};

export const topics = ['AI', 'SaaS', 'Founders', 'Voice UI', 'Singularity', 'Startups'];

export const episodes = [
  {
    id: 'e1',
    title: 'The Last Job Interview',
    duration: '6:00',
    plays: '18.2K',
    host: 'Maya Chen & Leo Grant',
    hosts: ['Maya', 'Leo'],
    image: images.hero,
    audioUrl: "https://storage.googleapis.com/alphinium-assets/waveform/audio/e1.mp3",
    description: 'AI has already taken over hiring screens. Is the interview as a human institution over? And what does that mean for everyone involved?',
    images: ['https://loremflickr.com/800/450/job,interview,technology,hiring,business?lock=1','https://loremflickr.com/800/450/job,interview,technology,hiring,business?lock=2','https://loremflickr.com/800/450/job,interview,technology,hiring,business?lock=3','https://loremflickr.com/800/450/job,interview,technology,hiring,business?lock=4','https://loremflickr.com/800/450/job,interview,technology,hiring,business?lock=5','https://loremflickr.com/800/450/job,interview,technology,hiring,business?lock=6','https://loremflickr.com/800/450/job,interview,technology,hiring,business?lock=7'],
  },
  {
    id: 'e2',
    title: 'Singularity or Bust',
    duration: '5:52',
    plays: '24.1K',
    host: 'Maya Chen & Ava Brooks',
    hosts: ['Maya', 'Ava'],
    image: images.mic,
    audioUrl: "https://storage.googleapis.com/alphinium-assets/waveform/audio/e2.mp3",
    description: 'The singularity isn\'t coming. We\'re in it. Maya and Ava on the exponential curve, Kurzweil\'s 2029 prediction, and the wave you\'re already riding.',
    images: ['https://loremflickr.com/800/450/artificial,intelligence,technology,digital,futuristic?lock=1','https://loremflickr.com/800/450/artificial,intelligence,technology,digital,futuristic?lock=2','https://loremflickr.com/800/450/artificial,intelligence,technology,digital,futuristic?lock=3','https://loremflickr.com/800/450/artificial,intelligence,technology,digital,futuristic?lock=4','https://loremflickr.com/800/450/artificial,intelligence,technology,digital,futuristic?lock=5','https://loremflickr.com/800/450/artificial,intelligence,technology,digital,futuristic?lock=6','https://loremflickr.com/800/450/artificial,intelligence,technology,digital,futuristic?lock=7'],
  },
  {
    id: 'e3',
    title: 'The AI Founder',
    duration: '5:31',
    plays: '15.7K',
    host: 'Leo Grant & Maya Chen',
    hosts: ['Leo', 'Maya'],
    image: images.studio,
    audioUrl: "https://storage.googleapis.com/alphinium-assets/waveform/audio/e3.mp3",
    description: 'Sam Altman predicted billion-dollar one-person companies. In 2026, it\'s actually happening. What does a founder even do when the team is 90% AI agents?',
    images: ['https://loremflickr.com/800/450/startup,entrepreneur,technology,innovation,founder?lock=1','https://loremflickr.com/800/450/startup,entrepreneur,technology,innovation,founder?lock=2','https://loremflickr.com/800/450/startup,entrepreneur,technology,innovation,founder?lock=3','https://loremflickr.com/800/450/startup,entrepreneur,technology,innovation,founder?lock=4','https://loremflickr.com/800/450/startup,entrepreneur,technology,innovation,founder?lock=5','https://loremflickr.com/800/450/startup,entrepreneur,technology,innovation,founder?lock=6','https://loremflickr.com/800/450/startup,entrepreneur,technology,innovation,founder?lock=7'],
  },
  {
    id: 'e4',
    title: 'Voice is the New UI',
    duration: '5:38',
    plays: '11.9K',
    host: 'Ava Brooks & Leo Grant',
    hosts: ['Ava', 'Leo'],
    image: images.headphones,
    audioUrl: "https://storage.googleapis.com/alphinium-assets/waveform/audio/e4.mp3",
    description: 'Forms are dead. Apps are dying. Gen Alpha doesn\'t type — they talk. The post-GUI era is here and most companies are still building for last decade.',
    images: ['https://loremflickr.com/800/450/microphone,audio,voice,sound,technology?lock=1','https://loremflickr.com/800/450/microphone,audio,voice,sound,technology?lock=2','https://loremflickr.com/800/450/microphone,audio,voice,sound,technology?lock=3','https://loremflickr.com/800/450/microphone,audio,voice,sound,technology?lock=4','https://loremflickr.com/800/450/microphone,audio,voice,sound,technology?lock=5','https://loremflickr.com/800/450/microphone,audio,voice,sound,technology?lock=6','https://loremflickr.com/800/450/microphone,audio,voice,sound,technology?lock=7'],
  },
  {
    id: 'e5',
    title: 'Digital Gods',
    duration: '6:22',
    plays: '31.4K',
    host: 'Maya Chen, Leo Grant & Ava Brooks',
    hosts: ['Maya', 'Leo', 'Ava'],
    image: images.server,
    audioUrl: "https://storage.googleapis.com/alphinium-assets/waveform/audio/e5.mp3",
    description: 'Five companies control the most powerful technology in human history. Maya, Leo, and Ava on AI power concentration, AGI timelines, and who actually has the keys.',
    images: ['https://loremflickr.com/800/450/digital,technology,dark,future,network?lock=1','https://loremflickr.com/800/450/digital,technology,dark,future,network?lock=2','https://loremflickr.com/800/450/digital,technology,dark,future,network?lock=3','https://loremflickr.com/800/450/digital,technology,dark,future,network?lock=4','https://loremflickr.com/800/450/digital,technology,dark,future,network?lock=5','https://loremflickr.com/800/450/digital,technology,dark,future,network?lock=6','https://loremflickr.com/800/450/digital,technology,dark,future,network?lock=7'],
  },
];

export const featuredEpisode = episodes[1]; // Singularity or Bust leads
