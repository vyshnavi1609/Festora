import express from "express";
import fs from "fs";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import crypto from "crypto";
import dotenv from "dotenv";
import util from "util";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const db = new Database("campus_events.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    phone_number TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'student', -- 'admin', 'council_president', 'club_president', 'club_member', 'student'
    full_name TEXT,
    bio TEXT,
    social_links TEXT, -- JSON string
    avatar_url TEXT,
    college_name TEXT,
    roll_no TEXT,
    UNIQUE(college_name, roll_no)
  );
  -- Migration for existing users table
  PRAGMA foreign_keys=off;
  BEGIN TRANSACTION;
  CREATE TABLE IF NOT EXISTS users_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    phone_number TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'student',
    full_name TEXT,
    bio TEXT,
    social_links TEXT,
    avatar_url TEXT,
    college_name TEXT,
    roll_no TEXT,
    UNIQUE(college_name, roll_no)
  );
  INSERT OR IGNORE INTO users_new (id, username, email, phone_number, password, role, full_name, avatar_url, college_name, roll_no)
  SELECT id, username, email, phone_number, password, role, full_name, avatar_url, college_name, roll_no FROM users;
  DROP TABLE IF EXISTS users;
  ALTER TABLE users_new RENAME TO users;
  COMMIT;
  PRAGMA foreign_keys=on;


  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    image_url TEXT,
    date TEXT,
    location TEXT,
    category TEXT DEFAULT 'Social', -- 'Workshop', 'Social', 'Academic', 'Concert'
    club_id INTEGER,
    created_by INTEGER,
    views INTEGER DEFAULT 0,
    privacy TEXT DEFAULT 'social', -- 'private' or 'social'
    college_code TEXT, -- for private events
    capacity INTEGER, -- maximum number of attendees
    pass TEXT, -- registration pass/ticket
    FOREIGN KEY(created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER,
    user_id INTEGER,
    content TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(event_id) REFERENCES events(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    event_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'registered', -- 'registered', 'waitlisted', 'cancelled'
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(event_id) REFERENCES events(id)
  );

  CREATE TABLE IF NOT EXISTS waitlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    event_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(event_id) REFERENCES events(id)
  );

  CREATE TABLE IF NOT EXISTS role_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_id INTEGER,
    target_user_id INTEGER,
    requested_role TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    FOREIGN KEY(requester_id) REFERENCES users(id),
    FOREIGN KEY(target_user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER,
    receiver_id INTEGER,
    content TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sender_id) REFERENCES users(id),
    FOREIGN KEY(receiver_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS saved_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    event_id INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(event_id) REFERENCES events(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    content TEXT,
    type TEXT, -- 'role_update', 'event_update', 'reminder'
    is_read INTEGER DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    scheduled_at DATETIME,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    event_id INTEGER,
    remind_at DATETIME,
    is_triggered INTEGER DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(event_id) REFERENCES events(id)
  );

  CREATE TABLE IF NOT EXISTS follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_id INTEGER,
    following_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(follower_id) REFERENCES users(id),
    FOREIGN KEY(following_id) REFERENCES users(id),
    UNIQUE(follower_id, following_id)
  );

  CREATE TABLE IF NOT EXISTS stories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    content_type TEXT, -- 'text', 'image', 'video'
    content TEXT, -- text content or media URL
    background_color TEXT DEFAULT '#000000',
    text_color TEXT DEFAULT '#FFFFFF',
    font_size TEXT DEFAULT 'medium', -- 'small', 'medium', 'large'
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS story_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    story_id INTEGER,
    viewer_id INTEGER,
    viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(story_id) REFERENCES stories(id),
    FOREIGN KEY(viewer_id) REFERENCES users(id),
    UNIQUE(story_id, viewer_id)
  );

  CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    event_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(event_id) REFERENCES events(id),
    UNIQUE(user_id, event_id)
  );

  CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    event_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(event_id) REFERENCES events(id),
    UNIQUE(user_id, event_id)
  );

  CREATE TABLE IF NOT EXISTS event_reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    event_id INTEGER,
    reminder_time DATETIME,
    is_sent INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(event_id) REFERENCES events(id)
  );

  CREATE TABLE IF NOT EXISTS activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    activity_type TEXT, -- 'followed', 'liked_event', 'registered_event', 'created_event'
    target_user_id INTEGER,
    target_event_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(target_user_id) REFERENCES users(id),
    FOREIGN KEY(target_event_id) REFERENCES events(id)
  );

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    token TEXT UNIQUE,
    expires_at DATETIME,
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS clubs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    description TEXT,
    logo_url TEXT,
    president_id INTEGER,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(president_id) REFERENCES users(id),
    FOREIGN KEY(created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS club_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    club_id INTEGER,
    user_id INTEGER,
    role TEXT DEFAULT 'member', -- 'member', 'vice_president'
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(club_id, user_id),
    FOREIGN KEY(club_id) REFERENCES clubs(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS club_follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    club_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(club_id) REFERENCES clubs(id),
    UNIQUE(user_id, club_id)
  );
`);

console.log('Database initialized successfully');


// Add missing columns to events table if they don't exist
try {
  db.exec(`ALTER TABLE events ADD COLUMN privacy TEXT DEFAULT 'social'`);
} catch (err: any) {
  if (!err.message.includes('duplicate column')) console.error(err);
}

try {
  db.exec(`ALTER TABLE events ADD COLUMN college_code TEXT`);
} catch (err: any) {
  if (!err.message.includes('duplicate column')) console.error(err);
}

try {
  db.exec(`ALTER TABLE events ADD COLUMN capacity INTEGER`);
} catch (err: any) {
  if (!err.message.includes('duplicate column')) console.error(err);
}

// Cleanup expired stories periodically
setInterval(() => {
  try {
    const result = db.prepare("DELETE FROM stories WHERE expires_at <= datetime('now')").run();
    if (result.changes > 0) {
      console.log(`Cleaned up ${result.changes} expired stories`);
    }
  } catch (e) {
    console.error('Error cleaning up expired stories:', e);
  }
}, 60 * 60 * 1000); // Run every hour


// Express app initialization must come before all route definitions
const app = express();
app.use(express.json());

// Club Follows
app.post("/api/club-follows", (req, res) => {
  const { user_id, club_id } = req.body;
  try {
    db.prepare("INSERT INTO club_follows (user_id, club_id) VALUES (?, ?)").run(user_id, club_id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Already following" });
  }
});

app.delete("/api/club-follows/:userId/:clubId", (req, res) => {
  db.prepare("DELETE FROM club_follows WHERE user_id = ? AND club_id = ?").run(req.params.userId, req.params.clubId);
  res.json({ success: true });
});

app.get("/api/club-follows/status/:userId/:clubId", (req, res) => {
  const follow = db.prepare("SELECT * FROM club_follows WHERE user_id = ? AND club_id = ?").get(req.params.userId, req.params.clubId);
  res.json({ isFollowing: !!follow });
});

app.get("/api/club-follows/count/:clubId", (req, res) => {
  const count = db.prepare("SELECT COUNT(*) as count FROM club_follows WHERE club_id = ?").get(req.params.clubId);
  res.json(count);
});

// Add qr_code column to events table if it doesn't exist
try {
  db.exec(`ALTER TABLE events ADD COLUMN qr_code TEXT`);
} catch (err: any) {
  if (!err.message.includes('duplicate column')) console.error(err);
}

try {
  const row = db.prepare("SELECT * FROM users WHERE role = 'admin'").get();
  if (!row) {
    db.prepare("INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)").run(
      "admin", "admin123", "admin", "System Administrator"
    );
  }
} catch (err) {
  console.error('Admin user setup error:', err);
}

// Email transporter
const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


// Auth Routes (Simplified for demo)
app.post("/api/login", (req, res) => {
  const { identifier, password } = req.body;
  // identifier can be username, email, or phone_number
  const user = db.prepare(`
    SELECT * FROM users 
    WHERE (username = ? OR email = ? OR phone_number = ?) 
    AND password = ?
  `).get(identifier, identifier, identifier, password);
  
  if (user) {
    res.json(user);
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.post("/api/register", async (req, res) => {
  const { username, email, phone_number, password, full_name, avatar_url, college_name, roll_no } = req.body;

  // Check if roll number already exists for this college
  const existingRollNo = db.prepare("SELECT id FROM users WHERE college_name = ? AND roll_no = ?").get(college_name, roll_no);
  if (existingRollNo) {
    return res.status(400).json({ error: "A student with this roll number already exists in your college" });
  }

  try {
    const result = db.prepare("INSERT INTO users (username, email, phone_number, password, full_name, avatar_url, college_name, roll_no, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      username,
      email,
      phone_number,
      password,
      full_name,
      avatar_url,
      college_name,
      roll_no,
      'student'
    );
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);

    // Send welcome email
    const welcomeMailOptions = {
      from: `Festora <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Welcome to Festora - Registration Successful!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366f1;">Welcome to Festora, ${full_name}!</h2>
          <p>Congratulations! Your account has been successfully created.</p>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Your Account Details:</h3>
            <p><strong>Username:</strong> ${username}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>College:</strong> ${college_name}</p>
            <p><strong>Roll Number:</strong> ${roll_no}</p>
          </div>

          <p>You can now:</p>
          <ul>
            <li>Discover and attend exciting campus events</li>
            <li>Create and manage your own events</li>
            <li>Connect with fellow students</li>
            <li>Stay updated with college activities</li>
          </ul>

          <a href="${process.env.APP_URL}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 16px 0;">Start Exploring Events</a>

          <p>If you have any questions, feel free to reach out to us.</p>
          <p>Best regards,<br>The Festora Team</p>
        </div>
      `
    };

    try {
      console.log('Sending welcome email to:', email);
      await emailTransporter.sendMail(welcomeMailOptions);
      console.log('Welcome email sent successfully to:', email);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail registration if email fails, just log it
    }

    res.json(user);
  } catch (e: any) {
    if (e.message.includes("UNIQUE constraint failed")) {
      res.status(400).json({ error: "Username, Email, or Phone already exists" });
    } else {
      res.status(500).json({ error: "Registration failed" });
    }
  }
});

app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;
  
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) {
    return res.status(404).json({ error: "No account found with this email address" });
  }
  
  // Generate reset token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
  
  // Save token to database
  db.prepare("INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)").run(user.id, token, expiresAt.toISOString());
  
  // Send email
  const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;
  const mailOptions = {
    from: `Festora <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Password Reset - Festora',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Reset Your Password</h2>
        <p>Hello ${user.full_name},</p>
        <p>You requested a password reset for your Festora account. Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 16px 0;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>Best regards,<br>The Festora Team</p>
      </div>
    `
  };
  
  try {
    console.log('Attempting to send email to:', email);
    console.log('Using SMTP config:', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER ? 'SET' : 'NOT SET',
      pass: process.env.EMAIL_PASS ? 'SET' : 'NOT SET'
    });
    
    await emailTransporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', email);
    res.json({ message: "Password reset email sent successfully" });
  } catch (error) {
    console.error('Email sending failed:', error);
    res.status(500).json({ error: "Failed to send reset email" });
  }
});

app.post("/api/reset-password", (req, res) => {
  const { token, newPassword } = req.body;
  
  // Find valid token
  const resetToken = db.prepare("SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > datetime('now') AND used = 0").get(token);
  if (!resetToken) {
    return res.status(400).json({ error: "Invalid or expired reset token" });
  }
  
  // Update password
  db.prepare("UPDATE users SET password = ? WHERE id = ?").run(newPassword, resetToken.user_id);
  
  // Mark token as used
  db.prepare("UPDATE password_reset_tokens SET used = 1 WHERE id = ?").run(resetToken.id);
  
  res.json({ message: "Password reset successfully" });
});

// Club Management Routes
app.post("/api/clubs", (req, res) => {
  const { name, description, logo_url, president_id, user_id } = req.body;
  
  // Only student president or admin can create clubs
  const requester = db.prepare("SELECT role FROM users WHERE id = ?").get(user_id);
  if (!requester || (requester.role !== 'student_president' && requester.role !== 'admin')) {
    return res.status(403).json({ error: "Only student president can create clubs" });
  }
  
  try {
    db.prepare("INSERT INTO clubs (name, description, logo_url, president_id, created_by) VALUES (?, ?, ?, ?, ?)").run(
      name, description, logo_url, president_id, user_id
    );
    
    // Add president as club member
    const club = db.prepare("SELECT id FROM clubs WHERE name = ?").get(name);
    db.prepare("INSERT INTO club_members (club_id, user_id, role) VALUES (?, ?, ?)").run(club.id, president_id, 'president');
    
    // Update user role to club_president if not already
    db.prepare("UPDATE users SET role = 'club_president' WHERE id = ?").run(president_id);
    
    res.json({ message: "Club created successfully", club });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/clubs", (req, res) => {
  const clubs = db.prepare("SELECT * FROM clubs").all();
  res.json(clubs);
});

app.get("/api/clubs/:id", (req, res) => {
  const club = db.prepare("SELECT * FROM clubs WHERE id = ?").get(req.params.id);
  if (!club) {
    return res.status(404).json({ error: "Club not found" });
  }
  res.json(club);
});

app.post("/api/clubs/:id/members", (req, res) => {
  const { user_id, member_id, role } = req.body;
  const clubId = req.params.id;
  
  // Check if requester is club president
  const club = db.prepare("SELECT president_id FROM clubs WHERE id = ?").get(clubId);
  if (!club || club.president_id !== user_id) {
    return res.status(403).json({ error: "Only club president can add members" });
  }
  
  try {
    db.prepare("INSERT INTO club_members (club_id, user_id, role) VALUES (?, ?, ?)").run(
      clubId, member_id, role || 'member'
    );
    res.json({ message: "Member added successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/clubs/:id/members", (req, res) => {
  const members = db.prepare("SELECT u.id, u.username, u.full_name, u.avatar_url, cm.role FROM club_members cm JOIN users u ON cm.user_id = u.id WHERE cm.club_id = ?").all(req.params.id);
  res.json(members);
});

app.get("/api/users/:id/clubs", (req, res) => {
  const clubs = db.prepare("SELECT c.* FROM clubs c JOIN club_members cm ON c.id = cm.club_id WHERE cm.user_id = ?").all(req.params.id);
  res.json(clubs);
});

app.get("/api/check-rollno", (req, res) => {
  const { college, rollno } = req.query;
  const existing = db.prepare("SELECT id FROM users WHERE college_name = ? AND roll_no = ?").get(college, rollno);
  res.json({ exists: !!existing });
});

app.post("/api/users/:id/profile", (req, res) => {
  const { bio, social_links, avatar_url, college_name, roll_no } = req.body;
  
  // Check if roll number is already taken by another user in the same college
  if (college_name && roll_no) {
    const existing = db.prepare("SELECT id FROM users WHERE college_name = ? AND roll_no = ? AND id != ?").get(college_name, roll_no, req.params.id);
    if (existing) {
      return res.status(400).json({ error: "A student with this roll number already exists in your college" });
    }
  }
  
  db.prepare("UPDATE users SET bio = ?, social_links = ?, avatar_url = ?, college_name = ?, roll_no = ? WHERE id = ?").run(
    bio, 
    JSON.stringify(social_links), 
    avatar_url,
    college_name,
    roll_no,
    req.params.id
  );
  res.json({ success: true });
});

// Event Routes
app.get("/api/events/user/:id/count", (req, res) => {
  const count = db.prepare("SELECT COUNT(*) as count FROM events WHERE created_by = ?").get(req.params.id);
  res.json(count);
});


// Get events, filter private events by college code if provided
app.get("/api/events", (req, res) => {
  const { college_code } = req.query;
  let events;
  if (college_code) {
    events = db.prepare(`
      SELECT events.*, users.full_name as organizer_name,
      (SELECT COUNT(*) FROM registrations WHERE event_id = events.id) as registration_count,
      (SELECT COUNT(*) FROM comments WHERE event_id = events.id) as comment_count
      FROM events 
      JOIN users ON events.created_by = users.id
      WHERE (events.privacy = 'social') OR (events.privacy = 'private' AND events.college_code = ?)
      ORDER BY events.id DESC
    `).all(college_code);
  } else {
    events = db.prepare(`
      SELECT events.*, users.full_name as organizer_name,
      (SELECT COUNT(*) FROM registrations WHERE event_id = events.id) as registration_count,
      (SELECT COUNT(*) FROM comments WHERE event_id = events.id) as comment_count
      FROM events 
      JOIN users ON events.created_by = users.id
      WHERE events.privacy = 'social'
      ORDER BY events.id DESC
    `).all();
  }
  res.json(events);
});

app.post("/api/events/:id/view", (req, res) => {
  db.prepare("UPDATE events SET views = views + 1 WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// Comment Routes
app.get("/api/events/:eventId/comments", (req, res) => {
  const comments = db.prepare(`
    SELECT comments.*, users.username, users.full_name 
    FROM comments 
    JOIN users ON comments.user_id = users.id
    WHERE event_id = ?
    ORDER BY timestamp ASC
  `).all(req.params.eventId);
  res.json(comments);
});

app.post("/api/comments", (req, res) => {
  const { event_id, user_id, content } = req.body;
  db.prepare("INSERT INTO comments (event_id, user_id, content) VALUES (?, ?, ?)").run(
    event_id, user_id, content
  );
  res.json({ success: true });
});

// Analytics
app.get("/api/analytics/global", (req, res) => {
  const stats = db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM users) as total_users,
      (SELECT COUNT(*) FROM events) as total_events,
      (SELECT COUNT(*) FROM registrations) as total_registrations,
      (SELECT SUM(views) FROM events) as total_views
  `).get();
  
  const recentActivity = db.prepare(`
    SELECT 'registration' as type, u.full_name, e.title as target, r.timestamp
    FROM registrations r
    JOIN users u ON r.user_id = u.id
    JOIN events e ON r.event_id = e.id
    UNION ALL
    SELECT 'comment' as type, u.full_name, e.title as target, c.timestamp
    FROM comments c
    JOIN users u ON c.user_id = u.id
    JOIN events e ON c.event_id = e.id
    ORDER BY timestamp DESC LIMIT 10
  `).all();

  res.json({ stats, recentActivity });
});

