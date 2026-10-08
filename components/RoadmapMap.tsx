import { LINES, STATIONS } from "@/lib/stations";
import type { Roadmap } from "@/lib/routes";

const W = 390;
const H = 420;
const PAD = 28;
// 기록이 없을 때 보여줄 서울 중심 범위
const DEFAULT_BOX = { minLat: 37.43, maxLat: 37.65, minLng: 126.85, maxLng: 127.15 };
const MIN_SPAN = 0.08; // 위·경도 최소 표시 폭(도): 너무 확대되지 않도록

type Point = { lat: number; lng: number };

/** 기록이 있으면 다닌 역과 집이 모두 보이는 범위, 없으면 집 주변(집도 없으면 서울 중심) */
function viewBox(points: Point[]) {
  if (points.length === 0) return DEFAULT_BOX;
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  let minLat = Math.min(...lats);
  let maxLat = Math.max(...lats);
  let minLng = Math.min(...lngs);
  let maxLng = Math.max(...lngs);
  const padLat = Math.max(0, (MIN_SPAN - (maxLat - minLat)) / 2);
  const padLng = Math.max(0, (MIN_SPAN - (maxLng - minLng)) / 2);
  minLat -= padLat;
  maxLat += padLat;
  minLng -= padLng;
  maxLng += padLng;
  return { minLat, maxLat, minLng, maxLng };
}

export default function RoadmapMap({ roadmap, home }: { roadmap: Roadmap; home?: Point }) {
  const visited = [...roadmap.stations];
  const box = viewBox([...visited.map((n) => STATIONS[n]), ...(home ? [home] : [])]);
  // 위도에 따른 경도 길이 보정
  const kx = Math.cos(((box.minLat + box.maxLat) / 2) * (Math.PI / 180));
  const spanX = (box.maxLng - box.minLng) * kx;
  const spanY = box.maxLat - box.minLat;
  const scale = Math.min((W - PAD * 2) / spanX, (H - PAD * 2) / spanY);
  const offX = (W - spanX * scale) / 2;
  const offY = (H - spanY * scale) / 2;
  const at = (s: Point): [number, number] => [
    offX + (s.lng - box.minLng) * kx * scale,
    offY + (box.maxLat - s.lat) * scale,
  ];
  const pos = (name: string) => at(STATIONS[name]);
  const homeAt = home ? at(home) : null;

  const labels = visited.length <= 14;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block w-full"
      role="img"
      aria-label="지금까지 이용한 구간을 표시한 노선도"
    >
      {/* 바탕 노선망 */}
      <g stroke="#e6e6e6" strokeWidth={1.2} strokeLinecap="round">
        {LINES.flatMap((l) =>
          l.edges.map(([a, b]) => {
            const [x1, y1] = pos(a);
            const [x2, y2] = pos(b);
            return <line key={`${l.id}:${a}:${b}`} x1={x1} y1={y1} x2={x2} y2={y2} />;
          }),
        )}
      </g>

      {/* 내가 다닌 길: 탈 때마다 한 줄씩 반투명하게 얹어서, 겹치면 겹친 대로 진해 보인다. */}
      <g
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={4}
        strokeOpacity={0.28}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {roadmap.paths.map((path, i) => (
          <polyline
            key={i}
            points={path.map((n) => pos(n).map((v) => v.toFixed(1)).join(",")).join(" ")}
          />
        ))}
      </g>

      {/* 방문한 역 */}
      {visited.map((n) => (
        <circle key={n} cx={pos(n)[0]} cy={pos(n)[1]} r={2.5} fill="#fff" stroke="var(--color-accent)" strokeWidth={1.5} />
      ))}
      {labels &&
        visited.map((n) => (
          <text key={`t-${n}`} x={pos(n)[0] + 6} y={pos(n)[1] - 5} fontSize={9} fill="#555">
            {n}
          </text>
        ))}
      {/* 내 집 위치: 빨간 동그라미와 검정 "집" 글자 */}
      {homeAt && (
        <g>
          <circle cx={homeAt[0]} cy={homeAt[1]} r={6} fill="#ef4444" stroke="#fff" strokeWidth={2} />
          <text
            x={homeAt[0]}
            y={homeAt[1] - 12}
            textAnchor="middle"
            fontSize={12}
            fontWeight={700}
            fill="#111"
            stroke="#fff"
            strokeWidth={3}
            paintOrder="stroke"
          >
            집
          </text>
        </g>
      )}
    </svg>
  );
}
