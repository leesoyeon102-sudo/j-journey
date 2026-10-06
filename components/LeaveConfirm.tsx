"use client";

import { useEffect } from "react";
import { cancelLeave, confirmLeave, useLeavePending } from "@/lib/leaveGuard";

/** 출발 안내 화면을 나가기 전 확인 창 */
export default function LeaveConfirm() {
  const open = useLeavePending();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cancelLeave();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] mx-auto flex w-[390px] max-w-full items-center justify-center bg-black/30 px-8"
      onClick={cancelLeave}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="leave-title"
        aria-describedby="leave-desc"
        onClick={(e) => e.stopPropagation()}
        className="fade-in w-full rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 id="leave-title" className="text-[17px] font-semibold">
          출발 안내 화면을 나갈까요?
        </h2>
        <p id="leave-desc" className="mt-2 text-sm leading-relaxed text-ink/70">
          이 안내는 <b className="font-medium text-ink">경로 내역</b>에서 다시 확인할 수 있어요.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            onClick={cancelLeave}
            className="h-12 rounded-xl bg-soft text-[15px] text-ink/80 active:opacity-80"
          >
            취소
          </button>
          <button
            autoFocus
            onClick={confirmLeave}
            className="h-12 rounded-xl bg-ink text-[15px] font-medium text-white active:opacity-80"
          >
            나가기
          </button>
        </div>
      </div>
    </div>
  );
}
