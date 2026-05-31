import { useCallback, useEffect, useRef, useState } from 'react';

const fmt = (s) => {
  const secs = Math.max(0, Math.floor(s));
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
};

export function useAudio(url) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0); // 0–1
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    if (!url) return;
    const audio = new window.Audio();
    audio.src = url;
    audio.preload = 'metadata';
    ref.current = audio;

    const onMeta = () => setDuration(audio.duration || 0);
    const onTime = () => setPosition(audio.currentTime / (audio.duration || 1));
    const onEnd = () => { setPlaying(false); setEnded(true); };

    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
      ref.current = null;
      setEnded(false);
    };
  }, [url]);

  const play = useCallback(() => {
    if (ref.current) {
      ref.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }, []);
  const pause = useCallback(() => { ref.current?.pause(); setPlaying(false); }, []);
  const toggle = useCallback(() => (ref.current?.paused !== false ? play() : pause()), [play, pause]);

  const seek = useCallback((ratio) => {
    if (ref.current) ref.current.currentTime = ratio * (ref.current.duration || 0);
  }, []);

  const skip = useCallback((secs) => {
    if (ref.current) ref.current.currentTime = Math.max(0, ref.current.currentTime + secs);
  }, []);

  const setPlaybackSpeed = useCallback((s) => {
    setSpeed(s);
    if (ref.current) ref.current.playbackRate = s;
  }, []);

  const posSecs = position * duration;

  return {
    playing, toggle, play, pause,
    position, duration, ended,
    positionFormatted: fmt(posSecs),
    durationFormatted: fmt(duration),
    seek, skip, speed, setPlaybackSpeed,
  };
}
