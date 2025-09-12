// Simple proxy to forward requests to Google Gemini (Generative Language) or another LLM endpoint.
// Usage: set GEMINI_API_URL and GEMINI_API_KEY in environment (see .env.example)
// This server accepts POST /gemini and forwards the JSON body to GEMINI_API_URL with X-goog-api-key header.

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_API_URL = process.env.GEMINI_API_URL; // e.g. https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Auth secret for JWT - must be set in production
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('JWT_SECRET environment variable is required');
  process.exit(1);
}
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// SQLite setup with error handling
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'studentbuddy.db');

let db;
try {
  db = new sqlite3.Database(DB_PATH);
  db.on('error', (err) => {
    console.error('Database error:', err);
  });
} catch (err) {
  console.error('Failed to connect to database:', err);
  process.exit(1);
}

// Create tables if not present
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, school TEXT, email TEXT, meta TEXT)`);
  // auth users table: email (unique), password hash, profile meta
  db.run(`CREATE TABLE IF NOT EXISTS auth_users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE, password_hash TEXT, meta TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT, content TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME, FOREIGN KEY (user_id) REFERENCES auth_users (id))`);
  db.run(`CREATE TABLE IF NOT EXISTS reminders (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT, dueDate TEXT, timestamp INTEGER, status TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES auth_users (id))`);
  // Add completed_at column if it doesn't exist (ignore error if already present)
  db.run('ALTER TABLE reminders ADD COLUMN completed_at INTEGER', (err) => { /* ignore if column exists */ });
  // messages table for chat history
  db.run(`CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, role TEXT, content TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES auth_users (id))`);
  // settings table for global key/value preferences (theme, etc.)
  db.run(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`);
  // ensure a default theme exists (only inserts if missing)
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('theme','light')`);

  // Add user_id columns to existing tables if they don't exist
  db.run('ALTER TABLE notes ADD COLUMN user_id INTEGER REFERENCES auth_users (id)', (err) => { /* ignore if column exists */ });
  db.run('ALTER TABLE reminders ADD COLUMN user_id INTEGER REFERENCES auth_users (id)', (err) => { /* ignore if column exists */ });
  db.run('ALTER TABLE messages ADD COLUMN user_id INTEGER REFERENCES auth_users (id)', (err) => { /* ignore if column exists */ });
});

if (!GEMINI_API_URL) {
  console.warn('Warning: GEMINI_API_URL not set. Set it in .env or environment. Proxy will return 500 for requests.');
}

// Input validation and sanitization utilities
function sanitizeString(str, maxLength = 1000) {
  if (typeof str !== 'string') return '';
  return str.trim().substring(0, maxLength).replace(/[<>\"'&]/g, '');
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  return typeof password === 'string' && password.length >= 6 && password.length <= 128;
}

function validateId(id) {
  return /^\d+$/.test(id) && parseInt(id) > 0;
}

function validateRole(role) {
  return ['user', 'assistant', 'system'].includes(role);
}

function validateStatus(status) {
  return ['pending', 'completed', 'overdue', 'soon'].includes(status);
}

function validateTheme(theme) {
  return ['light', 'dark', 'blue', 'green', 'pink', 'gray', 'purple', 'orange', 'yellow', 'brown', 'sunset', 'ocean', 'red', 'teal', 'indigo', 'rainbow', 'lime', 'cyan', 'rose', 'amber', 'emerald', 'sky', 'violet', 'fuchsia', 'aurora', 'forest', 'fire', 'ice', 'galaxy', 'desert', 'meadow', 'storm', 'candy', 'autumn', 'sunrise', 'twilight', 'neon', 'vintage', 'tropical', 'metallic', 'pastel'].includes(theme);
}

// Rate limiting configurations
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth attempts per windowMs
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 API requests per windowMs
  message: { error: 'Too many API requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const geminiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 Gemini requests per minute
  message: { error: 'Too many AI requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Enhanced security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for themes
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://generativelanguage.googleapis.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.ALLOWED_ORIGINS?.split(',') : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(bodyParser.json({ limit: '1mb' }));

// Apply rate limiting
app.use('/health', generalLimiter);
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);
app.use('/gemini', geminiLimiter);

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

// --- Simple CRUD endpoints for Student Buddy data (notes, reminders, users)
app.get('/api/notes', authMiddleware, (req, res) => {
  const userId = req.user.id;
  db.all('SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: String(err) });
    res.json(rows);
  });
});

app.post('/api/notes', authMiddleware, (req, res) => {
  const { title, content } = req.body || {};
  const userId = req.user.id;

  // Validate input
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Title is required and must be a string' });
  }
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Content is required and must be a string' });
  }

  // Sanitize input
  const sanitizedTitle = sanitizeString(title, 200);
  const sanitizedContent = sanitizeString(content, 10000);

  if (!sanitizedTitle) {
    return res.status(400).json({ error: 'Title cannot be empty after sanitization' });
  }
  if (!sanitizedContent) {
    return res.status(400).json({ error: 'Content cannot be empty after sanitization' });
  }

  db.run('INSERT INTO notes (user_id, title, content, updated_at) VALUES (?,?,?,CURRENT_TIMESTAMP)', [userId, sanitizedTitle, sanitizedContent], function(err) {
    if (err) return res.status(500).json({ error: String(err) });
    res.json({ id: this.lastID, title: sanitizedTitle, content: sanitizedContent });
  });
});

app.delete('/api/notes/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Validate input
  if (!validateId(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  db.run('DELETE FROM notes WHERE id = ? AND user_id = ?', [id, userId], function(err) {
    if (err) return res.status(500).json({ error: String(err) });
    res.json({ deleted: this.changes });
  });
});

app.get('/api/reminders', authMiddleware, (req, res) => {
  const userId = req.user.id;
  db.all('SELECT * FROM reminders WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: String(err) });
    res.json(rows);
  });
});

app.post('/api/reminders', authMiddleware, (req, res) => {
  const { title, dueDate, timestamp, status } = req.body || {};
  const userId = req.user.id;
  const completed_at = req.body.completedAt || null;

  // Validate input
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Title is required and must be a string' });
  }
  if (dueDate && typeof dueDate !== 'string') {
    return res.status(400).json({ error: 'Due date must be a string' });
  }
  if (timestamp && (typeof timestamp !== 'number' || timestamp < 0)) {
    return res.status(400).json({ error: 'Timestamp must be a positive number' });
  }
  if (status && !validateStatus(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }
  if (completed_at && (typeof completed_at !== 'number' || completed_at < 0)) {
    return res.status(400).json({ error: 'Completed timestamp must be a positive number' });
  }

  // Sanitize input
  const sanitizedTitle = sanitizeString(title, 200);
  const sanitizedDueDate = dueDate ? sanitizeString(dueDate, 100) : null;

  if (!sanitizedTitle) {
    return res.status(400).json({ error: 'Title cannot be empty after sanitization' });
  }

  db.run('INSERT INTO reminders (user_id, title, dueDate, timestamp, status, completed_at) VALUES (?,?,?,?,?,?)', [userId, sanitizedTitle, sanitizedDueDate, timestamp || null, status || 'pending', completed_at], function(err) {
    if (err) return res.status(500).json({ error: String(err) });
    res.json({ id: this.lastID, title: sanitizedTitle, dueDate: sanitizedDueDate, timestamp, status, completed_at: completed_at });
  });
});

app.delete('/api/reminders/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Validate input
  if (!validateId(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  db.run('DELETE FROM reminders WHERE id = ? AND user_id = ?', [id, userId], function(err) {
    if (err) return res.status(500).json({ error: String(err) });
    res.json({ deleted: this.changes });
  });
});

app.put('/api/reminders/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { title, dueDate, timestamp, status, completedAt } = req.body || {};

  // Validate input
  if (!validateId(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  if (title && typeof title !== 'string') {
    return res.status(400).json({ error: 'Title must be a string' });
  }
  if (dueDate && typeof dueDate !== 'string') {
    return res.status(400).json({ error: 'Due date must be a string' });
  }
  if (timestamp && (typeof timestamp !== 'number' || timestamp < 0)) {
    return res.status(400).json({ error: 'Timestamp must be a positive number' });
  }
  if (status && !validateStatus(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }
  if (completedAt && (typeof completedAt !== 'number' || completedAt < 0)) {
    return res.status(400).json({ error: 'Completed timestamp must be a positive number' });
  }

  // Sanitize input
  const sanitizedTitle = title ? sanitizeString(title, 200) : null;
  const sanitizedDueDate = dueDate ? sanitizeString(dueDate, 100) : null;

  db.run('UPDATE reminders SET title = COALESCE(?, title), dueDate = COALESCE(?, dueDate), timestamp = COALESCE(?, timestamp), status = COALESCE(?, status), completed_at = COALESCE(?, completed_at) WHERE id = ? AND user_id = ?', [sanitizedTitle, sanitizedDueDate, timestamp || null, status, completedAt || null, id, userId], function(err) {
    if (err) return res.status(500).json({ error: String(err) });
    res.json({ updated: this.changes });
  });
});

// User details
app.get('/api/user', (req, res) => {
  // Return currently saved user profile (legacy single-profile) if any
  db.get('SELECT * FROM users ORDER BY id DESC LIMIT 1', (err, row) => {
    if (err) return res.status(500).json({ error: String(err) });
    res.json(row || {});
  });
});

// --- AUTH ---
// Signup: create auth user and optional profile
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, name, school, meta } = req.body || {};

  // Validate input
  if (!email || !validateEmail(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  if (!validatePassword(password)) {
    return res.status(400).json({ error: 'Password must be 6-128 characters long' });
  }
  if (name && typeof name !== 'string') {
    return res.status(400).json({ error: 'Name must be a string' });
  }
  if (school && typeof school !== 'string') {
    return res.status(400).json({ error: 'School must be a string' });
  }

  // Sanitize input
  const sanitizedEmail = sanitizeString(email, 254).toLowerCase();
  const sanitizedName = name ? sanitizeString(name, 100) : '';
  const sanitizedSchool = school ? sanitizeString(school, 100) : '';

  try {
    const hash = await bcrypt.hash(password, 10);
    db.run('INSERT INTO auth_users (email, password_hash, meta) VALUES (?,?,?)', [sanitizedEmail, hash, JSON.stringify(meta || {})], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ error: 'Email already exists' });
        }
        return res.status(500).json({ error: String(err) });
      }
      const token = jwt.sign(
        { id: this.lastID, email: sanitizedEmail },
        JWT_SECRET,
        {
          expiresIn: '30d',
          issuer: 'studentbuddy',
          audience: 'studentbuddy-api',
          algorithm: 'HS256'
        }
      );
      // Optionally save profile to users table for legacy compatibility
      db.run('INSERT INTO users (name, school, email, meta) VALUES (?,?,?,?)', [sanitizedName, sanitizedSchool, sanitizedEmail, JSON.stringify(meta || {})]);
      res.json({ token, email: sanitizedEmail });
    });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// Login: validate credentials and return token
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};

  // Validate input
  if (!email || !validateEmail(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Password is required' });
  }

  // Sanitize input
  const sanitizedEmail = sanitizeString(email, 254).toLowerCase();

  db.get('SELECT * FROM auth_users WHERE email = ?', [sanitizedEmail], async (err, row) => {
    if (err) return res.status(500).json({ error: String(err) });
    if (!row) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, row.password_hash || '');
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign(
      { id: row.id, email: sanitizedEmail },
      JWT_SECRET,
      {
        expiresIn: '30d',
        issuer: 'studentbuddy',
        audience: 'studentbuddy-api',
        algorithm: 'HS256'
      }
    );
    res.json({ token, email: sanitizedEmail });
  });
});

// Middleware: authenticate using Bearer token
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return res.status(401).json({ error: 'Missing or invalid authorization header' });

  try {
    const payload = jwt.verify(m[1], JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'studentbuddy',
      audience: 'studentbuddy-api'
    });

    // Check if token is expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ error: 'Token has expired' });
    }

    req.user = payload;
    next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired' });
    } else if (e.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    } else {
      return res.status(401).json({ error: 'Authentication failed' });
    }
  }
}

// Save or update user preferences (protected)
app.post('/api/user/preferences', authMiddleware, (req, res) => {
  const meta = req.body && req.body.meta;

  // Validate input
  if (!meta || typeof meta !== 'object') {
    return res.status(400).json({ error: 'Meta object is required' });
  }

  // Validate and sanitize meta fields
  const sanitizedMeta = {};
  if (meta.name) {
    if (typeof meta.name !== 'string') {
      return res.status(400).json({ error: 'Name must be a string' });
    }
    sanitizedMeta.name = sanitizeString(meta.name, 100);
  }
  if (meta.school) {
    if (typeof meta.school !== 'string') {
      return res.status(400).json({ error: 'School must be a string' });
    }
    sanitizedMeta.school = sanitizeString(meta.school, 100);
  }
  if (meta.fav) {
    if (typeof meta.fav !== 'string') {
      return res.status(400).json({ error: 'Favorites must be a string' });
    }
    sanitizedMeta.fav = sanitizeString(meta.fav, 200);
  }
  if (meta.hobbies) {
    if (typeof meta.hobbies !== 'string') {
      return res.status(400).json({ error: 'Hobbies must be a string' });
    }
    sanitizedMeta.hobbies = sanitizeString(meta.hobbies, 200);
  }
  if (meta.movies) {
    if (typeof meta.movies !== 'string') {
      return res.status(400).json({ error: 'Movies must be a string' });
    }
    sanitizedMeta.movies = sanitizeString(meta.movies, 200);
  }
  if (meta.goals) {
    if (typeof meta.goals !== 'string') {
      return res.status(400).json({ error: 'Goals must be a string' });
    }
    sanitizedMeta.goals = sanitizeString(meta.goals, 500);
  }

  const email = req.user && req.user.email;
  // update auth_users.meta and also the legacy users table
  db.run('UPDATE auth_users SET meta = ? WHERE email = ?', [JSON.stringify(sanitizedMeta), email], function(err) {
    if (err) return res.status(500).json({ error: String(err) });
    db.run('INSERT OR REPLACE INTO users (id, name, school, email, meta) VALUES ((SELECT id FROM users WHERE email = ?), ?, ?, ?, ?)', [email, sanitizedMeta.name || '', sanitizedMeta.school || '', email, JSON.stringify(sanitizedMeta)], function(e) {
      // ignore inner error
      res.json({ ok: true, meta: sanitizedMeta });
    });
  });
});

// Return prefs for current token
app.get('/api/user/preferences', authMiddleware, (req, res) => {
  const email = req.user && req.user.email;
  db.get('SELECT meta FROM auth_users WHERE email = ?', [email], (err, row) => {
    if (err) return res.status(500).json({ error: String(err) });
    try { res.json({ meta: row ? JSON.parse(row.meta || '{}') : {} }); } catch (e) { res.json({ meta: {} }); }
  });
});

// Chat messages endpoints
app.post('/api/messages', authMiddleware, (req, res) => {
  const { role, content } = req.body || {};
  const userId = req.user.id;

  // Validate input
  if (!validateRole(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be user, assistant, or system' });
  }
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Content is required and must be a string' });
  }

  // Sanitize input
  const sanitizedContent = sanitizeString(content, 5000);

  if (!sanitizedContent) {
    return res.status(400).json({ error: 'Content cannot be empty after sanitization' });
  }

  db.run('INSERT INTO messages (user_id, role, content) VALUES (?,?,?)', [userId, role, sanitizedContent], function(err) {
    if (err) return res.status(500).json({ error: String(err) });
    res.json({ id: this.lastID, role, content: sanitizedContent });
  });
});

app.get('/api/messages', authMiddleware, (req, res) => {
  const userId = req.user.id;
  db.all('SELECT * FROM messages WHERE user_id = ? ORDER BY created_at ASC', [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: String(err) });
    res.json(rows);
  });
});

// Settings endpoints (simple key/value store)
app.get('/api/settings/theme', (req, res) => {
  db.get('SELECT value FROM settings WHERE key = ?', ['theme'], (err, row) => {
    if (err) return res.status(500).json({ error: String(err) });
    res.json({ theme: (row && row.value) || 'light' });
  });
});

app.post('/api/settings/theme', (req, res) => {
  const theme = req.body && req.body.theme;

  // Validate input
  if (!theme || !validateTheme(theme)) {
    return res.status(400).json({ error: 'Valid theme is required' });
  }

  db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)', ['theme', theme], function(err) {
    if (err) return res.status(500).json({ error: String(err) });
    res.json({ theme });
  });
});

app.post('/api/user', (req, res) => {
  const { name, school, email, meta } = req.body || {};

  // Validate input
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Name is required and must be a string' });
  }
  if (school && typeof school !== 'string') {
    return res.status(400).json({ error: 'School must be a string' });
  }
  if (email && !validateEmail(email)) {
    return res.status(400).json({ error: 'Email must be valid' });
  }

  // Sanitize input
  const sanitizedName = sanitizeString(name, 100);
  const sanitizedSchool = school ? sanitizeString(school, 100) : '';
  const sanitizedEmail = email ? sanitizeString(email, 254).toLowerCase() : '';

  if (!sanitizedName) {
    return res.status(400).json({ error: 'Name cannot be empty after sanitization' });
  }

  db.run('INSERT INTO users (name, school, email, meta) VALUES (?,?,?,?)', [sanitizedName, sanitizedSchool, sanitizedEmail, JSON.stringify(meta || {})], function(err) {
    if (err) return res.status(500).json({ error: String(err) });
    res.json({ id: this.lastID, name: sanitizedName, school: sanitizedSchool, email: sanitizedEmail, meta });
  });
});

// Proxy endpoint
app.post('/gemini', async (req, res) => {
  try {
    if (!GEMINI_API_URL) return res.status(500).json({ error: 'GEMINI_API_URL not configured on server.' });

    // normalize incoming body and ensure contents items include a valid role
    let body = req.body || {};
    try {
      if (Array.isArray(body.contents)) {
        // If any item is missing a role, assign defaults: first -> 'model', rest -> 'user'
        let anyMissing = body.contents.some(c => !c || typeof c.role === 'undefined');
        if (anyMissing) {
          body.contents = body.contents.map((c, i) => {
            c = c || {};
            // normalize parts if caller sent { text: '...' } shape
            if (!Array.isArray(c.parts) && typeof c.text === 'string') c.parts = [{ text: c.text }];
            const role = c.role || (i === 0 ? 'model' : 'user');
            return { role, parts: Array.isArray(c.parts) ? c.parts : [] };
          });
          console.log('[proxy] Normalized incoming contents to include roles.');
        }
      }
    } catch (e) {
      console.warn('[proxy] Failed to normalize incoming body:', e);
      body = req.body || {};
    }

    // Ensure single-turn requests end with a user role: Google GL requires the last entry be a user role
    try {
      if (Array.isArray(body.contents) && body.contents.length > 0) {
        const last = body.contents[body.contents.length - 1];
        if (!last || last.role !== 'user') {
          // append a trailing empty user entry so the request is accepted as a single-turn
          body.contents.push({ role: 'user', parts: [{ text: '' }] });
          console.log('[proxy] Appended trailing user role to contents to satisfy single-turn requirement.');
        }
      }
    } catch (e) { /* ignore */ }

    // Log a safe, truncated preview of the incoming body for debugging (do NOT log API keys)
    try {
      const safePreview = JSON.stringify(body).slice(0, 1000);
      console.log('[proxy] Incoming /gemini body preview:', safePreview + (safePreview.length >= 1000 ? '...(truncated)' : ''));
    } catch (e) { /* ignore stringify errors */ }

    // Forward request to Gemini API
    const headers = {
      'Content-Type': 'application/json'
    };

    // Attach authenticated user's preferences (if a valid Bearer token is provided)
    // Only include preferences for regular chat messages — do NOT include them when the user message starts with a dot-command (e.g. .quiz, .generate)
    try {
      let includePrefs = false;
      let prefsMeta = null;
      // find last user message text to detect dot-commands
      if (Array.isArray(body.contents) && body.contents.length > 0) {
        const lastUser = [...body.contents].reverse().find(c => c && c.role === 'user' && Array.isArray(c.parts) && c.parts.length > 0);
        const lastText = lastUser && lastUser.parts && lastUser.parts.map(p=>p.text||'').join(' ').trim();
        if (lastText && !lastText.startsWith('.')) includePrefs = true;
      }

      // If Authorization header present, try to verify and load meta from auth_users
      const authHeader = req.headers && (req.headers.authorization || req.headers.Authorization);
      if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        try {
          const token = authHeader.split(' ')[1];
          const payload = jwt.verify(token, JWT_SECRET);
          if (payload && payload.id) {
            const userRow = await new Promise((resolve, reject) => db.get('SELECT * FROM auth_users WHERE id = ?', [payload.id], (err, row) => err ? reject(err) : resolve(row)));
            if (userRow) {
              try { prefsMeta = JSON.parse(userRow.meta || '{}'); } catch(e){ prefsMeta = {}; }
            }
          }
        } catch (e) {
          // token invalid — ignore and proceed without prefs
        }
      }

      if (includePrefs && prefsMeta) {
        // build a short human-friendly profile string
        const parts = [];
        if (prefsMeta.name) parts.push(`Name: ${prefsMeta.name}`);
        if (prefsMeta.school) parts.push(`School/Class: ${prefsMeta.school}`);
        if (prefsMeta.fav) parts.push(`Favorites: ${prefsMeta.fav}`);
        if (prefsMeta.hobbies) parts.push(`Hobbies: ${prefsMeta.hobbies}`);
        if (prefsMeta.movies) parts.push(`Movies/Music: ${prefsMeta.movies}`);
        if (prefsMeta.goals) parts.push(`Goals: ${prefsMeta.goals}`);
        const profileText = `User profile for personalization (do not reveal this verbatim to others):\n${parts.join('\n')}`;

        // Prepend as a model/system-style entry so the LLM sees it as context
        if (!Array.isArray(body.contents)) body.contents = [];
        // Avoid duplicate if already present
        const alreadyHas = body.contents.length && body.contents[0] && Array.isArray(body.contents[0].parts) && (body.contents[0].parts[0] && body.contents[0].parts[0].text || '').includes('User profile for personalization');
        if (!alreadyHas) body.contents.unshift({ role: 'model', parts: [{ text: profileText }] });

        // also send a compact base64 header with minimal identifying info (name, email)
        try {
          // Only include non-sensitive profile info here: name and school (do NOT include email)
          const safeHdr = Buffer.from(JSON.stringify({ name: prefsMeta.name || '', school: prefsMeta.school || '' })).toString('base64');
          headers['X-StudentBuddy-User'] = safeHdr;
        } catch (e) { /* ignore */ }
      } else {
        // Fall back to legacy last-saved profile in users table (but only if not a dot command)
        if (includePrefs) {
          try {
            const user = await new Promise((resolve, reject) => db.get('SELECT * FROM users ORDER BY id DESC LIMIT 1', (err, row) => err ? reject(err) : resolve(row)));
            if (user) headers['X-StudentBuddy-User'] = Buffer.from(JSON.stringify({ name: user.name, school: user.school })).toString('base64');
          } catch (e) { /* ignore */ }
        }
      }
    } catch (e) { /* ignore errors while looking up prefs */ }

    // Prefer server-side API key; fall back to client's key if provided (not recommended)
    const key = GEMINI_API_KEY || req.headers['x-goog-api-key'] || req.query.key;
    if (key) headers['X-goog-api-key'] = key;

    const r = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    const text = await r.text();
    // Log truncated upstream response for debugging
    try {
      const preview = (text || '').slice(0, 2000);
      console.log(`[proxy] Upstream status ${r.status}. Response preview: ${preview}${preview.length >= 2000 ? '...(truncated)' : ''}`);
    } catch (e) { /* ignore logging errors */ }

    // Try to parse JSON; if not JSON return raw text
    try { res.status(r.status).json(JSON.parse(text)); }
    catch (e) { res.status(r.status).send(text); }
  } catch (err) {
    console.error('Proxy error', err);
    res.status(500).json({ error: String(err) });
  }
});

// In production, serve the built frontend from ./dist
if (process.env.NODE_ENV === 'production') {
  const expressPath = require('path');
  const distDir = expressPath.join(__dirname, 'dist');
  app.use(express.static(distDir));
  // SPA fallback
  app.get('*', (req, res) => {
    res.sendFile(expressPath.join(distDir, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';

  res.status(500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Process-level error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Close database connection gracefully
  if (db) {
    db.close((closeErr) => {
      if (closeErr) console.error('Error closing database:', closeErr);
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit process for unhandled rejections in production
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (db) {
    db.close((err) => {
      if (err) console.error('Error closing database:', err);
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  if (db) {
    db.close((err) => {
      if (err) console.error('Error closing database:', err);
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

app.listen(PORT, () => console.log(`Gemini proxy listening on http://localhost:${PORT} (forwarding to ${GEMINI_API_URL || '<<not configured>>'})`));
