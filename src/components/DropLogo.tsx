/* eslint-disable @next/next/no-img-element */
import React from 'react';

interface Props {
  width: number; // px; the drop is 1.3× as tall
  alt?: string;
  fall?: boolean; // play the falling-drop entrance animation
  className?: string;
}

// The Plllc logo as a falling water drop: gold outline, deep green fill and the round logo
// in the drop's round bottom. The shape comes from .drop-shape in globals.css.
export default function DropLogo({ width, alt = 'Plllc', fall = false, className = '' }: Props) {
  return (
    <div
      className={`shrink-0 drop-shadow-[0_4px_8px_rgba(2,44,34,0.45)] ${fall ? 'drop-fall' : ''} ${className}`}
      style={{ width, height: Math.round(width * 1.3) }}
    >
      <div className="drop-shape w-full h-full bg-amber-400" style={{ padding: Math.max(2, Math.round(width / 26)) }}>
        <div className="drop-shape relative w-full h-full bg-gradient-to-b from-emerald-700 to-emerald-950">
          <img src="/logo-plllc.svg" alt={alt} className="absolute left-[5%] bottom-0 w-[90%] aspect-square" />
        </div>
      </div>
    </div>
  );
}
