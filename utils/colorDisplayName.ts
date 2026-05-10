/** Map stored cart / variant colours (often hex) to a short readable label. */

function parseHexToRgb(raw: string): [number, number, number] | null {
  let h = raw.trim();
  if (h.startsWith("#")) h = h.slice(1);
  if (h.length === 3) {
    h = h
      .split("")
      .map((ch) => ch + ch)
      .join("");
  }
  if (h.length === 8) h = h.slice(0, 6);
  if (h.length !== 6 || !/^[0-9a-f]+$/i.test(h)) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return [r, g, b];
}

function parseRgbToRgb(s: string): [number, number, number] | null {
  const m = s.trim().match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/** Resolved background color for UI swatches (React Native `backgroundColor`). */
export function colorValueForSwatch(input: string): string {
  if (!input || typeof input !== "string") return "#e5e7eb";
  const trimmed = input.trim();
  if (!trimmed) return "#e5e7eb";

  const fromHex = parseHexToRgb(trimmed);
  if (fromHex) return `rgb(${fromHex[0]},${fromHex[1]},${fromHex[2]})`;

  const fromRgb = parseRgbToRgb(trimmed);
  if (fromRgb) return `rgb(${fromRgb[0]},${fromRgb[1]},${fromRgb[2]})`;

  return "#e5e7eb";
}
