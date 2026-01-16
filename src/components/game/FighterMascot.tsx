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

  // Removed drop-shadow for better performance on weaker devices
  const glowColor = '';

  // Cores do tigre
  const tigerOrange = '#F5A623';
  const tigerStripes = '#111111';
  const tigerWhite = '#FFFFFF';
  const tigerNose = '#333333';
  const tigerCheeks = '#FF9999';
  const pawPads = '#333333';
  const earPink = '#FFB6C1';

  // Cores do dobok
  const teamColor = side === 'red' ? '#ef4444' : '#3b82f6';
  const teamColorLight = side === 'red' ? '#fca5a5' : '#93c5fd';
  const dobokWhite = '#FFFFFF';
  const dobokBorder = '#E5E5E5';
  const beltColor = '#111111';

  const renderPose = () => {
    switch (state) {
      case 'winner':
        return (
          <svg viewBox="0 0 100 140" className="w-full h-full">
            {/* Sombra no chão */}
            <ellipse cx="50" cy="136" rx="22" ry="5" fill="#000" opacity="0.15"/>
            
            {/* Confetti sparks */}
            <path d="M50 2v8" stroke={teamColor} strokeWidth="3" strokeLinecap="round" />
            <path d="M38 6l4 6" stroke={teamColor} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M62 6l-4 6" stroke={teamColor} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="30" cy="10" r="2" fill={teamColor} />
            <circle cx="70" cy="10" r="2" fill={teamColor} />
            
            {/* CABEÇA DO TIGRE */}
            <circle cx="50" cy="40" r="30" fill={tigerOrange} stroke="#111" strokeWidth="3"/>
            
            {/* Orelhas */}
            <ellipse cx="26" cy="16" rx="10" ry="10" fill={tigerOrange} stroke="#111" strokeWidth="2.5"/>
            <ellipse cx="26" cy="16" rx="5" ry="5" fill={earPink}/>
            <ellipse cx="74" cy="16" rx="10" ry="10" fill={tigerOrange} stroke="#111" strokeWidth="2.5"/>
            <ellipse cx="74" cy="16" rx="5" ry="5" fill={earPink}/>
            
            {/* Listras da testa */}
            <path d="M50 15 L50 26" stroke="#111" strokeWidth="4" strokeLinecap="round"/>
            <path d="M40 18 L44 28" stroke="#111" strokeWidth="3" strokeLinecap="round"/>
            <path d="M60 18 L56 28" stroke="#111" strokeWidth="3" strokeLinecap="round"/>
            
            {/* Área branca do focinho */}
            <ellipse cx="50" cy="52" rx="16" ry="12" fill="#FFF"/>
            
            {/* Olhos felizes (arcos) */}
            <path d="M34 40 Q40 32 46 40" stroke="#111" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <path d="M54 40 Q60 32 66 40" stroke="#111" strokeWidth="3" fill="none" strokeLinecap="round"/>
            
            {/* Nariz */}
            <ellipse cx="50" cy="48" rx="5" ry="4" fill={tigerNose}/>
            
            {/* Sorriso grande */}
            <path d="M42 56 Q50 64 58 56" stroke="#111" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            
            {/* Bochechas rosadas */}
            <ellipse cx="28" cy="48" rx="6" ry="5" fill={tigerCheeks} opacity="0.6"/>
            <ellipse cx="72" cy="48" rx="6" ry="5" fill={tigerCheeks} opacity="0.6"/>
            
            {/* CORPO - Dobok */}
            <path d="M35 70 L32 108 L68 108 L65 70 Z" fill={dobokWhite} stroke="#111" strokeWidth="2.5"/>
            
            {/* Gola em V */}
            <path d="M35 70 L50 86 L65 70" fill="none" stroke="#111" strokeWidth="2"/>
            
            {/* Hogu (protetor) */}
            <rect x="37" y="78" width="26" height="26" rx="4" fill={teamColor} stroke="#111" strokeWidth="2"/>
            
            {/* Faixa PRETA */}
            <rect x="33" y="104" width="34" height="6" rx="2" fill={beltColor}/>
            <rect x="48" y="102" width="4" height="10" fill={beltColor}/>
            
            {/* Calça */}
            <path d="M34 110 L28 134 L44 134 L50 118 L56 134 L72 134 L66 110 Z" fill={dobokWhite} stroke="#111" strokeWidth="2"/>
            
            {/* Patas/Pés */}
            <ellipse cx="36" cy="136" rx="10" ry="5" fill={tigerOrange} stroke="#111" strokeWidth="2"/>
            <circle cx="32" cy="135" r="2" fill={pawPads}/>
            <circle cx="36" cy="134" r="2" fill={pawPads}/>
            <circle cx="40" cy="135" r="2" fill={pawPads}/>
            
            <ellipse cx="64" cy="136" rx="10" ry="5" fill={tigerOrange} stroke="#111" strokeWidth="2"/>
            <circle cx="60" cy="135" r="2" fill={pawPads}/>
            <circle cx="64" cy="134" r="2" fill={pawPads}/>
            <circle cx="68" cy="135" r="2" fill={pawPads}/>
            
            {/* Braços levantados */}
            <path d="M35 80 L18 55" stroke={dobokWhite} strokeWidth="10" strokeLinecap="round"/>
            <path d="M35 80 L18 55" stroke="#DDD" strokeWidth="10" strokeLinecap="round" opacity="0.3"/>
            <circle cx="16" cy="52" r="10" fill={tigerOrange} stroke="#111" strokeWidth="2"/>
            <circle cx="12" cy="49" r="2.5" fill={pawPads}/>
            <circle cx="16" cy="47" r="2.5" fill={pawPads}/>
            <circle cx="20" cy="49" r="2.5" fill={pawPads}/>
            <ellipse cx="16" cy="54" rx="4" ry="3" fill={pawPads}/>
            
            <path d="M65 80 L82 55" stroke={dobokWhite} strokeWidth="10" strokeLinecap="round"/>
            <path d="M65 80 L82 55" stroke="#DDD" strokeWidth="10" strokeLinecap="round" opacity="0.3"/>
            <circle cx="84" cy="52" r="10" fill={tigerOrange} stroke="#111" strokeWidth="2"/>
            <circle cx="80" cy="49" r="2.5" fill={pawPads}/>
            <circle cx="84" cy="47" r="2.5" fill={pawPads}/>
            <circle cx="88" cy="49" r="2.5" fill={pawPads}/>
            <ellipse cx="84" cy="54" rx="4" ry="3" fill={pawPads}/>
          </svg>
        );

      case 'loser':
        return (
          <svg viewBox="0 0 100 140" className="w-full h-full">
            {/* Sombra no chão */}
            <ellipse cx="50" cy="136" rx="22" ry="5" fill="#000" opacity="0.15"/>
            
            {/* CABEÇA DO TIGRE - cabisbaixa */}
            <circle cx="50" cy="42" r="30" fill={tigerOrange} stroke="#111" strokeWidth="3"/>
            
            {/* Orelhas caídas */}
            <ellipse cx="26" cy="22" rx="10" ry="8" fill={tigerOrange} stroke="#111" strokeWidth="2.5" transform="rotate(-15 26 22)"/>
            <ellipse cx="26" cy="22" rx="5" ry="4" fill={earPink} transform="rotate(-15 26 22)"/>
            <ellipse cx="74" cy="22" rx="10" ry="8" fill={tigerOrange} stroke="#111" strokeWidth="2.5" transform="rotate(15 74 22)"/>
            <ellipse cx="74" cy="22" rx="5" ry="4" fill={earPink} transform="rotate(15 74 22)"/>
            
            {/* Listras da testa */}
            <path d="M50 20 L50 30" stroke="#111" strokeWidth="4" strokeLinecap="round"/>
            <path d="M40 22 L44 32" stroke="#111" strokeWidth="3" strokeLinecap="round"/>
            <path d="M60 22 L56 32" stroke="#111" strokeWidth="3" strokeLinecap="round"/>
            
            {/* Área branca do focinho */}
            <ellipse cx="50" cy="54" rx="16" ry="12" fill="#FFF"/>
            
            {/* Olhos tristes (arcos para baixo) */}
            <path d="M34 42 Q40 48 46 42" stroke="#111" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <path d="M54 42 Q60 48 66 42" stroke="#111" strokeWidth="3" fill="none" strokeLinecap="round"/>
            
            {/* Lágrimas */}
            <ellipse cx="30" cy="50" rx="3" ry="5" fill="#87CEEB" opacity="0.8"/>
            <ellipse cx="70" cy="50" rx="3" ry="5" fill="#87CEEB" opacity="0.8"/>
            <ellipse cx="28" cy="58" rx="2" ry="3" fill="#87CEEB" opacity="0.6"/>
            <ellipse cx="72" cy="58" rx="2" ry="3" fill="#87CEEB" opacity="0.6"/>
            
            {/* Nariz */}
            <ellipse cx="50" cy="50" rx="5" ry="4" fill={tigerNose}/>
            
            {/* Boca triste */}
            <path d="M42 60 Q50 54 58 60" stroke="#111" strokeWidth="2" fill="none" strokeLinecap="round"/>
            
            {/* Bochechas rosadas */}
            <ellipse cx="28" cy="52" rx="6" ry="5" fill={tigerCheeks} opacity="0.5"/>
            <ellipse cx="72" cy="52" rx="6" ry="5" fill={tigerCheeks} opacity="0.5"/>
            
            {/* CORPO - Dobok */}
            <path d="M35 72 L33 108 L67 108 L65 72 Z" fill={dobokWhite} stroke="#111" strokeWidth="2.5"/>
            
            {/* Gola em V */}
            <path d="M35 72 L50 88 L65 72" fill="none" stroke="#111" strokeWidth="2"/>
            
            {/* Hogu */}
            <rect x="38" y="80" width="24" height="24" rx="4" fill={teamColor} opacity="0.7" stroke="#111" strokeWidth="1.5"/>
            
            {/* Faixa PRETA */}
            <rect x="34" y="104" width="32" height="6" rx="2" fill={beltColor}/>
            
            {/* Calça */}
            <path d="M35 110 L30 134 L44 134 L50 120 L56 134 L70 134 L65 110 Z" fill={dobokWhite} stroke="#111" strokeWidth="2"/>
            
            {/* Patas/Pés */}
            <ellipse cx="37" cy="137" rx="9" ry="4.5" fill={tigerOrange} stroke="#111" strokeWidth="1.5"/>
            <ellipse cx="63" cy="137" rx="9" ry="4.5" fill={tigerOrange} stroke="#111" strokeWidth="1.5"/>
            
            {/* Braços caídos */}
            <path d="M35 78 Q25 95 22 110" stroke={dobokWhite} strokeWidth="10" strokeLinecap="round"/>
            <path d="M65 78 Q75 95 78 110" stroke={dobokWhite} strokeWidth="10" strokeLinecap="round"/>
            <path d="M35 78 Q25 95 22 110" stroke="#DDD" strokeWidth="10" strokeLinecap="round" opacity="0.3"/>
            <path d="M65 78 Q75 95 78 110" stroke="#DDD" strokeWidth="10" strokeLinecap="round" opacity="0.3"/>
            
            {/* Patas caídas */}
            <circle cx="20" cy="113" r="8" fill={tigerOrange} stroke="#111" strokeWidth="2"/>
            <circle cx="80" cy="113" r="8" fill={tigerOrange} stroke="#111" strokeWidth="2"/>
          </svg>
        );

      case 'ko':
        return (
          <svg viewBox="0 0 140 100" className="w-full h-full">
            {/* Corpo deitado */}
            <g transform="translate(15, 8)">
              {/* Sombra */}
              <ellipse cx="60" cy="88" rx="45" ry="6" fill="#000" opacity="0.12"/>
              
              {/* CABEÇA DO TIGRE */}
              <circle cx="22" cy="42" r="26" fill={tigerOrange} stroke="#111" strokeWidth="3"/>
              
              {/* Orelhas */}
              <ellipse cx="6" cy="22" rx="8" ry="8" fill={tigerOrange} stroke="#111" strokeWidth="2"/>
              <ellipse cx="6" cy="22" rx="4" ry="4" fill={earPink}/>
              <ellipse cx="38" cy="22" rx="8" ry="8" fill={tigerOrange} stroke="#111" strokeWidth="2"/>
              <ellipse cx="38" cy="22" rx="4" ry="4" fill={earPink}/>
              
              {/* Listras */}
              <path d="M22 20 L22 30" stroke="#111" strokeWidth="3" strokeLinecap="round"/>
              <path d="M14 22 L17 30" stroke="#111" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M30 22 L27 30" stroke="#111" strokeWidth="2.5" strokeLinecap="round"/>
              
              {/* Área branca */}
              <ellipse cx="22" cy="52" rx="12" ry="10" fill="#FFF"/>
              
              {/* Olhos em espiral */}
              <g transform="translate(14, 40)">
                <circle cx="0" cy="0" r="6" fill="white" stroke="#333" strokeWidth="1.5"/>
                <path d="M-2,-2 Q0,-4 2,-2 Q4,0 2,2 Q0,4 -2,2 Q-4,0 -2,-2" fill="none" stroke="#333" strokeWidth="1.5"/>
              </g>
              <g transform="translate(30, 40)">
                <circle cx="0" cy="0" r="6" fill="white" stroke="#333" strokeWidth="1.5"/>
                <path d="M-2,-2 Q0,-4 2,-2 Q4,0 2,2 Q0,4 -2,2 Q-4,0 -2,-2" fill="none" stroke="#333" strokeWidth="1.5"/>
              </g>
              
              {/* Nariz */}
              <ellipse cx="22" cy="50" rx="4" ry="3" fill={tigerNose}/>
              
              {/* Língua para fora */}
              <ellipse cx="22" cy="60" rx="5" ry="4" fill="#FF6B8A"/>
              <path d="M19 56 Q22 62 25 56" stroke="#111" strokeWidth="1.5" fill="none"/>
              
              {/* Bochechas */}
              <ellipse cx="6" cy="48" rx="4" ry="3" fill={tigerCheeks} opacity="0.5"/>
              <ellipse cx="38" cy="48" rx="4" ry="3" fill={tigerCheeks} opacity="0.5"/>
              
              {/* Corpo deitado */}
              <path d="M48 32 L100 30 L102 58 L50 60 Z" fill={dobokWhite} stroke="#111" strokeWidth="2"/>
              
              {/* Gola */}
              <path d="M50 34 L60 45 L50 56" fill="none" stroke="#111" strokeWidth="2"/>
              
              {/* Hogu */}
              <rect x="55" y="36" width="22" height="20" rx="3" fill={teamColor} opacity="0.6"/>
              
              {/* Faixa */}
              <rect x="78" y="36" width="5" height="20" rx="1" fill={beltColor}/>
              
              {/* Pernas */}
              <path d="M100 34 L118 32 L120 44 L100 46 Z" fill={dobokWhite} stroke="#111" strokeWidth="1.5"/>
              <path d="M100 48 L118 50 L120 62 L100 60 Z" fill={dobokWhite} stroke="#111" strokeWidth="1.5"/>
              
              {/* Pés */}
              <ellipse cx="122" cy="38" rx="5" ry="7" fill={tigerOrange} stroke="#111" strokeWidth="1.5"/>
              <ellipse cx="122" cy="56" rx="5" ry="7" fill={tigerOrange} stroke="#111" strokeWidth="1.5"/>
              
              {/* Braços/Patas caídos */}
              <path d="M55 30 L58 18" stroke={dobokWhite} strokeWidth="8" strokeLinecap="round"/>
              <path d="M70 60 L73 75" stroke={dobokWhite} strokeWidth="8" strokeLinecap="round"/>
              <circle cx="58" cy="14" r="6" fill={tigerOrange} stroke="#111" strokeWidth="1.5"/>
              <circle cx="73" cy="78" r="6" fill={tigerOrange} stroke="#111" strokeWidth="1.5"/>
            </g>
            
            {/* Estrelinhas ao redor */}
            <text x="12" y="22" fontSize="12" fill={teamColor}>★</text>
            <text x="48" y="14" fontSize="10" fill={teamColor}>★</text>
            <text x="5" y="55" fontSize="8" fill={teamColor}>★</text>
            <text x="32" y="88" fontSize="11" fill={teamColor}>✦</text>
          </svg>
        );

      case 'attacking':
        return (
          <svg viewBox="0 0 120 140" className="w-full h-full">
            {/* Sombra no chão */}
            <ellipse cx="45" cy="136" rx="18" ry="4" fill="#000" opacity="0.15"/>
            
            {/* CABEÇA DO TIGRE */}
            <circle cx="38" cy="38" r="28" fill={tigerOrange} stroke="#111" strokeWidth="3"/>
            
            {/* Orelhas */}
            <ellipse cx="16" cy="16" rx="9" ry="9" fill={tigerOrange} stroke="#111" strokeWidth="2.5"/>
            <ellipse cx="16" cy="16" rx="4.5" ry="4.5" fill={earPink}/>
            <ellipse cx="60" cy="16" rx="9" ry="9" fill={tigerOrange} stroke="#111" strokeWidth="2.5"/>
            <ellipse cx="60" cy="16" rx="4.5" ry="4.5" fill={earPink}/>
            
            {/* Listras da testa */}
            <path d="M38 15 L38 26" stroke="#111" strokeWidth="3.5" strokeLinecap="round"/>
            <path d="M28 17 L32 27" stroke="#111" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M48 17 L44 27" stroke="#111" strokeWidth="2.5" strokeLinecap="round"/>
            
            {/* Área branca do focinho */}
            <ellipse cx="38" cy="50" rx="14" ry="11" fill="#FFF"/>
            
            {/* Olhos fechados de esforço */}
            <path d="M24 38 L34 42" stroke="#111" strokeWidth="3" strokeLinecap="round"/>
            <path d="M42 42 L52 38" stroke="#111" strokeWidth="3" strokeLinecap="round"/>
            
            {/* Nariz */}
            <ellipse cx="38" cy="46" rx="4" ry="3" fill={tigerNose}/>
            
            {/* Boca determinada com dentes */}
            <path d="M30 54 L46 54" stroke="#111" strokeWidth="2" strokeLinecap="round"/>
            <rect x="32" y="54" width="3" height="3" fill="#FFF"/>
            <rect x="41" y="54" width="3" height="3" fill="#FFF"/>
            
            {/* Bochechas */}
            <ellipse cx="18" cy="46" rx="5" ry="4" fill={tigerCheeks} opacity="0.7"/>
            <ellipse cx="58" cy="46" rx="5" ry="4" fill={tigerCheeks} opacity="0.7"/>
            
            {/* CORPO inclinado - chute */}
            <path d="M26 66 L22 105 L56 105 L52 66 Z" fill={dobokWhite} stroke="#111" strokeWidth="2.5"/>
            
            {/* Gola em V */}
            <path d="M26 66 L38 82 L52 66" fill="none" stroke="#111" strokeWidth="2"/>
            
            {/* Hogu */}
            <rect x="28" y="74" width="22" height="26" rx="4" fill={teamColor} stroke="#111" strokeWidth="2"/>
            
            {/* Faixa */}
            <rect x="23" y="100" width="32" height="5" rx="2" fill={beltColor}/>
            
            {/* Perna de apoio */}
            <path d="M26 105 L22 132 L36 132 L40 110 Z" fill={dobokWhite} stroke="#111" strokeWidth="2"/>
            <ellipse cx="29" cy="135" rx="9" ry="4.5" fill={tigerOrange} stroke="#111" strokeWidth="2"/>
            <circle cx="25" cy="134" r="2" fill={pawPads}/>
            <circle cx="29" cy="133" r="2" fill={pawPads}/>
            <circle cx="33" cy="134" r="2" fill={pawPads}/>
            
            {/* Perna chutando - dollyo chagi */}
            <path d="M50 100 L95 75" stroke={dobokWhite} strokeWidth="14" strokeLinecap="round"/>
            <path d="M50 100 L95 75" stroke="#DDD" strokeWidth="14" strokeLinecap="round" opacity="0.3"/>
            <ellipse cx="100" cy="72" rx="10" ry="6" fill={tigerOrange} stroke="#111" strokeWidth="2"/>
            <circle cx="96" cy="70" r="2" fill={pawPads}/>
            <circle cx="100" cy="69" r="2" fill={pawPads}/>
            <circle cx="104" cy="70" r="2" fill={pawPads}/>
            
            {/* Braços em guarda */}
            <path d="M26 72 Q12 68 6 78" stroke={dobokWhite} strokeWidth="10" strokeLinecap="round"/>
            <path d="M52 72 Q58 60 54 50" stroke={dobokWhite} strokeWidth="10" strokeLinecap="round"/>
            <path d="M26 72 Q12 68 6 78" stroke="#DDD" strokeWidth="10" strokeLinecap="round" opacity="0.3"/>
            <path d="M52 72 Q58 60 54 50" stroke="#DDD" strokeWidth="10" strokeLinecap="round" opacity="0.3"/>
            
            {/* Patas em guarda */}
            <circle cx="4" cy="80" r="8" fill={tigerOrange} stroke="#111" strokeWidth="2"/>
            <circle cx="0" cy="77" r="2" fill={pawPads}/>
            <circle cx="4" cy="75" r="2" fill={pawPads}/>
            <circle cx="8" cy="77" r="2" fill={pawPads}/>
            
            <circle cx="52" cy="48" r="8" fill={tigerOrange} stroke="#111" strokeWidth="2"/>
            <circle cx="48" cy="45" r="2" fill={pawPads}/>
            <circle cx="52" cy="43" r="2" fill={pawPads}/>
            <circle cx="56" cy="45" r="2" fill={pawPads}/>
            
            {/* Efeito de velocidade */}
            <path d="M85 85 L105 80" stroke={teamColor} strokeWidth="2" opacity="0.6"/>
            <path d="M88 90 L105 87" stroke={teamColor} strokeWidth="1.5" opacity="0.4"/>
            <path d="M82 80 L98 75" stroke={teamColor} strokeWidth="1" opacity="0.3"/>
          </svg>
        );

      case 'hit':
        return (
          <svg viewBox="0 0 100 140" className="w-full h-full">
            {/* Sombra no chão */}
            <ellipse cx="55" cy="136" rx="20" ry="4" fill="#000" opacity="0.15"/>
            
            {/* CABEÇA DO TIGRE - inclinada para trás */}
            <circle cx="55" cy="38" r="28" fill={tigerOrange} stroke="#111" strokeWidth="3"/>
            
            {/* Orelhas */}
            <ellipse cx="33" cy="16" rx="9" ry="9" fill={tigerOrange} stroke="#111" strokeWidth="2.5"/>
            <ellipse cx="33" cy="16" rx="4.5" ry="4.5" fill={earPink}/>
            <ellipse cx="77" cy="16" rx="9" ry="9" fill={tigerOrange} stroke="#111" strokeWidth="2.5"/>
            <ellipse cx="77" cy="16" rx="4.5" ry="4.5" fill={earPink}/>
            
            {/* Listras da testa */}
            <path d="M55 14 L55 25" stroke="#111" strokeWidth="3.5" strokeLinecap="round"/>
            <path d="M45 16 L49 26" stroke="#111" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M65 16 L61 26" stroke="#111" strokeWidth="2.5" strokeLinecap="round"/>
            
            {/* Área branca do focinho */}
            <ellipse cx="55" cy="50" rx="14" ry="11" fill="#FFF"/>
            
            {/* Olhos em X */}
            <g transform="translate(43, 36)">
              <line x1="-5" y1="-5" x2="5" y2="5" stroke="#333" strokeWidth="3" strokeLinecap="round"/>
              <line x1="5" y1="-5" x2="-5" y2="5" stroke="#333" strokeWidth="3" strokeLinecap="round"/>
            </g>
            <g transform="translate(67, 36)">
              <line x1="-5" y1="-5" x2="5" y2="5" stroke="#333" strokeWidth="3" strokeLinecap="round"/>
              <line x1="5" y1="-5" x2="-5" y2="5" stroke="#333" strokeWidth="3" strokeLinecap="round"/>
            </g>
            
            {/* Lágrimas de dor */}
            <ellipse cx="32" cy="44" rx="3" ry="4" fill="#87CEEB" opacity="0.7"/>
            <ellipse cx="78" cy="44" rx="3" ry="4" fill="#87CEEB" opacity="0.7"/>
            
            {/* Nariz */}
            <ellipse cx="55" cy="46" rx="4" ry="3" fill={tigerNose}/>
            
            {/* Boca aberta "O" */}
            <ellipse cx="55" cy="56" rx="7" ry="5" fill="#333"/>
            <ellipse cx="55" cy="55" rx="4" ry="2.5" fill="#FF6B6B" opacity="0.5"/>
            
            {/* Bochechas */}
            <ellipse cx="30" cy="46" rx="5" ry="4" fill={tigerCheeks} opacity="0.6"/>
            <ellipse cx="80" cy="46" rx="5" ry="4" fill={tigerCheeks} opacity="0.6"/>
            
            {/* CORPO cambaleando */}
            <path d="M42 68 L40 108 L72 108 L70 68 Z" fill={dobokWhite} stroke="#111" strokeWidth="2.5"/>
            
            {/* Gola */}
            <path d="M42 68 L55 84 L70 68" fill="none" stroke="#111" strokeWidth="2"/>
            
            {/* Hogu */}
            <rect x="44" y="76" width="24" height="26" rx="4" fill={teamColor} opacity="0.7" stroke="#111" strokeWidth="1.5"/>
            
            {/* Faixa */}
            <rect x="41" y="103" width="30" height="5" rx="2" fill={beltColor}/>
            
            {/* Pernas cambaleando */}
            <path d="M42 108 L34 134 L48 134 L54 118 L60 134 L74 134 L70 108 Z" fill={dobokWhite} stroke="#111" strokeWidth="2"/>
            <ellipse cx="41" cy="137" rx="9" ry="4.5" fill={tigerOrange} stroke="#111" strokeWidth="1.5"/>
            <ellipse cx="67" cy="137" rx="9" ry="4.5" fill={tigerOrange} stroke="#111" strokeWidth="1.5"/>
            
            {/* Braços abertos - desequilíbrio */}
            <path d="M42 75 Q22 70 12 85" stroke={dobokWhite} strokeWidth="10" strokeLinecap="round"/>
            <path d="M70 75 Q85 65 95 75" stroke={dobokWhite} strokeWidth="10" strokeLinecap="round"/>
            <path d="M42 75 Q22 70 12 85" stroke="#DDD" strokeWidth="10" strokeLinecap="round" opacity="0.3"/>
            <path d="M70 75 Q85 65 95 75" stroke="#DDD" strokeWidth="10" strokeLinecap="round" opacity="0.3"/>
            
            {/* Patas abertas */}
            <circle cx="10" cy="88" r="8" fill={tigerOrange} stroke="#111" strokeWidth="2"/>
            <circle cx="97" cy="77" r="8" fill={tigerOrange} stroke="#111" strokeWidth="2"/>
            
            {/* Efeito de impacto */}
            <text x="15" y="28" fontSize="14" fill="#FFD700">✦</text>
            <text x="82" y="24" fontSize="10" fill="#FFD700">✦</text>
          </svg>
        );

      default: // idle
        return (
          <svg viewBox="0 0 100 140" className="w-full h-full">
            {/* Sombra no chão */}
            <ellipse cx="50" cy="136" rx="22" ry="5" fill="#000" opacity="0.15"/>
            
            {/* CABEÇA DO TIGRE */}
            <circle cx="50" cy="40" r="30" fill={tigerOrange} stroke="#111" strokeWidth="3"/>
            
            {/* Orelhas */}
            <ellipse cx="26" cy="16" rx="10" ry="10" fill={tigerOrange} stroke="#111" strokeWidth="2.5"/>
            <ellipse cx="26" cy="16" rx="5" ry="5" fill={earPink}/>
            <ellipse cx="74" cy="16" rx="10" ry="10" fill={tigerOrange} stroke="#111" strokeWidth="2.5"/>
            <ellipse cx="74" cy="16" rx="5" ry="5" fill={earPink}/>
            
            {/* Listras da testa */}
            <path d="M50 15 L50 28" stroke="#111" strokeWidth="4" strokeLinecap="round"/>
            <path d="M40 18 L44 30" stroke="#111" strokeWidth="3" strokeLinecap="round"/>
            <path d="M60 18 L56 30" stroke="#111" strokeWidth="3" strokeLinecap="round"/>
            
            {/* Área branca do focinho */}
            <ellipse cx="50" cy="52" rx="16" ry="12" fill="#FFF"/>
            
            {/* Olhos grandes */}
            <ellipse cx="38" cy="42" rx="8" ry="10" fill="#FFF" stroke="#111" strokeWidth="2"/>
            <circle cx="40" cy="44" r="5" fill="#111"/>
            <circle cx="38" cy="42" r="2" fill="#FFF"/>
            <ellipse cx="62" cy="42" rx="8" ry="10" fill="#FFF" stroke="#111" strokeWidth="2"/>
            <circle cx="60" cy="44" r="5" fill="#111"/>
            <circle cx="62" cy="42" r="2" fill="#FFF"/>
            
            {/* Nariz */}
            <ellipse cx="50" cy="50" rx="5" ry="4" fill={tigerNose}/>
            
            {/* Boca com sorriso e dentinho */}
            <path d="M45 56 Q50 60 55 56" stroke="#111" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <path d="M50 56 L50 52" stroke="#111" strokeWidth="1.5"/>
            
            {/* Bochechas rosadas */}
            <ellipse cx="28" cy="50" rx="6" ry="5" fill={tigerCheeks} opacity="0.6"/>
            <ellipse cx="72" cy="50" rx="6" ry="5" fill={tigerCheeks} opacity="0.6"/>
            
            {/* CORPO - Dobok */}
            <path d="M35 70 L32 108 L68 108 L65 70 Z" fill={dobokWhite} stroke="#111" strokeWidth="2.5"/>
            
            {/* Gola em V */}
            <path d="M35 70 L50 86 L65 70" fill="none" stroke="#111" strokeWidth="2"/>
            
            {/* Hogu (protetor) */}
            <rect x="37" y="78" width="26" height="26" rx="4" fill={teamColor} stroke="#111" strokeWidth="2"/>
            
            {/* Faixa PRETA */}
            <rect x="33" y="104" width="34" height="6" rx="2" fill={beltColor}/>
            <rect x="48" y="102" width="4" height="10" fill={beltColor}/>
            
            {/* Calça */}
            <path d="M34 110 L28 134 L44 134 L50 118 L56 134 L72 134 L66 110 Z" fill={dobokWhite} stroke="#111" strokeWidth="2"/>
            
            {/* Patas/Pés */}
            <ellipse cx="36" cy="136" rx="10" ry="5" fill={tigerOrange} stroke="#111" strokeWidth="2"/>
            <circle cx="32" cy="135" r="2" fill={pawPads}/>
            <circle cx="36" cy="134" r="2" fill={pawPads}/>
            <circle cx="40" cy="135" r="2" fill={pawPads}/>
            
            <ellipse cx="64" cy="136" rx="10" ry="5" fill={tigerOrange} stroke="#111" strokeWidth="2"/>
            <circle cx="60" cy="135" r="2" fill={pawPads}/>
            <circle cx="64" cy="134" r="2" fill={pawPads}/>
            <circle cx="68" cy="135" r="2" fill={pawPads}/>
            
            {/* Braços/Patas em guarda */}
            <path d="M35 80 L20 70" stroke={dobokWhite} strokeWidth="10" strokeLinecap="round"/>
            <path d="M35 80 L20 70" stroke="#DDD" strokeWidth="10" strokeLinecap="round" opacity="0.3"/>
            <circle cx="18" cy="68" r="10" fill={tigerOrange} stroke="#111" strokeWidth="2"/>
            <circle cx="14" cy="65" r="2.5" fill={pawPads}/>
            <circle cx="18" cy="63" r="2.5" fill={pawPads}/>
            <circle cx="22" cy="65" r="2.5" fill={pawPads}/>
            <ellipse cx="18" cy="70" rx="4" ry="3" fill={pawPads}/>
            
            <path d="M65 80 L80 70" stroke={dobokWhite} strokeWidth="10" strokeLinecap="round"/>
            <path d="M65 80 L80 70" stroke="#DDD" strokeWidth="10" strokeLinecap="round" opacity="0.3"/>
            <circle cx="82" cy="68" r="10" fill={tigerOrange} stroke="#111" strokeWidth="2"/>
            <circle cx="78" cy="65" r="2.5" fill={pawPads}/>
            <circle cx="82" cy="63" r="2.5" fill={pawPads}/>
            <circle cx="86" cy="65" r="2.5" fill={pawPads}/>
            <ellipse cx="82" cy="70" rx="4" ry="3" fill={pawPads}/>
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
        isBlue && 'scale-x-[-1]',
        className
      )}
    >
      {renderPose()}
    </div>
  );
}
