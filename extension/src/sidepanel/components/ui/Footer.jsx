export default function Footer() {
  // Read version from manifest when available (sidepanel runs in extension context).
  let version = '1.0.0j';
  try {
    const manifest = chrome?.runtime?.getManifest?.();
    version = manifest?.version_name ?? manifest?.version ?? version;
  } catch {
    // jsdom/test environment — fall through to default.
  }

  return (
    <footer
      style={{
        position: 'fixed',
        bottom: 8,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        padding: '2px 14px',
        background: 'rgba(20, 32, 50, 0.1)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid var(--border)',
        borderRadius: 9999,
        boxShadow: 'var(--shadow-md)',
        fontSize: 12,
        fontWeight: 500,
        color: 'var(--text-secondary)',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
      }}
    >
      youZen · v{version}
    </footer>
  );
}
