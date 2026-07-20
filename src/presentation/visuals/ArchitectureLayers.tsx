
export function ArchitectureLayers() {
  return (
    <figure className="architecture-layers">
      <img src="/media/hackathon/architecture.png" alt="Architecture layers" className="max-h-96 mx-auto pb-8" loading="lazy" />
      <figcaption className="text-center">Dependencies point inward. The core owns contracts, runtime planning, events, errors, and policies.</figcaption>
    </figure>
  );
}
