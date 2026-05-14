// Stylised Gosper Glider Gun — staggered dots suggesting the gun structure
export function GosperGliderGunIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      {/* left block suggestion */}
      <rect x="1" y="8" width="3" height="3" />
      <rect x="1" y="12" width="3" height="3" />
      {/* middle body */}
      <rect x="6" y="6" width="3" height="3" />
      <rect x="6" y="10" width="3" height="3" />
      <rect x="6" y="14" width="3" height="3" />
      {/* right barrel */}
      <rect x="11" y="4" width="3" height="3" />
      <rect x="11" y="10" width="3" height="3" />
      {/* muzzle flash */}
      <rect x="16" y="8" width="3" height="3" />
    </svg>
  );
}
