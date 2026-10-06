"use client";

import Header from "@/components/Header";
import RoadmapMap from "@/components/RoadmapMap";
import { buildRoadmap } from "@/lib/routes";
import { useTrips } from "@/lib/storage";

export default function RoadmapPage() {
  const trips = useTrips();
  const map = buildRoadmap(trips);
  const empty = map.tripCount === 0;

  return (
    <main className="fade-in">
      <Header title="나의 로드맵" sub="지금까지 다닌 길이 지도 위에 쌓여요" />

      <dl className="grid grid-cols-3 gap-3 px-5 pb-5">
        <Stat label="다녀온 경로" value={`${map.routeCount}개`} />
        <Stat label="방문한 역" value={`${map.stations.size}곳`} />
        <Stat label="이동 거리" value={`${map.km.toFixed(1)}km`} />
      </dl>

      <div className="relative">
        <RoadmapMap roadmap={map} />
        {empty && (
          <p className="absolute inset-x-0 bottom-6 text-center text-xs text-sub">
            도착 기록을 남기면 이곳에 선이 그려져요
          </p>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-soft px-3 py-3">
      <dt className="text-[11px] text-sub">{label}</dt>
      <dd className="mt-1 text-[17px] font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
