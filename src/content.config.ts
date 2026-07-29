import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

// 每篇教程 = src/content/lessons/<locale>/<slug>.mdx(zh 与 en 各一份)。
// frontmatter 按此 schema 校验,字段含义见 CONTRIBUTING.md。
const lessons = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/lessons" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    /** 排序与上一篇/下一篇导航用,新文章递增 */
    order: z.number(),
    concepts: z.array(z.string()).default([]),
    references: z
      .array(z.object({ label: z.string(), url: z.string().url() }))
      .default([]),
    /** SGLang cookbook 对应章节的链接,渲染为文末 “Try on SGLang” 按钮 */
    tryOnSglang: z.string().url().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { lessons };
