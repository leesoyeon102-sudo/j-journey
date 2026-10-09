"use client";

import { createPortal } from "react-dom";

// 부모가 .fade-in 애니메이션(transform)을 가지면 position: fixed가 화면이 아니라 그 부모를 기준으로 잡힌다.
// 그래서 body에 직접 붙인다.

/** 화면 아래(탭바 위)에 잠깐 떴다 사라지는 안내. 좌우 여백 사이를 채우는 박스. 표시와 숨김(타이머)은 부르는 쪽에서 정한다. */
export default function Toast({ message }: { message: string }) {
  return createPortal(
    // 좌우 여백(px-5)은 화면 안쪽 여백과 같고, 박스는 그 사이를 가득 채운다.
    // 아래는 탭바(테두리 1px + 56px + 안전 영역) 위로 toast-offset(10px)만큼 띄운다.
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(67px+env(safe-area-inset-bottom))] z-30 mx-auto w-[390px] max-w-full px-5">
      <p
        role="status"
        aria-live="polite"
        className="fade-in rounded-toast bg-toast px-4 py-3 text-body font-medium text-on-primary"
      >
        {message}
      </p>
    </div>,
    document.body,
  );
}
