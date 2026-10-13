/** 뭉게구름 한 점. 흰색에서 아래로 갈수록 연한 하늘색으로 살짝 그늘지고, 가장자리는 부드럽게 흐리다. */
function Cloud({ className, id }: { className: string; id: string }) {
  return (
    <svg
      viewBox="0 0 200 100"
      aria-hidden="true"
      className={`cloud-drift absolute blur-[1.5px] ${className}`}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--color-surface)" }} />
          <stop offset="1" style={{ stopColor: "var(--color-sky-pale)" }} />
        </linearGradient>
      </defs>
      <g fill={`url(#${id})`}>
        <ellipse cx="100" cy="72" rx="88" ry="22" />
        <circle cx="52" cy="58" r="26" />
        <circle cx="96" cy="42" r="36" />
        <circle cx="146" cy="56" r="28" />
      </g>
    </svg>
  );
}

/** 홈 화면 맨 위에 깔리는 맑은 하늘과 뭉게구름. 부모를 `relative isolate`로 두면 내용 뒤(-z-10)에 깔린다. */
export default function SkyBackdrop() {
  return (
    <div aria-hidden="true" className="sky-backdrop pointer-events-none absolute inset-x-0 top-0 -z-10 h-[680px] overflow-hidden">
      <Cloud id="cloud-a" className="-right-6 top-[30px] w-48 opacity-90" />
      <Cloud id="cloud-b" className="-left-10 top-[520px] w-60 opacity-95" />
      <Cloud id="cloud-c" className="right-2 top-[590px] w-36 opacity-80" />
    </div>
  );
}
