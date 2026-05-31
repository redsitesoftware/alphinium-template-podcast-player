import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { AGENT_PERSONAS, colors, episodes } from '../data/podcastData';
import TRANSCRIPTS from '../data/transcripts';
import EndCard from '../components/EndCard';
import InterjectPanel from '../components/InterjectPanel';
import { useAudio } from '../hooks/useAudio';
import TranscriptView from '../components/TranscriptView';

// Format seconds → "m:ss"
const fmt = (s) => {
  const secs = Math.max(0, Math.floor(s || 0));
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
};

export default function PlayerScreen({ route, navigation }) {
  // Support both deep-link (/player/e1 → episodeId) and in-app nav (episode object)
  const episode = useMemo(() => {
    if (route.params?.episode) return route.params.episode;
    if (route.params?.episodeId) return episodes.find(e => e.id === route.params.episodeId) || episodes[0];
    return episodes[0];
  }, [route.params]);

  const transcript = useMemo(() => TRANSCRIPTS[episode.id]?.lines || [], [episode.id]);

  const {
    playing, toggle, pause, play,
    position, duration, ended, positionFormatted, durationFormatted,
    seek, skip, speed, setPlaybackSpeed,
  } = useAudio(episode.audioUrl);

  // Auto-play when entering the player
  useEffect(() => {
    const timer = setTimeout(() => { play(); }, 400); // small delay lets audio element load
    return () => clearTimeout(timer);
  }, [episode.audioUrl]); // re-trigger if episode changes

  // Interject state
  const [interjectActive, setInterjectActive] = useState(false);
  const [pausedAtSeconds, setPausedAtSeconds] = useState(0);

  // Current transcript position — for passing recent lines to InterjectPanel
  const currentTime = position * (duration || 1);
  const currentIdx  = useMemo(() => {
    let idx = 0;
    for (let i = 0; i < transcript.length; i++) {
      if (transcript[i].t <= currentTime) idx = i;
      else break;
    }
    return idx;
  }, [currentTime, transcript]);

  // Last 3 lines before interject point
  const recentLines = useMemo(
    () => transcript.slice(Math.max(0, currentIdx - 2), currentIdx + 1),
    [transcript, currentIdx]
  );

  // Agent list for this episode (from hosts array → AGENT_PERSONAS)
  const agents = useMemo(() =>
    (episode.hosts || ['Maya']).map(name => ({
      name,
      ...(AGENT_PERSONAS[name] || {}),
    })),
    [episode.hosts]
  );

  const handleInterject = useCallback(() => {
    const secs = position * (duration || 0);
    setPausedAtSeconds(secs);
    pause(); // pause audio
    setInterjectActive(true);
  }, [position, duration, pause]);

  const handleResume = useCallback(() => {
    setInterjectActive(false);
    play();
  }, [play]);

  const handleReplay = useCallback(() => { seek(0); play(); }, [seek, play]);
  const handleNextEpisode = useCallback((nextEp) => {
    navigation.replace('Player', { episode: nextEp });
  }, [navigation]);
  const handleBrowse = useCallback(() => {
    navigation.navigate('Episodes');
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Compact player header — always visible */}
      <View style={styles.playerBar}>
        <Image source={{ uri: episode.image }} style={styles.artwork} />
        <View style={styles.meta}>
          <Text style={styles.title} numberOfLines={2}>{episode.title}</Text>
          <Text style={styles.host}>{episode.host} · {episode.duration}</Text>
        </View>
      </View>

      {/* Live transcript — fills remaining space; controls now live inside hover overlay */}
      {transcript.length > 0 && (
        <TranscriptView
          transcript={transcript}
          position={position}
          duration={duration}
          images={episode.images || []}
          playing={playing}
          onPress={toggle}
          onInterject={handleInterject}
          skip={skip}
          seek={seek}
          speed={speed}
          setPlaybackSpeed={setPlaybackSpeed}
          positionFormatted={positionFormatted}
          durationFormatted={durationFormatted || episode.duration}
          episode={episode}
        />
      )}

      {/* Interject panel — slides up over everything */}
      <InterjectPanel
        visible={interjectActive}
        episode={episode}
        transcript={transcript}
        pausedAtSeconds={pausedAtSeconds}
        pausedAtFormatted={fmt(pausedAtSeconds)}
        recentLines={recentLines}
        agents={agents}
        onResume={handleResume}
      />

      {/* End card — shown when episode finishes */}
      <EndCard
        visible={ended}
        episode={episode}
        onReplay={handleReplay}
        onNext={handleNextEpisode}
        onBrowse={handleBrowse}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },

  playerBar: { flexDirection: 'row', padding: 16, gap: 14, alignItems: 'center' },
  artwork: { width: 72, height: 72, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  meta: { flex: 1 },
  title: { color: colors.text, fontSize: 17, fontWeight: '900', lineHeight: 22 },
  host: { color: colors.textMuted, fontSize: 13, marginTop: 5 },
});
