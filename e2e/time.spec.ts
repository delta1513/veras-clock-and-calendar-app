import { expect, test } from "@playwright/test";
import {
  VANCOUVER,
  addMonths,
  digitalTime,
  instantFromWall,
  phaseForHour,
  wallInZone,
  wallKey,
  type Wall,
} from "../lib/time";

// Pure unit tests for the zone maths. They run in Node, no browser needed.

const wall = (s: string): Wall => {
  const [d, t] = s.split("T");
  const [year, month, day] = d.split("-").map(Number);
  const [hour, minute] = t.split(":").map(Number);
  return { year, month, day, hour, minute, second: 0 };
};

test.describe("lib/time", () => {
  test("wall parts of an instant in a zone", () => {
    const instant = Date.UTC(2026, 9, 14, 23, 0); // 2026-10-14 23:00Z
    expect(wallKey(wallInZone(instant, "Australia/Sydney"))).toBe("2026-10-15T10:00");
    expect(wallKey(wallInZone(instant, VANCOUVER))).toBe("2026-10-14T16:00");
    expect(wallKey(wallInZone(instant, "UTC"))).toBe("2026-10-14T23:00");
  });

  test("midnight is hour 0", () => {
    const instant = Date.UTC(2026, 0, 1, 8, 0); // midnight in Vancouver (PST)
    expect(wallInZone(instant, VANCOUVER).hour).toBe(0);
  });

  test("wall time back to an instant, round trip, many zones", () => {
    const zones = [VANCOUVER, "Australia/Sydney", "Europe/London", "Asia/Kolkata", "UTC"];
    for (const zone of zones) {
      for (let h = 0; h < 24 * 400; h += 7) {
        const instant = Date.UTC(2026, 0, 1) + h * 3600_000;
        const w = wallInZone(instant, zone);
        const back = instantFromWall(w, zone);
        expect(wallKey(wallInZone(back, zone)), `${zone} ${w}`).toBe(wallKey(w));
      }
    }
  });

  test("DST: Vancouver spring gap and autumn overlap", () => {
    // 2026-03-08 02:30 does not exist in Vancouver; it lands after the gap.
    const gap = instantFromWall(wall("2026-03-08T02:30"), VANCOUVER);
    expect(wallKey(wallInZone(gap, VANCOUVER))).toBe("2026-03-08T03:30");
    // 2026-11-01 01:30 happens twice; the earlier (PDT, -7) one is chosen.
    const overlap = instantFromWall(wall("2026-11-01T01:30"), VANCOUVER);
    expect(new Date(overlap).toISOString()).toBe("2026-11-01T08:30:00.000Z");
    // Either side of the change.
    expect(new Date(instantFromWall(wall("2026-07-01T12:00"), VANCOUVER)).toISOString()).toBe(
      "2026-07-01T19:00:00.000Z",
    );
    expect(new Date(instantFromWall(wall("2026-12-01T12:00"), VANCOUVER)).toISOString()).toBe(
      "2026-12-01T20:00:00.000Z",
    );
  });

  test("DST: Sydney", () => {
    expect(
      new Date(instantFromWall(wall("2026-10-15T10:00"), "Australia/Sydney")).toISOString(),
    ).toBe("2026-10-14T23:00:00.000Z");
    expect(
      new Date(instantFromWall(wall("2026-06-15T10:00"), "Australia/Sydney")).toISOString(),
    ).toBe("2026-06-15T00:00:00.000Z");
  });

  test("month steps keep the day where possible", () => {
    expect(wallKey(addMonths(wall("2026-01-31T09:00"), 1))).toBe("2026-02-28T09:00");
    expect(wallKey(addMonths(wall("2026-12-15T09:00"), 1))).toBe("2027-01-15T09:00");
    expect(wallKey(addMonths(wall("2026-01-15T09:00"), -1))).toBe("2025-12-15T09:00");
  });

  test("phases and digital time", () => {
    expect(phaseForHour(2)).toBe("night");
    expect(phaseForHour(6)).toBe("dawn");
    expect(phaseForHour(10)).toBe("morning");
    expect(phaseForHour(13)).toBe("midday");
    expect(phaseForHour(17)).toBe("golden");
    expect(phaseForHour(20)).toBe("dusk");
    expect(phaseForHour(22)).toBe("night");
    expect(digitalTime(wall("2026-10-15T20:30"))).toBe("8:30 PM");
    expect(digitalTime(wall("2026-10-15T00:05"))).toBe("12:05 AM");
    expect(digitalTime(wall("2026-10-15T12:00"))).toBe("12:00 PM");
  });
});
