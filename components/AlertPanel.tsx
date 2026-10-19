"use client";

import { useEffect, useId } from "react";
import { createPortal } from "react-dom";

interface Props {
  /** 없으면 제목 없이 설명만 보인다. */
  title?: string;
  description: React.ReactNode;
  /** 설명 아래에 놓는 내용(입력란 등). 없으면 설명 바로 아래에 버튼이 온다. */
  content?: React.ReactNode;
  /** 바깥 영역 누르기, Esc */
  onClose: () => void;
  /** 버튼들. 같은 너비로 한 줄에 나란히 놓인다. */
  children: React.ReactNode;
}

/** 화면 가운데에 뜨는 확인 얼럿. 출발 안내 화면을 나갈 때와 도착을 기록할 때 같이 쓴다. */
export default function AlertPanel({ title, description, content, onClose, children }: Props) {
  const id = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // .fade-in 같은 transform을 가진 부모 안에서는 fixed가 화면 기준이 아니라서 body에 직접 붙인다.
  return createPortal(
    <div
      className="fixed inset-0 z-[60] mx-auto flex w-full max-w-[480px] items-center justify-center bg-on-surface/15 px-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={title ? `${id}-title` : undefined}
        aria-describedby={`${id}-desc`}
        onClick={(e) => e.stopPropagation()}
        className="fade-in w-full rounded-nav border border-glass-border bg-surface p-6 shadow-glass"
      >
        {title && (
          <h2 id={`${id}-title`} className="text-subheading font-medium">
            {title}
          </h2>
        )}
        <p id={`${id}-desc`} className={`text-body text-muted-foreground ${title ? "mt-2" : ""}`}>
          {description}
        </p>
        {content && <div className="mt-4">{content}</div>}
        <div className="mt-6 grid grid-flow-col auto-cols-fr gap-2">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
