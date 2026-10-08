import type { NearStation, Place } from "./places";
import { LINES, STATIONS, linesOf } from "./stations";
import type { Timetable } from "./timetable";
import type { Leg, Line, LineId, Plan, PlanResult, RideLeg } from "./types";

type StationResult = { ok: true; plan: Plan } | { ok: false; message: string };

/** 실제 시간표로 다시 계산해 볼 후보의 수 */
const REFINE_CANDIDATES = 6;
/** 보여줄 안의 개수(추천 + 대안) */
const MAX_PLANS = 2;
/** 걸어서 갈 만한 최대 시간(분) */
const MAX_WALK_ONLY = 60;
/** 추천보다 이만큼 이상 일찍 나가야 하는 대안은 보여주지 않는다 */
const MAX_ALT_GAP = 40;

export const TRANSFER_WALK = 4; // 환승 이동 + 승강장 이동
export const PLATFORM = 2; // 역 도착 후 승강장까지
export const FIRST_TRAIN = 5 * 60 + 30;
const DIR_PHASE = 2; // 상·하행 시간표 어긋남
const TRANSFER_PENALTY = 8; // 경로 선택 시 환승 1회를 이만큼의 시간으로 간주

export interface PlanInput {
  origin: Place;
  destination: Place;
  arriveBy: number;
  buffer: number;
  /** 출발지·도착지에서 가까운 역 후보와 도보 시간(분) */
  originStations: NearStation[];
  destStations: NearStation[];
  /** 출발지 → 도착지 도보 시간(분) */
  directWalkMin: number;
  walkEstimated?: boolean;
  /** 실제 열차 시간표를 받아 오는 함수. 없으면 배차 간격 기준 예상으로 계산한다. */
  loadTimetable?: (stops: { line: string; station: string }[]) => Promise<Timetable | undefined>;
  dayType?: Plan["dayType"];
  /** 지하철 외 다른 수단(버스 등)을 섞은 안을 추가로 만들어 주는 함수 */
  extraPlans?: () => Promise<Plan[]>;
}

interface StationPlanInput {
  origin: string;
  destination: string;
  originName: string;
  destinationName: string;
  arriveBy: number;
  walkHome: number;
  walkDest: number;
  buffer: number;
}

export interface Ride {
  line: Line;
  /** 승차역부터 하차역까지 지나는 역 */
  path: string[];
  /** 첫 구간의 진행 방향: 0 = 기준역에서 멀어지는 쪽, 1 = 기준역 쪽 */
  dir: 0 | 1;
}

export const lineById = (id: LineId) => LINES.find((l) => l.id === id)!;

function hopDir(line: Line, a: string, b: string): 0 | 1 {
  return line.dist.get(b)! >= line.dist.get(a)! ? 0 : 1;
}

function hopMin(line: Line, a: string, b: string) {
  return line.adj.get(a)!.find((n) => n.to === b)!.min;
}

/** 출발역~도착역 최소 시간 경로 (환승 페널티 포함 다익스트라) */
export function findRides(origin: string, destination: string): Ride[] | null {
  type Node = { line: Line; station: string };
  const key = (n: Node) => `${n.line.id}:${n.station}`;
  const dist = new Map<string, number>();
  const prev = new Map<string, { from: string; dir: 0 | 1 | null }>();
  const nodes = new Map<string, Node>();
  const done = new Set<string>();
  // 후보 큐: 아직 확정되지 않은 노드만 보관
  const open = new Set<string>();

  for (const line of linesOf(origin)) {
    const n = { line, station: origin };
    dist.set(key(n), 0);
    nodes.set(key(n), n);
    open.add(key(n));
  }

  let goal: string | null = null;
  while (open.size) {
    let cur: string | null = null;
    let best = Infinity;
    for (const k of open) {
      const d = dist.get(k)!;
      if (d < best) {
        best = d;
        cur = k;
      }
    }
    if (cur === null) break;
    open.delete(cur);
    done.add(cur);
    const node = nodes.get(cur)!;
    if (node.station === destination) {
      goal = cur;
      break;
    }
    const relax = (n: Node, cost: number, dir: 0 | 1 | null) => {
      const k = key(n);
      if (done.has(k)) return;
      const nd = best + cost;
      if (nd < (dist.get(k) ?? Infinity)) {
        dist.set(k, nd);
        prev.set(k, { from: cur!, dir });
        nodes.set(k, n);
        open.add(k);
      }
    };
    for (const nb of node.line.adj.get(node.station) ?? []) {
      relax({ line: node.line, station: nb.to }, nb.min, hopDir(node.line, node.station, nb.to));
    }
    for (const other of linesOf(node.station)) {
      if (other.id !== node.line.id) {
        relax({ line: other, station: node.station }, TRANSFER_PENALTY, null);
      }
    }
  }
  if (!goal) return null;

  const chain: { node: Node; dir: 0 | 1 | null }[] = [];
  for (let k: string | undefined = goal; k; k = prev.get(k)?.from) {
    chain.push({ node: nodes.get(k)!, dir: prev.get(k)?.dir ?? null });
  }
  chain.reverse();

  const rides: Ride[] = [];
  chain.forEach(({ node, dir }, k) => {
    if (dir === null) return; // 출발·환승 노드
    const last = rides[rides.length - 1];
    if (last && last.line.id === node.line.id && last.path[last.path.length - 1] === chain[k - 1].node.station) {
      last.path.push(node.station);
    } else {
      rides.push({ line: node.line, path: [chain[k - 1].node.station, node.station], dir });
    }
  });
  return rides;
}

