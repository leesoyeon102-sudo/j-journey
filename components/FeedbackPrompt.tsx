"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import FeedbackAlert from "@/components/FeedbackAlert";
import Toast from "@/components/Toast";
import { hasAskedFeedback, hasVisited, markFeedbackAsked, submitFeedback } from "@/lib/feedback";
import { useFeedbackBlocked } from "@/lib/feedbackGate";
import { useTrips } from "@/lib/storage";

/** 조건이 갖춰진 뒤 이 시간 동안 화면이 막혀 있지 않으면 피드백 창을 띄운다. */
const DELAY_MS = 2000;

/**
 * 앱 어디서든 한 번만 별점·의견을 묻는다. 조건:
 *  1. 도착 기록을 1번 이상 남겼다 (경로 검색 → 도착했어요/늦었어요)
 *  2. 경로 내역에 1번 이상 들어왔다
 *  3. 로드맵에 1번 이상 들어왔다
 * 경로 상세, 위치 선택, 출발 안내 같은 화면은 `useFeedbackBlock`으로 막는다.
 */
export default function FeedbackPrompt() {
  const trips = useTrips();
  const pathname = usePathname();
  const blocked = useFeedbackBlocked();
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (open || blocked || hasAskedFeedback()) return;
    const arrived = trips.some((t) => t.status !== "planned");
    if (!arrived || !hasVisited("history") || !hasVisited("roadmap")) return;
    // 실제로 띄울 때 "물었다"고 기록하므로, 그 전에 막히면 다음 기회에 다시 묻는다.
    const t = setTimeout(() => {
      markFeedbackAsked();
      setOpen(true);
    }, DELAY_MS);
    return () => clearTimeout(t);
  }, [trips, pathname, blocked, open]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <>
      {open && (
        <FeedbackAlert
          onClose={() => setOpen(false)}
          onSubmit={(rating, comment) => {
            submitFeedback(rating, comment);
            setOpen(false);
            setToast("의견을 보냈어요. 고맙습니다!");
          }}
        />
      )}
      {toast && <Toast message={toast} />}
    </>
  );
}
