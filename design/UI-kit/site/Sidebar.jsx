// Arcade sidebar — pixel bezel, VT323 player id, red active state.

const Sidebar = ({ active = 'hjem', onNav = () => {}, collapsed = false }) => {
  const items = [
    { id:'hjem',     label:'HJEM',      icon:<path d="M3 12l9-9 9 9M5 10v10h14V10"/> },
    { id:'spill',    label:'SPILL',     icon:<><path d="M6 11V5a3 3 0 016 0v6"/><path d="M8 19H6a4 4 0 01-4-4v-1a3 3 0 013-3h14a3 3 0 013 3v1a4 4 0 01-4 4h-2"/><path d="M8 19l4 2 4-2"/></> },
    { id:'toppliste',label:'TOPPLISTE', icon:<><path d="M6 9h12l-1 12H7z"/><path d="M9 9V5a3 3 0 016 0v4"/></> },
    { id:'regler',   label:'REGLER',    icon:<><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></> },
    { id:'profil',   label:'PROFIL',    icon:<><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0116 0v1"/></> },
  ];
  const w = collapsed ? 72 : 232;
  return (
    <aside style={{
      width: w, flexShrink: 0,
      background: 'var(--sidebar-background)',
      borderRight: '1px solid var(--surface-line)',
      height: '100vh',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--font-pixel)',
    }}>
      {/* Logo block */}
      <div style={{
        padding:'18px 14px 14px', display:'flex', alignItems:'center', gap:10,
        borderBottom:'1px solid var(--surface-line)',
      }}>
        <div style={{
          width: 36, height: 36,
          background:'var(--primary)',
          border:'2px solid var(--primary-ink)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:'var(--font-pixel)', fontWeight:700, fontSize:18,
          color:'var(--primary-ink)',
          boxShadow:'0 0 12px rgba(239,51,64,.5)',
          flexShrink: 0,
        }}>SS</div>
        {!collapsed && (
          <div>
            <div style={{ fontSize:14, color:'var(--foreground)', lineHeight:1.1 }}>SIGURD</div>
            <div style={{ fontSize:14, color:'var(--primary-light)', lineHeight:1.1 }}>STARTUP</div>
          </div>
        )}
      </div>

      {/* Player ID readout */}
      {!collapsed && (
        <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--surface-line)' }}>
          <div style={{ fontSize:9, color:'var(--foreground-dim)', letterSpacing:'.2em', marginBottom:4 }}>PLAYER 1</div>
          <div style={{
            fontFamily:'var(--font-lcd)', fontSize:22, lineHeight:1,
            color:'var(--primary-light)',
            textShadow:'0 0 8px rgba(255,85,96,.55)',
          }}>GRÜNDER_42</div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--foreground-muted)', marginTop:4 }}>
            LVL 3 <span style={{ color:'var(--foreground-dim)' }}>·</span> 128 400 kr
          </div>
        </div>
      )}

      <nav style={{ flex:1, padding:10, display:'flex', flexDirection:'column', gap:4 }}>
        {items.map(i => {
          const isActive = active === i.id;
          return (
            <button key={i.id} onClick={() => onNav(i.id)} style={{
              display:'flex', alignItems:'center',
              gap: collapsed ? 0 : 14,
              padding: collapsed ? 0 : '0 12px',
              height: 40,
              border:'none',
              cursor:'pointer',
              fontFamily:'var(--font-pixel)',
              fontSize:14,
              letterSpacing:'.08em',
              background: isActive ? 'var(--primary)' : 'transparent',
              color: isActive ? 'var(--primary-ink)' : 'var(--foreground-muted)',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderLeft: isActive ? '3px solid var(--primary-ink)' : '3px solid transparent',
              boxShadow: isActive ? '0 0 0 1px var(--primary-dark) inset' : 'none',
              position: 'relative',
            }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background='var(--surface-raised)'; e.currentTarget.style.color='var(--foreground)'; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--foreground-muted)'; } }}
            >
              {isActive && !collapsed && <span style={{ fontFamily:'var(--font-pixel)', color:'var(--primary-ink)', marginRight:-6 }}>▶</span>}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{i.icon}</svg>
              {!collapsed && <span>{i.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Insert coin footer */}
      {!collapsed && (
        <div style={{ padding:14, borderTop:'1px solid var(--surface-line)' }}>
          <div style={{
            fontFamily:'var(--font-pixel)',
            fontSize: 11,
            color:'var(--primary-light)',
            textAlign:'center',
            letterSpacing:'.14em',
            animation:'caret-blink 1.2s steps(2) infinite',
          }}>▶ INSERT COIN</div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--foreground-dim)', textAlign:'center', marginTop:4 }}>
            © 2025 JAA
          </div>
        </div>
      )}
    </aside>
  );
};

Object.assign(window, { Sidebar });
