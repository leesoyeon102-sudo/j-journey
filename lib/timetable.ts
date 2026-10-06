import codes from "./data/stationcodes.json";

/** 역 시간표의 한 줄: 열차 번호와 그 역의 도착·출발 시각(하루 0시 기준 분, 자정 이후는 24시 이상) */
export interface TtRow {
  no: string;
  arr: number | null;
  dep: number | null;
}

export interface TrainMatch {
  start: number;
  end: number;
  trainNo: string;
}

export interface Timetable {
  /**
   * 승차역에서 출발해 하차역에 `deadline`분 이전에 도착하는 가장 늦은 열차.
   * undefined = 이 구간은 시간표 데이터가 없음(예상으로 대체), null = 데이터는 있으나 탈 열차가 없음.
   */
  latest(
    line: string,
    from: string,
    to: string,
    deadline: number,
    maxDuration: number,
  ): TrainMatch | null | undefined;
}

const CODES = codes as Record<string, string>;

/** 서울교통공사 시간표를 조회할 수 있는 역코드. 없으면 undefined */
export function stationCode(line: string, station: string): string | undefined {
  return CODES[`${line}:${station}`];
}

/** "05:35:30" → 분. 00시대는 전날 운행의 연장이라 24시 이상으로 본다. */
export function parseClock(s: string | undefined): number | null {
  if (!s || s === "00:00:00") return null;
  const [h, m, sec] = s.split(":").map(Number);
  if ([h, m, sec].some(Number.isNaN)) return null;
  const min = h * 60 + m + sec / 60;
  return h < 3 ? min + 1440 : min;
}

export function createTimetable(data: Map<string, TtRow[]>): Timetable {
  const byTrain = new Map<string, Map<string, TtRow[]>>();
  const index = (code: string) => {
    let idx = byTrain.get(code);
    if (!idx) {
      idx = new Map();
      for (const row of data.get(code) ?? []) {
        idx.set(row.no, [...(idx.get(row.no) ?? []), row]);
      }
      byTrain.set(code, idx);
    }
    return idx;
  };

  return {
    latest(line, from, to, deadline, maxDuration) {
      const a = stationCode(line, from);
      const b = stationCode(line, to);
      if (!a || !b || !data.has(a) || !data.has(b)) return undefined;
      const toIdx = index(b);
      let best: TrainMatch | null = null;
      for (const row of data.get(a)!) {
        if (row.dep == null) continue;
        // 같은 열차가 하차역에 도착하는 첫 시각
        let arr: number | null = null;
        for (const t of toIdx.get(row.no) ?? []) {
          if (t.arr != null && t.arr >= row.dep && (arr === null || t.arr < arr)) arr = t.arr;
        }
        if (arr === null || arr > deadline || arr - row.dep > maxDuration) continue;
        if (!best || row.dep > best.start) {
          best = { start: Math.floor(row.dep), end: Math.ceil(arr), trainNo: row.no };
        }
      }
      return best;
    },
  };
}
