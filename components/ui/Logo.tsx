const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <div style={{ position: 'relative', width: 32, height: 32 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #f5a623, #d97706)', borderRadius: '8px', transform: 'rotate(3deg)' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#fff', fontWeight: 900, fontSize: 14, fontFamily: 'Playfair Display, serif' }}>R</span>
      </div>
    </div>
    <span style={{ color: '#fff', fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em' }}>
      Resu<span style={{ color: '#f5a623' }}>Max</span>
    </span>
  </div>
);

export default Logo;