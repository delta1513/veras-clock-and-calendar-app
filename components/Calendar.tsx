"use client";

import { MONTHS, dateKey, daysInMonth, weekdayOf, type Wall } from "@/lib/time";
import { ArrowIcon } from "./icons";

type Props = {
  wall: Wall;
  /** Today's date in the display zone; it gets a ring. */
  today: { year: number; month: number; day: number };
  onMonth: (delta: number) => void;
  onPickDay: (day: number) => void;
};

const LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

export default function Calendar({ wall, today, onMonth, onPickDay }: Props) {
  const { year, month } = wall;
  const lead = weekdayOf(year, month, 1);
  const count = daysInMonth(year, month);
  const cells: (number | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: count }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);

  return (
    <section data-testid="calendar" className="card p-3 roomy:p-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          data-testid="month-prev"
          aria-label="previous month"
          onClick={() => onMonth(-1)}
          className="soft-btn grid size-14 shrink-0 place-items-center rounded-2xl"
        >
          <ArrowIcon direction="left" />
        </button>
        <div
          data-testid="month-label"
          className="flex-1 text-center text-2xl leading-tight font-extrabold"
        >
          {MONTHS[month - 1]}{" "}
          <span className="font-bold text-[var(--ink-soft)]">{year}</span>
        </div>
        <button
          type="button"
          data-testid="month-next"
          aria-label="next month"
          onClick={() => onMonth(1)}
          className="soft-btn grid size-14 shrink-0 place-items-center rounded-2xl"
        >
          <ArrowIcon direction="right" />
        </button>
      </div>

      <div
        className="mt-1 grid grid-cols-7 text-center text-sm font-bold text-[var(--ink-soft)]"
        aria-hidden
      >
        {LETTERS.map((l, i) => (
          <div key={i} className={i === 0 ? "text-[var(--accent-deep)]" : ""}>
            {l}
          </div>
        ))}
      </div>

      <div className="mt-0.5 grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />;
          const selected = day === wall.day;
          const isToday =
            today.year === year && today.month === month && today.day === day;
          return (
            <button
              key={day}
              type="button"
              data-testid={`day-${dateKey(year, month, day)}`}
              data-selected={selected}
              data-today={isToday}
              aria-pressed={selected}
              onClick={() => onPickDay(day)}
              className={[
                "day-cell grid h-12 place-items-center rounded-full text-xl font-extrabold roomy:h-14",
                selected ? "day-selected" : "",
                isToday ? "day-today" : "",
              ].join(" ")}
            >
              {day}
            </button>
          );
        })}
      </div>
    </section>
  );
}
