interface PulseMarkProps {
  size?: number;
  animated?: boolean;
  className?: string;
}

export function PulseMark({ size = 40, animated = true, className }: PulseMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="pulse-mark-bg" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0a0e1a" />
          <stop offset="1" stopColor="#05070c" />
        </linearGradient>
        <radialGradient id="pulse-mark-glow" cx="30" cy="12" r="14" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5ad1ff" stopOpacity="0.45" />
          <stop offset="1" stopColor="#5ad1ff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="2.5" y="2.5" width="59" height="59" rx="15" fill="url(#pulse-mark-bg)" stroke="#1b2333" />
      <circle cx="30" cy="12" r="14" fill="url(#pulse-mark-glow)" />

      <path
        d="M 6 32 L 18 32 L 22 26 L 26 38 L 30 12 L 34 50 L 38 32 L 58 32"
        fill="none"
        stroke="#5ad1ff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx="30" cy="12" r="2.6" fill="#5ad1ff" className={animated ? "animate-pulse-dot" : undefined} />
    </svg>
  );
}
