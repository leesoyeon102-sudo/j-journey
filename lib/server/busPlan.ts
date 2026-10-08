import { meters, walkMin } from "../geo";
import type { NearStation, Place } from "../places";
import {
  directionLabel,
  findRides,
  latestDeparture,
  lineById,
  PLATFORM,
  rideDuration,
  subwayTimes,
  TRANSFER_WALK,
  FIRST_TRAIN,
  type Ride,
} from "../planner";
import { STATIONS, STATION_NAMES } from "../stations";
import type { Timetable } from "../timetable";
import type { BusLeg, Leg, Plan, RideLeg, WalkLeg } from "../types";
import { busColor, headwayAt, loadBus, nearbyStops, type BusData, type BusRoute, type DayType } from "./bus";
import { fetchArrival } from "./busArrival";

/** 정류장에 버스보다 이만큼 일찍 도착하도록 안내한다. */
const STOP_BUFFER = 3;
/** 이 시간(분) 안에 탈 버스까지만 현재 도착 정보로 예상한다. 더 먼 시각은 배차 간격으로 안내한다. */
const REALTIME_HORIZON = 120;
const STOP_RADIUS = 700; // 출발·도착지 주변 정류장 반경(m)
const STATION_RADIUS = 400; // 지하철역과 버스 정류장을 이어 걷는 최대 거리(m)
const MAX_STOPS_AHEAD = 70;
const REFINE = 6;

export interface BusPlanContext {
  origin: Place;
  destination: Place;
  arriveBy: number;
  buffer: number;
  originStations: NearStation[];
  destStations: NearStation[];
  dayType: DayType;
  /** 약속 날짜가 오늘일 때만 현재 도착 정보를 쓴다 */
  isToday: boolean;
  /** 지금 시각(하루 0시 기준 분) */
  nowMin: number;
  loadTimetable?: (stops: { line: string; station: string }[]) => Promise<Timetable | undefined>;
}

interface Candidate {
  type: "A" | "B" | "C";
  route: number;
  board: number;
  alight: number;
  /** 첫 수단까지 걷는 시간 */
  walkHome: number;
  /** 마지막 수단에서 도착지까지 걷는 시간 */
  walkDest: number;
  /** 버스와 지하철역 사이 걷는 시간 */
  gap: number;
  before: Ride[];
  after: Ride[];
  est: number;
}

const parseHm = (s: string) => (s.length >= 4 ? Number(s.slice(0, 2)) * 60 + Number(s.slice(2, 4)) : NaN);

function stationsNear(p: { lat: number; lng: number }, radius: number) {
  const out: { name: string; dist: number }[] = [];
  for (const name of STATION_NAMES) {
    const s = STATIONS[name];
    if (Math.abs(s.lat - p.lat) > 0.006 || Math.abs(s.lng - p.lng) > 0.008) continue;
    const dist = meters(p, s);
    if (dist <= radius) out.push({ name, dist });
  }
  return out;
}

/** 버스를 섞은 안들을 만든다. 버스 데이터가 없거나 실패하면 빈 배열 */
export async function busPlans(ctx: BusPlanContext): Promise<Plan[]> {
  const data = await loadBus();
  if (!data) return [];
  const cands = rank(data, ctx);
  if (cands.length === 0) return [];

  // 지하철 구간이 있는 후보에 쓸 열차 시간표
  const stops = cands.flatMap((c) =>
    [...c.before, ...c.after].flatMap((r) => [
      { line: r.line.id, station: r.path[0] },
      { line: r.line.id, station: r.path[r.path.length - 1] },
    ]),
  );
  const tt = ctx.loadTimetable && stops.length ? await ctx.loadTimetable(stops).catch(() => undefined) : undefined;

  const plans: Plan[] = [];
  for (const c of cands) {
    const arrivals = ctx.isToday ? await fetchArrival(data, data.routes[c.route], c.board) : null;
    const plan = schedule(data, ctx, c, arrivals, tt);
    if (plan) plans.push(plan);
  }
  return plans;
}

