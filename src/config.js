export const APP_NAME = 'WaveForm';
export const APP_VERSION = '1.0.0';

// ChatInstance — Wave AI agent config
// To use a real agent: create one at https://admin.chatinstance.com,
// then set WAVE_AGENT_ID to the generated agent ID.
// While WAVE_AGENT_ID is 'demo', the widget connects but shows a placeholder.
export const CHATINSTANCE_WS_URL = 'wss://api.chatinstance.com/stream/ws';
export const CHATINSTANCE_API_URL = 'https://api.chatinstance.com';
export const WAVE_AGENT_ID = process.env.WAVE_AGENT_ID || 'wave-demo';

export const WAVE_PERSONA = {
  name: 'Wave',
  emoji: '🎙️',
  welcomeMessage:
    "Hey! I'm Wave 🎙️ — your AI podcast guide, powered by ChatInstance.\n\nI can summarise episodes, find shows by mood, surface transcript highlights, or show you how this works for your own app. What are you listening to?",
};

export const WAVE_THEME = {
  accentColor: '#A855F7',
  bg: '#09090B',
};

export const WAVE_CHIPS = [
  'Summarise this episode 📝',
  'Find me a podcast 🔍',
  "What's trending? 📈",
  'How does this work? 🤔',
];

export default {
  APP_NAME,
  APP_VERSION,
  CHATINSTANCE_WS_URL,
  CHATINSTANCE_API_URL,
  WAVE_AGENT_ID,
  WAVE_PERSONA,
  WAVE_THEME,
  WAVE_CHIPS,
};
