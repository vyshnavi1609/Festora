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
        google_form_url TEXT,
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
        club_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(requester_id) REFERENCES users(id),
        FOREIGN KEY(target_user_id) REFERENCES users(id),
        FOREIGN KEY(club_id) REFERENCES clubs(id)
      )
    `);
    // some deployments might have created the table before club_id was added
    await execute(`ALTER TABLE role_requests ADD COLUMN IF NOT EXISTS club_id INTEGER`);
    // ensure the foreign key exists as well; on older schemas it may be missing
    await execute(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE table_name='role_requests' AND constraint_type='FOREIGN KEY' AND constraint_name='role_requests_club_id_fkey'
        ) THEN
          ALTER TABLE role_requests
            ADD CONSTRAINT role_requests_club_id_fkey
            FOREIGN KEY (club_id) REFERENCES clubs(id);
        END IF;
      END
      $$;
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
        link TEXT,
        is_read INTEGER DEFAULT 0,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        scheduled_at TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);
    // ensure link column exists on older databases
    await execute(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link TEXT`);

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
        name VARCHAR(255),
        description TEXT,
        logo_url TEXT,
        president_id INTEGER,
        created_by INTEGER,
        college_code VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, college_code),
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

    await execute(`
      CREATE TABLE IF NOT EXISTS club_requests (
        id SERIAL PRIMARY KEY,
        requester_id INTEGER,
        club_name VARCHAR(255),
        club_description TEXT,
        club_image_url TEXT,
        in_charge_name VARCHAR(255),
        in_charge_email VARCHAR(255),
        related_to TEXT,
        college_code VARCHAR(50),
        status VARCHAR(50) DEFAULT 'pending',
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP,
        reviewed_by INTEGER,
        FOREIGN KEY(requester_id) REFERENCES users(id),
        FOREIGN KEY(reviewed_by) REFERENCES users(id)
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

// temporary debug endpoint to verify database connectivity
app.get("/debug/users", async (req, res) => {
  try {
    const users = await query("SELECT * FROM users", []);
    res.json(users);
  } catch (err) {
    console.error("Debug route error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

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
// Postgres supports IF NOT EXISTS, so this will quietly skip existing column
try {
  await execute(`ALTER TABLE events ADD COLUMN IF NOT EXISTS qr_code TEXT`);
} catch (err: any) {
  // should never hit, but log anything unexpected
  console.error('Failed to add qr_code column:', err.message || err);
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

// verify transporter on startup to catch configuration issues
emailTransporter.verify().then(() => {
  console.log('Email transporter verified');
}).catch(err => {
  console.warn('Email transporter verification failed:', err.message);
});


// Auth Routes (Simplified for demo)
app.post("/api/login", async (req, res) => {
  const { identifier, password } = req.body;
  
  // Trim whitespace from inputs
  const trimmedIdentifier = (identifier || '').trim();
  const trimmedPassword = password || '';
  
  if (!trimmedIdentifier || !trimmedPassword) {
    return res.status(400).json({ error: "Username/Email/Phone and password are required" });
  }
  
  // identifier can be username, email, or phone_number - case-insensitive for email and username
  const user = await queryOne(`
    SELECT * FROM users 
    WHERE (LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1) OR phone_number = $1) 
    AND password = $2
  `, [trimmedIdentifier, trimmedPassword]);
  
  if (user) {
    res.json(user);
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.post("/api/register", async (req, res) => {
  const { username, email, phone_number, password, full_name, avatar_url, college_name, roll_no } = req.body;

  // Validate inputs
  if (!username || !email || !phone_number || !password || !full_name || !college_name || !roll_no) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Trim inputs
  const trimmedUsername = username.trim();
  const trimmedEmail = email.trim();
  const trimmedPhone = phone_number.trim();
  const trimmedCollege = college_name.trim();
  const trimmedRollNo = roll_no.trim();
  const trimmedFullName = full_name.trim();

  // Check if roll number already exists for this college
  const existingRollNo = await queryOne("SELECT id FROM users WHERE LOWER(college_name) = LOWER($1) AND LOWER(roll_no) = LOWER($2)", [trimmedCollege, trimmedRollNo]);
  if (existingRollNo) {
    return res.status(400).json({ error: "A student with this roll number already exists in your college" });
  }

  try {
    const result = await queryOne(
      "INSERT INTO users (username, email, phone_number, password, full_name, avatar_url, college_name, roll_no, role) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id",
      [trimmedUsername, trimmedEmail, trimmedPhone, password, trimmedFullName, avatar_url, trimmedCollege, trimmedRollNo, 'student']
    );
    const user = await queryOne("SELECT * FROM users WHERE id = $1", [result.id]);

    // Send welcome email
    const welcomeMailOptions = {
      from: `Festora <${process.env.EMAIL_FROM}>`,
      to: trimmedEmail,
      subject: 'Welcome to Festora - Registration Successful!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366f1;">Welcome to Festora, ${trimmedFullName}!</h2>
          <p>Congratulations! Your account has been successfully created.</p>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Your Account Details:</h3>
            <p><strong>Username:</strong> ${trimmedUsername}</p>
            <p><strong>Email:</strong> ${trimmedEmail}</p>
            <p><strong>College:</strong> ${trimmedCollege}</p>
            <p><strong>Roll Number:</strong> ${trimmedRollNo}</p>
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
  // build reset url; fall back to request origin or localhost
  const baseUrl = process.env.APP_URL || req.headers.origin || `http://localhost:${process.env.PORT||5173}`;
  const resetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${token}`;
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@festora.local',
    to: email,
    subject: 'Password Reset - Festora',
    html: `
      <p>Hi ${user.full_name},</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>Link expires in 1 hour.</p>
    `
  };
  
  // if SMTP not configured, skip sending and just return link
  const smtpHost = process.env.EMAIL_HOST;
  if (!smtpHost) {
    console.warn('SMTP not configured (EMAIL_HOST not set), skipping email send');
    return res.json({ message: 'Reset link ready', resetUrl });
  }

  try {
    console.log('Attempting to send email to:', email);
    console.log('Email from:', mailOptions.from);
    console.log('Using SMTP config:', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER ? 'SET' : 'NOT SET',
      pass: process.env.EMAIL_PASS ? 'SET' : 'NOT SET'
    });
    
    const info = await emailTransporter.sendMail(mailOptions);
    console.log('Email sent. Message ID:', info.messageId, 'Response:', info.response);
    res.json({ message: "Password reset email sent successfully", resetUrl });
  } catch (error: any) {
    console.error('Email sending failed:', error.message);
    // even if email fails, return the link so password reset still works
    res.json({ message: 'Reset link generated (email delivery failed)', resetUrl });
  }
});

// verify reset token and return account hint (email/username)
app.get("/api/reset-password/verify", async (req, res) => {
  const token = req.query.token as string;
  if (!token) return res.status(400).json({ error: "Token required" });

  const resetToken = await queryOne("SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW() AND used = 0", [token]);
  if (!resetToken) {
    return res.status(400).json({ error: "Invalid or expired reset token" });
  }

  const user = await queryOne("SELECT id, email, username, full_name FROM users WHERE id = $1", [resetToken.user_id]);
  if (!user) {
    return res.status(500).json({ error: "User not found" });
  }

  res.json({ user: { email: user.email, username: user.username, full_name: user.full_name } });
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
  const { name, description, logo_url, president_id, user_id, college_code } = req.body;
  
  // Only council_president or admin can create clubs
  const requester = await queryOne("SELECT role, college_name FROM users WHERE id = $1", [user_id]);
  if (!requester || (requester.role !== 'council_president' && requester.role !== 'admin')) {
    return res.status(403).json({ error: "Only council president or admin can create clubs" });
  }

  // Validate college_code
  if (!college_code) {
    return res.status(400).json({ error: "college_code is required" });
  }
  
  try {
    const club = await queryOne("INSERT INTO clubs (name, description, logo_url, president_id, created_by, college_code) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id", [
      name, description, logo_url, president_id, user_id, college_code
    ]);
    
    // Add president as club member
    await execute("INSERT INTO club_members (club_id, user_id, role) VALUES ($1, $2, $3)", [club.id, president_id, 'president']);
    
    res.json({ message: "Club created successfully", club });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/clubs", async (req, res) => {
  const { college_code } = req.query;
  
  try {
    if (college_code) {
      const clubs = await query("SELECT * FROM clubs WHERE college_code = $1", [college_code]);
      res.json(clubs);
    } else {
      const clubs = await query("SELECT * FROM clubs", []);
      res.json(clubs);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get users eligible for promotion by current user
app.get("/api/promotable-users/:userId", async (req, res) => {
  try {
    const requester = await queryOne("SELECT role, college_name FROM users WHERE id = $1", [req.params.userId]);
    if (!requester) {
      return res.status(404).json({ error: "User not found" });
    }

    const roleHierarchy = {
      'admin': 'council_president',
      'council_president': 'club_president',
      'club_president': 'club_member',
      'club_member': null,
      'student': null
    };

    const nextRole = roleHierarchy[requester.role];
    if (!nextRole) {
      return res.json([]); // No one can be promoted beyond this role
    }

    // Get users who don't have this role yet and are from same college
    const users = await query(
      "SELECT id, full_name, email, role, college_name FROM users WHERE role != $1 AND college_name = $2 ORDER BY full_name",
      [nextRole, requester.college_name]
    );
    
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get clubs for a specific college
app.get("/api/clubs-by-college/:collegeCode", async (req, res) => {
  try {
    const clubs = await query("SELECT id, name, description, logo_url FROM clubs WHERE college_code = $1", [req.params.collegeCode]);
    res.json(clubs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

// Club Request: Club President submits request to create a club
app.post("/api/club-requests", async (req, res) => {
  const { requester_id, club_name, club_description, club_image_url, in_charge_name, in_charge_email, related_to } = req.body;
  try {
    // Validate requester is club_president
    const requester = await queryOne("SELECT role, college_name FROM users WHERE id = $1", [requester_id]);
    if (!requester) {
      return res.status(404).json({ error: "User not found" });
    }
    if (requester.role !== 'club_president') {
      return res.status(403).json({ error: "Only club presidents can request new clubs" });
    }

    // Insert club request
    const result = await queryOne(
      "INSERT INTO club_requests (requester_id, club_name, club_description, club_image_url, in_charge_name, in_charge_email, related_to, college_code, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id",
      [requester_id, club_name, club_description, club_image_url, in_charge_name, in_charge_email, related_to, requester.college_name, 'pending']
    );

    // Notify council president
    const councilPresidents = await query(
      "SELECT id, email, full_name FROM users WHERE role = 'council_president' AND LOWER(college_name) = LOWER($1)",
      [requester.college_name]
    );

    for (const cp of councilPresidents) {
      await execute(
        "INSERT INTO notifications (user_id, content, type, link) VALUES ($1, $2, $3, $4)",
        [cp.id, `New club request: ${club_name}`, 'club_request', `/club-requests/${result.id}`]
      );

      if (cp.email) {
        try {
          await emailTransporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: cp.email,
            subject: `New Club Request: ${club_name}`,
            html: `<p>Hi ${cp.full_name},</p><p>A new club request has been submitted: <strong>${club_name}</strong>. Please review and approve or reject in Festora.</p>`
          });
        } catch (err) {
          console.error('Email send failed:', err);
        }
      }
    }

    res.json({ id: result.id, message: "Club request submitted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get club requests (for council president)
app.get("/api/club-requests", async (req, res) => {
  const { collegeCode, status } = req.query;
  try {
    let query_str = "SELECT cr.*, u.full_name as requester_name FROM club_requests cr JOIN users u ON cr.requester_id = u.id WHERE 1=1";
    const params: any[] = [];

    if (collegeCode) {
      query_str += ` AND cr.college_code = $${params.length + 1}`;
      params.push(collegeCode);
    }
    if (status) {
      query_str += ` AND cr.status = $${params.length + 1}`;
      params.push(status);
    }

    query_str += " ORDER BY cr.requested_at DESC";
    const requests = await query(query_str, params);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single club request
app.get("/api/club-requests/:id", async (req, res) => {
  const cr = await queryOne("SELECT cr.*, u.full_name as requester_name FROM club_requests cr JOIN users u ON cr.requester_id = u.id WHERE cr.id = $1", [req.params.id]);
  if (cr) {
    res.json(cr);
  } else {
    res.status(404).json({ error: "Request not found" });
  }
});

// Approve club request
app.post("/api/club-requests/:id/approve", async (req, res) => {
  const { reviewedBy } = req.body;
  const requestId = req.params.id;
  try {
    // Verify reviewer is council president
    const reviewer = await queryOne("SELECT role FROM users WHERE id = $1", [reviewedBy]);
    if (!reviewer || reviewer.role !== 'council_president') {
      return res.status(403).json({ error: "Only council presidents can approve club requests" });
    }

    const cr = await queryOne("SELECT * FROM club_requests WHERE id = $1", [requestId]);
    if (!cr) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Create the club
    const club = await queryOne(
      "INSERT INTO clubs (name, description, logo_url, president_id, created_by, college_code) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [cr.club_name, cr.club_description, cr.club_image_url, cr.requester_id, cr.requester_id, cr.college_code]
    );

    // Add president as club member with 'president' role
    await execute(
      "INSERT INTO club_members (club_id, user_id, role) VALUES ($1, $2, $3)",
      [club.id, cr.requester_id, 'president']
    );

    // Update request status
    await execute(
      "UPDATE club_requests SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $1 WHERE id = $2",
      [reviewedBy, requestId]
    );

    // Notify requester
    const requester = await queryOne("SELECT full_name FROM users WHERE id = $1", [cr.requester_id]);
    await execute(
      "INSERT INTO notifications (user_id, content, type, link) VALUES ($1, $2, $3, $4)",
      [cr.requester_id, `Your club "${cr.club_name}" has been approved!`, 'club_update', `/club/${club.id}`]
    );

    res.json({ success: true, club_id: club.id, message: "Club created successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reject club request
app.post("/api/club-requests/:id/reject", async (req, res) => {
  const { reviewedBy, reason } = req.body;
  const requestId = req.params.id;
  try {
    // Verify reviewer is council president
    const reviewer = await queryOne("SELECT role FROM users WHERE id = $1", [reviewedBy]);
    if (!reviewer || reviewer.role !== 'council_president') {
      return res.status(403).json({ error: "Only council presidents can reject club requests" });
    }

    const cr = await queryOne("SELECT requester_id, club_name FROM club_requests WHERE id = $1", [requestId]);
    if (!cr) {
      return res.status(404).json({ error: "Request not found" });
    }

    await execute(
      "UPDATE club_requests SET status = 'rejected', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $1 WHERE id = $2",
      [reviewedBy, requestId]
    );

    // Notify requester
    await execute(
      "INSERT INTO notifications (user_id, content, type, link) VALUES ($1, $2, $3, $4)",
      [cr.requester_id, `Your club request for "${cr.club_name}" was rejected${reason ? ': ' + reason : ''}`, 'club_update', `/dashboard`]
    );

    res.json({ success: true, message: "Club request rejected" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
  const { title, description, image_url, date, location, category, created_by, privacy, college_code, club_id, pass, google_form_url } = req.body;
  if (!title || !description || !date || !location) {
    return res.status(400).json({ error: "All fields are required" });
  }
  if (google_form_url && !google_form_url.startsWith('http')) {
    return res.status(400).json({ error: "Invalid Google Form URL" });
  }
  const eventPrivacy = privacy === 'private' ? 'private' : 'social';
  const eventCollegeCode = eventPrivacy === 'private' ? (college_code || null) : null;
  const result = await queryOne("INSERT INTO events (title, description, image_url, date, location, category, created_by, privacy, college_code, club_id, pass, google_form_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id", [
    title, description, image_url, date, location, category || 'Social', created_by, eventPrivacy, eventCollegeCode, club_id || null, pass || null, google_form_url || null
  ]);

  // if the event is for a club, notify its followers
  if (club_id) {
    const club = await queryOne("SELECT name FROM clubs WHERE id = $1", [club_id]);
    const followers = await query("SELECT user_id FROM club_follows WHERE club_id = $1", [club_id]);
    for (const f of followers) {
      if (f.user_id === created_by) continue;
      await execute("INSERT INTO notifications (user_id, content, type, link) VALUES ($1, $2, $3, $4)", [
        f.user_id,
        `New event posted by ${club?.name || 'your club'}`,
        'club_event',
        `/?event=${result.id}`
      ]);
    }
  }

  res.json({ id: result.id });
});

app.put("/api/events/:id", async (req, res) => {
  const { title, description, image_url, date, location, category, privacy, college_code, pass, google_form_url } = req.body;
  if (!title || !description || !date || !location) {
    return res.status(400).json({ error: "All fields are required" });
  }
  if (google_form_url && !google_form_url.startsWith('http')) {
    return res.status(400).json({ error: "Invalid Google Form URL" });
  }
  const eventPrivacy = privacy === 'private' ? 'private' : 'social';
  const eventCollegeCode = eventPrivacy === 'private' ? (college_code || null) : null;
  await execute("UPDATE events SET title = $1, description = $2, image_url = $3, date = $4, location = $5, category = $6, privacy = $7, college_code = $8, pass = $9, google_form_url = $10 WHERE id = $11", [
    title, description, image_url, date, location, category, eventPrivacy, eventCollegeCode, pass || null, google_form_url || null, req.params.id
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
    // Admin profiles are restricted; students always viewable
    if (user.role === 'admin') {
      const requesterId = req.query.requester || req.headers['x-requester-id'];
      if (!requesterId) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const requester = await queryOne("SELECT role FROM users WHERE id = $1", [requesterId]);
      if (!requester || requester.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }
    }
    // All other profiles (students, council_president, etc.) are publicly viewable
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Hierarchical Role Promotion: admin -> council_president -> club_president -> club_member
const roleHierarchy = {
  'admin': ['council_president'],
  'council_president': ['club_president'],
  'club_president': ['club_member'],
  'club_member': [],
  'student': []
};

app.post("/api/role-requests", async (req, res) => {
  const { requester_id, target_user_id, requested_role, club_id } = req.body;
  try {
    // Validate requester exists and get their role
    const requester = await queryOne("SELECT role, college_name FROM users WHERE id = $1", [requester_id]);
    if (!requester) {
      return res.status(404).json({ error: "Requester not found" });
    }

    // Validate target user exists
    const targetUser = await queryOne("SELECT email, full_name, college_name FROM users WHERE id = $1", [target_user_id]);
    if (!targetUser) {
      return res.status(404).json({ error: "Target user not found" });
    }

    // Check if requester can promote to this role (hierarchy check)
    const allowedRoles = roleHierarchy[requester.role] || [];
    if (!allowedRoles.includes(requested_role)) {
      return res.status(403).json({ error: `Your role ${requester.role} cannot promote to ${requested_role}. Allowed roles: ${allowedRoles.join(', ')}` });
    }

    // If promoting to club_president, club_id is required and club must be in same college
    if (requested_role === 'club_president') {
      if (!club_id) {
        return res.status(400).json({ error: "club_id is required when promoting to club_president" });
      }
      const club = await queryOne("SELECT college_code FROM clubs WHERE id = $1", [club_id]);
      if (!club) {
        return res.status(404).json({ error: "Club not found" });
      }
      if (club.college_code !== requester.college_name) {
        return res.status(403).json({ error: "Can only promote to clubs in your college" });
      }
    }

    // Create role request
    const result = await queryOne("INSERT INTO role_requests (requester_id, target_user_id, requested_role, club_id) VALUES ($1, $2, $3, $4) RETURNING id", [
      requester_id, target_user_id, requested_role, club_id || null]);

    // Determine who should approve this request and notify them.
    // For club_president promotions the approver is the council_president for the club's college.
    let approverIds: number[] = [];
    if (requested_role === 'club_president' && club_id) {
      const clubInfo = await queryOne("SELECT college_code FROM clubs WHERE id = $1", [club_id]);
      if (clubInfo && clubInfo.college_code) {
        const approvers = await query("SELECT id, email, full_name FROM users WHERE role = 'council_president' AND LOWER(college_name) = LOWER($1)", [clubInfo.college_code]);
        approverIds = approvers.map((a: any) => a.id);
        for (const ap of approvers) {
          await execute("INSERT INTO notifications (user_id, content, type, link) VALUES ($1, $2, $3, $4)", [
            ap.id,
            `Approval requested: promote ${targetUser.full_name} to club president for ${clubInfo.college_code}`,
            'role_request',
            `/role-requests/${result.id}`
          ]);
          if (ap.email) {
            try {
              await emailTransporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: ap.email,
                subject: `Approval needed: Club President request for ${targetUser.full_name}`,
                html: `<p>Hi ${ap.full_name},</p><p>${requester.full_name} has requested that <strong>${targetUser.full_name}</strong> be made Club President for a club in your college (${clubInfo.college_code}). Please review and approve or reject the request in Festora.</p>`
              });
            } catch (emailError) {
              console.error('Failed to send approver email:', emailError);
            }
          }
        }
      }
    } else {
      // For other promotions notify the requester (fallback) and the target user
      await execute("INSERT INTO notifications (user_id, content, type, link) VALUES ($1, $2, $3, $4)", [
        requester_id,
        `New promotion request for ${requested_role.replace('_',' ')}`,
        'role_request',
        `/profile/${target_user_id}`
      ]);
    }

    // Notify target user that a request was created (so they can approve/reject if applicable)
    if (targetUser.email) {
      try {
        const roleDetail = requested_role === 'club_president' ? 'Club President' : requested_role.replace('_', ' ');
        await emailTransporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: targetUser.email,
          subject: `Role Promotion Request - ${roleDetail}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #6366f1;">Role Promotion Request</h2>
              <p>Hi ${targetUser.full_name},</p>
              <p><strong>${requester.full_name}</strong> has initiated a promotion request for the role of <strong>${roleDetail}</strong>.</p>
              <p>Please log in to your Festora account to approve or see the status of this request.</p>
              <p>Best regards,<br>Festora Team</p>
            </div>
          `
        });
      } catch (emailError) {
        console.error('Failed to send role request email:', emailError);
      }
    }

    res.json({ id: result.id, message: "Promotion request sent", approverIds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/role-requests/:userId", async (req, res) => {
  try {
    const user = await queryOne("SELECT role FROM users WHERE id = $1", [req.params.userId]);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // determine whether club_id column exists so we can safely join clubs
    const hasClubId = await queryOne("SELECT column_name FROM information_schema.columns WHERE table_name='role_requests' AND column_name='club_id'");
    const joinClub = hasClubId ? `LEFT JOIN clubs ON role_requests.club_id = clubs.id` : '';
    const selectClub = hasClubId ? `, clubs.name as club_name` : '';

    let requests;
    if (['admin', 'council_president', 'club_president'].includes(user.role)) {
      requests = await query(
        `SELECT role_requests.* ${selectClub},
               u1.full_name as requester_name,
               u2.full_name as target_name
         FROM role_requests
         JOIN users u1 ON role_requests.requester_id = u1.id
         JOIN users u2 ON role_requests.target_user_id = u2.id
         ${joinClub}
         WHERE role_requests.target_user_id = $1 OR role_requests.requester_id = $1
         ORDER BY role_requests.created_at DESC`,
        [req.params.userId]
      );
    } else {
      requests = await query(
        `SELECT role_requests.* ${selectClub},
               u1.full_name as requester_name,
               u2.full_name as target_name
         FROM role_requests
         JOIN users u1 ON role_requests.requester_id = u1.id
         JOIN users u2 ON role_requests.target_user_id = u2.id
         ${joinClub}
         WHERE role_requests.target_user_id = $1
         ORDER BY role_requests.created_at DESC`,
        [req.params.userId]
      );
    }
    
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/role-requests/approve", async (req, res) => {
  const { requestId } = req.body;
  try {
    const request = await queryOne("SELECT * FROM role_requests WHERE id = $1", [requestId]);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Update user role
    await execute("UPDATE users SET role = $1 WHERE id = $2", [request.requested_role, request.target_user_id]);
    
    // If promoted to club_president, add as club president and club member
    if (request.requested_role === 'club_president' && request.club_id) {
      await execute("UPDATE clubs SET president_id = $1 WHERE id = $2", [request.target_user_id, request.club_id]);
      await execute("INSERT INTO club_members (club_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT (club_id, user_id) DO UPDATE SET role = 'president'", [request.club_id, request.target_user_id, 'president']);
    }

    // If promoted to club_member, add to the club
    if (request.requested_role === 'club_member' && request.club_id) {
      await execute("INSERT INTO club_members (club_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT (club_id, user_id) DO UPDATE SET role = 'member'", [request.club_id, request.target_user_id, 'member']);
    }
    
    await execute("UPDATE role_requests SET status = 'approved' WHERE id = $1", [requestId]);
    
    // Create notification
    const roleDisplay = request.requested_role.replace('_', ' ');
    await execute("INSERT INTO notifications (user_id, content, type, link) VALUES ($1, $2, $3, $4)", [
      request.target_user_id,
      `Your promotion to ${roleDisplay} has been approved!`,
      'role_update',
      `/profile/${request.target_user_id}`
    ]);
    
    res.json({ success: true, message: `User promoted to ${roleDisplay}` });
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

// helper to fetch a single event (used for deep-linking)
app.get("/api/events/:id", async (req, res) => {
  const event = await queryOne("SELECT * FROM events WHERE id = $1", [req.params.id]);
  if (event) res.json(event);
  else res.status(404).json({ error: "Event not found" });
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
  
  // Get event details
  const event = await queryOne("SELECT google_form_url, title FROM events WHERE id = $1", [event_id]);
  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }
  
  // If event has Google Form URL, return it for frontend to open
  if (event.google_form_url) {
    return res.json({ 
      success: true, 
      registration_url: event.google_form_url,
      message: "Opening registration form"
    });
  }
  
  // Fallback: Internal registration (for events without Google Form)
  // Check if user is already registered or waitlisted
  const existingReg = await queryOne("SELECT * FROM registrations WHERE user_id = $1 AND event_id = $2 AND status IN ('registered', 'waitlisted')", [user_id, event_id]);
  if (existingReg) {
    return res.status(400).json({ error: "Already registered or waitlisted for this event" });
  }
  
  // Get user email
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
  GROUP BY 
    s.id,
    u.username,
    u.full_name,
    u.avatar_url,
    sv2.viewer_id
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

// admin helper: directly change role
app.post("/api/users/:id/role", async (req, res) => {
  const targetId = req.params.id;
  const { role } = req.body;
  const requesterId = req.query.requester || req.headers['x-requester-id'];
  if (!requesterId) return res.status(403).json({ error: 'Requester required' });
  const requester = await queryOne("SELECT * FROM users WHERE id=$1", [requesterId]);
  if (!requester || requester.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized' });
  }
  if (!['admin','council_president','club_president','club_member','student'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  try {
    await execute("UPDATE users SET role=$1 WHERE id=$2", [role, targetId]);
    res.json({ success: true });
  } catch (e) {
    console.error('role change error', e);
    res.status(500).json({ error: 'Failed to change role' });
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
