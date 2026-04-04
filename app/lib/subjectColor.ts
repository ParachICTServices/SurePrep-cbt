import type { CSSProperties } from "react";

export const DEFAULT_SUBJECT_HEX = "#3b82f6";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeSubjectHex(value: string): string {
  const v = value?.trim();
  if (v && /^#[0-9A-Fa-f]{6}$/i.test(v)) return v.toLowerCase();
  if (v && /^#[0-9A-Fa-f]{3}$/i.test(v)) {
    const h = v.slice(1);
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
  }
  return DEFAULT_SUBJECT_HEX;
}

export type TopicRow = { id: string; name: string; cost: string };

export function topicsToApiPayload(
  rows: TopicRow[]
): Array<{ name: string; cost: number; id?: string }> {
  return rows
    .filter((t) => t.name.trim())
    .map((t) => {
      const out: { name: string; cost: number; id?: string } = {
        name: t.name.trim(),
        cost: Math.max(0, Math.floor(Number(t.cost)) || 0),
      };
      const id = t.id.trim();
      if (id && UUID_RE.test(id)) out.id = id;
      return out;
    });
}

/** Swatch for subject cards: hex → inline background, else Tailwind classes. */
export function subjectSwatchProps(color: string | undefined): {
  className: string;
  style?: CSSProperties;
} {
  const c = color?.trim() || "";
  if (c.startsWith("#") && /^#[0-9A-Fa-f]{3,8}$/i.test(c)) {
    return {
      className: "p-3 rounded-xl text-white flex items-center justify-center shrink-0",
      style: { backgroundColor: c },
    };
  }
  if (c) {
    return { className: `p-3 rounded-xl shrink-0 ${c}` };
  }
  return { className: "p-3 rounded-xl shrink-0 bg-slate-100 text-slate-600" };
}

/** Bar chart / progress: resolve to a CSS color string. */
export function subjectColorToCss(colorString: string): string {
  const t = colorString?.trim() || "";
  if (/^#[0-9A-Fa-f]{3,8}$/i.test(t)) return t;
  const colorMap: Record<string, string> = {
    "bg-blue-100": "#DBEAFE",
    "bg-blue-600": "#2563EB",
    "bg-emerald-100": "#D1FAE5",
    "bg-emerald-600": "#059669",
    "bg-orange-100": "#FFEDD5",
    "bg-orange-600": "#EA580C",
    "bg-purple-100": "#F3E8FF",
    "bg-purple-600": "#9333EA",
    "bg-red-100": "#FEE2E2",
    "bg-red-600": "#DC2626",
    "bg-indigo-100": "#E0E7FF",
    "bg-indigo-600": "#4F46E5",
    "bg-teal-100": "#CCFBF1",
    "bg-teal-600": "#0D9488",
    "bg-pink-100": "#FCE7F3",
    "bg-pink-600": "#DB2777",
    "bg-yellow-100": "#FEF9C3",
    "bg-yellow-600": "#CA8A04",
    "bg-slate-100": "#F1F5F9",
    "bg-slate-500": "#64748B",
    "bg-slate-600": "#475569",
  };
  const bgClass = t.split(" ").find((c) => c.startsWith("bg-"));
  return bgClass ? (colorMap[bgClass] || "#64748B") : "#64748B";
}
