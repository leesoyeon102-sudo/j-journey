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

// 주소는 "/"인데 탭바는 "안내 내역"이 선택된 동안, 탭바의 "홈"을 누르면 실행할 일(출발 안내를 닫고 입력 화면으로).
let homeAction: (() => void) | null = null;
export const setHomeAction = (fn: (() => void) | null) => {
  homeAction = fn;
};
export const runHomeAction = () => homeAction?.();

export function useTabOverride() {
  return useSyncExternalStore(
    subscribe,
    () => override,
    () => null,
  );
}
