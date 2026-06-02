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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 128 128"
          width={40}
          height={40}
          style={{
            flexShrink: 0,
            boxShadow: '0 0 0 1px rgba(127, 168, 127, 0.28), 0 8px 24px rgba(127, 168, 127, 0.3)',
            borderRadius: 9,
          }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="yz-bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C6D8A9" />
              <stop offset="100%" stopColor="#A8C9A0" />
            </linearGradient>
          </defs>
          <rect width="128" height="128" rx="28" ry="28" fill="url(#yz-bg)" />
          <g transform="translate(64 64) rotate(-20) scale(3.9) translate(-12 -12)">
            <path
              d="M12 2C8 2 4 5 4 11c0 4 2 7 5 9 1-4 3-7 6-9-2 3-3 6-4 9 4-1 8-4 9-10 0-5-4-8-8-8z"
              fill="#FDFCF8"
            />
          </g>
        </svg>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span
            className="text-accent-gradient"
            style={{
              fontFamily: 'var(--font-cursive)',
              fontSize: 40,
              fontWeight: 400,
              lineHeight: 0.9,
              letterSpacing: '0',
            }}
          >
            youZen
          </span>

          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--text-secondary)',
              letterSpacing: '0.01em',
            }}
          >
            declutter your YouTube
          </span>
        </div>
      </div>

      <OptionsDropdown />
    </header>
  );
}
