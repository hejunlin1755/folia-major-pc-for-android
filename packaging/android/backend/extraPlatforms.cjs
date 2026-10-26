const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const https = require('node:https');

// Reuse the upstream protocol bridges; encrypt sessions with an app-private key, without pretending to expose Electron.
function privatePersistence(stateDir) {
    fs.mkdirSync(stateDir, { recursive: true });
    const keyFile = path.join(stateDir, 'extra-platform-key');
    if (!fs.existsSync(keyFile)) fs.writeFileSync(keyFile, crypto.randomBytes(32), { mode: 0o600, flag: 'wx' });
    const key = fs.readFileSync(keyFile);
    if (key.length !== 32) throw new Error('Platform key is unavailable');
    const file = path.join(stateDir, 'extra-platform-state.json');
    const data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
    const save = () => {
        fs.writeFileSync(file + '.tmp', JSON.stringify(data), { mode: 0o600 });
        fs.renameSync(file + '.tmp', file);
    };
    return {
        store: { get: name => data[name], set: (name, value) => { data[name] = value; save(); }, delete: name => { delete data[name]; save(); } },
        safeStorage: {
            isEncryptionAvailable: () => true,
            getSelectedStorageBackend: () => 'android-private-file',
            encryptString: value => {
                const iv = crypto.randomBytes(12);
                const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
                const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
                return Buffer.concat([Buffer.from([1]), iv, cipher.getAuthTag(), encrypted]);
            },
            decryptString: value => {
                if (value.length < 29 || value[0] !== 1) throw new Error('Platform session is unreadable');
                const decipher = crypto.createDecipheriv('aes-256-gcm', key, value.subarray(1, 13));
                decipher.setAuthTag(value.subarray(13, 29));
                return Buffer.concat([decipher.update(value.subarray(29)), decipher.final()]).toString('utf8');
            },
        },
    };
}
function createExtraPlatforms(stateDir) {
    const source = fs.existsSync(path.join(__dirname, 'desktop')) ? path.join(__dirname, 'desktop') : path.resolve(__dirname, '../../../electron');
    const bridges = new Map();
    const networkCodes = new Map();
    const record = (id, error) => {
        const code = error?.cause?.code || error?.code || error?.name;
        if (typeof code === 'string' && /^[A-Z][A-Z0-9_]{0,63}$/.test(code)) networkCodes.set(id, code);
    };
    const policies = ['qishui', 'bodian'].map(id => {
        const exported = require(path.join(source, id, 'mediaCors.cjs'));
        return (exported.createQishuiMediaPolicy || exported.createBodianMediaPolicy)();
    });
    let persistence;
    return {
        mediaAllowed: url => policies.some(policy => policy.allows({ url, method: 'GET', resourceType: 'media' })),
        followMediaRedirect: (url, redirectURL) => policies.forEach(policy => policy.followRedirect({ url, redirectURL, method: 'GET', resourceType: 'media' })),
        async request(id, operation, params) {
            if (!['qishui', 'bodian'].includes(id)) throw new Error('Unknown music platform');
            if (!bridges.has(id)) {
                persistence ||= privatePersistence(stateDir);
                const exported = require(path.join(source, id, id + 'ApiBridge.cjs'));
                const create = exported.createQishuiApiBridge || exported.createBodianApiBridge;
                const index = id === 'qishui' ? 0 : 1;
                const send = async (...args) => { try { return await fetch(...args); } catch (error) { record(id, error); throw error; } };
                const requestFactory = ({ url, method }, callback) => {
                    const request = https.request(url, { method, family: 4 }, callback);
                    request.on('error', error => record(id, error));
                    const end = request.end;
                    request.end = function(body) {
                        if (body) this.setHeader('Content-Length', String(Buffer.byteLength(body)));
                        return end.call(this, body);
                    };
                    return request;
                };
                bridges.set(id, create({ ...persistence, fetch: send, ...(id === 'bodian' ? { requestFactory } : {}), log: () => {}, warn: () => {}, onAudioSource: url => policies[index].register(url) }));
            }
            networkCodes.delete(id);
            const result = await bridges.get(id).request(operation, params);
            if (!result.ok && networkCodes.has(id)) result.error.networkCode = networkCodes.get(id);
            return result;
        },
    };
}
module.exports = { createExtraPlatforms, privatePersistence };
