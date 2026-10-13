"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { isLeaveGuardActive, requestLeave } from "@/lib/leaveGuard";

// 홈·안내 내역은 채운(fill) 아이콘이고 선택 여부는 색으로만 구분한다. (비활성 muted-foreground, 활성 on-surface)
const HOME =
  "M6 21H18A3 3 0 0 0 21 18V10.33A1.5 1.5 0 0 0 20.43 9.15L13.5 3.59A2.4 2.4 0 0 0 10.5 3.59L3.57 9.15A1.5 1.5 0 0 0 3 10.33V18A3 3 0 0 0 6 21Z M11 19v-4a1 1 0 0 1 2 0v4z";
const LIST =
  "M6 2h12a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3z M9 7h6a1 1 0 0 1 0 2H9a1 1 0 0 1 0-2z M9 11h6a1 1 0 0 1 0 2H9a1 1 0 0 1 0-2z M9 15h3a1 1 0 0 1 0 2H9a1 1 0 0 1 0-2z";

type Tab = { href: string; label: string; icon: (active: boolean) => React.ReactNode };

const filledIcon = (d: string) =>
  function FilledIcon() {
    return (
      <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" fillRule="evenodd" aria-hidden="true">
        <path d={d} />
      </svg>
    );
  };

const strokeIcon = (d: string) =>
  function StrokeIcon(active: boolean) {
    return (
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={d} />
      </svg>
    );
  };

const TABS: Tab[] = [
  { href: "/", label: "홈", icon: filledIcon(HOME) },
  { href: "/history", label: "안내 내역", icon: filledIcon(LIST) },
  { href: "/roadmap", label: "로드맵", icon: strokeIcon("M5 18c3-9 5 0 7-6s4-4 7-6M5 18h.01M19 6h.01") },
];

export default function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const activeIndex = TABS.findIndex((t) => t.href === pathname);
  return (
    // 하늘 위에 떠 있는 유리 막대. 바깥 nav는 투명하고, 클릭은 막대에서만 받는다.
    <nav className="pointer-events-none fixed bottom-0 left-1/2 z-20 w-[390px] max-w-full -translate-x-1/2 bg-linear-to-t from-sky-pale to-sky-pale/0 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-6">
      <ul className="glass pointer-events-auto relative grid grid-cols-3 rounded-nav p-1">
        {/* 선택 표시: 탭을 누르면 이 알약이 옆 탭으로 미끄러져 간다. */}
        <li
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-input bg-glass-strong transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.34,1.3,0.64,1)] motion-reduce:transition-none"
          style={{ transform: `translateX(${Math.max(activeIndex, 0) * 100}%)`, opacity: activeIndex < 0 ? 0 : 1 }}
        />
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                onClick={(e) => {
                  // 출발 안내 화면에서 다른 탭으로 나가면 확인 창을 먼저 띄운다.
                  if (!active && isLeaveGuardActive()) {
                    e.preventDefault();
                    requestLeave(() => router.push(t.href));
                  }
                }}
                className={`relative flex h-12 flex-col items-center justify-center gap-0.5 rounded-input text-caption transition-colors duration-300 ${
                  active ? "font-semibold text-on-surface" : "font-normal text-muted-foreground"
                }`}
              >
                {/* 비활성 아이콘은 글자보다 한 단계 연한 inactive 색 */}
                <span className={`flex transition-colors duration-300 ${active ? "" : "text-inactive"}`}>{t.icon(active)}</span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
