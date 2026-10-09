"use client";

import AlertPanel from "@/components/AlertPanel";
import { Button } from "@/components/ui/button";
import { cancelLeave, confirmLeave, useLeavePending } from "@/lib/leaveGuard";

/** 출발 안내 화면을 나가기 전 확인 창 */
export default function LeaveConfirm() {
  const open = useLeavePending();
  if (!open) return null;
  return (
    <AlertPanel
      title="출발 안내 화면을 나갈까요?"
      description={
        <>
          이 안내는 <b className="font-medium text-on-surface">경로 내역</b>에서 다시 확인할 수 있어요.
        </>
      }
      onClose={cancelLeave}
    >
      <Button variant="secondary" size="lg" onClick={cancelLeave}>
        취소
      </Button>
      <Button size="lg" autoFocus onClick={confirmLeave}>
        나가기
      </Button>
    </AlertPanel>
  );
}
