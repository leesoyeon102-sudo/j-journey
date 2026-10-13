// 홈 입력 화면의 약속 시각·내일 토글. 다른 탭에 다녀와도 유지하고, 안내 내역에서 "이 계획 다시 검색하기"를 누르면
// 이 값을 채워서 홈으로 보낸다. (화면이 다시 만들어져도 남도록 모듈에 둔다. 새로고침하면 초기화)
export const draft: { time?: string; tomorrow?: boolean } = {};

/**
 * 홈의 출발지는 열 때마다 현재 위치로 자동 입력된다. 사용자가 출발지를 직접 고르거나 안내 내역에서 불러온 뒤에는
 * 그 값을 지키려고 자동 입력을 멈춘다. (새로고침하면 다시 자동 입력)
 */
let originLocked = false;
export const lockOrigin = () => {
  originLocked = true;
};
export const isOriginLocked = () => originLocked;
