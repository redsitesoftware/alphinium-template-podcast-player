/**
 * StreamScreen — 1920×1080 broadcast view for YouTube Live / OBS.
 *
 * Designed to be captured as a browser source in OBS or via
 * server-side Playwright + FFmpeg → RTMP.
 *
 * URL: /stream?episode=0&autoplay=true
 *
 * Features:
 * - No navigation chrome, no Alphinium banner
 * - Full-viewport layout at exactly 1920×1080
 * - Auto-advances through all episodes sequentially (loops)
 * - Clean broadcast branding overlay
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated, Platform, StyleSheet, Text, View,
} from 'react-native';
import { AGENT_PERSONAS, colors, episodes } from '../data/podcastData';
import TRANSCRIPTS from '../data/transcripts';
import { useAudio } from '../hooks/useAudio';
import { useTranscriptImage } from '../hooks/useTranscriptImage';

const SPEAKER_COLORS = { Maya: '#9F67FF', Leo: '#00D4AA', Ava: '#F357FF' };

/* ─── Background image layer ────────────────────────────────────────── */
function BgImage({ src, opacity, transition }) {
  if (!src) return null;
  if (Platform.OS === 'web') {
    return (
      <img
        src={src}
        style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          objectFit: 'cover', opacity, transition: transition || 'none',
          display: 'block',
        }}
        alt=""
      />
    );
  }
  return null;
}

/* ─── Episode transition overlay ────────────────────────────────────── */
function EpisodeTransition({ visible, title }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: false }),
        Animated.delay(2200),
        Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: false }),
      ]).start();
    }
  }, [visible, title]);

  return (
    <Animated.View style={[styles.episodeTransition, { opacity }]} pointerEvents="none">
      <Text style={styles.transitionLabel}>NEXT EPISODE</Text>
      <Text style={styles.transitionTitle}>{title}</Text>
    </Animated.View>
  );
}

