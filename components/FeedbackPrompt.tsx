"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import FeedbackAlert from "@/components/FeedbackAlert";
import SurveyAlert from "@/components/SurveyAlert";
import Toast from "@/components/Toast";
import { hasAskedFeedback, markFeedbackAsked, onArrived, submitFeedback } from "@/lib/feedback";
import { SURVEY_URL } from "@/lib/survey";

/** "도착했어요!"를 누른 뒤 이 시간이 지나면 피드백 창을 띄운다. */
const DELAY_MS = 1000;

/**
 * 앱 어디서든 한 번만 설문 참여(설문 주소가 없으면 별점·의견)를 묻는다.
 * 출발 안내에서 "도착했어요!"를 누르면 어떤 화면에 있든 1초 뒤에 뜬다.
 * 보냈든 닫았든 한 번 물었으면 다시 묻지 않는다. 나중에·보내기를 누르면 로드맵으로 가서 그려진 길을 보여 준다.
 */
export default function FeedbackPrompt() {
  const router = useRouter();
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
      {open && SURVEY_URL && (
        <SurveyAlert
          href={SURVEY_URL}
          onGo={() => {
            setOpen(false);
            router.push("/roadmap");
          }}
        />
      )}
      {/* 설문 주소가 아직 없으면 기존 별점·의견 얼럿을 그대로 쓴다. */}
      {open && !SURVEY_URL && (
        <FeedbackAlert
          onClose={() => {
            setOpen(false);
            router.push("/roadmap");
          }}
          onSubmit={(rating, comment) => {
            submitFeedback(rating, comment);
            setOpen(false);
            router.push("/roadmap");
            setToast("의견을 보냈어요. 고맙습니다!");
          }}
        />
      )}
      {toast && <Toast message={toast} />}
    </>
  );
}
