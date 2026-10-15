import { PHASE_COLORS, isDark, type Phase } from "@/lib/time";

const PHASES = Object.keys(PHASE_COLORS) as Phase[];

/**
 * The full-screen time-of-day background. Every phase is its own layer, and
 * only the current one is opaque, so a change of phase cross-fades smoothly.
 */
export default function Sky({ phase }: { phase: Phase }) {
  return (
    <div className="fixed inset-0 -z-0" aria-hidden>
      {PHASES.map((p) => {
        const [a, b, c] = PHASE_COLORS[p];
        return (
          <div
            key={p}
            className="sky-layer absolute inset-0"
            style={{
              background: `linear-gradient(180deg, ${a} 0%, ${b} 55%, ${c} 100%)`,
              opacity: p === phase ? 1 : 0,
            }}
          />
        );
      })}
      <div
        className="stars absolute inset-0"
        style={{ opacity: isDark(phase) ? 1 : 0 }}
      />
    </div>
  );
}
