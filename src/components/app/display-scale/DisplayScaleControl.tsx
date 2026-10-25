import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Row, Slider, type SettingsOptionDef } from '../../modal/settings/kit';
import { useDisplayScaleStore } from '../../../stores/useDisplayScaleStore';
import { DISPLAY_SCALE_MIN, DISPLAY_SCALE_MAX } from '../../../utils/displayScale';

// Stage slider changes until Apply, keeping the moving thumb stable while the page changes size.
export const DisplayScaleControl: React.FC<{ option?: SettingsOptionDef; onContinue?: () => void }> = ({ option, onContinue }) => {
    const { t } = useTranslation();
    const scale = useDisplayScaleStore(state => state.displayScale);
    const setScale = useDisplayScaleStore(state => state.setDisplayScale);
    const [draft, setDraft] = useState(scale);
    useEffect(() => setDraft(scale), [scale]);
    return <div data-display-scale-control>
        <Row option={option} label={t('displayScale.title')} hint={t('displayScale.hint')}>
            <Slider value={draft} min={DISPLAY_SCALE_MIN} max={DISPLAY_SCALE_MAX} step={5} onChange={setDraft} format={value => value + '%'} stacked />
        </Row>
        <div className="flex flex-wrap justify-center gap-2 px-4 pb-3">
            {[85, 100, 115].map(value => <Button key={value} onClick={() => setDraft(value)}>{value}%</Button>)}
        </div>
        <div className="flex flex-wrap justify-end gap-2 px-4 pb-4">
            <Button onClick={() => { setDraft(100); setScale(100); }}>{t('displayScale.reset')}</Button>
            <Button variant="primary" disabled={draft === scale} onClick={() => setScale(draft)}>{t('displayScale.apply')}</Button>
        </div>
        <p className="px-4 pb-4 text-xs leading-relaxed text-[color:var(--st-t2)]" aria-live="polite">{t('displayScale.current', { value: scale })}</p>
        {onContinue && <div className="px-5 pb-5"><button type="button" data-display-scale-continue onClick={() => { setScale(draft); onContinue(); }} className="min-h-11 w-full rounded-xl bg-sky-300 px-4 py-3 font-semibold text-zinc-950">{t('displayScale.continue')}</button></div>}
    </div>;
};
