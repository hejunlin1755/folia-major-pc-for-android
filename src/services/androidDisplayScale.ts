import { isAndroidMusicRuntime } from './androidMusicRuntime';
import { useDisplayScaleStore } from '../stores/useDisplayScaleStore';

// Resize the actual mobile layout viewport so fixed controls, canvases and media queries share a scale.
type NativeViewport = { width: number; top: number; bottom: number; left: number; right: number };
type AndroidWindow = Window & { __foliaAndroidViewport?: NativeViewport };
let installed = false;
export function installAndroidDisplayScale(): void {
    if (installed || !isAndroidMusicRuntime()) return;
    installed = true;
    const fallbackWidth = window.innerWidth;
    const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    const apply = () => {
        const scale = useDisplayScaleStore.getState().displayScale / 100;
        document.documentElement.style.setProperty('--folia-display-scale', String(scale));
        document.documentElement.style.setProperty('--folia-display-inverse-scale', String(1 / scale));
        const metrics = (window as AndroidWindow).__foliaAndroidViewport;
        const width = metrics?.width || fallbackWidth;
        const content = 'width=' + (width / scale).toFixed(3) + ', initial-scale=' + scale + ', minimum-scale=' + scale + ', maximum-scale=' + scale + ', user-scalable=no, viewport-fit=cover';
        if (viewport && viewport.content !== content) viewport.content = content;
        if (metrics) for (const edge of ['top', 'bottom', 'left', 'right'] as const) {
            document.documentElement.style.setProperty('--folia-native-safe-' + edge, metrics[edge] / scale + 'px');
        }
    };
    useDisplayScaleStore.subscribe((state, previous) => { if (state.displayScale !== previous.displayScale) apply(); });
    window.addEventListener('folia-android-viewport', apply);
    apply();
}
