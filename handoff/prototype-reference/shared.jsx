// SPE Operator — shared shell primitives.
// Todas as telas usam 1280×720 como canvas fixo.
const { useState, useEffect, useMemo, useRef, useCallback } = React;

const FONT = "Rajdhani, system-ui, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";

// Tipos de golpe — usados em operador + TV para ícones ao lado do score
const STRIKE_TYPES = {
  h:  { label:'CABEÇA',       short:'H',  icon:'helmet' },
  b:  { label:'CORPO',        short:'B',  icon:'chest' },
  p:  { label:'SOCO',         short:'P',  icon:'punch' },
  gh: { label:'GIRO CABEÇA',  short:'GH', icon:'helmetSpin' },
  gb: { label:'GIRO CORPO',   short:'GB', icon:'chestSpin' },
};

// Default rules (editáveis via config)
const DEFAULT_RULES = {
  rounds: 3,
  roundSecs: 90,
  breakSecs: 30,
  pts: { h:3, b:2, p:1, gh:5, gb:4 },
  gamjeomMax: 5,
  ptGap: 12,          // diferença de pontos para encerrar por pontos
  category: 'SUB-17 −55KG',
  mat: 1,
};

// Hardware test state compartilhado (operador escreve, TV lê) --------------
const HW_KEY = 'spe-hwtest-state';
function useHwTestState() {
  const [state, setState] = useState(() => {
    try { return JSON.parse(localStorage.getItem(HW_KEY) || 'null') || null; }
    catch { return null; }
  });
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === HW_KEY) {
        try { setState(JSON.parse(e.newValue || 'null')); } catch {}
      }
    };
    const onCustom = () => {
      try { setState(JSON.parse(localStorage.getItem(HW_KEY) || 'null')); } catch {}
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('spe-hwtest-updated', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('spe-hwtest-updated', onCustom);
    };
  }, []);
  return state;
}
function setHwTestState(s) {
  if (s === null) localStorage.removeItem(HW_KEY);
  else localStorage.setItem(HW_KEY, JSON.stringify(s));
  window.dispatchEvent(new Event('spe-hwtest-updated'));
}

// Shared match store ------------------------------------------------------
function useMatchStore() {
  const initialAthlete = (name, country) => ({
    name, country, score:0, gamjeom:0, deokjeom:0, hits:0,
    rounds:[0,0,0], final:0, ivr:1,
    strikes: [],                 // [{type, pts, round, time}]
  });
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [blue, setBlue]   = useState(initialAthlete('SILVA, L.', 'BRA'));
  const [red,  setRed ]   = useState(initialAthlete('KIM, J.',   'KOR'));
  const [timer, setTimer] = useState(DEFAULT_RULES.roundSecs);
  const [running, setRunning] = useState(false);
  const [round, setRound]     = useState(1);
  const [status, setStatus]   = useState('pause');
  const [log, setLog]         = useState([]);
  const [flash, setFlash]     = useState(null); // {side, pts, type, ts}
  const [history, setHistory] = useState([]);   // p/ undo

  useEffect(()=>{
    if(!running) return;
    const id = setInterval(()=>setTimer(t=>Math.max(0,t-1)), 1000);
    return ()=>clearInterval(id);
  },[running]);

  const snapshot = () => ({ blue, red, round, timer, log });

  const score = (side, type) => {
    const pts = rules.pts[type];
    setHistory(h => [{snap:snapshot(), side, pts, type}, ...h].slice(0,20));
    const setter = side==='blue'?setBlue:setRed;
    setter(s => {
      const r = [...s.rounds]; r[round-1] = (r[round-1]||0)+pts;
      return {
        ...s,
        score:s.score+pts,
        hits:s.hits+1,
        rounds:r,
        strikes:[...s.strikes, {type, pts, round, time:timer}],
      };
    });
    setLog(l => [{
      seq:l.length+1, round, side, type, pts,
      time:fmtTime(timer),
    }, ...l].slice(0,40));
    setFlash({side, pts, type, ts:Date.now()});
  };

  const gamjeom = (side) => {
    setHistory(h => [{snap:snapshot(), side, type:'gamjeom'}, ...h].slice(0,20));
    const setter = side==='blue'?setBlue:setRed;
    const other  = side==='blue'?setRed:setBlue;
    setter(s => ({...s, gamjeom:s.gamjeom+1}));
    other(s => {
      const r=[...s.rounds]; r[round-1]=(r[round-1]||0)+1;
      return {...s, score:s.score+1, rounds:r,
        strikes:[...s.strikes,{type:'gj',pts:1,round,time:timer}]};
    });
    setLog(l=>[{seq:l.length+1, round,
      side:side==='blue'?'red':'blue', type:'gj', pts:1, time:fmtTime(timer),
      detail:`${side==='blue'?'CHUNG':'HONG'} → gam-jeom`
    }, ...l].slice(0,40));
  };

  const undo = () => {
    const last = history[0];
    if(!last) return;
    setHistory(h=>h.slice(1));
    setBlue(last.snap.blue);
    setRed(last.snap.red);
    setRound(last.snap.round);
    setTimer(last.snap.timer);
    setLog(last.snap.log);
  };

  const reset = () => {
    setBlue(initialAthlete(blue.name, blue.country));
    setRed(initialAthlete(red.name, red.country));
    setTimer(rules.roundSecs);
    setRound(1);
    setRunning(false);
    setStatus('pause');
    setLog([]);
    setHistory([]);
  };

  // derived
  const leading = blue.score>red.score ? 'blue' : (red.score>blue.score ? 'red' : null);

  return { rules, setRules, blue, setBlue, red, setRed, timer, setTimer,
    running, setRunning, round, setRound, status, setStatus,
    log, setLog, flash, setFlash, history,
    score, gamjeom, undo, reset, leading };
}

const fmtTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

// Icon system -------------------------------------------------------------
function Icon({ name, size=16, color='currentColor', strokeWidth=2 }) {
  const paths = {
    play: <polygon points="5 3 19 12 5 21 5 3"/>,
    pause: <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>,
    rotateCcw: <><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></>,
    skipForward: <><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></>,
    power: <><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    stethoscope: <><path d="M4 2v5a5 5 0 0 0 10 0V2"/><path d="M4 2h3M14 2h-3"/><path d="M9 12v3a5 5 0 0 0 10 0"/><circle cx="19" cy="10" r="2"/></>,
    monitor: <><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>,
    camera: <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>,
    list: <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
    check: <polyline points="20 6 9 17 4 12"/>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    flag: <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></>,
    bluetooth: <polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5"/>,
    wifi: <><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></>,
    keyboard: <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10"/></>,
    home: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    trophy: <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3a2 2 0 0 1 0 4h-3M7 5H4a2 2 0 0 0 0 4h3"/></>,
    users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    arrowLeft: <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
    arrowRight: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    chevronRight: <polyline points="9 18 15 12 9 6"/>,
    // Golpes / equipamentos
    helmet: <path d="M4 14a8 8 0 0 1 16 0v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM2 14h2M20 14h2M4 17h16"/>,
    chest:  <><path d="M4 6h16v10a2 2 0 0 1-2 2h-3l-3 2-3-2H6a2 2 0 0 1-2-2z"/><path d="M4 6l2-3h12l2 3"/></>,
    punch:  <><path d="M6 11V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v5"/><path d="M14 11V8a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v6a5 5 0 0 1-5 5h-3a5 5 0 0 1-5-5v-3a2 2 0 0 1 2-2h9"/></>,
    helmetSpin: <><path d="M4 14a8 8 0 0 1 16 0v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 17h16"/><path d="M21 5a8 8 0 0 1 0 2M3 5a8 8 0 0 0 0 2" strokeDasharray="2 2"/></>,
    chestSpin:  <><path d="M4 6h16v10a2 2 0 0 1-2 2h-3l-3 2-3-2H6a2 2 0 0 1-2-2z"/><path d="M4 6l2-3h12l2 3"/><path d="M22 10a6 6 0 0 1 0 2M2 10a6 6 0 0 0 0 2" strokeDasharray="2 2"/></>,
    alert: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
    battery: <><rect x="1" y="6" width="18" height="12" rx="2"/><line x1="23" y1="13" x2="23" y2="11"/><rect x="3" y="8" width="11" height="8" fill="currentColor" stroke="none"/></>,
    zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    scale: <><path d="M12 3v18M5 21h14M12 3l5 9h-10zM7 21a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm10 0a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/></>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {paths[name] || null}
  </svg>;
}

// Strike icon ao lado do número — usado pelo operador e TV
function StrikeIcon({ type, size=22, color='#fff' }) {
  const t = STRIKE_TYPES[type];
  if (!t) return null;
  return <Icon name={t.icon} size={size} color={color} strokeWidth={2.2}/>;
}

// Hardware indicator
function HardwarePips({ dark=true, blue=true }) {
  const items = [
    { i:'helmet', label:'CAP', battery:0.85, sig:4 },
    { i:'chest',  label:'COL', battery:0.62, sig:3 },
  ];
  return <div style={{display:'flex', gap:6, alignItems:'center'}}>
    {items.map(({i,label,battery,sig}, idx) => {
      const low = battery < 0.3;
      const color = low ? '#fb923c' : (dark ? '#fff' : '#000');
      return <div key={idx} style={{display:'flex', alignItems:'center', gap:3, padding:'3px 6px', background:dark?'rgba(0,0,0,.25)':'rgba(0,0,0,0.06)', borderRadius:4, border:'1px solid rgba(255,255,255,.15)'}}>
        <Icon name={i} size={13} color={color}/>
        <span style={{fontSize:8, fontFamily:MONO, color, fontWeight:700, letterSpacing:'.05em'}}>{Math.round(battery*100)}%</span>
      </div>;
    })}
  </div>;
}

// Status pill
function StatusBadge({ status }) {
  const map = {
    pause:    { l:'PAUSADO',     bg:'rgba(233,180,24,.15)', c:'#E9B418' },
    live:     { l:'● AO VIVO',   bg:'rgba(225,29,72,.15)',  c:'#E11D48' },
    medical:  { l:'T. MÉDICO',   bg:'rgba(249,115,22,.18)', c:'#fb923c' },
    interval: { l:'INTERVALO',   bg:'rgba(156,163,175,.15)',c:'#d4d4d8' },
    golden:   { l:'GOLDEN ROUND',bg:'rgba(250,204,21,.22)', c:'#facc15' },
    ended:    { l:'ENCERRADA',   bg:'rgba(107,114,128,.22)',c:'#e5e7eb' },
  };
  const s = map[status] || map.pause;
  return <span style={{
    display:'inline-flex', alignItems:'center', justifyContent:'center',
    padding:'5px 12px', borderRadius:6,
    fontFamily:FONT, fontSize:11, fontWeight:700, letterSpacing:'.22em',
    background:s.bg, color:s.c,
  }}>{s.l}</span>;
}

// Timer base (sem ring). TimerRing abaixo.
function MatchTimer({ secs, big=false }) {
  const critical = secs <= 5;
  const urgent = secs <= 10 && !critical;
  const bg = critical ? 'hsl(0 84% 44%)' : '#E9B418';
  const color = critical ? '#fff' : '#0A0A0A';
  return <div style={{
    background:bg, color, padding: big ? '12px 28px' : '6px 16px',
    borderRadius:6, fontFamily:FONT, fontSize: big ? 56 : 36,
    fontWeight:900, fontVariantNumeric:'tabular-nums', lineHeight:1,
    letterSpacing:'.02em',
    animation: critical ? 'spe-blink-fast .25s infinite' : (urgent ? 'spe-blink-slow .5s infinite' : 'none'),
  }}>{fmtTime(secs)}</div>;
}

// Timer com progress ring (usado no operador v2 e TV)
function TimerRing({ secs, total, size=220, critical=null }) {
  const pct = total>0 ? secs/total : 0;
  const isCrit = critical ?? secs<=10;
  const radius = size*0.44;
  const C = 2*Math.PI*radius;
  const dash = C * pct;
  const color = isCrit ? '#FACC15' : '#22C55E';
  return <div style={{position:'relative', width:size, height:size, display:'flex', alignItems:'center', justifyContent:'center'}}>
    <svg width={size} height={size} style={{position:'absolute', inset:0, transform:'rotate(-90deg)'}}>
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={8}/>
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={8}
              strokeLinecap="round" strokeDasharray={`${dash} ${C}`}
              style={{transition:'stroke-dasharray 1s linear, stroke .3s'}}/>
    </svg>
    <div style={{fontFamily:FONT, fontSize:size*0.3, fontWeight:900, fontVariantNumeric:'tabular-nums', color:isCrit?'#FACC15':'#fff', lineHeight:1}}>
      {fmtTime(secs)}
    </div>
  </div>;
}

// Keyboard hint
function Kbd({ children, dark=true }) {
  return <kbd style={{
    display:'inline-flex', alignItems:'center', justifyContent:'center',
    minWidth:18, height:16, padding:'0 4px',
    background: dark?'rgba(255,255,255,.08)':'rgba(0,0,0,.06)',
    border: `1px solid ${dark?'rgba(255,255,255,.18)':'rgba(0,0,0,.18)'}`,
    borderRadius:3, fontFamily:MONO, fontSize:9,
    color: dark?'rgba(255,255,255,.85)':'rgba(0,0,0,.7)', fontWeight:700,
  }}>{children}</kbd>;
}

// Centered canvas frame (1280×720) — used everywhere
function Screen({ children, bg='#0A0A0F', label }) {
  return <div data-screen-label={label} style={{
    width:1280, height:720, background:bg, color:'#fff',
    fontFamily:FONT, overflow:'hidden', position:'relative',
    userSelect:'none',
  }}>{children}</div>;
}

// Top chrome shared por várias telas
function TopChrome({ title, right, onBack }) {
  return <div style={{height:48, padding:'0 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,.06)', background:'#0A0A0F'}}>
    <div style={{display:'flex', alignItems:'center', gap:14}}>
      {onBack && <button onClick={onBack} style={{background:'transparent', border:'1px solid rgba(255,255,255,.12)', borderRadius:8, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', cursor:'pointer'}}><Icon name="arrowLeft" size={16}/></button>}
      <img src="../assets/logo-spe-branca.png" style={{height:22, opacity:.95}}/>
      <div style={{height:18, width:1, background:'rgba(255,255,255,.14)'}}/>
      <div style={{fontSize:11, fontWeight:700, letterSpacing:'.28em', color:'rgba(255,255,255,.7)'}}>{title}</div>
    </div>
    <div style={{display:'flex', alignItems:'center', gap:10}}>{right}</div>
  </div>;
}

// =============================================================================
// TOAST GLOBAL · feedback imediato de sucesso/erro/info
// Uso em qualquer componente:  toast.ok('Luta salva!')  ·  toast.info('...')
// Aparece no topo-centro da tela 1280×720, some sozinho em 2.6s.
// =============================================================================
const TOAST_EVT = 'spe-toast';
const toast = {
  ok:   (msg, opts={}) => window.dispatchEvent(new CustomEvent(TOAST_EVT, {detail:{kind:'ok', msg, ...opts}})),
  info: (msg, opts={}) => window.dispatchEvent(new CustomEvent(TOAST_EVT, {detail:{kind:'info', msg, ...opts}})),
  warn: (msg, opts={}) => window.dispatchEvent(new CustomEvent(TOAST_EVT, {detail:{kind:'warn', msg, ...opts}})),
};

function ToastHost() {
  const [list, setList] = useState([]);
  useEffect(() => {
    const on = (e) => {
      const id = Date.now() + Math.random();
      const t = { id, ...e.detail };
      setList(l => [...l, t]);
      setTimeout(() => setList(l => l.filter(x => x.id !== id)), e.detail.duration || 2600);
    };
    window.addEventListener(TOAST_EVT, on);
    return () => window.removeEventListener(TOAST_EVT, on);
  }, []);

  const kinds = {
    ok:   { bg:'#10B981', icon:'check', label:'PRONTO' },
    info: { bg:'#3B82F6', icon:'eye',   label:'AVISO' },
    warn: { bg:'#F59E0B', icon:'alert', label:'ATENÇÃO' },
  };

  return <div style={{
    position:'absolute', top:18, left:0, right:0, zIndex:9000,
    display:'flex', flexDirection:'column', alignItems:'center', gap:8,
    pointerEvents:'none',
  }}>
    {list.map(t => {
      const k = kinds[t.kind] || kinds.ok;
      return <div key={t.id} style={{
        display:'flex', alignItems:'center', gap:12,
        background:k.bg, color:'#fff',
        padding:'14px 22px 14px 18px', borderRadius:12,
        fontFamily:FONT, fontWeight:700, fontSize:17,
        boxShadow:'0 14px 40px rgba(0,0,0,.45)',
        animation:'spe-toast-in .22s cubic-bezier(.2,.9,.3,1.2)',
        minWidth:280, maxWidth:640,
      }}>
        <div style={{width:34, height:34, borderRadius:8, background:'rgba(255,255,255,.22)', display:'flex', alignItems:'center', justifyContent:'center'}}>
          <Icon name={k.icon} size={22} color="#fff" strokeWidth={3.2}/>
        </div>
        <div>
          <div style={{fontSize:9, fontWeight:900, letterSpacing:'.3em', opacity:.85}}>{k.label}</div>
          <div style={{fontSize:16, fontWeight:700, marginTop:1}}>{t.msg}</div>
        </div>
      </div>;
    })}
  </div>;
}

Object.assign(window, {
  useMatchStore, useHwTestState, setHwTestState,
  fmtTime, Icon, StrikeIcon, HardwarePips, StatusBadge,
  MatchTimer, TimerRing, Kbd, Screen, TopChrome,
  toast, ToastHost,
  FONT, MONO, STRIKE_TYPES, DEFAULT_RULES,
});
