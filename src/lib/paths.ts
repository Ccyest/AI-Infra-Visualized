// 站内链接统一走这里,保证在 GitHub Pages 子路径(base=/AI-Infra-Visualized)下也正确。
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
