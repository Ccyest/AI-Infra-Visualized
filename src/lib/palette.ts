/**
 * 分类色按实体(请求/序列/专家……)编号取色,颜色跟随实体本身,
 * 亮/暗两套具体色值定义在 src/styles/global.css 的 --series-N 中。
 */
export function seriesColor(id: number): string {
  return `var(--series-${((id - 1) % 8) + 1})`;
}
