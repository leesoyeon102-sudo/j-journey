"use client";

import { useEffect, useSyncExternalStore } from "react";

// 피드백 얼럿을 띄우면 안 되는 화면(경로 상세, 위치 선택, 출발 안내, 다른 얼럿 등)이 알려 주는 작은 전역 상태.
// 하나라도 막고 있으면 피드백 얼럿은 뜨지 않는다.
let blockers = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** 피드백 얼럿이 막혀 있는지 */
export function useFeedbackBlocked() {
  return useSyncExternalStore(
    subscribe,
    () => blockers > 0,
    () => false,
  );
}

/** `active`인 동안 피드백 얼럿을 막는다. 화면이 사라지면 자동으로 풀린다. */
export function useFeedbackBlock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    blockers += 1;
    emit();
    return () => {
      blockers -= 1;
      emit();
    };
  }, [active]);
}