/** 후보를 만들고 대략의 소요 시간으로 줄 세워 상위 몇 개만 남긴다. */
function rank(data: BusData, ctx: BusPlanContext): Candidate[] {
  const { origin, destination } = ctx;
  const nearO = nearbyStops(data, origin, STOP_RADIUS, 14);
  const nearD = nearbyStops(data, destination, STOP_RADIUS, 14);
  const minute = ctx.arriveBy - 40;

  const rideMin = (r: BusRoute, i: number, j: number) => (r.secs[j] - r.secs[i]) / 60;
  const waitEst = (r: BusRoute) => headwayAt(r, ctx.dayType, minute) / 2 + STOP_BUFFER;

  const out: Candidate[] = [];

  // A. 버스만: 출발지 근처에서 타서 도착지 근처에서 내린다.
  const dRoutes = new Map<number, { j: number; dist: number }[]>();
  for (const d of nearD) {
    for (const { r, i } of data.byStop.get(d.stop) ?? []) {
      const list = dRoutes.get(r);
      if (list) list.push({ j: i, dist: d.dist });
      else dRoutes.set(r, [{ j: i, dist: d.dist }]);
    }
  }
  for (const o of nearO) {
    for (const { r, i } of data.byStop.get(o.stop) ?? []) {
      for (const d of dRoutes.get(r) ?? []) {
        if (d.j <= i + 1) continue;
        const route = data.routes[r];
        const wh = walkMin(origin, data.stops[o.stop]);
        const wd = walkMin(destination, data.stops[route.stops[d.j]]);
        out.push({
          type: "A", route: r, board: i, alight: d.j, walkHome: wh, walkDest: wd, gap: 0, before: [], after: [],
          est: wh + waitEst(route) + rideMin(route, i, d.j) + wd,
        });
      }
    }
  }

  // 지하철과 이어 붙일 때 쓰는 예상 시간표
  const fromOrigin = ctx.originStations.map((s) => ({ s, t: subwayTimes(s.station) }));
  const fromDest = ctx.destStations.map((s) => ({ s, t: subwayTimes(s.station) }));
  const bestOrigin = (st: string) => {
    let best: { os: NearStation; cost: number } | null = null;
    for (const { s, t } of fromOrigin) {
      const v = t.get(st);
      if (v !== undefined && s.station !== st && (!best || s.walkMin + v < best.cost)) best = { os: s, cost: s.walkMin + v };
    }
    return best;
  };
  const bestDest = (st: string) => {
    let best: { ds: NearStation; cost: number } | null = null;
    for (const { s, t } of fromDest) {
      const v = t.get(st);
      if (v !== undefined && s.station !== st && (!best || s.walkMin + v < best.cost)) best = { ds: s, cost: s.walkMin + v };
    }
    return best;
  };
  const near = new Map<number, { name: string; dist: number }[]>();
  const nearStations = (stop: number) => {
    let v = near.get(stop);
    if (!v) near.set(stop, (v = stationsNear(data.stops[stop], STATION_RADIUS)));
    return v;
  };

  // B. 지하철 → 버스: 지하철역 근처 정류장에서 타서 도착지 근처에서 내린다.
  const seenB = new Set<string>();
  for (const d of nearD) {
    for (const { r, i: j } of data.byStop.get(d.stop) ?? []) {
      const route = data.routes[r];
      const wd = walkMin(destination, data.stops[d.stop]);
      for (let i = j - 2; i >= Math.max(0, j - MAX_STOPS_AHEAD); i--) {
        for (const st of nearStations(route.stops[i])) {
          const o = bestOrigin(st.name);
          if (!o) continue;
          const key = `${r}:${st.name}`;
          if (seenB.has(key)) continue;
          seenB.add(key);
          const gap = Math.max(1, Math.ceil((st.dist * 1.3) / 75));
          out.push({
            type: "B", route: r, board: i, alight: j, walkHome: o.os.walkMin, walkDest: wd, gap, before: [], after: [],
            est: o.cost + gap + waitEst(route) + rideMin(route, i, j) + wd,
            // 지하철 구간은 아래에서 채운다
            ...{ _station: st.name, _os: o.os.station },
          } as Candidate);
        }
      }
    }
  }

  // C. 버스 → 지하철: 출발지 근처에서 타서 지하철역 근처에서 내린다.
  const seenC = new Set<string>();
  for (const o of nearO) {
    for (const { r, i } of data.byStop.get(o.stop) ?? []) {
      const route = data.routes[r];
      const wh = walkMin(origin, data.stops[o.stop]);
      for (let j = i + 2; j <= Math.min(route.stops.length - 1, i + MAX_STOPS_AHEAD); j++) {
        for (const st of nearStations(route.stops[j])) {
          const d = bestDest(st.name);
          if (!d) continue;
          const key = `${r}:${st.name}`;
          if (seenC.has(key)) continue;
          seenC.add(key);
          const gap = Math.max(1, Math.ceil((st.dist * 1.3) / 75));
          out.push({
            type: "C", route: r, board: i, alight: j, walkHome: wh, walkDest: d.ds.walkMin, gap, before: [], after: [],
            est: wh + waitEst(route) + rideMin(route, i, j) + gap + d.cost,
            ...{ _station: st.name, _ds: d.ds.station },
          } as Candidate);
        }
      }
    }
  }

  // 같은 노선·종류는 가장 빠른 것만, 그중 상위 몇 개
  out.sort((a, b) => a.est - b.est);
  const picked: Candidate[] = [];
  const used = new Set<string>();
  for (const c of out) {
    if (c.est > 240) break;
    const k = `${c.type}:${c.route}`;
    if (used.has(k)) continue;
    // 지하철 구간(B·C)이 실제로 이어지는지 확인하며 채운다
    const x = c as Candidate & { _station?: string; _os?: string; _ds?: string };
    if (c.type === "B") {
      const rides = findRides(x._os!, x._station!);
      if (!rides || rides.length === 0) continue;
      c.before = rides;
    } else if (c.type === "C") {
      const rides = findRides(x._station!, x._ds!);
      if (!rides || rides.length === 0) continue;
      c.after = rides;
    }
    used.add(k);
    picked.push(c);
    if (picked.length === REFINE) break;
  }
  return picked;
}