/** 해당 방향으로 역에서 열차가 출발하는 시각의 위상(분) */
function phaseAt(line: Line, dir: 0 | 1, station: string) {
  const d = line.dist.get(station)!;
  const p = dir === 0 ? d + line.phase : line.phase + DIR_PHASE - d;
  return ((p % line.headway) + line.headway) % line.headway;
}

export function latestDeparture(line: Line, dir: 0 | 1, station: string, notAfter: number) {
  const phase = phaseAt(line, dir, station);
  const diff = (((notAfter - phase) % line.headway) + line.headway) % line.headway;
  return notAfter - diff;
}

export function rideDuration(r: Ride) {
  let t = 0;
  for (let k = 0; k < r.path.length - 1; k++) t += hopMin(r.line, r.path[k], r.path[k + 1]);
  return t;
}

// 2호선 순환 방향(시계 = 내선) 판정용 중심 좌표
const LOOP_CENTER = { lat: 37.545, lng: 126.985 };

// 2호선 지선(성수·신정지선) 역: 순환 방향 대신 종착역으로 표시
const LINE2_BRANCH = new Set(["용답", "신답", "용두", "신설동", "도림천", "양천구청", "신정네거리", "까치산"]);

function loopLabel(prev: string, cur: string) {
  const p = STATIONS[prev];
  const c = STATIONS[cur];
  const cross =
    (p.lng - LOOP_CENTER.lng) * (c.lat - LOOP_CENTER.lat) -
    (p.lat - LOOP_CENTER.lat) * (c.lng - LOOP_CENTER.lng);
  return cross < 0 ? "내선순환" : "외선순환";
}

/** 열차 진행 방향의 종착역(또는 순환 방향) 표시 */
export function directionLabel(r: Ride) {
  const { line, path } = r;
  const a = path[path.length - 2];
  const b = path[path.length - 1];
  if (line.id === "2" && !LINE2_BRANCH.has(a) && !LINE2_BRANCH.has(b)) return loopLabel(a, b);
  const seen = new Set([a, b]);
  let prev = a;
  let cur = b;
  const step = hopDir(line, a, b);
  for (;;) {
    const nexts = (line.adj.get(cur) ?? []).filter((n) => n.to !== prev);
    if (nexts.length === 0) return `${cur} 방면`;
    const unseen = nexts.filter((n) => !seen.has(n.to));
    if (unseen.length === 0) {
      return `${cur} 방면`;
    }
    // 같은 진행 방향을 이어가는 가지를 우선
    const next = unseen.find((n) => hopDir(line, cur, n.to) === step) ?? unseen[0];
    seen.add(next.to);
    prev = cur;
    cur = next.to;
  }
}

/**
 * 장소 두 곳과 도착 시각만으로 계산한다.
 * 도보 시간은 가까운 역 후보까지의 거리로, 열차 이동·환승·대기는 시간표로 자동 계산하고
 * 집에서 나서는 시각이 가장 늦은(= 총 소요 시간이 가장 짧은) 조합을 고른다.
 */
