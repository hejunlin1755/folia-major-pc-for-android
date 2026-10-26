const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { privatePersistence, createExtraPlatforms } = require('../../packaging/android/backend/extraPlatforms.cjs');
const { createGateway } = require('../../packaging/android/backend/main.cjs');

// Exercise real persistence, integrity checks and the HTTP boundary without a user's login.
function fixture() {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'folia-extra-'));
    return { directory, remove() {
        assert.equal(path.resolve(path.dirname(directory)), path.resolve(os.tmpdir()));
        assert.match(path.basename(directory), /^folia-extra-/);
        fs.rmSync(directory, { recursive: true, force: true });
    } };
}
test('encrypted sessions survive restart, contain no plaintext and reject tampering', () => {
    const f = fixture();
    try {
        const first = privatePersistence(f.directory);
        const secret = 'opaque-synthetic-session-fixture';
        const sealed = first.safeStorage.encryptString(secret);
        first.store.set('session', sealed.toString('base64'));
        assert.equal(fs.readFileSync(path.join(f.directory, 'extra-platform-state.json'), 'utf8').includes(secret), false);
        const second = privatePersistence(f.directory);
        assert.equal(second.safeStorage.decryptString(Buffer.from(second.store.get('session'), 'base64')), secret);
        sealed[sealed.length - 1] ^= 1;
        assert.throws(() => second.safeStorage.decryptString(sealed));
        second.store.delete('session');
        assert.equal(privatePersistence(f.directory).store.get('session'), undefined);
    } finally { f.remove(); }
});
test('upstream bridges initialize signed-out and restrict operations and media', async () => {
    const f = fixture();
    try {
        const extra = createExtraPlatforms(f.directory);
        for (const id of ['bodian', 'qishui']) {
            assert.equal((await extra.request(id, 'login_status', {})).ok, true);
            assert.equal((await extra.request(id, 'not-an-operation', {})).error.code, 'unsupported');
        }
        assert.equal(extra.mediaAllowed('http://127.0.0.1/private'), false);
        assert.equal(extra.mediaAllowed('https://unissued.example/song'), false);
    } finally { f.remove(); }
});
test('operation bridge requires local authentication and POST', async () => {
    const f = fixture();
    const calls = [];
    const server = await createGateway({ stateDir: f.directory, token: 'opaque-fixture-token', providers: { extra: { request: async (...args) => { calls.push(args); return { ok: true, data: null }; } } } });
    const base = 'http://127.0.0.1:' + server.address().port;
    const headers = { 'X-Folia-Local-Auth': 'opaque-fixture-token', 'Content-Type': 'application/json' };
    try {
        assert.equal((await fetch(base + '/qishui/bridge', { method: 'POST' })).status, 403);
        assert.equal((await fetch(base + '/qishui/bridge', { headers })).status, 405);
        const response = await fetch(base + '/bodian/bridge', { method: 'POST', headers, body: JSON.stringify({ operation: 'login_status', params: {} }) });
        assert.equal(response.status, 200);
        assert.equal((await response.json()).ok, true);
        assert.deepEqual(calls, [['bodian', 'login_status', {}]]);
    } finally { await new Promise(resolve => server.close(resolve)); f.remove(); }
});
