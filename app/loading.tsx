export default function Loading() {
  return <section className="content recovery-state" role="status" aria-busy="true">
    <p>Loading Tivorah…</p>
    <div className="page-skeleton" aria-hidden="true"><span /><span /><span /></div>
  </section>;
}
