---
version: alpha
name: J의 외출
description: 약속 출발 시각을 알려주는 390px 모바일 플래너. 차분한 무채색 위에 출발 시각만 파랑으로 강조한다.
colors:
  primary: "#222834"
  on-primary: "#FFFFFF"
  primary-hover: "#373F51"
  toast: "#646971"
  surface: "#FFFFFF"
  on-surface: "#14171F"
  muted: "#F5F6F9"
  muted-subtle: "#FAFBFD"
  muted-foreground: "#677084"
  placeholder: "#9BA2B0"
  inactive: "#C9CED8"
  border: "#E5E7EB"
  border-subtle: "#EEF0F4"
  accent: "#2F5BFF"
  accent-subtle: "#EAEFFF"
  danger: "#FF5A5E"
  danger-subtle: "#FFEFEF"
  on-danger: "#45192F"
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
    backgroundColor: "{colors.muted}"
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
  dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.input}"
    padding: 16px
---

# J의 외출 디자인 시스템

토큰의 원본은 `app/globals.css`(Tailwind `@theme`)이고, 이 문서는 그 값을 역할 이름으로 다시 묶은 것이다. 코드에서는 `bg-primary`, `text-muted-foreground`처럼 shadcn 의미 이름이나 `ink`, `mist` 같은 팔레트 이름을 쓰지만, 판단은 이 문서의 역할 이름으로 한다.

## Overview

약속 시간에 맞춰 "언제 나가야 하는지"를 알려주는 모바일 앱이다. 화면은 390px 폭의 `app-shell` 하나이고, 바깥은 연한 회색이다. 분위기는 조용하고 정돈된 쪽이다. 정보가 많아도 한 번에 읽혀야 해서, 색은 거의 무채색으로 두고 사용자가 가장 먼저 봐야 할 출발 시각만 파랑으로 강조한다. 다크 모드는 쓰지 않는다.

## Colors

