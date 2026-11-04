import OptionsDropdown from './OptionsDropdown';

export default function Header() {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '20px 16px 0',
        marginBottom: 20,
        position: 'relative',
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Brand mark — same artwork as public/icons/icon.svg (icon A, Nord room + leaf). */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 128 128"
          width={40}
          height={40}
          style={{
            flexShrink: 0,
            borderRadius: 9,
            boxShadow: '0 8px 24px -8px rgb(142 202 230 / 0.45)',
          }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="yz-room" x1="0" y1="0" x2="0.4" y2="1">
              <stop offset="0" stopColor="#2b3448" />
              <stop offset="1" stopColor="#11141c" />
            </linearGradient>
            <radialGradient id="yz-glow" cx="0.3" cy="0.15" r="0.9">
              <stop offset="0" stopColor="#8ecae6" stopOpacity="0.35" />
              <stop offset="0.6" stopColor="#8ecae6" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="128" height="128" rx="28" fill="url(#yz-room)" />
          <rect width="128" height="128" rx="28" fill="url(#yz-glow)" />
          <rect
            x="0.75"
            y="0.75"
            width="126.5"
            height="126.5"
            rx="27.25"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.12"
            strokeWidth="1.5"
          />
          <g transform="translate(64 66) rotate(-20) scale(3.7) translate(-12 -12)">
            <path
              d="M12 2C8 2 4 5 4 11c0 4 2 7 5 9 1-4 3-7 6-9-2 3-3 6-4 9 4-1 8-4 9-10 0-5-4-8-8-8z"
              fill="#b2dba4"
            />
          </g>
        </svg>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span
            className="text-accent-gradient"
            style={{ fontSize: 22, fontWeight: 600, lineHeight: 1, letterSpacing: '-0.03em' }}
          >
            youZen
          </span>
          <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-muted)' }}>
            YouTube for studying, not scrolling
          </span>
        </div>
      </div>

      <OptionsDropdown />
    </header>
  );
}
