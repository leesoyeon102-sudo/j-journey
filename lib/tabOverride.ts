"use client";

import { useSyncExternalStore } from "react";

// 경로 내역에서 다시 안내받은 출발 안내는 주소가 홈("/")이지만, 탭바에서는 "안내 내역"이 계속 선택돼 있어야 한다.
// 그때 선택해 둘 탭 주소를 담는 작은 전역 상태.
let override: string | null = null;
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function setTabOverride(href: string | null) {
  if (override === href) return;
  override = href;
  listeners.forEach((l) => l());
}

export function useTabOverride() {
  return useSyncExternalStore(
    subscribe,
    () => override,
    () => null,
  );
}
