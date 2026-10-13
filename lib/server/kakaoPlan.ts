import { meters } from "../geo";
import type { Place } from "../places";
import { directionLabel, FIRST_TRAIN, latestDeparture, PLATFORM, type Ride } from "../planner";
import { LINES, STATIONS } from "../stations";
import type { Timetable } from "../timetable";
import { planMode } from "../planGroups";
import type { BusLeg, Leg, Line, Plan, PlanGroups, RideLeg, WalkLeg } from "../types";
import { busColor, headwayAt, loadBus, type BusData, type BusRoute, type DayType } from "./bus";
import { fetchArrival } from "./busArrival";
import { walkMatrix } from "./walk";

// 카카오맵 대중교통 경로 조회 API가 알려 주는 "어떤 수단을 어떤 순서로 타는지"를 그대로 따라가고,
// 시각은 우리가 계산한다. 지하철은 서울교통공사 시간표, 버스는 배차 간격·현재 도착 정보로 도착 시각에서 거꾸로 맞춘다.
// 구간 수에 제한이 없어서 지하철+지하철, 지하철+버스, 버스+버스 환승이 모두 나온다.
// 실패하거나 결과가 없으면 null을 돌려주고, 부른 쪽에서 기존 계산으로 대신한다.

/** 정류장에 버스보다 이만큼 일찍 도착하도록 안내한다. */
const STOP_BUFFER = 3;
/** 이 시간(분) 안에 탈 버스까지만 현재 도착 정보로 예상한다. */
const REALTIME_HORIZON = 120;
/** 카카오가 준 경로 중 앞에서 이만큼까지만 시각을 계산해 본다. */
const MAX_ROUTES = 15;
/** 칩(지하철 우선·버스 우선) 하나에 보여줄 안의 개수 */
const GROUP_SIZE = 3;
/** 카카오 경로의 버스 정류장을 우리 버스 데이터의 정류장과 같다고 볼 최대 거리(m) */
const STOP_MATCH_M = 150;
/** 우리 지하철 노선도에 없는 노선의 표시 색 (placeholder 토큰 값) */
const UNKNOWN_LINE_COLOR = "#989b9d";

type LatLng = { lat: number; lng: number };

interface KStep {
  type: "SUBWAY" | "BUS" | "WALKING";
  /** 카카오가 알려 준 소요 시간(초) */
  sec: number;
  stops: string[];
  vehicles: { name: string; type: string }[];
  first?: LatLng;
  last?: LatLng;
}

interface KRoute {
  steps: KStep[];
}

export interface KakaoPlanContext {
  origin: Place;
  destination: Place;
  arriveBy: number;
  buffer: number;
  dayType: DayType;
  /** 약속 날짜가 오늘일 때만 버스 현재 도착 정보를 쓴다 */
  isToday: boolean;
  /** 지금 시각(하루 0시 기준 분) */
  nowMin: number;
  loadTimetable?: (stops: { line: string; station: string }[]) => Promise<Timetable | undefined>;
}

// ─── 카카오 호출 ──────────────────────────────────────────────

const routeCache = new Map<string, { at: number; routes: KRoute[] }>();
const ROUTE_TTL = 60_000;

const round5 = (n: number) => n.toFixed(5);