type SubStep = { ride: Ride; start: number; end: number; real?: string };

/** 도착 시각에서 거꾸로 버스·지하철 시각을 확정해 안 하나를 만든다. 불가능하면 null */
function schedule(
  data: BusData,
  ctx: BusPlanContext,
  c: Candidate,
  arrivals: number[] | null,
  tt?: Timetable,
): Plan | null {
  const route = data.routes[c.route];
  const rideBusMin = (route.secs[c.alight] - route.secs[c.board]) / 60;
  const busFrom = data.stops[route.stops[c.board]];
  const busTo = data.stops[route.stops[c.alight]];

  // 도착지에 약속 시각보다 여유를 두고 닿도록, 마지막 수단의 하차 마감 시각
  const deadline = ctx.arriveBy - ctx.buffer - c.walkDest;

  const sub = (rides: Ride[], dl: number): { steps: SubStep[]; first: number } | null => {
    const steps: SubStep[] = [];
    let d = dl;
    for (let k = rides.length - 1; k >= 0; k--) {
      const ride = rides[k];
      const dur = rideDuration(ride);
      const last = ride.path[ride.path.length - 1];
      const real = tt?.latest(ride.line.id, ride.path[0], last, d, dur * 1.8 + 8);
      if (real === null) return null;
      if (real) steps[k] = { ride, start: real.start, end: real.end, real: real.trainNo };
      else {
        const start = latestDeparture(ride.line, ride.dir, ride.path[0], d - dur);
        if (start < FIRST_TRAIN) return null;
        steps[k] = { ride, start, end: start + dur };
      }
      d = steps[k].start - TRANSFER_WALK;
    }
    return { steps, first: steps[0].start };
  };

  const scheduleBus = (dl: number) => {
    const latestBoard = dl - rideBusMin;
    const h = headwayAt(route, ctx.dayType, latestBoard);
    if (arrivals && arrivals.length) {
      const base = ctx.nowMin + arrivals[0];
      const gap = arrivals.length > 1 ? Math.min(90, Math.max(3, arrivals[1] - arrivals[0])) : h;
      if (latestBoard <= ctx.nowMin + REALTIME_HORIZON) {
        if (base > latestBoard) return null; // 가장 빠른 버스도 마감 이후에 도착
        const t = base + Math.floor((latestBoard - base) / gap) * gap;
        const start = Math.floor(t);
        return { start, end: Math.ceil(t + rideBusMin), wait: STOP_BUFFER, realtime: true, h: Math.round(gap) };
      }
    }
    // 현재 도착 정보를 못 쓰는 경우: 배차 간격만큼 기다려도 타도록 넉넉히 잡는다.
    const t = Math.floor(latestBoard);
    const offset = route.secs[c.board] / 60;
    const first = parseHm(route.first);
    let last = parseHm(route.last);
    if (!Number.isNaN(first) && !Number.isNaN(last)) {
      if (last < first) last += 1440;
      if (t < first + offset || t > last + offset + 10) return null; // 첫차 전이거나 막차 이후
    }
    return { start: t, end: Math.ceil(t + rideBusMin), wait: h + STOP_BUFFER, realtime: false, h };
  };

  let beforeSteps: SubStep[] = [];
  let afterSteps: SubStep[] = [];
  let bus: ReturnType<typeof scheduleBus>;
  let leaveAt: number;

  if (c.type === "C") {
    // 지하철이 뒤에 있다: 먼저 지하철을 확정하고, 그 출발에 맞춰 버스 하차 마감을 정한다.
    const s = sub(c.after, deadline);
    if (!s) return null;
    afterSteps = s.steps;
    bus = scheduleBus(s.first - PLATFORM - c.gap);
    if (!bus) return null;
    leaveAt = bus.start - bus.wait - c.walkHome;
  } else {
    bus = scheduleBus(deadline);
    if (!bus) return null;
    const arriveStop = bus.start - bus.wait;
    if (c.type === "B") {
      const s = sub(c.before, arriveStop - c.gap);
      if (!s) return null;
      beforeSteps = s.steps;
      leaveAt = s.first - PLATFORM - c.walkHome;
    } else {
      leaveAt = arriveStop - c.walkHome;
    }
  }
  if (leaveAt < 0) return null;
  if (ctx.isToday && leaveAt < ctx.nowMin) return null; // 이미 지나서 나설 수 없는 안

  // --- 안 만들기 ---
  const legs: Leg[] = [];
  const walk = (kind: WalkLeg["kind"], from: string, to: string, start: number, mins: number): WalkLeg => ({
    type: "walk", kind, from, to, start, end: start + mins,
  });
  const subLeg = (st: SubStep, prevEnd: number): RideLeg => {
    const stations = st.ride.path;
    return {
      type: "ride",
      line: st.ride.line.id,
      lineName: st.ride.line.name,
      color: lineById(st.ride.line.id).color,
      direction: directionLabel(st.ride),
      from: stations[0],
      to: stations[stations.length - 1],
      stations,
      start: st.start,
      end: st.end,
      scheduled: st.real !== undefined,
      trainNo: st.real,
      waitMin: st.start - prevEnd,
    };
  };
  const busLeg: BusLeg = {
    type: "bus",
    routeName: route.name,
    kind: route.kind,
    color: busColor(route.kind),
    from: busFrom.name,
    to: busTo.name,
    stopCount: c.alight - c.board,
    arriveStop: bus.start - bus.wait,
    start: bus.start,
    end: bus.end,
    waitMin: bus.wait,
    headway: bus.h,
    realtime: bus.realtime,
  };

  const firstName = c.type === "B" ? beforeSteps[0].ride.path[0] : busFrom.name;
  legs.push(walk("home", ctx.origin.name, firstName, leaveAt, c.walkHome));
  let cursor = leaveAt + c.walkHome;

  if (c.type === "B") {
    beforeSteps.forEach((st, k) => {
      legs.push(subLeg(st, cursor));
      cursor = st.end;
      if (k < beforeSteps.length - 1) {
        legs.push(walk("transfer", st.ride.path[st.ride.path.length - 1], beforeSteps[k + 1].ride.path[0], cursor, TRANSFER_WALK));
        cursor += TRANSFER_WALK;
      }
    });
    const lastSt = beforeSteps[beforeSteps.length - 1];
    legs.push(walk("transfer", lastSt.ride.path[lastSt.ride.path.length - 1], busFrom.name, cursor, c.gap));
  }
  legs.push(busLeg);
  cursor = busLeg.end;

  if (c.type === "C") {
    legs.push(walk("transfer", busTo.name, afterSteps[0].ride.path[0], cursor, c.gap));
    cursor += c.gap;
    afterSteps.forEach((st, k) => {
      legs.push(subLeg(st, cursor));
      cursor = st.end;
      if (k < afterSteps.length - 1) {
        legs.push(walk("transfer", st.ride.path[st.ride.path.length - 1], afterSteps[k + 1].ride.path[0], cursor, TRANSFER_WALK));
        cursor += TRANSFER_WALK;
      }
    });
  }
  const lastName =
    c.type === "C" ? afterSteps[afterSteps.length - 1].ride.path.at(-1)! : busTo.name;
  legs.push(walk("dest", lastName, ctx.destination.name, cursor, c.walkDest));

  const subs = [...beforeSteps, ...afterSteps];
  return {
    origin: ctx.origin.name,
    destination: ctx.destination.name,
    originStation: c.type === "B" ? beforeSteps[0].ride.path[0] : "",
    destinationStation: c.type === "C" ? afterSteps[afterSteps.length - 1].ride.path.at(-1)! : "",
    arriveBy: ctx.arriveBy,
    walkHome: c.walkHome,
    walkDest: c.walkDest,
    buffer: ctx.buffer,
    leaveAt,
    arriveAt: cursor + c.walkDest,
    legs,
    transfers: subs.length + 1 - 1,
    scheduleEstimated: subs.some((s) => s.real === undefined) || undefined,
    busEstimated: !bus.realtime || undefined,
  };
}
