import { Button } from "@/components/ui/button";

interface Coord {
  lat: number;
  lng: number;
}

/** 카카오맵 대중교통 길찾기를 여는 주소. 좌표는 위도,경도 순서다. */
export function kakaoRouteUrl(origin: Coord, destination: Coord) {
  const p = (c: Coord) => `${c.lat.toFixed(6)},${c.lng.toFixed(6)}`;
  return `https://m.map.kakao.com/scheme/route?sp=${p(origin)}&ep=${p(destination)}&by=publictransit`;
}

interface Props {
  origin: Coord;
  destination: Coord;
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