- **primary (#222834):** 채움 버튼과 기본 배지의 유일한 채움색. 순검정보다 부드러워 화면이 무겁지 않다. hover에서는 `primary-hover`(#373F51)로 한 단계 밝아진다.
- **toast (#646971):** 토스트 배경. primary(#222834) 70%를 흰 바탕에 올렸을 때 보이는 회색을 불투명(100%)한 색으로 고정한 값.
- **on-primary (#FFFFFF):** primary 위의 글자와 아이콘.
- **surface (#FFFFFF) / on-surface (#14171F):** 기본 캔버스·카드와 그 위의 본문·제목·아이콘.
- **inactive (#C9CED8):** 선택되지 않은 탭바 아이콘. placeholder보다 한 단계 연하다.
- **muted-subtle (#FAFBFD):** 경로 내역에서 펼친 상세 영역처럼 흰 바탕과 살짝만 구분되는 면.
- **muted (#F5F6F9):** 입력 배경, 보조 버튼, 태그처럼 한 단계 가라앉은 면. 보조 글자는 `muted-foreground`(#677084), placeholder와 비활성 글자는 `placeholder`(#9BA2B0)를 쓴다.
- **border (#E5E7EB):** 카드·outline 버튼·입력의 테두리와 구분선.
- **border-subtle (#EEF0F4):** 탭바 위의 구분선처럼 화면을 가르되 눈에 덜 띄어야 하는 선.
- **accent (#2F5BFF) / accent-subtle (#EAEFFF):** 출발 시각 등 앱에서 가장 중요한 숫자 하나. 경로 내역의 "자주 이용한 경로" 배지에도 쓴다(accent 글자 + accent-subtle 배경). shadcn의 `accent`(호버 배경)와 이름이 겹쳐 코드에서는 `brand`로 쓴다.
- **danger (#FF5A5E):** 삭제·오류 같은 위험 신호. 채움으로만 쓰고(`danger-subtle`은 같은 색 10%), 그 위의 글자는 `on-danger`(#45192F, 진한 자주)로 둔다. 코랄색 글자는 대비가 부족하다.

## Typography

제목류는 GT Standard L, 본문류는 GT Standard M이다. 유료 글꼴이라 없으면 Pretendard, Apple SD Gothic Neo, Noto Sans KR 순으로 대체된다. 글자 간격은 크기에 비례해 약간 좁게(-0.01em 안팎) 둔다.

- **time (34px):** 출발 시각 전용. 화면에서 가장 크게 읽혀야 하는 숫자 하나에만 쓴다.
- **display (58px):** 랜딩·디자인 시스템 페이지 같은 큰 머리말 전용. 앱 화면 안에서는 쓰지 않는다.
- **heading (23px) / subheading (19px):** 화면 제목과 섹션 제목.
- **body-lg (16px) / body (14px):** 본문. 앱 기본은 14px.
- **label (14px, 600):** 버튼과 입력 라벨. 버튼 글자는 SemiBold(600)이다.
- **label-lg (15px, 600):** 경로 내역 상세의 "이 경로로 다시 안내받기" 버튼.
- **caption (12px, 500):** 배지, 시각 보조 설명.
- **caption-lg (13px, 500):** "자주 이용한 경로" 같은 accent 배지.

## Layout

간격은 4px 단위다. 요소 사이는 8px(`element-gap`), 카드 안쪽 여백은 12px(`card-padding`)이 기본이다. 앱 화면은 390px 고정 폭이며 더 좁은 화면에서는 `max-width: 100%`로 줄어든다. 데스크톱용 최대 폭(1200px)과 섹션 간격(64px)은 디자인 시스템 문서 페이지에서만 쓴다.

## Elevation & Depth

그림자 대신 면의 색 차이와 1px 테두리로 위계를 만든다. 카드는 `border` 테두리, 입력은 `muted` 배경으로 구분한다. 버튼에는 그림자를 쓰지 않는다. 다이얼로그는 `on-surface` 40% 오버레이와 약한 블러로 뒤 화면을 물린다.

## Shapes

모양으로 컴포넌트의 종류를 구분한다. 버튼은 24px 알약, 태그·배지는 32px, 입력은 10px, 내비게이션은 16px, 카드는 4px로 거의 각져 있다. 노선 탑승 시각 chip은 8px(`chip`)이다. 같은 종류의 요소는 항상 같은 반경을 쓰고, 임의의 `rounded-lg`를 새로 섞지 않는다.

## Components

`components/ui`의 shadcn 컴포넌트를 그대로 쓴다.

- **Button:** variant는 default(primary), outline, secondary, ghost, destructive(danger-subtle), danger(danger 채움 + 흰 글자, 경로 삭제처럼 되돌릴 수 없는 동작), link. 높이는 기본 36px, 큰 것(lg) 52px. 포커스는 `on-surface` 테두리와 옅은 링으로 표시한다.
- **Badge:** 24px 높이의 알약. 기본은 primary 채움, 보조는 muted, 강조(accent)는 accent-subtle 배경에 accent 글자.
- **Card:** surface 배경, 1px border, 4px 반경. 제목은 heading 글꼴, 설명은 `muted-foreground`.
- **Input:** 44px 높이, muted 배경, border 테두리. 포커스 시 테두리가 `on-surface`로 진해지고, 오류(`aria-invalid`)면 danger 테두리가 된다.
- **Dialog:** surface 배경의 중앙 패널. 닫기 버튼 기본 제공.

## Do's and Don'ts

- Do primary 버튼은 한 화면에 하나만 둔다. 나머지 동작은 outline이나 secondary로 내린다.
- Do 글자와 아이콘은 `on-surface`, `muted-foreground`, `on-primary`, `on-danger`만 쓴다. 강조색 위 글자 대비는 WCAG AA(4.5:1)를 지킨다.
- Don't danger(코랄)를 글자·아이콘·테두리 색으로 쓰지 않는다. 채움(`danger-subtle`)에 `on-danger` 글자로만 쓴다.
- Don't accent(파랑)를 출발 시각과 "자주 이용한 경로" 배지 외의 장식에 쓰지 않는다. 한 화면에 파랑이 많으면 시각이 묻힌다.
- Don't 컴포넌트에서 hex 값을 직접 쓰거나 반경을 새로 만들지 않는다. `globals.css`의 토큰과 `rounded-button`, `rounded-input` 같은 이름만 쓴다.
