import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const cases = [
  ["Tracking", "Single and multi-object trajectories from continuous video."],
  ["Optical flow", "Sparse and dense motion fields converted into structured data."],
  ["Motion magnification", "Subtle temporal variation made observable and measurable."],
  ["ArUco", "Marker displacement and relative-motion analysis."],
  ["Pose", "Realtime COCO pose estimation and gesture classification."],
] as const;

export function UseCaseList() {
  return (
    <div className="use-case-list">
      {cases.map(([title, description], index) => (
        <details key={title} open={index === 2}>
          <summary>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{title}</strong>
            <span className="use-case-list__mark" aria-hidden="true"><FontAwesomeIcon icon={faPlus} /></span>
          </summary>
          <p>{description}</p>
        </details>
      ))}
    </div>
  );
}
