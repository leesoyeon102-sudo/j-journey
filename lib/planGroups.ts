import type { Plan, PlanGroups } from "./types";

/**
 * 안이 지하철 위주인지 버스 위주인지: 지하철 탑승 시간과 버스 탑승 시간 중 긴 쪽.
 * 지하철도 버스도 안 타는(걸어서만 가는) 안은 null.
 */
export function planMode(plan: Plan): "subway" | "bus" | null {
  let subway = 0;
  let bus = 0;
  for (const l of plan.legs) {
    if (l.type === "ride") subway += l.end - l.start;
    else if (l.type === "bus") bus += l.end - l.start;
  }
  if (subway === 0 && bus === 0) return null;
  return subway >= bus ? "subway" : "bus";
}

/** 지하철을 한 번이라도 타는 안인가. 지하철+버스 환승도 포함한다. */
export const usesSubway = (plan: Plan) => plan.legs.some((l) => l.type === "ride");

/** 안들을 칩 필터용으로 묶는다. plans[0]이 추천. */
export function groupPlans(plans: Plan[]): PlanGroups {
  return {
    recommended: plans[0],
    subway: plans.filter(usesSubway),
    bus: plans.filter((p) => planMode(p) === "bus"),
  };
}
