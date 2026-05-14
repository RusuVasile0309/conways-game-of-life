export function BlockIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="4" y="4" width="5" height="5" />
      <rect x="11" y="4" width="5" height="5" />
      <rect x="4" y="11" width="5" height="5" />
      <rect x="11" y="11" width="5" height="5" />
    </svg>
  );
}
