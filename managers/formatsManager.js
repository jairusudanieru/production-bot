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
    } catch (error) {
        console.error('Something went wrong initializing formats.json!', error);
        cache = {};
    }
}

async function save() {
    try {
        await fs.writeFile(FILE_PATH, JSON.stringify(cache, null, 4), 'utf8');
        return true;
    } catch (error) {
        console.error('Something went wrong saving formats.json!', error);
        return false;
    }
}

module.exports = {
    async get(id) {
        try {
            await init();
            return id ? cache[id] ?? null : cache;
        } catch (error) {
            console.error('Something went wrong getting data from formats.json!', error);
            return null;
        }
    },

    async set(id, value) {
        try {
            await init();
            cache[id] = value;
            return await save();
        } catch (error) {
            console.error('Something went wrong setting data to formats.json', error);
            return false;
        }
    },

    async delete(id) {
        try {
            await init();
            delete cache[id];
            return await save();
        } catch (error) {
            console.error('Something went wrong deleting data from formats.json!', error);
            return false;
        }
    }
};