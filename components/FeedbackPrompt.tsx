"use client";

import { useEffect, useRef, useState } from "react";
import FeedbackAlert from "@/components/FeedbackAlert";
import Toast from "@/components/Toast";
import { hasAskedFeedback, markFeedbackAsked, onArrived, submitFeedback } from "@/lib/feedback";

/** "도착했어요"를 누른 뒤 이 시간이 지나면 피드백 창을 띄운다. */
const DELAY_MS = 2000;

/**
 * 앱 어디서든 한 번만 별점·의견을 묻는다.
 * 출발 안내에서 "도착했어요"를 누르면 어떤 화면에 있든 2초 뒤에 뜬다.
 * 보냈든 닫았든 한 번 물었으면 다시 묻지 않는다.
 */
export default function FeedbackPrompt() {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = onArrived(() => {
      if (timer.current || hasAskedFeedback()) return;
      timer.current = setTimeout(() => {
        timer.current = null;
        if (hasAskedFeedback()) return;
        markFeedbackAsked();
        setOpen(true);
      }, DELAY_MS);
    });
    return () => {
      unsubscribe();
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
    };
  }, []);

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
