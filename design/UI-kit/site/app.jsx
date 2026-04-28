// Sigurd Startup — Arcade Site Home (v2)

const ICONS = {
  joystick: <><path d="M6 11V5a3 3 0 016 0v6"/><path d="M8 19H6a4 4 0 01-4-4v-1a3 3 0 013-3h14a3 3 0 013 3v1a4 4 0 01-4 4h-2"/><path d="M8 19l4 2 4-2"/></>,
  book:     <><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></>,
  target:   <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
  gamepad:  <><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4M8 10v4M15 13v.01M18 11v.01"/></>,
  coins:    <><circle cx="8" cy="8" r="6"/><path d="M18 10.37A6 6 0 1110.34 18"/></>,
  alert:    <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4"/><circle cx="12" cy="17" r=".5"/></>,
  award:    <><circle cx="12" cy="8" r="6"/><path d="M15.5 13l2.5 9-6-3-6 3 2.5-9"/></>,
  trendup:  <><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></>,
};

const controls = [
  { keys:['←','→'],   alt:['A','D'],     desc:'Beveg deg sidelengs' },
  { keys:['↑'],       alt:['W'],         desc:'Hopp' },
  { keys:['SPACE'],                       desc:'Flytemodus (Hold)' },
  { keys:['↑','SHIFT'], alt:['W','SHIFT'], desc:'Super hopp' },
  { keys:['↓'],       alt:['S'],         desc:'Rask fall' },
];

/* -------------------------------------------------------- */
function Hero() {
  return (
    <div style={{
      position:'relative',
      background:'var(--gradient-fjord)',
      borderBottom:'1px solid var(--surface-line)',
      padding:'64px 32px 180px',
      overflow:'hidden',
    }} className="scanlines">
      {/* star field */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none',
        backgroundImage:
          'radial-gradient(1px 1px at 12% 22%, #eaf2ff, transparent),'+
          'radial-gradient(1px 1px at 78% 18%, #eaf2ff, transparent),'+
          'radial-gradient(1px 1px at 44% 38%, #9db3d6, transparent),'+
          'radial-gradient(1px 1px at 86% 46%, #eaf2ff, transparent),'+
          'radial-gradient(1px 1px at 22% 58%, #9db3d6, transparent),'+
          'radial-gradient(1px 1px at 62% 12%, #eaf2ff, transparent),'+
          'radial-gradient(1px 1px at 4% 40%, #9db3d6, transparent),'+
          'radial-gradient(1px 1px at 94% 28%, #eaf2ff, transparent)',
        opacity:.7,
      }}/>

      <div style={{ position:'relative', zIndex:2, maxWidth:960, margin:'0 auto', textAlign:'center' }}>
        <div style={{
          display:'inline-flex', alignItems:'center', gap:10,
          padding:'6px 14px', marginBottom:28,
          background:'rgba(239,51,64,.1)',
          border:'1px solid var(--primary)',
          borderRadius:2,
          fontFamily:'var(--font-pixel)', fontSize:11, letterSpacing:'.24em',
          color:'var(--primary-light)',
        }}>
          <span style={{ width:8, height:8, background:'var(--primary)', boxShadow:'0 0 8px var(--primary)' }}/>
          BANE 3 · SKATTEETATEN
        </div>

        <h1 className="flicker" style={{
          fontFamily:'var(--font-pixel)',
          fontSize:'clamp(52px, 9vw, 112px)',
          lineHeight:1,
          margin:0,
          color:'var(--foreground)',
          textShadow:'0 0 18px rgba(239,51,64,.35), 4px 4px 0 #c41922',
        }}>
          SIGURD<br/>
          <span style={{ color:'var(--primary)' }}>STARTUP</span>
        </h1>

        <div style={{ marginTop:24, fontFamily:'var(--font-mono)', fontSize:14, color:'var(--foreground-muted)', display:'flex', flexDirection:'column', gap:4, alignItems:'center' }}>
          <div style={{ whiteSpace:'nowrap' }}>
            PRODUSENT: <span style={{ textDecoration:'line-through', color:'var(--primary)', opacity:.6 }}>TEHKAN</span>
            <span style={{ color:'var(--foreground)', marginLeft:8 }}>JONAS&nbsp;ANDERSEN</span>
          </div>
          <div style={{ whiteSpace:'nowrap' }}>
            ÅR: <span style={{ textDecoration:'line-through', color:'var(--primary)', opacity:.6 }}>1984</span>
            <span style={{ color:'var(--foreground)', marginLeft:8 }}>2025</span>
          </div>
        </div>

        <div style={{ marginTop:36, display:'flex', justifyContent:'center', gap:16, flexWrap:'wrap' }}>
          <ArcadeButton icon={<Icon d={ICONS.joystick} size={20}/>}>PRESS START</ArcadeButton>
          <ArcadeButton variant="secondary" icon={<Icon d={ICONS.book} size={20}/>}>LES REGLENE</ArcadeButton>
        </div>

        <div style={{ marginTop:28, fontFamily:'var(--font-pixel)', fontSize:12, letterSpacing:'.3em', color:'var(--foreground-dim)' }} className="caret">
          HIGH SCORE 338 500 KR
        </div>
      </div>

      {/* fjord silhouette at bottom */}
      <FjordBackdrop/>
    </div>
  );
}

