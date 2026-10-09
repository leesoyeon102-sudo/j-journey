import type { Preview } from '@storybook/nextjs-vite'

// 앱과 같은 토큰(@theme, shadcn 변수, 글꼴)이 적용되도록 전역 CSS를 그대로 불러온다.
import '../app/globals.css'

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  },
};

export default preview;
