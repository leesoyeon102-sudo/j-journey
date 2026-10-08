export type LineId = string;

export interface Neighbor {
  to: string;
  /** 인접 역 사이 소요 시간(분) */
  min: number;
}

export interface Line {
  id: LineId;
  name: string;
  color: string;
  /** 배차 간격(분) */
  headway: number;
  /** 노선별 시간표 위상(분) */
  phase: number;
  stations: string[];
  /** 인접 역 연결 (지선 포함, 양방향) */
  adj: Map<string, Neighbor[]>;
  /** 기준역에서 각 역까지의 누적 소요 시간 */
  dist: Map<string, number>;
  edges: [string, string, number][];
}

export interface Station {
  name: string;
  lat: number;
  lng: number;
}

export interface WalkLeg {
  type: "walk";
  kind: "home" | "transfer" | "dest" | "direct";
  from: string;
  to: string;
  /** 하루 0시 기준 분 */
  start: number;
  end: number;
}

export interface RideLeg {
  type: "ride";
  line: LineId;
  lineName: string;
  color: string;
  direction: string;
  from: string;
  to: string;
  /** 지나는 역 전체(승차역~하차역) */
  stations: string[];
  /** 열차 출발 */
  start: number;
  /** 하차역 도착 */
  end: number;
  /** 실제 시간표로 확인한 열차인지 (false면 배차 간격 기준 예상) */
  scheduled: boolean;
  trainNo?: string;
  /** 승차역 도착 후 열차를 기다리는 시간 */
  waitMin: number;
}

export interface BusLeg {
  type: "bus";
  routeName: string;
  /** 간선·지선·마을·광역 등 */
  kind: string;
  color: string;
  from: string;
  to: string;
  /** 지나는 정류장 수 (승차 정류장 제외) */
  stopCount: number;
  /** 승차 정류장에 도착하는 시각 */
  arriveStop: number;
  /** 버스 탑승 시각 (현재 도착 정보로 예상했거나, 배차 간격 기준 늦어도 이 시각) */
  start: number;
  end: number;
  /** 정류장에 도착해서 탈 때까지 기다리는 시간 */
  waitMin: number;
  /** 배차 간격(분) */
  headway: number;
  /** 현재 도착 정보를 바탕으로 예상했는지 (false면 배차 간격 기준) */
  realtime: boolean;
}

export type Leg = WalkLeg | RideLeg | BusLeg;

export interface Plan {
  /** 출발(집)·도착 장소 */
  origin: string;
  destination: string;
  /** 출발·도착 장소 좌표 (다시 안내받기용) */
  originCoord?: { lat: number; lng: number };
  destCoord?: { lat: number; lng: number };
  /** 도보 시간을 실제 경로가 아닌 직선거리로 추정했는지 */
  walkEstimated?: boolean;
  /** 일부 열차 시각이 시간표가 아닌 배차 간격 기준 예상인지 */
  scheduleEstimated?: boolean;
  /** 버스 시각이 현재 도착 정보가 아닌 배차 간격 기준 예상인지 (버스가 있는 안에서만) */
  busEstimated?: boolean;
  /** 계산에 쓴 시간표 요일 */
  dayType?: "weekday" | "saturday" | "sunday";
  /** 도보 시간을 기준으로 자동 선택된 이용 역 */
  /** 걸어서만 가는 경로면 빈 문자열 */
  originStation: string;
  destinationStation: string;
  /** 약속 시각(분) */
  arriveBy: number;
  /** 장소 → 역 도보 시간(자동 계산) */
  walkHome: number;
  walkDest: number;
  buffer: number;
  leaveAt: number;
  /** 약속 장소 도착 예정 */
  arriveAt: number;
  legs: Leg[];
  transfers: number;
}

export type PlanResult =
  /** plans[0]이 추천 경로, 뒤는 대안(2안) */
  | { ok: true; plan: Plan; plans: Plan[] }
  | { ok: false; message: string };

export type TripStatus = "planned" | "ontime" | "late";

export interface Trip {
  id: string;
  routeKey: string;
  createdAt: number;
  arrivedAt?: number;
  status: TripStatus;
  plan: Plan;
}
