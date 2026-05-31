/**
 * useTranscriptImage — drives background images from transcript text.
 *
 * Instead of rotating a fixed image set on a timer, this hook:
 * 1. Extracts meaningful keywords from the current transcript line
 * 2. Returns a LoremFlickr URL built from those keywords
 * 3. Crossfades when the transcript line changes
 *
 * This makes images genuinely content-relevant — what you see matches
 * what's being said.
 */
import { useEffect, useRef, useState } from 'react';

// Common words that don't help with image search
const STOPWORDS = new Set([
  'the','a','an','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','may','might','must','can',
  'to','of','in','for','on','with','at','by','from','as','into','through',
  'this','that','these','those','it','its','i','we','you','he','she','they',
  'what','which','who','when','where','why','how','and','but','or','if','not',
  'so','just','about','than','more','all','like','right','now','really',
  'because','actually','still','even','also','very','my','your','our','their',
  'there','then','them','too','one','two','three','get','got','going','going',
  'said','say','says','mean','means','think','know','want','need','look','come',
  'some','any','each','every','both','much','many','most','other','same','such',
  'only','over','after','before','between','never','always','already','here',
  'well','back','way','make','made','made','talking','talk','talk','something',
  'everything','nothing','anyone','everyone','someone','thing','things','bit',
  'kind','sort','part','point','whole','case','fact','idea','time','year','day',
  'people','world','life','work','place','group','problem','number','hand',
  'long','high','large','small','next','last','early','young','important',
  'public','private','real','best','free','able','different','right','than',
  'used','good','new','old','big','great','little','own','first','second',
]);

// Map tech/abstract terms to more visual/searchable keywords
const CONCEPT_MAP = {
  'ai':             'technology,robot,circuit',
  'artificial':     'technology,computer,science',
  'intelligence':   'brain,mind,technology',
  'machine':        'robot,machine,factory',
  'learning':       'education,study,brain',
  'neural':         'brain,network,science',
  'algorithm':      'code,computer,data',
  'data':           'server,network,technology',
  'model':          'technology,science,computer',
  'gpt':            'computer,technology,text',
  'singularity':    'universe,space,explosion',
  'exponential':    'graph,growth,science',
  'consciousness':  'mind,meditation,brain',
  'startup':        'office,entrepreneur,success',
  'founder':        'office,entrepreneur,leadership',
  'venture':        'finance,investment,business',
  'capital':        'finance,money,investment',
  'funding':        'money,investment,finance',
  'interview':      'office,business,meeting',
  'hiring':         'office,handshake,business',
  'resume':         'paper,document,office',
  'voice':          'microphone,sound,audio',
  'audio':          'microphone,studio,sound',
  'podcast':        'microphone,headphones,studio',
  'remote':         'laptop,home,coffee',
  'distributed':    'world,network,connection',
  'coding':         'code,computer,developer',
  'software':       'code,laptop,developer',
  'developer':      'code,computer,laptop',
  'mobile':         'smartphone,app,technology',
  'ethics':         'balance,justice,philosophy',
  'alignment':      'target,balance,precision',
  'safety':         'shield,protection,security',
  'privacy':        'lock,security,protection',
  'regulation':     'government,law,policy',
  'democratize':    'people,community,freedom',
  'disruption':     'lightning,change,innovation',
  'innovation':     'lightbulb,creativity,technology',
  'future':         'city,technology,futuristic',
  'prediction':     'crystal,future,stars',
  'kurzweil':       'technology,future,science',
  'agi':            'robot,brain,artificial+intelligence',
  'gpt-2':          'computer,text,technology',
  'gpt-4':          'computer,technology,brain',
  'llm':            'computer,language,technology',
};

// Generic tech fallbacks for when keyword extraction finds nothing
const TECH_FALLBACKS = [
  'city', 'technology', 'office', 'science',
  'computer', 'architecture', 'business', 'network', 'space', 'nature',
];

function extractKeywords(text) {
  if (!text) return TECH_FALLBACKS[0];

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOPWORDS.has(w));

  // Collect all concept-mapped keywords (not just first hit)
  const mapped = words
    .flatMap(w => CONCEPT_MAP[w] ? [CONCEPT_MAP[w]] : [])
    .filter(Boolean);

  if (mapped.length > 0) return mapped[0];

  // Fall back to raw words (top 3, joined)
  const raw = words.slice(0, 3).join(',');
  if (raw) return raw;

  // Last resort: deterministic tech fallback (Picsum handles any seed)
  return TECH_FALLBACKS[Math.abs(text.charCodeAt(0) || 0) % TECH_FALLBACKS.length];
}

function lineToImageUrl(text, seed) {
  const keywords = extractKeywords(text);
  // Use Picsum Photos — curated photography, deterministic by seed, zero cats/fallback junk
  // Seed = first keyword + line index for variety across lines even with same topic
  const picsumSeed = encodeURIComponent(keywords.split(',')[0]) + seed;
  return `https://picsum.photos/seed/${picsumSeed}/800/450`;
}

/**
 * @param {Array} transcript  - array of { t, speaker, text }
 * @param {number} lineIdx    - current active line index
 */
export function useTranscriptImage(transcript, lineIdx) {
  const [shownIdx, setShownIdx] = useState(lineIdx);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (lineIdx === shownIdx) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    // Don't transition too fast (debounce rapid line changes)
    timerRef.current = setTimeout(() => {
      setTransitioning(true);
      timerRef.current = setTimeout(() => {
        setShownIdx(lineIdx);
        setTransitioning(false);
      }, 900);
    }, 200);

    return () => clearTimeout(timerRef.current);
  }, [lineIdx]);

  const line     = transcript[Math.max(0, shownIdx)];
  const nextLine = transitioning
    ? transcript[lineIdx]               // fading IN to new line's image
    : transcript[lineIdx + 1];         // preloading next line's image

  return {
    currentUrl:   line     ? lineToImageUrl(line.text,     shownIdx)  : null,
    nextUrl:      nextLine ? lineToImageUrl(nextLine.text, lineIdx + 1) : null,
    transitioning,
  };
}
