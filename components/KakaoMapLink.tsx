import { Button } from "@/components/ui/button";

interface Place {
  name: string;
  lat: number;
  lng: number;
}

/**
 * 카카오맵 도보 길찾기를 여는 주소. 좌표는 위도,경도 순서다.
 * 컴퓨터에서는 웹 카카오맵의 도보 경로로, 폰에서는 카카오맵 앱 길찾기로 알아서 이어진다.
 */
export function kakaoWalkUrl(from: Place, to: Place) {
  // 주소의 구분자(, /)가 이름에 섞이지 않게 정리한다.
  const p = (c: Place) => `${encodeURIComponent(c.name.replace(/[,/]/g, " "))},${c.lat.toFixed(6)},${c.lng.toFixed(6)}`;
  return `https://map.kakao.com/link/by/walk/${p(from)}/${p(to)}`;
}

interface Props {
  from: Place;
  to: Place;
}

/** 걷는 구간 옆에 붙는 작은 흰색 버튼(글자 11px·차콜, 높이 26px·좌우 안쪽 여백 10px). 같은 출발·도착 지점으로 카카오맵 도보 길찾기를 새 창에서 연다. */
export default function KakaoMapLink({ from, to }: Props) {
  return (
    <Button asChild variant="outline" size="xs" className="h-[26px] px-[10px] text-[11px] text-ink-soft">
      <a href={kakaoWalkUrl(from, to)} target="_blank" rel="noopener noreferrer" aria-label={`${from.name}에서 ${to.name}까지 카카오맵 도보 길찾기`}>
        카카오맵
      </a>
    </Button>
  );
}
