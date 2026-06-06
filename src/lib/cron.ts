// Minimal standard 5-field cron support: "minute hour day-of-month month day-of-week".
// Handles *, lists (1,2), ranges (1-5), and steps (*/5, 1-10/2). Minute granularity.

function expandField(field: string, min: number, max: number): number[] | null {
  const out = new Set<number>();
  for (const part of field.split(",")) {
    const [rangePart, stepPart] = part.split("/");
    const step = stepPart === undefined ? 1 : parseInt(stepPart, 10);
    if (!Number.isFinite(step) || step <= 0) return null;

    let lo = min, hi = max;
    if (rangePart !== "*" && rangePart !== "") {
      const bounds = rangePart.split("-");
      if (bounds.length === 1) {
        lo = hi = parseInt(bounds[0], 10);
      } else if (bounds.length === 2) {
        lo = parseInt(bounds[0], 10);
        hi = parseInt(bounds[1], 10);
      } else return null;
      if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo < min || hi > max || lo > hi) return null;
    }
    for (let v = lo; v <= hi; v += step) out.add(v);
  }
  return out.size ? [...out] : null;
}

const FIELDS: Array<[number, number]> = [
  [0, 59], // minute
  [0, 23], // hour
  [1, 31], // day of month
  [1, 12], // month
  [0, 6],  // day of week (0 = Sunday)
];

export function isValidCron(expr: string): boolean {
  const parts = String(expr).trim().split(/\s+/);
  if (parts.length !== 5) return false;
  return parts.every((p, i) => expandField(p, FIELDS[i][0], FIELDS[i][1]) !== null);
}

/** True when the cron expression fires at the given date (to the minute). */
export function cronMatches(expr: string, date: Date): boolean {
  const parts = String(expr).trim().split(/\s+/);
  if (parts.length !== 5) return false;
  const sets = parts.map((p, i) => expandField(p, FIELDS[i][0], FIELDS[i][1]));
  if (sets.some((s) => s === null)) return false;

  const values = [date.getMinutes(), date.getHours(), date.getDate(), date.getMonth() + 1, date.getDay()];
  // Standard cron: when both DOM and DOW are restricted, either matching fires.
  const [min, hour, dom, mon, dow] = sets as number[][];
  const domRestricted = parts[2] !== "*";
  const dowRestricted = parts[4] !== "*";
  const dayOk = domRestricted && dowRestricted
    ? dom.includes(values[2]) || dow.includes(values[4])
    : dom.includes(values[2]) && dow.includes(values[4]);

  return min.includes(values[0]) && hour.includes(values[1]) && mon.includes(values[3]) && dayOk;
}
