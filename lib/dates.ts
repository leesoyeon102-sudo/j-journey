const pad = (n: number) => String(n).padStart(2, "0");

/** 오늘(0) 또는 내일(1)의 날짜 문자열 YYYY-MM-DD */
export function dateString(dayOffset: 0 | 1) {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 약속 시각(분)이 오늘 이미 지났으면 내일로 본다. */
export function nextOccurrence(arriveBy: number): { date: string; tomorrow: boolean } {
  const now = new Date();
  const tomorrow = arriveBy <= now.getHours() * 60 + now.getMinutes();
  return { date: dateString(tomorrow ? 1 : 0), tomorrow };
}
