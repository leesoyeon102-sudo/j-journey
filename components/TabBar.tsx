"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { isLeaveGuardActive, requestLeave } from "@/lib/leaveGuard";

const TABS = [
  { href: "/", label: "홈", icon: "M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z" },
  { href: "/history", label: "경로 내역", icon: "M5 6h14M5 12h14M5 18h9" },
  { href: "/roadmap", label: "로드맵", icon: "M5 18c3-9 5 0 7-6s4-4 7-6M5 18h.01M19 6h.01" },
];

export default function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <nav className="fixed bottom-0 left-1/2 z-20 w-[390px] max-w-full -translate-x-1/2 border-t border-line bg-white/95 backdrop-blur">
      <ul className="grid grid-cols-3 pb-[env(safe-area-inset-bottom)]">
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
                className={`flex h-14 flex-col items-center justify-center gap-1 text-[11px] ${
                  active ? "text-ink" : "text-sub"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={active ? 2 : 1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={t.icon} />
                </svg>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
