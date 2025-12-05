import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './database.js';
import webpush from 'web-push';
import cron from 'node-cron';
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- WEB PUSH CONFIG ---
const vapidKeys = JSON.parse(fs.readFileSync(path.join(__dirname, 'vapid.json'), 'utf8'));
webpush.setVapidDetails(
  'mailto:admin@erzurum.edu.tr',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// --- SERVE STATIC FILES (Frontend) ---
// React app build output will be in 'dist' folder
app.use(express.static(path.join(__dirname, 'dist')));

// --- HELPER FUNCTIONS ---

const getRoomStatusLogic = (date, startTime, endTime) => {
  return new Promise((resolve, reject) => {
    // Check overlaps
    // Logic: (StartA < EndB) and (EndA > StartB)
    const sql = `
      SELECT room_id FROM reservations 
      WHERE date = ? 
      AND status = 'ACTIVE'
      AND (start_time < ? AND end_time > ?)
    `;
    db.all(sql, [date, endTime, startTime], (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map(r => r.room_id));
    });
  });
};

// --- AUTH ROUTES ---

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  // Simple auth for demo (In production, use bcrypt)
  const sql = `SELECT * FROM users WHERE email = ? AND password = ?`;

  db.get(sql, [email, password], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: "E-posta veya şifre hatalı." });

    // Convert logic names to frontend expectations
    // In DB we use snake_case, frontend uses camelCase
    const frontendUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentNumber: user.student_number,
      department: user.department,
      phone: user.phone,
      avatarColor: user.avatar_color
    };

    res.json(frontendUser);
  });
});

app.post('/api/register', (req, res) => {
  const { name, email, studentNumber, department, phone, password } = req.body;
  const role = 'STUDENT'; // Default
  const avatarColor = '#3B82F6'; // Default color
  const id = Math.random().toString(36).substr(2, 9);

  // Check existing
  db.get(`SELECT id FROM users WHERE email = ? OR student_number = ?`, [email, studentNumber], (err, row) => {
    if (row) return res.status(400).json({ error: "Bu e-posta veya öğrenci numarası zaten kayıtlı." });

    const sql = `
      INSERT INTO users (id, name, email, password, role, student_number, department, phone, avatar_color)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [id, name, email, password, role, studentNumber, department, phone, avatarColor], function (err) {
      if (err) return res.status(500).json({ error: err.message });

      res.json({
        id, name, email, role, studentNumber, department, phone, avatarColor
      });
    });
  });
});

app.put('/api/users/:id/color', (req, res) => {
  const { color } = req.body;
  const { id } = req.params;

  db.run(`UPDATE users SET avatar_color = ? WHERE id = ?`, [color, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    db.get(`SELECT * FROM users WHERE id = ?`, [id], (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentNumber: user.student_number,
        department: user.department,
        phone: user.phone,
        avatarColor: user.avatar_color
      });
    });
  });
});

app.post('/api/change-password', (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;

  db.get(`SELECT password FROM users WHERE id = ?`, [userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

    if (row.password !== oldPassword) {
      return res.status(400).json({ error: "Eski şifre hatalı." });
    }

    db.run(`UPDATE users SET password = ? WHERE id = ?`, [newPassword, userId], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

app.post('/api/forgot-password', (req, res) => {
  const { email, studentNumber, newPassword } = req.body;

  db.get(`SELECT id FROM users WHERE email = ? AND student_number = ?`, [email, studentNumber], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(400).json({ error: "Bilgiler uyuşmuyor. Lütfen kontrol ediniz." });

    db.run(`UPDATE users SET password = ? WHERE id = ?`, [newPassword, user.id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

app.get('/api/vapid-public-key', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

app.post('/api/subscribe', (req, res) => {
  const { userId, subscription } = req.body;
  const subJson = JSON.stringify(subscription);

  db.run(`INSERT OR REPLACE INTO push_subscriptions (user_id, subscription) VALUES (?, ?)`, [userId, subJson], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- CRON JOB (Every Minute) ---
cron.schedule('* * * * *', () => {
  const now = new Date();
  // Check for reservations starting in 15-16 minutes
  const startRange = new Date(now.getTime() + 15 * 60000);
  const endRange = new Date(now.getTime() + 16 * 60000);

  // Format to HH:mm for simple string comparison (assuming same day)
  // Note: This simple logic assumes reservations are for TODAY. 
  // For a robust system, we should check full Date objects.
  // Given the DB stores 'date' (YYYY-MM-DD) and 'start_time' (HH:mm), we construct the query carefully.

  const todayStr = now.toISOString().split('T')[0];
  const targetTimeStr = startRange.toTimeString().slice(0, 5); // HH:mm

  const sql = `
    SELECT r.user_id, r.room_id, r.start_time, ps.subscription 
    FROM reservations r
    JOIN push_subscriptions ps ON r.user_id = ps.user_id
    WHERE r.date = ? AND r.start_time = ? AND r.status = 'ACTIVE'
  `;

  db.all(sql, [todayStr, targetTimeStr], (err, rows) => {
    if (err) return console.error('Cron error:', err);

    rows.forEach(row => {
      const payload = JSON.stringify({
        title: 'Randevu Hatırlatıcı',
        body: `Oda ${row.room_id} rezervasyonunuz 15 dakika sonra (${row.start_time}) başlıyor!`,
        icon: '/assets/icon.png' // Make sure this exists or remove
      });

      webpush.sendNotification(JSON.parse(row.subscription), payload)
        .catch(error => console.error('Push error:', error));
    });
  });
});

// --- RESERVATION ROUTES ---

app.get('/api/reservations', (req, res) => {
  const sql = `SELECT * FROM reservations ORDER BY created_at DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    // Map snake_case to camelCase
    const reservations = rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name,
      userStudentNumber: r.user_student_number,
      roomId: r.room_id,
      date: r.date,
      startTime: r.start_time,
      endTime: r.end_time,
      status: r.status,
      createdAt: r.created_at,
      groupMembers: r.group_members ? JSON.parse(r.group_members) : []
    }));

    res.json(reservations);
  });
});

