import { cn } from '@/lib/utils';

interface ProgressArcProps {
  percentage: number;
  side: 'red' | 'blue';
  className?: string;
}

export function ProgressArc({ percentage, side, className }: ProgressArcProps) {
  // Arc configuration
  const size = 280;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  
  // Arc spans from 180° to 0° (bottom-open semicircle, going upward on both sides)
  const startAngle = 140; // Starting from bottom-left
  const endAngle = 40;    // Ending at bottom-right
  const totalAngle = 360 - startAngle + endAngle; // ~260 degrees
  
  // Calculate arc path
  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const rad = (angle - 90) * Math.PI / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad)
    };
  };
  
  const describeArc = (cx: number, cy: number, r: number, start: number, end: number) => {
    const startPoint = polarToCartesian(cx, cy, r, start);
    const endPoint = polarToCartesian(cx, cy, r, end);
    const largeArc = end - start <= 180 ? 0 : 1;
    
    return `M ${startPoint.x} ${startPoint.y} A ${r} ${r} 0 ${largeArc} 1 ${endPoint.x} ${endPoint.y}`;
  };
  
  // Background arc path (full arc)
  const bgArcPath = describeArc(center, center, radius, startAngle, 360 + endAngle);
  
  // Progress arc - calculate end angle based on percentage
  const progressAngle = startAngle + (totalAngle * (percentage / 100));
  const clampedProgressAngle = Math.min(progressAngle, 360 + endAngle);
  const progressArcPath = percentage > 0 
    ? describeArc(center, center, radius, startAngle, clampedProgressAngle)
    : '';

  return (
    <svg 
      viewBox={`0 0 ${size} ${size}`} 
      className={cn('w-full h-full', className)}
    >
      {/* Background arc */}
      <path
        d={bgArcPath}
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      
      {/* Progress arc */}
      {percentage > 0 && (
        <path
          d={progressArcPath}
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      )}
      
      {/* Scale markers - 0 and 100 */}
      <text
        x={polarToCartesian(center, center, radius + 24, startAngle).x}
        y={polarToCartesian(center, center, radius + 24, startAngle).y}
        fill="rgba(255,255,255,0.5)"
        fontSize="16"
        fontWeight="bold"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        0
      </text>
      <text
        x={polarToCartesian(center, center, radius + 24, 360 + endAngle).x}
        y={polarToCartesian(center, center, radius + 24, 360 + endAngle).y}
        fill="rgba(255,255,255,0.5)"
        fontSize="16"
        fontWeight="bold"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        100
      </text>
    </svg>
  );
}
