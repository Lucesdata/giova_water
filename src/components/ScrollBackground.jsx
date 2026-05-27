import React, { useRef, useEffect, useState } from 'react';
import { Player } from '@remotion/player';
import { ScrollBG } from '../remotion/ScrollBG.jsx';

const TOTAL_FRAMES = 479;

export function ScrollBackground() {
  const playerRef = useRef(null);
  const rafRef = useRef(null);
  const [dims, setDims] = useState({
    w: window.innerWidth || 1440,
    h: window.innerHeight || 900,
  });
  const [reduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    if (reduced) return;
    const onResize = () =>
      setDims({ w: window.innerWidth || 1440, h: window.innerHeight || 900 });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [reduced]);

  useEffect(() => {
    if (reduced) return;
    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const max = document.body.scrollHeight - window.innerHeight;
        const progress = max > 0 ? window.scrollY / max : 0;
        playerRef.current?.seekTo(Math.round(progress * TOTAL_FRAMES));
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [reduced]);

  if (reduced) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 0,
        opacity: 0.18, pointerEvents: 'none',
      }}
    >
      <Player
        ref={playerRef}
        component={ScrollBG}
        durationInFrames={480}
        fps={30}
        compositionWidth={dims.w}
        compositionHeight={dims.h}
        style={{ width: '100%', height: '100%' }}
        autoPlay={false}
      />
    </div>
  );
}
