// Shared bounds keep stored, imported and displayed interface sizes consistent.
export const DISPLAY_SCALE_MIN = 35;
export const DISPLAY_SCALE_MAX = 150;
export function normalizeDisplayScale(value: unknown): number {
    const number = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
    return Number.isFinite(number) ? Math.max(DISPLAY_SCALE_MIN, Math.min(DISPLAY_SCALE_MAX, Math.round(number / 5) * 5)) : 100;
}
