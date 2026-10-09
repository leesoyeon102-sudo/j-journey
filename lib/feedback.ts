import * as amplitude from "@amplitude/analytics-browser";

const KEY = "j-outing:feedback-asked";

/** 피드백 창을 이미 한 번 띄웠는지. 보냈든 닫았든 다시 묻지 않는다. */
export function hasAskedFeedback(): boolean {
  try {
    return localStorage.getItem(KEY) !== null;
  } catch {
    // 저장소를 못 쓰는 환경에서는 귀찮게 하지 않도록 이미 물은 것으로 친다.
    return true;
  }
}

export function markFeedbackAsked() {
  try {
    localStorage.setItem(KEY, String(Date.now()));
  } catch {
    // 저장 공간을 쓸 수 없는 환경에서는 조용히 무시
  }
}

type VisitedPage = "history" | "roadmap";

/** 경로 내역·로드맵에 한 번이라도 들어와 봤는지 (피드백을 묻는 조건) */
export function markVisited(page: VisitedPage) {
  try {
    localStorage.setItem(`j-outing:visited-${page}`, "1");
  } catch {
    // 저장 공간을 쓸 수 없는 환경에서는 조용히 무시
  }
}

export function hasVisited(page: VisitedPage): boolean {
  try {
    return localStorage.getItem(`j-outing:visited-${page}`) !== null;
  } catch {
    return false;
  }
}

/** 별점과 의견을 Amplitude 이벤트로 보낸다. (별도 서버·DB는 없다) */
export function submitFeedback(rating: number, comment: string) {
  amplitude.track("Feedback Submitted", { rating, comment: comment.trim() });
}
