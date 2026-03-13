import { useMemo } from 'react';
import type { CSSProperties } from 'react';

interface ConfettiPiece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotation: number;
  shape: 'square' | 'circle' | 'star' | 'ribbon';
  isBurst?: boolean;
  burstX?: number;
  burstY?: number;
}

const STANDARD_COLORS = [
  '#F59E0B', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE',
];

const GOLDEN_COLORS = [
  '#FFD700', '#FFC107', '#F59E0B', '#FFEB3B', '#FFF176',
  '#FFE082', '#FFD54F', '#FFCA28', '#FFC400', '#FFB300',
];

const SHAPES: ConfettiPiece['shape'][] = ['square', 'circle', 'star', 'ribbon'];

function getShapeStyle(shape: ConfettiPiece['shape'], size: number): CSSProperties {
  switch (shape) {
    case 'circle':
      return { borderRadius: '50%', width: size, height: size };
    case 'star':
      return {
        width: size,
        height: size,
        clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
      };
    case 'ribbon':
      return { width: size * 0.4, height: size * 1.6, borderRadius: '2px' };
    case 'square':
    default:
      return { width: size, height: size, borderRadius: '2px' };
  }
}

interface ConfettiProps {
  variant?: 'standard' | 'golden';
}

export function Confetti({ variant = 'standard' }: ConfettiProps) {
  const isGolden = variant === 'golden';
  const colors = isGolden ? GOLDEN_COLORS : STANDARD_COLORS;
  const fallCount = isGolden ? 100 : 80;
  const burstCount = isGolden ? 30 : 20;

  const pieces = useMemo<ConfettiPiece[]>(() => {
    const fallPieces: ConfettiPiece[] = Array.from({ length: fallCount }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 2 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 8 + Math.random() * 12,
      rotation: Math.random() * 360,
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    }));

    const burstPieces: ConfettiPiece[] = Array.from({ length: burstCount }, (_, i) => {
      const angle = (i / burstCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const distance = 150 + Math.random() * 250;
      return {
        id: fallCount + i,
        left: 50,
        delay: Math.random() * 0.2,
        duration: 0.6,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 10,
        rotation: Math.random() * 360,
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        isBurst: true,
        burstX: Math.cos(angle) * distance,
        burstY: Math.sin(angle) * distance,
      };
    });

    return [...fallPieces, ...burstPieces];
  }, [fallCount, burstCount, colors]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((piece) => {
        if (piece.isBurst) {
          return (
            <div
              key={piece.id}
              className="absolute animate-confetti-burst"
              style={{
                left: '50%',
                top: '50%',
                ...getShapeStyle(piece.shape, piece.size),
                backgroundColor: piece.color,
                transform: `rotate(${piece.rotation}deg)`,
                animationDelay: `${piece.delay}s`,
                ['--burst-translate' as string]: `translate(${piece.burstX}px, ${piece.burstY}px)`,
                ...(isGolden ? { boxShadow: `0 0 4px ${piece.color}` } : {}),
              }}
            />
          );
        }

        return (
          <div
            key={piece.id}
            className="absolute animate-confetti-fall"
            style={{
              left: `${piece.left}%`,
              top: '-20px',
              ...getShapeStyle(piece.shape, piece.size),
              backgroundColor: piece.color,
              transform: `rotate(${piece.rotation}deg)`,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              ...(isGolden ? { boxShadow: `0 0 4px ${piece.color}` } : {}),
            }}
          />
        );
      })}
    </div>
  );
}
