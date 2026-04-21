import { Leaf } from 'lucide-react';
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
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 9999,
            background:
              'linear-gradient(135deg, var(--color-leaf-deep) 0%, var(--color-pistachio) 100%)',
            boxShadow: '0 0 0 1px rgba(127, 168, 127, 0.28), 0 8px 24px rgba(127, 168, 127, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          <Leaf size={20} color="#faf9f0" strokeWidth={2.25} />
        </div>

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
