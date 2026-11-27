/**
 * Minimal branded loader (server-safe, CSS only): a glowing core orbited by a
 * thin ring, with three "thinking" dots. Used while lazy chunks and route
 * segments load.
 */
export function Loader({
  minHeight = 240,
  label = 'Loading',
  className = '',
}: {
  minHeight?: number | string;
  label?: string;
  className?: string;
}) {
  return (
    <div className={`tl-loader ${className}`} style={{ minHeight }} role="status" aria-live="polite">
      <span className="tl-loader-mark" aria-hidden="true">
        <span className="tl-loader-ring" />
        <span className="tl-loader-core" />
      </span>
      <span className="tl-loader-label">
        {label}
        <span className="tl-loader-dots" aria-hidden="true"><i /><i /><i /></span>
      </span>
    </div>
  );
}

export function PageLoader() {
  return <Loader minHeight="100vh" className="tl-loader-page" />;
}
