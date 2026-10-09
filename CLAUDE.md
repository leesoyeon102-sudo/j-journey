@AGENTS.md

# 디자인 규칙

- UI 작업(컴포넌트·스타일·화면 수정) 전에 반드시 `DESIGN.md`를 먼저 읽는다.
- `DESIGN.md`에 없는 색·간격·반경 값을 새로 만들지 않는다. 필요하면 `DESIGN.md`에 먼저 토큰을 추가하고 `app/globals.css`에 반영한다.
- UI 작업 전에 Storybook MCP(`http://localhost:6016/mcp`)로 기존 컴포넌트를 먼저 확인한다. 이미 있는 컴포넌트는 새로 만들지 않고 재사용한다.
- 새 컴포넌트를 만들면 `*.stories.tsx` 파일도 같이 만든다. variant와 상태(hover, disabled 등)를 각각 하나의 스토리로 둔다.
