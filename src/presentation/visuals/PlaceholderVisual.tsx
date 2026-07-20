interface PlaceholderVisualProps {
  readonly label?: string;
}

export function PlaceholderVisual({ label = "Architecture material pending" }: PlaceholderVisualProps) {
  return (
    <div className="placeholder-visual" role="img" aria-label={label}>
      <div className="placeholder-visual__orbit placeholder-visual__orbit--outer" />
      <div className="placeholder-visual__orbit placeholder-visual__orbit--inner" />
      <span className="placeholder-visual__node placeholder-visual__node--one" />
      <span className="placeholder-visual__node placeholder-visual__node--two" />
      <span className="placeholder-visual__node placeholder-visual__node--three" />
      <p>{label}</p>
    </div>
  );
}
