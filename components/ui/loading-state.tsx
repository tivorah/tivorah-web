type LoadingStateProps = {
  label?: string;
  variant?: "cards" | "panels" | "form" | "list" | "compact";
  refreshing?: boolean;
  count?: number;
};

export function LoadingState({
  label = "Loading…",
  variant = "list",
  refreshing = false,
  count: requestedCount,
}: LoadingStateProps) {
  if (refreshing) return <p role="status">Updating…</p>;
  const count = requestedCount ?? (variant === "cards" ? 8 : variant === "compact" ? 1 : 3);
  return (
    <div
      className={`product-loading product-loading-${variant}`}
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      <span className="product-loading-label">{label}</span>
      <div className="product-loading-shapes" aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <div className="product-loading-item" key={index}>
            {variant === "cards" && (
              <span className="product-loading-image tivorah-shimmer" />
            )}
            <div className="product-loading-copy">
              <span className="product-loading-line tivorah-shimmer" />
              <span className="product-loading-line tivorah-shimmer" />
              {variant === "cards" && (
                <span className="product-loading-line tivorah-shimmer" />
              )}
            </div>
            {variant === "form" && (
              <span className="product-loading-input tivorah-shimmer" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