app.get("/api/analytics/:userId", (req, res) => {
  const stats = db.prepare(`
    SELECT 
      COUNT(e.id) as total_events,
      SUM(e.views) as total_views,
      (SELECT COUNT(*) FROM registrations r JOIN events e2 ON r.event_id = e2.id WHERE e2.created_by = ?) as total_registrations
    FROM events e
    WHERE e.created_by = ?
  `).get(req.params.userId, req.params.userId);
  
  const eventBreakdown = db.prepare(`
    SELECT 
      title, 
      views, 
      (SELECT COUNT(*) FROM registrations WHERE event_id = events.id) as registrations
    FROM events
    WHERE created_by = ?
  `).all(req.params.userId);

  res.json({ stats, eventBreakdown });
});


app.post("/api/events", (req, res) => {
  const { title, description, image_url, date, location, category, created_by, privacy, college_code, club_id, pass } = req.body;
  if (!title || !description || !date || !location) {
    return res.status(400).json({ error: "All fields are required" });
  }
  const eventPrivacy = privacy === 'private' ? 'private' : 'social';
  const eventCollegeCode = eventPrivacy === 'private' ? (college_code || null) : null;
  const result = db.prepare("INSERT INTO events (title, description, image_url, date, location, category, created_by, privacy, college_code, club_id, pass) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    title, description, image_url, date, location, category || 'Social', created_by, eventPrivacy, eventCollegeCode, club_id || null, pass || null
  );
  res.json({ id: result.lastInsertRowid });
});

