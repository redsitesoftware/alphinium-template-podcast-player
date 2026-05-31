/**
 * ChatInstanceWidget — React Native / Expo
 *
 * A native chat widget that connects to the ChatInstance API via WebSocket.
 * Mirrors the config API of the web popup-chat.js and slot-chat.js widgets
 * so the same agent works identically across web and native.
 *
 * Props:
 *   agentId        {string}  required — ChatInstance agent ID
 *   wsUrl          {string}  WebSocket URL (default: wss://api.chatinstance.com/stream/ws)
 *   mode           {string}  'fab' (floating button → modal) | 'inline' (fills parent)
 *   persona        {object}  { name, emoji, welcomeMessage }
 *   theme          {object}  { accentColor, bg }
 *   demoMode       {boolean} Show demo disclaimer on first message
 *   contextHint    {string}  Injected as user preamble for situational awareness
 *   suggestedChips {string[]} Quick-send chips shown above input
 *   fabOffset      {object}  { bottom, right } for FAB positioning
 *   onLeadCapture  {fn}      Called when lead capture widget_command fires
 *   style          {object}  Extra style for inline mode container
 */

import React, {
  useCallback,
  useEffect,
  useReducer,
  useRef,
} from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_WS_URL = 'wss://api.chatinstance.com/stream/ws';
const DEFAULT_ACCENT = '#A855F7';
const DEFAULT_BG = '#111827';

function generateSessionId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// Strip markdown symbols for plain native Text rendering
function renderText(raw) {
  return raw
    .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*]\s+/gm, '• ')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .trim();
}

// ─── State ───────────────────────────────────────────────────────────────────

function makeInitialState() {
  return {
    open: false,
    messages: [],   // { id, role, text, streaming }
    input: '',
    sessionId: generateSessionId(),
    wsReady: false,
    streaming: false,
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'OPEN':
      return { ...state, open: true };
    case 'CLOSE':
      return { ...state, open: false };
    case 'SET_INPUT':
      return { ...state, input: action.value };
    case 'WS_READY':
      return { ...state, wsReady: true };
    case 'WS_CLOSED':
      return { ...state, wsReady: false };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] };
    case 'START_STREAMING': {
      const id = `assistant-${Date.now()}`;
      return {
        ...state,
        streaming: true,
        messages: [...state.messages, { id, role: 'assistant', text: '', streaming: true }],
      };
    }
    case 'APPEND_STREAM': {
      const msgs = state.messages.map((m) =>
        m.streaming ? { ...m, text: m.text + action.content } : m
      );
      return { ...state, messages: msgs };
    }
    case 'FINISH_STREAM': {
      const msgs = state.messages.map((m) =>
        m.streaming ? { ...m, streaming: false } : m
      );
      return { ...state, streaming: false, messages: msgs };
    }
    default:
      return state;
  }
}

// ─── WebSocket hook ──────────────────────────────────────────────────────────

