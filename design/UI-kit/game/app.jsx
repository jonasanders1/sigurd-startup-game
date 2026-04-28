function Coin({ color, label, points, duration }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: '1px solid var(--border)', borderRadius: 8, background: 'rgba(52,52,52,.3)' }}>
      <div style={{ width: 32, height: 32, borderRadius: 9999, background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, boxShadow: 'var(--shadow)' }}>P</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: 'var(--foreground)', fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>({duration} sekunder)</div>
      </div>
      <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 13 }}>{points} kr</div>
    </div>
  );
}

function HUD() {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-pixel)', zIndex: 2 }}>
      <div style={{ color: '#fff', fontSize: 22 }}>
        <div style={{ fontSize: 11, color: 'var(--primary)', letterSpacing: '.08em' }}>SCORE</div>
        <div>128 400 kr</div>
      </div>
      <div style={{ color: '#fff', fontSize: 22, textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: 'var(--primary)', letterSpacing: '.08em' }}>LEVEL 3 — SKATTEETATEN</div>
        <div>12/23</div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[1,2,3].map(i => (
          <svg key={i} width="24" height="24" viewBox="0 0 24 24" fill={i <= 2 ? '#ef4444' : 'none'} stroke="#ef4444" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
        ))}
      </div>
    </div>
  );
}

function GameStage() {
  return (
    <div style={{ position: 'relative', aspectRatio: '16/9', background: 'linear-gradient(180deg,#1a1a1f 0%, #302e2b 100%)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
      <HUD />
      {/* platforms */}
      {[[60,'78%','200px'],[240,'60%','160px'],[440,'40%','180px'],[60,'20%','120px']].map(([l,t,w],i) => (
        <div key={i} style={{ position:'absolute', left:l, top:t, width:w, height:12, background:'var(--primary)', borderRadius:2, boxShadow:'0 2px 0 var(--primary-dark)' }} />
      ))}
      {/* sigurd */}
      <img src="../../assets/ghost-idle.png" className="pixel-img" style={{ position:'absolute', left: 80, top: '68%', width: 48, height: 48, imageRendering:'pixelated' }}/>
      {/* bomb coin */}
      <img src="../../assets/bomb1.png" className="pixel-img" style={{ position:'absolute', left: 280, top: '50%', width: 36, height: 36, imageRendering:'pixelated' }}/>
      <img src="../../assets/bomb1.png" className="pixel-img" style={{ position:'absolute', left: 480, top: '30%', width: 36, height: 36, imageRendering:'pixelated' }}/>
      {/* P coin */}
      <div style={{ position:'absolute', right: 120, top:'28%', width:44, height:44, borderRadius:9999, background:'#a855f7', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-pixel)', fontWeight:700, fontSize:22, boxShadow:'0 0 20px rgba(168,85,247,.5)' }}>P</div>
      {/* ground */}
      <div style={{ position:'absolute', left:0, right:0, bottom:0, height:24, background:'var(--primary-dark)' }}/>
    </div>
  );
}

function MenuOverlay() {
  return (
    <div style={{ position:'absolute', inset:0, background:'rgba(38,37,33,.85)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:3 }}>
      <div style={{ textAlign:'center', maxWidth:420 }}>
        <div style={{ fontFamily:'var(--font-pixel)', fontSize:48, color:'#fff', marginBottom:8 }}>PAUSE</div>
        <div style={{ color:'var(--muted-foreground)', marginBottom:24 }}>Trykk P for å fortsette</div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <button style={{ background:'var(--primary)', color:'#fff', border:'none', padding:'14px 24px', borderRadius:12, fontFamily:'var(--font-sans)', fontSize:16, fontWeight:600, cursor:'pointer', boxShadow:'var(--shadow-lg)' }}>Fortsett</button>
          <button style={{ background:'var(--secondary)', color:'#fff', border:'1px solid var(--secondary)', padding:'14px 24px', borderRadius:12, fontFamily:'var(--font-sans)', fontSize:16, fontWeight:600, cursor:'pointer' }}>Start på nytt</button>
          <button style={{ background:'transparent', color:'var(--muted-foreground)', border:'none', padding:'10px', fontFamily:'var(--font-sans)', fontSize:14, cursor:'pointer', textDecoration:'underline' }}>Avslutt til hovedmeny</button>
        </div>
      </div>
    </div>
  );
}

const powerWinds = [
  { color: '#3b82f6', name: 'Lokal støtte', points: 100, duration: 3 },
  { color: '#ef4444', name: 'Ordførergodkjenning', points: 200, duration: 4 },
  { color: '#a855f7', name: 'Startup-plan', points: 300, duration: 5 },
  { color: '#22c55e', name: 'Fritak fra dok.', points: 500, duration: 6 },
  { color: '#06b6d4', name: 'Aksjeopsjoner', points: 800, duration: 7 },
  { color: '#eab308', name: 'Skattelette', points: 1200, duration: 8 },
];

function App() {
  const [paused, setPaused] = React.useState(false);
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 32, color:'var(--foreground)', fontFamily:'var(--font-sans)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <div style={{ fontFamily:'var(--font-pixel)', fontSize:32 }}>Sigurd Startup</div>
          <div style={{ color:'var(--muted-foreground)', fontSize:13, marginTop:4 }}>Spillemodus · Nivå 3: Skatteetaten</div>
        </div>
        <button onClick={() => setPaused(p => !p)} style={{ background:'var(--primary)', color:'#fff', border:'none', padding:'10px 18px', borderRadius:8, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-sans)' }}>{paused ? 'Fortsett' : 'Pause'}</button>
      </div>

      <div style={{ position:'relative' }}>
        <GameStage />
        {paused && <MenuOverlay />}
      </div>

      <div style={{ marginTop:32, background:'var(--card)', border:'1px solid var(--border)', borderRadius:8, padding:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          <h2 style={{ margin:0, fontSize:20, fontWeight:600 }}>Politisk Ryggvind — fargene og effekten</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          {powerWinds.map((w, i) => <Coin key={i} {...w} label={w.name} />)}
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
