import { DAY_STOPS, dayProgress, type Wall } from "@/lib/time";

/** The moments of Vera's day, each shown by an emoji on the bar. */
const MARKS = [
  { hour: 0, emoji: "🌙", label: "12 AM" },
  { hour: 9, emoji: "☕", label: "9 AM" },
  { hour: 12, emoji: "🥪", label: "12 PM" },
  { hour: 21, emoji: "😴", label: "9 PM" },
];

const GRADIENT = `linear-gradient(180deg, ${DAY_STOPS.map(
  ([h, c]) => `${c} ${((h / 24) * 100).toFixed(2)}%`,
).join(", ")})`;

const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

/**
 * A tall bar for the whole day, midnight at the top. The part of the day that
 * has passed is bright; the rest is faded. A glowing sun or moon shows now.
 */
export default function DayBar({ wall }: { wall: Wall }) {
  const progress = dayProgress(wall);
  const daytime = wall.hour >= 6 && wall.hour < 20;

  return (
    <aside
      data-testid="day-bar"
      data-progress={progress.toFixed(3)}
      aria-hidden
      className="card day-bar relative w-12 shrink-0 roomy:w-20"
    >
      {/* The track sits between the top and bottom chips' centres. */}
      <div className="absolute inset-x-0 top-6 bottom-6 roomy:top-8 roomy:bottom-8">
        <div
          className="day-track absolute inset-y-0 left-1/2 w-3.5 -translate-x-1/2 rounded-full roomy:w-5"
          style={{ background: GRADIENT }}
        >
          <div
            className="day-rest absolute inset-x-0 bottom-0 rounded-b-full"
            style={{ top: pct(progress) }}
          />
        </div>

        {MARKS.map((m) => (
          <div
            key={m.hour}
            data-testid={`day-mark-${m.hour}`}
            className="absolute left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={{ top: pct(m.hour / 24) }}
          >
            <span className="day-chip grid size-9 place-items-center rounded-full text-xl roomy:size-12 roomy:text-[1.7rem]">
              {m.emoji}
            </span>
            <span className="day-label mt-0.5 rounded-full px-1 text-[0.6rem] leading-tight font-extrabold whitespace-nowrap roomy:text-xs">
              {m.label}
            </span>
          </div>
        ))}

        <div
          data-testid="day-bar-now"
          className="day-now absolute left-1/2 z-10 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-2xl roomy:size-14 roomy:text-3xl"
          style={{ top: pct(progress) }}
        >
          {daytime ? "☀️" : "🌙"}
        </div>
      </div>
    </aside>
  );
}
