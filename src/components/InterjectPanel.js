/**
 * InterjectPanel — slide-up overlay for live conversation with podcast agents.
 * 
 * Flow:
 *  1. User taps Interject → panel slides up, mic starts automatically
 *  2. Web Speech API shows live transcription as user speaks
 *  3. When user stops → Groq Whisper gives final accurate transcript → auto-sends
 *  4. Agents respond in their own voices (TTS)
 *  5. User can also type (for YouTube chat simulation / non-voice users)
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated, Platform, Pressable, ScrollView, StyleSheet, Text,
  TextInput, View,
} from 'react-native';
import { useMic } from '../hooks/useMic';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { colors } from '../data/podcastData';

const INTERJECT_URL = 'https://api.chatinstance.com/api/v1/interject';
const TTS_URL       = 'https://api.chatinstance.com/api/v1/tts';

const SPEAKER_COLORS = {
  Maya: '#9F67FF',
  Leo:  '#00D4AA',
  Ava:  '#F357FF',
};

function MicButton({ micState, onPress }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (micState === 'recording') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.15, duration: 600, useNativeDriver: false }),
          Animated.timing(pulse, { toValue: 1,    duration: 600, useNativeDriver: false }),
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
    }
  }, [micState, pulse]);

  const label = {
    idle:       '🎙️ Speak',
    requesting: '⏳ Starting mic...',
    recording:  '⏹ Done speaking',
    processing: '💬 Processing...',
    done:       '🎙️ Speak again',
    error:      '⚠️ Try again',
  }[micState] || '🎙️ Speak';

  const isActive = micState === 'recording';

  return (
    <Animated.View style={{ transform: [{ scale: pulse }] }}>
      <Pressable
        style={[styles.micBtn, isActive && styles.micBtnActive]}
        onPress={onPress}
        disabled={micState === 'requesting' || micState === 'processing'}
      >
        <Text style={styles.micBtnText}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function InterjectPanel({
  visible,
  episode,
  transcript: episodeTranscript,
  pausedAtSeconds,
  pausedAtFormatted,
  recentLines,
  onResume,
}) {
  const slideY = useRef(new Animated.Value(600)).current;
  const [messages, setMessages]       = useState([]);
  const [agentBusy, setAgentBusy]     = useState(false);
  const [agentsDone, setAgentsDone]   = useState(false);
  const [textInput, setTextInput]     = useState('');
  const [inputMode, setInputMode]     = useState('voice'); // 'voice' | 'text'
  const scrollRef                     = useRef(null);
  const activeAudioRef                = useRef(null);
  const stopSpeechRef                 = useRef(null); // ref to break circular dep with handleSpeechFinal

  const { micState, transcript: whisperText, error: micError,
          startListening, stopListening, reset: resetMic } = useMic();

  // pendingText — holds what Web Speech recognized (shown until sent)
  const [pendingText, setPendingText] = useState('');

  // Auto-send when Web Speech detects end of utterance
  // Uses stopSpeechRef to avoid circular TDZ: handleSpeechFinal → stopSpeech → useSpeechRecognition(handleSpeechFinal)
  const handleSpeechFinal = useCallback((text) => {
    setPendingText(text);
    stopListening();           // stop Groq recording — we have the text
    stopSpeechRef.current?.(); // stop Web Speech so it can't pick up TTS audio
  }, [stopListening]);

  // Web Speech API for live transcription display + auto-send on silence
  const { liveText, supported: speechSupported, start: startSpeech, stop: stopSpeech } =
    useSpeechRecognition({ onFinal: handleSpeechFinal });

  // Keep ref in sync each render
  stopSpeechRef.current = stopSpeech;

  // Slide up/down + auto-start mic
  useEffect(() => {
    Animated.spring(slideY, {
      toValue: visible ? 0 : 600,
      useNativeDriver: false,
      tension: 80, friction: 12,
    }).start();

    if (visible) {
      // Auto-start mic immediately
      setTimeout(() => {
        if (inputMode === 'voice') {
          resetMic();
          startListening();
          if (Platform.OS === 'web' && speechSupported) startSpeech();
        }
      }, 400); // small delay for panel animation
    } else {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      stopSpeech();
      setMessages([]);
      setAgentsDone(false);
      setTextInput('');
      setPendingText('');
      resetMic();
    }
  }, [visible]);

  // Auto-scroll messages
  useEffect(() => {
    if (messages.length && scrollRef.current) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  // When Groq Whisper STT done → use its text ONLY if Web Speech didn't already send
  useEffect(() => {
    if (micState === 'done' && whisperText && !pendingText && !agentBusy) {
      stopSpeech();
      handleSend(whisperText);
    }
  }, [micState, whisperText]);

  // When pendingText is set (Web Speech final) → auto-send after brief pause
  // giving user a chance to see their words and hit Send if they want to edit
  useEffect(() => {
    if (!pendingText) return;
    const t = setTimeout(() => {
      handleSend(pendingText);
      setPendingText('');
    }, 1200); // 1.2s preview before auto-send
    return () => clearTimeout(t);
  }, [pendingText]);

  const handleMicPress = useCallback(() => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }
    if (micState === 'recording') {
      stopListening();
      stopSpeech();
    } else if (micState === 'idle' || micState === 'done' || micState === 'error') {
      resetMic();
      setPendingText('');
      startListening();
      if (Platform.OS === 'web' && speechSupported) startSpeech();
    }
  }, [micState, startListening, stopListening, resetMic, startSpeech, stopSpeech, speechSupported]);

  const handlePendingSend = useCallback(() => {
    if (pendingText) {
      handleSend(pendingText);
      setPendingText('');
    }
  }, [pendingText]);

  const handleTextSend = useCallback(() => {
    const text = textInput.trim();
    if (!text) return;
    setTextInput('');
    handleSend(text);
  }, [textInput]);

  const handleSend = useCallback(async (text) => {
    if (!text?.trim() || agentBusy) return;

    // Stop mic input completely before agents respond — prevents TTS being picked up
    stopSpeech();
    stopListening();

    setAgentsDone(false);
    // Add user message to track
    setMessages(prev => [...prev, { role: 'user', text, id: Date.now() }]);
    setAgentBusy(true);

    try {
      const agents = (episode?.hosts || episode?.agents || ['Maya']).map(name => ({
        name,
        persona: {
          Maya: 'Tech journalist and AI skeptic. Sharp, asks for precise definitions, references AI history.',
          Leo:  'VC and startup operator. Focused on market implications, capital flows, and founder mindset.',
          Ava:  'AI founder who builds with agents daily. Pragmatic, experiential, slightly evangelical about what AI can do right now.',
        }[name] || '',
        voiceId: { Maya: 'XrExE9yKIg1WjnnlVkGX', Leo: 'IKne3meq5aSn9XLyUdCD', Ava: 'hpp4J3VqNfWAUOO0d1Us' }[name] || 'IKne3meq5aSn9XLyUdCD',
        color: SPEAKER_COLORS[name] || colors.primary,
      }));

      // Retry interject up to 3x on 429
      let res, lastErr;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          res = await fetch(INTERJECT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userText: text,
              episodeTitle: episode?.title || 'WaveForm Podcast',
              pausedAtFormatted,
              recentLines,
              agents,
            }),
          });
          if (res.status === 429) {
            let waitMs = 8000;
            try { const d = await res.clone().json(); waitMs = (d.retryAfter || 8) * 1000; } catch {}
            setMessages(prev => [...prev, { role: 'error', text: `Rate limited — retrying in ${Math.round(waitMs/1000)}s…`, id: Date.now() }]);
            await new Promise(r => setTimeout(r, waitMs));
            setMessages(prev => prev.filter(m => m.role !== 'error'));
            continue;
          }
          lastErr = null;
          break;
        } catch (e) { lastErr = e; break; }
      }

      if (lastErr) throw lastErr;
      if (!res.ok) throw new Error(`Interject API ${res.status}`);
      const data = await res.json();

      // Support both old { speaker, text } and new { replies: [...] } format
      const replies = data.replies || [{ speaker: data.speaker, text: data.text, voiceId: data.voiceId, color: data.color }];

      // Add all agent messages to conversation track immediately
      const baseId = Date.now();
      setMessages(prev => [
        ...prev,
        ...replies.map((r, i) => ({
          role: 'agent', speaker: r.speaker, text: r.text, color: r.color, id: baseId + i + 1,
        })),
      ]);

      // Play each agent's TTS sequentially
      for (const reply of replies) {
        await new Promise(async (resolve) => {
          try {
            const ttsRes = await fetch(TTS_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: reply.text, voice_id: reply.voiceId }),
            });
            if (ttsRes.ok) {
              const blob = await ttsRes.blob();
              const url  = URL.createObjectURL(blob);
              const audio = new window.Audio(url);
              activeAudioRef.current = audio;
              audio.onended = () => { activeAudioRef.current = null; URL.revokeObjectURL(url); resolve(); };
              audio.onerror = () => { activeAudioRef.current = null; resolve(); };
              audio.play().catch(resolve);
            } else {
              resolve();
            }
          } catch { resolve(); }
        });
        // If mic was tapped mid-sequence, stop playing further replies
        if (!activeAudioRef.current && micState === 'recording') break;
      }

    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'error', text: '⚠️ Connection issue — tap Speak to try again', id: Date.now() + 99,
      }]);
    } finally {
      setAgentBusy(false);
      setAgentsDone(true);
      resetMic();
    }
  }, [agentBusy, episode, pausedAtFormatted, recentLines, resetMic, stopSpeech, stopListening]);

  if (!visible && slideY._value >= 590) return null;

  const agentRoster = episode?.hosts || episode?.agents || ['Maya'];

  return (
    <Animated.View style={[styles.panel, { transform: [{ translateY: slideY }] }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onResume} style={styles.resumeBtn}>
          <Text style={styles.resumeBtnText}>▶ Resume at {pausedAtFormatted}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Interject</Text>
      </View>

      {/* Context — last lines before pause */}
      <View style={styles.contextCard}>
        <Text style={styles.contextLabel}>You paused here:</Text>
        {(recentLines || []).slice(-2).map((line, i) => (
          <Text key={i} style={[styles.contextLine, { color: SPEAKER_COLORS[line.speaker] || colors.textMuted }]}>
            <Text style={styles.contextSpeaker}>{line.speaker}: </Text>
            <Text style={styles.contextText}>"{line.text.slice(0, 80)}{line.text.length > 80 ? '...' : ''}"</Text>
          </Text>
        ))}
      </View>

      {/* Agent avatars */}
      <View style={styles.agentsRow}>
        {agentRoster.map(name => (
          <View key={name} style={styles.agentBadge}>
            <View style={[styles.agentDot, { backgroundColor: SPEAKER_COLORS[name] || colors.primary }]} />
            <Text style={styles.agentName}>{name}</Text>
          </View>
        ))}
        <Text style={styles.agentsLabel}>will all respond</Text>
      </View>

      {/* Conversation track */}
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 && (
          <Text style={styles.emptyHint}>
            Ask {agentRoster.join(' & ')} anything — all of them will weigh in...
          </Text>
        )}
        {messages.map(msg => (
          <View key={msg.id} style={[
            styles.bubble,
            msg.role === 'user'  ? styles.bubbleUser  :
            msg.role === 'agent' ? styles.bubbleAgent : styles.bubbleError,
          ]}>
            {msg.role === 'agent' && (
              <Text style={[styles.bubbleSpeaker, { color: msg.color || colors.primary }]}>
                {msg.speaker}
              </Text>
            )}
            <Text style={[
              styles.bubbleText,
              msg.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAgent,
            ]}>
              {msg.text}
            </Text>
          </View>
        ))}
        {agentBusy && (
          <View style={styles.thinkingBubble}>
            <Text style={styles.thinkingText}>● ● ●</Text>
          </View>
        )}
        {agentsDone && !agentBusy && (
          <Pressable onPress={onResume} style={styles.resumePrompt}>
            <Text style={styles.resumePromptText}>▶ Resume podcast at {pausedAtFormatted}</Text>
            <Text style={styles.resumePromptSub}>or tap the mic to keep talking</Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Mic input + text input */}
      <View style={styles.inputArea}>
        {/* Live speech transcription — shows words as user speaks, pending text before send */}
        {(liveText || pendingText || micError || (micState === 'processing')) && (
          <View style={styles.liveTranscriptBox}>
            {micState === 'processing' && (
              <Text style={styles.liveTranscriptProcessing}>💬 Transcribing...</Text>
            )}
            {liveText ? (
              <Text style={styles.liveTranscriptText}>
                <Text style={styles.liveTranscriptCursor}>▌ </Text>
                {liveText}
              </Text>
            ) : pendingText ? (
              <View style={styles.pendingRow}>
                <Text style={styles.pendingText} numberOfLines={3}>{pendingText}</Text>
                <Pressable style={styles.sendNowBtn} onPress={handlePendingSend}>
                  <Text style={styles.sendNowText}>Send now ↑</Text>
                </Pressable>
              </View>
            ) : micError ? (
              <Text style={styles.liveTranscriptError}>{micError}</Text>
            ) : null}
          </View>
        )}

        {/* Mode toggle */}
        <View style={styles.modeRow}>
          <Pressable
            style={[styles.modeTab, inputMode === 'voice' && styles.modeTabActive]}
            onPress={() => { setInputMode('voice'); setTextInput(''); }}
          >
            <Text style={[styles.modeTabText, inputMode === 'voice' && styles.modeTabTextActive]}>
              🎙️ Voice
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modeTab, inputMode === 'text' && styles.modeTabActive]}
            onPress={() => { setInputMode('text'); stopListening(); stopSpeech(); }}
          >
            <Text style={[styles.modeTabText, inputMode === 'text' && styles.modeTabTextActive]}>
              ⌨️ Type
            </Text>
          </Pressable>
        </View>

        {inputMode === 'voice' ? (
          <MicButton micState={micState} onPress={handleMicPress} />
        ) : (
          <View style={styles.textInputRow}>
            <TextInput
              style={styles.textInputField}
              placeholder="Type your question..."
              placeholderTextColor={colors.textMuted}
              value={textInput}
              onChangeText={setTextInput}
              onSubmitEditing={handleTextSend}
              returnKeyType="send"
              multiline={false}
              autoFocus
            />
            <Pressable
              style={[styles.sendBtn, !textInput.trim() && styles.sendBtnDisabled]}
              onPress={handleTextSend}
              disabled={!textInput.trim() || agentBusy}
            >
              <Text style={styles.sendBtnText}>Send</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: '90%',
    backgroundColor: '#0D0A1A',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderTopColor: '#2A1F4A',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5, shadowRadius: 20,
    elevation: 20,
    overflow: 'hidden',
  },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#1E1535',
  },
  resumeBtn: {
    backgroundColor: colors.primary + '22',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: colors.primary,
  },
  resumeBtnText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  headerTitle:   { color: colors.textMuted, fontSize: 13, fontWeight: '700', letterSpacing: 1.5 },

  contextCard: {
    margin: 12, padding: 14,
    backgroundColor: '#1A1230',
    borderRadius: 14, borderWidth: 1, borderColor: '#2A1F4A',
    gap: 6,
  },
  contextLabel:   { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 2 },
  contextLine:    { fontSize: 13, lineHeight: 18 },
  contextSpeaker: { fontWeight: '800' },
  contextText:    { fontWeight: '400', fontStyle: 'italic' },

  agentsRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8, gap: 10,
  },
  agentBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  agentDot:   { width: 10, height: 10, borderRadius: 5 },
  agentName:  { color: colors.text, fontSize: 13, fontWeight: '700' },
  agentsLabel: { color: colors.textMuted, fontSize: 12, marginLeft: 4 },

  messages:        { flex: 1 },
  messagesContent: { padding: 16, gap: 12 },
  emptyHint:       { color: '#5A4A7A', fontSize: 14, textAlign: 'center', marginTop: 20, lineHeight: 22 },

  bubble: { maxWidth: '85%', borderRadius: 18, padding: 14, gap: 4 },
  bubbleUser:  { alignSelf: 'flex-end', backgroundColor: colors.primary + '33', borderBottomRightRadius: 4 },
  bubbleAgent: { alignSelf: 'flex-start', backgroundColor: '#1E1535', borderBottomLeftRadius: 4 },
  bubbleError: { alignSelf: 'center', backgroundColor: '#3A1515' },
  bubbleSpeaker: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  bubbleText:     { fontSize: 15, lineHeight: 22 },
  bubbleTextUser:  { color: colors.text },
  bubbleTextAgent: { color: colors.text },

  thinkingBubble: { alignSelf: 'flex-start', padding: 14 },
  thinkingText:   { color: colors.primary, fontSize: 18, letterSpacing: 6 },

  resumePrompt: {
    alignSelf: 'stretch', marginTop: 8,
    backgroundColor: colors.primary + '22',
    borderWidth: 1.5, borderColor: colors.primary,
    borderRadius: 18, padding: 18,
    alignItems: 'center', gap: 4,
  },
  resumePromptText: { color: colors.primary, fontSize: 16, fontWeight: '800' },
  resumePromptSub:  { color: colors.textMuted, fontSize: 12 },
  thinkingText:   { color: colors.primary, fontSize: 18, letterSpacing: 6 },

  inputArea: {
    padding: 16, gap: 10,
    borderTopWidth: 1, borderTopColor: '#1E1535',
    paddingBottom: 32,
  },
  liveTranscriptBox: {
    backgroundColor: '#12082A',
    borderRadius: 12, borderWidth: 1, borderColor: colors.primary + '55',
    padding: 12, minHeight: 42,
  },
  liveTranscriptText: {
    color: colors.text, fontSize: 15, lineHeight: 22,
  },
  liveTranscriptCursor: {
    color: colors.primary, fontWeight: '900',
  },
  liveTranscriptProcessing: {
    color: colors.textMuted, fontSize: 13, fontStyle: 'italic',
  },
  liveTranscriptError: {
    color: '#FF6666', fontSize: 13,
  },
  pendingRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
  },
  pendingText: {
    flex: 1, color: colors.text, fontSize: 15, lineHeight: 22,
  },
  sendNowBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 10, alignSelf: 'flex-start',
  },
  sendNowText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  modeRow: {
    flexDirection: 'row', gap: 8,
  },
  modeTab: {
    flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
    backgroundColor: '#1A1230', borderWidth: 1, borderColor: '#2A1F4A',
  },
  modeTabActive: {
    backgroundColor: colors.primary + '22', borderColor: colors.primary,
  },
  modeTabText: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  modeTabTextActive: { color: colors.primary },
  textInputRow: {
    flexDirection: 'row', gap: 10, alignItems: 'center',
  },
  textInputField: {
    flex: 1,
    backgroundColor: '#1A1230',
    borderRadius: 14, borderWidth: 1, borderColor: '#2A1F4A',
    paddingHorizontal: 16, paddingVertical: 14,
    color: colors.text, fontSize: 15,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20, paddingVertical: 14,
    borderRadius: 14, alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  transcriptPreview: {
    color: colors.textMuted, fontSize: 13, fontStyle: 'italic',
    paddingHorizontal: 4,
  },
  micBtn: {
    backgroundColor: '#2A1F4A',
    borderRadius: 16, borderWidth: 1.5, borderColor: colors.primary,
    paddingVertical: 18, alignItems: 'center',
  },
  micBtnActive: { backgroundColor: '#FF4444', borderColor: '#FF4444' },
  micBtnText:   { color: colors.text, fontSize: 16, fontWeight: '700' },
});
