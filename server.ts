import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables FIRST
dotenv.config({ path: path.join(__dirname, '.env') });

import express from "express";
import fs from "fs";
import nodemailer from "nodemailer";
import crypto from "crypto";
import util from "util";
import { pool, query, queryOne, execute } from "./src/db.js";

// Initialize Database
// Initialize Database Schema
async function initializeDatabase() {
  try {
    // Create tables with PostgreSQL syntax
    await execute(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE,
        email VARCHAR(255) UNIQUE,
        phone_number VARCHAR(20) UNIQUE,
        password VARCHAR(255),
        role VARCHAR(50) DEFAULT 'student',
        full_name VARCHAR(255),
        bio TEXT,
        social_links TEXT,
        avatar_url TEXT,
        college_name VARCHAR(255),
        roll_no VARCHAR(50),
        UNIQUE(college_name, roll_no)
      )
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        description TEXT,
        image_url TEXT,
        date VARCHAR(50),
        location VARCHAR(255),
        category VARCHAR(50) DEFAULT 'Social',
        club_id INTEGER,
        created_by INTEGER,
        views INTEGER DEFAULT 0,
        privacy VARCHAR(50) DEFAULT 'social',
        college_code VARCHAR(50),
        capacity INTEGER,
        pass VARCHAR(255),
        qr_code TEXT,
        FOREIGN KEY(created_by) REFERENCES users(id)
      )
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        event_id INTEGER,
        user_id INTEGER,
        content TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(event_id) REFERENCES events(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS registrations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        event_id INTEGER,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'registered',
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(event_id) REFERENCES events(id)
      )
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS waitlist (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        event_id INTEGER,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(event_id) REFERENCES events(id)
      )
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS role_requests (
        id SERIAL PRIMARY KEY,
        requester_id INTEGER,
        target_user_id INTEGER,
        requested_role VARCHAR(50),
        status VARCHAR(50) DEFAULT 'pending',
        FOREIGN KEY(requester_id) REFERENCES users(id),
        FOREIGN KEY(target_user_id) REFERENCES users(id)
      )
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER,
        receiver_id INTEGER,
        content TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(sender_id) REFERENCES users(id),
        FOREIGN KEY(receiver_id) REFERENCES users(id)
      )
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS saved_events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        event_id INTEGER,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(event_id) REFERENCES events(id)
      )
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        content TEXT,
        type VARCHAR(50),
        is_read INTEGER DEFAULT 0,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        scheduled_at TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS reminders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        event_id INTEGER,
        remind_at TIMESTAMP,
        is_triggered INTEGER DEFAULT 0,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(event_id) REFERENCES events(id)
      )
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS follows (
        id SERIAL PRIMARY KEY,
        follower_id INTEGER,
        following_id INTEGER,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(follower_id) REFERENCES users(id),
        FOREIGN KEY(following_id) REFERENCES users(id),
        UNIQUE(follower_id, following_id)
      )
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS stories (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        content_type VARCHAR(50),
        content TEXT,
        background_color VARCHAR(7) DEFAULT '#000000',
        text_color VARCHAR(7) DEFAULT '#FFFFFF',
        font_size VARCHAR(50) DEFAULT 'medium',
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS story_views (
        id SERIAL PRIMARY KEY,
        story_id INTEGER,
        viewer_id INTEGER,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(story_id) REFERENCES stories(id),
        FOREIGN KEY(viewer_id) REFERENCES users(id),
        UNIQUE(story_id, viewer_id)
      )
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        event_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(event_id) REFERENCES events(id),
        UNIQUE(user_id, event_id)
      )
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        event_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(event_id) REFERENCES events(id),
        UNIQUE(user_id, event_id)
      )
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS event_reminders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        event_id INTEGER,
        reminder_time TIMESTAMP,
        is_sent INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(event_id) REFERENCES events(id)
      )
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS activity (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        activity_type VARCHAR(50),
        target_user_id INTEGER,
        target_event_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(target_user_id) REFERENCES users(id),
        FOREIGN KEY(target_event_id) REFERENCES events(id)
      )
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        token VARCHAR(255) UNIQUE,
        expires_at TIMESTAMP,
        used INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS clubs (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE,
        description TEXT,
        logo_url TEXT,
        president_id INTEGER,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(president_id) REFERENCES users(id),
        FOREIGN KEY(created_by) REFERENCES users(id)
      )
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS club_members (
        id SERIAL PRIMARY KEY,
        club_id INTEGER,
        user_id INTEGER,
        role VARCHAR(50) DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(club_id, user_id),
        FOREIGN KEY(club_id) REFERENCES clubs(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS club_follows (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        club_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(club_id) REFERENCES clubs(id),
        UNIQUE(user_id, club_id)
      )
    `);

    console.log('Database schema initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

// Initialize database on startup (async, non-blocking)
initializeDatabase().catch(err => {
  console.error('Database initialization failed, but server will continue:', err.message);
});


// Cleanup expired stories periodically  
setInterval(async () => {
  try {
    const result = await execute("DELETE FROM stories WHERE expires_at <= NOW()");
    if (result > 0) {
      console.log(`Cleaned up ${result} expired stories`);
    }
  } catch (e) {
    console.error('Error cleaning up expired stories:', e);
  }
}, 60 * 60 * 1000); // Run every hour


// Express app initialization must come before all route definitions
const app = express();
app.use(express.json());

// Club Follows
app.post("/api/club-follows", async (req, res) => {
  const { user_id, club_id } = req.body;
  try {
    await execute("INSERT INTO club_follows (user_id, club_id) VALUES ($1, $2)", [user_id, club_id]);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Already following" });
  }
});

app.delete("/api/club-follows/:userId/:clubId", async (req, res) => {
  await execute("DELETE FROM club_follows WHERE user_id = $1 AND club_id = $2", [req.params.userId, req.params.clubId]);
  res.json({ success: true });
});

app.get("/api/club-follows/status/:userId/:clubId", async (req, res) => {
  const follow = await queryOne("SELECT * FROM club_follows WHERE user_id = $1 AND club_id = $2", [req.params.userId, req.params.clubId]);
  res.json({ isFollowing: !!follow });
});

app.get("/api/club-follows/count/:clubId", async (req, res) => {
  const count = await queryOne("SELECT COUNT(*) as count FROM club_follows WHERE club_id = $1", [req.params.clubId]);
  res.json(count);
});

// Add qr_code column to events table if it doesn't exist
try {
  await execute(`ALTER TABLE events ADD COLUMN qr_code TEXT`);
} catch (err: any) {
  if (!err.message.includes('duplicate column')) console.error(err);
}

try {
  const row = await queryOne("SELECT * FROM users WHERE role = 'admin'");
  if (!row) {
    await execute("INSERT INTO users (username, password, role, full_name) VALUES ($1, $2, $3, $4)", [
      "admin", "admin123", "admin", "System Administrator"
    ]);
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
app.post("/api/login", async (req, res) => {
  const { identifier, password } = req.body;
  // identifier can be username, email, or phone_number
  const user = await queryOne(`
    SELECT * FROM users 
    WHERE (username = $1 OR email = $1 OR phone_number = $1) 
    AND password = $2
  `, [identifier, password]);
  
  if (user) {
    res.json(user);
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.post("/api/register", async (req, res) => {
  const { username, email, phone_number, password, full_name, avatar_url, college_name, roll_no } = req.body;

  // Check if roll number already exists for this college
  const existingRollNo = await queryOne("SELECT id FROM users WHERE college_name = $1 AND roll_no = $2", [college_name, roll_no]);
  if (existingRollNo) {
    return res.status(400).json({ error: "A student with this roll number already exists in your college" });
  }

  try {
    const result = await queryOne(
      "INSERT INTO users (username, email, phone_number, password, full_name, avatar_url, college_name, roll_no, role) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id",
      [username, email, phone_number, password, full_name, avatar_url, college_name, roll_no, 'student']
    );
    const user = await queryOne("SELECT * FROM users WHERE id = $1", [result.id]);

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
    if (e.message.includes("UNIQUE constraint failed") || e.message.includes("duplicate key")) {
      res.status(400).json({ error: "Username, Email, or Phone already exists" });
    } else {
      res.status(500).json({ error: "Registration failed" });
    }
  }
});

app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;
  
  const user = await queryOne("SELECT * FROM users WHERE email = $1", [email]);
  if (!user) {
    return res.status(404).json({ error: "No account found with this email address" });
  }
  
  // Generate reset token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
  
  // Save token to database
  await execute("INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)", [user.id, token, expiresAt.toISOString()]);
  
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

app.post("/api/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  
  // Find valid token
  const resetToken = await queryOne("SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW() AND used = 0", [token]);
  if (!resetToken) {
    return res.status(400).json({ error: "Invalid or expired reset token" });
  }
  
  // Update password
  await execute("UPDATE users SET password = $1 WHERE id = $2", [newPassword, resetToken.user_id]);
  
  // Mark token as used
  await execute("UPDATE password_reset_tokens SET used = 1 WHERE id = $1", [resetToken.id]);
  
  res.json({ message: "Password reset successfully" });
});

// Club Management Routes
app.post("/api/clubs", async (req, res) => {
  const { name, description, logo_url, president_id, user_id } = req.body;
  
  // Only student president or admin can create clubs
  const requester = await queryOne("SELECT role FROM users WHERE id = $1", [user_id]);
  if (!requester || (requester.role !== 'student_president' && requester.role !== 'admin')) {
    return res.status(403).json({ error: "Only student president can create clubs" });
  }
  
  try {
    await execute("INSERT INTO clubs (name, description, logo_url, president_id, created_by) VALUES ($1, $2, $3, $4, $5)", [
      name, description, logo_url, president_id, user_id
    ]);
    
    // Add president as club member
    const club = await queryOne("SELECT id FROM clubs WHERE name = $1", [name]);
    await execute("INSERT INTO club_members (club_id, user_id, role) VALUES ($1, $2, $3)", [club.id, president_id, 'president']);
    
    // Update user role to club_president if not already
    await execute("UPDATE users SET role = 'club_president' WHERE id = $1", [president_id]);
    
    res.json({ message: "Club created successfully", club });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/clubs", async (req, res) => {
  const clubs = await query("SELECT * FROM clubs", []);
  res.json(clubs);
});

app.get("/api/clubs/:id", async (req, res) => {
  const club = await queryOne("SELECT * FROM clubs WHERE id = $1", [req.params.id]);
  if (!club) {
    return res.status(404).json({ error: "Club not found" });
  }
  res.json(club);
});

app.post("/api/clubs/:id/members", async (req, res) => {
  const { user_id, member_id, role } = req.body;
  const clubId = req.params.id;
  
  // Check if requester is club president
  const club = await queryOne("SELECT president_id FROM clubs WHERE id = $1", [clubId]);
  if (!club || club.president_id !== user_id) {
    return res.status(403).json({ error: "Only club president can add members" });
  }
  
  try {
    await execute("INSERT INTO club_members (club_id, user_id, role) VALUES ($1, $2, $3)", [
      clubId, member_id, role || 'member'
    ]);
    res.json({ message: "Member added successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/clubs/:id/members", async (req, res) => {
  const members = await query("SELECT u.id, u.username, u.full_name, u.avatar_url, cm.role FROM club_members cm JOIN users u ON cm.user_id = u.id WHERE cm.club_id = $1", [req.params.id]);
  res.json(members);
});

app.get("/api/users/:id/clubs", async (req, res) => {
  const clubs = await query("SELECT c.* FROM clubs c JOIN club_members cm ON c.id = cm.club_id WHERE cm.user_id = $1", [req.params.id]);
  res.json(clubs);
});

app.get("/api/check-rollno", async (req, res) => {
  const { college, rollno } = req.query;
  const existing = await queryOne("SELECT id FROM users WHERE college_name = $1 AND roll_no = $2", [college, rollno]);
  res.json({ exists: !!existing });
});

app.post("/api/users/:id/profile", async (req, res) => {
  const { bio, social_links, avatar_url, college_name, roll_no } = req.body;
  
  // Check if roll number is already taken by another user in the same college
  if (college_name && roll_no) {
    const existing = await queryOne("SELECT id FROM users WHERE college_name = $1 AND roll_no = $2 AND id != $3", [college_name, roll_no, req.params.id]);
    if (existing) {
      return res.status(400).json({ error: "A student with this roll number already exists in your college" });
    }
  }
  
  await execute("UPDATE users SET bio = $1, social_links = $2, avatar_url = $3, college_name = $4, roll_no = $5 WHERE id = $6", [
    bio, 
    JSON.stringify(social_links), 
    avatar_url,
    college_name,
    roll_no,
    req.params.id
  ]);
  res.json({ success: true });
});

// Event Routes
app.get("/api/events/user/:id/count", async (req, res) => {
  const count = await queryOne("SELECT COUNT(*) as count FROM events WHERE created_by = $1", [req.params.id]);
  res.json(count);
});


// Get events, filter private events by college code if provided
app.get("/api/events", async (req, res) => {
  const { college_code } = req.query;
  let events;
  if (college_code) {
    events = await query(`
      SELECT events.*, users.full_name as organizer_name,
      (SELECT COUNT(*) FROM registrations WHERE event_id = events.id) as registration_count,
      (SELECT COUNT(*) FROM comments WHERE event_id = events.id) as comment_count
      FROM events 
      JOIN users ON events.created_by = users.id
      WHERE (events.privacy = 'social') OR (events.privacy = 'private' AND events.college_code = $1)
      ORDER BY events.id DESC
    `, [college_code]);
  } else {
    events = await query(`
      SELECT events.*, users.full_name as organizer_name,
      (SELECT COUNT(*) FROM registrations WHERE event_id = events.id) as registration_count,
      (SELECT COUNT(*) FROM comments WHERE event_id = events.id) as comment_count
      FROM events 
      JOIN users ON events.created_by = users.id
      WHERE events.privacy = 'social'
      ORDER BY events.id DESC
    `, []);
  }
  res.json(events);
});

app.post("/api/events/:id/view", async (req, res) => {
  await execute("UPDATE events SET views = views + 1 WHERE id = $1", [req.params.id]);
  res.json({ success: true });
});

// Comment Routes
app.get("/api/events/:eventId/comments", async (req, res) => {
  const comments = await query(`
    SELECT comments.*, users.username, users.full_name 
    FROM comments 
    JOIN users ON comments.user_id = users.id
    WHERE event_id = $1
    ORDER BY timestamp ASC
  `, [req.params.eventId]);
  res.json(comments);
});

app.post("/api/comments", async (req, res) => {
  const { event_id, user_id, content } = req.body;
  await execute("INSERT INTO comments (event_id, user_id, content) VALUES ($1, $2, $3)", [
    event_id, user_id, content
  ]);
  res.json({ success: true });
});

// Analytics
app.get("/api/analytics/global", async (req, res) => {
  const stats = await queryOne(`
    SELECT 
      (SELECT COUNT(*) FROM users) as total_users,
      (SELECT COUNT(*) FROM events) as total_events,
      (SELECT COUNT(*) FROM registrations) as total_registrations,
      (SELECT SUM(views) FROM events) as total_views
  `, []);
  
  const recentActivity = await query(`
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
  `, []);

  res.json({ stats, recentActivity });
});

app.get("/api/analytics/:userId", async (req, res) => {
  const stats = await queryOne(`
    SELECT 
      COUNT(e.id) as total_events,
      SUM(e.views) as total_views,
      (SELECT COUNT(*) FROM registrations r JOIN events e2 ON r.event_id = e2.id WHERE e2.created_by = $1) as total_registrations
    FROM events e
    WHERE e.created_by = $2
  `, [req.params.userId, req.params.userId]);
  
  const eventBreakdown = await query(`
    SELECT 
      title, 
      views, 
      (SELECT COUNT(*) FROM registrations WHERE event_id = events.id) as registrations
    FROM events
    WHERE created_by = $1
  `, [req.params.userId]);

  res.json({ stats, eventBreakdown });
});


app.post("/api/events", async (req, res) => {
  const { title, description, image_url, date, location, category, created_by, privacy, college_code, club_id, pass } = req.body;
  if (!title || !description || !date || !location) {
    return res.status(400).json({ error: "All fields are required" });
  }
  const eventPrivacy = privacy === 'private' ? 'private' : 'social';
  const eventCollegeCode = eventPrivacy === 'private' ? (college_code || null) : null;
  const result = await queryOne("INSERT INTO events (title, description, image_url, date, location, category, created_by, privacy, college_code, club_id, pass) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id", [
    title, description, image_url, date, location, category || 'Social', created_by, eventPrivacy, eventCollegeCode, club_id || null, pass || null
  ]);
  res.json({ id: result.id });
});

app.put("/api/events/:id", async (req, res) => {
  const { title, description, image_url, date, location, category, privacy, college_code, pass } = req.body;
  if (!title || !description || !date || !location) {
    return res.status(400).json({ error: "All fields are required" });
  }
  const eventPrivacy = privacy === 'private' ? 'private' : 'social';
  const eventCollegeCode = eventPrivacy === 'private' ? (college_code || null) : null;
  await execute("UPDATE events SET title = $1, description = $2, image_url = $3, date = $4, location = $5, category = $6, privacy = $7, college_code = $8, pass = $9 WHERE id = $10", [
    title, description, image_url, date, location, category, eventPrivacy, eventCollegeCode, pass || null, req.params.id
  ]);
  res.json({ success: true });
});

// Role Management
app.get("/api/users/search", async (req, res) => {
  const searchQuery = req.query.q as string;
  const users = await query("SELECT id, username, full_name, avatar_url FROM users WHERE username ILIKE $1 OR full_name ILIKE $2 LIMIT 10", [`%${searchQuery}%`, `%${searchQuery}%`]);
  res.json(users);
});

app.get("/api/users", async (req, res) => {
  // Get requester id from query or header
  const requesterId = req.query.requester || req.headers['x-requester-id'];
  if (!requesterId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    const requester = await queryOne("SELECT role FROM users WHERE id = $1", [requesterId]);
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }
    const users = await query("SELECT id, username, full_name, role FROM users", []);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await queryOne("SELECT id, username, full_name, role, bio, social_links, avatar_url, college_name, roll_no FROM users WHERE id = $1", [req.params.id]);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Get requester id from query or header (for demo, allow ?requester=ID)
    const requesterId = req.query.requester || req.headers['x-requester-id'];
    let requester = null;
    if (requesterId) {
      requester = await queryOne("SELECT * FROM users WHERE id = $1", [requesterId]);
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
    const result = await queryOne("INSERT INTO role_requests (requester_id, target_user_id, requested_role) VALUES ($1, $2, $3) RETURNING id", [
      requester_id, target_user_id, requested_role]);
    
    // Get user details for email
    const requester = await queryOne("SELECT full_name FROM users WHERE id = $1", [requester_id]);
    const targetUser = await queryOne("SELECT email, full_name FROM users WHERE id = $1", [target_user_id]);
    
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
    
    res.json({ id: result.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/role-requests/:userId", async (req, res) => {
  try {
    const requests = await query(`
      SELECT role_requests.*, u1.full_name as requester_name, u2.full_name as target_name
      FROM role_requests
      JOIN users u1 ON role_requests.requester_id = u1.id
      JOIN users u2 ON role_requests.target_user_id = u2.id
      WHERE role_requests.target_user_id = $1 OR (
        SELECT role FROM users WHERE id = $2
      ) IN ('admin', 'council_president', 'club_president')
    `, [req.params.userId, req.params.userId]);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/role-requests/approve", async (req, res) => {
  const { requestId } = req.body;
  try {
    const request = await queryOne("SELECT * FROM role_requests WHERE id = $1", [requestId]);
    if (request) {
      await execute("UPDATE users SET role = $1 WHERE id = $2", [request.requested_role, request.target_user_id]);
      await execute("UPDATE role_requests SET status = 'approved' WHERE id = $1", [requestId]);
      
      // Create notification
      await execute("INSERT INTO notifications (user_id, content, type) VALUES ($1, $2, $3)", [
        request.target_user_id,
        `Your request for ${request.requested_role.replace('_', ' ')} has been approved!`,
        'role_update'
      ]);
      
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Request not found" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/role-requests/reject", async (req, res) => {
  const { requestId } = req.body;
  const request = await queryOne("SELECT * FROM role_requests WHERE id = $1", [requestId]);
  if (request) {
    await execute("UPDATE role_requests SET status = 'rejected' WHERE id = $1", [requestId]);
    
    // Create notification
    await execute("INSERT INTO notifications (user_id, content, type) VALUES ($1, $2, $3)", [
      request.target_user_id,
      `Your request for ${request.requested_role.replace('_', ' ')} has been rejected.`,
      'role_update'
    ]);
    
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Request not found" });
  }
});

// Notifications
app.get("/api/notifications/:userId", async (req, res) => {
  const notifications = await query("SELECT * FROM notifications WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 20", [req.params.userId]);
  res.json(notifications);
});

app.post("/api/notifications/:id/read", async (req, res) => {
  await execute("UPDATE notifications SET is_read = 1 WHERE id = $1", [req.params.id]);
  res.json({ success: true });
});

// Messaging
app.get("/api/messages/contacts/:userId", async (req, res) => {
  // Contacts are people you follow AND who follow you (mutuals) or just people you follow?
  // Instagram allows messaging anyone you follow, or mutuals. Let's go with mutuals or following for simplicity.
  // User request: "messages can only be for followers and following"
  const contacts = await query(`
    SELECT DISTINCT u.id, u.username, u.full_name, u.role
    FROM users u
    WHERE u.id IN (
      SELECT following_id FROM follows WHERE follower_id = $1
      UNION
      SELECT follower_id FROM follows WHERE following_id = $2
    )
  `, [req.params.userId, req.params.userId]);
  res.json(contacts);
});

app.get("/api/messages/:userId/:otherId", async (req, res) => {
  const messages = await query(`
    SELECT * FROM messages 
    WHERE (sender_id = $1 AND receiver_id = $2) 
    OR (sender_id = $3 AND receiver_id = $4)
    ORDER BY timestamp ASC
  `, [req.params.userId, req.params.otherId, req.params.otherId, req.params.userId]);
  res.json(messages);
});

app.post("/api/messages", async (req, res) => {
  const { sender_id, receiver_id, content } = req.body;
  await execute("INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3)", [
    sender_id, receiver_id, content
  ]);
  res.json({ success: true });
});

// Registrations & Saves
app.post("/api/register-event", async (req, res) => {
  const { user_id, event_id } = req.body;
  
  // Check if user is already registered or waitlisted
  const existingReg = await queryOne("SELECT * FROM registrations WHERE user_id = $1 AND event_id = $2 AND status IN ('registered', 'waitlisted')", [user_id, event_id]);
  if (existingReg) {
    return res.status(400).json({ error: "Already registered or waitlisted for this event" });
  }
  
  // Get event details and user email
  const event = await queryOne("SELECT * FROM events WHERE id = $1", [event_id]);
  const user = await queryOne("SELECT email, full_name FROM users WHERE id = $1", [user_id]);
  const currentRegistrations = await queryOne("SELECT COUNT(*) as count FROM registrations WHERE event_id = $1 AND status = 'registered'", [event_id]);
  
  if (event.capacity && currentRegistrations.count >= event.capacity) {
    // Event is full, add to waitlist
    await execute("INSERT INTO registrations (user_id, event_id, status) VALUES ($1, $2, 'waitlisted')", [user_id, event_id]);
    res.json({ success: true, status: 'waitlisted', message: 'Added to waitlist' });
  } else {
    // Register normally
    await execute("INSERT INTO registrations (user_id, event_id, status) VALUES ($1, $2, 'registered')", [user_id, event_id]);
    
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

app.delete("/api/unregister-event/:userId/:eventId", async (req, res) => {
  const { userId, eventId } = req.params;
  
  // Check if user is registered
  const registration = await queryOne("SELECT * FROM registrations WHERE user_id = $1 AND event_id = $2 AND status IN ('registered', 'waitlisted')", [userId, eventId]);
  if (!registration) {
    return res.status(404).json({ error: "Not registered for this event" });
  }
  
  // Remove registration
  await execute("DELETE FROM registrations WHERE user_id = $1 AND event_id = $2", [userId, eventId]);
  
  // If they were registered (not waitlisted), check if we can promote someone from waitlist
  if (registration.status === 'registered') {
    const event = await queryOne("SELECT capacity FROM events WHERE id = $1", [eventId]);
    const currentRegistrations = await queryOne("SELECT COUNT(*) as count FROM registrations WHERE event_id = $1 AND status = 'registered'", [eventId]);
    
    if (event.capacity && currentRegistrations.count < event.capacity) {
      // Promote the first person from waitlist
      const waitlistEntry = await queryOne("SELECT * FROM registrations WHERE event_id = $1 AND status = 'waitlisted' ORDER BY timestamp ASC LIMIT 1", [eventId]);
      if (waitlistEntry) {
        await execute("UPDATE registrations SET status = 'registered' WHERE id = $1", [waitlistEntry.id]);
      }
    }
  }
  
  res.json({ success: true, message: 'Successfully unregistered' });
});

app.post("/api/save-event", async (req, res) => {
  const { user_id, event_id } = req.body;
  await execute("INSERT INTO saved_events (user_id, event_id) VALUES ($1, $2)", [user_id, event_id]);
  res.json({ success: true });
});

app.get("/api/saved-events/:userId", async (req, res) => {
  const events = await query(`
    SELECT events.* FROM events
    JOIN saved_events ON events.id = saved_events.event_id
    WHERE saved_events.user_id = $1
  `, [req.params.userId]);
  res.json(events);
});

// Follows
app.post("/api/follows", async (req, res) => {
  const { follower_id, following_id } = req.body;
  try {
    await execute("INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)", [follower_id, following_id]);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Already following" });
  }
});

app.delete("/api/follows/:followerId/:followingId", async (req, res) => {
  await execute("DELETE FROM follows WHERE follower_id = $1 AND following_id = $2", [req.params.followerId, req.params.followingId]);
  res.json({ success: true });
});

app.get("/api/follows/status/:followerId/:followingId", async (req, res) => {
  const follow = await queryOne("SELECT * FROM follows WHERE follower_id = $1 AND following_id = $2", [req.params.followerId, req.params.followingId]);
  res.json({ isFollowing: !!follow });
});

app.get("/api/follows/counts/:userId", async (req, res) => {
  const counts = await queryOne(`
    SELECT 
      (SELECT COUNT(*) FROM follows WHERE following_id = $1) as followers,
      (SELECT COUNT(*) FROM follows WHERE follower_id = $2) as following
  `, [req.params.userId, req.params.userId]);
  res.json(counts);
});

app.get("/api/follows/followers/:userId", async (req, res) => {
  const followers = await query(`
    SELECT u.id, u.username, u.full_name, u.role, u.bio
    FROM users u
    JOIN follows f ON u.id = f.follower_id
    WHERE f.following_id = $1
  `, [req.params.userId]);
  res.json(followers);
});

app.get("/api/follows/following/:userId", async (req, res) => {
  const following = await query(`
    SELECT u.id, u.username, u.full_name, u.role, u.bio
    FROM users u
    JOIN follows f ON u.id = f.following_id
    WHERE f.follower_id = $1
  `, [req.params.userId]);
  res.json(following);
});

// Stories
app.post("/api/stories", async (req, res) => {
  const { content_type, content, background_color, text_color, font_size } = req.body;
  const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
  
  const result = await queryOne(`
    INSERT INTO stories (user_id, content_type, content, background_color, text_color, font_size, expires_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id
  `, [(req as any).user?.id || 1, content_type, content, background_color, text_color, font_size, expires_at.toISOString()]);
  
  res.json({ id: result.id });
});

app.get("/api/stories", async (req, res) => {
  const userId = req.query.userId || (req as any).user?.id || 1;
  const requester = await queryOne("SELECT role FROM users WHERE id = $1", [userId]);
  
  // Get stories from users this user follows, plus their own stories
  // Exclude admin stories for non-admin users
  const stories = await query(`
    SELECT s.*, u.username, u.full_name, u.avatar_url,
           COUNT(sv.id) as view_count,
           CASE WHEN sv2.viewer_id IS NOT NULL THEN 1 ELSE 0 END as viewed_by_me
    FROM stories s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN story_views sv ON s.id = sv.story_id
    LEFT JOIN story_views sv2 ON s.id = sv2.story_id AND sv2.viewer_id = $1
    WHERE s.expires_at > NOW()
    AND (s.user_id = $2 OR s.user_id IN (
      SELECT following_id FROM follows WHERE follower_id = $3
    ))
    AND (u.role != 'admin' OR s.user_id = $4)
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `, [userId, userId, userId, userId]);
  
  res.json(stories);
});

app.post("/api/stories/:storyId/view", async (req, res) => {
  const viewerId = (req as any).user?.id || 1;
  
  try {
    // PostgreSQL doesn't have INSERT OR IGNORE, use INSERT ... ON CONFLICT
    await execute(`
      INSERT INTO story_views (story_id, viewer_id)
      VALUES ($1, $2)
      ON CONFLICT (story_id, viewer_id) DO NOTHING
    `, [req.params.storyId, viewerId]);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Already viewed" });
  }
});

app.delete("/api/stories/:storyId", async (req, res) => {
  const userId = (req as any).user?.id || 1;
  
  const story = await queryOne("SELECT * FROM stories WHERE id = $1 AND user_id = $2", [req.params.storyId, userId]);
  if (!story) {
    return res.status(404).json({ error: "Story not found" });
  }
  
  await execute("DELETE FROM story_views WHERE story_id = $1", [req.params.storyId]);
  await execute("DELETE FROM stories WHERE id = $1", [req.params.storyId]);
  
  res.json({ success: true });
});

app.get("/api/users/suggestions/:userId", async (req, res) => {
  // Suggest users who are in the same college or have similar roll numbers, or are organizers
  const user = await queryOne("SELECT college_name, role FROM users WHERE id = $1", [req.params.userId]);
  const suggestions = await query(`
    SELECT DISTINCT u.id, u.username, u.full_name, u.role, u.avatar_url
    FROM users u
    LEFT JOIN events e ON u.id = e.created_by
    WHERE u.id != $1 
    AND u.id NOT IN (SELECT following_id FROM follows WHERE follower_id = $2)
    AND (u.college_name = $3 OR e.id IS NOT NULL)
    AND (u.role != 'admin' OR $4 = 'admin')
    LIMIT 10
  `, [req.params.userId, req.params.userId, user?.college_name, user?.role]);
  res.json(suggestions);
});

app.get("/api/registrations/user/:userId", async (req, res) => {
  const registrations = await query("SELECT event_id FROM registrations WHERE user_id = $1", [req.params.userId]);
  res.json(registrations.map((r: any) => r.event_id));
});

// Likes
app.post("/api/likes", async (req, res) => {
  const { user_id, event_id } = req.body;
  try {
    await execute("INSERT INTO likes (user_id, event_id) VALUES ($1, $2)", [user_id, event_id]);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Already liked" });
  }
});

app.delete("/api/likes/:userId/:eventId", async (req, res) => {
  await execute("DELETE FROM likes WHERE user_id = $1 AND event_id = $2", [req.params.userId, req.params.eventId]);
  res.json({ success: true });
});

app.get("/api/likes/count/:eventId", async (req, res) => {
  const count = await queryOne("SELECT COUNT(*) as count FROM likes WHERE event_id = $1", [req.params.eventId]);
  res.json(count);
});

app.get("/api/likes/check/:userId/:eventId", async (req, res) => {
  const like = await queryOne("SELECT * FROM likes WHERE user_id = $1 AND event_id = $2", [req.params.userId, req.params.eventId]);
  res.json({ liked: !!like });
});

app.get("/api/likes/user/:userId", async (req, res) => {
  const likes = await query("SELECT event_id FROM likes WHERE user_id = $1", [req.params.userId]);
  res.json(likes.map((l: any) => l.event_id));
});

// Bookmarks
app.post("/api/bookmarks", async (req, res) => {
  const { user_id, event_id } = req.body;
  try {
    await execute("INSERT INTO bookmarks (user_id, event_id) VALUES ($1, $2)", [user_id, event_id]);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Already bookmarked" });
  }
});

app.delete("/api/bookmarks/:userId/:eventId", async (req, res) => {
  await execute("DELETE FROM bookmarks WHERE user_id = $1 AND event_id = $2", [req.params.userId, req.params.eventId]);
  res.json({ success: true });
});

app.get("/api/bookmarks/:userId", async (req, res) => {
  const bookmarks = await query(`
    SELECT e.* FROM events e
    JOIN bookmarks b ON e.id = b.event_id
    WHERE b.user_id = $1
    ORDER BY b.created_at DESC
  `, [req.params.userId]);
  res.json(bookmarks);
});

// Event Reminders
app.post("/api/reminders", async (req, res) => {
  const { user_id, event_id, reminder_time } = req.body;
  await execute("INSERT INTO event_reminders (user_id, event_id, reminder_time) VALUES ($1, $2, $3)", [user_id, event_id, reminder_time]);
  res.json({ success: true });
});

app.get("/api/reminders/:userId", async (req, res) => {
  const reminders = await query(`
    SELECT er.*, e.title, e.date
    FROM event_reminders er
    JOIN events e ON er.event_id = e.id
    WHERE er.user_id = $1 AND er.is_sent = 0
    ORDER BY er.reminder_time ASC
  `, [req.params.userId]);
  res.json(reminders);
});

// Activity Feed
app.get("/api/activity/:userId", async (req, res) => {
  const activity = await query(`
    SELECT a.*, u.full_name, u.avatar_url, e.title as event_title
    FROM activity a
    JOIN users u ON a.user_id = u.id
    LEFT JOIN events e ON a.target_event_id = e.id
    WHERE a.user_id IN (
      SELECT following_id FROM follows WHERE follower_id = $1
    ) OR a.user_id = $2
    ORDER BY a.created_at DESC
    LIMIT 50
  `, [req.params.userId, req.params.userId]);
  res.json(activity);
});

app.post("/api/activity", async (req, res) => {
  const { user_id, activity_type, target_user_id, target_event_id } = req.body;
  await execute(`
    INSERT INTO activity (user_id, activity_type, target_user_id, target_event_id)
    VALUES ($1, $2, $3, $4)
  `, [user_id, activity_type, target_user_id, target_event_id]);
  res.json({ success: true });
});

// Robust delete account endpoint
app.delete("/api/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    // Only allow self-delete or admin
    const requesterId = req.query.requester || req.headers['x-requester-id'];
    let requester = null;
    if (requesterId) {
      requester = await queryOne("SELECT * FROM users WHERE id = $1", [requesterId]);
    }
    if (!requester || (requester.id != userId && requester.role !== 'admin')) {
      return res.status(403).json({ error: "Not authorized to delete this account" });
    }
    await execute("DELETE FROM club_members WHERE user_id = $1", [userId]);
    await execute("UPDATE clubs SET president_id = NULL WHERE president_id = $1", [userId]);
    await execute("DELETE FROM club_follows WHERE user_id = $1", [userId]);
    await execute("DELETE FROM likes WHERE user_id = $1", [userId]);
    await execute("DELETE FROM bookmarks WHERE user_id = $1", [userId]);
    await execute("DELETE FROM registrations WHERE user_id = $1", [userId]);
    await execute("DELETE FROM comments WHERE user_id = $1", [userId]);
    await execute("DELETE FROM follows WHERE follower_id = $1 OR following_id = $2", [userId, userId]);
    await execute("DELETE FROM messages WHERE sender_id = $1 OR receiver_id = $2", [userId, userId]);
    await execute("DELETE FROM notifications WHERE user_id = $1", [userId]);
    await execute("DELETE FROM reminders WHERE user_id = $1", [userId]);
    await execute("DELETE FROM event_reminders WHERE user_id = $1", [userId]);
    await execute("DELETE FROM saved_events WHERE user_id = $1", [userId]);
    await execute("DELETE FROM story_views WHERE viewer_id = $1", [userId]);
    await execute("DELETE FROM stories WHERE user_id = $1", [userId]);
    await execute("DELETE FROM activity WHERE user_id = $1 OR target_user_id = $2", [userId, userId]);
    await execute("DELETE FROM role_requests WHERE requester_id = $1 OR target_user_id = $2", [userId, userId]);
    await execute("DELETE FROM password_reset_tokens WHERE user_id = $1", [userId]);
    await execute("DELETE FROM users WHERE id = $1", [userId]);
    res.json({ success: true });
  } catch (e) {
    console.error('Delete account error:', e);
    res.status(500).json({ error: "Failed to delete account", details: e.message });
  }
});


// Background task for reminders
setInterval(async () => {
  try {
    const now = new Date().toISOString();
    const dueReminders = await query(`
      SELECT r.*, e.title 
      FROM reminders r 
      JOIN events e ON r.event_id = e.id 
      WHERE r.remind_at <= $1 AND r.is_triggered = 0
    `, [now]);
    
    for (const reminder of dueReminders) {
      try {
        await execute("INSERT INTO notifications (user_id, content, type) VALUES ($1, $2, $3)", [
          reminder.user_id,
          `Reminder: The event "${reminder.title}" starts in 1 hour!`,
          'reminder'
        ]);
        await execute("UPDATE reminders SET is_triggered = 1 WHERE id = $1", [reminder.id]);
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
