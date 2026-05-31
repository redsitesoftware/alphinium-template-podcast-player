/**
 * useImageRotator — cycles through images, exposes currentIdx + transitioning state.
 * On web we rely on CSS opacity transitions (more reliable than Animated.Image).
 */
import { useEffect, useRef, useState } from 'react';

export function useImageRotator(images = [], intervalMs = 8000) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const pendingIdx = useRef(1);

  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      const next = (pendingIdx.current) % images.length;
      setTransitioning(true);
      // After transition completes, commit the new index
      setTimeout(() => {
        setCurrentIdx(next);
        pendingIdx.current = (next + 1) % images.length;
        setTransitioning(false);
      }, 900);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [images.length, intervalMs]);

  return {
    currentIdx,
    nextIdx: pendingIdx.current % Math.max(images.length, 1),
    transitioning,
  };
}
