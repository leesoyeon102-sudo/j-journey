const pad = (n: number) => String(n).padStart(2, "0");

/** 하루 0시 기준 분 → "HH:MM" */
export function fmt(min: number) {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

/** "HH:MM" → 분 */
export function parseTime(s: string) {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}

export function fmtDate(ms: number) {
  const d = new Date(ms);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
