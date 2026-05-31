import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';

const PodcastContext = createContext(null);

const shows = {
 show1: {
 id: 'show1',
 emoji: '️',
 name: 'The Alphinium Show',
 host: 'Dan Sutherland',
 category: 'Tech',
 color: '#A855F7',
 subscribers: '12.4K',
 episodeCount: 87,
 description:
 'Building the future of app development. Behind the scenes of alphinium, plus interviews with indie developers.',
 },
 show2: {
 id: 'show2',
 emoji: '',
 name: 'Founder Stories',
 host: 'Sarah Mitchell',
 category: 'Business',
 color: '#F59E0B',
 subscribers: '89.2K',
 episodeCount: 234,
 description: 'Weekly founder deep dives on growth, fundraising, leadership, and surviving the messy middle.',
 },
 show3: {
 id: 'show3',
 emoji: '',
 name: 'Deep Work Daily',
 host: 'Marcus Chen',
 category: 'Productivity',
 color: '#6366F1',
 subscribers: '45.7K',
 episodeCount: 156,
 description: 'Focus rituals, mindful productivity systems, and practical routines for your best work days.',
 },
 show4: {
 id: 'show4',
 emoji: '',
 name: 'Tech For Good',
 host: 'Priya Kapoor',
 category: 'Tech',
 color: '#10B981',
 subscribers: '28.3K',
 episodeCount: 92,
 description: 'How technologists are building products that improve healthcare, climate resilience, and education.',
 },
 show5: {
 id: 'show5',
 emoji: '',
 name: 'Design Matters',
 host: 'James Whitfield',
 category: 'Design',
 color: '#EC4899',
 subscribers: '34.5K',
 episodeCount: 118,
 description: 'Bold conversations on interfaces, systems thinking, brand storytelling, and craft.',
 },
 show6: {
 id: 'show6',
 emoji: '',
 name: 'Run Your Best Life',
 host: 'Emma Torres',
 category: 'Health',
 color: '#22C55E',
 subscribers: '67.8K',
 episodeCount: 203,
 description: 'Performance, recovery, and mindset tips for runners balancing ambition with everyday life.',
 },
 show7: {
 id: 'show7',
 emoji: '',
 name: 'The Food Lab',
 host: 'Tony Romano',
 category: 'Food',
 color: '#EA580C',
 subscribers: '22.1K',
 episodeCount: 77,
 description: 'Chefs, food science, city guides, and delicious experiments from kitchens around the world.',
 },
 show8: {
 id: 'show8',
 emoji: '',
 name: 'Future of AI',
 host: 'Dr. Lisa Park',
 category: 'Tech',
 color: '#8B5CF6',
 subscribers: '156K',
 episodeCount: 65,
 description: 'A sharp, optimistic look at AI products, ethics, interfaces, and the next decade of software.',
 },
 show9: {
 id: 'show9',
 emoji: '',
 name: 'Startup Grind',
 host: 'Alex Rivera',
 category: 'Business',
 color: '#FBBF24',
 subscribers: '43.2K',
 episodeCount: 189,
 description: 'Weekly founder tactics, launch experiments, and operating lessons from modern startups.',
 },
 show10: {
 id: 'show10',
 emoji: '',
 name: 'Mindful Mornings',
 host: 'Sophia Reed',
 category: 'Wellness',
 color: '#34D399',
 subscribers: '91.3K',
 episodeCount: 310,
 description: 'Gentle habits, meditation prompts, and perspective resets to start your day with intention.',
 },
 show11: {
 id: 'show11',
 emoji: '',
 name: 'Indie Dev Diaries',
 host: 'Chris Nakamura',
 category: 'Tech',
 color: '#F43F5E',
 subscribers: '18.9K',
 episodeCount: 44,
 description: 'Ship logs, growth lessons, and honest retrospectives from indie game and app developers.',
 },
 show12: {
 id: 'show12',
 emoji: '',
 name: "The Investor's Edge",
 host: 'Robert Kim',
 category: 'Finance',
 color: '#0EA5E9',
 subscribers: '72.4K',
 episodeCount: 145,
 description: 'Macro views, portfolio frameworks, and actionable investing conversations for modern markets.',
 },
};