export async function fetchKakaoRoutes(origin: LatLng, destination: LatLng): Promise<KRoute[] | null> {
  const key = process.env.KAKAO_REST_KEY;
  if (!key || process.env.KAKAO_ROUTING === "off") return null;

  const ck = `${round5(origin.lat)},${round5(origin.lng)}>${round5(destination.lat)},${round5(destination.lng)}`;
  const hit = routeCache.get(ck);
  if (hit && Date.now() - hit.at < ROUTE_TTL) return hit.routes;

  const qs = new URLSearchParams({
    start_x: String(origin.lng),
    start_y: String(origin.lat),
    end_x: String(destination.lng),
    end_y: String(destination.lat),
  });
  try {
    const res = await fetch(`https://dapi.kakao.com/v2/routing/publictraffic?${qs}`, {
      headers: { Authorization: `KakaoAK ${key}` },
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status?: string;
      routes?: {
        steps?: {
          properties?: {
            type?: string;
            time?: number;
            stops?: { name: string }[];
            vehicles?: { name: string; type: string }[];
          };
          path?: { points?: [number, number][] };
        }[];
      }[];
    };
    if (data.status !== "OK" || !Array.isArray(data.routes)) return null;
    const routes: KRoute[] = data.routes.map((r) => ({
      steps: (r.steps ?? []).map((s) => {
        const pts = s.path?.points ?? [];
        const p = s.properties ?? {};
        return {
          type: (p.type as KStep["type"]) ?? "WALKING",
          sec: p.time ?? 0,
          stops: (p.stops ?? []).map((x) => x.name),
          vehicles: p.vehicles ?? [],
          // 좌표는 [경도, 위도] 순서
          first: pts.length ? { lat: pts[0][1], lng: pts[0][0] } : undefined,
          last: pts.length ? { lat: pts[pts.length - 1][1], lng: pts[pts.length - 1][0] } : undefined,
        };
      }),
    }));
    routeCache.set(ck, { at: Date.now(), routes });
    return routes;
  } catch {
    return null;
  }
}

// ─── 이름 연결 (카카오 → 우리 데이터) ───────────────────────────

const norm = (s: string) => s.replace(/\(.*?\)/g, "").replace(/\s/g, "");

const byNorm = new Map<string, string>();
for (const name of Object.keys(STATIONS)) {
  const k = norm(name);
  if (!byNorm.has(k)) byNorm.set(k, name);
}

/** 카카오 역 이름("서울역", "교대(법원.검찰청)")에 해당하는 우리 역 이름. 없으면 null */
function matchStation(raw: string): string | null {
  if (STATIONS[raw]) return raw;
  const n = norm(raw);
  const hit = byNorm.get(n) ?? (n.endsWith("역") ? byNorm.get(n.slice(0, -1)) : undefined);
  return hit ?? null;
}

/** 화면에 쓸 역 이름: 우리 역과 연결되면 우리 이름, 아니면 카카오 이름에서 괄호와 "역"을 뺀 이름 */
function stationLabel(raw: string): string {
  const m = matchStation(raw);
  if (m) return m;
  const n = norm(raw);
  return n.length > 2 && n.endsWith("역") ? n.slice(0, -1) : n;
}

/** 정류장 이름 끝의 "(중)" 같은 차로 표시는 뺀다. */
const stopLabel = (raw: string) => raw.replace(/\((중|우|좌|앙)\)$/, "");

function lineFor(kName: string, a: string | null, b: string | null): Line | null {
  if (!a || !b) return null;
  const names = kName === "수인분당선" ? ["분당선", "수인선"] : [kName];
  return LINES.find((l) => names.includes(l.name) && l.adj.has(a) && l.adj.has(b)) ?? null;
}

// ─── 버스 노선 연결 ─────────────────────────────────────────

const routesByName = new WeakMap<BusData, Map<string, number[]>>();

function busIndex(data: BusData) {
  let m = routesByName.get(data);
  if (!m) {
    m = new Map();
    data.routes.forEach((r, i) => m!.set(r.name, [...(m!.get(r.name) ?? []), i]));
    routesByName.set(data, m);
  }
  return m;
}

interface BusMatch {
  route: BusRoute;
  board: number;
  alight: number;
}

/** 카카오가 알려 준 버스(번호와 승·하차 위치)와 같은 우리 버스 노선·정류장 순서를 찾는다. 없으면 null */
function matchBus(data: BusData | null, step: KStep): BusMatch | null {
  if (!data || !step.first || !step.last) return null;
  const index = busIndex(data);
  let best: (BusMatch & { score: number }) | null = null;
  for (const v of step.vehicles) {
    for (const r of index.get(v.name) ?? []) {
      const route = data.routes[r];
      let board = -1;
      let bd = STOP_MATCH_M;
      let alight = -1;
      let ad = STOP_MATCH_M;
      route.stops.forEach((s, i) => {
        const d1 = meters(step.first!, data.stops[s]);
        if (d1 < bd) {
          bd = d1;
          board = i;
        }
        const d2 = meters(step.last!, data.stops[s]);
        if (d2 < ad) {
          ad = d2;
          alight = i;
        }
      });
      if (board < 0 || alight <= board) continue;
      const score = bd + ad;
      if (!best || score < best.score) best = { route, board, alight, score };
    }
  }
  return best;
}

// ─── 시각 계산 ───────────────────────────────────────────────

type Seg =
  | { kind: "walk"; from: string; to: string; min: number; fromCoord?: LatLng; toCoord?: LatLng }
  | {
      kind: "ride";
      line: string;
      lineName: string;
      color: string;
      direction: string;
      stations: string[];
      start: number;
      end: number;
      trainNo?: string;
      scheduled: boolean;
    }
  | {
      kind: "bus";
      routeName: string;
      busKind: string;
      from: string;
      to: string;
      stopCount: number;
      start: number;
      end: number;
      wait: number;
      headway: number;
      realtime: boolean;
    };

const minutes = (sec: number) => Math.max(1, Math.ceil(sec / 60));

/** 지하철 구간에 쓸 노선·역·방향 정보 */
function subwayInfo(step: KStep) {
  const kName = step.vehicles[0]?.name ?? "";
  const labels = step.stops.map(stationLabel).filter((s, i, arr) => i === 0 || s !== arr[i - 1]);
  const ours = step.stops.map(matchStation);
  const from = ours[0];
  const to = ours[ours.length - 1];
  const line = lineFor(kName, from, to);
  // 모든 역이 우리 노선도에서 이웃하면 우리 방향 표시를 쓴다.
  let direction = `${labels[labels.length - 1]} 방면`;
  let dir: 0 | 1 = 0;
  if (line && from && to) {
    dir = (line.dist.get(to) ?? 0) >= (line.dist.get(from) ?? 0) ? 0 : 1;
    const path = ours.filter((s, i) => s && (i === 0 || s !== ours[i - 1])) as string[];
    const chained = path.length >= 2 && path.every((s, i) => i === 0 || line.adj.get(path[i - 1])?.some((n) => n.to === s));
    if (chained) {
      const ride: Ride = { line, path, dir: (line.dist.get(path[1]) ?? 0) >= (line.dist.get(path[0]) ?? 0) ? 0 : 1 };
      direction = directionLabel(ride);
    }
  }
  return { kName, labels, from, to, line, dir, direction };
}

/**
 * 도착 시각에서 거꾸로 각 구간의 시각을 확정해 안 하나를 만든다. 불가능하면 null.
 * steps: 도보로 시작·끝나는 구간을 뺀 카카오 경로. walkStart·walkEnd: 출발지→첫 승차, 마지막 하차→도착지 도보(분).
 */
async function buildPlan(
  steps: KStep[],
  ctx: KakaoPlanContext,
  walkStart: number,
  walkEnd: number,
  data: BusData | null,
  tt: Timetable | undefined,
): Promise<Plan | null> {
  const segs: Seg[] = [];
  let need = ctx.arriveBy - ctx.buffer - walkEnd; // 마지막 수단이 늦어도 이 시각까지 내려야 한다.

  for (let i = steps.length - 1; i >= 0; i--) {
    const s = steps[i];
    const dur = minutes(s.sec);

    // 카카오가 환승 도보를 따로 주지 않고 수단끼리 바로 이어 주면, 1분짜리 환승 도보를 끼워 넣는다.
    const after = steps[i + 1];
    if (s.type !== "WALKING" && after && after.type !== "WALKING") {
      segs.unshift({ kind: "walk", from: endName(s), to: startName(after), min: 1, fromCoord: s.last, toCoord: after.first });
      need -= 1;
    }

    if (s.type === "WALKING") {
      const prev = steps[i - 1];
      const next = steps[i + 1];
      const min = Math.max(1, Math.round(s.sec / 60));
      segs.unshift({
        kind: "walk",
        from: prev ? endName(prev) : "",
        to: next ? startName(next) : "",
        min,
        fromCoord: s.first ?? prev?.last,
        toCoord: s.last ?? next?.first,
      });
      need -= min;
      continue;
    }

    if (s.type === "SUBWAY") {
      const info = subwayInfo(s);
      const real = info.line && info.from && info.to ? tt?.latest(info.line.id, info.from, info.to, need, dur * 1.8 + 8) : undefined;
      if (real === null) return null; // 시간표는 있는데 그 시각에 탈 열차가 없다.
      let start: number;
      let end: number;
      let trainNo: string | undefined;
      if (real) {
        start = real.start;
        end = real.end;
        trainNo = real.trainNo;
      } else {
        // 시간표가 없는 노선: 배차 간격(우리 노선도에 있을 때)이나 소요 시간만으로 예상한다.
        start = info.line && info.from ? latestDeparture(info.line, info.dir, info.from, need - dur) : need - dur;
        end = start + dur;
        if (info.line && start < FIRST_TRAIN) return null;
      }
      segs.unshift({
        kind: "ride",
        line: info.line?.id ?? info.kName,
        lineName: info.line?.name ?? info.kName,
        color: info.line?.color ?? UNKNOWN_LINE_COLOR,
        direction: info.direction,
        stations: info.labels,
        start,
        end,
        trainNo,
        scheduled: real !== undefined,
      });
      need = start - PLATFORM;
      continue;
    }

    // BUS
    const bus = await scheduleBus(s, need, dur, ctx, data);
    if (!bus) return null;
    segs.unshift(bus);
    need = bus.start - bus.wait;
  }

  const leaveAt = need - walkStart;
  if (leaveAt < 0) return null;
  // 출발 시각이 이미 지났어도 버리지 않는다. 약속까지 남은 시간이 모자라도 카카오 추천을 그대로 따라가고,
  // 이미 늦었다는 것은 출발 안내 화면의 출발 시각으로 알아본다.

  // ── 안 만들기: 앞에서부터 도보와 수단을 이어 붙인다. ──
  const vehicles = segs.filter((g) => g.kind !== "walk");
  if (vehicles.length === 0) return null;
  const firstName = segs[0].kind === "ride" ? segs[0].stations[0] : segs[0].kind === "bus" ? segs[0].from : "";
  const lastSeg = segs[segs.length - 1];
  const lastName = lastSeg.kind === "ride" ? lastSeg.stations[lastSeg.stations.length - 1] : lastSeg.kind === "bus" ? lastSeg.to : "";

  const legs: Leg[] = [];
  const walk = (
    kind: WalkLeg["kind"],
    from: string,
    to: string,
    start: number,
    min: number,
    fromCoord?: LatLng,
    toCoord?: LatLng,
  ): WalkLeg => ({
    type: "walk",
    kind,
    from,
    to,
    ...(fromCoord ? { fromCoord: { lat: fromCoord.lat, lng: fromCoord.lng } } : {}),
    ...(toCoord ? { toCoord: { lat: toCoord.lat, lng: toCoord.lng } } : {}),
    start,
    end: start + min,
  });
  legs.push(walk("home", ctx.origin.name, firstName, leaveAt, walkStart, ctx.origin, steps[0].first));
  let cursor = leaveAt + walkStart;

  for (const g of segs) {
    if (g.kind === "walk") {
      legs.push(walk("transfer", g.from, g.to, cursor, g.min, g.fromCoord, g.toCoord));
      cursor += g.min;
    } else if (g.kind === "ride") {
      const leg: RideLeg = {
        type: "ride",
        line: g.line,
        lineName: g.lineName,
        color: g.color,
        direction: g.direction,
        from: g.stations[0],
        to: g.stations[g.stations.length - 1],
        stations: g.stations,
        start: g.start,
        end: g.end,
        scheduled: g.scheduled,
        trainNo: g.trainNo,
        waitMin: Math.max(0, g.start - cursor),
      };
      legs.push(leg);
      cursor = g.end;
    } else {
      const leg: BusLeg = {
        type: "bus",
        routeName: g.routeName,
        kind: g.busKind,
        color: busColor(g.busKind),
        from: g.from,
        to: g.to,
        stopCount: g.stopCount,
        arriveStop: g.start - g.wait,
        start: g.start,
        end: g.end,
        waitMin: g.wait,
        headway: g.headway,
        realtime: g.realtime,
      };
      legs.push(leg);
      cursor = g.end;
    }
  }
  legs.push(walk("dest", lastName, ctx.destination.name, cursor, walkEnd, steps[steps.length - 1].last, ctx.destination));

  const firstVehicle = vehicles[0];
  const lastVehicle = vehicles[vehicles.length - 1];
  const rides = vehicles.filter((v): v is Extract<Seg, { kind: "ride" }> => v.kind === "ride");
  const buses = vehicles.filter((v): v is Extract<Seg, { kind: "bus" }> => v.kind === "bus");
  return {
    origin: ctx.origin.name,
    destination: ctx.destination.name,
    originStation: firstVehicle.kind === "ride" ? firstVehicle.stations[0] : "",
    destinationStation: lastVehicle.kind === "ride" ? lastVehicle.stations[lastVehicle.stations.length - 1] : "",
    arriveBy: ctx.arriveBy,
    walkHome: walkStart,
    walkDest: walkEnd,
    buffer: ctx.buffer,
    leaveAt,
    arriveAt: cursor + walkEnd,
    legs,
    transfers: vehicles.length - 1,
    scheduleEstimated: rides.some((r) => !r.scheduled) || undefined,
    busEstimated: buses.some((b) => !b.realtime) || undefined,
  };
}

function startName(s: KStep) {
  return s.type === "BUS" ? stopLabel(s.stops[0] ?? "") : stationLabel(s.stops[0] ?? "");
}
function endName(s: KStep) {
  const last = s.stops[s.stops.length - 1] ?? "";
  return s.type === "BUS" ? stopLabel(last) : stationLabel(last);
}

/** 버스 구간: 우리 버스 데이터와 연결되면 배차 간격·현재 도착 정보로, 아니면 소요 시간과 기본 배차 간격으로 예상한다. */
async function scheduleBus(
  s: KStep,
  need: number,
  rideMin: number,
  ctx: KakaoPlanContext,
  data: BusData | null,
): Promise<Extract<Seg, { kind: "bus" }> | null> {
  const latestBoard = need - rideMin;
  const vehicle = s.vehicles[0];
  const base = {
    kind: "bus" as const,
    routeName: vehicle?.name ?? "",
    busKind: vehicle?.type ?? "",
    from: stopLabel(s.stops[0] ?? ""),
    to: stopLabel(s.stops[s.stops.length - 1] ?? ""),
    stopCount: Math.max(1, s.stops.length - 1),
  };

  // 심야버스는 밤(23시~5시 30분)에만 다닌다. 우리 버스 데이터에 첫차·막차가 없어도 이 시간대가 아니면 건너뛴다.
  if (/심야/.test(vehicle?.name ?? "")) {
    const t = ((Math.floor(latestBoard) % 1440) + 1440) % 1440;
    if (t < 23 * 60 && t >= 5 * 60 + 30) return null;
  }

  const m = matchBus(data, s);
  if (!m) {
    // 우리 버스 데이터에 없는 노선: 같은 구간을 지나는 버스가 여러 대면 더 자주 오는 것으로 본다.
    const h = s.vehicles.length >= 3 ? 6 : s.vehicles.length === 2 ? 8 : 10;
    const t = Math.floor(latestBoard);
    return { ...base, start: t, end: Math.ceil(t + rideMin), wait: h + STOP_BUFFER, headway: h, realtime: false };
  }

  const { route, board } = m;
  const h = headwayAt(route, ctx.dayType, latestBoard);
  const arrivals = ctx.isToday && latestBoard <= ctx.nowMin + REALTIME_HORIZON ? await fetchArrival(data!, route, board) : null;
  if (arrivals && arrivals.length) {
    const first = ctx.nowMin + arrivals[0];
    const gap = arrivals.length > 1 ? Math.min(90, Math.max(3, arrivals[1] - arrivals[0])) : h;
    if (first > latestBoard) return null; // 가장 빠른 버스도 마감 이후에 도착
    const t = first + Math.floor((latestBoard - first) / gap) * gap;
    return { ...base, start: Math.floor(t), end: Math.ceil(t + rideMin), wait: STOP_BUFFER, headway: Math.round(gap), realtime: true };
  }

  // 현재 도착 정보를 못 쓰는 경우: 배차 간격만큼 기다려도 타도록 넉넉히 잡는다.
  const t = Math.floor(latestBoard);
  const parse = (x: string) => (x.length >= 4 ? Number(x.slice(0, 2)) * 60 + Number(x.slice(2, 4)) : NaN);
  const offset = route.secs[board] / 60;
  const first = parse(route.first);
  let last = parse(route.last);
  if (!Number.isNaN(first) && !Number.isNaN(last)) {
    if (last < first) last += 1440;
    if (t < first + offset || t > last + offset + 10) return null; // 첫차 전이거나 막차 이후
  }
  return { ...base, start: t, end: Math.ceil(t + rideMin), wait: h + STOP_BUFFER, headway: h, realtime: false };
}

// ─── 바깥에서 부르는 함수 ─────────────────────────────────────

/** 카카오 경로를 앞에서부터 따라가 안을 만든다. 하나도 못 만들거나 카카오 호출이 실패하면 null */
export async function kakaoPlans(
  ctx: KakaoPlanContext,
): Promise<{ plans: Plan[]; groups: PlanGroups; walkEstimated: boolean } | null> {
  const routes = await fetchKakaoRoutes(ctx.origin, ctx.destination);
  if (!routes?.length) return null;

  // 도보로 시작하거나 끝나는 구간은 빼고(우리가 실제 보행 경로로 다시 잰다), 수단이 하나도 없는 경로는 버린다.
  const cands = routes
    .slice(0, MAX_ROUTES)
    .map((r) => {
      const steps = [...r.steps];
      while (steps[0]?.type === "WALKING") steps.shift();
      while (steps[steps.length - 1]?.type === "WALKING") steps.pop();
      return steps;
    })
    .filter((steps) => steps.some((s) => s.type !== "WALKING") && steps[0].first && steps[steps.length - 1].last);
  if (cands.length === 0) return null;

  // 출발지 → 첫 승차 위치, 마지막 하차 위치 → 도착지의 실제 보행 시간
  const targets = cands.flatMap((steps) => [steps[0].first!, steps[steps.length - 1].last!]);
  const { minutes: wm, estimated } = await walkMatrix(
    [ctx.origin, ctx.destination].map(({ lat, lng }) => ({ lat, lng })),
    targets,
  );

  const data = await loadBus();

  // 지하철 구간에 쓸 열차 시간표
  const stops: { line: string; station: string }[] = [];
  for (const steps of cands) {
    for (const s of steps) {
      if (s.type !== "SUBWAY") continue;
      const info = subwayInfo(s);
      if (info.line && info.from && info.to) {
        stops.push({ line: info.line.id, station: info.from }, { line: info.line.id, station: info.to });
      }
    }
  }
  const tt = ctx.loadTimetable && stops.length ? await ctx.loadTimetable(stops).catch(() => undefined) : undefined;

  // 카카오 목록 순서대로 시각을 계산한다. 첫 번째로 만들어진 안이 추천이고,
  // 지하철 위주·버스 위주 안은 각각 앞에서부터 GROUP_SIZE개까지 모은다. (둘 다 차면 멈춘다)
  let recommended: Plan | null = null;
  const subway: Plan[] = [];
  const bus: Plan[] = [];
  const seen = new Set<string>();
  for (let k = 0; k < cands.length; k++) {
    if (recommended && subway.length >= GROUP_SIZE && bus.length >= GROUP_SIZE) break;
    const plan = await buildPlan(cands[k], ctx, wm[0][2 * k], wm[1][2 * k + 1], data, tt).catch(() => null);
    if (!plan) continue;
    const sig = plan.legs
      .map((l) => (l.type === "ride" ? `${l.lineName}:${l.from}>${l.to}` : l.type === "bus" ? `bus${l.routeName}:${l.from}>${l.to}` : ""))
      .join("|");
    if (seen.has(sig)) continue;
    seen.add(sig);
    recommended ??= plan;
    const mode = planMode(plan);
    const list = mode === "subway" ? subway : mode === "bus" ? bus : null;
    if (list && list.length < GROUP_SIZE) list.push(plan);
  }
  if (!recommended) return null;

  const plans = [recommended, ...[...subway, ...bus].filter((p) => p !== recommended)];
  return { plans, groups: { recommended, subway, bus }, walkEstimated: estimated };
}
