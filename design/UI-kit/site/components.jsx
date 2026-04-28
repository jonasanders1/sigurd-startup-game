// Arcade primitives for site-v2. Exposed on window.

const PixelBezel = ({ children, style, glow = false, accent = 'var(--primary)' }) => (
  <div style={{
    position: 'relative',
    background: 'var(--surface)',
    border: '1px solid var(--surface-line)',
    boxShadow: glow ? 'var(--glow-red), var(--shadow-lg)' : 'var(--shadow-lg)',
    ...style,
  }}>
    {children}
    {/* 4 corner brackets */}
    {['tl','tr','bl','br'].map(pos => {
      const s = { position:'absolute', width:12, height:12, pointerEvents:'none' };
      if (pos==='tl') Object.assign(s, { top:-1, left:-1 });
      if (pos==='tr') Object.assign(s, { top:-1, right:-1 });
      if (pos==='bl') Object.assign(s, { bottom:-1, left:-1 });
      if (pos==='br') Object.assign(s, { bottom:-1, right:-1 });
      return (
        <svg key={pos} width="12" height="12" viewBox="0 0 12 12" style={s} shapeRendering="crispEdges">
          <g fill={accent}>
            {pos==='tl' && <>
              <rect x="0" y="0" width="12" height="3"/>
              <rect x="0" y="0" width="3" height="12"/>
            </>}
            {pos==='tr' && <>
              <rect x="0" y="0" width="12" height="3"/>
              <rect x="9" y="0" width="3" height="12"/>
            </>}
            {pos==='bl' && <>
              <rect x="0" y="9" width="12" height="3"/>
              <rect x="0" y="0" width="3" height="12"/>
            </>}
            {pos==='br' && <>
              <rect x="0" y="9" width="12" height="3"/>
              <rect x="9" y="0" width="3" height="12"/>
            </>}
          </g>
        </svg>
      );
    })}
  </div>
);

const Marquee = ({ items }) => {
  // items: [{ label, value, color }]
  const strip = items.map((it, i) => (
    <span key={i} style={{ padding:'0 28px', display:'inline-flex', alignItems:'center', gap:10 }}>
      <span style={{ color: it.color || 'rgba(255,255,255,.7)', fontSize:12 }}>◆</span>
      <span style={{ opacity:.8 }}>{it.label}</span>
      <span style={{ fontFamily:'var(--font-lcd)', fontSize:22, lineHeight:1 }}>{it.value}</span>
    </span>
  ));
  return (
    <div className="marquee" style={{ display:'flex', alignItems:'center', height:32 }}>
      <div className="marquee-inner">
        {strip}{strip}
      </div>
    </div>
  );
};

const LCDReadout = ({ label, value, width = 140 }) => (
  <div style={{
    display:'inline-flex', flexDirection:'column', alignItems:'flex-start',
    background:'#02050f',
    border:'1px solid var(--surface-line)',
    borderRadius:2,
    padding:'6px 10px',
    minWidth: width,
    boxShadow:'inset 0 0 12px rgba(0,0,0,.6), inset 0 0 0 1px rgba(234,242,255,.04)',
  }}>
    <span style={{ fontFamily:'var(--font-pixel)', fontSize:9, letterSpacing:'.14em', color:'var(--foreground-dim)' }}>{label}</span>
    <span style={{ fontFamily:'var(--font-lcd)', fontSize:26, lineHeight:1, color:'var(--primary-light)', textShadow:'0 0 8px rgba(255,85,96,.6)' }}>{value}</span>
  </div>
);

const ArcadeButton = ({ children, variant='primary', icon, onClick }) => {
  const isPrimary = variant === 'primary';
  const base = {
    fontFamily:'var(--font-pixel)',
    fontSize:18,
    letterSpacing:'.04em',
    padding:'12px 22px',
    borderRadius:2,
    cursor:'pointer',
    display:'inline-flex',
    alignItems:'center',
    gap:12,
    transition:'transform .08s steps(2), box-shadow .08s steps(2)',
  };
  const primary = {
    background:'var(--primary)', color:'var(--primary-ink)',
    border:'2px solid var(--primary-ink)',
    boxShadow:'0 4px 0 0 var(--primary-dark), 0 0 24px rgba(239,51,64,.45)',
  };
  const secondary = {
    background:'transparent', color:'var(--foreground)',
    border:'2px solid var(--foreground)',
    boxShadow:'0 4px 0 0 var(--surface-line)',
  };
  return (
    <button
      onClick={onClick}
      style={{ ...base, ...(isPrimary ? primary : secondary), whiteSpace:'nowrap' }}
      onMouseDown={e => e.currentTarget.style.transform = 'translateY(3px)'}
      onMouseUp={e => e.currentTarget.style.transform = ''}
      onMouseLeave={e => e.currentTarget.style.transform = ''}
    >
      {icon}{children}
    </button>
  );
};

const Kbd = ({ children, wide }) => (
  <kbd style={{
    fontFamily:'var(--font-pixel)',
    background:'var(--surface-raised)',
    border:'1px solid var(--surface-line)',
    borderBottomWidth: 3,
    borderRadius: 2,
    padding:'5px 10px',
    fontSize: 12,
    color:'var(--foreground)',
    minWidth: wide ? 64 : 30,
    display:'inline-block',
    textAlign:'center',
    letterSpacing:'.05em',
  }}>{children}</kbd>
);

const Icon = ({ d, size = 20, stroke = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

/* A big “fjord horizon” pixel illustration for hero backgrounds. */
const FjordBackdrop = () => (
  <svg viewBox="0 0 400 120" preserveAspectRatio="none" width="100%" height="120"
    style={{ position:'absolute', bottom:0, left:0, display:'block' }}
    shapeRendering="crispEdges">
    {/* distant mountains */}
    <g fill="#0f1f45" opacity=".9">
      <polygon points="0,80 30,60 60,72 90,50 130,75 170,55 210,78 250,58 290,80 330,62 370,76 400,60 400,120 0,120"/>
    </g>
    <g fill="#142a5a">
      <polygon points="0,100 20,85 45,95 75,78 110,95 140,82 180,100 215,86 255,100 295,84 340,98 375,85 400,95 400,120 0,120"/>
    </g>
    {/* snow caps (cold white) */}
    <g fill="#eaf2ff" opacity=".8">
      <polygon points="28,62 30,60 32,62"/>
      <polygon points="88,52 90,50 92,52"/>
      <polygon points="168,57 170,55 172,57"/>
      <polygon points="248,60 250,58 252,60"/>
      <polygon points="328,64 330,62 332,64"/>
    </g>
    {/* water */}
    <rect x="0" y="100" width="400" height="20" fill="#020615"/>
    {/* pixel water sparkles */}
    {[20, 70, 120, 180, 240, 300, 360].map(x => (
      <rect key={x} x={x} y="106" width="2" height="2" fill="#1d3060"/>
    ))}
  </svg>
);

Object.assign(window, { PixelBezel, Marquee, LCDReadout, ArcadeButton, Kbd, Icon, FjordBackdrop });
