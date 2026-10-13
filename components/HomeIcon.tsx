interface Props {
  className?: string;
}

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

/** 집 모양 아이콘. 위치 선택 화면의 "집" 칩에 쓴다. */
export function HomeIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M3.5 11 12 4l8.5 7" />
      <path d="M5.5 9.5V19a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.5" />
    </svg>
  );
}

/** 집 모양에 연필이 겹친 아이콘. 홈 오른쪽 위의 "집 주소 변경" 버튼에 쓴다. HomeIcon과 같은 집 모양이다. */
export function HomeEditIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M3.5 11 12 4l8.5 7" />
      <path d="M5.5 9.5V19a1 1 0 0 0 1 1H11" />
      <path d="M18.5 9.5V12" />
      <path d="m13.5 20 .5-2.5 5.3-5.3a1.4 1.4 0 0 1 2 2L16 19.5z" />
    </svg>
  );
}
