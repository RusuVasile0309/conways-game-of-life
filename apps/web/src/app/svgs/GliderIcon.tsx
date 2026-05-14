// Canonical glider: .X. / ..X / XXX
export function GliderIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      {/* row 0: .X. */}
      <rect x="7" y="2" width="5" height="5" />
      {/* row 1: ..X */}
      <rect x="13" y="8" width="5" height="5" />
      {/* row 2: XXX */}
      <rect x="1" y="14" width="5" height="5" />
      <rect x="7" y="14" width="5" height="5" />
      <rect x="13" y="14" width="5" height="5" />
    </svg>
  );
}
