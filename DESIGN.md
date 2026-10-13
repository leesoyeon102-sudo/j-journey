---
version: alpha
name: J의 외출
description: 약속 출발 시각을 알려주는 390px 모바일 플래너. 맑은 하늘색 배경 위에 블러 반투명 유리 면을 얹고, 버튼은 블랙을 유지한다. 출발 시각만 파랑으로 강조한다.
colors:
  primary: "#222834"
  on-primary: "#FFFFFF"
  primary-hover: "#373F51"
  toast: "#646769"
  surface: "#FFFFFF"
  on-surface: "#14171F"
  muted: "#F6F7F7"
  muted-subtle: "#FBFCFC"
  muted-foreground: "#6B6E70"
  placeholder: "#989B9D"
  inactive: "#C9CBCC"
  border: "#E7E8E8"
  border-subtle: "#F0F1F1"
  accent: "#2F5BFF"
  accent-subtle: "#EAEFFF"
  danger: "#FF5A5E"
  danger-subtle: "#FFEFEF"
  on-danger: "#45192F"
  success: "#22B35E"
  success-subtle: "#E9F7EF"
  sky: "#3D8BEB"
  sky-soft: "#A6CCF7"
  sky-pale: "#D6E8FB"
  sun: "#FFD9A8"
  on-sky: "#FFFFFF"
  on-sky-muted: "#FFFFFFC7"
  glass: "#FFFFFF80"
  glass-strong: "#FFFFFFDB"
  glass-border: "#FFFFFFB3"
typography:
  display:
    fontFamily: GT Standard L
    fontSize: 58px
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: -0.58px
  heading:
    fontFamily: GT Standard L
    fontSize: 23px
    fontWeight: 500
    lineHeight: 1.39
    letterSpacing: -0.23px
  time:
    fontFamily: GT Standard L
    fontSize: 34px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: -0.34px
  subheading:
    fontFamily: GT Standard L
    fontSize: 19px
    fontWeight: 500
    lineHeight: 1.33
    letterSpacing: -0.19px
  body-lg:
    fontFamily: GT Standard M
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: -0.16px
  body:
    fontFamily: GT Standard M
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: -0.14px
  label:
    fontFamily: GT Standard M
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.43
    letterSpacing: -0.14px
  label-lg:
    fontFamily: GT Standard M
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1.43
    letterSpacing: -0.15px
  caption:
    fontFamily: GT Standard M
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.4
  caption-lg:
    fontFamily: GT Standard M
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
rounded:
  card: 4px
  chip: 8px
  toast: 10px
  input: 10px
  nav: 16px
  button: 24px
  tag: 32px
  pill: 40px
spacing:
  unit: 4px
  element-gap: 8px
  card-padding: 12px
  chip-padding: 6px
  toast-offset: 10px
  section-gap: 64px
  page-max-width: 1200px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    height: 36px
    padding: 16px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-detail:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.button}"
    height: 44px
    padding: 16px
  button-secondary:
    backgroundColor: "{colors.border}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    height: 36px
    padding: 16px
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    height: 36px
    padding: 16px
  button-danger-solid:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    height: 36px
    padding: 16px
  button-danger:
    backgroundColor: "{colors.danger-subtle}"
    textColor: "{colors.on-danger}"
    typography: "{typography.label}"
    rounded: "{rounded.button}"
    height: 36px
    padding: 16px
  badge:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.caption}"
    rounded: "{rounded.tag}"
    height: 24px
    padding: 12px
  badge-accent:
    backgroundColor: "{colors.accent-subtle}"
    textColor: "{colors.accent}"
    typography: "{typography.caption-lg}"
    rounded: "{rounded.tag}"
    height: 24px
    padding: "{spacing.chip-padding}"
  badge-muted:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.on-surface}"
    typography: "{typography.caption}"
    rounded: "{rounded.tag}"
    height: 24px
    padding: 12px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.card}"
    padding: 12px
  card-description:
    textColor: "{colors.muted-foreground}"
    typography: "{typography.body}"
  tab-icon-inactive:
    textColor: "{colors.inactive}"
  input-placeholder:
    textColor: "{colors.placeholder}"
    typography: "{typography.body}"
  route-detail:
    backgroundColor: "{colors.muted-subtle}"
    textColor: "{colors.on-surface}"
    padding: 20px
  toast:
    backgroundColor: "{colors.toast}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.toast}"
    padding: 16px
  tab-bar-divider:
    backgroundColor: "{colors.border-subtle}"
    height: 1px
  divider:
    backgroundColor: "{colors.border}"
    height: 1px
  departure-time:
    textColor: "{colors.accent}"
    typography: "{typography.time}"
  time-chip:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label}"
    rounded: "{rounded.chip}"
    padding: 8px
  input:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.input}"
    height: 44px
    padding: 16px
  filter-chip:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: 36px
    padding: 16px
  filter-chip-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  trip-progress-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.nav}"
    padding: 20px
  live-dot:
    backgroundColor: "{colors.success}"
    rounded: "{rounded.pill}"
    size: 12px
  dialog:
    backgroundColor: "{colors.glass-strong}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.nav}"
    padding: 24px
  glass-card:
    backgroundColor: "{colors.glass-strong}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.nav}"
    padding: 16px
  sky-backdrop:
    backgroundColor: "{colors.sky}"
    textColor: "{colors.on-sky}"
