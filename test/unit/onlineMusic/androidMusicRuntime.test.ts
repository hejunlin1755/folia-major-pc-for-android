import { afterEach, describe, expect, it, vi } from 'vitest';

// A real Android API request carries method, body and session header through the native bridge; Web requests stay unchanged.
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.resetModules(); });
describe('Android music request bridge', () => {
    it('keeps typed operations inside the native bridge and proxies issued audio', async () => {
        vi.stubGlobal('Capacitor', { getPlatform: () => 'android', nativePromise: vi.fn(async () => ({ ready: true })) });
        vi.stubGlobal('location', { origin: 'https://localhost' });
        const send = vi.fn(async () => new Response(JSON.stringify({ ok: true, data: { url: 'https://issued.example/song.mp3' } })));
        vi.stubGlobal('fetch', send);
        const runtime = await import('../../../src/services/androidMusicRuntime');
        const answer = await runtime.requestAndroidMusicOperation<{ ok: boolean; data: { url: string } }>('qishui', 'audio', { id: 'fixture' });
        expect(send).toHaveBeenCalledWith('/android-music/qishui/bridge', expect.objectContaining({ method: 'POST', body: JSON.stringify({ operation: 'audio', params: { id: 'fixture' } }) }));
        expect(answer.data.url).toBe('https://localhost/api/music-media?url=' + encodeURIComponent('https://issued.example/song.mp3'));
    });
    it('wraps only supported Android music CDNs while preserving Web URLs', async () => {
        const runtime = await import('../../../src/services/androidMusicRuntime');
        const source = 'http://fs.test.kugou.com/song.mp3?key=opaque';
        expect(runtime.getAndroidMusicMediaUrl(source, 'kugou.com')).toBe(source);
        vi.stubGlobal('Capacitor', { getPlatform: () => 'android', nativePromise: vi.fn() });
        vi.stubGlobal('location', { origin: 'https://localhost' });
        expect(runtime.getAndroidMusicMediaUrl(source, 'kugou.com')).toBe(`https://localhost/api/music-media?url=${encodeURIComponent(source)}`);
        for (const url of ['https://kugou.com.evil.example/a.mp3', 'http://127.0.0.1/a', 'blob:local']) {
            expect(runtime.getAndroidMusicMediaUrl(url, 'kugou.com')).toBe(url);
        }
    });
    it('uses the built-in backend for a provider POST without requiring an external API URL', async () => {
        const nativePromise = vi.fn(async (_plugin: string, method: string) => method === 'ready' ? { ready: true } : { status: 200, headers: { 'Content-Type': 'application/json' }, body: '{"code":200}' });
        const browserFetch = vi.fn();
        vi.stubGlobal('Capacitor', { getPlatform: () => 'android', nativePromise });
        vi.stubGlobal('location', { href: 'https://localhost/', origin: 'https://localhost' });
        vi.stubGlobal('document', { documentElement: { dataset: {} } });
        vi.stubGlobal('fetch', browserFetch);
        const runtime = await import('../../../src/services/androidMusicRuntime');
        runtime.installAndroidMusicRuntime();
        expect(runtime.getAndroidMusicApiBase('qq')).toBe('/android-music/qq');
        const result = await fetch('/android-music/qq/login/qr/check?key=test', { method: 'POST', headers: { 'X-QQ-Session': 'opaque', 'Content-Type': 'application/json' }, body: '{"test":true}' });
        expect(await result.json()).toEqual({ code: 200 });
        expect(nativePromise).toHaveBeenCalledWith('FoliaMusicBackend', 'request', expect.objectContaining({ path: '/qq/login/qr/check?key=test', method: 'POST', body: '{"test":true}', headers: expect.objectContaining({ 'x-qq-session': 'opaque' }) }));
        expect(browserFetch).not.toHaveBeenCalled();
    });
    it('does not start the platform login timeout while the built-in service is unpacking', async () => {
        vi.useFakeTimers();
        let ready!: () => void;
        const startup = new Promise<void>(resolve => { ready = resolve; });
        vi.stubGlobal('Capacitor', { getPlatform: () => 'android', nativePromise: () => startup });
        const send = vi.fn(async () => new Response('{"code":200,"data":{"unikey":"test-key"}}', { status: 200, headers: { 'Content-Type': 'application/json' } }));
        vi.stubGlobal('fetch', send);
        const { requestQq } = await import('../../../src/services/onlineMusic/qq/qqTransport');
        const request = requestQq<{ data: { unikey: string } }>('login_qr_key');
        await vi.advanceTimersByTimeAsync(25000);
        expect(send).not.toHaveBeenCalled();
        ready();
        expect((await request).data.unikey).toBe('test-key');
        expect(send).toHaveBeenCalledOnce();
    });
    it('does not intercept a normal browser build', async () => {
        const browserFetch = vi.fn();
        vi.stubGlobal('fetch', browserFetch);
        const runtime = await import('../../../src/services/androidMusicRuntime');
        runtime.installAndroidMusicRuntime();
        expect(runtime.getAndroidMusicApiBase('qq')).toBeNull();
        expect(globalThis.fetch).toBe(browserFetch);
    });
    it('allows a new attempt after startup failed while sharing each in-flight attempt', async () => {
        const nativePromise = vi.fn().mockRejectedValueOnce(new Error('ANDROID_MUSIC_BACKEND_UNAVAILABLE: startup-timeout')).mockResolvedValue({ ready: true });
        vi.stubGlobal('Capacitor', { getPlatform: () => 'android', nativePromise });
        const runtime = await import('../../../src/services/androidMusicRuntime');
        const first = runtime.waitForAndroidMusicRuntime();
        expect(runtime.waitForAndroidMusicRuntime()).toBe(first);
        await expect(first).rejects.toMatchObject({ code: runtime.ANDROID_MUSIC_BACKEND_UNAVAILABLE });
        await expect(runtime.waitForAndroidMusicRuntime()).resolves.toBeUndefined();
        expect(nativePromise).toHaveBeenCalledTimes(2);
    });
    it('exposes only recognized native startup reasons', async () => {
        const { getAndroidMusicStartupReason } = await import('../../../src/services/androidMusicRuntime');
        expect(getAndroidMusicStartupReason(new Error('ANDROID_MUSIC_BACKEND_UNAVAILABLE: native-library'))).toBe('native-library');
        expect(getAndroidMusicStartupReason(new Error('ANDROID_MUSIC_BACKEND_UNAVAILABLE: engine-module-not-found'))).toBe('engine-module-not-found');
        expect(getAndroidMusicStartupReason(new Error('Unexpected request text'))).toBeUndefined();
    });
});
