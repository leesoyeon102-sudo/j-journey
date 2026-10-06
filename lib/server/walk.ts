import { walkBetween } from "../places";
import { osmFetch, VALHALLA } from "./osm";

interface Point {
  lat: number;
  lng: number;
}

/**
 * 실제 보행 경로 기준 도보 시간(분) 행렬. 구하지 못한 칸은 직선거리 기반 추정값으로 채우고 estimated=true.
 */
export async function walkMatrix(sources: Point[], targets: Point[]) {
  const estimate = (s: Point, t: Point) =>
    walkBetween({ name: "", area: "", ...s }, { name: "", area: "", ...t }).min;
  try {
    const data = (await osmFetch(`${VALHALLA}/sources_to_targets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sources: sources.map((p) => ({ lat: p.lat, lon: p.lng })),
        targets: targets.map((p) => ({ lat: p.lat, lon: p.lng })),
        costing: "pedestrian",
      }),
    })) as { sources_to_targets: { time: number | null }[][] };
    let estimated = false;
    const minutes = data.sources_to_targets.map((row, i) =>
      row.map((c, j) => {
        if (c.time == null) {
          estimated = true;
          return estimate(sources[i], targets[j]);
        }
        return Math.max(1, Math.ceil(c.time / 60));
      }),
    );
    return { minutes, estimated };
  } catch {
    return { minutes: sources.map((s) => targets.map((t) => estimate(s, t))), estimated: true };
  }
}