app.get('/api/rooms/status', (req, res) => {
  const { date, startTime, endTime } = req.query;

  getRoomStatusLogic(date, startTime, endTime)
    .then(roomIds => res.json(roomIds))
    .catch(err => res.status(500).json({ error: err.message }));
});

app.post('/api/reservations', (req, res) => {
  const { user, roomId, date, startTime, endTime, groupMembers, isAdminOverride } = req.body;
  const id = Math.random().toString(36).substr(2, 9);

  // 1. Check Availability (Overlap)
  getRoomStatusLogic(date, startTime, endTime).then(occupiedRooms => {
    if (occupiedRooms.includes(roomId)) {
      return res.status(400).json({ error: "Bu oda seçilen saat aralığında doludur." });
    }

    // 2. Double Booking Check (Complex)
    if (user.role !== 'ADMIN' && !isAdminOverride) {
      // Gather all student numbers involved (User + Group)
      const participants = [user.studentNumber, ...(groupMembers || [])].filter(Boolean);

      // Query to find if ANY participant has an ACTIVE reservation on this DATE
      // We need to check both user_student_number column AND group_members JSON column
      const checkSql = `SELECT user_student_number, group_members FROM reservations WHERE date = ? AND status = 'ACTIVE'`;

      db.all(checkSql, [date], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const busyStudents = new Set();
        rows.forEach(row => {
          if (row.user_student_number) busyStudents.add(row.user_student_number);
          if (row.group_members) {
            const members = JSON.parse(row.group_members);
            members.forEach(m => busyStudents.add(m));
          }
        });

        for (const p of participants) {
          if (busyStudents.has(p)) {
            if (p === user.studentNumber) {
              return res.status(400).json({ error: "RESERVATION_LIMIT_EXCEEDED" });
            } else {
              return res.status(400).json({ error: `Öğrenci numarası ${p} olan kişinin bugün başka bir rezervasyonu var.` });
            }
          }
        }

        // If all checks pass, insert
        insertReservation();
      });
    } else {
      insertReservation();
    }
  });

  function insertReservation() {
    const sql = `
      INSERT INTO reservations (id, user_id, user_name, user_student_number, room_id, date, start_time, end_time, status, group_members)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const membersJson = groupMembers ? JSON.stringify(groupMembers) : '[]';

    db.run(sql, [id, user.id, user.name, user.studentNumber, roomId, date, startTime, endTime, 'ACTIVE', membersJson], function (err) {
      if (err) return res.status(500).json({ error: err.message });

      // Return the new reservation
      res.json({
        id, userId: user.id, userName: user.name, userStudentNumber: user.studentNumber,
        roomId, date, startTime, endTime, status: 'ACTIVE', groupMembers: groupMembers || [], createdAt: new Date().toISOString()
      });
    });
  }
});

app.post('/api/reservations/:id/cancel', (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  db.run(`UPDATE reservations SET status = 'CANCELLED' WHERE id = ?`, [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    // Check waiting list logic here (Trigger notifications)
    // ... (Simplified for brevity, would query waiting_list table)

    res.json({ success: true });
  });
});

// --- REQUESTS, SUGGESTIONS, NOTIFICATIONS ---

// Generic Get/Post handlers for simple tables
app.get('/api/requests', (req, res) => {
  db.all(`SELECT * FROM reservation_requests`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => ({
      ...r,
      userId: r.user_id,
      userName: r.user_name,
      userStudentNumber: r.user_student_number,
      roomId: r.room_id,
      startTime: r.start_time,
      endTime: r.end_time,
      groupMembers: r.group_members ? JSON.parse(r.group_members) : []
    })));
  });
});

app.post('/api/requests', (req, res) => {
  const { user, roomId, date, startTime, endTime, groupMembers } = req.body;
  const id = Math.random().toString(36).substr(2, 9);
  const sql = `INSERT INTO reservation_requests (id, user_id, user_name, user_student_number, room_id, date, start_time, end_time, status, group_members) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.run(sql, [id, user.id, user.name, user.studentNumber, roomId, date, startTime, endTime, 'PENDING', JSON.stringify(groupMembers || [])], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post('/api/requests/:id/resolve', (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // APPROVE or REJECT
  const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

  db.run(`UPDATE reservation_requests SET status = ? WHERE id = ?`, [status, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.get('/api/notifications', (req, res) => {
  const { userId } = req.query;
  db.all(`SELECT * FROM notifications WHERE user_id = ? ORDER BY date DESC`, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => ({ ...r, userId: r.user_id, isRead: r.is_read === 1 })));
  });
});

app.post('/api/notifications/read', (req, res) => {
  const { userId } = req.body;
  db.run(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [userId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post('/api/suggestions', (req, res) => {
  const { userId, userName, message } = req.body;
  const id = Math.random().toString(36).substr(2, 9);
  db.run(`INSERT INTO suggestions (id, user_id, user_name, message) VALUES (?, ?, ?, ?)`, [id, userId, userName, message], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.get('/api/suggestions', (req, res) => {
  db.all(`SELECT * FROM suggestions ORDER BY date DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => ({ ...r, userId: r.user_id, userName: r.user_name })));
  });
});

app.delete('/api/suggestions/:id', (req, res) => {
  db.run(`DELETE FROM suggestions WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- CATCH ALL ROUTE (SPA Support) ---
// Any request that doesn't match an API route will return the React app
app.use((req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  res.sendFile(indexPath);
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