app.put("/api/events/:id", (req, res) => {
  const { title, description, image_url, date, location, category, privacy, college_code, pass } = req.body;
  if (!title || !description || !date || !location) {
    return res.status(400).json({ error: "All fields are required" });
  }
  const eventPrivacy = privacy === 'private' ? 'private' : 'social';
  const eventCollegeCode = eventPrivacy === 'private' ? (college_code || null) : null;
  db.prepare("UPDATE events SET title = ?, description = ?, image_url = ?, date = ?, location = ?, category = ?, privacy = ?, college_code = ?, pass = ? WHERE id = ?").run(
    title, description, image_url, date, location, category, eventPrivacy, eventCollegeCode, pass || null, req.params.id
  );
  res.json({ success: true });
});

// Role Management
app.get("/api/users/search", (req, res) => {
  const query = req.query.q as string;
  const users = db.prepare("SELECT id, username, full_name, avatar_url FROM users WHERE username LIKE ? OR full_name LIKE ? LIMIT 10").all(`%${query}%`, `%${query}%`);
  res.json(users);
});

app.get("/api/users", (req, res) => {
  // Get requester id from query or header
  const requesterId = req.query.requester || req.headers['x-requester-id'];
  if (!requesterId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    const requester = db.prepare("SELECT role FROM users WHERE id = ?").get(requesterId);
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    const users = db.prepare("SELECT id, username, full_name, role FROM users").all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/users/:id", (req, res) => {
  try {
    const user = db.prepare("SELECT id, username, full_name, role, bio, social_links, avatar_url, college_name, roll_no FROM users WHERE id = ?").get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Get requester id from query or header (for demo, allow ?requester=ID)
    const requesterId = req.query.requester || req.headers['x-requester-id'];
    let requester = null;
    if (requesterId) {
      requester = db.prepare("SELECT * FROM users WHERE id = ?").get(requesterId);
    }
    if (user.role === 'admin' && (!requester || requester.role !== 'admin')) {
      return res.status(403).json({ error: "You are not allowed to view admin details" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/role-requests", async (req, res) => {
  const { requester_id, target_user_id, requested_role } = req.body;
  try {
    const result = db.prepare("INSERT INTO role_requests (requester_id, target_user_id, requested_role) VALUES (?, ?, ?)").run(
      requester_id, target_user_id, requested_role);
    
    // Get user details for email
    const requester = db.prepare("SELECT full_name FROM users WHERE id = ?").get(requester_id);
    const targetUser = db.prepare("SELECT email, full_name FROM users WHERE id = ?").get(target_user_id);
    
    // Send email notification
    if (targetUser.email) {
      try {
        await emailTransporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: targetUser.email,
          subject: `Role Request - ${requested_role}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #6366f1;">Role Request Received</h2>
              <p>Hi ${targetUser.full_name},</p>
              <p><strong>${requester.full_name}</strong> has requested to assign you the role of <strong>${requested_role}</strong>.</p>
              <p>Please log in to your Festora account to approve or reject this request.</p>
              <p>Best regards,<br>Festora Team</p>
            </div>
          `
        });
      } catch (emailError) {
        console.error('Failed to send role request email:', emailError);
      }
    }
    
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/role-requests/:userId", (req, res) => {
  try {
    const requests = db.prepare(`
      SELECT role_requests.*, u1.full_name as requester_name, u2.full_name as target_name
      FROM role_requests
      JOIN users u1 ON role_requests.requester_id = u1.id
      JOIN users u2 ON role_requests.target_user_id = u2.id
      WHERE role_requests.target_user_id = ? OR (
        SELECT role FROM users WHERE id = ?
      ) IN ('admin', 'council_president', 'club_president')
    `).all(req.params.userId, req.params.userId);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/role-requests/approve", (req, res) => {
  const { requestId } = req.body;
  try {
    const request = db.prepare("SELECT * FROM role_requests WHERE id = ?").get(requestId);
    if (request) {
      db.prepare("UPDATE users SET role = ? WHERE id = ?").run(request.requested_role, request.target_user_id);
      db.prepare("UPDATE role_requests SET status = 'approved' WHERE id = ?").run(requestId);
      
      // Create notification
      db.prepare("INSERT INTO notifications (user_id, content, type) VALUES (?, ?, ?)").run(
        request.target_user_id,
        `Your request for ${request.requested_role.replace('_', ' ')} has been approved!`,
        'role_update'
      );
      
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Request not found" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/role-requests/reject", (req, res) => {
  const { requestId } = req.body;
  const request = db.prepare("SELECT * FROM role_requests WHERE id = ?").get(requestId);
  if (request) {
    db.prepare("UPDATE role_requests SET status = 'rejected' WHERE id = ?").run(requestId);
    
    // Create notification
    db.prepare("INSERT INTO notifications (user_id, content, type) VALUES (?, ?, ?)").run(
      request.target_user_id,
      `Your request for ${request.requested_role.replace('_', ' ')} has been rejected.`,
      'role_update'
    );
    
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Request not found" });
  }
});

// Notifications
app.get("/api/notifications/:userId", (req, res) => {
  const notifications = db.prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY timestamp DESC LIMIT 20").all(req.params.userId);
  res.json(notifications);
});

app.post("/api/notifications/:id/read", (req, res) => {
  db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// Messaging
app.get("/api/messages/contacts/:userId", (req, res) => {
  // Contacts are people you follow AND who follow you (mutuals) or just people you follow?
  // Instagram allows messaging anyone you follow, or mutuals. Let's go with mutuals or following for simplicity.
  // User request: "messages can only be for followers and following"
  const contacts = db.prepare(`
    SELECT DISTINCT u.id, u.username, u.full_name, u.role
    FROM users u
    WHERE u.id IN (
      SELECT following_id FROM follows WHERE follower_id = ?
      UNION
      SELECT follower_id FROM follows WHERE following_id = ?
    )
  `).all(req.params.userId, req.params.userId);
  res.json(contacts);
});

app.get("/api/messages/:userId/:otherId", (req, res) => {
  const messages = db.prepare(`
    SELECT * FROM messages 
    WHERE (sender_id = ? AND receiver_id = ?) 
    OR (sender_id = ? AND receiver_id = ?)
    ORDER BY timestamp ASC
  `).all(req.params.userId, req.params.otherId, req.params.otherId, req.params.userId);
  res.json(messages);
});

app.post("/api/messages", (req, res) => {
  const { sender_id, receiver_id, content } = req.body;
  db.prepare("INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)").run(
    sender_id, receiver_id, content
  );
  res.json({ success: true });
});

app.post("/api/reminders", (req, res) => {
  const { user_id, event_id, remind_at } = req.body;
  db.prepare("INSERT INTO reminders (user_id, event_id, remind_at) VALUES (?, ?, ?)").run(user_id, event_id, remind_at);
  res.json({ success: true });
});

// Registrations & Saves
app.post("/api/register-event", async (req, res) => {
  const { user_id, event_id } = req.body;
  
  // Check if user is already registered or waitlisted
  const existingReg = db.prepare("SELECT * FROM registrations WHERE user_id = ? AND event_id = ? AND status IN ('registered', 'waitlisted')").get(user_id, event_id);
  if (existingReg) {
    return res.status(400).json({ error: "Already registered or waitlisted for this event" });
  }
  
  // Get event details and user email
  const event = db.prepare("SELECT * FROM events WHERE id = ?").get(event_id);
  const user = db.prepare("SELECT email, full_name FROM users WHERE id = ?").get(user_id);
  const currentRegistrations = db.prepare("SELECT COUNT(*) as count FROM registrations WHERE event_id = ? AND status = 'registered'").get(event_id);
  
  if (event.capacity && currentRegistrations.count >= event.capacity) {
    // Event is full, add to waitlist
    db.prepare("INSERT INTO registrations (user_id, event_id, status) VALUES (?, ?, 'waitlisted')").run(user_id, event_id);
    res.json({ success: true, status: 'waitlisted', message: 'Added to waitlist' });
  } else {
    // Register normally
    db.prepare("INSERT INTO registrations (user_id, event_id, status) VALUES (?, ?, 'registered')").run(user_id, event_id);
    
    // Send email with pass if it exists
    if (event.pass && user.email) {
      try {
        await emailTransporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: user.email,
          subject: `Registration Pass for ${event.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #6366f1;">Event Registration Confirmed!</h2>
              <p>Hi ${user.full_name},</p>
              <p>You have successfully registered for <strong>${event.title}</strong>.</p>
              <p><strong>Event Details:</strong></p>
              <ul>
                <li><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</li>
                <li><strong>Location:</strong> ${event.location}</li>
                <li><strong>Pass/Ticket:</strong> ${event.pass}</li>
              </ul>
              <p>Please keep this pass safe for entry to the event.</p>
              <p>Best regards,<br>Festora Team</p>
            </div>
          `
        });
      } catch (emailError) {
        console.error('Failed to send registration email:', emailError);
        // Don't fail the registration if email fails
      }
    }
    
    res.json({ success: true, status: 'registered', message: 'Successfully registered' });
  }
});

app.delete("/api/unregister-event/:userId/:eventId", (req, res) => {
  const { userId, eventId } = req.params;
  
  // Check if user is registered
  const registration = db.prepare("SELECT * FROM registrations WHERE user_id = ? AND event_id = ? AND status IN ('registered', 'waitlisted')").get(userId, eventId);
  if (!registration) {
    return res.status(404).json({ error: "Not registered for this event" });
  }
  
  // Remove registration
  db.prepare("DELETE FROM registrations WHERE user_id = ? AND event_id = ?").run(userId, eventId);
  
  // If they were registered (not waitlisted), check if we can promote someone from waitlist
  if (registration.status === 'registered') {
    const event = db.prepare("SELECT capacity FROM events WHERE id = ?").get(eventId);
    const currentRegistrations = db.prepare("SELECT COUNT(*) as count FROM registrations WHERE event_id = ? AND status = 'registered'").get(eventId);
    
    if (event.capacity && currentRegistrations.count < event.capacity) {
      // Promote the first person from waitlist
      const waitlistEntry = db.prepare("SELECT * FROM registrations WHERE event_id = ? AND status = 'waitlisted' ORDER BY timestamp ASC LIMIT 1").get(eventId);
      if (waitlistEntry) {
        db.prepare("UPDATE registrations SET status = 'registered' WHERE id = ?").run(waitlistEntry.id);
      }
    }
  }
  
  res.json({ success: true, message: 'Successfully unregistered' });
});

app.post("/api/save-event", (req, res) => {
  const { user_id, event_id } = req.body;
  db.prepare("INSERT INTO saved_events (user_id, event_id) VALUES (?, ?)").run(user_id, event_id);
  res.json({ success: true });
});

app.get("/api/saved-events/:userId", (req, res) => {
  const events = db.prepare(`
    SELECT events.* FROM events
    JOIN saved_events ON events.id = saved_events.event_id
    WHERE saved_events.user_id = ?
  `).all(req.params.userId);
  res.json(events);
});

// Follows
app.post("/api/follows", (req, res) => {
  const { follower_id, following_id } = req.body;
  try {
    db.prepare("INSERT INTO follows (follower_id, following_id) VALUES (?, ?)").run(follower_id, following_id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Already following" });
  }
});

app.delete("/api/follows/:followerId/:followingId", (req, res) => {
  db.prepare("DELETE FROM follows WHERE follower_id = ? AND following_id = ?").run(req.params.followerId, req.params.followingId);
  res.json({ success: true });
});

app.get("/api/follows/status/:followerId/:followingId", (req, res) => {
  const follow = db.prepare("SELECT * FROM follows WHERE follower_id = ? AND following_id = ?").get(req.params.followerId, req.params.followingId);
  res.json({ isFollowing: !!follow });
});

app.get("/api/follows/counts/:userId", (req, res) => {
  const counts = db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM follows WHERE following_id = ?) as followers,
      (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as following
  `).get(req.params.userId, req.params.userId);
  res.json(counts);
});

app.get("/api/follows/followers/:userId", (req, res) => {
  const followers = db.prepare(`
    SELECT u.id, u.username, u.full_name, u.role, u.bio
    FROM users u
    JOIN follows f ON u.id = f.follower_id
    WHERE f.following_id = ?
  `).all(req.params.userId);
  res.json(followers);
});

app.get("/api/follows/following/:userId", (req, res) => {
  const following = db.prepare(`
    SELECT u.id, u.username, u.full_name, u.role, u.bio
    FROM users u
    JOIN follows f ON u.id = f.following_id
    WHERE f.follower_id = ?
  `).all(req.params.userId);
  res.json(following);
});

// Stories
app.post("/api/stories", (req, res) => {
  const { content_type, content, background_color, text_color, font_size } = req.body;
  const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
  
  const result = db.prepare(`
    INSERT INTO stories (user_id, content_type, content, background_color, text_color, font_size, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run((req as any).user?.id || 1, content_type, content, background_color, text_color, font_size, expires_at.toISOString());
  
  res.json({ id: result.lastInsertRowid });
});

app.get("/api/stories", (req, res) => {
  const userId = req.query.userId || (req as any).user?.id || 1;
  const requester = db.prepare("SELECT role FROM users WHERE id = ?").get(userId);
  
  // Get stories from users this user follows, plus their own stories
  // Exclude admin stories for non-admin users
  const stories = db.prepare(`
    SELECT s.*, u.username, u.full_name, u.avatar_url,
           COUNT(sv.id) as view_count,
           CASE WHEN sv2.viewer_id IS NOT NULL THEN 1 ELSE 0 END as viewed_by_me
    FROM stories s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN story_views sv ON s.id = sv.story_id
    LEFT JOIN story_views sv2 ON s.id = sv2.story_id AND sv2.viewer_id = ?
    WHERE s.expires_at > datetime('now')
    AND (s.user_id = ? OR s.user_id IN (
      SELECT following_id FROM follows WHERE follower_id = ?
    ))
    AND (u.role != 'admin' OR s.user_id = ?)
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `).all(userId, userId, userId, userId);
  
  res.json(stories);
});

app.post("/api/stories/:storyId/view", (req, res) => {
  const viewerId = (req as any).user?.id || 1;
  
  try {
    db.prepare(`
      INSERT OR IGNORE INTO story_views (story_id, viewer_id)
      VALUES (?, ?)
    `).run(req.params.storyId, viewerId);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Already viewed" });
  }
});

app.delete("/api/stories/:storyId", (req, res) => {
  const userId = (req as any).user?.id || 1;
  
  const story = db.prepare("SELECT * FROM stories WHERE id = ? AND user_id = ?").get(req.params.storyId, userId);
  if (!story) {
    return res.status(404).json({ error: "Story not found" });
  }
  
  db.prepare("DELETE FROM story_views WHERE story_id = ?").run(req.params.storyId);
  db.prepare("DELETE FROM stories WHERE id = ?").run(req.params.storyId);
  
  res.json({ success: true });
});

app.get("/api/users/suggestions/:userId", (req, res) => {
  // Suggest users who are in the same college or have similar roll numbers, or are organizers
  const user = db.prepare("SELECT college_name, role FROM users WHERE id = ?").get(req.params.userId);
  const suggestions = db.prepare(`
    SELECT DISTINCT u.id, u.username, u.full_name, u.role, u.avatar_url
    FROM users u
    LEFT JOIN events e ON u.id = e.created_by
    WHERE u.id != ? 
    AND u.id NOT IN (SELECT following_id FROM follows WHERE follower_id = ?)
    AND (u.college_name = ? OR e.id IS NOT NULL)
    AND (u.role != 'admin' OR ? = 'admin')
    LIMIT 10
  `).all(req.params.userId, req.params.userId, user?.college_name, user?.role);
  res.json(suggestions);
});

app.get("/api/registrations/user/:userId", (req, res) => {
  const registrations = db.prepare("SELECT event_id FROM registrations WHERE user_id = ?").all(req.params.userId);
  res.json(registrations.map(r => r.event_id));
});

// Likes
app.post("/api/likes", (req, res) => {
  const { user_id, event_id } = req.body;
  try {
    db.prepare("INSERT INTO likes (user_id, event_id) VALUES (?, ?)").run(user_id, event_id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Already liked" });
  }
});

app.delete("/api/likes/:userId/:eventId", (req, res) => {
  db.prepare("DELETE FROM likes WHERE user_id = ? AND event_id = ?").run(req.params.userId, req.params.eventId);
  res.json({ success: true });
});

app.get("/api/likes/count/:eventId", (req, res) => {
  const count = db.prepare("SELECT COUNT(*) as count FROM likes WHERE event_id = ?").get(req.params.eventId);
  res.json(count);
});

app.get("/api/likes/check/:userId/:eventId", (req, res) => {
  const like = db.prepare("SELECT * FROM likes WHERE user_id = ? AND event_id = ?").get(req.params.userId, req.params.eventId);
  res.json({ liked: !!like });
});

app.get("/api/likes/user/:userId", (req, res) => {
  const likes = db.prepare("SELECT event_id FROM likes WHERE user_id = ?").all(req.params.userId);
  res.json(likes.map(l => l.event_id));
});

// Bookmarks
app.post("/api/bookmarks", (req, res) => {
  const { user_id, event_id } = req.body;
  try {
    db.prepare("INSERT INTO bookmarks (user_id, event_id) VALUES (?, ?)").run(user_id, event_id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Already bookmarked" });
  }
});

app.delete("/api/bookmarks/:userId/:eventId", (req, res) => {
  db.prepare("DELETE FROM bookmarks WHERE user_id = ? AND event_id = ?").run(req.params.userId, req.params.eventId);
  res.json({ success: true });
});

app.get("/api/bookmarks/:userId", (req, res) => {
  const bookmarks = db.prepare(`
    SELECT e.* FROM events e
    JOIN bookmarks b ON e.id = b.event_id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
  `).all(req.params.userId);
  res.json(bookmarks);
});

// Event Reminders
app.post("/api/reminders", (req, res) => {
  const { user_id, event_id, reminder_time } = req.body;
  db.prepare("INSERT INTO event_reminders (user_id, event_id, reminder_time) VALUES (?, ?, ?)").run(user_id, event_id, reminder_time);
  res.json({ success: true });
});

app.get("/api/reminders/:userId", (req, res) => {
  const reminders = db.prepare(`
    SELECT er.*, e.title, e.date
    FROM event_reminders er
    JOIN events e ON er.event_id = e.id
    WHERE er.user_id = ? AND er.is_sent = 0
    ORDER BY er.reminder_time ASC
  `).all(req.params.userId);
  res.json(reminders);
});

// Activity Feed
app.get("/api/activity/:userId", (req, res) => {
  const activity = db.prepare(`
    SELECT a.*, u.full_name, u.avatar_url, e.title as event_title
    FROM activity a
    JOIN users u ON a.user_id = u.id
    LEFT JOIN events e ON a.target_event_id = e.id
    WHERE a.user_id IN (
      SELECT following_id FROM follows WHERE follower_id = ?
    ) OR a.user_id = ?
    ORDER BY a.created_at DESC
    LIMIT 50
  `).all(req.params.userId, req.params.userId);
  res.json(activity);
});

app.post("/api/activity", (req, res) => {
  const { user_id, activity_type, target_user_id, target_event_id } = req.body;
  db.prepare(`
    INSERT INTO activity (user_id, activity_type, target_user_id, target_event_id)
    VALUES (?, ?, ?, ?)
  `).run(user_id, activity_type, target_user_id, target_event_id);
  res.json({ success: true });
});

// Robust delete account endpoint
app.delete("/api/users/:id", (req, res) => {
  try {
    const userId = req.params.id;
    // Only allow self-delete or admin
    const requesterId = req.query.requester || req.headers['x-requester-id'];
    let requester = null;
    if (requesterId) {
      requester = db.prepare("SELECT * FROM users WHERE id = ?").get(requesterId);
    }
    if (!requester || (requester.id != userId && requester.role !== 'admin')) {
      return res.status(403).json({ error: "Not authorized to delete this account" });
    }
    db.prepare("DELETE FROM club_members WHERE user_id = ?").run(userId);
    db.prepare("UPDATE clubs SET president_id = NULL WHERE president_id = ?").run(userId);
    db.prepare("DELETE FROM club_follows WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM likes WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM bookmarks WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM registrations WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM comments WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM follows WHERE follower_id = ? OR following_id = ?").run(userId, userId);
    db.prepare("DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?").run(userId, userId);
    db.prepare("DELETE FROM notifications WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM reminders WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM event_reminders WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM saved_events WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM story_views WHERE viewer_id = ?").run(userId);
    db.prepare("DELETE FROM stories WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM activity WHERE user_id = ? OR target_user_id = ?").run(userId, userId);
    db.prepare("DELETE FROM role_requests WHERE requester_id = ? OR target_user_id = ?").run(userId, userId);
    db.prepare("DELETE FROM password_reset_tokens WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM users WHERE id = ?").run(userId);
    res.json({ success: true });
  } catch (e) {
    console.error('Delete account error:', e);
    res.status(500).json({ error: "Failed to delete account", details: e.message });
  }
});


// Background task for reminders
setInterval(() => {
  try {
    const now = new Date().toISOString();
    const dueReminders = db.prepare(`
      SELECT r.*, e.title 
      FROM reminders r 
      JOIN events e ON r.event_id = e.id 
      WHERE r.remind_at <= ? AND r.is_triggered = 0
    `).all(now);
    
    for (const reminder of dueReminders) {
      try {
        db.prepare("INSERT INTO notifications (user_id, content, type) VALUES (?, ?, ?)").run([
          reminder.user_id,
          `Reminder: The event "${reminder.title}" starts in 1 hour!`,
          'reminder'
        ]);
        db.prepare("UPDATE reminders SET is_triggered = 1 WHERE id = ?").run(reminder.id);
      } catch (err) {
        console.error('Reminder processing error:', err);
      }
    }
  } catch (err) {
    console.error('Reminder check error:', err);
  }
}, 60000); // Check every minute

// Start server

// 🔎 DEBUG: check if dist/index.html exists on Render
app.get("/__debug", (req, res) => {
  const distPath = path.join(process.cwd(), "dist");
  const fs = require("fs");
  const exists = fs.existsSync(path.join(distPath, "index.html"));

  res.json({
    cwd: process.cwd(),
    __dirname,
    distPath,
    hasIndexHtml: exists,
    filesInDist: fs.existsSync(distPath) ? fs.readdirSync(distPath) : [],
  });
});

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(process.cwd(), "dist");

  console.log("Serving dist from:", distPath);
  console.log("index.html exists?", fs.existsSync(path.join(distPath, "index.html")));

  app.use(express.static(distPath));

  // SPA fallback (MUST be AFTER /__debug)
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Start server LAST
const PORT = parseInt(process.env.PORT || '5000', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Festora server running on port ${PORT}`);
});
