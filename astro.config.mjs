// @ts-check
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

// 本地开发时 base 为 "/";GitHub Pages 部署时由 CI 注入
// SITE=https://ccyest.github.io BASE_PATH=/AI-Infra-Visualized(见 .github/workflows/deploy.yml)。
export default defineConfig({
  site: process.env.SITE,
  base: process.env.BASE_PATH ?? "/",
  integrations: [react(), mdx()],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});
