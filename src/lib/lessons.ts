import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";
import type { Locale } from "./i18n";

export interface LessonRef {
  entry: CollectionEntry<"lessons">;
  /** 去掉语言前缀的 slug,即 URL 中的路径段 */
  slug: string;
}

const LOCALE_DIRS = ["zh/", "en/"];

/** 某语言下按 order 排序的可见课程(draft 仅本地 dev 可见) */
export async function publishedLessons(locale: Locale): Promise<LessonRef[]> {
  const all = await getCollection("lessons");
  // 放错目录的课程不会命中任何路由,必须在构建期报错而不是静默消失
  const orphans = all.filter(
    (e) => !LOCALE_DIRS.some((dir) => e.id.startsWith(dir)),
  );
  if (orphans.length > 0) {
    throw new Error(
      `Lessons must live in src/content/lessons/<zh|en>/: ${orphans
        .map((e) => e.id)
        .join(", ")}`,
    );
  }
  return all
    .filter(
      ({ id, data }) =>
        id.startsWith(`${locale}/`) && (!data.draft || import.meta.env.DEV),
    )
    .sort((a, b) => a.data.order - b.data.order)
    .map((entry) => ({ entry, slug: entry.id.slice(locale.length + 1) }));
}

/** 课程页路径(未拼 base,交给 withBase) */
export function lessonPath(locale: Locale, slug: string): string {
  return locale === "zh" ? `/lessons/${slug}/` : `/en/lessons/${slug}/`;
}
