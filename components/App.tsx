"use client";

import { useState } from "react";
import {
  VANCOUVER,
  addMonths,
  instantFromWall,
  phaseForHour,
  wallInZone,
  wallKey,
  type Wall,
} from "@/lib/time";
import { useLocalZone, useNow } from "@/lib/useNow";
import Calendar from "./Calendar";
import DayBar from "./DayBar";
import Clock, { type Hand } from "./Clock";
import { HandIcon } from "./icons";
import Sky from "./Sky";

export default function App() {
  const now = useNow();
  const local = useLocalZone();

  /** The frozen instant, or null while the clock is live. */
  const [frozen, setFrozen] = useState<number | null>(null);
  const [vancouver, setVancouver] = useState(false);
  const [activeHand, setActiveHand] = useState<Hand>("hour");

  if (now === null || local === null) {
    // Static build: nothing to show until the browser knows the time.
    return <Sky phase="night" />;
  }

  const zone = vancouver ? VANCOUVER : local;
  const instant = frozen ?? now;
  const wall = wallInZone(instant, zone);
  const live = frozen === null;
  const todayWall = wallInZone(now, zone);
  const phase = phaseForHour(wall.hour);

  /** Freeze at what is shown and apply an edit in display-zone wall time. */
  const edit = (change: (w: Wall) => Wall) => {
    const base = { ...wall, second: 0 };
    setFrozen(instantFromWall(change(base), zone));
  };

  const setHand = (hand: Hand, value: number, done: boolean) => {
    if (hand === "hour") {
      edit((w) => ({ ...w, hour: value + (w.hour >= 12 ? 12 : 0) }));
      if (done) setActiveHand("minute");
    } else {
      edit((w) => ({ ...w, minute: value }));
      if (done) setActiveHand("hour");
    }
  };

  const setPm = (pm: boolean) =>
    edit((w) => ({ ...w, hour: (w.hour % 12) + (pm ? 12 : 0) }));

  const toggleZone = () => {
    // Freeze the same instant, then show it in the other zone.
    setFrozen(Math.floor(instant / 60_000) * 60_000);
    setVancouver((v) => !v);
  };

  const reset = () => {
    setFrozen(null);
    setVancouver(false);
    setActiveHand("hour");
  };

  const pm = wall.hour >= 12;

  return (
    <div
      data-testid="app"
      data-time={wallKey(wall)}
      data-zone={zone}
      data-live={live}
      data-phase={phase}
      data-active-hand={activeHand}
      className="relative min-h-dvh"
    >
      <Sky phase={phase} />

      <main className="relative mx-auto flex max-w-md items-stretch gap-1.5 px-2 pt-3 pb-32 roomy:max-w-2xl roomy:gap-4 roomy:px-3 roomy:pt-6 wide:min-h-dvh wide:max-w-5xl">
        <div className="flex min-w-0 flex-1 flex-col gap-3 roomy:gap-4 wide:flex-row wide:items-stretch">
          <Calendar
            wall={wall}
            today={todayWall}
            onMonth={(delta) => edit((w) => addMonths(w, delta))}
            onPickDay={(day) => edit((w) => ({ ...w, day }))}
          />

          <section className="card flex items-center gap-3 p-3 roomy:gap-4 roomy:p-4 wide:flex-1">
            {/* Controls on the left, nearest the left thumb. */}
            <div className="flex w-[7.25rem] shrink-0 flex-col gap-2 roomy:w-36">
              {(["hour", "minute"] as const).map((hand) => (
                <button
                  key={hand}
                  type="button"
                  data-testid={`hand-${hand}`}
                  aria-label={hand}
                  aria-pressed={activeHand === hand}
                  onClick={() => setActiveHand(hand)}
                  className={`hand-btn hand-btn-${hand} grid h-14 place-items-center rounded-2xl roomy:h-16`}
                >
                  <HandIcon hand={hand} />
                </button>
              ))}
              <div className="mt-1 flex flex-col gap-2 rounded-[1.25rem] bg-[#f6ead9] p-1" role="group" aria-label="am pm">
                <button
                  type="button"
                  data-testid="ampm-am"
                  aria-pressed={!pm}
                  onClick={() => setPm(false)}
                  className="seg seg-am flex h-14 items-center justify-center gap-1.5 rounded-2xl text-xl font-extrabold roomy:h-16 roomy:text-2xl"
                >
                  <span aria-hidden>☀️</span>AM
                </button>
                <button
                  type="button"
                  data-testid="ampm-pm"
                  aria-pressed={pm}
                  onClick={() => setPm(true)}
                  className="seg seg-pm flex h-14 items-center justify-center gap-1.5 rounded-2xl text-xl font-extrabold roomy:h-16 roomy:text-2xl"
                >
                  <span aria-hidden>🌙</span>PM
                </button>
              </div>
            </div>

            <div className="relative min-w-0 flex-1">
              <Clock wall={wall} live={live} activeHand={activeHand} onSetHand={setHand} />
              <div className="pointer-events-none absolute -top-1 -left-1">
                {live ? (
                  <span data-testid="live-badge" className="badge live-badge" aria-label="live">
                    ⏱️
                  </span>
                ) : (
                  <span data-testid="frozen-badge" className="badge animate-pop" aria-label="frozen">
                    📌
                  </span>
                )}
              </div>
              {vancouver && (
                <div className="pointer-events-none absolute -top-1 -right-1">
                  <span
                    data-testid="canada-badge"
                    className="badge canada-badge animate-pop"
                    aria-label="Vancouver"
                  >
                    🇨🇦
                  </span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* The day bar sits on the right, beside the calendar and the clock. */}
        <DayBar wall={wall} />
      </main>

      <nav
        data-testid="action-bar"
        className="fixed inset-x-0 bottom-0 z-20 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        {/* Reset wipes Vera's edits, so it sits furthest from the left thumb. */}
        <div className="action-bar mx-auto grid max-w-md grid-cols-2 gap-2 rounded-[1.75rem] p-2 roomy:max-w-2xl wide:max-w-5xl">
          <button
            type="button"
            data-testid="btn-canada"
            data-vancouver={vancouver}
            aria-label={vancouver ? "home" : "Vancouver"}
            aria-pressed={vancouver}
            onClick={toggleZone}
            className="action-btn action-canada h-[4.5rem] rounded-3xl text-4xl"
          >
            {vancouver ? "🏠" : "🇨🇦"}
          </button>
          <button
            type="button"
            data-testid="btn-reset"
            aria-label="reset"
            onClick={reset}
            className="action-btn action-reset h-[4.5rem] rounded-3xl text-4xl"
          >
            🔄
          </button>
        </div>
      </nav>

    </div>
  );
}