/* -------------------------------------------------------- */
function StatTile({ label, value, sub, color = 'var(--primary-light)' }) {
  return (
    <PixelBezel style={{ padding:20, background:'var(--surface)' }}>
      <div style={{ fontFamily:'var(--font-pixel)', fontSize:10, letterSpacing:'.24em', color:'var(--foreground-dim)' }}>{label}</div>
      <div style={{
        fontFamily:'var(--font-lcd)', fontSize:44, lineHeight:1,
        color, textShadow:`0 0 10px ${color}80`,
        marginTop:8,
      }}>{value}</div>
      {sub && <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--foreground-muted)', marginTop:6 }}>{sub}</div>}
    </PixelBezel>
  );
}

function SectionCard({ icon, title, subtitle, children }) {
  return (
    <PixelBezel style={{ padding:24 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18, paddingBottom:16, borderBottom:'1px dashed var(--surface-line)' }}>
        <div style={{
          width:40, height:40, background:'var(--primary)',
          border:'2px solid var(--primary-ink)',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'var(--primary-ink)', flexShrink:0,
          boxShadow:'0 0 12px rgba(239,51,64,.4)',
        }}>{icon}</div>
        <div>
          <h2 style={{
            margin:0, fontFamily:'var(--font-pixel)', fontSize:24,
            color:'var(--foreground)', letterSpacing:'.02em',
          }}>{title}</h2>
          {subtitle && <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--foreground-dim)', letterSpacing:'.12em' }}>{subtitle}</div>}
        </div>
      </div>
      {children}
    </PixelBezel>
  );
}

