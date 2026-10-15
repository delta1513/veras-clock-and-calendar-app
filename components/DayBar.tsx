import { DAY_STOPS, dayProgress, type Wall } from "@/lib/time";

/** The moments of Vera's day. Midnight has only its time. */
const MARKS = [
  { hour: 0, emoji: null, label: "12 AM" },
  { hour: 9, emoji: "☕", label: "9 AM" },
  { hour: 12, emoji: "🥪", label: "12 PM" },
  { hour: 21, emoji: "😴", label: "9 PM" },
];

/** One notch for each hour between the two midnights. */
const HOURS = Array.from({ length: 23 }, (_, i) => i + 1);

const GRADIENT = `linear-gradient(180deg, ${DAY_STOPS.map(
  ([h, c]) => `${c} ${((h / 24) * 100).toFixed(2)}%`,
).join(", ")})`;

const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

/**
 * A wide bar for the whole day, midnight at the top. The part of the day that
 * has passed is bright; the rest is faded. A yellow line shows now. It passes
 * behind the emoji marks, so it never hides them.
 */
export default function DayBar({ wall }: { wall: Wall }) {
  const progress = dayProgress(wall);

  return (
    <aside
      data-testid="day-bar"
      data-progress={progress.toFixed(3)}
      aria-hidden
      className="card day-bar relative w-12 shrink-0 roomy:w-28"
    >
      <div className="absolute inset-x-1 top-7 bottom-5 roomy:inset-x-2.5 roomy:top-9 roomy:bottom-7">
        <div
          className="day-track absolute inset-0 overflow-hidden rounded-2xl roomy:rounded-3xl"
          style={{ background: GRADIENT }}
        >
          <div className="day-rest absolute inset-x-0 bottom-0" style={{ top: pct(progress) }} />
          {HOURS.map((h) => (
            <div
              key={h}
              data-testid="day-notch"
              className={`day-notch absolute inset-x-0 flex -translate-y-1/2 justify-between ${h % 3 === 0 ? "day-notch-major" : ""}`}
              style={{ top: pct(h / 24) }}
            >
              <span />
              <span />
            </div>
          ))}
        </div>

        <div
          data-testid="day-bar-now"
          className="day-now absolute -inset-x-1 z-[5] h-1.5 -translate-y-1/2 rounded-full roomy:-inset-x-2 roomy:h-2.5"
          style={{ top: pct(progress) }}
        />

        {MARKS.map((m) => (
          <div
            key={m.hour}
            data-testid={`day-mark-${m.hour}`}
            className={`absolute left-1/2 z-10 flex -translate-x-1/2 flex-col items-center ${m.emoji ? "-translate-y-1/2" : "-translate-y-full pb-1"}`}
            style={{ top: pct(m.hour / 24) }}
          >
            {m.emoji && (
              <span className="day-chip grid size-9 place-items-center rounded-full text-xl roomy:size-14 roomy:text-3xl">
                {m.emoji}
              </span>
            )}
            <span className="day-label relative -mt-1.5 rounded-full px-1 text-[0.6rem] leading-tight font-extrabold whitespace-nowrap roomy:px-2 roomy:text-sm">
              {m.label}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}
