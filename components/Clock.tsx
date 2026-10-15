"use client";

import { useRef } from "react";
import { HAND_COLORS } from "@/lib/colors";
import type { Wall } from "@/lib/time";

export type Hand = "hour" | "minute";

type Props = {
  wall: Wall;
  live: boolean;
  activeHand: Hand;
  /** Move a hand. `done` is true when the finger lifts. */
  onSetHand: (hand: Hand, value: number, done: boolean) => void;
};

const SIZE = 200;
const C = SIZE / 2;

/** Angle in degrees, clockwise from 12, of a pointer on the face. */
function angleOf(svg: SVGSVGElement, clientX: number, clientY: number) {
  const box = svg.getBoundingClientRect();
  const dx = clientX - (box.left + box.width / 2);
  const dy = clientY - (box.top + box.height / 2);
  const deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
  return (deg + 360) % 360;
}

/** Hour 0–11 for hour hand, or minute snapped to 5 for minute hand. */
function snap(hand: Hand, deg: number): number {
  if (hand === "hour") return Math.round(deg / 30) % 12;
  return (Math.round(deg / 30) * 5) % 60;
}

function Hand({
  angle,
  length,
  width,
  color,
  testId,
  active,
}: {
  angle: number;
  length: number;
  width: number;
  color: string;
  testId?: string;
  active?: boolean;
}) {
  return (
    <g
      transform={`rotate(${angle} ${C} ${C})`}
      data-testid={testId}
      data-angle={Math.round(angle * 10) / 10}
      className="hand"
    >
      {active && (
        <line
          x1={C}
          y1={C}
          x2={C}
          y2={C - length}
          stroke={color}
          strokeOpacity={0.25}
          strokeWidth={width + 8}
          strokeLinecap="round"
        />
      )}
      <line
        x1={C}
        y1={C + length * 0.14}
        x2={C}
        y2={C - length}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
      />
    </g>
  );
}

export default function Clock({ wall, live, activeHand, onSetHand }: Props) {
  const dragging = useRef<Hand | null>(null);
  const last = useRef<number | null>(null);

  const hourAngle = ((wall.hour % 12) + wall.minute / 60) * 30;
  const minuteAngle = wall.minute * 6 + (live ? wall.second / 10 : 0);
  const secondAngle = wall.second * 6;

  const move = (e: React.PointerEvent<SVGSVGElement>, done: boolean) => {
    const hand = dragging.current;
    if (!hand) return;
    const value = snap(hand, angleOf(e.currentTarget, e.clientX, e.clientY));
    if (value !== last.current || done) {
      last.current = value;
      onSetHand(hand, value, done);
    }
    if (done) dragging.current = null;
  };

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      data-testid="clock-face"
      role="img"
      aria-label="clock"
      className="clock-face block aspect-square w-full touch-none select-none"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture?.(e.pointerId);
        dragging.current = activeHand;
        last.current = null;
        move(e, false);
      }}
      onPointerMove={(e) => move(e, false)}
      onPointerUp={(e) => move(e, true)}
      onPointerCancel={() => {
        dragging.current = null;
      }}
    >
      <circle cx={C} cy={C} r={97} fill="#fffaf0" />
      <circle cx={C} cy={C} r={94} fill="none" stroke="#ecdcc8" strokeWidth={5} />
      {Array.from({ length: 60 }, (_, i) => {
        const major = i % 5 === 0;
        return (
          <line
            key={i}
            x1={C}
            y1={C - 90}
            x2={C}
            y2={C - (major ? 81 : 85)}
            stroke={major ? "#6b4a3a" : "#cdb7a1"}
            strokeWidth={major ? 3 : 1.5}
            strokeLinecap="round"
            transform={`rotate(${i * 6} ${C} ${C})`}
          />
        );
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const n = i + 1;
        const a = (n / 12) * Math.PI * 2;
        const highlight = activeHand === "hour" && wall.hour % 12 === n % 12;
        return (
          <text
            key={n}
            x={C + Math.sin(a) * 70}
            y={C - Math.cos(a) * 70}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={19}
            fontWeight={800}
            fill={highlight ? HAND_COLORS.hour : "#2b2118"}
          >
            {n}
          </text>
        );
      })}

      <Hand
        angle={hourAngle}
        length={37}
        width={11}
        color={HAND_COLORS.hour}
        testId="hour-hand"
        active={activeHand === "hour"}
      />
      <Hand
        angle={minuteAngle}
        length={57}
        width={6}
        color={HAND_COLORS.minute}
        testId="minute-hand"
        active={activeHand === "minute"}
      />
      {live && (
        <g className="seconds-pulse">
          <Hand
            angle={secondAngle}
            length={80}
            width={2}
            color={HAND_COLORS.second}
            testId="second-hand"
          />
        </g>
      )}
      <circle cx={C} cy={C} r={7} fill="#2b2118" />
      <circle cx={C} cy={C} r={2.5} fill="#fffaf0" />
    </svg>
  );
}
