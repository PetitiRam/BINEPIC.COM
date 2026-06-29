export default function Logo({ size = 40, withWordmark = true, light = false, overrideUrl = null }) {
  const inkColor = light ? '#FBF6EC' : '#16201B';
  const forest = '#1B4332';
  const amber = '#E0A93C';
  const terracotta = '#C1622D';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {overrideUrl ? (
        <img src={overrideUrl} alt="JEDIDA Marketplace" style={{ width: size, height: size, borderRadius: size * 0.25, objectFit: 'cover' }} />
      ) : (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" rx="12" fill={forest} />
          {/* Woven basket strands forming a J, evoking market baskets + agriculture */}
          <path d="M16 12V28C16 32.4183 19.5817 36 24 36H30" stroke={amber} strokeWidth="4.2" strokeLinecap="round" />
          <path d="M16 12V28C16 32.4183 19.5817 36 24 36H30" stroke={terracotta} strokeWidth="1.4" strokeLinecap="round" strokeDasharray="3 5" />
          <circle cx="31.5" cy="36" r="3.2" fill={amber} />
          <path d="M12 17H20" stroke="#FBF6EC" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
          <path d="M12 22.5H20" stroke="#FBF6EC" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        </svg>
      )}
      {withWordmark && (
        <span style={{
          fontFamily: "'Sora', sans-serif",
          fontWeight: 800,
          fontSize: size * 0.5,
          letterSpacing: '-0.02em',
          color: inkColor
        }}>
          JEDIDA <span style={{ color: amber }}>Marketplace</span>
        </span>
      )}
    </div>
  );
}
