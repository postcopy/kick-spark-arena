import { cn } from '@/lib/utils';

export type MascotState = 'idle' | 'attacking' | 'hit' | 'winner' | 'loser' | 'ko';

interface FighterMascotProps {
  side: 'red' | 'blue';
  state: MascotState;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function FighterMascot({ side, state, className, size = 'md' }: FighterMascotProps) {
  const isBlue = side === 'blue';
  
  const sizeClasses = {
    sm: 'w-16 h-24',
    md: 'w-24 h-36',
    lg: 'w-32 h-48',
  };

  const getAnimationClass = () => {
    switch (state) {
      case 'idle': return 'animate-mascot-idle';
      case 'attacking': return 'animate-mascot-attack';
      case 'hit': return 'animate-mascot-hit';
      case 'winner': return 'animate-mascot-winner';
      case 'loser': return 'animate-mascot-loser';
      case 'ko': return 'animate-mascot-ko';
      default: return '';
    }
  };

  const glowColor = side === 'red' 
    ? 'drop-shadow-[0_0_20px_hsl(var(--game-red-glow)/0.8)]' 
    : 'drop-shadow-[0_0_20px_hsl(var(--game-blue-glow)/0.8)]';

  const fillColor = side === 'red' ? 'hsl(var(--game-red))' : 'hsl(var(--game-blue))';
  const strokeColor = side === 'red' ? 'hsl(0, 100%, 60%)' : 'hsl(227, 100%, 70%)';

  // Different poses based on state
  const renderPose = () => {
    switch (state) {
      case 'winner':
        return (
          // Victory pose - arms raised
          <svg viewBox="0 0 100 150" className="w-full h-full">
            {/* Head */}
            <ellipse cx="50" cy="25" rx="18" ry="20" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            {/* Helmet detail */}
            <path d="M32 20 Q50 5 68 20" fill="none" stroke={strokeColor} strokeWidth="3"/>
            {/* Body */}
            <path d="M35 45 L40 90 L60 90 L65 45 Z" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            {/* Left arm raised */}
            <path d="M35 50 L15 25 L10 30" fill="none" stroke={fillColor} strokeWidth="8" strokeLinecap="round"/>
            {/* Right arm raised */}
            <path d="M65 50 L85 25 L90 30" fill="none" stroke={fillColor} strokeWidth="8" strokeLinecap="round"/>
            {/* Gloves */}
            <circle cx="10" cy="28" r="8" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            <circle cx="90" cy="28" r="8" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            {/* Legs spread */}
            <path d="M42 90 L35 130 L40 135" fill="none" stroke={fillColor} strokeWidth="10" strokeLinecap="round"/>
            <path d="M58 90 L65 130 L60 135" fill="none" stroke={fillColor} strokeWidth="10" strokeLinecap="round"/>
            {/* Happy expression */}
            <path d="M40 28 Q50 38 60 28" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );

      case 'loser':
        return (
          // Defeated pose - slumped
          <svg viewBox="0 0 100 150" className="w-full h-full">
            {/* Head drooped */}
            <ellipse cx="50" cy="35" rx="18" ry="20" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            {/* Helmet detail */}
            <path d="M32 30 Q50 15 68 30" fill="none" stroke={strokeColor} strokeWidth="3"/>
            {/* Body slumped */}
            <path d="M35 55 L38 100 L62 100 L65 55 Z" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            {/* Arms hanging */}
            <path d="M35 60 L25 90 L28 100" fill="none" stroke={fillColor} strokeWidth="8" strokeLinecap="round"/>
            <path d="M65 60 L75 90 L72 100" fill="none" stroke={fillColor} strokeWidth="8" strokeLinecap="round"/>
            {/* Gloves */}
            <circle cx="27" cy="98" r="7" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            <circle cx="73" cy="98" r="7" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            {/* Legs */}
            <path d="M42 100 L38 135 L42 140" fill="none" stroke={fillColor} strokeWidth="10" strokeLinecap="round"/>
            <path d="M58 100 L62 135 L58 140" fill="none" stroke={fillColor} strokeWidth="10" strokeLinecap="round"/>
            {/* Sad expression */}
            <path d="M40 38 Q50 32 60 38" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            {/* X eyes */}
            <path d="M38 25 L44 31 M44 25 L38 31" stroke="white" strokeWidth="2"/>
            <path d="M56 25 L62 31 M62 25 L56 31" stroke="white" strokeWidth="2"/>
          </svg>
        );

      case 'ko':
        return (
          // KO pose - fallen
          <svg viewBox="0 0 150 80" className="w-full h-full">
            {/* Head */}
            <ellipse cx="25" cy="35" rx="18" ry="16" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            {/* X eyes */}
            <path d="M18 32 L24 38 M24 32 L18 38" stroke="white" strokeWidth="2"/>
            <path d="M26 32 L32 38 M32 32 L26 38" stroke="white" strokeWidth="2"/>
            {/* Body lying down */}
            <path d="M43 25 L95 22 L98 48 L45 50 Z" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            {/* Arms sprawled */}
            <path d="M50 25 L55 10" fill="none" stroke={fillColor} strokeWidth="7" strokeLinecap="round"/>
            <path d="M75 50 L80 65" fill="none" stroke={fillColor} strokeWidth="7" strokeLinecap="round"/>
            {/* Gloves */}
            <circle cx="55" cy="8" r="6" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            <circle cx="80" cy="67" r="6" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            {/* Legs */}
            <path d="M95 30 L125 28" fill="none" stroke={fillColor} strokeWidth="9" strokeLinecap="round"/>
            <path d="M98 45 L130 50" fill="none" stroke={fillColor} strokeWidth="9" strokeLinecap="round"/>
            {/* Stars around head */}
            <text x="10" y="15" className="text-sm fill-game-yellow">★</text>
            <text x="35" y="12" className="text-sm fill-game-yellow">★</text>
            <text x="20" y="60" className="text-sm fill-game-yellow">★</text>
          </svg>
        );

      case 'attacking':
        return (
          // Kick pose
          <svg viewBox="0 0 120 150" className="w-full h-full">
            {/* Head */}
            <ellipse cx="45" cy="25" rx="18" ry="20" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            {/* Helmet detail */}
            <path d="M27 20 Q45 5 63 20" fill="none" stroke={strokeColor} strokeWidth="3"/>
            {/* Intense eyes */}
            <circle cx="38" cy="22" r="3" fill="white"/>
            <circle cx="52" cy="22" r="3" fill="white"/>
            {/* Body leaning */}
            <path d="M30 45 L35 95 L55 95 L60 45 Z" fill={fillColor} stroke={strokeColor} strokeWidth="2" transform="rotate(-10, 45, 70)"/>
            {/* Guard arm */}
            <path d="M30 55 L15 45 L12 50" fill="none" stroke={fillColor} strokeWidth="8" strokeLinecap="round"/>
            {/* Extended arm */}
            <path d="M58 55 L75 65" fill="none" stroke={fillColor} strokeWidth="8" strokeLinecap="round"/>
            {/* Gloves */}
            <circle cx="10" cy="48" r="7" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            <circle cx="77" cy="67" r="7" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            {/* Standing leg */}
            <path d="M40 95 L35 135 L40 140" fill="none" stroke={fillColor} strokeWidth="10" strokeLinecap="round"/>
            {/* Kicking leg extended */}
            <path d="M55 90 L100 75 L110 78" fill="none" stroke={fillColor} strokeWidth="10" strokeLinecap="round"/>
            {/* Kick effect */}
            <path d="M105 70 L115 65 M108 78 L120 80 M105 85 L115 92" stroke={strokeColor} strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );

      case 'hit':
        return (
          // Hit/recoil pose
          <svg viewBox="0 0 100 150" className="w-full h-full">
            {/* Head thrown back */}
            <ellipse cx="55" cy="28" rx="18" ry="20" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            {/* Pain expression */}
            <path d="M48 25 L52 30 M52 25 L48 30" stroke="white" strokeWidth="2"/>
            <path d="M58 25 L62 30 M62 25 L58 30" stroke="white" strokeWidth="2"/>
            <ellipse cx="55" cy="38" rx="5" ry="3" fill="white"/>
            {/* Body recoiling */}
            <path d="M40 48 L42 95 L62 95 L68 48 Z" fill={fillColor} stroke={strokeColor} strokeWidth="2" transform="rotate(5, 50, 70)"/>
            {/* Arms flailing */}
            <path d="M40 55 L20 70 L15 65" fill="none" stroke={fillColor} strokeWidth="8" strokeLinecap="round"/>
            <path d="M65 55 L80 45 L85 50" fill="none" stroke={fillColor} strokeWidth="8" strokeLinecap="round"/>
            {/* Gloves */}
            <circle cx="13" cy="63" r="7" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            <circle cx="87" cy="48" r="7" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            {/* Legs */}
            <path d="M45 95 L40 135 L45 140" fill="none" stroke={fillColor} strokeWidth="10" strokeLinecap="round"/>
            <path d="M60 95 L65 130 L60 138" fill="none" stroke={fillColor} strokeWidth="10" strokeLinecap="round"/>
            {/* Impact lines */}
            <path d="M30 30 L20 25" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M28 40 L18 42" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );

      default: // idle
        return (
          // Fighting stance
          <svg viewBox="0 0 100 150" className="w-full h-full">
            {/* Head */}
            <ellipse cx="50" cy="25" rx="18" ry="20" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            {/* Helmet detail */}
            <path d="M32 20 Q50 5 68 20" fill="none" stroke={strokeColor} strokeWidth="3"/>
            {/* Eyes */}
            <ellipse cx="42" cy="23" rx="4" ry="3" fill="white"/>
            <ellipse cx="58" cy="23" rx="4" ry="3" fill="white"/>
            <circle cx="43" cy="23" r="2" fill="black"/>
            <circle cx="59" cy="23" r="2" fill="black"/>
            {/* Body */}
            <path d="M35 45 L38 95 L62 95 L65 45 Z" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            {/* Left arm guard */}
            <path d="M35 55 L20 50 L18 60" fill="none" stroke={fillColor} strokeWidth="8" strokeLinecap="round"/>
            {/* Right arm guard */}
            <path d="M65 55 L80 50 L82 60" fill="none" stroke={fillColor} strokeWidth="8" strokeLinecap="round"/>
            {/* Gloves */}
            <circle cx="17" cy="58" r="8" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            <circle cx="83" cy="58" r="8" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            {/* Legs in stance */}
            <path d="M42 95 L35 135 L40 140" fill="none" stroke={fillColor} strokeWidth="10" strokeLinecap="round"/>
            <path d="M58 95 L65 135 L60 140" fill="none" stroke={fillColor} strokeWidth="10" strokeLinecap="round"/>
          </svg>
        );
    }
  };

  return (
    <div 
      className={cn(
        sizeClasses[size],
        glowColor,
        getAnimationClass(),
        isBlue && state !== 'ko' && '-scale-x-100', // Mirror for blue side (except KO which is horizontal)
        'transition-all duration-150',
        className
      )}
    >
      {renderPose()}
    </div>
  );
}
