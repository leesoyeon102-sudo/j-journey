// 홈 입력 화면의 약속 시각·내일 토글. 다른 탭에 다녀와도 유지하고, 안내 내역에서 "이 계획 다시 검색하기"를 누르면
// 이 값을 채워서 홈으로 보낸다. (화면이 다시 만들어져도 남도록 모듈에 둔다. 새로고침하면 초기화)
export const draft: { time?: string; tomorrow?: boolean } = {};

/**
 * 안내 내역의 "이 계획 다시 검색하기"로 값을 채워 온 직후인지. 이 상태로 검색한 안내는 약속이 내일이어도 바로 출발할 수 있다.
 * 출발지·도착지·약속 시각을 직접 바꾸거나 한 번 검색하면 꺼진다.
 */
let reused = false;
export const setReusedSearch = (on: boolean) => {
  reused = on;
};
export const isReusedSearch = () => reused;

/**
 * 홈의 출발지는 열 때마다 현재 위치로 자동 입력된다. 사용자가 출발지를 직접 고르거나 안내 내역에서 불러온 뒤에는
 * 그 값을 지키려고 자동 입력을 멈춘다. (새로고침하면 다시 자동 입력)
 */
let originLocked = false;
export const lockOrigin = () => {
  originLocked = true;
};
export const isOriginLocked = () => originLocked;
