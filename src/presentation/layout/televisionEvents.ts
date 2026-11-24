export const TELEVISION_CHAPTER_CHANGE = "portfolio:chapter-change";

/** Signals a deliberate chapter jump within the main screen. */
export function signalTelevisionChapterChange(heading: HTMLElement) {
  heading.dispatchEvent(new Event(TELEVISION_CHAPTER_CHANGE, { bubbles: true }));
}
