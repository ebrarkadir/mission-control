interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section className="panel panel--placeholder">
      <div className="panel__header">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="placeholder-notice">
        <span className="placeholder-notice__tag">Coming Soon</span>
        <p>This module will be implemented in a future release.</p>
      </div>
    </section>
  );
}
