interface Props {
  className?: string;
}

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

/** 집 모양 아이콘. 위치 선택 화면의 "집" 칩에 쓴다. */
export function HomeIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M2.5 11.5 12 3l9.5 8.5" />
      <path d="M4.5 10v9.5a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V10" />
    </svg>
  );
}

/** 집 모양에 연필이 겹친 아이콘. 홈 오른쪽 위의 "집 주소 변경" 버튼에 쓴다. HomeIcon과 같은 집 모양이다. */
export function HomeEditIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M2.5 11.5 12 3l9.5 8.5" />
      <path d="M4.5 10v9.5a1 1 0 0 0 1 1H11" />
      <path d="M19.5 10v2" />
      <path d="m13.5 20 .5-2.5 5.3-5.3a1.4 1.4 0 0 1 2 2L16 19.5z" />
    </svg>
  );
}
