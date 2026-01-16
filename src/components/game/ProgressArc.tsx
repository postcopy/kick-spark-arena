import { cn } from '@/lib/utils';

interface ProgressArcProps {
  percentage: number;
  side: 'red' | 'blue';
  className?: string;
}

export function ProgressArc({ percentage, side, className }: ProgressArcProps) {
  // Arc configuration - larger for TV display
  const size = 480;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2 - 30;
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
    
    // Calculate the arc angle correctly, handling the 360-degree crossing
    const arcAngle = ((end - start) % 360 + 360) % 360;
    const largeArc = arcAngle > 180 ? 1 : 0;
    
    return `M ${startPoint.x} ${startPoint.y} A ${r} ${r} 0 ${largeArc} 1 ${endPoint.x} ${endPoint.y}`;
  };
  
  // Background arc path (full arc)
  const bgArcPath = describeArc(center, center, radius, startAngle, 360 + endAngle);
  
  // Protect against edge cases - ensure percentage has minimum/maximum bounds
  const safePercentage = Math.max(0.5, Math.min(99.5, percentage));
  
  // Progress arc - calculate end angle based on percentage
  const progressAngle = startAngle + (totalAngle * (safePercentage / 100));
  const clampedProgressAngle = Math.min(progressAngle, 360 + endAngle);
  
  // Only show progress if there's meaningful progress
  const shouldShowProgress = percentage >= 0.5;
  const progressArcPath = shouldShowProgress
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
      {shouldShowProgress && (
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
        x={polarToCartesian(center, center, radius + 36, startAngle).x}
        y={polarToCartesian(center, center, radius + 36, startAngle).y}
        fill="rgba(255,255,255,0.5)"
        fontSize="24"
        fontWeight="bold"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        0
      </text>
      <text
        x={polarToCartesian(center, center, radius + 36, 360 + endAngle).x}
        y={polarToCartesian(center, center, radius + 36, 360 + endAngle).y}
        fill="rgba(255,255,255,0.5)"
        fontSize="24"
        fontWeight="bold"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        100
      </text>
    </svg>
  );
}
