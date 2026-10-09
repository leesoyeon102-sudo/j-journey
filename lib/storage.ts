"use client";

import { useSyncExternalStore } from "react";
import type { Place } from "./places";
import type { Plan, Trip } from "./types";
import { routeKeyOf } from "./planner";

const KEY = "j-outing:trips:v2";
const EMPTY: Trip[] = [];

let cacheRaw: string | null = null;
let cacheValue: Trip[] = EMPTY;
const listeners = new Set<() => void>();

function read(): Trip[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === cacheRaw) return cacheValue;
    cacheRaw = raw;
    cacheValue = raw ? (JSON.parse(raw) as Trip[]) : EMPTY;
    return cacheValue;
  } catch {
    return EMPTY;
  }
}

function write(trips: Trip[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(trips));
  } catch {
    // 저장 공간을 쓸 수 없는 환경에서는 조용히 무시
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

/** 저장된 안내 기록(최신순). 서버 렌더에서는 빈 배열. */
export function useTrips() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** 새 안내를 저장한다. 같은 경로의 기록 없는 안내는 대체한다. */
export function addTrip(plan: Plan): Trip {
  const routeKey = routeKeyOf(plan);
  const trip: Trip = {
    id: crypto.randomUUID(),
    routeKey,
    createdAt: Date.now(),
    status: "planned",
    plan,
  };
  const rest = read().filter((t) => !(t.status === "planned" && t.routeKey === routeKey));
  write([trip, ...rest]);
  return trip;
}

/** 도착 기록. 추천이 아닌 안을 따라간 경우 `plan`으로 기록된 경로를 바꾼다. */
export function recordArrival(id: string, onTime: boolean, plan?: Plan) {
  write(
    read().map((t) =>
      t.id === id
        ? {
            ...t,
            ...(plan ? { plan, routeKey: routeKeyOf(plan) } : {}),
            status: onTime ? "ontime" : "late",
            arrivedAt: Date.now(),
          }
        : t,
    ),
  );
}

/** 마지막으로 고른 장소(출발지·도착지)를 기억해 두는 저장소 */
function createPlaceStore(key: string) {
  let raw: string | null | undefined;
  let value: Place | null = null;
  // 저장소에 쓰지 못하는 환경(사생활 보호 모드 등)에서도 이번 방문 중에는 값이 유지되도록 한다.
  let memory: Place | null = null;

  const read = (): Place | null => {
    try {
      const next = localStorage.getItem(key);
      if (next === raw) return value ?? memory;
      raw = next;
      value = next ? (JSON.parse(next) as Place) : null;
      return value ?? memory;
    } catch {
      return memory;
    }
  };

  return {
    /** 서버 렌더·하이드레이션 중에는 undefined, 고른 적이 없으면 null */
    use: () => useSyncExternalStore<Place | null | undefined>(subscribe, read, () => undefined),
    save: (place: Place) => {
      memory = place;
      try {
        localStorage.setItem(key, JSON.stringify(place));
      } catch {
        // 저장할 수 없는 환경에서는 메모리 값만 쓴다.
      }
      listeners.forEach((l) => l());
    },
  };
}

const originStore = createPlaceStore("j-outing:origin");
const destinationStore = createPlaceStore("j-outing:destination");

const homeStore = createPlaceStore("j-outing:home-place");

/** 집 주소. 미등록이면 null, 불러오는 중이면 undefined */
export const useHome = homeStore.use;
export const saveHome = homeStore.save;
export const useLastOrigin = originStore.use;
export const saveLastOrigin = originStore.save;
export const useLastDestination = destinationStore.use;
export const saveLastDestination = destinationStore.save;

/**
 * 경로 내역에서 경로를 지운다. 도착을 기록한 안내는 로드맵에 남도록 지우지 않고 숨기기만 하고,
 * 도착 기록이 없는 안내는 그대로 지운다.
 */
export function removeRoute(routeKey: string) {
  write(
    read()
      .filter((t) => t.routeKey !== routeKey || t.status !== "planned")
      .map((t) => (t.routeKey === routeKey ? { ...t, hidden: true } : t)),
  );
}
