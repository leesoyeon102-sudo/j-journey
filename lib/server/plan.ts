import { nearestStations, type Place } from "../places";
import { planTrip } from "../planner";
import { STATIONS } from "../stations";
import type { PlanResult } from "../types";
import { loadTimetable, type DayType } from "./seoul";
import { walkMatrix } from "./walk";

const CANDIDATES = 4;

export function dayTypeOf(date: string): DayType {
  const d = new Date(`${date}T00:00:00Z`).getUTCDay();
  return d === 0 ? "sunday" : d === 6 ? "saturday" : "weekday";
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
  return planTrip({
    origin,
    destination,
    arriveBy,
    buffer,
    originStations: o.map((s, i) => ({ ...s, walkMin: minutes[0][i] })),
    destStations: d.map((s, j) => ({ ...s, walkMin: minutes[1][o.length + j] })),
    directWalkMin: minutes[0][o.length + d.length],
    walkEstimated: estimated,
    dayType,
    loadTimetable: (stops) => loadTimetable(stops, dayType),
  });
}
