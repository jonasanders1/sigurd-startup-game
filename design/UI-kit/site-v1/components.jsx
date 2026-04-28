const Card = ({ children, style }) => (
  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: 'var(--shadow-sm)', ...style }}>{children}</div>
);

const SectionCard = ({ icon, title, children }) => (
  <Card>
    <div style={{ padding: 24, paddingBottom: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ color: 'var(--primary)' }}>{icon}</div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: 'var(--foreground)' }}>{title}</h2>
      </div>
    </div>
    <div style={{ padding: '0 24px 24px' }}>{children}</div>
  </Card>
);

const StatCard = ({ icon, value, label }) => (
  <Card style={{ textAlign: 'center', padding: 24 }}>
    <div style={{ color: 'var(--primary)', display: 'flex', justifyContent: 'center', marginBottom: 12 }}>{icon}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--foreground)', marginBottom: 4 }}>{value}</div>
    <div style={{ color: 'var(--muted-foreground)', fontSize: 14 }}>{label}</div>
  </Card>
);

const Button = ({ children, variant = 'primary', onClick, icon, size = 'lg' }) => {
  const base = { fontFamily: 'var(--font-sans)', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 12, transition: 'all .2s ease-in-out' };
  const sizes = { lg: { padding: '14px 28px', fontSize: 16, borderRadius: 12 }, md: { padding: '10px 18px', fontSize: 14, borderRadius: 8 } };
  const variants = {
    primary: { background: 'var(--primary)', color: '#fff', boxShadow: 'var(--shadow-lg)' },
    secondary: { background: 'var(--secondary)', color: '#fff', border: '1px solid var(--secondary)' },
    destructive: { background: 'var(--destructive)', color: '#fff' },
    ghost: { background: 'transparent', color: 'var(--primary)' },
  };
  return (
    <button style={{ ...base, ...sizes[size], ...variants[variant] }} onClick={onClick}
      onMouseEnter={e => {
        if (variant === 'primary') e.currentTarget.style.background = 'var(--primary-dark)';
        if (variant === 'secondary') e.currentTarget.style.background = 'var(--secondary-light)';
        if (variant === 'ghost') e.currentTarget.style.color = 'var(--primary-light)';
      }}
      onMouseLeave={e => {
        if (variant === 'primary') e.currentTarget.style.background = 'var(--primary)';
        if (variant === 'secondary') e.currentTarget.style.background = 'var(--secondary)';
        if (variant === 'ghost') e.currentTarget.style.color = 'var(--primary)';
      }}
    >
      {icon}{children}
    </button>
  );
};

const Kbd = ({ children, wide }) => (
  <kbd style={{ fontFamily: 'var(--font-mono)', background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 10px', fontSize: 12, color: '#fff', boxShadow: 'var(--shadow)', minWidth: wide ? 56 : 28, display: 'inline-block', textAlign: 'center' }}>{children}</kbd>
);

const Icon = ({ d, size = 20, stroke = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

Object.assign(window, { Card, SectionCard, StatCard, Button, Kbd, Icon });
