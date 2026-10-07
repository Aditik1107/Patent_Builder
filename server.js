require('dotenv').config();
const express = require('express');
const path = require('path');
const { generateDraft, extractFromText } = require('./lib/generate');
const { buildDocx } = require('./lib/buildDocx');

const session = require('express-session');
const bcrypt = require('bcryptjs');
const { sql } = require('./lib/db');

const rateLimit = require('express-rate-limit');
const multer = require('multer');
const officeParser = require('officeparser');
const fs = require('fs');

const os = require('os');
const upload = multer({ dest: os.tmpdir() });

const app = express();
app.use(express.json({ limit: '50mb' }));

app.use(session({
  secret: 'patent-secret-key-123',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'strict' } // 1 day, secure cookies
}));

// Rate limiting for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: { error: 'Too many login attempts from this IP, please try again after 15 minutes.' }
});

// Auth check middleware
const requireAuth = (req, res, next) => {
  if (req.session.userId) return next();
  res.status(401).json({ error: 'Unauthorized. Please log in.' });
};

app.post('/api/extract', requireAuth, upload.single('presentation'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    
    // Add extension back so officeparser knows what it is
    const ext = path.extname(req.file.originalname) || '.pptx';
    const newPath = req.file.path + ext;
    fs.renameSync(req.file.path, newPath);

    // parse text
    const doc = await officeParser.parseOffice(newPath);
    const textObj = await doc.to('txt');
    const text = textObj.value;
    
    if (!text || text.trim() === '') throw new Error('No text found in presentation.');

    // LLM extraction
    const extractedData = await extractFromText(text);

    // cleanup
    try { fs.unlinkSync(newPath); } catch (e) {}
    
    res.json(extractedData);
  } catch (err) {
    console.error(err);
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    res.status(500).json({ error: 'Failed to extract content from file. ' + err.message });
  }
});

// Password validation function
const isStrongPassword = (password) => {
  return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);
};

// Auth routes
app.post('/api/register', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });
    
    if (username.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters long.' });
    if (!isStrongPassword(password)) return res.status(400).json({ error: 'Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, and a number.' });

    const hash = await bcrypt.hash(password, 10);
    try {
      await sql`INSERT INTO users (username, password) VALUES (${username}, ${hash})`;
      res.json({ success: true });
    } catch (err) {
      if (err.code === '23505') { // Postgres unique violation
        return res.status(400).json({ error: 'Username already exists' });
      }
      throw err;
    }
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed: ' + (err.message || 'Database connection error') });
  }
});

app.post('/api/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });

    const users = await sql`SELECT * FROM users WHERE username = ${username} LIMIT 1`;
    const user = users[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    req.session.userId = user.id;
    req.session.username = user.username;
    res.json({ success: true, username: user.username });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/me', (req, res) => {
  if (req.session.userId) {
    res.json({ loggedIn: true, username: req.session.username });
  } else {
    res.json({ loggedIn: false });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

// --- Drafts API ---
app.get('/api/drafts', requireAuth, async (req, res) => {
  try {
    const drafts = await sql`SELECT id, title, updated_at FROM drafts WHERE user_id = ${req.session.userId} ORDER BY updated_at DESC`;
    res.json(drafts || []);
  } catch (err) {
    console.error('Fetch drafts error:', err);
    res.status(500).json({ error: 'Failed to fetch drafts' });
  }
});

app.get('/api/drafts/:id', requireAuth, async (req, res) => {
  try {
    const drafts = await sql`SELECT * FROM drafts WHERE id = ${req.params.id} AND user_id = ${req.session.userId} LIMIT 1`;
    const draft = drafts[0];
    if (!draft) return res.status(404).json({ error: 'Draft not found' });
    res.json(draft);
  } catch (err) {
    console.error('Fetch draft error:', err);
    res.status(500).json({ error: 'Failed to fetch draft' });
  }
});

app.post('/api/drafts', requireAuth, async (req, res) => {
  try {
    const { id, title, problem, solution, components, results } = req.body;
    const now = new Date().toISOString();
    
    if (id) {
      // Update existing
      const updated = await sql`
        UPDATE drafts SET title = ${title}, problem = ${problem}, solution = ${solution}, components = ${components}, results = ${results}, updated_at = ${now}
        WHERE id = ${id} AND user_id = ${req.session.userId}
        RETURNING id
      `;
        
      if (!updated || updated.length === 0) return res.status(404).json({ error: 'Draft not found' });
      res.json({ success: true, id });
    } else {
      // Insert new
      const inserted = await sql`
        INSERT INTO drafts (user_id, title, problem, solution, components, results, updated_at)
        VALUES (${req.session.userId}, ${title}, ${problem}, ${solution}, ${components}, ${results}, ${now})
        RETURNING id
      `;
        
      res.json({ success: true, id: inserted[0].id });
    }
  } catch (err) {
    console.error('Save draft error:', err);
    res.status(500).json({ error: 'Failed to save draft' });
  }
});

app.delete('/api/drafts/:id', requireAuth, async (req, res) => {
  try {
    await sql`DELETE FROM drafts WHERE id = ${req.params.id} AND user_id = ${req.session.userId}`;
    res.json({ success: true });
  } catch (err) {
    console.error('Delete draft error:', err);
    res.status(500).json({ error: 'Failed to delete draft' });
  }
});

const DOMAIN = (process.env.ALLOWED_EMAIL_DOMAIN || 'vit.edu').toLowerCase();
const LIMIT = parseInt(process.env.RATE_LIMIT_PER_HOUR || '6', 10);
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 3600e3);
  if (arr.length >= LIMIT) return true;
  arr.push(now); hits.set(ip, arr); return false;
}

const clean = (s, max) => String(s || '').trim().slice(0, max);

app.post('/api/generate', requireAuth, async (req, res) => {
  try {
    if (process.env.ACCESS_CODE && req.get('x-access-code') !== process.env.ACCESS_CODE)
      return res.status(401).json({ error: 'Invalid access code.' });
    if (limited(req.ip)) return res.status(429).json({ error: 'Too many drafts from this network. Try again in an hour.' });

    const b = req.body || {};
    const inventors = (Array.isArray(b.inventors) ? b.inventors : []).slice(0, 8).map((v) => ({
      name: clean(v.name, 80), email: clean(v.email, 80), phone: clean(v.phone, 20), signature: v.signature
    })).filter((v) => v.name);

    const input = {
      title: clean(b.title, 200),
      problem: clean(b.problem, 3000),
      solution: clean(b.solution, 6000),
      components: clean(b.components, 2000),
      results: clean(b.results, 3000),
      department: clean(b.department, 150) || 'Department of [Add department]',
      inventors
    };
    if (input.problem.length < 40 || input.solution.length < 100)
      return res.status(400).json({ error: 'Please describe the problem (min 40 chars) and the solution (min 100 chars) in more detail.' });
    if (!inventors.length) return res.status(400).json({ error: 'Add at least one inventor.' });
    if (!inventors[0].email.toLowerCase().endsWith('@' + DOMAIN))
      return res.status(400).json({ error: `The first inventor's email must end with @${DOMAIN}.` });

    const draft = await generateDraft(input);
    const buf = await buildDocx(draft, input);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename="Patent_Draft.docx"',
    });
    res.send(buf); // nothing is stored on the server
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: 'Generation failed. Please try again.' });
  }
});

app.get('/api/config', (_, r) => r.json({ needsCode: !!process.env.ACCESS_CODE }));
app.get('/healthz', (_, r) => r.send('ok'));
const port = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(port, () => console.log('Listening on ' + port));
}
module.exports = app;
