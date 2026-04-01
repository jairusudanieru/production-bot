const fs = require('fs').promises;
const path = require('path');

const FILE_PATH = path.join(process.cwd(), 'configFiles/formats.json');

let cache = {};
let initialized = false;

async function init() {
    if (initialized) return;

    try {
        const raw = await fs.readFile(FILE_PATH, 'utf8').catch(() => null);
        cache = raw ? JSON.parse(raw) : {};
        initialized = true;
    } catch (err) {
        console.error('[FormatsManager] Init failed:', err);
        cache = {};
    }
}

async function save() {
    try {
        await fs.writeFile(FILE_PATH, JSON.stringify(cache, null, 4), 'utf8');
        return true;
    } catch (err) {
        console.error('[FormatsManager] Save failed:', err);
        return false;
    }
}

module.exports = {
    async get(id) {
        try {
            await init();
            return id ? cache[id] ?? null : cache;
        } catch (err) {
            console.error('[FormatsManager] Get failed:', err);
            return null;
        }
    },

    async set(id, value) {
        try {
            await init();
            cache[id] = value;
            return await save();
        } catch (err) {
            console.error('[FormatsManager] Set failed:', err);
            return false;
        }
    },

    async delete(id) {
        try {
            await init();
            delete cache[id];
            return await save();
        } catch (err) {
            console.error('[FormatsManager] Delete failed:', err);
            return false;
        }
    }
};