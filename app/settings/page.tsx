"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import LocationPicker from "@/components/LocationPicker";
import ThemeColor from "@/components/ThemeColor";
import Toast from "@/components/Toast";
import { Switch } from "@/components/ui/switch";
import { readPushState, turnOffPush, turnOnPush, type PushState } from "@/lib/pushReminder";
import { saveHome, useHome } from "@/lib/storage";

const PUSH_NOTICE: Partial<Record<PushState, string>> = {
  denied: "알림이 꺼져 있어요. 기기 설정에서 J의 외출 알림을 허용해 주세요.",
  unsupported: "이 브라우저는 알림을 지원하지 않아요. 홈 화면에 추가한 앱에서 사용해 주세요.",
};

export default function SettingsPage() {
  const home = useHome();
  const [pickingHome, setPickingHome] = useState(false);
  // 알림 상태는 브라우저에서만 알 수 있어(서버 렌더에서는 null), 토글을 누른 뒤에는 그 결과를 우선한다.
  const pushNow = useSyncExternalStore(() => () => {}, readPushState, () => null);
  const [pushChanged, setPush] = useState<PushState | null>(null);
  const push = pushChanged ?? pushNow;
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  async function togglePush(on: boolean) {
    // 거절했거나 지원하지 않으면 여기서 켤 수 없어서 이유를 알려 준다.
    const blocked = push === "denied" || push === "unsupported" ? PUSH_NOTICE[push] : undefined;
    if (blocked) {
      setToast(blocked);
      return;
    }
    setBusy(true);
    const next = on ? await turnOnPush() : await turnOffPush();
    setPush(next);
    setBusy(false);
    if (on && next !== "on") setToast(PUSH_NOTICE[next] ?? "알림을 켜지 못했어요.");
  }

  return (
    <main className="min-h-dvh bg-surface">
      <ThemeColor token="surface" />
      {/* 내비게이션 바: 뒤로 가기 + 가운데 제목 */}
      <header className="sticky top-0 z-10 grid h-14 grid-cols-[3rem_1fr_3rem] items-center border-b border-border-subtle bg-surface px-2">
        <Link
          href="/"
          aria-label="뒤로"
          className="flex size-10 items-center justify-center rounded-pill transition-colors active:bg-muted"
        >
          <ChevronLeftIcon className="size-6" strokeWidth={1.5} />
        </Link>
        <h1 className="text-center text-body-lg font-medium [-webkit-text-stroke:0.3px]">설정</h1>
      </header>

      <ul className="divide-y divide-border-subtle">
        <li>
          <button
            type="button"
            onClick={() => setPickingHome(true)}
            className="flex min-h-16 w-full items-center gap-3 px-5 py-3 text-left transition-colors active:bg-muted"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-body-md">집 주소 변경</span>
              <span className="mt-0.5 block truncate text-caption-lg text-muted-foreground">
                {home ? home.area : "등록된 집 주소가 없어요"}
              </span>
            </span>
            <ChevronRightIcon className="size-5 shrink-0 text-placeholder" strokeWidth={1.5} aria-hidden />
          </button>
        </li>
        <li className="flex min-h-16 items-center gap-3 px-5 py-3">
          <span id="push-label" className="flex-1 text-body-md">
            알림 허용
          </span>
          <Switch
            checked={push === "on"}
            onCheckedChange={togglePush}
            disabled={push === null || busy}
            aria-labelledby="push-label"
          />
        </li>
      </ul>

      {pickingHome && (
        <LocationPicker
          title="집 주소 변경"
          description="새 집 주소를 현재 위치나 주소로 찾아 보세요."
          confirmQuestion="여기가 집이 맞나요?"
          confirmLabel="네, 집으로 등록할게요"
          onSelect={(p) => {
            saveHome({ name: "집", area: p.address || p.name, lat: p.lat, lng: p.lng });
            setPickingHome(false);
            setToast("집 주소를 바꿨어요.");
          }}
          onClose={() => setPickingHome(false)}
        />
      )}
      {toast && <Toast message={toast} />}
    </main>
  );
}