const episodesByShow = {
 show1: [
 {
 id: 'ep1-1',
 title: 'Building 15 Demo Apps in One Day',
 duration: '57:23',
 seconds: 3420,
 date: 'Today',
 desc:
 'We go behind the scenes of building a full suite of alphinium demo apps, with AI agent assistance and a fast-moving design workflow.',
 played: 36.5,
 },
 {
 id: 'ep1-2',
 title: "ChatInstance 2.0 — What's New",
 duration: '42:18',
 seconds: 2538,
 date: '3 days ago',
 desc: 'The new demo-mode agent personas, React Native SDK, and upcoming features that ship faster product experiences.',
 played: 0,
 },
 {
 id: 'ep1-3',
 title: 'alphinium-booking: The Full Story',
 duration: '38:45',
 seconds: 2325,
 date: '1 week ago',
 desc: 'How we designed the calendar booking system and what it means for business apps.',
 played: 100,
 },
 {
 id: 'ep1-4',
 title: 'From Idea to App in 2 Hours',
 duration: '51:30',
 seconds: 3090,
 date: '2 weeks ago',
 desc: 'A live session where we build a loyalty app from scratch using alphinium.',
 played: 0,
 },
 {
 id: 'ep1-5',
 title: 'The Future of AI Agents in Mobile',
 duration: '1:04:12',
 seconds: 3852,
 date: '3 weeks ago',
 desc: 'Deep dive into alphinium-ai voice agents and where they are headed across mobile workflows.',
 played: 75,
 },
 ],
 show2: [
 {
 id: 'ep2-1',
 title: 'How Great Founders Spend Their First $10k',
 duration: '48:12',
 seconds: 2892,
 date: '2 days ago',
 desc: 'Hiring, customer discovery, and the smartest ways to buy speed early on.',
 played: 0,
 },
 ],
 show3: [
 {
 id: 'ep3-1',
 title: 'Morning Focus Rituals That Actually Stick',
 duration: '29:08',
 seconds: 1748,
 date: 'Yesterday',
 desc: 'Tiny defaults that unlock deeper work without relying on motivation alone.',
 played: 0,
 },
 {
 id: 'ep3-2',
 title: 'Timeboxing Without Burning Out',
 duration: '34:56',
 seconds: 2096,
 date: '5 days ago',
 desc: 'A healthier way to structure intense days while protecting recovery and momentum.',
 played: 18,
 },
 {
 id: 'ep3-3',
 title: 'The Two-List System for Creative Work',
 duration: '26:41',
 seconds: 1601,
 date: '10 days ago',
 desc: 'Separate planning from execution and ship more with less mental drag.',
 played: 100,
 },
 ],
 show4: [
 {
 id: 'ep4-1',
 title: 'Climate Tech Interfaces People Trust',
 duration: '37:18',
 seconds: 2238,
 date: '4 days ago',
 desc: 'Why transparency and simple UX matter more than novelty in critical products.',
 played: 0,
 },
 ],
 show5: [
 {
 id: 'ep5-1',
 title: 'Design Systems for Tiny Teams',
 duration: '41:02',
 seconds: 2462,
 date: '6 days ago',
 desc: 'How lean teams create coherent products without heavyweight process.',
 played: 0,
 },
 ],
 show6: [
 {
 id: 'ep6-1',
 title: 'Fueling Long Runs Without Guesswork',
 duration: '31:40',
 seconds: 1900,
 date: 'Today',
 desc: 'Practical hydration, carbs, and race-day experiments that hold up in real life.',
 played: 0,
 },
 ],
 show7: [
 {
 id: 'ep7-1',
 title: 'What Pizza Dough Hydration Changes',
 duration: '27:44',
 seconds: 1664,
 date: '1 week ago',
 desc: 'Texture, rise, and the tiny tweaks that separate good pizza from great pizza.',
 played: 0,
 },
 ],
 show8: [
 {
 id: 'ep8-1',
 title: 'AI Co-Workers Are Here. Now What?',
 duration: '45:21',
 seconds: 2721,
 date: 'Today',
 desc: 'A tour through the practical interface patterns that make AI feel reliable and useful.',
 played: 0,
 },
 {
 id: 'ep8-2',
 title: 'The Best AI Product Demos of the Year',
 duration: '52:07',
 seconds: 3127,
 date: '4 days ago',
 desc: 'What the best launches got right about narrative, interaction, and delight.',
 played: 62,
 },
 {
 id: 'ep8-3',
 title: 'How Voice UX Changes Search',
 duration: '39:50',
 seconds: 2390,
 date: '9 days ago',
 desc: 'Why spoken interfaces need a different mental model than typed search.',
 played: 0,
 },
 ],
 show9: [
 {
 id: 'ep9-1',
 title: 'The Metrics Early Startups Misread',
 duration: '36:13',
 seconds: 2173,
 date: '3 days ago',
 desc: 'Vanity traps, retention reality, and which numbers deserve your attention.',
 played: 0,
 },
 ],
 show10: [
 {
 id: 'ep10-1',
 title: 'A 7-Minute Reset for Busy Days',
 duration: '12:04',
 seconds: 724,
 date: 'Today',
 desc: 'A short guided reset to regain calm and focus in the middle of the day.',
 played: 0,
 },
 ],
 show11: [
 {
 id: 'ep11-1',
 title: 'Shipping Your Steam Page Before the Trailer',
 duration: '33:02',
 seconds: 1982,
 date: '1 week ago',
 desc: 'A tactical breakdown of wishlists, positioning, and launch timing.',
 played: 0,
 },
 ],
 show12: [
 {
 id: 'ep12-1',
 title: 'Reading the Market Without Panic',
 duration: '43:38',
 seconds: 2618,
 date: '2 days ago',
 desc: 'Simple frameworks for keeping conviction when volatility spikes.',
 played: 0,
 },
 ],
};

