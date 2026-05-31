import React from 'react';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, episodes } from '../data/podcastData';

export default function EpisodeListScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Every WaveForm episode in one queue-ready list.</Text>
        <Text style={styles.subtitle}>Jump into founder interviews, product deep dives, and trend breakdowns.</Text>

        {episodes.map((episode, index) => (
          <View key={episode.id} style={styles.card}>
            <Image source={{ uri: episode.image }} style={styles.image} />
            <View style={styles.body}>
              <Text style={styles.rank}>Episode {index + 1}</Text>
              <Text style={styles.cardTitle}>{episode.title}</Text>
              <Text style={styles.meta}>{episode.host} • {episode.duration} • {episode.plays} plays</Text>
              <Pressable style={styles.playButton} onPress={() => navigation.navigate('Player', { episode, episodeId: episode.id })}>
                <Text style={styles.playButtonText}>Play</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40, gap: 16 },
  title: { color: colors.text, fontSize: 30, lineHeight: 36, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 15, lineHeight: 24 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 24, overflow: 'hidden' },
  image: { width: '100%', height: 180 },
  body: { padding: 18 },
  rank: { color: colors.accent, fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  cardTitle: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 10 },
  meta: { color: colors.textMuted, fontSize: 14, marginTop: 8, lineHeight: 22 },
  playButton: { marginTop: 14, alignSelf: 'flex-start', backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999 },
  playButtonText: { color: colors.text, fontWeight: '800' },
});
