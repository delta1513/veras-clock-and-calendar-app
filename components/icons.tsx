import { HAND_COLORS } from "@/lib/colors";

export function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" className="size-8" aria-hidden>
      <path
        d={direction === "left" ? "M15 4 7 12l8 8" : "M9 4l8 8-8 8"}
        fill="none"
        stroke="currentColor"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** A little clock face showing only one hand: short and thick, or long. */
export function HandIcon({ hand }: { hand: "hour" | "minute" }) {
  const hour = hand === "hour";
  return (
    <svg viewBox="0 0 48 48" className="size-11" aria-hidden>
      <circle cx="24" cy="24" r="21" fill="#fffaf0" stroke="#d9c3aa" strokeWidth="3" />
      {[0, 90, 180, 270].map((a) => (
        <line
          key={a}
          x1="24"
          y1="6"
          x2="24"
          y2="9"
          stroke="#b39a83"
          strokeWidth="2.5"
          strokeLinecap="round"
          transform={`rotate(${a} 24 24)`}
        />
      ))}
      <line
        x1="24"
        y1="24"
        x2={hour ? 34 : 24}
        y2={hour ? 17 : 7}
        stroke={hour ? HAND_COLORS.hour : HAND_COLORS.minute}
        strokeWidth={hour ? 7 : 4}
        strokeLinecap="round"
      />
      <circle cx="24" cy="24" r="3.5" fill="#2b2118" />
    </svg>
  );
}
