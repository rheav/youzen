function SkeletonBar({ width = '100%', height = 12, style: s = {} }) {
  return (
    <div
      className="animate-shimmer"
      style={{
        width,
        height,
        borderRadius: 'var(--radius-sm)',
        ...s,
      }}
    />
  );
}

export default function Skeleton({
  variant = 'text',
  lines = 3,
  rows = 5,
  className = '',
  style: styleProp = {},
}) {
  if (variant === 'text') {
    const widths = ['90%', '75%', '85%', '60%', '70%'];
    return (
      <div
        className={className}
        style={{ display: 'flex', flexDirection: 'column', gap: 8, ...styleProp }}
      >
        {Array.from({ length: lines }, (_, i) => (
          <SkeletonBar key={i} width={widths[i % widths.length]} />
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={className}
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          ...styleProp,
        }}
      >
        <SkeletonBar width="40%" height={14} />
        <SkeletonBar width="90%" />
        <SkeletonBar width="65%" />
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          ...styleProp,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', gap: 8 }}>
          <SkeletonBar width="20%" height={14} />
          <SkeletonBar width="50%" height={14} />
          <SkeletonBar width="15%" height={14} />
          <SkeletonBar width="15%" height={14} />
        </div>
        {/* Rows */}
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, opacity: 1 - i * 0.1 }}>
            <SkeletonBar width="20%" height={10} />
            <SkeletonBar width="50%" height={10} />
            <SkeletonBar width="15%" height={10} />
            <SkeletonBar width="15%" height={10} />
          </div>
        ))}
      </div>
    );
  }

  return null;
}
