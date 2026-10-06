"use client";

import { useSyncExternalStore } from "react";

// 출발 안내 화면을 나갈 때 확인 창을 띄우기 위한 작은 전역 상태.
let active = false;
let pending: (() => void) | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** 출발 안내 화면이 떠 있는 동안 true */
export function setLeaveGuard(on: boolean) {
  active = on;
  if (!on) pending = null;
  emit();
}

export const isLeaveGuardActive = () => active;

/** 화면을 나가기 전에 호출한다. 안내 화면이면 확인 창을 띄우고, 아니면 바로 실행한다. */
export function requestLeave(action: () => void) {
  if (!active) {
    action();
    return;
  }
  pending = action;
  emit();
}

export function confirmLeave() {
  const action = pending;
  pending = null;
  active = false;
  emit();
  action?.();
}

export function cancelLeave() {
  pending = null;
  emit();
}

export function useLeavePending() {
  return useSyncExternalStore(
    subscribe,
    () => pending !== null,
    () => false,
  );
}
