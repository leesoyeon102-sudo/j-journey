/** 컨페티 색: 디자인 토큰(accent, sky, sky-soft, sun, success)만 쓴다. */
const COLORS = [
  "var(--color-accent-brand)",
  "var(--color-sky)",
  "var(--color-sun)",
  "var(--color-success)",
  "var(--color-sky-soft)",
];

/** 모션 랩에서 컨페티를 비교한 휴대폰 목업의 도착 버튼 너비(px). 실제 버튼이 더 넓은 만큼 조각 크기·퍼지는 거리·개수를 키워 같은 모습으로 보이게 한다. */
const LAB_BUTTON_WIDTH = 204;
const PIECES = 22;

/** --motion-celebrate-duration 토큰을 ms로 읽는다. 빌드가 1400ms를 1.4s로 줄여 쓰기도 해서 단위를 구분한다. */
function celebrateDuration(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--motion-celebrate-duration").trim();
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return 1400;
  return raw.endsWith("ms") ? n : n * 1000;
}

/**
 * 버튼에서 색 조각(컨페티)이 팡 터지는 완료 연출. 화면 맨 위(body)에 잠깐 그렸다가 지운다.
 * 연출이 끝날 때까지 걸리는 시간(ms)을 돌려준다. 움직임 줄이기 설정이면 아무것도 그리지 않고 0을 돌려준다.
 */
export function burstConfetti(anchor: HTMLElement): number {
  if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return 0;

  const base = celebrateDuration();
  const rect = anchor.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const scale = Math.min(2.2, Math.max(1, rect.width / LAB_BUTTON_WIDTH));
  const count = Math.round(PIECES * Math.min(scale, 1.8));

  // 얼럿(z-60)보다 아래에 둬서, 연출이 얼럿 뒤로 비치지 않게 한다.
  const layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:55;overflow:hidden";
  document.body.appendChild(layer);

  for (let i = 0; i < count; i++) {
    const angle = -Math.PI + Math.random() * Math.PI; // 위쪽 반원 방향
    const distance = (50 + Math.random() * 70) * scale;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    const rotate = (Math.random() - 0.5) * 540;
    const w = (5 + Math.random() * 4) * scale;
    const h = (8 + Math.random() * 5) * scale;
    const piece = document.createElement("span");
    piece.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;width:${w}px;height:${h}px;margin:${-h / 2}px 0 0 ${-w / 2}px;background:${COLORS[i % COLORS.length]};border-radius:${i % 3 ? 2 : 6}px`;
    layer.appendChild(piece);
    piece.animate(
      [
        { transform: "translate(0,0) rotate(0) scale(.3)", opacity: 1 },
        { transform: `translate(${dx}px,${dy}px) rotate(${rotate / 2}deg) scale(1)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${dx * 1.15}px,${dy + 70 * scale}px) rotate(${rotate}deg) scale(.9)`, opacity: 0 },
      ],
      { duration: base + Math.random() * 300, easing: "cubic-bezier(.2,.7,.3,1)", fill: "both" },
    );
  }

  // 조각이 다 떨어진 뒤 잠깐 머물렀다가(0.5초) 끝난 것으로 본다.
  const total = base + 500;
  window.setTimeout(() => layer.remove(), total + 50);
  return total;
}
