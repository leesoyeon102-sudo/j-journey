/** 홈 화면 추가 안내를 어떻게 보여 줄지. none이면 띄우지 않는다. */
export type InstallKind = "none" | "safari" | "inapp";

const DISMISSED_KEY = "install-alert-dismissed";

/** 아이폰·아이패드(iPadOS는 데스크톱 사파리처럼 보여서 터치 가능한 Mac으로도 찾는다) */
function isIOS(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/** 홈 화면에 추가한 앱으로 열었는지 */
function isStandalone(): boolean {
  return (navigator as Navigator & { standalone?: boolean }).standalone === true || matchMedia("(display-mode: standalone)").matches;
}

/** 인스타그램·페이스북·카카오톡 같은 앱 안의 브라우저. 여기서는 홈 화면에 추가를 할 수 없다. (메타 광고로 들어오면 대부분 여기다) */
function isInAppBrowser(): boolean {
  return /Instagram|FBAN|FBAV|KAKAOTALK|NAVER\(inapp|Line\//i.test(navigator.userAgent);
}

/** 이번 접속(탭)에서 이미 닫았는지 */
function wasDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissInstallAlert() {
  try {
    sessionStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    // 저장이 막힌 브라우저에서는 이 화면을 떠날 때까지만 닫힌 채로 둔다.
  }
}

/** 아이폰에서 홈 화면에 추가하지 않고 열었을 때만 안내가 필요하다. 브라우저에서만 호출한다. */
export function readInstallKind(): InstallKind {
  if (!isIOS() || isStandalone() || wasDismissed()) return "none";
  return isInAppBrowser() ? "inapp" : "safari";
}
