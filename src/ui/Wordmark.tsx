/** The Preproute wordmark: "Prep" + "route" under a hand-drawn route swoosh. */
export function Wordmark({ small = false }: { small?: boolean }) {
  return (
    <span className={`wordmark ${small ? 'wordmark--sm' : ''}`.trim()}>
      <svg
        className="wordmark__swoosh"
        viewBox="0 0 100 14"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M2 11C10 3 26 1 44 4c14 2.4 24 7 36 6 8-.7 13-4 17-8"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="96" cy="3" r="2.6" fill="currentColor" />
      </svg>
      Prep<span style={{ color: 'var(--navy)' }}>r</span>oute
    </span>
  )
}
