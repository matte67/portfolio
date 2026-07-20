const phases = [
  ["01", "Brief", "Read the ecosystem in crisis."],
  ["02", "Explore", "Locate damaged habitats and imbalance."],
  ["03", "Cooperate", "Restore, relocate, and manage resources."],
  ["04", "Respond", "Face pollution, drought, or habitat loss."],
  ["05", "Rebalance", "Watch the biodiversity index react."],
  ["06", "Debrief", "Connect actions with concepts learned."],
] as const;

export function MechanicSequence() {
  return (
    <ol className="mechanic-sequence" aria-label="RE:WILD gameplay sequence">
      {phases.map(([number, title, description]) => (
        <li key={number}>
          <span>{number}</span>
          <strong>{title}</strong>
          <p>{description}</p>
        </li>
      ))}
    </ol>
  );
}
