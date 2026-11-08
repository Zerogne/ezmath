/**
 * Calendar math in Mongolian time. Ulaanbaatar is UTC+8 all year (no daylight saving), and the servers run in
 * Sydney, so "today", "this week" and the free plan's daily limit must never use the server's local time.
 */
const OFFSET_MS = 8 * 3_600_000;

/** A Date whose UTC fields read as Ulaanbaatar wall-clock time. */
export function ulaanbaatarClock(at: Date | string = new Date()) {
  return new Date(new Date(at).getTime() + OFFSET_MS);
}

/** YYYY-MM-DD in Ulaanbaatar. */
export function ulaanbaatarDay(at: Date | string = new Date()) {
  return ulaanbaatarClock(at).toISOString().slice(0, 10);
}

/** Start of the current Ulaanbaatar day as an ISO timestamp. */
export function startOfUlaanbaatarDay(now = new Date()) {
  const local = ulaanbaatarClock(now);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - OFFSET_MS).toISOString();
}

/** Day of the week in Ulaanbaatar, 0 = Monday … 6 = Sunday. */
export function ulaanbaatarWeekday(now = new Date()) {
  return (ulaanbaatarClock(now).getUTCDay() + 6) % 7;
}

/** Monday of the current Ulaanbaatar week, as YYYY-MM-DD. */
export function ulaanbaatarWeekStart(now = new Date()) {
  const local = ulaanbaatarClock(now);
  local.setUTCDate(local.getUTCDate() - ulaanbaatarWeekday(now));
  return local.toISOString().slice(0, 10);
}
