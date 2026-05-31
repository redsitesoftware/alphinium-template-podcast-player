/**
 * useSpeechRecognition — Web Speech API wrapper for real-time interim transcript display.
 *
 * Runs alongside MediaRecorder (useMic) — this shows words live as the user speaks,
 * while Groq Whisper gives the final accurate transcript for sending.
 *
 * Returns:
 *   liveText    — interim words appearing as user speaks (resets each utterance)
 *   finalText   — completed utterance (use to send when not using Groq)
 *   supported   — false on non-Chrome/non-web environments
 *   start()     — begin recognition
 *   stop()      — end recognition
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export function useSpeechRecognition({ onFinal } = {}) {
  const [liveText,  setLiveText]  = useState('');
  const [finalText, setFinalText] = useState('');
  const [supported, setSupported] = useState(false);
  const recognizerRef = useRef(null);
  const activeRef     = useRef(false);

  useEffect(() => {
    const SR = window?.SpeechRecognition || window?.webkitSpeechRecognition;
    setSupported(!!SR);
  }, []);

  const start = useCallback(() => {
    const SR = window?.SpeechRecognition || window?.webkitSpeechRecognition;
    if (!SR) return;

    if (recognizerRef.current) {
      try { recognizerRef.current.abort(); } catch {}
    }

    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = true;  // get words as they're spoken
    rec.continuous = false;     // stop after natural pause
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      setLiveText(interim);
      if (final) {
        setFinalText(final.trim());
        setLiveText('');
        onFinal?.(final.trim());
      }
    };

    rec.onerror = (e) => {
      if (e.error !== 'aborted') setLiveText('');
    };

    rec.onend = () => {
      if (activeRef.current) {
        // Restart for continuous feel (stops on silence, we restart)
        try { rec.start(); } catch {}
      }
    };

    activeRef.current = true;
    recognizerRef.current = rec;
    try { rec.start(); } catch {}
  }, [onFinal]);

  const stop = useCallback(() => {
    activeRef.current = false;
    if (recognizerRef.current) {
      try { recognizerRef.current.stop(); } catch {}
      recognizerRef.current = null;
    }
    setLiveText('');
  }, []);

  return { liveText, finalText, supported, start, stop };
}
