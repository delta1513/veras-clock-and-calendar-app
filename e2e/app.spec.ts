import { expect, test, type Page } from "@playwright/test";

/*
 * Vera's device is pinned to Sydney, far from Vancouver, so the 🇨🇦 button
 * always changes the date as well as the time. The clock is faked and paused.
 */
const LOCAL = "Australia/Sydney";
const VANCOUVER = "America/Vancouver";
// 2026-10-15 10:00 in Sydney (AEDT, UTC+11) = 2026-10-14 16:00 in Vancouver.
const MORNING = new Date("2026-10-14T23:00:00Z");
// 2026-10-15 20:00 in Sydney.
const EVENING = new Date("2026-10-15T09:00:00Z");

test.use({ timezoneId: LOCAL });

// Vera cannot read a dialog, so any dialog fails the test.
let dialogs: string[] = [];
test.beforeEach(async ({ page }) => {
  dialogs = [];
  page.on("dialog", async (dialog) => {
    dialogs.push(`${dialog.type()}: ${dialog.message()}`);
    await dialog.dismiss();
  });
});
test.afterEach(() => {
  expect(dialogs, "no browser dialogs").toEqual([]);
});

async function open(page: Page, at: Date = MORNING) {
  await page.clock.install({ time: new Date(at.getTime() - 5_000) });
  await page.goto("/");
  await page.clock.pauseAt(at);
  await expect(page.getByTestId("app")).toBeVisible();
}

const app = (page: Page) => page.getByTestId("app");

