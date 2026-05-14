export function BlinkerIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="1" y="8" width="5" height="5" />
      <rect x="8" y="8" width="5" height="5" />
      <rect x="15" y="8" width="5" height="5" />
    </svg>
  );
}