function HomeView() {
  return (
    <>
      <Hero/>

      <div style={{ maxWidth:1080, margin:'0 auto', padding:'48px 32px 64px' }}>
        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:20, marginBottom:48 }}>
          <StatTile label="AKTIVE GRÜNDERE" value="01 337" sub="+42 siden i går" />
          <StatTile label="HIGH SCORE" value="338 500" sub="MNE · Nivå 7 · 02:14" color="var(--accent-ice)"/>
          <StatTile label="SNITT NIVÅ" value="4.2 / 7" sub="KPI: UNICORN" color="var(--ok)"/>
        </div>

        <div style={{
          fontFamily:'var(--font-pixel)', fontSize:12, letterSpacing:'.3em',
          color:'var(--foreground-dim)', textAlign:'center', marginBottom:24,
        }}>── HVORDAN SPILLE ──</div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
          <SectionCard
            icon={<Icon d={ICONS.target} size={20}/>}
            title="MÅL"
            subtitle="MISSION BRIEFING"
          >
            <p style={{ margin:0, color:'var(--foreground-muted)', fontFamily:'var(--font-mono)', fontSize:14, lineHeight:1.7 }}>
              Hjelp Sigurd med å bli den ultimate norske gründeren. Samle finansieringer, unngå byråkratiske feller, naviger startup-landskapet uten å drukne i fjorden.
            </p>
            <div style={{ marginTop:18, display:'flex', flexDirection:'column', gap:10 }}>
              {[
                [ICONS.coins,  'Samle finansieringer i riktig rekkefølge',   'var(--coin-yellow)'],
                [ICONS.alert,  'Unngå byråkratiske hindringer',              'var(--primary-light)'],
                [ICONS.award,  'Oppnå unicorn-status innen tiden går ut',    'var(--ok)'],
                [ICONS.trendup,'Øk din verdsettelse med combo-multiplikator','var(--accent-ice)'],
              ].map(([d, t, c], i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:14, fontFamily:'var(--font-mono)', fontSize:13, color:'var(--foreground-muted)' }}>
                  <span style={{ fontFamily:'var(--font-pixel)', color:c, width:14, flexShrink:0 }}>▸</span>
                  <Icon d={d} size={16} stroke={c}/>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            icon={<Icon d={ICONS.gamepad} size={20}/>}
            title="KONTROLLER"
            subtitle="INPUT · 1P"
          >
            <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
              {controls.map((c, i) => (
                <div key={i} style={{
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:'10px 0',
                  borderBottom: i < controls.length-1 ? '1px dashed var(--surface-line)' : 'none',
                }}>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--foreground)' }}>{c.desc}</span>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    {c.keys.map((k, j) => (
                      <React.Fragment key={j}>
                        <Kbd wide={k==='SPACE'||k==='SHIFT'}>{k}</Kbd>
                        {j < c.keys.length-1 && <span style={{ color:'var(--primary)', fontFamily:'var(--font-pixel)' }}>+</span>}
                      </React.Fragment>
                    ))}
                    {c.alt && <>
                      <span style={{ color:'var(--foreground-dim)', fontFamily:'var(--font-pixel)', fontSize:11, margin:'0 4px' }}>/</span>
                      {c.alt.map((k, j) => (
                        <React.Fragment key={j}>
                          <Kbd wide={k==='SHIFT'}>{k}</Kbd>
                          {j < c.alt.length-1 && <span style={{ color:'var(--primary)', fontFamily:'var(--font-pixel)' }}>+</span>}
                        </React.Fragment>
                      ))}
                    </>}
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              marginTop:18, padding:14,
              background:'rgba(129,182,76,.08)',
              border:'1px dashed var(--ok)',
            }}>
              <div style={{ fontFamily:'var(--font-pixel)', fontSize:10, letterSpacing:'.2em', color:'var(--ok)', marginBottom:6 }}>TIPS</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--foreground-muted)', lineHeight:1.6 }}>
                Hold <Kbd>SPACE</Kbd> for flytemodus. Kombiner med <Kbd>SHIFT</Kbd> for super-hopp over skattespøkelsene.
              </div>
            </div>
          </SectionCard>
        </div>

        <div style={{ marginTop:48, textAlign:'center', fontFamily:'var(--font-mono)', fontSize:13, color:'var(--foreground-dim)', fontStyle:'italic' }}>
          «Søker du Skattefunn før du har organisasjonsnummer? Lykke til.»
        </div>
      </div>
    </>
  );
}

/* -------------------------------------------------------- */
function App() {
  const [active, setActive] = React.useState('hjem');
  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--background)', color:'var(--foreground)' }}>
      <Sidebar active={active} onNav={setActive}/>
      <main style={{ flex:1, overflow:'auto', display:'flex', flexDirection:'column' }}>
        <Marquee items={[
          { label:'HIGH SCORE', value:'338 500 KR', color:'#ffd166' },
          { label:'TOPSCORER',  value:'GRÜNDER_07', color:'#eaf2ff' },
          { label:'AKTIVE',     value:'1 337',      color:'#81b64c' },
          { label:'NESTE BANE', value:'SKATTEETATEN' },
          { label:'UNICORNS',   value:'042' },
          { label:'BONUS',      value:'x3 PITCH',   color:'#a855f7' },
        ]}/>
        <HomeView/>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
