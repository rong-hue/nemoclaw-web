'use client';

import { useEffect, useRef, useState } from 'react';

interface StampCursorProps {
  src: string;
  size: number;
  angle: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export default function StampCursor({ src, size, angle, containerRef }: StampCursorProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    const onLeave = () => setPos(null);

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [containerRef]);

  if (!pos) return null;

  return (
    <img
      src={src}
      alt=""
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width: size,
        height: size,
        transform: `translate(-50%, -50%) rotate(${angle}deg)`,
        opacity: 0.55,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    />
  );
}
