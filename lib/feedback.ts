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

const ARRIVED_EVENT = "j-outing:arrived";

/** "도착했어요"를 눌렀다고 알린다. 피드백 창이 이 신호를 받아 잠시 뒤 띄운다. */
export function notifyArrived() {
  window.dispatchEvent(new Event(ARRIVED_EVENT));
}

/** 도착 신호를 구독한다. */
export function onArrived(cb: () => void) {
  window.addEventListener(ARRIVED_EVENT, cb);
  return () => window.removeEventListener(ARRIVED_EVENT, cb);
}

/** 별점과 의견을 Amplitude 이벤트로 보낸다. (별도 서버·DB는 없다) */
export function submitFeedback(rating: number, comment: string) {
  amplitude.track("Feedback Submitted", { rating, comment: comment.trim() });
}
