/**
 * Draws the picture that Vera sends: a calendar page, a clock face, sun or
 * moon, and the digital time for the person who receives it.
 *
 * Plain canvas, no dependencies. Kept apart from the UI so it can be tested.
 */

import {
  MONTHS,
  PHASE_COLORS,
  WEEKDAYS,
  digitalTime,
  isDark,
  isPm,
  phaseForHour,
  weekdayOf,
  type Wall,
} from "./time";
import { HAND_COLORS } from "./colors";

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

export type CardData = {
  wall: Wall;
  /** True when the time is shown in Vancouver. */
  vancouver: boolean;
  /** CSS font-family list to use for text. */
  fontFamily: string;
};

const EMOJI_FONT = '"Apple Color Emoji", "Noto Color Emoji", "Segoe UI Emoji"';

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Deterministic star field so the same time always gives the same picture. */
function drawStars(ctx: CanvasRenderingContext2D, w: number, h: number) {
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  ctx.fillStyle = "rgba(255, 248, 225, 0.85)";
  for (let i = 0; i < 70; i++) {
    const x = rand() * w;
    const y = rand() * h * 0.9;
    const r = 1.5 + rand() * 3;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCalendarPage(
  ctx: CanvasRenderingContext2D,
  data: CardData,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const { wall, fontFamily } = data;
  const headH = 120;

  ctx.save();
  ctx.shadowColor = "rgba(40, 20, 10, 0.25)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 12;
  roundRect(ctx, x, y, w, h, 40);
  ctx.fillStyle = "#fffaf0";
  ctx.fill();
  ctx.restore();

  // Red top band with the month word, like a tear-off calendar.
  ctx.save();
  roundRect(ctx, x, y, w, h, 40);
  ctx.clip();
  ctx.fillStyle = "#e0524a";
  ctx.fillRect(x, y, w, headH);
  ctx.restore();

  // Two rings, as if the page hangs from a binder.
  ctx.fillStyle = "#6b4a3a";
  for (const rx of [x + w * 0.28, x + w * 0.72]) {
    ctx.beginPath();
    ctx.arc(rx, y + 10, 14, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 68px ${fontFamily}`;
  ctx.fillText(MONTHS[wall.month - 1], x + w / 2, y + headH / 2 + 4);

  ctx.fillStyle = "#2b2118";
  ctx.font = `900 230px ${fontFamily}`;
  ctx.fillText(String(wall.day), x + w / 2, y + headH + 150);

  ctx.fillStyle = "#6b4a3a";
  ctx.font = `800 60px ${fontFamily}`;
  ctx.fillText(
    WEEKDAYS[weekdayOf(wall.year, wall.month, wall.day)],
    x + w / 2,
    y + headH + 300,
  );
  ctx.font = `700 46px ${fontFamily}`;
  ctx.fillStyle = "#9a7b68";
  ctx.fillText(String(wall.year), x + w / 2, y + headH + 362);
}

function drawClock(
  ctx: CanvasRenderingContext2D,
  data: CardData,
  cx: number,
  cy: number,
  r: number,
) {
  const { wall, fontFamily } = data;

  ctx.save();
  ctx.shadowColor = "rgba(40, 20, 10, 0.25)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 12;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#fffaf0";
  ctx.fill();
  ctx.restore();

  ctx.lineWidth = 10;
  ctx.strokeStyle = "#e9d8c4";
  ctx.beginPath();
  ctx.arc(cx, cy, r - 5, 0, Math.PI * 2);
  ctx.stroke();

  // Minute ticks.
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const major = i % 5 === 0;
    const r1 = r - 18;
    const r2 = r1 - (major ? 22 : 10);
    ctx.strokeStyle = major ? "#6b4a3a" : "#c9b29c";
    ctx.lineWidth = major ? 6 : 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx + Math.sin(a) * r1, cy - Math.cos(a) * r1);
    ctx.lineTo(cx + Math.sin(a) * r2, cy - Math.cos(a) * r2);
    ctx.stroke();
  }

  ctx.fillStyle = "#2b2118";
  ctx.font = `800 ${Math.round(r * 0.18)}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let n = 1; n <= 12; n++) {
    const a = (n / 12) * Math.PI * 2;
    const rn = r * 0.72;
    ctx.fillText(String(n), cx + Math.sin(a) * rn, cy - Math.cos(a) * rn + 3);
  }

  const hand = (angleDeg: number, length: number, width: number, color: string) => {
    const a = (angleDeg * Math.PI) / 180;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - Math.sin(a) * length * 0.12, cy + Math.cos(a) * length * 0.12);
    ctx.lineTo(cx + Math.sin(a) * length, cy - Math.cos(a) * length);
    ctx.stroke();
  };

  hand(((wall.hour % 12) + wall.minute / 60) * 30, r * 0.4, 24, HAND_COLORS.hour);
  hand(wall.minute * 6, r * 0.6, 13, HAND_COLORS.minute);

  ctx.fillStyle = "#2b2118";
  ctx.beginPath();
  ctx.arc(cx, cy, 16, 0, Math.PI * 2);
  ctx.fill();
}

/** Paint the whole card onto a canvas of CARD_WIDTH × CARD_HEIGHT. */
export function drawCard(canvas: HTMLCanvasElement, data: CardData) {
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d unavailable");
  const W = CARD_WIDTH;
  const H = CARD_HEIGHT;
  const { wall, fontFamily } = data;
  const phase = phaseForHour(wall.hour);
  const [c1, c2, c3] = PHASE_COLORS[phase];

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, c1);
  bg.addColorStop(0.55, c2);
  bg.addColorStop(1, c3);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  if (isDark(phase)) drawStars(ctx, W, H);

  // Left: calendar page. Right: clock. Below: sun/moon + digital time.
  drawCalendarPage(ctx, data, 60, 80, 440, 520);
  drawClock(ctx, data, 790, 340, 240);

  // Time strip.
  const stripY = 680;
  const stripH = 300;
  ctx.save();
  ctx.shadowColor = "rgba(40, 20, 10, 0.25)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 12;
  roundRect(ctx, 60, stripY, W - 120, stripH, 48);
  ctx.fillStyle = "#fffaf0";
  ctx.fill();
  ctx.restore();

  // Sun or moon and the digital time, centred together and shrunk to fit.
  const time = digitalTime(wall);
  const emojiSize = 150;
  const gap = 36;
  const maxText = W - 120 - 80 - emojiSize - gap;
  const timeSize = fitFont(ctx, time, `900 %spx ${fontFamily}`, 170, maxText);
  ctx.font = `900 ${timeSize}px ${fontFamily}`;
  const timeW = ctx.measureText(time).width;
  const startX = W / 2 - (emojiSize + gap + timeW) / 2;
  const midY = stripY + stripH / 2;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.font = `${emojiSize}px ${EMOJI_FONT}`;
  ctx.fillText(isPm(wall) ? "🌙" : "☀️", startX + emojiSize / 2, midY + 8);
  ctx.fillStyle = "#2b2118";
  ctx.font = `900 ${timeSize}px ${fontFamily}`;
  ctx.textAlign = "left";
  ctx.fillText(time, startX + emojiSize + gap, midY + 10);

  // Zone line.
  const zoneY = 1160;
  ctx.textAlign = "center";
  if (data.vancouver) {
    const word = "Vancouver";
    ctx.font = `900 92px ${fontFamily}`;
    const wordW = ctx.measureText(word).width;
    const flag = 110;
    const innerW = flag + 28 + wordW;
    const pillW = innerW + 120;
    ctx.save();
    ctx.shadowColor = "rgba(40, 20, 10, 0.25)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 8;
    roundRect(ctx, W / 2 - pillW / 2, zoneY - 85, pillW, 170, 85);
    ctx.fillStyle = "#fffaf0";
    ctx.fill();
    ctx.restore();
    const x0 = W / 2 - innerW / 2;
    ctx.font = `${flag}px ${EMOJI_FONT}`;
    ctx.fillText("🇨🇦", x0 + flag / 2, zoneY + 6);
    ctx.fillStyle = "#c0392b";
    ctx.font = `900 92px ${fontFamily}`;
    ctx.textAlign = "left";
    ctx.fillText(word, x0 + flag + 28, zoneY + 6);
  } else {
    ctx.font = `120px ${EMOJI_FONT}`;
    ctx.fillText("🏠", W / 2, zoneY);
  }
}

/** Largest font size (up to max) at which text fits in maxWidth. */
function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontTemplate: string,
  max: number,
  maxWidth: number,
): number {
  let size = max;
  while (size > 40) {
    ctx.font = fontTemplate.replace("%s", String(size));
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 4;
  }
  return size;
}

/** Synchronous PNG File from a canvas, so share() keeps the tap's activation. */
export function canvasToPngFile(canvas: HTMLCanvasElement, name: string): File {
  const dataUrl = canvas.toDataURL("image/png");
  const binary = atob(dataUrl.slice(dataUrl.indexOf(",") + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], name, { type: "image/png" });
}

export type ShareResult = "shared" | "downloaded" | "cancelled";

/** Share the file via the phone's share sheet, or download it as a fallback. */
export async function shareOrDownload(file: File): Promise<ShareResult> {
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
  };
  if (typeof nav.share === "function" && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file] });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return "cancelled";
      }
      // Any other failure: fall through and save the picture instead.
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return "downloaded";
}
