import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../data/podcastData';
import { useTranscriptImage } from '../hooks/useTranscriptImage';

const SPEEDS = [0.75, 1, 1.5, 2];
const SPEED_LABELS = { 0.75: '0.75×', 1: '1×', 1.5: '1.5×', 2: '2×' };

const SPEAKER_COLORS = {
  Maya: '#9F67FF',
  Leo:  '#00D4AA',
  Ava:  '#F357FF',
};

/**
 * Background layer for web: raw <img> tag + CSS transition.
 * React Native Web's StyleSheet strips CSS-only props (backgroundImage, etc.)
 * so we must use raw HTML on web for background images.
 */
function BgImage({ src, opacity, transition }) {
  if (!src) return null;
  if (Platform.OS === 'web') {
    return (
      <img
        src={src}
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          opacity,
          transition: transition || 'none',
          borderRadius: 20,
          display: 'block',
        }}
        alt=""
      />
    );
  }
  return (
    <Image
      source={{ uri: src }}
      style={[StyleSheet.absoluteFillObject, { opacity }]}
      resizeMode="cover"
    />
  );
}

export default function TranscriptView({
  transcript, position, duration, images = [],
  onPress, onInterject, playing,
  skip, seek, speed, setPlaybackSpeed,
  positionFormatted, durationFormatted,
  episode,
}) {
  const currentTime = position * (duration || 1);

  const { currentIdx, nextT } = useMemo(() => {
    let idx = 0;
    for (let i = 0; i < transcript.length; i++) {
      if (transcript[i].t <= currentTime) idx = i;
      else break;
    }
    const next = transcript[idx + 1];
    return { currentIdx: idx, nextT: next ? next.t : (duration || currentTime + 10) };
  }, [currentTime, transcript, duration]);

  // Transcript-driven images — must be before early return (Rules of Hooks)
  const { currentUrl: currentImg, nextUrl: nextImg, transitioning } = useTranscriptImage(transcript, currentIdx);

  // Fullscreen toggle (web only)
  const cardRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = (e) => {
    e?.stopPropagation?.();
    if (Platform.OS !== 'web') return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      cardRef.current?.requestFullscreen?.();
    }
  };

  // Controls visibility: show on hover entry, auto-hide after 5s of mouse stillness
  const [showControls, setShowControls] = useState(false);
  const hideTimerRef = useRef(null);

  const resetHideTimer = () => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 5000);
  };

  const handleMouseMove = () => resetHideTimer();

  const handleHoverIn = () => resetHideTimer();

  const handleHoverOut = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setShowControls(false);
  };

  useEffect(() => () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); }, []);

  const handlePress = () => {
    if (onPress) onPress();
    resetHideTimer();
  };

  const line = transcript[currentIdx];
  if (!line) return null;

  const color = SPEAKER_COLORS[line.speaker] || colors.textMuted;

  // Breathing animation for the Interject button
  const breathAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, { toValue: 1.07, duration: 1600, useNativeDriver: false }),
        Animated.timing(breathAnim, { toValue: 1.0,  duration: 1600, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [breathAnim]);

  const [interjectHovered, setInterjectHovered] = useState(false);
  const lineStart     = line.t;
  const lineEnd       = nextT;
  const lineDur       = Math.max(0.1, lineEnd - lineStart);
  const elapsed       = Math.max(0, currentTime - lineStart);
  const progress      = Math.min(1, elapsed / lineDur);
  const words         = line.text.split(' ');
  const totalWords    = words.length;
  const activeWordIdx = Math.min(Math.floor(progress * totalWords), totalWords - 1);
  const revealCount   = Math.max(1, activeWordIdx + 1);

  return (
    <View style={styles.wrapper}>
      {/* Header — hidden in fullscreen (we show it inside the card instead) */}
      {!isFullscreen && (
        <View style={styles.header}>
          <Text style={styles.headerLabel}>◉ LIVE</Text>
          {Object.entries(SPEAKER_COLORS).map(([name, c]) => (
            <View key={name} style={styles.legend}>
              <View style={[styles.dot, { backgroundColor: c }]} />
              <Text style={styles.legendText}>{name}</Text>
            </View>
          ))}
          {/* Interject button — right-aligned, breathing */}
          {onInterject && (
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Animated.View style={{ transform: [{ scale: breathAnim }] }}>
                <Pressable
                  onPress={() => {
                    if (Platform.OS === 'web' && document.fullscreenElement) {
                      document.exitFullscreen().then(() => setTimeout(onInterject, 80));
                    } else {
                      onInterject();
                    }
                  }}
                  onHoverIn={() => setInterjectHovered(true)}
                  onHoverOut={() => setInterjectHovered(false)}
                  style={[styles.interjectBtn, interjectHovered && styles.interjectBtnHover]}
                  hitSlop={8}
                >
                  <Text style={styles.interjectBtnIcon}>🎙️</Text>
                  <Text style={[styles.interjectBtnLabel, interjectHovered && styles.interjectBtnLabelHover]}>
                    Interject
                  </Text>
                </Pressable>
              </Animated.View>
            </View>
          )}
        </View>
      )}

      <Pressable
        ref={cardRef}
        onPress={handlePress}
        style={styles.captionCard}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        onMouseMove={Platform.OS === 'web' ? handleMouseMove : undefined}
      >

        {/* Next image — always rendered/loaded, sits behind */}
        <BgImage src={nextImg} opacity={1} />

        {/* Current image — fades out during transition */}
        <BgImage
          src={currentImg}
          opacity={transitioning ? 0 : 1}
          transition="opacity 0.9s ease-in-out"
        />

        {/* Dark overlay */}
        <View style={styles.bgOverlay} />

        {/* Fullscreen: episode info — top-left */}
        {isFullscreen && episode && (
          <View style={styles.fsEpisodeInfo}>
            {episode.image && (
              <Image source={{ uri: episode.image }} style={{ width: 56, height: 56, borderRadius: 10 }} resizeMode="cover" />
            )}
            <View style={{ gap: 3 }}>
              <Text style={styles.fsEpisodeTitle} numberOfLines={2}>{episode.title}</Text>
              <Text style={styles.fsEpisodeHost}>{episode.host}</Text>
            </View>
          </View>
        )}

        {/* Fullscreen: LIVE badge + agent legend + Interject — top-right, stacked */}
        {isFullscreen && (
          <View style={styles.fsLiveBar}>
            <View style={styles.fsLiveRow}>
              <Text style={styles.headerLabel}>◉ LIVE</Text>
              {Object.entries(SPEAKER_COLORS).map(([name, c]) => (
                <View key={name} style={styles.legend}>
                  <View style={[styles.dot, { backgroundColor: c }]} />
                  <Text style={[styles.legendText, { fontSize: 13 }]}>{name}</Text>
                </View>
              ))}
            </View>
            {onInterject && (
              <Animated.View style={{ transform: [{ scale: breathAnim }], marginTop: 10 }}>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation?.();
                    if (Platform.OS === 'web' && document.fullscreenElement) {
                      document.exitFullscreen().then(() => setTimeout(onInterject, 80));
                    } else {
                      onInterject();
                    }
                  }}
                  onHoverIn={() => setInterjectHovered(true)}
                  onHoverOut={() => setInterjectHovered(false)}
                  style={[styles.interjectBtn, interjectHovered && styles.interjectBtnHover]}
                  hitSlop={8}
                >
                  <Text style={styles.interjectBtnIcon}>🎙️</Text>
                  <Text style={[styles.interjectBtnLabel, interjectHovered && styles.interjectBtnLabelHover]}>
                    Interject
                  </Text>
                </Pressable>
              </Animated.View>
            )}
          </View>
        )}

        {/* Controls hover overlay — fades in on hover, auto-hides after 5s stillness */}
        <View
          style={[
            styles.controlsOverlay,
            { opacity: showControls ? 1 : 0, backgroundColor: showControls ? 'rgba(0,0,0,0.45)' : 'transparent' },
            Platform.OS === 'web' && { transition: 'opacity 0.4s ease, background-color 0.4s ease', pointerEvents: showControls ? 'auto' : 'none' },
          ]}
        >
          {/* Play/pause + skip row */}
          <View style={styles.controlsRow}>
            <Pressable onPress={(e) => { e.stopPropagation?.(); skip(-30); resetHideTimer(); }} style={styles.skipBtn} hitSlop={8}>
              <Text style={styles.skipIcon}>↺</Text>
              <Text style={styles.skipLabel}>30</Text>
            </Pressable>
            <Pressable onPress={(e) => { e.stopPropagation?.(); skip(-15); resetHideTimer(); }} style={styles.skipBtn} hitSlop={8}>
              <Text style={styles.skipIcon}>↺</Text>
              <Text style={styles.skipLabel}>15</Text>
            </Pressable>
            <Pressable
              onPress={(e) => { e.stopPropagation?.(); if (onPress) onPress(); resetHideTimer(); }}
              style={styles.playCircle}
              hitSlop={8}
            >
              <Text style={styles.playCircleText}>{playing ? '⏸' : '▶'}</Text>
            </Pressable>
            <Pressable onPress={(e) => { e.stopPropagation?.(); skip(15); resetHideTimer(); }} style={styles.skipBtn} hitSlop={8}>
              <Text style={styles.skipIcon}>↻</Text>
              <Text style={styles.skipLabel}>15</Text>
            </Pressable>
            <Pressable onPress={(e) => { e.stopPropagation?.(); skip(30); resetHideTimer(); }} style={styles.skipBtn} hitSlop={8}>
              <Text style={styles.skipIcon}>↻</Text>
              <Text style={styles.skipLabel}>30</Text>
            </Pressable>
          </View>
          {/* Speed pills */}
          <View style={styles.speedRow}>
            {SPEEDS.map((s) => (
              <Pressable
                key={s}
                style={[styles.speedPill, speed === s && styles.speedPillActive]}
                onPress={(e) => { e.stopPropagation?.(); setPlaybackSpeed(s); resetHideTimer(); }}
              >
                <Text style={[styles.speedText, speed === s && styles.speedTextActive]}>
                  {SPEED_LABELS[s]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={[styles.speakerBadge, { backgroundColor: color + '44', borderColor: color }]}>
            <Text style={[styles.speakerText, { color }]}>{line.speaker}</Text>
          </View>

          <View style={styles.textArea}>
            <Text style={styles.captionText}>
              {words.slice(0, revealCount).map((word, i) => {
                const isActive = i === activeWordIdx;
                if (isActive) {
                  return (
                    <Text key={i}>
                      <Text style={[styles.wordActive, { backgroundColor: color, color: '#0a0a0a' }]}>
                        {' '}{word}{' '}
                      </Text>
                    </Text>
                  );
                }
                return <Text key={i} style={styles.wordRevealed}>{word} </Text>;
              })}
            </Text>
          </View>

          <View style={styles.lineProgress}>
            <View style={[styles.lineProgressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
        </View>

        {/* Time scrubber — always visible at bottom of card */}
        <Pressable
          style={styles.scrubberArea}
          onPress={(e) => {
            e.stopPropagation?.();
            if (!seek) return;
            const x = e.nativeEvent?.locationX ?? 0;
            const w = e.nativeEvent?.target?.offsetWidth || 300;
            seek(Math.min(1, Math.max(0, x / w)));
          }}
        >
          <View style={styles.scrubberTrack}>
            <View style={[styles.scrubberFill, { width: `${Math.round(position * 100)}%` }]} />
            <View style={[styles.scrubberThumb, { left: `${Math.round(position * 100)}%` }]} />
          </View>
          <View style={styles.scrubberMeta}>
            <Text style={styles.scrubberTime}>{positionFormatted}</Text>
            <Text style={styles.scrubberTime}>{durationFormatted}</Text>
          </View>
        </Pressable>

        {/* Fullscreen button — bottom-left (web only) */}
        {Platform.OS === 'web' && (
          <Pressable
            onPress={toggleFullscreen}
            style={styles.fullscreenBtn}
            hitSlop={10}
          >
            <Text style={styles.fullscreenIcon}>{isFullscreen ? '⊡' : '⛶'}</Text>
          </Pressable>
        )}

        {/* Powered by ChatInstance watermark — bottom-right */}
        <View style={styles.watermark} pointerEvents="none">
          <Image
            source={{ uri: 'https://chatinstance.com/apple-touch-icon.png' }}
            style={styles.watermarkLogo}
          />
          <Text style={styles.watermarkText}>Powered by ChatInstance</Text>
        </View>

        {/* Tap to play — shown when paused at start (e.g. after page refresh) */}
        {!playing && position === 0 && (
          <View style={styles.tapToPlay} pointerEvents="none">
            <Text style={styles.tapToPlayIcon}>▶</Text>
            <Text style={styles.tapToPlayText}>Tap to play</Text>
          </View>
        )}
      </Pressable>

      {transcript[currentIdx + 1] && (
        <View style={styles.nextUp}>
          <Text style={styles.nextUpLabel}>Next up: </Text>
          <View style={[styles.dot, {
            backgroundColor: SPEAKER_COLORS[transcript[currentIdx + 1].speaker] || colors.textMuted,
            width: 10, height: 10, borderRadius: 5,
          }]} />
          <Text style={styles.nextUpName}>{transcript[currentIdx + 1].speaker}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 12 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: colors.surface, gap: 12,
  },
  headerLabel: { color: '#FF4444', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginRight: 4 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: colors.textMuted, fontSize: 11 },

  captionCard: {
    flex: 1, margin: 16,
    backgroundColor: '#0D0A1A',
    borderRadius: 20,
    borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
    position: 'relative',
  },

  bgOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(8,5,20,0.65)',
  },

  // Fullscreen overlays
  fsEpisodeInfo: {
    position: 'absolute', top: 20, left: 20,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 14, padding: 10,
    zIndex: 30,
    maxWidth: '40%',
  },
  fsEpisodeTitle: {
    color: '#fff', fontSize: 15, fontWeight: '800', lineHeight: 20,
  },
  fsEpisodeHost: {
    color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2,
  },
  fsLiveBar: {
    position: 'absolute', top: 20, right: 20,
    flexDirection: 'column', alignItems: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    zIndex: 30,
  },
  fsLiveRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    gap: 16,
  },
  controlsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  skipBtn: {
    alignItems: 'center', justifyContent: 'center',
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  skipIcon: { color: '#fff', fontSize: 22, lineHeight: 24 },
  skipLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: -2 },
  playCircle: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary, shadowOpacity: 0.5, shadowRadius: 12,
  },
  playCircleText: { fontSize: 26, color: '#fff' },
  speedRow: { flexDirection: 'row', gap: 8 },
  speedPill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    minWidth: 48, alignItems: 'center',
  },
  speedPillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  speedText: { color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontSize: 12 },
  speedTextActive: { color: '#fff' },

  scrubberArea: {
    position: 'absolute', bottom: 12, left: 16, right: 16,
    zIndex: 20,
  },
  scrubberTrack: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999,
    overflow: 'visible',
  },
  scrubberFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 999 },
  scrubberThumb: {
    position: 'absolute', top: -7,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.primary, marginLeft: -10,
    shadowColor: colors.primary, shadowOpacity: 0.6, shadowRadius: 6,
  },
  scrubberMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  scrubberTime: { color: 'rgba(255,255,255,0.65)', fontSize: 11 },

  content: {
    padding: 24, justifyContent: 'center', gap: 16, flex: 1,
    // Ensure content is above bg images and overlay
    zIndex: 5,
    position: 'relative',
  },

  speakerBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5,
  },
  speakerText: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },

  captionText: { fontSize: 22, lineHeight: 36, fontWeight: '600', letterSpacing: 0.2 },
  textArea: { minHeight: 108, justifyContent: 'flex-start', overflow: 'hidden' },
  wordRevealed: { color: colors.text, fontSize: 22, lineHeight: 36, fontWeight: '600' },
  wordActive: {
    fontSize: 23, lineHeight: 36, fontWeight: '900', borderRadius: 4,
    paddingHorizontal: 4,
  },

  lineProgress: { height: 3, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' },
  lineProgressFill: { height: 3, backgroundColor: colors.primary, borderRadius: 2 },

  // Interject button — lives in header, breathing + hover
  interjectBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: 'rgba(42,31,74,0.95)',
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 24, borderWidth: 1.5, borderColor: colors.primary,
  },
  interjectBtnHover: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.7,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  interjectBtnIcon:  { fontSize: 18 },
  interjectBtnLabel: { color: colors.primary, fontSize: 14, fontWeight: '900', letterSpacing: 0.3 },
  interjectBtnLabelHover: { color: '#fff' },

  fullscreenBtn: {
    position: 'absolute', bottom: 16, left: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    width: 36, height: 36, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 25,
  },
  fullscreenIcon: { fontSize: 18, color: 'rgba(255,255,255,0.85)' },

  watermark: {
    position: 'absolute', bottom: 46, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    opacity: 0.55,
    zIndex: 15,
  },
  watermarkLogo: { width: 18, height: 18, borderRadius: 4 },
  watermarkText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },

  tapToPlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', gap: 8,
    zIndex: 20,
  },
  tapToPlayIcon: { fontSize: 48, color: 'rgba(255,255,255,0.85)' },
  tapToPlayText: { color: 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: '700', letterSpacing: 1 },

  nextUp: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingBottom: 12,
  },
  nextUpLabel: { color: colors.textMuted, fontSize: 12 },
  nextUpName:  { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
});