/** Wall time "YYYY-MM-DDTHH:mm" of an instant in a zone, computed with Intl. */
function wallIn(instant: Date, zone: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(instant)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/** Tap the clock face at a clock position (1–12). */
async function tapFace(page: Page, position: number) {
  const box = (await page.getByTestId("clock-face").boundingBox())!;
  const a = (position / 12) * Math.PI * 2;
  const r = box.width * 0.3;
  await page.mouse.click(
    box.x + box.width / 2 + Math.sin(a) * r,
    box.y + box.height / 2 - Math.cos(a) * r,
  );
}

test("opens live on the current date and time", async ({ page }) => {
  await open(page);
  await expect(app(page)).toHaveAttribute("data-time", "2026-10-15T10:00");
  await expect(app(page)).toHaveAttribute("data-zone", LOCAL);
  await expect(app(page)).toHaveAttribute("data-live", "true");

  const today = page.getByTestId("day-2026-10-15");
  await expect(today).toHaveAttribute("data-today", "true");
  await expect(today).toHaveAttribute("data-selected", "true");
  await expect(page.getByTestId("month-label")).toHaveText("October 2026");

  await expect(page.getByTestId("live-badge")).toBeVisible();
  await expect(page.getByTestId("frozen-badge")).toHaveCount(0);
  await expect(page.getByTestId("second-hand")).toHaveCount(1);

  await page.clock.fastForward("05:00");
  await expect(app(page)).toHaveAttribute("data-time", "2026-10-15T10:05");
});

test("tapping a day selects it and freezes the time", async ({ page }) => {
  await open(page);
  await page.getByTestId("day-2026-10-20").click();

  await expect(app(page)).toHaveAttribute("data-time", "2026-10-20T10:00");
  await expect(page.getByTestId("day-2026-10-20")).toHaveAttribute("data-selected", "true");
  await expect(page.getByTestId("day-2026-10-15")).toHaveAttribute("data-today", "true");
  await expect(page.getByTestId("frozen-badge")).toBeVisible();
  await expect(page.getByTestId("second-hand")).toHaveCount(0);

  await page.clock.fastForward("10:00");
  await expect(app(page)).toHaveAttribute("data-time", "2026-10-20T10:00");
});

test("month arrows change month and freeze", async ({ page }) => {
  await open(page);
  await page.getByTestId("month-next").click();
  await expect(page.getByTestId("month-label")).toHaveText("November 2026");
  await expect(app(page)).toHaveAttribute("data-time", "2026-11-15T10:00");
  await expect(page.getByTestId("frozen-badge")).toBeVisible();

  await page.getByTestId("month-prev").click();
  await page.getByTestId("month-prev").click();
  await expect(page.getByTestId("month-label")).toHaveText("September 2026");
  await expect(app(page)).toHaveAttribute("data-time", "2026-09-15T10:00");
});

test("clock: tap hour, then minute", async ({ page }) => {
  await open(page);
  await expect(page.getByTestId("hand-hour")).toHaveAttribute("aria-pressed", "true");

  await tapFace(page, 3);
  await expect(app(page)).toHaveAttribute("data-time", "2026-10-15T03:00");
  await expect(app(page)).toHaveAttribute("data-active-hand", "minute");
  await expect(page.getByTestId("hand-minute")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("frozen-badge")).toBeVisible();

  await tapFace(page, 6);
  await expect(app(page)).toHaveAttribute("data-time", "2026-10-15T03:30");
  await expect(app(page)).toHaveAttribute("data-active-hand", "hour");

  // Minute snaps to 5 and never rolls the hour over.
  await page.getByTestId("hand-minute").click();
  await tapFace(page, 11.9);
  await expect(app(page)).toHaveAttribute("data-time", "2026-10-15T03:00");
});

test("clock: the hour keeps PM", async ({ page }) => {
  await open(page, EVENING);
  await tapFace(page, 9);
  await expect(app(page)).toHaveAttribute("data-time", "2026-10-15T21:00");
});

test("clock: dragging a hand works too", async ({ page }) => {
  await open(page);
  await page.getByTestId("hand-minute").click();
  const box = (await page.getByTestId("clock-face").boundingBox())!;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const r = box.width * 0.3;
  await page.mouse.move(cx, cy - r);
  await page.mouse.down();
  await page.mouse.move(cx + r, cy, { steps: 5 });
  await page.mouse.move(cx, cy + r, { steps: 5 });
  await page.mouse.move(cx - r, cy, { steps: 5 });
  await page.mouse.up();
  await expect(app(page)).toHaveAttribute("data-time", "2026-10-15T10:45");
  await expect(app(page)).toHaveAttribute("data-active-hand", "hour");
});

test("AM/PM flips 12 hours on the same date", async ({ page }) => {
  await open(page);
  await expect(page.getByTestId("ampm-am")).toHaveAttribute("aria-pressed", "true");
  await page.getByTestId("ampm-pm").click();
  await expect(app(page)).toHaveAttribute("data-time", "2026-10-15T22:00");
  await expect(page.getByTestId("ampm-pm")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("frozen-badge")).toBeVisible();
  await page.getByTestId("ampm-am").click();
  await expect(app(page)).toHaveAttribute("data-time", "2026-10-15T10:00");
});

test("🇨🇦 shows the same moment in Vancouver, 🏠 brings it back", async ({ page }) => {
  await open(page);
  const canada = page.getByTestId("btn-canada");
  await expect(canada).toHaveText("🇨🇦");
  await expect(page.getByTestId("canada-badge")).toHaveCount(0);

  await canada.click();
  const expected = wallIn(MORNING, VANCOUVER);
  expect(expected).toBe("2026-10-14T16:00");
  await expect(app(page)).toHaveAttribute("data-time", expected);
  await expect(app(page)).toHaveAttribute("data-zone", VANCOUVER);
  await expect(page.getByTestId("canada-badge")).toBeVisible();
  await expect(canada).toHaveText("🏠");
  await expect(page.getByTestId("day-2026-10-14")).toHaveAttribute("data-selected", "true");
  await expect(page.getByTestId("ampm-pm")).toHaveAttribute("aria-pressed", "true");
  await expect(app(page)).toHaveAttribute("data-phase", "golden");
  await expect(page.getByTestId("frozen-badge")).toBeVisible();

  await canada.click();
  await expect(app(page)).toHaveAttribute("data-time", "2026-10-15T10:00");
  await expect(app(page)).toHaveAttribute("data-zone", LOCAL);
  await expect(page.getByTestId("canada-badge")).toHaveCount(0);
  await expect(canada).toHaveText("🇨🇦");
});

test("edits in Vancouver are Vancouver wall time", async ({ page }) => {
  await open(page);
  await page.getByTestId("btn-canada").click();
  // 9:00 PM on 14 October in Vancouver …
  await tapFace(page, 9);
  await tapFace(page, 12);
  await expect(app(page)).toHaveAttribute("data-time", "2026-10-14T21:00");
  // … is 3:00 PM on 15 October in Sydney.
  await page.getByTestId("btn-canada").click();
  const expected = wallIn(new Date("2026-10-15T04:00:00Z"), LOCAL);
  expect(expected).toBe("2026-10-15T15:00");
  await expect(app(page)).toHaveAttribute("data-time", expected);
});

test("background follows the time of day", async ({ page }) => {
  await open(page, EVENING);
  await expect(app(page)).toHaveAttribute("data-phase", "dusk");
  await page.getByTestId("ampm-am").click(); // 8 AM
  await expect(app(page)).toHaveAttribute("data-phase", "morning");
  await tapFace(page, 2); // 2 AM
  await expect(app(page)).toHaveAttribute("data-phase", "night");
  await page.getByTestId("ampm-pm").click(); // 2 PM
  await expect(app(page)).toHaveAttribute("data-phase", "midday");
});

test("10am is morning", async ({ page }) => {
  await open(page);
  await expect(app(page)).toHaveAttribute("data-phase", "morning");
});

test("🔄 returns to live local time", async ({ page }) => {
  await open(page);
  await page.getByTestId("day-2026-10-03").click();
  await page.getByTestId("ampm-pm").click();
  await page.getByTestId("btn-canada").click();
  await expect(page.getByTestId("canada-badge")).toBeVisible();

  await page.clock.fastForward("30:00");
  await page.getByTestId("btn-reset").click();

  await expect(app(page)).toHaveAttribute("data-live", "true");
  await expect(app(page)).toHaveAttribute("data-zone", LOCAL);
  await expect(app(page)).toHaveAttribute("data-time", "2026-10-15T10:30");
  await expect(app(page)).toHaveAttribute("data-active-hand", "hour");
  await expect(page.getByTestId("live-badge")).toBeVisible();
  await expect(page.getByTestId("canada-badge")).toHaveCount(0);
  await expect(page.getByTestId("btn-canada")).toHaveText("🇨🇦");

  await page.clock.fastForward("01:00");
  await expect(app(page)).toHaveAttribute("data-time", "2026-10-15T10:31");
});

test("big buttons, no sideways scroll, nothing hidden under the bar", async ({ page }) => {
  await open(page);
  for (const button of await page.getByRole("button").all()) {
    const box = (await button.boundingBox())!;
    const id = await button.getAttribute("data-testid");
    expect(box.width, `${id} width`).toBeGreaterThanOrEqual(44);
    expect(box.height, `${id} height`).toBeGreaterThanOrEqual(44);
  }
  for (const id of ["btn-canada", "btn-reset"]) {
    const box = (await page.getByTestId(id).boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(56);
  }

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);

  // Scrolled to the bottom, the AM/PM switch sits fully above the action bar.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const pm = (await page.getByTestId("ampm-pm").boundingBox())!;
  const bar = (await page.getByTestId("btn-canada").boundingBox())!;
  expect(pm.y + pm.height).toBeLessThan(bar.y - 8);
});

test("iPad landscape: the bar covers neither the calendar nor the clock", async ({ page }) => {
  // Vera photographs her iPad screen, so everything must be in view at once.
  await page.setViewportSize({ width: 1080, height: 810 });
  await open(page);
  const bar = (await page.getByTestId("action-bar").boundingBox())!;
  for (const id of ["calendar", "clock-face", "ampm-pm"]) {
    const box = (await page.getByTestId(id).boundingBox())!;
    expect(box.y + box.height, id).toBeLessThan(bar.y);
  }
});
