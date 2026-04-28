// Sidebar, Card, SectionCard, StatCard, Button, Kbd, Icon all on window

const ICONS = {
  joystick: <><path d="M6 11V5a3 3 0 016 0v6"/><path d="M8 19H6a4 4 0 01-4-4v-1a3 3 0 013-3h14a3 3 0 013 3v1a4 4 0 01-4 4h-2"/><path d="M8 19l4 2 4-2"/></>,
  book: <><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></>,
  users: <><circle cx="9" cy="8" r="4"/><path d="M3 21v-1a6 6 0 0112 0v1"/><circle cx="17" cy="9" r="3"/><path d="M21 21v-1a4 4 0 00-3-3.87"/></>,
  trophy: <><path d="M6 9h12l-1 12H7z"/><path d="M9 9V5a3 3 0 016 0v4"/></>,
  trendup: <><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></>,
  target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
  gamepad: <><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4M8 10v4M15 13v.01M18 11v.01"/></>,
  coins: <><circle cx="8" cy="8" r="6"/><path d="M18 10.37A6 6 0 1110.34 18"/></>,
  alert: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4"/><circle cx="12" cy="17" r=".5"/></>,
  award: <><circle cx="12" cy="8" r="6"/><path d="M15.5 13l2.5 9-6-3-6 3 2.5-9"/></>,
  login: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></>,
};

const controls = [
  { keys: ['←', '→'], wasd: ['A', 'D'], desc: 'Beveg deg sidelengs' },
  { keys: ['↑'], wasd: ['W'], desc: 'Hopp' },
  { keys: ['SPACE'], desc: 'Flytemodus (Hold)' },
  { keys: ['↑', 'SHIFT'], wasd: ['W', 'SHIFT'], desc: 'Super hopp', combo: true },
  { keys: ['↓'], wasd: ['S'], desc: 'Rask fall' },
];

function HomeView() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '48px 0 64px' }}>
        <h1 style={{ fontFamily: 'var(--font-pixel)', fontSize: 56, fontWeight: 700, margin: 0, color: '#fff' }}>Sigurd Startup</h1>
        <div style={{ marginTop: 18, color: 'var(--muted-foreground)', fontSize: 14 }}>
          Produsent: <span style={{ textDecoration: 'line-through', fontWeight: 700, color: '#ef4444', opacity: .7 }}>Tehkan</span>
          <span style={{ fontWeight: 700, color: 'var(--primary)', marginLeft: 8 }}>Jonas Andersen</span>
        </div>
        <div style={{ marginTop: 6, color: 'var(--muted-foreground)', fontSize: 14 }}>
          År: <span style={{ textDecoration: 'line-through', fontWeight: 700, color: '#ef4444', opacity: .7 }}>1984</span>
          <span style={{ fontWeight: 700, color: 'var(--primary)', marginLeft: 8 }}>2025</span>
        </div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
          <Button icon={<Icon d={ICONS.joystick} size={22} />}>Spill Nå</Button>
          <Button variant="secondary" icon={<Icon d={ICONS.book} size={22} />}>Regler</Button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 48 }}>
        <StatCard icon={<Icon d={ICONS.users} size={28} />} value="1 337" label="Aktive Gründere" />
        <StatCard icon={<Icon d={ICONS.trophy} size={28} />} value="338 500 kr" label="Høyeste Score" />
        <StatCard icon={<Icon d={ICONS.trendup} size={28} />} value="4,2" label="Gjennomsnittlig Nivå" />
      </div>

      <h2 style={{ textAlign: 'center', fontSize: 24, fontWeight: 700, marginBottom: 32 }}>Hvordan Spille</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <SectionCard icon={<Icon d={ICONS.target} size={24} />} title="Mål">
          <p style={{ color: 'var(--muted-foreground)', lineHeight: 1.6, margin: 0 }}>
            Hjelp Sigurd med å bli den ultimate norske gründeren! Samle finansieringsmynter, unngå byråkratiske feller, og naviger gjennom det treacherous startup-landskapet.
          </p>
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              [ICONS.coins, 'Samle finansieringer til din forretningsidé'],
              [ICONS.alert, 'Unngå byråkratiske hindringer'],
              [ICONS.award, 'Oppnå unicorn-status'],
              [ICONS.trendup, 'Øk din startup-verdi'],
            ].map(([d, t], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--muted-foreground)' }}>
                <Icon d={d} size={20} stroke="var(--primary)" /><span>{t}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard icon={<Icon d={ICONS.gamepad} size={24} />} title="Kontroller">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {controls.map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < controls.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ color: 'var(--muted-foreground)', fontSize: 14, fontWeight: 500 }}>{c.desc}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {c.keys.map((k, j) => (
                    <React.Fragment key={j}>
                      <Kbd wide={k === 'SPACE' || k === 'SHIFT'}>{k}</Kbd>
                      {j < c.keys.length - 1 && <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 12 }}>+</span>}
                    </React.Fragment>
                  ))}
                  {c.wasd && (
                    <>
                      <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 12 }}>eller</span>
                      {c.wasd.map((k, j) => (
                        <React.Fragment key={j}>
                          <Kbd wide={k === 'SHIFT'}>{k}</Kbd>
                          {j < c.wasd.length - 1 && <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 12 }}>+</span>}
                        </React.Fragment>
                      ))}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18, background: 'var(--muted)', borderRadius: 8, padding: 14 }}>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--muted-foreground)', lineHeight: 1.55 }}>
              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Tips: </span>
              Bruk flytemodus for å navigere vanskelige hindringer og super hopp for å nå høyere plattformer!
            </p>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function App() {
  const [active, setActive] = React.useState('hjem');
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)', color: 'var(--foreground)' }}>
      <Sidebar active={active} onNav={setActive} />
      <main style={{ flex: 1, overflow: 'auto' }}>
        <HomeView />
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
