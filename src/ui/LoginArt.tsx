/**
 * Line-art illustration for the login page: a person working at a laptop.
 * Strokes inherit `currentColor`; the accent shapes use the brand blue.
 */
export function LoginArt() {
  const line = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  const accent = '#b9cdf2'

  return (
    <svg viewBox="0 0 320 300" role="img" aria-label="Person working at a laptop">
      {/* Sparkles */}
      <g {...line} opacity="0.7">
        <path d="M36 130v10M31 135h10" />
        <path d="M200 190v10M195 195h10" />
        <circle cx="163" cy="120" r="5" />
      </g>

      {/* Desk */}
      <g {...line}>
        <path d="M14 178h250" />
        <path d="M22 178v78M256 178v78M96 178v78M186 178v78" />
      </g>
      <rect x="14" y="168" width="250" height="12" rx="4" fill={accent} stroke="none" />

      {/* Laptop */}
      <g {...line}>
        <path d="M46 168 60 128h58l6 40z" />
        <path d="M40 168h92l6 10H34z" />
      </g>

      {/* Figure: tall rectangular body */}
      <g {...line}>
        <rect x="128" y="60" width="42" height="118" rx="4" />
        <path d="M128 96h42" />
        {/* Head area with face */}
        <circle cx="142" cy="80" r="3" fill="currentColor" />
        <circle cx="158" cy="80" r="3" fill="currentColor" />
        <path d="M144 88q6 5 12 0" />
        {/* Arm reaching to the laptop */}
        <path d="M128 118c-14 4-22 12-24 22" />
        <path d="M180 120c10 6 12 16 6 24s-18 6-22-2" />
      </g>

      {/* Hat / top plate */}
      <g {...line}>
        <path d="M120 60h58" />
      </g>
      <rect x="120" y="52" width="58" height="10" rx="4" fill={accent} stroke="none" />

      {/* Base plate */}
      <rect x="120" y="168" width="58" height="10" rx="4" fill={accent} stroke="none" />
      <g {...line}>
        <path d="M120 178h58" />
      </g>
    </svg>
  )
}
