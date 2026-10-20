interface Props {
  /** clock: 나갈 시각을 알려 주는 시계, gift: 추첨 선물 상자 */
  variant: "clock" | "gift";
  className?: string;
}

const fill = (token: string) => ({ stopColor: `var(--color-${token})` });

/** 광고 랜딩 카드 왼쪽에 놓는 동그란 일러스트. 연한 하늘 원 위에 입체감 있는 시계·선물 상자를 얹는다. */
export default function LandingArt({ variant, className = "" }: Props) {
  const id = `landing-art-${variant}`;
  return (
    <div
      aria-hidden="true"
      className={`flex size-20 shrink-0 items-center justify-center rounded-pill border border-glass-border bg-linear-to-b from-sky-pale to-surface ${className}`}
    >
      <svg viewBox="0 0 64 64" className="size-[4.5rem]">
        <defs>
          <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={fill(variant === "clock" ? "surface" : "sky-soft")} />
            <stop offset="1" style={fill(variant === "clock" ? "sky-pale" : "sky")} />
          </linearGradient>
          <linearGradient id={`${id}-lid`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={fill("sky-pale")} />
            <stop offset="1" style={fill("sky-soft")} />
          </linearGradient>
          <filter id={`${id}-soft`}>
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        </defs>
        {/* 바닥 그림자 */}
        <ellipse cx="32" cy="55" rx="15" ry="3" fill="var(--color-primary)" opacity="0.14" filter={`url(#${id}-soft)`} />
        {variant === "clock" ? (
          <>
            <circle cx="19" cy="16" r="6" fill="var(--color-sky-soft)" />
            <circle cx="45" cy="16" r="6" fill="var(--color-sky-soft)" />
            <circle cx="32" cy="33" r="19" fill={`url(#${id}-body)`} stroke="var(--color-sky)" strokeWidth="3" />
            <ellipse cx="25" cy="23" rx="6" ry="3" fill="var(--color-surface)" opacity="0.8" transform="rotate(-35 25 23)" />
            <g fill="var(--color-sky-soft)">
              <circle cx="32" cy="21" r="1.3" />
              <circle cx="44" cy="33" r="1.3" />
              <circle cx="32" cy="45" r="1.3" />
              <circle cx="20" cy="33" r="1.3" />
            </g>
            <path
              d="M32 33V24M32 33l7 4"
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="32" cy="33" r="2.6" fill="var(--color-surface)" stroke="var(--color-primary)" strokeWidth="1.5" />
          </>
        ) : (
          <>
            <ellipse cx="46" cy="18" rx="9" ry="9" fill="var(--color-sun)" opacity="0.9" filter={`url(#${id}-soft)`} />
            <rect x="15" y="31" width="34" height="22" rx="3.5" fill={`url(#${id}-body)`} />
            <rect x="12" y="25" width="40" height="10" rx="3.5" fill={`url(#${id}-lid)`} stroke="var(--color-sky)" strokeWidth="1.5" />
            <rect x="29" y="25" width="6" height="28" fill="var(--color-surface)" />
            <ellipse cx="25.5" cy="19.5" rx="7" ry="4.5" fill="var(--color-surface)" stroke="var(--color-sky-soft)" strokeWidth="1.5" transform="rotate(-20 25.5 19.5)" />
            <ellipse cx="38.5" cy="19.5" rx="7" ry="4.5" fill="var(--color-surface)" stroke="var(--color-sky-soft)" strokeWidth="1.5" transform="rotate(20 38.5 19.5)" />
            <circle cx="32" cy="22" r="3.2" fill="var(--color-surface)" stroke="var(--color-sky-soft)" strokeWidth="1.5" />
            <path d="M52 8v6M49 11h6" stroke="var(--color-sun)" strokeWidth="2" strokeLinecap="round" />
          </>
        )}
      </svg>
    </div>
  );
}
