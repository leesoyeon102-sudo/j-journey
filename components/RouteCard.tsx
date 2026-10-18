"use client";

import { ArrowUpDownIcon } from "lucide-react";
import TimeSheet from "@/components/TimeSheet";

interface PlaceView {
  name: string;
  area: string;
}

interface Props {
  origin: PlaceView | null;
  destination: PlaceView | null;
  /** "HH:MM" (24시간) */
  time: string;
  onPickOrigin: () => void;
  onPickDestination: () => void;
  onTimeChange: (value: string) => void;
  /** 출발지와 도착지를 맞바꾼다. */
  onSwap: () => void;
}

function PlaceRow({ label, place, onClick }: { label: string; place: PlaceView | null; onClick: () => void }) {
  return (
    // 오른쪽 맞바꾸기 버튼과 겹치지 않게 오른쪽을 비워 둔다. (버튼 안을 flex로 쓰면 폰(사파리)에서 말줄임이 안 먹는 일이 있어 block으로 쌓는다.)
    <button type="button" onClick={onClick} className="block min-h-16 w-full overflow-hidden py-4 pl-4 pr-16 text-left">
      <span className="block text-caption text-muted-foreground">{label}</span>
      <span className="block truncate text-body-lg font-medium">{place?.name || "장소 선택"}</span>
      {place?.area && place.name !== "집" && <span className="mt-1 block truncate text-caption text-muted-foreground">{place.area}</span>}
    </button>
  );
}

/** 홈 입력 카드. 출발지·도착지·약속 시각을 한 장에 디바이더로 나누고, 출발지↔도착지 맞바꾸기 버튼을 둔다. */
export default function RouteCard({ origin, destination, time, onPickOrigin, onPickDestination, onTimeChange, onSwap }: Props) {
  return (
    <div className="glass-strong rounded-nav">
      <PlaceRow label="출발지" place={origin} onClick={onPickOrigin} />
      {/* 출발지·도착지 사이 디바이더. 맞바꾸기 버튼을 이 선 위에 걸쳐 놓는다. 도착지가 비어 있으면 맞바꿀 게 없다. */}
      <div className="relative mx-4 h-px bg-divider">
        <button
          type="button"
          onClick={onSwap}
          disabled={!destination}
          aria-label="출발지와 도착지 바꾸기"
          className="absolute right-0 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-pill border border-divider bg-surface text-on-surface transition-colors active:bg-muted disabled:text-inactive"
        >
          <ArrowUpDownIcon className="size-5" />
        </button>
      </div>
      <PlaceRow label="도착지" place={destination} onClick={onPickDestination} />
      <div className="mx-4 h-px bg-divider" />
      <TimeSheet bare label="약속 시각" value={time} onChange={onTimeChange} />
    </div>
  );
}