const categories = ['Tech', 'Business', 'Health', 'Design', 'Wellness', 'Food', 'Finance'];

const initialState = {
 phase: 'home',
 selectedShow: null,
 selectedEpisode: null,
 isPlaying: false,
 playbackPosition: 1247,
 playbackDuration: 3420,
 playbackSpeed: 1.0,
 volume: 0.8,
 queue: ['ep1-1', 'ep3-2'],
 subscribed: ['show1', 'show3'],
 searchQuery: '',
 nowPlayingShowId: 'show1',
 nowPlayingEpisodeId: 'ep1-1',
};

function findEpisode(episodeId) {
 const groups = Object.values(episodesByShow);
 for (let i = 0; i < groups.length; i += 1) {
 const episode = groups[i].find((item) => item.id === episodeId);
 if (episode) {
 return episode;
 }
 }
 return episodesByShow.show1[0];
}

function getShowIdForEpisode(episodeId) {
 return Object.keys(episodesByShow).find((showId) => episodesByShow[showId].some((episode) => episode.id === episodeId)) || 'show1';
}

function reducer(state, action) {
 switch (action.type) {
 case 'OPEN_SHOW':
 return {
 ...state,
 phase: 'show',
 selectedShow: action.showId,
 };
 case 'OPEN_PLAYER':
 return {
 ...state,
 phase: 'player',
 };
 case 'OPEN_SEARCH':
 return {
 ...state,
 phase: 'search',
 };
 case 'GO_HOME':
 return {
 ...state,
 phase: 'home',
 selectedShow: null,
 };
 case 'PLAY_EPISODE': {
 const episode = findEpisode(action.episodeId);
 return {
 ...state,
 phase: action.openPlayer ? 'player' : state.phase,
 selectedShow: action.showId,
 selectedEpisode: action.episodeId,
 nowPlayingShowId: action.showId,
 nowPlayingEpisodeId: action.episodeId,
 isPlaying: true,
 playbackPosition: action.resumeFromPlayed && episode.played > 0 ? Math.floor((episode.seconds * episode.played) / 100) : 0,
 playbackDuration: episode.seconds,
 };
 }
 case 'TOGGLE_PLAY':
 return {
 ...state,
 isPlaying: !state.isPlaying,
 };
 case 'SEEK_RELATIVE': {
 const nextPosition = Math.min(Math.max(state.playbackPosition + action.delta, 0), state.playbackDuration);
 return {
 ...state,
 playbackPosition: nextPosition,
 };
 }
 case 'SET_SPEED':
 return {
 ...state,
 playbackSpeed: action.speed,
 };
 case 'CYCLE_SPEED': {
 const speeds = [1, 1.25, 1.5, 2];
 const index = speeds.indexOf(state.playbackSpeed);
 return {
 ...state,
 playbackSpeed: speeds[(index + 1) % speeds.length],
 };
 }
 case 'TOGGLE_SUBSCRIPTION':
 return {
 ...state,
 subscribed: state.subscribed.includes(action.showId)
 ? state.subscribed.filter((showId) => showId !== action.showId)
 : [...state.subscribed, action.showId],
 };
 case 'ADD_TO_QUEUE':
 return state.queue.includes(action.episodeId)
 ? state
 : {
 ...state,
 queue: [...state.queue, action.episodeId],
 };
 case 'SET_SEARCH_QUERY':
 return {
 ...state,
 searchQuery: action.value,
 };
 default:
 return state;
 }
}

