const Sidebar = ({ active = 'hjem', collapsed = false, onNav = () => {} }) => {
  const items = [
    { id: 'hjem', label: 'Hjem', icon: <path d="M3 12l9-9 9 9"/> },
    { id: 'spill', label: 'Spill', icon: <><path d="M6 11V5a3 3 0 016 0v6"/><path d="M8 19H6a4 4 0 01-4-4v-1a3 3 0 013-3h14a3 3 0 013 3v1a4 4 0 01-4 4h-2"/><path d="M8 19l4 2 4-2"/></> },
    { id: 'toppliste', label: 'Toppliste', icon: <><path d="M6 9h12l-1 12H7z"/><path d="M9 9V5a3 3 0 016 0v4"/></> },
    { id: 'regler', label: 'Regler', icon: <><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></> },
    { id: 'profil', label: 'Profil', icon: <><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0116 0v1"/></> },
  ];
  const w = collapsed ? 64 : 256;
  return (
    <aside style={{ width: w, background: 'var(--sidebar-background)', borderRight: '1px solid var(--sidebar-border)', height: '100vh', display: 'flex', flexDirection: 'column', transition: 'width .3s ease-in-out', flexShrink: 0 }}>
      <div style={{ height: 64, borderBottom: '1px solid var(--sidebar-border)', display: 'flex', alignItems: 'center', padding: '0 16px', fontWeight: 700, fontFamily: 'var(--font-sans)', fontSize: 18, whiteSpace: 'nowrap', overflow: 'hidden' }}>
        {!collapsed && 'Sigurd Startup'}
      </div>
      <nav style={{ flex: 1, padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map(i => {
          const isActive = active === i.id;
          return (
            <button key={i.id} onClick={() => onNav(i.id)} style={{
              display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 12, padding: collapsed ? 0 : '0 12px',
              height: 44, borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
              background: isActive ? 'var(--sidebar-primary)' : 'transparent',
              color: isActive ? '#fff' : 'var(--muted-foreground)',
              justifyContent: collapsed ? 'center' : 'flex-start',
              transition: 'all .2s ease-in-out'
            }} onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--sidebar-accent)'; e.currentTarget.style.color = '#fff'; }}}
               onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)'; }}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{i.icon}</svg>
              {!collapsed && <span>{i.label}</span>}
            </button>
          );
        })}
      </nav>
      {!collapsed && (
        <div style={{ padding: '0 16px 12px', display: 'flex', gap: 8, justifyContent: 'center' }}>
          {['GH', 'IN', 'JA'].map(t => (
            <div key={t} style={{ width: 32, height: 32, borderRadius: 9999, background: 'var(--sidebar-accent)', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>{t}</div>
          ))}
        </div>
      )}
      <div style={{ borderTop: '1px solid var(--sidebar-border)', padding: 8 }}>
        <button style={{ width: '100%', height: 44, borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: 12, padding: collapsed ? 0 : '0 12px', fontFamily: 'var(--font-sans)', fontWeight: 500, cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>
          {!collapsed && 'Logg inn'}
        </button>
      </div>
    </aside>
  );
};

Object.assign(window, { Sidebar });
