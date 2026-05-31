/**
 * EndCard — shown when episode finishes playing.
 * "Built with ChatInstance" marketing CTA + next episode / back navigation.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, episodes } from '../data/podcastData';

export default function EndCard({ visible, episode, onReplay, onNext, onBrowse }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity,     { toValue: 1, duration: 600, useNativeDriver: false }),
        Animated.timing(translateY,  { toValue: 0, duration: 600, useNativeDriver: false }),
      ]).start();
    } else {
      opacity.setValue(0);
      translateY.setValue(40);
    }
  }, [visible]);

  if (!visible) return null;

  const nextEpisode = episodes.find((e, i) => {
    const cur = episodes.findIndex(ep => ep.id === episode?.id);
    return i === cur + 1;
  });

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <Animated.View style={[styles.card, { transform: [{ translateY }] }]}>

        {/* Episode complete badge */}
        <View style={styles.completeBadge}>
          <Text style={styles.completeIcon}>✓</Text>
          <Text style={styles.completeLabel}>Episode Complete</Text>
        </View>

        <Text style={styles.episodeTitle} numberOfLines={2}>{episode?.title}</Text>

        {/* ChatInstance CTA — the main marketing pitch */}
        <View style={styles.ctaCard}>
          <View style={styles.ctaHeader}>
            <Text style={styles.ctaEmoji}>⚡</Text>
            <Text style={styles.ctaBadge}>Built with ChatInstance</Text>
          </View>
          <Text style={styles.ctaHeadline}>
            Add AI agents like Maya, Leo & Ava to your own app
          </Text>
          <Text style={styles.ctaBody}>
            ChatInstance lets you embed multi-agent AI conversations, voice interject, and live TTS into any product — in minutes.
          </Text>
          <Pressable
            style={styles.ctaBtn}
            onPress={() => Linking.openURL('https://chatinstance.com')}
          >
            <Text style={styles.ctaBtnText}>Build your AI app → chatinstance.com</Text>
          </Pressable>
          <Pressable
            style={styles.ctaBtnSecondary}
            onPress={() => Linking.openURL('https://app.alphinium.com/signup')}
          >
            <Text style={styles.ctaBtnSecondaryText}>Deploy on Alphinium free →</Text>
          </Pressable>
        </View>

        {/* Navigation actions */}
        <View style={styles.actions}>
          {nextEpisode && (
            <Pressable style={styles.actionBtn} onPress={() => onNext?.(nextEpisode)}>
              <Text style={styles.actionBtnIcon}>▶</Text>
              <View>
                <Text style={styles.actionBtnLabel}>Next Episode</Text>
                <Text style={styles.actionBtnSub} numberOfLines={1}>{nextEpisode.title}</Text>
              </View>
            </Pressable>
          )}
          <Pressable style={[styles.actionBtn, styles.actionBtnGhost]} onPress={onReplay}>
            <Text style={styles.actionBtnIcon}>↺</Text>
            <Text style={styles.actionBtnLabel}>Replay</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.actionBtnGhost]} onPress={onBrowse}>
            <Text style={styles.actionBtnIcon}>☰</Text>
            <Text style={styles.actionBtnLabel}>All Episodes</Text>
          </Pressable>
        </View>

      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(8,6,15,0.96)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 100,
    paddingHorizontal: 20,
  },

  card: {
    width: '100%', maxWidth: 480,
    backgroundColor: colors.surface,
    borderRadius: 24, borderWidth: 1, borderColor: colors.border,
    padding: 24, gap: 16,
  },

  completeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#00D4AA22',
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: '#00D4AA',
  },
  completeIcon:  { color: '#00D4AA', fontSize: 14, fontWeight: '900' },
  completeLabel: { color: '#00D4AA', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },

  episodeTitle: {
    color: colors.text, fontSize: 20, fontWeight: '900', lineHeight: 26,
  },

  ctaCard: {
    backgroundColor: '#0D0820',
    borderRadius: 18, borderWidth: 1.5, borderColor: colors.primary + '66',
    padding: 18, gap: 10,
  },
  ctaHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ctaEmoji:  { fontSize: 18 },
  ctaBadge: {
    color: colors.primary, fontSize: 11, fontWeight: '900',
    letterSpacing: 1, textTransform: 'uppercase',
  },
  ctaHeadline: {
    color: colors.text, fontSize: 17, fontWeight: '900', lineHeight: 24,
  },
  ctaBody: {
    color: colors.textMuted, fontSize: 13, lineHeight: 20,
  },
  ctaBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18,
    alignItems: 'center', marginTop: 4,
  },
  ctaBtnText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  ctaBtnSecondary: {
    borderRadius: 14, paddingVertical: 10, paddingHorizontal: 18,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  ctaBtnSecondaryText: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },

  actions: { gap: 10, marginTop: 4 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.primary,
    borderRadius: 16, paddingVertical: 14, paddingHorizontal: 18,
  },
  actionBtnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1, borderColor: colors.border,
  },
  actionBtnIcon:  { color: '#fff', fontSize: 18 },
  actionBtnLabel: { color: '#fff', fontSize: 14, fontWeight: '800' },
  actionBtnSub:   { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 },
});