export function PodcastProvider({ children }) {
 const [state, dispatch] = useReducer(reducer, initialState);

 useEffect(() => {
 if (!state.isPlaying) {
 return undefined;
 }

 const tick = setInterval(() => {
 dispatch({ type: 'SEEK_RELATIVE', delta: Math.max(1, Math.round(state.playbackSpeed * 3)) });
 }, 1000);

 return () => clearInterval(tick);
 }, [state.isPlaying, state.playbackSpeed]);

 const derived = useMemo(() => {
 const currentShow = shows[state.nowPlayingShowId] || shows.show1;
 const currentEpisode = findEpisode(state.nowPlayingEpisodeId);
 const continueListening = Object.entries(episodesByShow)
 .flatMap(([showId, items]) =>
 items
 .filter((episode) => episode.played > 0 && episode.played < 100)
 .map((episode) => ({ ...episode, showId, show: shows[showId] }))
 )
 .sort((a, b) => b.played - a.played);
 const subscribedShows = state.subscribed.map((showId) => ({
 ...shows[showId],
 hasNewEpisode: episodesByShow[showId].some((episode) => episode.played === 0),
 latestEpisode: episodesByShow[showId][0],
 }));
 const trending = ['show8', 'show2', 'show10', 'show1', 'show9'].map((showId, index) => ({
 ...shows[showId],
 latestEpisode: episodesByShow[showId][0],
 playCount: ['142K', '120K', '113K', '98K', '87K'][index],
 }));
 const library = Object.values(shows).map((show) => ({
 ...show,
 latestEpisode: episodesByShow[show.id][0],
 episodes: episodesByShow[show.id],
 }));

 return {
 shows,
 episodesByShow,
 categories,
 currentShow,
 currentEpisode,
 continueListening,
 subscribedShows,
 trending,
 library,
 };
 }, [state]);

 const value = useMemo(() => ({ state, dispatch, ...derived }), [state, derived]);

 return <PodcastContext.Provider value={value}>{children}</PodcastContext.Provider>;
}

export function usePodcast() {
 const context = useContext(PodcastContext);
 if (!context) {
 throw new Error('usePodcast must be used inside PodcastProvider');
 }
 return context;
}
