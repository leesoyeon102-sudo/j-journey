import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseClock, stationCode, createTimetable, type Timetable, type TtRow } from "../timetable";

// 서울 열린데이터광장 "서울교통공사_역코드로 지하철 열차 시간표 검색" (1~9호선).
// 한 역·요일·방향의 시간표를 한 번에 받고, 메모리와 .cache 폴더에 저장해 호출 수를 줄인다.
const BASE = "http://openapi.seoul.go.kr:8088";
const TTL = 7 * 24 * 60 * 60 * 1000;
const CACHE_DIR = path.join(process.cwd(), ".cache", "seoul-timetable");

export type DayType = "weekday" | "saturday" | "sunday";
const WEEK_TAG: Record<DayType, string> = { weekday: "1", saturday: "2", sunday: "3" };

interface ApiRow {
  TRAIN_NO: string;
  ARRIVETIME: string;
  LEFTTIME: string;
}

const memory = new Map<string, Promise<TtRow[]>>();

async function fetchDirection(key: string, code: string, week: string, inout: string) {
  const url = `${BASE}/${key}/json/SearchSTNTimeTableByIDService/1/1000/${code}/${week}/${inout}/`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`seoul ${res.status}`);
  const data = await res.json();
  const body = data.SearchSTNTimeTableByIDService;
  if (!body) throw new Error(data.RESULT?.CODE ?? "seoul_error");
  return (body.row ?? []) as ApiRow[];
}

async function loadStation(key: string, code: string, day: DayType): Promise<TtRow[]> {
  const week = WEEK_TAG[day];
  const file = path.join(CACHE_DIR, `${week}-${code}.json`);
  try {
    const info = await stat(file);
    if (Date.now() - info.mtimeMs < TTL) return JSON.parse(await readFile(file, "utf8"));
  } catch {
    // 캐시 없음
  }
  const [up, down] = await Promise.all([
    fetchDirection(key, code, week, "1"),
    fetchDirection(key, code, week, "2"),
  ]);
  const rows: TtRow[] = [...up, ...down].map((r) => ({
    no: r.TRAIN_NO,
    arr: parseClock(r.ARRIVETIME),
    dep: parseClock(r.LEFTTIME),
  }));
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(file, JSON.stringify(rows));
  } catch {
    // 읽기 전용 환경에서는 메모리 캐시만 사용
  }
  return rows;
}

/** 필요한 역들의 시간표를 받아 조회 객체로 만든다. 받지 못한 역은 빠지고, 그 구간은 예상으로 대체된다. */
export async function loadTimetable(
  stops: { line: string; station: string }[],
  day: DayType,
): Promise<Timetable | undefined> {
  const key = process.env.SEOUL_SUBWAY_KEY;
  if (!key) return undefined;

  const codes = [
    ...new Set(
      stops.map((s) => stationCode(s.line, s.station)).filter((c): c is string => Boolean(c)),
    ),
  ];
  const data = new Map<string, TtRow[]>();
  const queue = [...codes];
  const worker = async () => {
    for (let code = queue.shift(); code; code = queue.shift()) {
      const id = `${day}:${code}`;
      let p = memory.get(id);
      if (!p) {
        p = loadStation(key, code, day);
        memory.set(id, p);
      }
      try {
        data.set(code, await p);
      } catch {
        memory.delete(id);
      }
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  return createTimetable(data);
}
