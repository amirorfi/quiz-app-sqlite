const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbDir = process.env.DATABASE_DIR || '.';
const DB_FILE_NAME = "quiz_database.sqlite";
const DB_SOURCE = path.join(dbDir, DB_FILE_NAME);

console.log(`[DB] Attempting to connect to database at: ${DB_SOURCE}`);

const db = new sqlite3.Database(DB_SOURCE, (err) => {
    if (err) {
        console.error("[DB] Error opening database:", err.message);
        console.error("[DB] Full error object:", err);
        if (process.env.NODE_ENV === 'production') {
            console.error("[DB] CRITICAL: Database could not be opened. Exiting.");
            process.exit(1);
        }
        throw err;
    } else {
        console.log('[DB] Connected to the SQLite database.');
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fullName TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                mobile TEXT NOT NULL,
                signedUpAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if (err) console.error("[DB] Error creating users table:", err.message);
                else console.log("[DB] Users table checked/created.");
            });

            db.run(`CREATE TABLE IF NOT EXISTS quiz_submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_email TEXT NOT NULL,
                score INTEGER NOT NULL,
                totalQuestions INTEGER NOT NULL,
                percentage REAL NOT NULL,
                timeTaken INTEGER,
                submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_email) REFERENCES users(email)
            )`, (err) => {
                if (err) console.error("[DB] Error creating quiz_submissions table:", err.message);
                else console.log("[DB] Quiz submissions table checked/created.");
            });
        });
    }
});

module.exports = db;