
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const sqlite3 = require('sqlite3').verbose();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// const verboseSqlite = sqlite3.verbose(); // Removed as we do it in require
const dbPath = path.resolve(__dirname, 'library.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Initialize Tables
db.serialize(() => {
  // Users Table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    student_number TEXT,
    department TEXT,
    phone TEXT,
    avatar_color TEXT
  )`);

  // Reservations Table
  db.run(`CREATE TABLE IF NOT EXISTS reservations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_student_number TEXT,
    room_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    status TEXT NOT NULL,
    group_members TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Requests Table
  db.run(`CREATE TABLE IF NOT EXISTS reservation_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_student_number TEXT,
    room_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    status TEXT NOT NULL,
    group_members TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Suggestions Table
  db.run(`CREATE TABLE IF NOT EXISTS suggestions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_name TEXT NOT NULL,
    message TEXT NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Notifications Table
  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    type TEXT DEFAULT 'info',
    date DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Waiting List Table
  db.run(`CREATE TABLE IF NOT EXISTS waiting_list (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Push Subscriptions Table
  db.run(`CREATE TABLE IF NOT EXISTS push_subscriptions (
    user_id TEXT NOT NULL,
    subscription TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, subscription)
  )`);

  // Seed Admin User (If not exists)
  const adminId = 'user_admin';
  const adminEmail = 'admin@erzurum.edu.tr';

  db.get(`SELECT id FROM users WHERE email = ?`, [adminEmail], (err, row) => {
    if (!row) {
      db.run(`INSERT INTO users (id, name, email, password, role, avatar_color) VALUES (?, ?, ?, ?, ?, ?)`,
        [adminId, 'Admin User', adminEmail, 'admin123', 'ADMIN', '#EF4444']);
      console.log('Admin user seeded.');
    }
  });

  // Seed Student User
  const studentEmail = 'yusuf@erzurum.edu.tr';
  db.get(`SELECT id FROM users WHERE email = ?`, [studentEmail], (err, row) => {
    if (!row) {
      db.run(`INSERT INTO users (id, name, email, password, role, student_number, department, phone, avatar_color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['user_yusuf', 'Yusuf Baydoğan', studentEmail, '123456', 'STUDENT', '202105015', 'Bilgisayar Müh.', '05551234567', '#3B82F6']);
      console.log('Test student seeded.');
    }
  });

});

export default db;
