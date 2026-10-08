import type { BusData, BusRoute } from "./bus";

// 안에서만 쓰는 실시간 도착 정보. 화면에는 "실시간"이라고 보여주지 않고, 이 값으로 이후 버스 시각을 예상한다.
// 서울: 서울특별시_정류소정보조회(getStationByUid), 경기: 경기도_버스도착정보 조회(getBusArrivalItemv2)

interface Cached {
  at: number;
  value: number[] | null;
}
const cache = new Map<string, Cached>();
const TTL = 20_000;

// 공공데이터포털은 초당 호출 제한이 있어 한 줄로 세워 간격을 둔다.
let chain: Promise<unknown> = Promise.resolve();
function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.then(
    () => new Promise((r) => setTimeout(r, 160)),
    () => new Promise((r) => setTimeout(r, 160)),
  );
  return run;
}

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`arrival ${res.status}`);
  return res.json();
}

/** "3분후[0번째 전]" · "곧 도착" 같은 문구에서 남은 분(소수)을 뽑는다. 알 수 없으면 null */
function parseMsg(msg: string | undefined): number | null {
  if (!msg) return null;
  if (msg.includes("곧")) return 0.5;
  const m = msg.match(/(?:(\d+)분)?(?:(\d+)초)?후/);
  if (!m || (!m[1] && !m[2])) return null;
  return Number(m[1] ?? 0) + Number(m[2] ?? 0) / 60;
}

type SeoulItem = Record<string, string>;

async function seoul(ars: string, routeId: string): Promise<number[] | null> {
  const key = process.env.DATA_GO_KR_KEY;
  if (!key) return null;
  const url = `http://ws.bus.go.kr/api/rest/stationinfo/getStationByUid?serviceKey=${key}&arsId=${ars}&resultType=json`;
  const data = (await throttled(() => getJson(url))) as {
    msgBody?: { itemList?: SeoulItem[] | SeoulItem };
  };
  const raw = data.msgBody?.itemList;
  const items = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const row = items.find((it) => it.busRouteId === routeId);
  if (!row) return null;
  const times: number[] = [];
  for (const n of [1, 2]) {
    const sec = Number(row[`traTime${n}`]);
    const t = sec > 0 ? sec / 60 : parseMsg(row[`arrmsg${n}`]);
    if (t !== null && t >= 0) times.push(t);
  }
  return times.length ? times : null;
}

async function gyeonggi(stationId: string, routeId: string, order: number): Promise<number[] | null> {
  const key = process.env.DATA_GO_KR_KEY;
  if (!key) return null;
  const url = `https://apis.data.go.kr/6410000/busarrivalservice/v2/getBusArrivalItemv2?serviceKey=${key}&stationId=${stationId}&routeId=${routeId}&staOrder=${order}&format=json`;
  const data = (await throttled(() => getJson(url))) as {
    response?: { msgBody?: { busArrivalItem?: Record<string, unknown> } };
  };
  const item = data.response?.msgBody?.busArrivalItem;
  if (!item) return null;
  const times: number[] = [];
  for (const n of [1, 2]) {
    const v = Number(item[`predictTime${n}`]);
    if (item[`predictTime${n}`] !== "" && Number.isFinite(v) && v >= 0) times.push(v);
  }
  return times.length ? times : null;
}

/** 이 노선이 승차 정류장(노선 안 idx번째)에 몇 분 뒤 도착하는지 (최대 2대). 정보가 없으면 null */
export async function fetchArrival(data: BusData, route: BusRoute, idx: number): Promise<number[] | null> {
  const stop = data.stops[route.stops[idx]];
  const key = `${route.id}:${stop.id}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.value;
  let value: number[] | null = null;
  try {
    value = stop.ars ? await seoul(stop.ars, route.id) : await gyeonggi(stop.id, route.id, route.orders[idx]);
  } catch {
    value = null;
  }
  cache.set(key, { at: Date.now(), value });
  return value;
}
