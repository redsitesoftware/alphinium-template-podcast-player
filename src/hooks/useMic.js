/**
 * useMic — MediaRecorder → Groq Whisper STT via chatinstance-api /transcribe
 * 
 * Usage:
 *   const { micState, startListening, stopListening, transcript, error } = useMic();
 * 
 * micState: 'idle' | 'requesting' | 'recording' | 'processing' | 'done' | 'error'
 */
import { useCallback, useRef, useState } from 'react';

const TRANSCRIBE_URL = 'https://api.chatinstance.com/api/v1/transcribe?prompt=WaveForm,ChatInstance,Alphinium';

export function useMic() {
  const [micState, setMicState]     = useState('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError]           = useState(null);

  const recorderRef  = useRef(null);
  const chunksRef    = useRef([]);
  const streamRef    = useRef(null);

  const startListening = useCallback(async () => {
    // Release any existing stream/recorder before starting fresh
    if (recorderRef.current) {
      try { recorderRef.current.stop(); } catch {}
      recorderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setError(null);
    setTranscript('');
    setMicState('requesting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setMicState('recording');

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;

        if (!chunksRef.current.length) {
          setMicState('error');
          setError('No audio recorded');
          return;
        }

        setMicState('processing');
        const blob = new Blob(chunksRef.current, { type: mimeType });

        // Retry up to 3 times on 429 rate limit, respecting Retry-After header
        const MAX_RETRIES = 3;
        let lastErr = null;
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          try {
            const res = await fetch(TRANSCRIBE_URL, {
              method: 'POST',
              headers: { 'Content-Type': mimeType },
              body: blob,
            });

            if (res.status === 429) {
              let waitMs = 10000; // default 10s
              try {
                const data = await res.json();
                waitMs = (data.retryAfter || 10) * 1000;
              } catch {}
              const waitSec = Math.round(waitMs / 1000);
              setError(`Rate limited — waiting ${waitSec}s...`);
              lastErr = new Error(`Rate limited`);
              if (attempt < MAX_RETRIES - 1) await new Promise(r => setTimeout(r, waitMs));
              continue;
            }
            if (!res.ok) throw new Error(`STT failed: ${res.status}`);
            const data = await res.json();
            setTranscript(data.transcript || '');
            setMicState('done');
            return;
          } catch (err) {
            lastErr = err;
            if (!err.message.includes('Rate')) break;
          }
        }
        setError(lastErr?.message || 'STT failed');
        setMicState('error');
      };

      recorderRef.current = recorder;
      recorder.start();
    } catch (err) {
      const msg = err.name === 'NotAllowedError'
        ? 'Microphone access denied'
        : err.message;
      setError(msg);
      setMicState('error');
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    }
  }, []);

  const reset = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    recorderRef.current = null;
    setMicState('idle');
    setTranscript('');
    setError(null);
  }, []);

  return { micState, transcript, error, startListening, stopListening, reset };
}
