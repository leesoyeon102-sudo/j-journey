@AGENTS.md

# 디자인 규칙

- UI 작업(컴포넌트·스타일·화면 수정) 전에 반드시 `DESIGN.md`를 먼저 읽는다.
- `DESIGN.md`에 없는 색·간격·반경 값을 새로 만들지 않는다. 필요하면 `DESIGN.md`에 먼저 토큰을 추가하고 `app/globals.css`에 반영한다.
- UI 작업 전에 Storybook MCP(`http://localhost:6016/mcp`)로 기존 컴포넌트를 먼저 확인한다. 이미 있는 컴포넌트는 새로 만들지 않고 재사용한다.
- 새 컴포넌트를 만들면 `*.stories.tsx` 파일도 같이 만든다. variant와 상태(hover, disabled 등)를 각각 하나의 스토리로 둔다.

# 모션 규칙

- 애니메이션·전환에는 `--motion-*` 토큰만 쓴다. ms 값이나 cubic-bezier를 직접 쓰지 않는다.
- 나타나고 움직이는 것(얼럿, 카드, 탭바 알약)은 `--motion-ease`와 `--motion-duration-base`를 쓴다.
- 호버·눌림 반응은 `--motion-duration-fast`를 쓰고, 눌렀을 때는 `--motion-press-scale`만큼 작아진다.
- 여러 요소가 차례로 나타날 때는 `--motion-stagger` 간격으로 위에서부터 순서대로 보여 준다.
- 상태가 바뀌는 버튼은 '색 + 글자 + 점' 방식을 따른다. (색이 부드럽게 바뀌고, 글자가 올라오며 바뀌고, 이동 중에는 점이 차례로 움직인다.)
- 도착 완료 연출(컨페티)은 `--motion-celebrate-duration`을 쓰고, 색은 디자인 토큰만 쓴다.
- 움직임 줄이기 설정이면 위치·크기 변화는 끄고 투명도만 바꾼다.
