import { Redis } from "@upstash/redis";

// 푸시 알림용 저장소(Upstash Redis). 접속 정보는 Vercel이 환경변수로 넣어 준다.
// (KV_REST_API_URL·KV_REST_API_TOKEN 또는 UPSTASH_REDIS_REST_URL·UPSTASH_REDIS_REST_TOKEN)
let redis: Redis | null = null;
const db = () => (redis ??= Redis.fromEnv());

/** 이 기기의 푸시 주소(토큰). 같은 토큰을 다시 저장하면 마지막 확인 시각만 갱신된다. */
const TOKENS = "push:tokens";

/** FCM 토큰은 ':'을 포함한 긴 글자다. 터무니없는 값은 거른다. */
export const validToken = (t: unknown): t is string =>
  typeof t === "string" && t.length >= 50 && t.length <= 4096 && /^[\w:.-]+$/.test(t);

export async function saveToken(token: string) {
  await db().zadd(TOKENS, { score: Date.now(), member: token });
}

export async function removeToken(token: string) {
  await db().zrem(TOKENS, token);
}

export async function tokenCount() {
  return db().zcard(TOKENS);
}
