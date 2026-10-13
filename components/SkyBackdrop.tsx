/** 홈 화면 맨 위에 깔리는 맑은 하늘. 부모를 `relative isolate`로 두면 내용 뒤(-z-10)에 깔린다. */
export default function SkyBackdrop() {
  return <div aria-hidden="true" className="sky-backdrop pointer-events-none absolute inset-x-0 top-0 -z-10 h-[680px]" />;
}
