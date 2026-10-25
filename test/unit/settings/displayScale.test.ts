import { describe, expect, it } from 'vitest';
import { normalizeDisplayScale } from '../../../src/utils/displayScale';
import { compressConfig, decompressConfig } from '../../../src/utils/appearanceCodec';
import { buildImportPlan } from '../../../src/utils/appearanceImportPlan';

// Invalid or shared preferences must never strand controls off-screen or cause endless import changes.
describe('interface scale preferences', () => {
    it('previews the normalized imported value and settles after it is applied', () => {
        const switches = { isCustomThemePreferred: false, songThemeAutoSwitchEnabled: false, songThemeAutoGenerateEnabled: false };
        const pending = buildImportPlan({ incoming: { displayScale: 999 }, current: { displayScale: 100 }, switches, isCustomThemeActive: true });
        expect(pending.changes).toContainEqual({ key: 'displayScale', group: 'fonts', from: 100, to: 150 });
        const settled = buildImportPlan({ incoming: { displayScale: 999 }, current: { displayScale: 150 }, switches, isCustomThemeActive: true });
        expect(settled.changes).toEqual([]);
    });
    it('bounds malformed, extreme and fractional stored/imported values', () => {
        for (const invalid of [null, undefined, '', 'garbage', NaN, Infinity, {}, true]) expect(normalizeDisplayScale(invalid)).toBe(100);
        expect(normalizeDisplayScale(0)).toBe(35);
        expect(normalizeDisplayScale(999)).toBe(150);
        expect(normalizeDisplayScale('87')).toBe(85);
    });
    it('carries the scale through JSON and share codes without completing first-run setup', () => {
        expect(decompressConfig(compressConfig({ displayScale: 85 }))).toEqual({ displayScale: 85 });
        expect(decompressConfig(JSON.stringify({ displayScale: 115 }))).toEqual({ displayScale: 115 });
    });
});
