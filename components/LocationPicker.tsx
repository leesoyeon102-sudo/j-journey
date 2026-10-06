"use client";

import { useEffect, useState } from "react";
import { reverseGeocode, searchAddress, type GeoResult } from "@/lib/api";

export interface PickedLocation {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface Props {
  /** 화면 제목: "출발지 선택" · "도착지 선택" */
  title: string;
  description?: React.ReactNode;
  /** "현재 위치로 선택" 같은 버튼 문구 */
  locateLabel: string;
  /** 현재 위치를 찾은 뒤 묻는 문구와 확정 버튼 */
  confirmQuestion: string;
  confirmLabel: string;
  /** 열리자마자 브라우저 위치 허용 창을 띄운다 */
  autoLocate?: boolean;
  /** 검색 때 가까운 곳을 먼저 보여 줄 기준 좌표 (예: 도착지 검색 때 출발지) */
  near?: { lat: number; lng: number };
  onSelect: (place: PickedLocation) => void;
  onClose?: () => void;
}

type Phase = "locating" | "confirm" | "choose" | "denied";

function readPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject({ code: 2 });
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000,
    });
  });
}

function deniedMessage(code: number) {
  return code === 1
    ? "위치 권한이 꺼져 있어요. 주소로 검색하거나, 브라우저 설정에서 위치를 허용해 주세요."
    : "현재 위치를 가져오지 못했어요. 주소로 검색해 주세요.";
}

/** 현재 위치 또는 주소 검색으로 장소를 고르는 화면. 출발지·도착지가 같은 UI를 쓴다. */
export default function LocationPicker({
  title,
  description,
  locateLabel,
  confirmQuestion,
  confirmLabel,
  autoLocate = false,
  near,
  onSelect,
  onClose,
}: Props) {
  const [phase, setPhase] = useState<Phase>(autoLocate ? "locating" : "choose");
  const [found, setFound] = useState<PickedLocation | null>(null);
  const [denied, setDenied] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<GeoResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);

  async function resolvePosition(): Promise<PickedLocation> {
    const pos = await readPosition();
    const { latitude: lat, longitude: lng } = pos.coords;
    const address = (await reverseGeocode({ lat, lng })) ?? "";
    return { name: "현재 위치", address, lat, lng };
  }

  async function locate() {
    try {
      setFound(await resolvePosition());
      setPhase("confirm");
    } catch (e) {
      setDenied(deniedMessage((e as GeolocationPositionError).code));
      setPhase("denied");
    }
  }

  // 처음 열리면 브라우저의 위치 허용 창을 바로 띄운다. (setState는 응답 뒤 콜백에서만 호출)
  useEffect(() => {
    if (!autoLocate) return;
    let cancelled = false;
    resolvePosition()
      .then((p) => {
        if (cancelled) return;
        setFound(p);
        setPhase("confirm");
      })
      .catch((e: GeolocationPositionError) => {
        if (cancelled) return;
        setDenied(deniedMessage(e.code));
        setPhase("denied");
      });
    return () => {
      cancelled = true;
    };
  }, [autoLocate]);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim().length < 2) return;
    setSearching(true);
    setSearchError(false);
    try {
      setResults(await searchAddress(q.trim(), near));
    } catch {
      setSearchError(true);
      setResults(null);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 mx-auto flex w-[390px] max-w-full flex-col overflow-y-auto bg-white">
      <div className="flex items-center justify-between px-5 pt-10">
        <h2 className="text-[22px] font-semibold tracking-tight">{title}</h2>
        {onClose && (
          <button onClick={onClose} className="h-11 px-1 text-sm text-sub">
            닫기
          </button>
        )}
      </div>
      {description && <p className="px-5 pt-1 text-sm leading-relaxed text-sub">{description}</p>}

      {phase === "locating" && (
        <p className="px-5 pt-12 text-center text-sm text-ink/70">
          위치 허용 창에서 &lsquo;허용&rsquo;을 눌러 주세요…
        </p>
      )}

      {phase === "confirm" && found && (
        <div className="px-5 pt-8">
          <p className="text-[11px] text-sub">현재 위치</p>
          <p className="mt-1 text-[17px] font-medium leading-snug">{found.address || "현재 위치"}</p>
          <p className="mt-4 text-sm text-ink/70">{confirmQuestion}</p>
          <button
            onClick={() => onSelect(found)}
            className="mt-3 h-14 w-full rounded-xl bg-ink text-[16px] font-medium text-white active:opacity-80"
          >
            {confirmLabel}
          </button>
          <button onClick={() => setPhase("choose")} className="mt-1 h-11 w-full text-sm text-sub">
            아니에요, 주소로 검색할게요
          </button>
        </div>
      )}

      {(phase === "choose" || phase === "denied") && (
        <div className="px-5 pt-6">
          {denied && phase === "denied" && (
            <p role="alert" className="mb-4 rounded-xl bg-soft px-4 py-3 text-sm text-ink/80">
              {denied}
            </p>
          )}
          <button
            onClick={() => {
              setPhase("locating");
              void locate();
            }}
            className="h-14 w-full rounded-xl bg-ink text-[16px] font-medium text-white active:opacity-80"
          >
            {locateLabel}
          </button>

          <p className="mb-2 mt-7 text-xs text-sub">또는 주소·건물 이름으로 검색</p>
          <form onSubmit={search} className="flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="예: 경복궁역, 천호대로 995, 집 근처 병원"
              className="h-12 min-w-0 flex-1 rounded-xl bg-soft px-4 text-[16px] outline-none placeholder:text-sub"
            />
            <button
              type="submit"
              disabled={searching}
              className="h-12 rounded-xl border border-line px-4 text-sm disabled:opacity-50"
            >
              {searching ? "검색 중" : "검색"}
            </button>
          </form>

          {searchError && (
            <p className="mt-4 text-sm text-red-500">검색에 실패했어요. 잠시 후 다시 시도해 주세요.</p>
          )}
          {results && results.length === 0 && (
            <p className="mt-6 text-center text-sm text-sub">검색 결과가 없어요</p>
          )}
          {results && results.length > 0 && (
            <ul className="mt-2 divide-y divide-line">
              {results.map((r, i) => (
                <li key={i}>
                  <button
                    onClick={() =>
                      onSelect({ name: r.name, address: r.address, lat: r.lat, lng: r.lng })
                    }
                    className="w-full py-3 text-left active:bg-soft"
                  >
                    <p className="text-[15px] font-medium">{r.name}</p>
                    <p className="mt-0.5 text-xs text-sub">{r.address}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
