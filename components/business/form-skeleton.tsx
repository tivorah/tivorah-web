// Loading state shaped like the business forms (Your shop, Sell an item,
// Offer a service, Create an event): page header, then white step cards.
const bar = (name: string) => <span className={`${name} tivorah-shimmer`} />;
const field = (key: number) => <div key={key} className="form-skel-field">{bar("form-skel-label")}{bar("form-skel-input")}</div>;

export function BusinessFormSkeleton({ shop = false }: { shop?: boolean }) {
  const basics = <section className="showcase-step">
    {bar("form-skel-heading")}
    {field(0)}
    <div className="form-skel-field">{bar("form-skel-label")}{bar("form-skel-textarea")}</div>
    <div className="showcase-row">{field(1)}{field(2)}</div>
  </section>;
  const photos = (count: number) => <section className="showcase-step">
    {bar("form-skel-heading")}{bar("form-skel-hint")}
    <div className="showcase-photos">{Array.from({ length: count }, (_, index) => <span key={index} className="form-skel-tile tivorah-shimmer" />)}</div>
  </section>;
  return <div className={`showcase-page form-skel${shop ? "" : " business-create-page"}`} role="status" aria-busy="true" aria-label={shop ? "Loading your shop" : "Loading form"}>
    <header className="showcase-editor-head" aria-hidden="true">
      <div>{bar("form-skel-back")}{bar("form-skel-title")}{bar("form-skel-intro")}{bar("form-skel-intro short")}</div>
      {shop ? <div className="showcase-editor-head-actions">{bar("form-skel-pill")}{bar("form-skel-button")}</div> : null}
    </header>
    {shop ? <div className="showcase-form" aria-hidden="true">
      <section className="showcase-step">
        {bar("form-skel-heading")}{bar("form-skel-hint")}
        <div className="showcase-brand"><div className="showcase-brand-slot is-cover">{bar("form-skel-label")}<div className="showcase-brand-frame tivorah-shimmer" /></div><div className="showcase-brand-slot is-logo">{bar("form-skel-label")}<div className="showcase-brand-frame tivorah-shimmer" /></div></div>
      </section>
      {basics}
      {photos(4)}
    </div> : <div className="create-shell" aria-hidden="true">
      {/* Create screens: essentials on the left, summary (preview + checklist + action) on the right. */}
      <div className="create-main">
        {basics}
        {photos(3)}
        <section className="showcase-step">{bar("form-skel-heading")}<div className="showcase-row">{field(3)}{field(4)}</div></section>
      </div>
      <div className="create-summary">
        <span className="form-skel-preview tivorah-shimmer" />
        {bar("form-skel-heading")}
        {Array.from({ length: 5 }, (_, index) => <span key={index} className="form-skel-check tivorah-shimmer" />)}
        <span className="form-skel-input tivorah-shimmer" />
      </div>
    </div>}
  </div>;
}
