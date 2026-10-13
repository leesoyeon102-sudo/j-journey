"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { LocateFixedIcon, XIcon } from "lucide-react";
import ThemeColor from "@/components/ThemeColor";
import { searchAddress, type GeoResult } from "@/lib/api";
import { readCurrentPlace } from "@/lib/currentLocation";

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
  /** 현재 위치를 찾은 뒤 묻는 문구와 확정 버튼 */
  confirmQuestion: string;
  confirmLabel: string;
  /** 열리자마자 브라우저 위치 허용 창을 띄운다 */
  autoLocate?: boolean;
  /** 검색 때 가까운 곳을 먼저 보여 줄 기준 좌표 (예: 도착지 검색 때 출발지) */
  near?: { lat: number; lng: number };
  /** "현재 위치로 선택" 버튼 위에 놓이는 집 칩. 누르면 집 주소가 선택된다. */
  homeChip?: { address: string; onPick: () => void };
  onSelect: (place: PickedLocation) => void;
  onClose?: () => void;
}

type Phase = "locating" | "confirm" | "choose" | "denied";

function deniedMessage(code: number) {
  // http://IP 같은 보안 연결(HTTPS)이 아닌 주소에서는 브라우저가 위치 허용 창을 아예 띄우지 않는다.
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "이 주소(http)에서는 브라우저가 위치 허용 창을 띄울 수 없어요. 주소로 검색해 주세요.";
  }
  return code === 1
    ? "위치 권한이 꺼져 있어요. 주소로 검색하거나, 브라우저 설정에서 위치를 허용해 주세요."
    : "현재 위치를 가져오지 못했어요. 주소로 검색해 주세요.";
}

/** 현재 위치 또는 주소 검색으로 장소를 고르는 화면. 출발지·도착지가 같은 UI를 쓴다. */
export default function LocationPicker({
  title,
  description,
  confirmQuestion,
  confirmLabel,
  autoLocate = false,
  near,
  homeChip,
  onSelect,
  onClose,
}: Props) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [phase, setPhase] = useState<Phase>(autoLocate ? "locating" : "choose");
  const [found, setFound] = useState<PickedLocation | null>(null);
  const [denied, setDenied] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<GeoResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);

  const resolvePosition = (): Promise<PickedLocation> => readCurrentPlace();

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

  // 부모(.fade-in)의 transform 안에서는 fixed가 화면 기준이 아니라서 body에 직접 그린다.
  if (!mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 mx-auto flex w-[390px] max-w-full flex-col bg-surface">
      {/* 이 화면의 맨 위는 연한 하늘이라 상태 표시줄도 그 색으로 맞춘다. (아래 홈의 하늘색을 따라가지 않게) */}
      <ThemeColor token="sky-pale" />

      {/* 위쪽 색 영역: 제목, 주소 입력, 현재 위치·집 칩. 아래 흰 영역과는 반경 없이 일자로 나뉜다. */}
      <div className="shrink-0 bg-sky-pale pb-6">
        {/* 제목 위치·크기는 탭 화면의 Header와 같게(위 여백 28px, 제목 heading semibold) */}
        <div className="flex items-center justify-between px-5 pt-7">
          <h2 className="text-heading font-semibold">{title}</h2>
          {onClose && (
            // 아이콘이 오른쪽 안쪽 여백(20px)에 맞도록 버튼의 안쪽 빈 공간만큼 당긴다.
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="닫기" className="-my-0.5 -mr-1.5 text-muted-foreground">
              <XIcon className="size-6" />
            </Button>
          )}
        </div>
        {description && <p className="px-5 pt-1 text-body text-muted-foreground">{description}</p>}

        {/* 라인 인풋: 밑줄(두께 1.4px) 하나로 그리고, (브라우저는 border 두께를 정수로 내려서 1.4px이 1px로 나오기 때문에 border 대신 높이 1.4px짜리 선으로 그린다) 입력 중에는 밑줄이 진해진다. 검색 버튼은 같은 줄 오른쪽 끝에 둔다. */}
        <form
          onSubmit={search}
          className="relative mx-5 mt-6 flex items-center gap-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-[1.4px] after:bg-sky-soft after:transition-colors focus-within:after:bg-on-surface"
        >
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="예: 경복궁역, 천호대로 995, 집 근처 병원"
            className="h-12 flex-1 rounded-none border-0 bg-transparent px-0 focus-visible:border-0 focus-visible:ring-0"
          />
          <Button type="submit" variant="ghost" disabled={searching} className="-mr-4 shrink-0">
            {searching ? "검색 중" : "검색"}
          </Button>
        </form>

        {/* 칩: 현재 위치(검정), 집. 좌우 패딩 8px, 글자 13px. 주소가 길면 집 칩 안의 주소를 말줄임(…)으로 줄인다. */}
        <div className="mt-4 flex items-center gap-2 px-5">
          <button
            type="button"
            onClick={() => {
              setPhase("locating");
              void locate();
            }}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-pill bg-primary px-2 text-caption-lg font-semibold text-primary-foreground"
          >
            <LocateFixedIcon className="size-4" />
            현재 위치
          </button>
          {homeChip && (
              <button
                type="button"
                onClick={homeChip.onPick}
                className="glass-strong flex h-9 min-w-0 items-center gap-1.5 overflow-hidden rounded-pill px-2 text-caption-lg font-semibold"
              >
                <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z" />
                </svg>
                <span className="shrink-0">집</span>
                <span className="truncate font-normal text-muted-foreground">{homeChip.address}</span>
              </button>
          )}
        </div>
      </div>

      {/* 아래 흰 영역: 현재 위치 확인 / 안내 / 검색 결과. 목록만 따로 스크롤된다. (화면 전체는 움직이지 않는다) */}
      <div className="flex min-h-0 flex-1 flex-col bg-surface">
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
          <div className="flex min-h-0 flex-1 flex-col px-5 pt-4">
            {denied && phase === "denied" && (
              <p role="alert" className="mb-4 rounded-card bg-muted px-4 py-3 text-body text-on-surface">
                {denied}
              </p>
            )}
            {searchError && (
              <p className="mt-2 text-body text-on-danger">검색에 실패했어요. 잠시 후 다시 시도해 주세요.</p>
            )}
            {results && results.length === 0 && (
              <p className="mt-6 text-center text-body text-muted-foreground">검색 결과가 없어요</p>
            )}
            {results && results.length > 0 && (
              <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto overscroll-contain pb-6">
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
    </div>,
    document.body,
  );
}