export async function planTrip(input: PlanInput): Promise<PlanResult> {
  const { origin, destination, arriveBy, buffer } = input;
  if (origin.lat === destination.lat && origin.lng === destination.lng) {
    return { ok: false, message: "출발지와 도착지가 같아요." };
  }

  const inputs: StationPlanInput[] = [];
  for (const o of input.originStations) {
    for (const d of input.destStations) {
      if (o.station === d.station) continue;
      inputs.push({
        origin: o.station,
        destination: d.station,
        originName: origin.name,
        destinationName: destination.name,
        arriveBy,
        walkHome: o.walkMin,
        walkDest: d.walkMin,
        buffer,
      });
    }
  }

  // 1단계: 배차 간격 기준으로 후보를 빠르게 추려 낸다.
  const rough: { plan: Plan; input: StationPlanInput }[] = [];
  let roughError: string | null = null;
  for (const inp of inputs) {
    const r = planBetweenStations(inp);
    if (r.ok) rough.push({ plan: r.plan, input: inp });
    else roughError ??= r.message;
  }
  rough.sort((x, y) => y.plan.leaveAt - x.plan.leaveAt || x.plan.transfers - y.plan.transfers);
  const shortlist = pickDistinct(rough, (c) => c.plan, REFINE_CANDIDATES);

  // 2단계: 후보에 쓰이는 역의 실제 시간표를 받아 다시 계산한다.
  let timetable: Timetable | undefined;
  if (input.loadTimetable && shortlist.length > 0) {
    const stops = shortlist.flatMap(({ plan }) =>
      plan.legs
        .filter((l): l is RideLeg => l.type === "ride")
        .flatMap((l) => [
          { line: l.line, station: l.from },
          { line: l.line, station: l.to },
        ]),
    );
    timetable = await input.loadTimetable(stops).catch(() => undefined);
  }

  const candidates: Plan[] = [];
  let firstError: string | null = null;
  for (const { plan, input: inp } of shortlist) {
    const r = timetable ? planBetweenStations(inp, timetable) : { ok: true as const, plan };
    if (r.ok) candidates.push(r.plan);
    else firstError ??= r.message;
  }

  // 걸어서만 가는 방법도 하나의 안으로 비교한다.
  const walk = walkOnlyPlan(origin, destination, arriveBy, buffer, input.directWalkMin);
  if (walk) candidates.push(walk);

  // 버스를 섞은 안
  if (input.extraPlans) {
    try {
      candidates.push(...(await input.extraPlans()));
    } catch {
      // 버스 안을 만들지 못해도 지하철·도보 안은 그대로 보여 준다.
    }
  }

  // 집에서 나서는 시각이 늦은(= 총 소요 시간이 짧은) 순, 같으면 환승이 적은 순
  candidates.sort((x, y) => y.leaveAt - x.leaveAt || x.transfers - y.transfers);
  const plans = pickDistinct(candidates, (p) => p, MAX_PLANS, true);

  if (plans.length > 0) {
    const destCoord = { lat: destination.lat, lng: destination.lng };
    const originCoord = { lat: origin.lat, lng: origin.lng };
    for (const p of plans) {
      p.destCoord = destCoord;
      p.originCoord = originCoord;
      p.dayType = input.dayType;
      if (input.walkEstimated) p.walkEstimated = true;
    }
    return { ok: true, plan: plans[0], plans };
  }
  return {
    ok: false,
    message: firstError ?? roughError ?? "이어지는 경로를 찾지 못했어요.",
  };
}

/** 정렬된 후보에서 서로 다른 경로만 최대 `max`개 고른다. */
function pickDistinct<T>(items: T[], get: (t: T) => Plan, max: number, limitGap = false): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const p = get(item);
    // 같은 구간을 다른 버스 번호로만 타는 안은 하나로 본다.
    const sig = p.legs
      .map((l) => (l.type === "ride" ? `${l.line}:${l.from}>${l.to}` : l.type === "bus" ? `bus:${l.from}>${l.to}` : ""))
      .join("|") + `|${p.originStation}|${p.destinationStation}`;
    if (seen.has(sig)) continue;
    if (limitGap && out.length > 0 && get(out[0]).leaveAt - p.leaveAt > MAX_ALT_GAP) continue;
    seen.add(sig);
    out.push(item);
    if (out.length === max) break;
  }
  return out;
}

function walkOnlyPlan(
  origin: Place,
  destination: Place,
  arriveBy: number,
  buffer: number,
  min: number,
): Plan | null {
  if (min > MAX_WALK_ONLY) return null;
  const arriveAt = arriveBy - buffer;
  const leaveAt = arriveAt - min;
  if (leaveAt < 0) return null;
  return {
    origin: origin.name,
    destination: destination.name,
    originStation: "",
    destinationStation: "",
    arriveBy,
    walkHome: min,
    walkDest: 0,
    buffer,
    leaveAt,
    arriveAt,
    legs: [
      { type: "walk", kind: "direct", from: origin.name, to: destination.name, start: leaveAt, end: arriveAt },
    ],
    transfers: 0,
  };
}

