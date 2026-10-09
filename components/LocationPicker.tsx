"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFeedbackBlock } from "@/lib/feedbackGate";
import { useEffect, useState } from "react";
import { reverseGeocode, searchAddress, type GeoResult } from "@/lib/api";

export interface PickedLocation {
  name: string;
  address: string;
  lat: number;
  lng: number;
  /** 어떻게 골랐는지: 현재 위치 버튼 / 주소 검색 결과 (집 주소 등록 분석용) */
  source?: "current_location" | "search";
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
  /** "현재 위치로 선택" 버튼 위에 놓이는 집 칩. 누르면 집 주소가 선택된다. */
  homeChip?: { address: string; onPick: () => void; onEdit: () => void };
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
  homeChip,
  onSelect,
  onClose,
}: Props) {
  // 위치를 고르는 동안에는 피드백 얼럿을 띄우지 않는다.
  useFeedbackBlock(true);
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
    <div className="fixed inset-0 z-50 mx-auto flex w-[390px] max-w-full flex-col overflow-y-auto bg-surface">
      <div className="flex items-center justify-between px-5 pt-10">
        <h2 className="text-heading font-medium">{title}</h2>
        {onClose && (
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground">
            닫기
          </Button>
        )}
      </div>
      {description && <p className="px-5 pt-1 text-body text-muted-foreground">{description}</p>}

      {phase === "locating" && (
        <p className="px-5 pt-12 text-center text-body text-muted-foreground">
          위치 허용 창에서 &lsquo;허용&rsquo;을 눌러 주세요…
        </p>
      )}

      {phase === "confirm" && found && (
        <div className="px-5 pt-8">
          <p className="text-caption text-muted-foreground">현재 위치</p>
          <p className="mt-1 text-subheading font-medium">{found.address || "현재 위치"}</p>
          <p className="mt-4 text-body text-muted-foreground">{confirmQuestion}</p>
          <Button size="lg" onClick={() => onSelect({ ...found, source: "current_location" })} className="mt-3 w-full">
            {confirmLabel}
          </Button>
          <Button variant="ghost" size="lg" onClick={() => setPhase("choose")} className="mt-1 w-full text-muted-foreground">
            아니에요, 주소로 검색할게요
          </Button>
        </div>
      )}

      {(phase === "choose" || phase === "denied") && (
        <div className="px-5 pt-6">
          {denied && phase === "denied" && (
            <p role="alert" className="mb-4 rounded-card bg-muted px-4 py-3 text-body text-on-surface">
              {denied}
            </p>
          )}
          {homeChip && (
            <div className="mb-3 flex items-center gap-3">
              <Button variant="outline" onClick={homeChip.onPick} className="min-w-0 max-w-full">
                <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z" />
                </svg>
                <span className="shrink-0">집</span>
                <span className="truncate text-caption font-normal text-muted-foreground">{homeChip.address}</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={homeChip.onEdit} className="shrink-0 text-muted-foreground">
                변경
              </Button>
            </div>
          )}
          <Button
            size="lg"
            onClick={() => {
              setPhase("locating");
              void locate();
            }}
            className="w-full"
          >
            {locateLabel}
          </Button>

          <p className="mb-2 mt-7 text-caption text-muted-foreground">또는 주소·건물 이름으로 검색</p>
          <form onSubmit={search} className="flex gap-2">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="예: 경복궁역, 천호대로 995, 집 근처 병원"
              className="flex-1"
            />
            <Button type="submit" variant="outline" size="lg" disabled={searching} className="h-11">
              {searching ? "검색 중" : "검색"}
            </Button>
          </form>

          {searchError && (
            <p className="mt-4 text-body text-on-danger">검색에 실패했어요. 잠시 후 다시 시도해 주세요.</p>
          )}
          {results && results.length === 0 && (
            <p className="mt-6 text-center text-body text-muted-foreground">검색 결과가 없어요</p>
          )}
          {results && results.length > 0 && (
            <ul className="mt-2 divide-y divide-border">
              {results.map((r, i) => (
                <li key={i}>
                  <button
                    onClick={() =>
                      onSelect({ name: r.name, address: r.address, lat: r.lat, lng: r.lng, source: "search" })
                    }
                    className="w-full py-3 text-left active:bg-muted"
                  >
                    <p className="text-body font-medium">{r.name}</p>
                    <p className="mt-1 text-caption text-muted-foreground">{r.address}</p>
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
