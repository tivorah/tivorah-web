"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="product-page page-shell">
      <div className="product-notice" role="alert">
        <h1>We couldn’t load this page.</h1>
        <p>Please try again in a moment.</p>
        <button className="product-primary" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