/* ─── Stream player for a single episode ────────────────────────────── */
function EpisodePlayer({ episode, onEnded, showTransition }) {
  const transcript = TRANSCRIPTS[episode.id] || [];
  const { playing, play, position, duration, ended } = useAudio(episode.audioUrl);

  // Auto-play on mount
  useEffect(() => { play(); }, []);

  // Notify parent when done
  useEffect(() => { if (ended) onEnded(); }, [ended]);

  const currentTime = position * (duration || 1);
  const { currentIdx, nextT } = React.useMemo(() => {
    let idx = 0;
    for (let i = 0; i < transcript.length; i++) {
      if (transcript[i].t <= currentTime) idx = i;
      else break;
    }
    const next = transcript[idx + 1];
    return { currentIdx: idx, nextT: next ? next.t : (duration || currentTime + 10) };
  }, [currentTime, transcript, duration]);

  const { currentUrl: bgCurrent, nextUrl: bgNext, transitioning } = useTranscriptImage(transcript, currentIdx);

  const line = transcript[currentIdx];
  const color = line ? (SPEAKER_COLORS[line.speaker] || colors.textMuted) : colors.textMuted;

  const lineStart = line?.t || 0;
  const lineDur   = Math.max(0.1, nextT - lineStart);
  const elapsed   = Math.max(0, currentTime - lineStart);
  const progress  = Math.min(1, elapsed / lineDur);
  const words     = line?.text?.split(' ') || [];
  const revealCount = Math.max(1, Math.min(Math.floor(progress * words.length) + 1, words.length));
  const activeWordIdx = Math.min(Math.floor(progress * words.length), words.length - 1);

  const totalProgress = duration > 0 ? position : 0;
  const mins = Math.floor(totalProgress * (duration || 0) / 60);
  const secs = Math.floor(totalProgress * (duration || 0) % 60);
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
  const durMins = Math.floor((duration || 0) / 60);
  const durSecs = Math.floor((duration || 0) % 60);
  const durStr = `${durMins}:${durSecs.toString().padStart(2, '0')}`;

  return (
    <View style={styles.playerWrap}>
      {/* Fullscreen background */}
      <BgImage src={bgNext} opacity={1} />
      <BgImage src={bgCurrent} opacity={transitioning ? 0 : 1} transition="opacity 1.2s ease-in-out" />
      <View style={styles.bgOverlay} />

      {/* Top-left — episode info */}
      <View style={styles.topLeft}>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
        <Text style={styles.showName}>WaveForm Podcasts</Text>
        <Text style={styles.epTitle} numberOfLines={2}>{episode.title}</Text>
      </View>

      {/* Top-right — ChatInstance badge */}
      <View style={styles.topRight}>
        <Text style={styles.poweredBy}>⚡ Powered by ChatInstance</Text>
      </View>

      {/* Center — transcript karaoke */}
      <View style={styles.captionArea}>
        {line && (
          <>
            <View style={[styles.speakerBadge, { backgroundColor: color + '33', borderColor: color }]}>
              <Text style={[styles.speakerName, { color }]}>{line.speaker}</Text>
            </View>
            <Text style={styles.captionText}>
              {words.slice(0, revealCount).map((word, i) => {
                const isActive = i === activeWordIdx;
                return isActive
                  ? <Text key={i} style={[styles.wordActive, { backgroundColor: color, color: '#0a0a0a' }]}> {word} </Text>
                  : <Text key={i} style={styles.wordRevealed}>{word} </Text>;
              })}
            </Text>
          </>
        )}
      </View>

      {/* Bottom — progress bar + agents */}
      <View style={styles.bottomBar}>
        <View style={styles.agentRow}>
          {Object.entries(AGENT_PERSONAS).map(([name, p]) => (
            <View key={name} style={styles.agentBadge}>
              <View style={[styles.agentDot, { backgroundColor: SPEAKER_COLORS[name] }]} />
              <Text style={styles.agentName}>{name}</Text>
            </View>
          ))}
        </View>
        <View style={styles.progressRow}>
          <Text style={styles.timeText}>{timeStr}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(totalProgress * 100)}%` }]} />
          </View>
          <Text style={styles.timeText}>{durStr}</Text>
        </View>
        <View style={styles.ctaBar}>
          <Text style={styles.ctaText}>💬 Interject live → waveform.app.alphinium.com</Text>
        </View>
      </View>

      {showTransition && <EpisodeTransition visible={showTransition} title={episode.title} />}
    </View>
  );
}

/* ─── StreamScreen — orchestrates episode sequence ───────────────────── */
export default function StreamScreen({ route }) {
  const startIdx   = parseInt(route?.params?.episode || '0', 10);
  const [epIdx, setEpIdx]         = useState(startIdx);
  const [showTransition, setShowTransition] = useState(false);
  const episode = episodes[epIdx % episodes.length];

  const handleEnded = useCallback(() => {
    setShowTransition(true);
    setTimeout(() => {
      setShowTransition(false);
      setEpIdx(i => (i + 1) % episodes.length);
    }, 3200);
  }, []);

  return (
    <View style={styles.root}>
      <EpisodePlayer
        key={epIdx}
        episode={episode}
        onEnded={handleEnded}
        showTransition={showTransition}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%', height: '100%',
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  playerWrap: {
    flex: 1, position: 'relative',
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,6,15,0.55)',
  },

  // Top left
  topLeft: {
    position: 'absolute', top: 48, left: 60, gap: 10,
  },
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FF0000', borderRadius: 6,
    paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start',
  },
  liveDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff',
  },
  liveText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  showName: { color: 'rgba(255,255,255,0.6)', fontSize: 18, fontWeight: '700' },
  epTitle:  { color: '#fff', fontSize: 28, fontWeight: '900', maxWidth: 600 },

  // Top right
  topRight: {
    position: 'absolute', top: 48, right: 60,
  },
  poweredBy: {
    color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 16,
    paddingVertical: 8, borderRadius: 8,
  },

  // Caption area
  captionArea: {
    position: 'absolute',
    bottom: 220, left: 60, right: 60,
    gap: 20,
  },
  speakerBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: 30, borderWidth: 2,
  },
  speakerName: { fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  captionText: {
    fontSize: 52, fontWeight: '900', lineHeight: 68,
    color: '#fff', flexWrap: 'wrap',
  },
  wordActive: {
    borderRadius: 6, paddingHorizontal: 4, fontSize: 52, fontWeight: '900',
  },
  wordRevealed: {
    fontSize: 52, fontWeight: '900', color: '#fff',
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(8,6,15,0.85)',
    paddingHorizontal: 60, paddingVertical: 20, gap: 12,
  },
  agentRow: { flexDirection: 'row', gap: 24 },
  agentBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  agentDot: { width: 10, height: 10, borderRadius: 5 },
  agentName: { color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: '700' },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  timeText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '700', width: 50 },
  progressTrack: {
    flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2,
  },
  progressFill: {
    height: 4, backgroundColor: colors.primary, borderRadius: 2,
  },

  ctaBar: { alignItems: 'center' },
  ctaText: {
    color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '600',
  },

  // Episode transition
  episodeTransition: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,6,15,0.92)',
    alignItems: 'center', justifyContent: 'center', gap: 16,
  },
  transitionLabel: {
    color: colors.primary, fontSize: 18, fontWeight: '900',
    letterSpacing: 4, textTransform: 'uppercase',
  },
  transitionTitle: {
    color: '#fff', fontSize: 48, fontWeight: '900', textAlign: 'center', maxWidth: 800,
  },
});
