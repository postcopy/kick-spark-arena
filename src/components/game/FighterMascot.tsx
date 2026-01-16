import { cn } from '@/lib/utils';

export type MascotState = 'idle' | 'attacking' | 'hit' | 'winner' | 'loser' | 'ko';

interface FighterMascotProps {
  side: 'red' | 'blue';
  state: MascotState;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function FighterMascot({ side, state, className, size = 'md' }: FighterMascotProps) {
  const isBlue = side === 'blue';
  
  const sizeClasses = {
    sm: 'w-16 h-20',
    md: 'w-24 h-32',
    lg: 'w-32 h-40',
    xl: 'w-48 h-60',
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
    ? 'drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]' 
    : 'drop-shadow-[0_0_12px_rgba(59,130,246,0.7)]';

  const teamColor = side === 'red' ? '#ef4444' : '#3b82f6';
  const teamColorLight = side === 'red' ? '#fca5a5' : '#93c5fd';
  const skinColor = '#FFDAB9';
  const blushColor = '#FFB6C1';
  const dobokWhite = '#FFFFFF';
  const dobokBorder = '#E5E5E5';
  const hairColor = '#4A4A4A';

  const renderPose = () => {
    switch (state) {
      case 'winner':
        return (
          <svg viewBox="0 0 100 140" className="w-full h-full">
            {/* Cabeça grande chibi */}
            <ellipse cx="50" cy="35" rx="28" ry="30" fill={skinColor} stroke={dobokBorder} strokeWidth="1.5"/>
            
            {/* Cabelo estilizado */}
            <ellipse cx="50" cy="18" rx="22" ry="12" fill={hairColor}/>
            <ellipse cx="35" cy="22" rx="8" ry="6" fill={hairColor}/>
            <ellipse cx="65" cy="22" rx="8" ry="6" fill={hairColor}/>
            
            {/* Olhos de estrela ★★ */}
            <text x="35" y="42" fontSize="14" fill={teamColor} textAnchor="middle">★</text>
            <text x="65" y="42" fontSize="14" fill={teamColor} textAnchor="middle">★</text>
            
            {/* Bochechas rosadas */}
            <ellipse cx="25" cy="45" rx="6" ry="4" fill={blushColor} opacity="0.7"/>
            <ellipse cx="75" cy="45" rx="6" ry="4" fill={blushColor} opacity="0.7"/>
            
            {/* Sorriso enorme */}
            <path d="M35 52 Q50 65 65 52" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
            <path d="M38 54 Q50 62 62 54" fill="#FF6B6B" opacity="0.3"/>
            
            {/* Corpo com dobok - posição de vitória */}
            <path d="M35 65 L32 105 L68 105 L65 65 Z" fill={dobokWhite} stroke={dobokBorder} strokeWidth="1.5"/>
            
            {/* Gola em V do dobok */}
            <path d="M35 65 L50 82 L65 65" fill="none" stroke={teamColor} strokeWidth="3"/>
            <path d="M38 67 L50 80 L62 67" fill={teamColorLight} opacity="0.3"/>
            
            {/* Hogu (protetor de tórax) */}
            <path d="M40 75 Q50 72 60 75 L60 98 Q50 102 40 98 Z" fill={teamColor} opacity="0.85" stroke={teamColor} strokeWidth="1"/>
            
            {/* Faixa */}
            <rect x="33" y="100" width="34" height="5" rx="2" fill={teamColor}/>
            <rect x="48" y="100" width="4" height="12" rx="1" fill={teamColor}/>
            
            {/* Calça ampla branca */}
            <path d="M34 105 L28 132 L42 132 L50 115 L58 132 L72 132 L66 105 Z" fill={dobokWhite} stroke={dobokBorder} strokeWidth="1"/>
            
            {/* Pezinhos descalços */}
            <ellipse cx="35" cy="135" rx="9" ry="5" fill={skinColor} stroke={dobokBorder} strokeWidth="0.5"/>
            <ellipse cx="65" cy="135" rx="9" ry="5" fill={skinColor} stroke={dobokBorder} strokeWidth="0.5"/>
            
            {/* Braços levantados em comemoração */}
            <path d="M35 70 Q20 60 15 45" stroke={dobokWhite} strokeWidth="12" strokeLinecap="round" fill="none"/>
            <path d="M65 70 Q80 60 85 45" stroke={dobokWhite} strokeWidth="12" strokeLinecap="round" fill="none"/>
            <path d="M35 70 Q20 60 15 45" stroke={dobokBorder} strokeWidth="12" strokeLinecap="round" fill="none" opacity="0.3"/>
            <path d="M65 70 Q80 60 85 45" stroke={dobokBorder} strokeWidth="12" strokeLinecap="round" fill="none" opacity="0.3"/>
            
            {/* Mãozinhas */}
            <circle cx="13" cy="42" r="8" fill={skinColor} stroke={dobokBorder} strokeWidth="0.5"/>
            <circle cx="87" cy="42" r="8" fill={skinColor} stroke={dobokBorder} strokeWidth="0.5"/>
            
            {/* Efeitos de brilho/alegria */}
            <text x="8" y="30" fontSize="10" fill={teamColor}>✦</text>
            <text x="88" y="30" fontSize="10" fill={teamColor}>✦</text>
          </svg>
        );

      case 'loser':
        return (
          <svg viewBox="0 0 100 140" className="w-full h-full">
            {/* Cabeça grande chibi - cabisbaixa */}
            <ellipse cx="50" cy="40" rx="28" ry="30" fill={skinColor} stroke={dobokBorder} strokeWidth="1.5"/>
            
            {/* Cabelo */}
            <ellipse cx="50" cy="22" rx="22" ry="12" fill={hairColor}/>
            <ellipse cx="35" cy="26" rx="8" ry="6" fill={hairColor}/>
            <ellipse cx="65" cy="26" rx="8" ry="6" fill={hairColor}/>
            
            {/* Olhos chorosos - fechados */}
            <path d="M32 42 Q38 38 44 42" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
            <path d="M56 42 Q62 38 68 42" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
            
            {/* Lágrimas */}
            <ellipse cx="30" cy="50" rx="3" ry="5" fill="#87CEEB" opacity="0.8"/>
            <ellipse cx="70" cy="50" rx="3" ry="5" fill="#87CEEB" opacity="0.8"/>
            <ellipse cx="28" cy="58" rx="2" ry="3" fill="#87CEEB" opacity="0.6"/>
            <ellipse cx="72" cy="58" rx="2" ry="3" fill="#87CEEB" opacity="0.6"/>
            
            {/* Bochechas rosadas */}
            <ellipse cx="25" cy="50" rx="6" ry="4" fill={blushColor} opacity="0.5"/>
            <ellipse cx="75" cy="50" rx="6" ry="4" fill={blushColor} opacity="0.5"/>
            
            {/* Boca triste */}
            <path d="M40 58 Q50 52 60 58" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
            
            {/* Corpo com dobok - curvado para baixo */}
            <path d="M35 70 L33 110 L67 110 L65 70 Z" fill={dobokWhite} stroke={dobokBorder} strokeWidth="1.5"/>
            
            {/* Gola em V */}
            <path d="M35 70 L50 87 L65 70" fill="none" stroke={teamColor} strokeWidth="3"/>
            
            {/* Hogu */}
            <path d="M40 80 Q50 77 60 80 L60 103 Q50 107 40 103 Z" fill={teamColor} opacity="0.7" stroke={teamColor} strokeWidth="1"/>
            
            {/* Faixa */}
            <rect x="34" y="105" width="32" height="5" rx="2" fill={teamColor}/>
            
            {/* Calça */}
            <path d="M35 110 L30 134 L44 134 L50 120 L56 134 L70 134 L65 110 Z" fill={dobokWhite} stroke={dobokBorder} strokeWidth="1"/>
            
            {/* Pezinhos */}
            <ellipse cx="37" cy="137" rx="9" ry="5" fill={skinColor} stroke={dobokBorder} strokeWidth="0.5"/>
            <ellipse cx="63" cy="137" rx="9" ry="5" fill={skinColor} stroke={dobokBorder} strokeWidth="0.5"/>
            
            {/* Braços caídos */}
            <path d="M35 75 Q25 90 22 105" stroke={dobokWhite} strokeWidth="11" strokeLinecap="round" fill="none"/>
            <path d="M65 75 Q75 90 78 105" stroke={dobokWhite} strokeWidth="11" strokeLinecap="round" fill="none"/>
            <path d="M35 75 Q25 90 22 105" stroke={dobokBorder} strokeWidth="11" strokeLinecap="round" fill="none" opacity="0.2"/>
            <path d="M65 75 Q75 90 78 105" stroke={dobokBorder} strokeWidth="11" strokeLinecap="round" fill="none" opacity="0.2"/>
            
            {/* Mãozinhas caídas */}
            <circle cx="20" cy="108" r="7" fill={skinColor} stroke={dobokBorder} strokeWidth="0.5"/>
            <circle cx="80" cy="108" r="7" fill={skinColor} stroke={dobokBorder} strokeWidth="0.5"/>
          </svg>
        );

      case 'ko':
        return (
          <svg viewBox="0 0 140 100" className="w-full h-full">
            {/* Corpo deitado - rotacionado */}
            <g transform="translate(20, 10)">
              {/* Cabeça */}
              <ellipse cx="20" cy="40" rx="22" ry="24" fill={skinColor} stroke={dobokBorder} strokeWidth="1.5"/>
              
              {/* Cabelo */}
              <ellipse cx="20" cy="24" rx="18" ry="10" fill={hairColor}/>
              
              {/* Olhos em espiral @@ */}
              <g transform="translate(12, 38)">
                <circle cx="0" cy="0" r="6" fill="white" stroke="#333" strokeWidth="1"/>
                <path d="M-2,-2 Q0,-4 2,-2 Q4,0 2,2 Q0,4 -2,2 Q-4,0 -2,-2" fill="none" stroke="#333" strokeWidth="1.5"/>
              </g>
              <g transform="translate(28, 38)">
                <circle cx="0" cy="0" r="6" fill="white" stroke="#333" strokeWidth="1"/>
                <path d="M-2,-2 Q0,-4 2,-2 Q4,0 2,2 Q0,4 -2,2 Q-4,0 -2,-2" fill="none" stroke="#333" strokeWidth="1.5"/>
              </g>
              
              {/* Boca KO */}
              <ellipse cx="20" cy="52" rx="5" ry="3" fill="#333"/>
              
              {/* Bochechas */}
              <ellipse cx="5" cy="45" rx="4" ry="3" fill={blushColor} opacity="0.5"/>
              <ellipse cx="35" cy="45" rx="4" ry="3" fill={blushColor} opacity="0.5"/>
              
              {/* Corpo deitado */}
              <path d="M42 30 L95 28 L97 55 L44 57 Z" fill={dobokWhite} stroke={dobokBorder} strokeWidth="1"/>
              
              {/* Gola */}
              <path d="M44 32 L55 42 L44 52" fill="none" stroke={teamColor} strokeWidth="2.5"/>
              
              {/* Hogu */}
              <path d="M50 35 Q55 32 60 35 L75 35 L75 52 L50 52 Z" fill={teamColor} opacity="0.6"/>
              
              {/* Faixa */}
              <rect x="75" y="35" width="5" height="20" rx="1" fill={teamColor}/>
              
              {/* Pernas */}
              <path d="M95 32 L115 30 L117 42 L95 44 Z" fill={dobokWhite} stroke={dobokBorder} strokeWidth="1"/>
              <path d="M95 46 L115 48 L117 60 L95 58 Z" fill={dobokWhite} stroke={dobokBorder} strokeWidth="1"/>
              
              {/* Pés */}
              <ellipse cx="118" cy="36" rx="5" ry="7" fill={skinColor}/>
              <ellipse cx="118" cy="54" rx="5" ry="7" fill={skinColor}/>
              
              {/* Braços caídos */}
              <path d="M50 28 L55 15" stroke={dobokWhite} strokeWidth="8" strokeLinecap="round"/>
              <path d="M65 57 L70 72" stroke={dobokWhite} strokeWidth="8" strokeLinecap="round"/>
              <circle cx="55" cy="12" r="5" fill={skinColor}/>
              <circle cx="70" cy="75" r="5" fill={skinColor}/>
            </g>
            
            {/* Estrelinhas ao redor */}
            <text x="15" y="20" fontSize="12" fill={teamColor}>★</text>
            <text x="50" y="12" fontSize="10" fill={teamColor}>★</text>
            <text x="5" y="55" fontSize="8" fill={teamColor}>★</text>
            <text x="35" y="85" fontSize="11" fill={teamColor}>✦</text>
          </svg>
        );

      case 'attacking':
        return (
          <svg viewBox="0 0 120 140" className="w-full h-full">
            {/* Cabeça chibi */}
            <ellipse cx="40" cy="35" rx="28" ry="30" fill={skinColor} stroke={dobokBorder} strokeWidth="1.5"/>
            
            {/* Cabelo */}
            <ellipse cx="40" cy="18" rx="22" ry="12" fill={hairColor}/>
            <ellipse cx="25" cy="22" rx="8" ry="6" fill={hairColor}/>
            <ellipse cx="55" cy="22" rx="8" ry="6" fill={hairColor}/>
            
            {/* Olhos fechados de esforço */}
            <path d="M25 38 L37 42" stroke="#333" strokeWidth="3" strokeLinecap="round"/>
            <path d="M43 42 L55 38" stroke="#333" strokeWidth="3" strokeLinecap="round"/>
            
            {/* Bochechas */}
            <ellipse cx="18" cy="45" rx="6" ry="4" fill={blushColor} opacity="0.7"/>
            <ellipse cx="62" cy="45" rx="6" ry="4" fill={blushColor} opacity="0.7"/>
            
            {/* Boca determinada */}
            <path d="M30 52 L50 52" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
            <path d="M33 55 L47 55" stroke="#333" strokeWidth="1.5" strokeLinecap="round"/>
            
            {/* Corpo inclinado - chute */}
            <path d="M27 65 L23 105 L57 105 L53 65 Z" fill={dobokWhite} stroke={dobokBorder} strokeWidth="1.5"/>
            
            {/* Gola em V */}
            <path d="M27 65 L40 82 L53 65" fill="none" stroke={teamColor} strokeWidth="3"/>
            <path d="M30 67 L40 80 L50 67" fill={teamColorLight} opacity="0.3"/>
            
            {/* Hogu */}
            <path d="M31 75 Q40 72 50 75 L50 98 Q40 102 31 98 Z" fill={teamColor} opacity="0.85"/>
            
            {/* Faixa */}
            <rect x="24" y="100" width="32" height="5" rx="2" fill={teamColor}/>
            
            {/* Perna de apoio */}
            <path d="M27 105 L23 132 L37 132 L40 110 Z" fill={dobokWhite} stroke={dobokBorder} strokeWidth="1"/>
            <ellipse cx="30" cy="135" rx="9" ry="5" fill={skinColor}/>
            
            {/* Perna chutando - dollyo chagi */}
            <path d="M50 100 L95 75" stroke={dobokWhite} strokeWidth="14" strokeLinecap="round"/>
            <path d="M50 100 L95 75" stroke={dobokBorder} strokeWidth="14" strokeLinecap="round" opacity="0.2"/>
            <ellipse cx="100" cy="72" rx="10" ry="6" fill={skinColor} stroke={dobokBorder} strokeWidth="0.5"/>
            
            {/* Braços em guarda */}
            <path d="M27 72 Q13 68 7 78" stroke={dobokWhite} strokeWidth="11" strokeLinecap="round"/>
            <path d="M53 72 Q60 60 55 50" stroke={dobokWhite} strokeWidth="11" strokeLinecap="round"/>
            <path d="M27 72 Q13 68 7 78" stroke={dobokBorder} strokeWidth="11" strokeLinecap="round" opacity="0.2"/>
            <path d="M53 72 Q60 60 55 50" stroke={dobokBorder} strokeWidth="11" strokeLinecap="round" opacity="0.2"/>
            <circle cx="5" cy="80" r="7" fill={skinColor}/>
            <circle cx="53" cy="48" r="7" fill={skinColor}/>
            
            {/* Efeito de velocidade */}
            <path d="M85 85 L105 80" stroke={teamColor} strokeWidth="2" opacity="0.6"/>
            <path d="M88 90 L105 87" stroke={teamColor} strokeWidth="1.5" opacity="0.4"/>
            <path d="M82 80 L98 75" stroke={teamColor} strokeWidth="1" opacity="0.3"/>
          </svg>
        );

      case 'hit':
        return (
          <svg viewBox="0 0 100 140" className="w-full h-full">
            {/* Cabeça chibi - inclinada para trás */}
            <ellipse cx="55" cy="38" rx="28" ry="30" fill={skinColor} stroke={dobokBorder} strokeWidth="1.5"/>
            
            {/* Cabelo */}
            <ellipse cx="55" cy="20" rx="22" ry="12" fill={hairColor}/>
            <ellipse cx="40" cy="24" rx="8" ry="6" fill={hairColor}/>
            <ellipse cx="70" cy="24" rx="8" ry="6" fill={hairColor}/>
            
            {/* Olhos em X */}
            <g transform="translate(42, 38)">
              <line x1="-5" y1="-5" x2="5" y2="5" stroke="#333" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="5" y1="-5" x2="-5" y2="5" stroke="#333" strokeWidth="2.5" strokeLinecap="round"/>
            </g>
            <g transform="translate(68, 38)">
              <line x1="-5" y1="-5" x2="5" y2="5" stroke="#333" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="5" y1="-5" x2="-5" y2="5" stroke="#333" strokeWidth="2.5" strokeLinecap="round"/>
            </g>
            
            {/* Lágrimas de dor */}
            <ellipse cx="35" cy="48" rx="3" ry="4" fill="#87CEEB" opacity="0.7"/>
            <ellipse cx="80" cy="48" rx="3" ry="4" fill="#87CEEB" opacity="0.7"/>
            
            {/* Bochechas */}
            <ellipse cx="30" cy="48" rx="6" ry="4" fill={blushColor} opacity="0.6"/>
            <ellipse cx="80" cy="48" rx="6" ry="4" fill={blushColor} opacity="0.6"/>
            
            {/* Boca aberta "O" */}
            <ellipse cx="55" cy="55" rx="8" ry="6" fill="#333"/>
            <ellipse cx="55" cy="54" rx="5" ry="3" fill="#FF6B6B" opacity="0.5"/>
            
            {/* Corpo cambaleando */}
            <path d="M40 68 L38 108 L72 108 L70 68 Z" fill={dobokWhite} stroke={dobokBorder} strokeWidth="1.5"/>
            
            {/* Gola */}
            <path d="M40 68 L55 85 L70 68" fill="none" stroke={teamColor} strokeWidth="3"/>
            <path d="M43 70 L55 83 L67 70" fill={teamColorLight} opacity="0.3"/>
            
            {/* Hogu */}
            <path d="M44 78 Q55 75 66 78 L66 101 Q55 105 44 101 Z" fill={teamColor} opacity="0.7"/>
            
            {/* Faixa */}
            <rect x="39" y="103" width="32" height="5" rx="2" fill={teamColor}/>
            
            {/* Pernas cambaleando */}
            <path d="M40 108 L32 134 L46 134 L52 118 L58 134 L72 134 L68 108 Z" fill={dobokWhite} stroke={dobokBorder} strokeWidth="1"/>
            <ellipse cx="39" cy="137" rx="9" ry="5" fill={skinColor}/>
            <ellipse cx="65" cy="137" rx="9" ry="5" fill={skinColor}/>
            
            {/* Braços abertos - desequilíbrio */}
            <path d="M40 75 Q20 70 10 85" stroke={dobokWhite} strokeWidth="11" strokeLinecap="round"/>
            <path d="M70 75 Q85 65 95 75" stroke={dobokWhite} strokeWidth="11" strokeLinecap="round"/>
            <path d="M40 75 Q20 70 10 85" stroke={dobokBorder} strokeWidth="11" strokeLinecap="round" opacity="0.2"/>
            <path d="M70 75 Q85 65 95 75" stroke={dobokBorder} strokeWidth="11" strokeLinecap="round" opacity="0.2"/>
            <circle cx="8" cy="88" r="7" fill={skinColor}/>
            <circle cx="97" cy="77" r="7" fill={skinColor}/>
            
            {/* Efeito de impacto */}
            <text x="15" y="30" fontSize="14" fill="#FFD700">✦</text>
            <text x="85" y="25" fontSize="10" fill="#FFD700">✦</text>
          </svg>
        );

      default: // idle
        return (
          <svg viewBox="0 0 100 140" className="w-full h-full">
            {/* Cabeça grande chibi */}
            <ellipse cx="50" cy="35" rx="28" ry="30" fill={skinColor} stroke={dobokBorder} strokeWidth="1.5"/>
            
            {/* Cabelo estilizado */}
            <ellipse cx="50" cy="18" rx="22" ry="12" fill={hairColor}/>
            <ellipse cx="35" cy="22" rx="8" ry="6" fill={hairColor}/>
            <ellipse cx="65" cy="22" rx="8" ry="6" fill={hairColor}/>
            
            {/* Olhos grandes brilhantes */}
            <ellipse cx="38" cy="38" rx="9" ry="11" fill="white" stroke="#333" strokeWidth="0.5"/>
            <ellipse cx="62" cy="38" rx="9" ry="11" fill="white" stroke="#333" strokeWidth="0.5"/>
            <circle cx="40" cy="40" r="5" fill="#333"/>
            <circle cx="64" cy="40" r="5" fill="#333"/>
            {/* Brilho nos olhos */}
            <circle cx="37" cy="36" r="2.5" fill="white"/>
            <circle cx="61" cy="36" r="2.5" fill="white"/>
            <circle cx="42" cy="42" r="1.5" fill="white"/>
            <circle cx="66" cy="42" r="1.5" fill="white"/>
            
            {/* Bochechas rosadas */}
            <ellipse cx="25" cy="45" rx="6" ry="4" fill={blushColor} opacity="0.6"/>
            <ellipse cx="75" cy="45" rx="6" ry="4" fill={blushColor} opacity="0.6"/>
            
            {/* Sorriso fofo */}
            <path d="M42 52 Q50 58 58 52" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
            
            {/* Corpo com dobok */}
            <path d="M35 65 L32 108 L68 108 L65 65 Z" fill={dobokWhite} stroke={dobokBorder} strokeWidth="1.5"/>
            
            {/* Gola em V do dobok */}
            <path d="M35 65 L50 82 L65 65" fill="none" stroke={teamColor} strokeWidth="3"/>
            <path d="M38 67 L50 80 L62 67" fill={teamColorLight} opacity="0.3"/>
            
            {/* Hogu (protetor de tórax) */}
            <path d="M40 75 Q50 72 60 75 L60 100 Q50 104 40 100 Z" fill={teamColor} opacity="0.85" stroke={teamColor} strokeWidth="1"/>
            
            {/* Emblema no hogu */}
            <circle cx="50" cy="87" r="5" fill="white" opacity="0.4"/>
            
            {/* Faixa */}
            <rect x="33" y="103" width="34" height="5" rx="2" fill={teamColor}/>
            <rect x="48" y="103" width="4" height="10" rx="1" fill={teamColor}/>
            
            {/* Calça ampla branca */}
            <path d="M34 108 L28 134 L44 134 L50 118 L56 134 L72 134 L66 108 Z" fill={dobokWhite} stroke={dobokBorder} strokeWidth="1"/>
            
            {/* Pezinhos descalços */}
            <ellipse cx="36" cy="137" rx="10" ry="5" fill={skinColor} stroke={dobokBorder} strokeWidth="0.5"/>
            <ellipse cx="64" cy="137" rx="10" ry="5" fill={skinColor} stroke={dobokBorder} strokeWidth="0.5"/>
            {/* Dedinhos */}
            <ellipse cx="30" cy="137" rx="2" ry="1.5" fill={skinColor}/>
            <ellipse cx="70" cy="137" rx="2" ry="1.5" fill={skinColor}/>
            
            {/* Braços em posição de guarda */}
            <path d="M35 72 Q22 68 18 80" stroke={dobokWhite} strokeWidth="12" strokeLinecap="round" fill="none"/>
            <path d="M65 72 Q78 68 82 80" stroke={dobokWhite} strokeWidth="12" strokeLinecap="round" fill="none"/>
            <path d="M35 72 Q22 68 18 80" stroke={dobokBorder} strokeWidth="12" strokeLinecap="round" fill="none" opacity="0.2"/>
            <path d="M65 72 Q78 68 82 80" stroke={dobokBorder} strokeWidth="12" strokeLinecap="round" fill="none" opacity="0.2"/>
            
            {/* Punhos */}
            <circle cx="16" cy="83" r="8" fill={skinColor} stroke={dobokBorder} strokeWidth="0.5"/>
            <circle cx="84" cy="83" r="8" fill={skinColor} stroke={dobokBorder} strokeWidth="0.5"/>
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
        isBlue && state !== 'ko' && '-scale-x-100',
        'transition-all duration-150',
        className
      )}
    >
      {renderPose()}
    </div>
  );
}
