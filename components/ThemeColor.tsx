"use client";

import { useEffect } from "react";

/** 브라우저 상태 표시줄(status bar) 색으로 쓸 수 있는 배경 토큰 */
type Token = "sky" | "sky-pale";

const DEFAULT: Token = "sky-pale";

function apply(token: Token) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(`--color-${token}`).trim();
  if (!value) return;
  // Next가 화면을 옮길 때 같은 이름의 태그를 하나 더 달 수 있어, 있는 것을 모두 같은 색으로 맞춘다.
  let metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
  if (metas.length === 0) {
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
    metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
  }
  metas.forEach((m) => (m.content = value));
}

/**
 * 화면 맨 위 배경색과 같은 색으로 상태 표시줄을 칠해, 배경이 상태 표시줄까지 이어져 보이게 한다.
 * 화면이 사라지면 기본(연한 하늘)으로 돌아간다. 토큰 값은 globals.css에서 읽는다.
 */
export default function ThemeColor({ token = DEFAULT }: { token?: Token }) {
  useEffect(() => {
    apply(token);
    return () => apply(DEFAULT);
  }, [token]);
  return null;
}
