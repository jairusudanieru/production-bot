const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '../database/projects.db');

const db = new Database(dbPath);

// =======================
// 🏗️ INIT
// =======================

db.pragma('journal_mode = WAL');

db.prepare(`
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    task TEXT,
    messageUrl TEXT,
    reminderUrl TEXT,
    submission TEXT,
    messageId TEXT,
    createdAt INTEGER,
    updatedAt INTEGER
)
`).run();

db.prepare(`CREATE INDEX IF NOT EXISTS idx_messageId ON projects(messageId)`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_createdAt ON projects(createdAt)`).run();

// =======================
// 🛠️ HELPERS
// =======================

const parse = (v) => {
    try { return v ? JSON.parse(v) : null; }
    catch { return null; }
};

const stringify = (v) => {
    try { return v ? JSON.stringify(v) : null; }
    catch { return null; }
};

// =======================
// 📦 DATABASE MANAGER
// =======================

module.exports = {

    // 🟢 CREATE
    create(id, task) {
        try {
            const now = Date.now();

            db.prepare(`
                INSERT INTO projects (id, task, createdAt, updatedAt)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(id) DO NOTHING
            `).run(id, stringify(task), now, now);

            return true;
        } catch (error) {
            console.error('Error creating project:', error);
            return false;
        }
    },

    // 🔵 GET
    get(idOrMessageId) {
        try {
            const row = db.prepare(`
                SELECT * FROM projects
                WHERE id = ? OR messageId = ?
                LIMIT 1
            `).get(idOrMessageId, idOrMessageId);

            if (!row) return null;

            return {
                id: row.id,
                task: parse(row.task),
                messageUrl: row.messageUrl,
                reminderUrl: row.reminderUrl,
                submission: parse(row.submission),
                messageId: row.messageId,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt
            };

        } catch (error) {
            console.error('Error getting project:', error);
            return null;
        }
    },

    // 🟡 SET
    set(id, data) {
        try {
            const now = Date.now();
    
            db.prepare(`
                INSERT INTO projects (id, task, messageUrl, reminderUrl, submission, messageId, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    task = COALESCE(excluded.task, task),
                    messageUrl = COALESCE(excluded.messageUrl, messageUrl),
                    reminderUrl = COALESCE(excluded.reminderUrl, reminderUrl),
                    submission = COALESCE(excluded.submission, submission),
                    messageId = COALESCE(excluded.messageId, messageId),
                    updatedAt = excluded.updatedAt
            `).run(
                id,
                stringify(data.task ?? null),
                data.messageUrl ?? null,
                data.reminderUrl ?? null,
                stringify(data.submission ?? null),
                data.messageId ?? null,
                now,
                now
            );
    
            return true;
    
        } catch (error) {
            console.error('Error upserting project:', error);
            return false;
        }
    },

    // 🔥 SAVE
    save(project) {
        try {
            db.prepare(`
                UPDATE projects
                SET task = ?, messageUrl = ?, reminderUrl = ?, submission = ?, messageId = ?, updatedAt = ?
                WHERE id = ?
            `).run(
                stringify(project.task),
                project.messageUrl ?? null,
                project.reminderUrl ?? null,
                stringify(project.submission),
                project.messageId ?? null,
                Date.now(),
                project.id
            );

            return true;

        } catch (error) {
            console.error('Error saving project:', error);
            return false;
        }
    },

    // ❌ DELETE
    delete(id) {
        try {
            const result = db.prepare(`
                DELETE FROM projects WHERE id = ?
            `).run(id);

            return result.changes > 0;

        } catch (error) {
            console.error('Error deleting project:', error);
            return false;
        }
    },

    // 🧹 CLEANUP
    cleanup(days = 30) {
        try {
            const cutoff = Date.now() - (1000 * 60 * 60 * 24 * days);

            const result = db.prepare(`
                DELETE FROM projects WHERE createdAt < ?
            `).run(cutoff);

            return result.changes;

        } catch (error) {
            console.error('Error cleaning up projects:', error);
            return 0;
        }
    }

};
