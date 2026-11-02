// Small hand-built SVG illustrations for the mining/tyre theme —
// no external image dependency, fully theme-colorable.

export function MiningTruckIllustration({ width = 220 }) {
  return (
    <svg width={width} viewBox="0 0 220 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="110" cy="122" rx="95" ry="10" fill="#e2e8f0" />
      {/* dump bed */}
      <path d="M20 55 L60 30 L150 30 L150 70 L20 70 Z" fill="#f59e0b" />
      <path d="M20 55 L60 30 L60 70 L20 70 Z" fill="#d97706" />
      {/* cabin */}
      <rect x="150" y="45" width="40" height="35" rx="4" fill="#1e293b" />
      <rect x="157" y="52" width="18" height="14" rx="2" fill="#bfdbfe" />
      {/* chassis */}
      <rect x="20" y="70" width="170" height="14" rx="3" fill="#334155" />
      {/* wheels */}
      <g>
        <circle cx="60" cy="108" r="22" fill="#1e293b" />
        <circle cx="60" cy="108" r="10" fill="#94a3b8" />
        <circle cx="60" cy="108" r="3" fill="#1e293b" />
      </g>
      <g>
        <circle cx="150" cy="108" r="22" fill="#1e293b" />
        <circle cx="150" cy="108" r="10" fill="#94a3b8" />
        <circle cx="150" cy="108" r="3" fill="#1e293b" />
      </g>
    </svg>
  );
}

export function TyreIllustration({ size = 22, color = "#4f46e5" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="21" stroke={color} strokeWidth="4" />
      <circle cx="24" cy="24" r="10" stroke={color} strokeWidth="3" />
      <circle cx="24" cy="24" r="2.5" fill={color} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <line
          key={deg}
          x1="24"
          y1="24"
          x2={24 + 18 * Math.cos((deg * Math.PI) / 180)}
          y2={24 + 18 * Math.sin((deg * Math.PI) / 180)}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />
      ))}
    </svg>
  );
}