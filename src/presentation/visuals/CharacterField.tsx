const characters = [
  ["/media/rewild/fawn.avif", "Fawn character"],
  ["/media/rewild/bird.avif", "Bird character"],
  ["/media/rewild/dolphin.avif", "Dolphin character"],
  ["/media/rewild/tortue.avif", "Sea turtle character"],
] as const;

export function CharacterField() {
  return (
    <figure className="character-field">
      <div className="character-field__copy flex flex-col gap-4">
        <p className="eyebrow">Shared ecosystem</p>
        <h3>Species are relationships, not collectibles</h3>
        <p>Each character belongs to a habitat and a dynamic ecological network affected by group decisions.</p>
      </div>
      <div className="character-field__animals" aria-label="RE:WILD character artwork">
        {characters.map(([src, alt]) => <img alt={alt} key={src} loading="lazy" src={src} />)}
      </div>
      <figcaption>Character assets supplied in the RE:WILD project material.</figcaption>
    </figure>
  );
}
