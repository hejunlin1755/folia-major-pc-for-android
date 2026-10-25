import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { isAndroidMusicRuntime } from '../../../services/androidMusicRuntime';
import { useDisplayScaleStore } from '../../../stores/useDisplayScaleStore';
import { DisplayScaleControl } from './DisplayScaleControl';
import { useThemeSettingsStore } from '../../../stores/useThemeSettingsStore';
import { settingsTokens } from '../../modal/settings/kit/kitTheme';
import './androidDisplaySetup.css';

// The first Android entry offers sizing before the user continues to the normal app and tutorial.
export default function AndroidDisplaySetup() {
    const { t } = useTranslation();
    const daylight = useThemeSettingsStore(state => state.isDaylight);
    const complete = useDisplayScaleStore(state => state.setupComplete);
    const finish = useDisplayScaleStore(state => state.completeSetup);
    const dialog = useRef<HTMLDialogElement>(null);
    const visible = isAndroidMusicRuntime() && !complete;
    useEffect(() => {
        if (!visible || !dialog.current) return;
        const element = dialog.current;
        element.showModal();
        return () => element.close();
    }, [visible]);
    if (!visible) return null;
    return <dialog ref={dialog} data-display-scale-setup aria-labelledby="display-scale-heading" onCancel={event => event.preventDefault()}
        className="st-window android-display-setup rounded-2xl border border-white/10 bg-[var(--st-win)] p-0 text-[color:var(--st-t1)] shadow-2xl"
        style={{ ...settingsTokens(daylight), '--text-primary': daylight ? '#18181b' : '#f4f4f5' } as React.CSSProperties}>
        <header className="px-5 pt-6 pb-1">
            <p className="mb-3 text-[10px] font-medium tracking-[0.28em] text-[color:var(--st-t3)]">FOLIA</p>
            <h1 id="display-scale-heading" className="text-xl font-medium tracking-tight">{t('displayScale.welcome')}</h1>
            <p className="mt-2 text-xs leading-relaxed text-[color:var(--st-t2)]">{t('displayScale.intro')}</p>
        </header>
        <DisplayScaleControl onContinue={finish} />
    </dialog>;
}
