import { Button } from "@/components/ui/button";

interface Place {
  name: string;
  lat: number;
  lng: number;
}

/**
 * 카카오맵 대중교통 길찾기를 여는 주소. 좌표는 위도,경도 순서다.
 * 컴퓨터에서는 웹 카카오맵의 대중교통 경로로, 폰에서는 카카오맵 앱 길찾기로 알아서 이어진다.
 */
export function kakaoRouteUrl(origin: Place, destination: Place) {
  // 주소의 구분자(, /)가 이름에 섞이지 않게 정리한다.
  const p = (c: Place) => `${encodeURIComponent(c.name.replace(/[,/]/g, " "))},${c.lat.toFixed(6)},${c.lng.toFixed(6)}`;
  return `https://map.kakao.com/link/by/traffic/${p(origin)}/${p(destination)}`;
}

interface Props {
  origin: Place;
  destination: Place;
}

/** 같은 출발지·도착지로 카카오맵의 전체 경로(대중교통)를 새 창에서 열어 본다. */
export default function KakaoMapLink({ origin, destination }: Props) {
  return (
    <Button asChild variant="outline" size="lg" className="w-full">
      <a href={kakaoRouteUrl(origin, destination)} target="_blank" rel="noopener noreferrer">
        카카오맵에서 전체 경로 보기
      </a>
    </Button>
  );
}
