import { reverseGeocode } from "@/lib/api";

/** 브라우저에서 현재 위치를 읽는다. 못 읽으면 `GeolocationPositionError`처럼 `code`가 있는 값으로 거절된다. */
export function readPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      reject({ code: 2 });
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000,
    });
  });
}

/** 현재 위치와 그 주소. 위치 선택 창의 "현재 위치" 버튼과 홈의 출발지 자동 입력이 같이 쓴다. */
export async function readCurrentPlace(): Promise<{ name: string; address: string; lat: number; lng: number }> {
  const pos = await readPosition();
  const { latitude: lat, longitude: lng } = pos.coords;
  const address = (await reverseGeocode({ lat, lng })) ?? "";
  return { name: "현재 위치", address, lat, lng };
}
