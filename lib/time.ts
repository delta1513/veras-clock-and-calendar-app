/**
 * Time-zone maths for the app, built only on Intl.DateTimeFormat.
 *
 * The chosen moment is always kept as an absolute instant (epoch ms). What the
 * screen shows is that instant's wall-clock time in the display zone — either
 * the device's own zone or Vancouver.
 */

export const VANCOUVER = "America/Vancouver";

/** Wall-clock parts. `month` is 1–12, `hour` is 0–23. */
export type Wall = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

export type Phase = "night" | "dawn" | "morning" | "midday" | "golden" | "dusk";

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(zone: string): Intl.DateTimeFormat {
  let f = formatters.get(zone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    formatters.set(zone, f);
  }
  return f;
}

/** The device's own IANA zone, e.g. "Australia/Sydney". */
export function localZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

/** Wall-clock parts of an instant in a zone. */
export function wallInZone(instant: number, zone: string): Wall {
  const parts: Record<string, number> = {};
  for (const p of formatterFor(zone).formatToParts(new Date(instant))) {
    if (p.type !== "literal") parts[p.type] = Number(p.value);
  }
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    // Some engines still print midnight as 24 even with h23.
    hour: parts.hour % 24,
    minute: parts.minute,
    second: parts.second,
  };
}

/** Treat wall parts as if they were UTC. Handy for offsets and date maths. */
function wallAsUtc(w: Wall): number {
  return Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
}

/** How far the zone's wall clock is ahead of UTC at an instant, in ms. */
export function zoneOffset(instant: number, zone: string): number {
  const whole = Math.floor(instant / 1000) * 1000;
  return wallAsUtc(wallInZone(whole, zone)) - whole;
}

/**
 * The instant at which a zone's wall clock shows the given parts.
 *
 * The zone's offset a day before and a day after the naive UTC reading are
 * the only two candidates (no zone changes its offset twice in two days).
 * Try both and keep one whose wall clock matches. In the repeated autumn hour
 * both match, so take the earlier one. In the skipped spring hour neither
 * matches, so use the offset from before the change, which lands just after
 * the gap (2:30 becomes 3:30), like a real clock.
 */
export function instantFromWall(w: Wall, zone: string): number {
  const naive = wallAsUtc(w);
  const before = naive - zoneOffset(naive - DAY, zone);
  const after = naive - zoneOffset(naive + DAY, zone);
  const matches = [before, after]
    .filter((t) => sameWall(wallInZone(t, zone), w))
    .sort((a, b) => a - b);
  return matches[0] ?? before;
}

const DAY = 86_400_000;

function sameWall(a: Wall, b: Wall): boolean {
  return (
    a.year === b.year &&
    a.month === b.month &&
    a.day === b.day &&
    a.hour === b.hour &&
    a.minute === b.minute
  );
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** 0 = Sunday. */
export function weekdayOf(year: number, month: number, day: number): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** Move by whole months, keeping the day where possible (31 Jan → 28 Feb). */
export function addMonths(w: Wall, delta: number): Wall {
  const index = w.year * 12 + (w.month - 1) + delta;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return { ...w, year, month, day: Math.min(w.day, daysInMonth(year, month)) };
}

export function isPm(w: Wall): boolean {
  return w.hour >= 12;
}

/** 1–12 on the clock face. */
export function hour12(w: Wall): number {
  return w.hour % 12 === 0 ? 12 : w.hour % 12;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "2026-10-15" */
export function dateKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** "2026-10-15T20:30" */
export function wallKey(w: Wall): string {
  return `${dateKey(w.year, w.month, w.day)}T${pad(w.hour)}:${pad(w.minute)}`;
}

/** "8:30 PM" */
export function digitalTime(w: Wall): string {
  return `${hour12(w)}:${pad(w.minute)} ${isPm(w) ? "PM" : "AM"}`;
}

/** The look of the sky for an hour of the day. 8pm is dusk. */
export function phaseForHour(hour: number): Phase {
  if (hour < 5) return "night";
  if (hour < 7) return "dawn";
  if (hour < 11) return "morning";
  if (hour < 16) return "midday";
  if (hour < 19) return "golden";
  if (hour < 21) return "dusk";
  return "night";
}

/** Gradient stops (top → bottom) for each phase, used by the background. */
export const PHASE_COLORS: Record<Phase, [string, string, string]> = {
  night: ["#1b1740", "#2e2459", "#4a2f63"],
  dawn: ["#b8a6e0", "#f3b9c6", "#ffd3a8"],
  morning: ["#a9d8f5", "#d9ecf7", "#fde7b0"],
  midday: ["#8fcdf2", "#cbe8f7", "#fff4dc"],
  golden: ["#f7b267", "#f4845f", "#c66b8a"],
  dusk: ["#3b2c6b", "#6a3d82", "#c0607a"],
};

/** Phases with stars in the sky. */
export function isDark(phase: Phase): boolean {
  return phase === "night" || phase === "dusk";
}
