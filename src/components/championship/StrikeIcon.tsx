// StrikeIcon — ícones custom dos golpes do TKD baseados nos produtos REAIS Sulsport.
// Uso: <StrikeIcon type="head" className="w-5 h-5" />
// Técnica: CSS mask-image + backgroundColor=currentColor. O PNG serve de recorte;
// a cor final vem do text-color do parent. Funciona em qualquer fundo.
// spinHead/spinBody = ícone base + arco de rotação 270° (SVG inline sobreposto).

import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import headSrc from '@/assets/strike-head.png';
import bodySrc from '@/assets/strike-body.png';
import punchSrc from '@/assets/strike-punch.png';

export type StrikeType = 'punch' | 'body' | 'head' | 'spinBody' | 'spinHead';

const MASK_SRC: Record<'punch' | 'body' | 'head', string> = {
  punch: punchSrc,
  body: bodySrc,
  head: headSrc,
};

const BASE_FOR_SPIN: Record<'spinBody' | 'spinHead', 'body' | 'head'> = {
  spinBody: 'body',
  spinHead: 'head',
};

interface StrikeIconProps extends HTMLAttributes<HTMLSpanElement> {
  type: StrikeType;
}

export function StrikeIcon({ type, className, style, ...rest }: StrikeIconProps) {
  const isSpin = type === 'spinBody' || type === 'spinHead';
  const baseType = isSpin ? BASE_FOR_SPIN[type as 'spinBody' | 'spinHead'] : (type as 'punch' | 'body' | 'head');
  const src = MASK_SRC[baseType];

  return (
    <span
      {...rest}
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={style}
      aria-hidden
    >
      <span
        className="absolute inset-0"
        style={{
          backgroundColor: 'currentColor',
          WebkitMask: `url(${src}) center / contain no-repeat`,
          mask: `url(${src}) center / contain no-repeat`,
        }}
      />
      {isSpin && (
        // Rotation arc 270° + arrow tip — overlay no canto superior direito
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute -top-[10%] -right-[10%] w-[55%] h-[55%] drop-shadow-[0_0_2px_rgba(0,0,0,0.6)]"
          style={{ color: 'rgb(252 211 77)' /* amber-300 */ }}
        >
          <path d="M20 6.5a8 8 0 0 0-13-2" />
          <path d="M20 3v3.5h-3.5" />
        </svg>
      )}
    </span>
  );
}
