import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Monitor, Play } from 'lucide-react';
import { isAndroidMusicRuntime } from '../../../services/androidMusicRuntime';
import { useDisplayScaleStore } from '../../../stores/useDisplayScaleStore';
import { DisplayScaleControl } from './DisplayScaleControl';
import { settingsTokens } from '../../modal/settings/kit/kitTheme';
import './androidDisplaySetup.css';

// The first Android entry offers sizing before the user continues to the normal app and tutorial.
export default function AndroidDisplaySetup() {
    const { t } = useTranslation();
    const scale = useDisplayScaleStore(state => state.displayScale);
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
        className="st-window android-display-setup rounded-3xl border border-white/10 bg-zinc-900 p-0 text-white shadow-2xl"
        style={{ ...settingsTokens(false), '--text-primary': '#f4f4f5' } as React.CSSProperties}>
        <div className="p-5 pb-2">
            <Monitor className="mb-3 h-7 w-7 text-sky-300" aria-hidden />
            <h1 id="display-scale-heading" className="text-xl font-semibold">{t('displayScale.welcome')}</h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{t('displayScale.intro')}</p>
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/5 p-4" aria-hidden="true" style={{ zoom: scale / 100 }}>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-400 font-bold">F</div>
                <div className="min-w-0 flex-1"><p className="truncate font-medium">Folia</p><p className="text-xs text-zinc-400">{t('displayScale.sample')}</p></div>
                <Play className="h-5 w-5 shrink-0" />
            </div>
        </div>
        <DisplayScaleControl onContinue={finish} />
    </dialog>;
}
