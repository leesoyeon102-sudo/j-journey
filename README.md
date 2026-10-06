# J의 외출

약속 시각만 넣으면 몇 시에 집을 나서 어떤 열차를 타야 하는지 알려주는 약속 출발 플래너. 기획은 [PRD.md](./PRD.md) 참고.

## 실행

```bash
npm install
npm run dev   # http://localhost:3000 (모바일 390px 기준 화면)
```

## 구조

```
app/
  layout.tsx          390px 앱 셸 + 하단 탭
  page.tsx            홈: 입력 → 출발 안내 타임라인 → 도착 기록
  history/page.tsx    경로 내역 (이용 횟수)
  roadmap/page.tsx    나의 로드맵
components/           Planner, Timeline, StationPicker, Stepper, RoadmapMap, TabBar, Header
lib/
  planner.ts          도착 시각 역산 (경로 탐색 + 시간표 역산)
  timetable.ts        열차 시간표 조회 (승차역→하차역 열차 매칭)
  server/             외부 API 호출 (서울 시간표, 도보 경로, 주소 검색)
  stations.ts         데모용 노선·역 데이터
  routes.ts           경로 묶기, 로드맵 집계
  storage.ts          localStorage 저장 (useSyncExternalStore)
```

## 참고

- 출발지·도착지를 현재 위치(브라우저 위치 허용) 또는 주소 검색으로 고르고 도착 시각만 입력하면 "몇 시에 출발해야 하는지"를 알려줍니다. 마지막으로 고른 출발지는 기본값으로 기억합니다. 도보 시간은 실제 보행 경로 API로, 열차 시간은 노선 데이터로 계산합니다.
- 외부 API (`app/api/*`, `lib/server/*`):
  - 주소·장소 검색, 좌표 → 주소: **카카오 로컬 API** (`KAKAO_REST_KEY` 필요). 키가 없거나 호출이 실패하면 OpenStreetMap Nominatim으로 대신 찾습니다. 검색어에 "근처·주변"이 있으면 기준 좌표(출발지·도착지) 반경 5km 안에서 가까운 순으로 찾습니다.
  - 도보 경로: Valhalla(OpenStreetMap 공개 서버, 키 없음). 호출 제한이 있어 운영 시 교체를 검토하세요.
  - 지하철 시간표: 서울 열린데이터광장 (`SEOUL_SUBWAY_KEY`).
- 위치 허용은 HTTPS 또는 localhost에서만 동작합니다. 같은 와이파이의 휴대폰에서 `http://IP:3000`으로 접속하면 위치 허용이 막히니 주소 검색으로 등록하세요.
- 지하철 데이터는 서울·경기·인천 22개 노선, 583개 역입니다. [KoreaMetroGraph](https://github.com/ledyx/KoreaMetroGraph)(MIT) 데이터를 `scripts/build-metro.py`로 가공해 `lib/data/metro.json`에 담았습니다.
  - 원본이 2018년경 기준이라 이후 개통한 노선·역(신림선, 김포골드라인, 9호선 연장 등)은 없습니다.
  - 원본에서 끊긴 구간은 스크립트가 가까운 역끼리 이어 보정합니다.
- **열차 시각**: 1~9호선은 서울 열린데이터광장의 서울교통공사 열차 시간표(`SearchSTNTimeTableByIDService`)로 실제 열차를 찾아 계산합니다. 평일·토·일 시간표를 날짜에 맞춰 쓰고, 공휴일은 구분하지 않습니다.
  - 그 외 노선(경의중앙선, 분당선, 공항철도, 신분당선 등)은 시간표 API가 없어 노선별 가정 배차 간격으로 예상하고, 화면에 "예상 시각"이라고 표시합니다.
  - `.env.local`에 `SEOUL_SUBWAY_KEY=인증키`가 필요합니다. 없으면 모든 노선을 예상으로 계산합니다.
  - 받은 시간표는 `.cache/seoul-timetable`에 7일간 저장해 호출 수를 줄입니다.
  - 역 이름 ↔ 역코드 연결은 `python3 scripts/build-station-codes.py`로 `lib/data/stationcodes.json`을 다시 만듭니다.
- 기록은 브라우저 localStorage에 저장됩니다.
- 로드맵은 지도 타일 없이 역 좌표로 그린 SVG 노선도입니다.