function useChatWS({ agentId, wsUrl, sessionId, demoMode, persona, contextHint, dispatch, onLeadCapture }) {
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const mountedRef = useRef(true);
  const connectedOnce = useRef(false);

  const connect = useCallback(() => {
    if (!agentId) return;
    if (wsRef.current && wsRef.current.readyState < 2) return;

    const url = `${wsUrl}?agent_id=${encodeURIComponent(agentId)}&session_id=${encodeURIComponent(sessionId)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      dispatch({ type: 'WS_READY' });
    };

    ws.onmessage = (e) => {
      if (!mountedRef.current) return;
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }

      switch (msg.type) {
        case 'connected': {
          if (!connectedOnce.current && persona?.welcomeMessage) {
            connectedOnce.current = true;
            const suffix = demoMode
              ? '\n\n_This is a WaveForm demo — powered by ChatInstance + alphinium-ai._'
              : '';
            dispatch({
              type: 'ADD_MESSAGE',
              message: {
                id: 'welcome',
                role: 'assistant',
                text: renderText(persona.welcomeMessage + suffix),
              },
            });
          }
          // Inject situational context silently (no user-visible message)
          if (contextHint && ws.readyState === 1) {
            ws.send(JSON.stringify({
              type: 'message',
              content: `[context] ${contextHint}`,
            }));
          }
          break;
        }
        case 'stream_start':
          dispatch({ type: 'START_STREAMING' });
          break;
        case 'stream':
          dispatch({ type: 'APPEND_STREAM', content: msg.content || '' });
          break;
        case 'stream_end':
          dispatch({ type: 'FINISH_STREAM' });
          break;
        case 'widget_command':
          if (msg.command === 'fill_form' || msg.command === 'lead_capture') {
            onLeadCapture?.(msg.args);
          }
          break;
        case 'rate_limit':
          dispatch({
            type: 'ADD_MESSAGE',
            message: { id: `rl-${Date.now()}`, role: 'assistant', text: '⏳ Just a moment…' },
          });
          break;
        case 'error':
          dispatch({ type: 'FINISH_STREAM' });
          dispatch({
            type: 'ADD_MESSAGE',
            message: {
              id: `err-${Date.now()}`,
              role: 'assistant',
              text: msg.message || 'Something went wrong. Please try again.',
            },
          });
          break;
        default:
          break;
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      dispatch({ type: 'WS_CLOSED' });
      reconnectTimer.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, wsUrl, sessionId]);

  const sendMessage = useCallback((text) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== 1) return false;
    ws.send(JSON.stringify({ type: 'message', content: text }));
    return true;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, []);

  return { connect, sendMessage };
}

// ─── Chat panel (shared by FAB modal and inline) ─────────────────────────────

function ChatPanel({ state, dispatch, sendMessage, connect, persona, theme, suggestedChips, showCloseBtn, onClose }) {
  const scrollRef = useRef(null);
  const insets = useSafeAreaInsets();
  const accent = theme?.accentColor || DEFAULT_ACCENT;
  const bg = theme?.bg || DEFAULT_BG;
  const name = persona?.name || 'AI Assistant';
  const emoji = persona?.emoji || 'AI';

  useEffect(() => {
    connect();
  }, [connect]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [state.messages]);

  const handleSend = useCallback(() => {
    const text = state.input.trim();
    if (!text || state.streaming) return;
    dispatch({ type: 'ADD_MESSAGE', message: { id: `user-${Date.now()}`, role: 'user', text } });
    dispatch({ type: 'SET_INPUT', value: '' });
    const sent = sendMessage(text);
    if (!sent) {
      dispatch({
        type: 'ADD_MESSAGE',
        message: { id: `err-${Date.now()}`, role: 'assistant', text: 'Reconnecting… please try again in a moment.' },
      });
    }
  }, [state.input, state.streaming, dispatch, sendMessage]);

  const handleChip = useCallback((chip) => {
    dispatch({ type: 'ADD_MESSAGE', message: { id: `user-${Date.now()}`, role: 'user', text: chip } });
    sendMessage(chip);
  }, [dispatch, sendMessage]);

  const chips = suggestedChips || [];

  return (
    <KeyboardAvoidingView
      style={[panelStyles.container, { backgroundColor: bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 10 : 0}
    >
      {/* Header */}
      <View style={[panelStyles.header, { borderBottomColor: `${accent}33`, paddingTop: insets.top || 14 }]}>
        <Text style={panelStyles.headerEmoji}>{emoji}</Text>
        <View style={panelStyles.headerInfo}>
          <Text style={panelStyles.headerName}>{name}</Text>
          <Text style={[panelStyles.headerStatus, { color: state.wsReady ? '#22c55e' : '#6b7280' }]}>
            {state.wsReady ? '● Online' : '○ Connecting…'}
          </Text>
        </View>
        {showCloseBtn && (
          <Pressable onPress={onClose} style={panelStyles.closeBtn} hitSlop={12}>
            <Text style={panelStyles.closeBtnText}>X</Text>
          </Pressable>
        )}
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={panelStyles.messages}
        contentContainerStyle={panelStyles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {state.messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              panelStyles.bubble,
              msg.role === 'user'
                ? [panelStyles.userBubble, { backgroundColor: accent }]
                : panelStyles.aiBubble,
            ]}
          >
            <Text
              style={[
                panelStyles.bubbleText,
                msg.role === 'user' ? panelStyles.userText : panelStyles.aiText,
                msg.streaming && panelStyles.streamingText,
              ]}
            >
              {msg.text || (msg.streaming ? '…' : '')}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Quick chips */}
      {chips.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={panelStyles.chipsScroll}
          contentContainerStyle={panelStyles.chipsContainer}
          keyboardShouldPersistTaps="handled"
        >
          {chips.map((chip) => (
            <Pressable
              key={chip}
              onPress={() => handleChip(chip)}
              style={[panelStyles.chip, { borderColor: `${accent}66` }]}
            >
              <Text style={[panelStyles.chipText, { color: accent }]}>{chip}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Input row */}
      <View style={[panelStyles.inputRow, { borderTopColor: `${accent}22`, paddingBottom: insets.bottom || 10 }]}>
        <TextInput
          style={panelStyles.input}
          placeholder="Type a message…"
          placeholderTextColor="#4b5563"
          value={state.input}
          onChangeText={(v) => dispatch({ type: 'SET_INPUT', value: v })}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          multiline
          editable={!state.streaming}
        />
        <Pressable
          onPress={handleSend}
          style={[panelStyles.sendBtn, { backgroundColor: accent, opacity: state.streaming ? 0.5 : 1 }]}
          disabled={state.streaming}
        >
          <Text style={panelStyles.sendBtnText}>↑</Text>
        </Pressable>
      </View>

      <Text style={panelStyles.branding}>Powered by ChatInstance</Text>
    </KeyboardAvoidingView>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function ChatInstanceWidget({
  agentId,
  wsUrl = DEFAULT_WS_URL,
  mode = 'fab',
  persona,
  theme,
  demoMode = false,
  contextHint,
  suggestedChips,
  fabOffset,
  onLeadCapture,
  style,
}) {
  const [state, dispatch] = useReducer(reducer, undefined, makeInitialState);
  const accent = theme?.accentColor || DEFAULT_ACCENT;

  const { connect, sendMessage } = useChatWS({
    agentId,
    wsUrl,
    sessionId: state.sessionId,
    demoMode,
    persona,
    contextHint,
    dispatch,
    onLeadCapture,
  });

  if (mode === 'fab') {
    const fabBottom = fabOffset?.bottom ?? 24;
    const fabRight = fabOffset?.right ?? 20;

    return (
      <>
        <Pressable
          onPress={() => dispatch({ type: state.open ? 'CLOSE' : 'OPEN' })}
          style={[fabStyles.fab, { backgroundColor: accent, bottom: fabBottom, right: fabRight }]}
        >
          <Text style={fabStyles.fabEmoji}>{persona?.emoji || 'AI'}</Text>
        </Pressable>

        <Modal
          visible={state.open}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => dispatch({ type: 'CLOSE' })}
        >
          <ChatPanel
            state={state}
            dispatch={dispatch}
            sendMessage={sendMessage}
            connect={connect}
            persona={persona}
            theme={theme}
            suggestedChips={suggestedChips}
            showCloseBtn
            onClose={() => dispatch({ type: 'CLOSE' })}
          />
        </Modal>
      </>
    );
  }

  // Inline mode — fills parent container
  return (
    <View style={[{ flex: 1 }, style]}>
      <ChatPanel
        state={state}
        dispatch={dispatch}
        sendMessage={sendMessage}
        connect={connect}
        persona={persona}
        theme={theme}
        suggestedChips={suggestedChips}
        showCloseBtn={false}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const panelStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerEmoji: {
    fontSize: 26,
    marginRight: 10,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '600',
  },
  headerStatus: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: '#6b7280',
    fontSize: 18,
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: 12,
    paddingBottom: 8,
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 14,
    padding: 10,
    marginVertical: 3,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1f2937',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#ffffff',
  },
  aiText: {
    color: '#e5e7eb',
  },
  streamingText: {
    opacity: 0.75,
  },
  chipsScroll: {
    maxHeight: 44,
    flexShrink: 0,
  },
  chipsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    color: '#f9fafb',
    backgroundColor: '#1f2937',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  branding: {
    textAlign: 'center',
    color: '#374151',
    fontSize: 10,
    paddingVertical: 4,
  },
});

const fabStyles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  fabEmoji: {
    fontSize: 24,
  },
});
