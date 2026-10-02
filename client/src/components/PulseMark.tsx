interface PulseMarkProps {
  size?: number;
  animated?: boolean;
  className?: string;
}

/**
 * The app icon as a tile (development/plans/app-icons, the Field set, 1024 grid): a heartbeat on
 * the night field, the dot on the beat happening now. The mark is drawn a little larger than on the
 * home screen, as in the favicon, so it holds at header size. It stays a dark tile in the light
 * theme too.
 */
export function PulseMark({ size = 40, animated = true, className }: PulseMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 1024 1024" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="pulse-mark-bg" x1="0.25" y1="0" x2="0.75" y2="1">
          <stop offset="0" stopColor="#14254a" />
          <stop offset="1" stopColor="#060c1c" />
        </linearGradient>
        <radialGradient id="pulse-mark-sheen" cx="0.5" cy="-0.1" r="0.9">
          <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1024" height="1024" rx="232" fill="url(#pulse-mark-bg)" />
      <rect width="1024" height="1024" rx="232" fill="url(#pulse-mark-sheen)" />

      <g transform="translate(512 512) scale(1.14) translate(-512 -512)">
        <path
          d="M188 566 H346 L412 444 L494 706 L584 302 L656 566 H836"
          fill="none"
          stroke="#5ad1ff"
          strokeWidth="80"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="584" cy="302" r="60" fill="#5ee39a" className={animated ? "animate-pulse-dot" : undefined} />
      </g>
    </svg>
  );
}
