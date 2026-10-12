import type { Plan, PlanGroups } from "./types";

// 경로 내역에서 "다시 안내받기"로 계산한 결과를 홈 화면에 넘기는 값(화면 이동 사이에만 유지).
interface Pending {
  tripId: string;
  plans: Plan[];
  /** 추천·지하철 우선·버스 우선 묶음. 없으면 plans로 만든다. */
  groups?: PlanGroups;
}

let pending: Pending | null = null;

export const setPendingResult = (p: Pending) => {
  pending = p;
};
export const peekPendingResult = () => pending;
export const clearPendingResult = () => {
  pending = null;
};