---

# J의 외출 디자인 시스템

토큰의 원본은 `app/globals.css`(Tailwind `@theme`)이고, 이 문서는 그 값을 역할 이름으로 다시 묶은 것이다. 코드에서는 `bg-primary`, `text-muted-foreground`처럼 shadcn 의미 이름이나 `ink`, `mist` 같은 팔레트 이름을 쓰지만, 판단은 이 문서의 역할 이름으로 한다.

## Overview

약속 시간에 맞춰 "언제 나가야 하는지"를 알려주는 모바일 앱이다. 화면은 390px 폭의 `app-shell` 하나이고, 바깥은 연한 회색이다. 약속을 나서는 설렘을 담아 **홈 배경은 맑은 하늘**이고, 모든 카드·탭바·팝업은 **블러 반투명 유리**(glass)로 하늘 위에 떠 있다. 색은 하늘색 하나와 아주 약한 노을빛(sun) 하나만 쓰고, 버튼은 블랙(primary)을 유지한다. 사용자가 가장 먼저 봐야 할 출발 시각만 진한 파랑(accent)으로 강조한다. 다크 모드는 쓰지 않는다.

## Colors

- **primary (#222834):** 채움 버튼과 기본 배지의 유일한 채움색. 순검정보다 부드러워 화면이 무겁지 않다. hover에서는 `primary-hover`(#373F51)로 한 단계 밝아진다.
- **toast (#646769):** 토스트 배경. 색상 205°, 채도 2%의 회색을 불투명(100%)하게 고정한 값.
- **on-primary (#FFFFFF):** primary 위의 글자와 아이콘.
- **surface (#FFFFFF) / on-surface (#14171F):** 기본 캔버스·카드와 그 위의 본문·제목·아이콘.
- **inactive (#C9CBCC):** 선택되지 않은 탭바 아이콘. placeholder보다 한 단계 연하다.
- **muted-subtle (#FBFCFC):** 안내 내역에서 펼친 상세 영역처럼 흰 바탕과 살짝만 구분되는 면.
- **muted (#F6F7F7):** 입력 배경, 보조 버튼, 태그처럼 한 단계 가라앉은 면. 보조 글자는 `muted-foreground`(#6B6E70), placeholder와 비활성 글자는 `placeholder`(#989B9D)를 쓴다.
- **border (#E7E8E8):** 카드·outline 버튼·입력의 테두리와 구분선.
- **border-subtle (#F0F1F1):** 탭바 위의 구분선처럼 화면을 가르되 눈에 덜 띄어야 하는 선.
- **accent (#2F5BFF) / accent-subtle (#EAEFFF):** 출발 시각 등 앱에서 가장 중요한 숫자 하나. 안내 내역의 "자주 이용한 경로" 배지에도 쓴다(accent 글자 + accent-subtle 배경). shadcn의 `accent`(호버 배경)와 이름이 겹쳐 코드에서는 `brand`로 쓴다.
- **success (#22B35E) / success-subtle (#E9F7EF):** 지금 진행 중이라는 신호. 이동 중 카드의 동그란 점처럼 작은 도형 채움으로만 쓰고(`success-subtle`은 같은 색 10%), 글자색으로는 쓰지 않는다. 흰 바탕에서 대비가 부족하다.
- **sky (#3D8BEB) / sky-soft (#A6CCF7):** 홈 배경 하늘의 위쪽과 가운데 색. 위에서 아래로 sky → sky-soft → 흰색으로 풀린다. 하늘 위 글자(머리말·보조 문구)는 `on-sky`(흰색)와 `on-sky-muted`(흰색 78%)를 쓴다.
- **sky-pale (#D6E8FB):** 홈이 아닌 화면(안내, 안내 내역, 로드맵)의 맨 위에서 흰색으로 풀리는 연한 하늘. 유리 면이 흰 바탕에 묻히지 않도록 뒤에 깔아 둔다.
- **sun (#FFD9A8):** 하늘 한쪽에 번지는 노을빛. 배경 장식으로만 쓰고 글자·아이콘·버튼에는 쓰지 않는다. 파랑 하나로는 단조로워 보이는 하늘에 온기를 주는 두 번째 색이다.
- **glass (#FFFFFF 50%) / glass-strong (#FFFFFF 86%) / glass-border (#FFFFFF 70%):** 블러 반투명 면. 입력 칸·카드·칩은 `glass`, 글자가 많이 올라가는 면(탭바·팝업·상세 카드·위쪽 내비게이션)은 `glass-strong`을 쓴다. 테두리는 `glass-border` 1px, 뒤를 흐리는 정도는 20px(`blur-glass`).
- **danger (#FF5A5E):** 삭제·오류 같은 위험 신호. 채움으로만 쓰고(`danger-subtle`은 같은 색 10%), 그 위의 글자는 `on-danger`(#45192F, 진한 자주)로 둔다. 코랄색 글자는 대비가 부족하다.

## Typography

제목류는 GT Standard L, 본문류는 GT Standard M이다. 유료 글꼴이라 없으면 Pretendard, Apple SD Gothic Neo, Noto Sans KR 순으로 대체된다. 글자 간격은 크기에 비례해 약간 좁게(-0.01em 안팎) 둔다.

- **time (34px):** 출발 시각 전용. 화면에서 가장 크게 읽혀야 하는 숫자에만 쓴다. 홈의 이동 중 카드에서는 도착 시각도 같은 크기로 쓰되, 파랑은 출발 시각에만 준다.
- **display (58px):** 랜딩·디자인 시스템 페이지 같은 큰 머리말 전용. 앱 화면 안에서는 쓰지 않는다.
- **heading (23px) / subheading (19px):** 화면 제목과 섹션 제목.
- **body-lg (16px) / body (14px):** 본문. 앱 기본은 14px.
- **label (14px, 600):** 버튼과 입력 라벨. 버튼 글자는 SemiBold(600)이다.
- **label-lg (15px, 600):** 안내 내역 상세의 "이 계획 다시 안내받기" 버튼.
- **caption (12px, 500):** 배지, 시각 보조 설명.
- **caption-lg (13px, 500):** "자주 이용한 경로" 같은 accent 배지.

## Layout

간격은 4px 단위다. 요소 사이는 8px(`element-gap`), 카드 안쪽 여백은 12px(`card-padding`)이 기본이다. 앱 화면은 390px 고정 폭이며 더 좁은 화면에서는 `max-width: 100%`로 줄어든다. 데스크톱용 최대 폭(1200px)과 섹션 간격(64px)은 디자인 시스템 문서 페이지에서만 쓴다.

## Elevation & Depth

깊이는 유리 면으로 만든다. 카드와 입력은 `glass`(블러 20px + 흰 1px 테두리 + 푸른 기운이 도는 아주 약한 그림자 `shadow-glass`)로 하늘 위에 떠 있고, 글자가 많은 면은 `glass-strong`으로 더 하얗게 둔다. 구분선은 `border`를 그대로 쓴다. 버튼에는 그림자를 쓰지 않는다. 예외로 홈의 이동 중 카드에는 `shadow-nav`(검정 5%, 아래로 10px, 블러 20px)를 줘서 지금 진행 중인 계획이 떠 보이게 한다. 다이얼로그는 `on-surface` 15% 오버레이와 약한 블러로 뒤 화면을 물린다.

## Shapes

모양으로 컴포넌트의 종류를 구분한다. 버튼은 24px 알약, 태그·배지는 32px, 입력 컴포넌트(`Input`·`Textarea`)는 10px, 유리 카드·팝업·내비게이션은 16px(`nav`)이다. 노선 탑승 시각 chip은 8px(`chip`)이다. 같은 종류의 요소는 항상 같은 반경을 쓰고, 임의의 `rounded-lg`를 새로 섞지 않는다.

## Components

`components/ui`의 shadcn 컴포넌트를 그대로 쓴다.

- **Button:** variant는 default(primary), outline, secondary, ghost, destructive(danger-subtle), danger(danger 채움 + 흰 글자, 경로 삭제처럼 되돌릴 수 없는 동작), link. 높이는 기본 36px, 큰 것(lg) 52px. 포커스는 `on-surface` 테두리로만 표시한다. 링·그림자는 쓰지 않는다.
- **Badge:** 24px 높이의 알약. 기본은 primary 채움, 보조는 muted, 강조(accent)는 accent-subtle 배경에 accent 글자.
- **Card:** surface 배경, 1px border, 4px 반경. 제목은 heading 글꼴, 설명은 `muted-foreground`.
- **Input:** 44px 높이, muted 배경, border 테두리. 포커스 시 테두리가 `on-surface`로 진해지고, 오류(`aria-invalid`)면 danger 테두리가 된다.
- **Dialog·Alert·시각 선택 창:** `glass-strong` 중앙 패널(16px). 뒤 화면은 `on-surface` 15% 오버레이와 약한 블러로 물린다. 닫기 버튼 기본 제공.
- **Glass card:** 홈의 출발지·도착지·약속 시각 칸, 이동 중 카드, 안내 내역 항목, 로드맵 통계가 쓴다. `glass`(또는 `glass-strong`) + 16px 반경. 코드에서는 `glass`, `glass-strong` 유틸리티로 쓴다.
- **Tab bar:** 화면 아래에 떠 있는 `glass` 막대(16px). 선택된 탭은 `glass-strong` 알약 위에 `on-surface` 글자·아이콘이다. 탭을 누르면 이 알약이 0.3초 동안 옆 탭으로 미끄러지고(끝에서 살짝 튕김) 글자·아이콘 색도 같이 바뀐다. 모션 줄이기 설정에서는 움직이지 않는다. 선택되지 않은 탭은 `muted-foreground` 글자에 `inactive` 아이콘이다. 막대 뒤에는 `sky-pale`이 아래에서 위로 옅게 번져 유리가 보이게 한다.
- **Status bar:** 화면 맨 위 배경색과 같은 색으로 칠한다(`ThemeColor`). 홈·이동 중 홈은 `sky`, 나머지 화면은 `sky-pale`이라 배경이 상태 표시줄까지 끊김 없이 이어진다. 안내 화면의 위쪽 내비게이션도 흰색 대신 `sky-pale` 80% + 블러로 둬서 같은 이음새를 만든다.
- **Sky backdrop:** 홈과 이동 중 홈의 맨 위에 깔리는 하늘(위 sky → sky-soft → 흰색, 한쪽에 sun 번짐, 흰 뭉게구름 세 점). `SkyBackdrop` 컴포넌트.

## Do's and Don'ts

- Do primary 버튼은 한 화면에 하나만 둔다. 나머지 동작은 outline이나 secondary로 내린다.
- Do 글자와 아이콘은 `on-surface`, `muted-foreground`, `on-primary`, `on-danger`만 쓴다. 강조색 위 글자 대비는 WCAG AA(4.5:1)를 지킨다.
- Don't danger(코랄)를 글자·아이콘·테두리 색으로 쓰지 않는다. 채움(`danger-subtle`)에 `on-danger` 글자로만 쓴다.
- Don't accent(파랑)를 출발 시각과 "자주 이용한 경로" 배지 외의 장식에 쓰지 않는다. 한 화면에 파랑이 많으면 시각이 묻힌다. 하늘색(sky)은 배경으로만 쓰고 글자·버튼 색으로 쓰지 않는다.
- Don't 유리 면을 겹겹이 쌓지 않는다. 유리 위의 유리는 흐려져서 글자가 읽히지 않는다.
- Do 회색은 색상(hue) 205°, 채도 2%로 쓴다. 밝기만 달라지고 색조는 같다(`muted`, `muted-foreground`, `placeholder`, `inactive`, `border`, `border-subtle`, `toast`). 보라 쪽으로 기울거나 파란색이 눈에 띄는 회색, 순수한 무채색 회색(#888, #EEE 같은 값)을 새로 만들지 않는다.
- Do 하늘(sky) 위에 바로 올라가는 글자는 `on-sky`(흰색)를, 유리 위의 글자는 `on-surface`·`muted-foreground`를 쓴다.
- Don't 컴포넌트에서 hex 값을 직접 쓰거나 반경을 새로 만들지 않는다. `globals.css`의 토큰과 `rounded-button`, `rounded-input` 같은 이름만 쓴다.
