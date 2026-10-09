import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
  "stories": [
    "../stories/**/*.mdx",
    "../components/**/*.stories.@(ts|tsx)"
  ],
  "addons": ["@storybook/addon-a11y", "@storybook/addon-docs", "@storybook/addon-mcp"],
  "framework": "@storybook/nextjs-vite"
};
export default config;
