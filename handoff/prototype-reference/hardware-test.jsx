// SPE — Teste de hardware (operador)
// Passo-a-passo: árbitro valida 1 equipamento por vez (capacete/colete × 2 atletas).
// Visual limpo: cards sóbrios em estado inativo; ring dourado no atual; check
// verde grande ao detectar. Tela de celebração ao concluir os 4.

const HardwareTestScreen = ({ onNavigate, rules }) => {
  const initial = {
    'blue-helmet': { ok:false, force:0, ts:0 },
    'blue-chest':  { ok:false, force:0, ts:0 },
    'red-helmet':  { ok:false, force:0, ts:0 },
    'red-chest':   { ok:false, force:0, ts:0 },
  };
  const [st, setSt] = useState(initial);

  const order = ['blue-helmet','blue-chest','red-helmet','red-chest'];
  const focusIdx = order.findIndex(k => !st[k].ok);
  const focus = focusIdx >= 0 ? order[focusIdx] : null;
  const doneCount = Object.values(st).filter(s => s.ok).length;
  const allOk = doneCount === 4;

  const hit = (key) => {
    if (st[key].ok) return;
    const force = 40 + Math.floor(Math.random()*55);
    setSt(s => ({...s, [key]: {ok:true, force, ts:Date.now()}}));
    // Feedback imediato — mensagem humana
    const [side, kind] = key.split('-');
    const who = side==='blue' ? 'do atleta azul' : 'do atleta vermelho';
    const what = kind==='helmet' ? 'Capacete' : 'Colete';
    toast.ok(`${what} ${who} funcionando!`);
  };

  // Sincroniza estado com a TV pública
  useEffect(() => {
    setHwTestState({ active:true, items: st, focus, doneCount, allOk });
    return () => {
      // ao sair da tela, sinaliza inativo (TV volta ao placar)
      setHwTestState({ active:false });
    };
  }, [st, focus, doneCount, allOk]);

  // Atalhos 1-4
  useEffect(()=>{
    const keys = {'1':'blue-helmet','2':'blue-chest','3':'red-helmet','4':'red-chest'};
    const onKey = (e) => { if (keys[e.key]) hit(keys[e.key]); };
    window.addEventListener('keydown', onKey);
    return ()=>window.removeEventListener('keydown', onKey);
  }, []);

  const reset = () => {
    if (doneCount === 0) return;
    if (!confirm('Zerar todos os testes e começar de novo?')) return;
    setSt(initial);
    toast.info('Testes zerados. Vamos recomeçar.');
  };

  const labelOf = (k) => {
    const [side, kind] = k.split('-');
    return {
      side,
      color: side==='blue' ? '#3b82f6' : '#ef4444',
      name: side==='blue' ? 'CHUNG (azul)' : 'HONG (vermelho)',
      kind: kind==='helmet' ? 'capacete' : 'colete',
    };
  };

  const Card = ({ keyId, stepNum }) => {
    const s = st[keyId];
    const meta = labelOf(keyId);
    const isFocus = focus === keyId;
    const isDim = !isFocus && !s.ok;

    const img = keyId.includes('helmet')
      ? `../assets/capacete-${meta.side==='blue'?'azul':'vermelho'}.png`
      : `../assets/colete-${meta.side==='blue'?'azul':'vermelho'}.png`;

    // estados: done (verde), focus (ring âmbar), dim (sóbrio)
    const border = s.ok ? '#10B981' : (isFocus ? '#FACC15' : 'rgba(255,255,255,.08)');
    const bg = s.ok
      ? 'linear-gradient(180deg, rgba(16,185,129,.10), rgba(16,185,129,.02))'
      : (isFocus ? `linear-gradient(180deg, ${meta.color}22, rgba(0,0,0,0))` : 'rgba(255,255,255,.02)');

    return <div
      onClick={()=>hit(keyId)}
      style={{
        flex:1, minWidth:0, minHeight:0,
        background:bg, border:`2px solid ${border}`,
        borderRadius:14, padding:16,
        display:'flex', flexDirection:'column', gap:10,
        cursor: s.ok ? 'default' : 'pointer',
        opacity: isDim ? .55 : 1,
        transition:'all .3s',
        boxShadow: isFocus && !s.ok ? '0 0 0 4px rgba(250,204,21,.15)' : 'none',
        position:'relative', overflow:'hidden',
      }}>
      {/* header: passo + lado + tipo */}
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <div style={{
            width:26, height:26, borderRadius:7,
            background: s.ok ? '#10B981' : (isFocus ? '#FACC15' : 'rgba(255,255,255,.08)'),
            color: s.ok || isFocus ? '#0A0A0A' : 'rgba(255,255,255,.6)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:MONO, fontSize:13, fontWeight:900,
          }}>{stepNum}</div>
          <div>
            <div style={{fontSize:9, fontWeight:900, letterSpacing:'.3em', color: meta.color}}>{meta.side==='blue'?'CHUNG':'HONG'}</div>
            <div style={{fontSize:14, fontWeight:700, color:'#fff', letterSpacing:'.02em'}}>{keyId.includes('helmet')?'CAPACETE':'COLETE'}</div>
          </div>
        </div>
        {/* status dot */}
        {s.ok
          ? <div style={{width:24, height:24, borderRadius:'50%', background:'#10B981', display:'flex', alignItems:'center', justifyContent:'center'}}>
              <Icon name="check" size={14} color="#fff" strokeWidth={3.5}/>
            </div>
          : <div style={{width:10, height:10, borderRadius:'50%', background: isFocus?'#FACC15':'rgba(255,255,255,.15)', animation: isFocus?'spe-pulse 1s infinite':'none'}}/>
        }
      </div>

      {/* imagem do equipamento */}
      <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', minHeight:0}}>
        <img src={img} style={{
          maxWidth:'80%', maxHeight:'100%', objectFit:'contain',
          filter: s.ok ? 'drop-shadow(0 0 18px rgba(16,185,129,.55))'
                  : (isFocus ? `drop-shadow(0 0 18px ${meta.color}aa)` : 'none'),
          transition:'filter .3s',
        }} onError={e=>{e.target.style.display='none';}}/>
        {/* ripple ao verificar */}
        {s.ok && <div key={s.ts} style={{position:'absolute', inset:0, pointerEvents:'none', display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{width:160, height:160, borderRadius:'50%', border:'3px solid #10B981', animation:'spe-ring 1.1s ease-out'}}/>
        </div>}
      </div>

      {/* footer status */}
      {s.ok ? <div style={{
        fontSize:11, fontWeight:900, letterSpacing:'.28em', color:'#10B981',
        textAlign:'center', padding:'8px 0', background:'rgba(16,185,129,.08)', borderRadius:8,
        fontFamily:MONO,
      }}>● VERIFICADO · FORÇA {s.force}</div>
      : <div style={{
        fontSize:10, fontWeight:700, letterSpacing:'.25em',
        color: isFocus?'#FACC15':'rgba(255,255,255,.4)',
        textAlign:'center', padding:'8px 0',
      }}>{isFocus ? 'AGUARDANDO CHUTINHO...' : 'AGUARDA'}</div>}
    </div>;
  };

  const focusMeta = focus ? labelOf(focus) : null;

  return <Screen bg="#0A0A0F" label="Teste de equipamento">
    {/* TOP BAR enxuta */}
    <div style={{height:52, background:'#0A0A0F', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 22px', borderBottom:'1px solid rgba(255,255,255,.06)'}}>
      <div style={{display:'flex', alignItems:'center', gap:14}}>
        <button onClick={()=>onNavigate('hub')} style={{background:'transparent', border:'1px solid rgba(255,255,255,.12)', borderRadius:8, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', cursor:'pointer'}}><Icon name="arrowLeft" size={15}/></button>
        <img src="../assets/logo-spe-branca.png" style={{height:22, opacity:.95}}/>
        <div style={{height:18, width:1, background:'rgba(255,255,255,.14)'}}/>
        <div style={{fontSize:11, fontWeight:700, letterSpacing:'.3em', color:'rgba(255,255,255,.75)'}}>TESTE DE EQUIPAMENTO · MAT {rules.mat}</div>
      </div>
      <div style={{display:'flex', alignItems:'center', gap:8}}>
        <div style={{fontSize:10, fontFamily:MONO, color:'rgba(255,255,255,.5)', letterSpacing:'.12em'}}>{doneCount}/4 VERIFICADOS</div>
        {doneCount > 0 && !allOk && <button onClick={reset} style={btnGhostSm} title="Começar de novo"><Icon name="rotateCcw" size={12}/> COMEÇAR DE NOVO</button>}
        <button disabled={!allOk} onClick={()=>{ toast.ok('Tudo verificado! Boa luta.'); onNavigate('quick'); }} style={{
          background: allOk ? '#10B981' : 'rgba(255,255,255,.05)',
          color: allOk ? '#fff' : 'rgba(255,255,255,.4)',
          border:0, borderRadius:8, padding:'10px 18px',
          fontFamily:FONT, fontSize:12, fontWeight:900, letterSpacing:'.22em',
          cursor: allOk?'pointer':'not-allowed',
          display:'flex', alignItems:'center', gap:6,
          boxShadow: allOk ? '0 4px 18px rgba(16,185,129,.4)' : 'none',
          transition:'all .2s',
        }}><Icon name="check" size={14}/> {allOk ? 'TUDO PRONTO · COMEÇAR' : 'AGUARDANDO...'}</button>
      </div>
    </div>

    {/* PASSO-A-PASSO: instrução ativa grande */}
    <div style={{
      padding:'18px 28px',
      background: allOk ? 'rgba(16,185,129,.08)' : 'rgba(250,204,21,.06)',
      borderBottom: `1px solid ${allOk ? 'rgba(16,185,129,.25)' : 'rgba(250,204,21,.2)'}`,
      display:'flex', alignItems:'center', gap:16,
    }}>
      {allOk ? <>
        <div style={{width:44, height:44, borderRadius:12, background:'rgba(16,185,129,.2)', border:'1px solid #10B981', display:'flex', alignItems:'center', justifyContent:'center'}}>
          <Icon name="check" size={26} color="#10B981" strokeWidth={3}/>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:10, fontWeight:900, letterSpacing:'.3em', color:'#10B981'}}>TUDO PRONTO!</div>
          <div style={{fontSize:18, fontWeight:700, color:'#fff', marginTop:2}}>Todos os equipamentos estão funcionando. Os atletas podem subir no tatame.</div>
        </div>
        <div style={{fontSize:10, fontFamily:MONO, color:'rgba(255,255,255,.5)', letterSpacing:'.12em', textAlign:'right'}}>
          Pode prosseguir<br/>para a luta
        </div>
      </> : <>
        <div style={{width:44, height:44, borderRadius:12, background:focusMeta.color+'22', border:`1px solid ${focusMeta.color}`, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{fontSize:22, fontFamily:MONO, fontWeight:900, color:focusMeta.color}}>{focusIdx+1}</div>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:10, fontWeight:900, letterSpacing:'.3em', color:'#FACC15'}}>PASSO {focusIdx+1} DE 4</div>
          <div style={{fontSize:18, fontWeight:700, color:'#fff', marginTop:2, lineHeight:1.3}}>
            Atleta <strong style={{color:focusMeta.color}}>{focusMeta.name}</strong>: dê um chutinho no <strong style={{color:'#FACC15'}}>{focusMeta.kind}</strong>.
          </div>
        </div>
        <div style={{fontSize:9, fontFamily:MONO, color:'rgba(255,255,255,.5)', letterSpacing:'.12em', textAlign:'right'}}>
          O equipamento acende<br/>automaticamente na TV
        </div>
      </>}
    </div>

    {/* GRID 4 cards em uma fileira só */}
    <div style={{flex:1, padding:'18px 22px', display:'flex', gap:12, minHeight:0, height:'calc(100% - 52px - 76px - 52px)'}}>
      {order.map((k, i) => <Card key={k} keyId={k} stepNum={i+1}/>)}
    </div>

    {/* PROGRESSO no rodapé — barra com steps */}
    <div style={{height:52, padding:'0 28px', display:'flex', alignItems:'center', gap:16, background:'#0F0F18', borderTop:'1px solid rgba(255,255,255,.06)'}}>
      <div style={{fontSize:10, fontWeight:700, letterSpacing:'.3em', color:'rgba(255,255,255,.5)', flexShrink:0}}>PROGRESSO</div>
      <div style={{flex:1, display:'flex', gap:8, alignItems:'center'}}>
        {order.map((k, i) => {
          const s = st[k];
          const isFoc = focus === k;
          const meta = labelOf(k);
          return <React.Fragment key={k}>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <div style={{
                width:22, height:22, borderRadius:'50%',
                background: s.ok ? '#10B981' : (isFoc ? '#FACC15' : 'rgba(255,255,255,.08)'),
                color: s.ok || isFoc ? '#0A0A0A' : 'rgba(255,255,255,.45)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:MONO, fontSize:11, fontWeight:900,
              }}>{s.ok ? '✓' : i+1}</div>
              <div style={{fontSize:9, fontWeight:700, letterSpacing:'.2em', color: s.ok?'#10B981':(isFoc?'#FACC15':'rgba(255,255,255,.5)')}}>
                {meta.side==='blue'?'AZUL':'VERM'} {k.includes('helmet')?'CAP':'COL'}
              </div>
            </div>
            {i<order.length-1 && <div style={{flex:1, height:2, background: st[order[i]].ok ? '#10B981' : 'rgba(255,255,255,.06)', borderRadius:1}}/>}
          </React.Fragment>;
        })}
      </div>
      <div style={{fontSize:9, fontFamily:MONO, color:'rgba(255,255,255,.4)', letterSpacing:'.12em', flexShrink:0}}>CLIQUE OU TECLE 1-4</div>
    </div>
  </Screen>;
};

const btnGhostSm = {
  background:'transparent', border:'1px solid rgba(255,255,255,.15)',
  color:'#fff', borderRadius:8, padding:'6px 12px',
  fontFamily:FONT, fontSize:10, fontWeight:700, letterSpacing:'.2em',
  cursor:'pointer', display:'flex', alignItems:'center', gap:6,
};

window.HardwareTestScreen = HardwareTestScreen;
