/** Finish well before closure; absolute angles keep discovery repeatable. */
export function revealAt(angle) {
  if (!Number.isFinite(angle)) return 0;
  const t = Math.max(0, Math.min(1, (105 - angle) / 70));
  return t * t * (3 - 2 * t);
}
