"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { enablePush, onForegroundPush, type PushResult } from "@/lib/firebase";

type Saved = "none" | "saved" | "failed";
type Status = "idle" | "loading" | "done" | PushResult;

const FAIL_TEXT = {
  unsupported: "이 브라우저는 푸시 알림을 지원하지 않아요. 아이폰은 사파리에서 '홈 화면에 추가'한 앱에서만 돼요.",
  denied: "알림이 꺼져 있어요. 브라우저 설정에서 이 사이트의 알림을 허용해 주세요.",
  error: "알림을 켜지 못했어요.",
} as const;

interface Props {
  /** 스토리·미리보기용: 이미 토큰을 받은 상태로 시작한다. */
  initialToken?: string;
}

/** 알림 허용 창을 띄우고 이 기기의 푸시 주소(토큰)를 보여 주는 확인용 카드. */
export default function PushSetup({ initialToken }: Props) {
  const [status, setStatus] = useState<Status>(initialToken ? { ok: true, token: initialToken } : "idle");
  const [copied, setCopied] = useState(false);
  const [received, setReceived] = useState<string | null>(null);
  const [saved, setSaved] = useState<Saved>("none");

  const token = typeof status === "object" && status.ok ? status.token : null;

  // 앱이 열려 있는 동안 온 푸시는 화면에 글로 보여 준다.
  useEffect(() => {
    if (!token || initialToken) return;
    let off: (() => void) | undefined;
    void onForegroundPush((title, body) => setReceived(`${title} ${body}`.trim())).then((u) => (off = u));
    return () => off?.();
  }, [token, initialToken]);

  async function turnOn() {
    setStatus("loading");
    const result = await enablePush();
    setStatus(result);
    // 받은 푸시 주소를 서버에 저장해 둔다. (서버가 이 기기로 알림을 보낼 수 있게)
    if (result.ok) {
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: result.token }),
      }).catch(() => null);
      setSaved(res?.ok ? "saved" : "failed");
    }
  }

  async function copy() {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 복사가 막힌 브라우저에서는 아래 글자를 직접 길게 눌러 복사한다.
    }
  }

  const failed = typeof status === "object" && !status.ok ? status : null;

  return (
    <section className="glass-strong mx-5 rounded-nav p-5">
      <h2 className="text-subheading font-medium">푸시 알림</h2>
      <p className="mt-1 text-body text-muted-foreground">
        알림을 허용하면 이 기기에서 출발 알림을 받을 수 있어요.
      </p>

      {token ? (
        <div className="mt-4">
          <p className="text-caption text-muted-foreground">이 기기의 푸시 주소</p>
          <p className="mt-1 break-all rounded-input bg-muted px-3 py-2 text-caption text-muted-foreground">{token}</p>
          {saved !== "none" && (
            <p className="mt-2 text-caption text-muted-foreground">
              {saved === "saved" ? "서버에 저장했어요." : "서버에 저장하지 못했어요."}
            </p>
          )}
          <Button variant="secondary" size="lg" onClick={copy} className="mt-3 w-full">
            {copied ? "복사했어요" : "주소 복사"}
          </Button>
        </div>
      ) : (
        <Button size="lg" onClick={turnOn} disabled={status === "loading"} className="mt-4 w-full">
          {status === "loading" ? "확인 중…" : "알림 허용하기"}
        </Button>
      )}

      {failed && (
        <p role="alert" className="mt-3 text-body text-on-surface">
          {FAIL_TEXT[failed.reason]}
          {failed.reason === "error" && failed.message ? ` (${failed.message})` : ""}
        </p>
      )}
      {received && <p className="mt-3 text-body text-on-surface">받은 알림: {received}</p>}
    </section>
  );
}