/** 도착 시각에서 거꾸로 계산해 출발 시각과 탈 열차를 구한다. */
function planBetweenStations(input: StationPlanInput, tt?: Timetable): StationResult {
  const { origin, destination, arriveBy, walkHome, walkDest, buffer } = input;
  const rides = findRides(origin, destination);
  if (!rides || rides.length === 0) {
    return { ok: false, message: "이어지는 경로를 찾지 못했어요." };
  }

  // 뒤에서부터 열차 시각 확정. 시간표가 있으면 실제 열차로, 없으면 배차 간격 기준 예상으로 계산한다.
  const scheduled: { ride: Ride; start: number; end: number; real?: string }[] = [];
  let deadline = arriveBy - walkDest - buffer;
  for (let r = rides.length - 1; r >= 0; r--) {
    const ride = rides[r];
    const dur = rideDuration(ride);
    const last = ride.path[ride.path.length - 1];
    const real = tt?.latest(ride.line.id, ride.path[0], last, deadline, dur * 1.8 + 8);
    if (real === null) {
      return { ok: false, message: "그 시각에 탈 수 있는 열차가 없어요. 첫차 전이거나 막차 이후예요." };
    }
    if (real) {
      scheduled[r] = { ride, start: real.start, end: real.end, real: real.trainNo };
    } else {
      const start = latestDeparture(ride.line, ride.dir, ride.path[0], deadline - dur);
      scheduled[r] = { ride, start, end: start + dur };
    }
    deadline = scheduled[r].start - TRANSFER_WALK;
  }

  const first = scheduled[0];
  const leaveAt = first.start - PLATFORM - walkHome;
  if (leaveAt < 0 || (!first.real && first.start < FIRST_TRAIN)) {
    return {
      ok: false,
      message: "첫차 이전 시간이에요. 도착 시각을 조금 늦춰 주세요.",
    };
  }

  const legs: Leg[] = [
    {
      type: "walk",
      kind: "home",
      from: input.originName,
      to: origin,
      start: leaveAt,
      end: leaveAt + walkHome,
    },
  ];
  let prevEnd = leaveAt + walkHome;
  scheduled.forEach(({ ride, start, end, real }, n) => {
    const stations = ride.path;
    const leg: RideLeg = {
      type: "ride",
      line: ride.line.id,
      lineName: ride.line.name,
      color: lineById(ride.line.id).color,
      direction: directionLabel(ride),
      from: stations[0],
      to: stations[stations.length - 1],
      stations,
      start,
      end,
      scheduled: real !== undefined,
      trainNo: real,
      waitMin: start - prevEnd,
    };
    legs.push(leg);
    const next = scheduled[n + 1];
    if (next) {
      legs.push({
        type: "walk",
        kind: "transfer",
        from: leg.to,
        to: next.ride.path[0],
        start: end,
        end: end + TRANSFER_WALK,
      });
      prevEnd = end + TRANSFER_WALK;
    }
  });
  const last = scheduled[scheduled.length - 1];
  legs.push({
    type: "walk",
    kind: "dest",
    from: destination,
    to: input.destinationName,
    start: last.end,
    end: last.end + walkDest,
  });

  const plan: Plan = {
    origin: input.originName,
    destination: input.destinationName,
    originStation: origin,
    destinationStation: destination,
    arriveBy,
    walkHome,
    walkDest,
    buffer,
    leaveAt,
    arriveAt: last.end + walkDest,
    legs,
    transfers: rides.length - 1,
    scheduleEstimated: scheduled.some((x) => x.real === undefined),
  };
  return { ok: true, plan };
}

/** 같은 출발·도착·노선이면 같은 경로로 묶는 키 */
export function routeKeyOf(plan: Plan) {
  const lines = plan.legs
    .flatMap((l) => (l.type === "ride" ? [l.line] : l.type === "bus" ? [`bus${l.routeName}`] : []))
    .join("-");
  return `${plan.origin}>${plan.destination}>${lines}`;
}

/**
 * 한 역에서 모든 역까지의 예상 소요 시간(분, 환승 페널티 포함). 버스와 이어 붙일 지하철 구간을 고를 때 쓴다.
 */
export function subwayTimes(origin: string): Map<string, number> {
  type Node = { line: Line; station: string };
  const key = (n: Node) => `${n.line.id}:${n.station}`;
  const dist = new Map<string, number>();
  const nodes = new Map<string, Node>();
  const open = new Set<string>();
  const done = new Set<string>();
  for (const line of linesOf(origin)) {
    const n = { line, station: origin };
    dist.set(key(n), 0);
    nodes.set(key(n), n);
    open.add(key(n));
  }
  const best = new Map<string, number>();
  while (open.size) {
    let cur = "";
    let d = Infinity;
    for (const k of open) {
      const v = dist.get(k)!;
      if (v < d) {
        d = v;
        cur = k;
      }
    }
    open.delete(cur);
    done.add(cur);
    const node = nodes.get(cur)!;
    if (!best.has(node.station)) best.set(node.station, d);
    const relax = (n: Node, cost: number) => {
      const k = key(n);
      if (done.has(k)) return;
      const nd = d + cost;
      if (nd < (dist.get(k) ?? Infinity)) {
        dist.set(k, nd);
        nodes.set(k, n);
        open.add(k);
      }
    };
    for (const nb of node.line.adj.get(node.station) ?? []) {
      relax({ line: node.line, station: nb.to }, nb.min);
    }
    for (const other of linesOf(node.station)) {
      if (other.id !== node.line.id) relax({ line: other, station: node.station }, TRANSFER_PENALTY);
    }
  }
  return best;
}
