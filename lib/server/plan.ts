import { nearestStations, type Place } from "../places";
import { planTrip } from "../planner";
import { attachWalkCoords } from "../walkCoords";
import { STATIONS } from "../stations";
import type { PlanResult } from "../types";
import { busPlans } from "./busPlan";
import { kakaoPlans } from "./kakaoPlan";
import { loadTimetable, type DayType } from "./seoul";
import { walkMatrix } from "./walk";

const CANDIDATES = 4;

export function dayTypeOf(date: string): DayType {
  const d = new Date(`${date}T00:00:00Z`).getUTCDay();
  return d === 0 ? "sunday" : d === 6 ? "saturday" : "weekday";
}

/** 한국 시간 기준 오늘 날짜(YYYY-MM-DD)와 지금 시각(하루 0시 기준 분) */
export function nowKst() {
  const k = new Date(Date.now() + 9 * 3600_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${k.getUTCFullYear()}-${pad(k.getUTCMonth() + 1)}-${pad(k.getUTCDate())}`,
    minute: k.getUTCHours() * 60 + k.getUTCMinutes() + k.getUTCSeconds() / 60,
  };
}

/**
 * 집·도착지 좌표로 도보 시간(보행 경로 API)과 열차 시각(서울교통공사 시간표)을 확인해 경로를 계산한다.
 */
export async function computePlans(
  origin: Place,
  destination: Place,
  arriveBy: number,
  buffer: number,
  date: string,
): Promise<PlanResult> {
  // 카카오맵 경로(어떤 수단을 어떤 순서로 타는지)를 먼저 따라가 본다. 실패하거나 결과가 없으면 아래 기존 계산으로 대신한다.
  {
    const dayType = dayTypeOf(date);
    const now = nowKst();
    const kakao = await kakaoPlans({
      origin,
      destination,
      arriveBy,
      buffer,
      dayType,
      isToday: date === now.date,
      nowMin: now.minute,
      loadTimetable: (stops) => loadTimetable(stops, dayType),
    }).catch(() => null);
    if (kakao) {
      const destCoord = { lat: destination.lat, lng: destination.lng };
      const originCoord = { lat: origin.lat, lng: origin.lng };
      for (const p of kakao.plans) {
        p.destCoord = destCoord;
        p.originCoord = originCoord;
        p.dayType = dayType;
        p.date = date;
        if (kakao.walkEstimated) p.walkEstimated = true;
      }
      return { ok: true, plan: kakao.plans[0], plans: kakao.plans, groups: kakao.groups };
    }
  }

  const o = nearestStations(origin, CANDIDATES);
  const d = nearestStations(destination, CANDIDATES);

  const targets = [
    ...o.map((s) => STATIONS[s.station]),
    ...d.map((s) => STATIONS[s.station]),
    destination,
  ].map(({ lat, lng }) => ({ lat, lng }));
  const { minutes, estimated } = await walkMatrix(
    [origin, destination].map(({ lat, lng }) => ({ lat, lng })),
    targets,
  );

  const dayType = dayTypeOf(date);
  const now = nowKst();
  const originStations = o.map((s, i) => ({ ...s, walkMin: minutes[0][i] }));
  const destStations = d.map((s, j) => ({ ...s, walkMin: minutes[1][o.length + j] }));
  const result = await planTrip({
    origin,
    destination,
    arriveBy,
    buffer,
    originStations,
    destStations,
    directWalkMin: minutes[0][o.length + d.length],
    walkEstimated: estimated,
    dayType,
    loadTimetable: (stops) => loadTimetable(stops, dayType),
    // 버스를 섞은 안: 약속 날짜가 오늘이고 가까운 시각이면 현재 도착 정보로 버스 시각을 예상한다.
    extraPlans: () =>
      busPlans({
        origin,
        destination,
        arriveBy,
        buffer,
        originStations,
        destStations,
        dayType,
        isToday: date === now.date,
        nowMin: now.minute,
        loadTimetable: (stops) => loadTimetable(stops, dayType),
      }),
  });
  if (result.ok) {
    const o = { lat: origin.lat, lng: origin.lng };
    const d = { lat: destination.lat, lng: destination.lng };
    for (const p of result.plans) {
      attachWalkCoords(p, o, d);
      p.date = date;
    }
  }
  return result;
}
