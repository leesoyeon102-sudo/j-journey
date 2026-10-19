"use client";

import { useEffect, useId } from "react";

/** 브라우저 상태 표시줄(status bar) 색으로 쓸 수 있는 배경 토큰 */
type Token = "sky" | "sky-pale" | "surface";

const DEFAULT: Token = "sky-pale";

// 화면 위에 다른 화면(위치 선택 창 등)이 겹쳐 뜨면 맨 위에 있는 쪽 색을 쓰고, 닫히면 아래 화면 색으로 돌아간다.
const stack: { id: string; token: Token }[] = [];

function apply() {
  const token = stack.length ? stack[stack.length - 1].token : DEFAULT;
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
 * 화면이 사라지면 기본(연한 하늘)이나, 그 아래에 깔려 있던 화면의 색으로 돌아간다. 토큰 값은 globals.css에서 읽는다.
 */
export default function ThemeColor({ token = DEFAULT }: { token?: Token }) {
  const id = useId();
  useEffect(() => {
    const i = stack.findIndex((s) => s.id === id);
    if (i >= 0) stack[i].token = token;
    else stack.push({ id, token });
    apply();
    return () => {
      const j = stack.findIndex((s) => s.id === id);
      if (j >= 0) stack.splice(j, 1);
      apply();
    };
  }, [id, token]);
  return null;
}
