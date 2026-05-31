import React from 'react';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, episodes, featuredEpisode, topics } from '../data/podcastData';
import ChatInstanceWidget from '../components/ChatInstanceWidget';
import { CHATINSTANCE_WS_URL, WAVE_AGENT_ID, WAVE_CHIPS, WAVE_PERSONA, WAVE_THEME } from '../config';

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.brand}>WaveForm Podcasts</Text>
        <Text style={styles.subtitle}>Sharp conversations for founders, builders, and operators creating what's next.</Text>

        <Pressable style={styles.heroCard} onPress={() => navigation.navigate('Player', { episode: featuredEpisode, episodeId: featuredEpisode.id })}>
          <Image source={{ uri: featuredEpisode.image }} style={styles.heroImage} />
          <View style={styles.heroBody}>
            <Text style={styles.heroEyebrow}>Featured episode</Text>
            <Text style={styles.heroTitle}>{featuredEpisode.title}</Text>
            <Text style={styles.heroMeta}>{featuredEpisode.host} • {featuredEpisode.duration} • {featuredEpisode.plays} plays</Text>
            <View style={styles.playButton}>
              <Text style={styles.playButtonText}>▶ Play now</Text>
            </View>
          </View>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Trending topics</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topicRow}>
          {topics.map((topic) => (
            <View key={topic} style={styles.topicPill}>
              <Text style={styles.topicText}>{topic}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Fresh episodes</Text>
          <Pressable onPress={() => navigation.navigate('Episodes')}>
            <Text style={styles.sectionAction}>See all</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.episodeRow}>
          {episodes.map((episode) => (
            <Pressable key={episode.id} style={styles.episodeCard} onPress={() => navigation.navigate('Player', { episode, episodeId: episode.id })}>
              <Image source={{ uri: episode.image }} style={styles.episodeImage} />
              <Text style={styles.episodeTitle} numberOfLines={2}>{episode.title}</Text>
              <Text style={styles.episodeMeta}>{episode.duration} • {episode.plays}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </ScrollView>

      {/* Wave — global ChatInstance FAB (instance 1: general podcast guide) */}
      <ChatInstanceWidget
        agentId={WAVE_AGENT_ID}
        wsUrl={CHATINSTANCE_WS_URL}
        mode="fab"
        persona={WAVE_PERSONA}
        theme={WAVE_THEME}
        suggestedChips={WAVE_CHIPS}
        fabOffset={{ bottom: 24, right: 20 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40, gap: 18 },
  brand: { color: colors.text, fontSize: 32, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 15, lineHeight: 24 },
  heroCard: { backgroundColor: colors.surface, borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  heroImage: { width: '100%', height: 240 },
  heroBody: { padding: 20 },
  heroEyebrow: { color: colors.accent, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  heroTitle: { color: colors.text, fontSize: 28, lineHeight: 34, fontWeight: '900', marginTop: 8 },
  heroMeta: { color: colors.textMuted, fontSize: 14, marginTop: 10 },
  playButton: { marginTop: 16, alignSelf: 'flex-start', backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999 },
  playButtonText: { color: colors.text, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  sectionAction: { color: colors.primary, fontWeight: '700' },
  topicRow: { gap: 10, paddingRight: 20 },
  topicPill: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 },
  topicText: { color: colors.text, fontWeight: '700' },
  episodeRow: { gap: 14, paddingRight: 20 },
  episodeCard: { width: 220, backgroundColor: colors.surface, borderRadius: 22, padding: 14, borderWidth: 1, borderColor: colors.border },
  episodeImage: { width: '100%', height: 140, borderRadius: 18 },
  episodeTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 12, minHeight: 42 },
  episodeMeta: { color: colors.textMuted, marginTop: 8, fontSize: 13 },
});
