require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/db');
const { User } = require('./models');

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));

// Serverless-compatible: connect (cached) before every non-health route.
// Local start also calls connectDB() below, so `node src/index.js` works unchanged.
let dbPromise = null;
app.use(async (req, res, next) => {
  if (req.path === '/api/health') return next();
  try {
    if (!dbPromise) dbPromise = connectDB();
    await dbPromise; next();
  } catch (e) { console.error(e); res.status(500).json({ error: 'Database connection failed', detail: e.message }); }
});

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'craftnest-server' }));
app.get('/api/db-check', async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ ok: true, db: 'connected', userCount: count });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/catalog'));
app.use('/api', require('./routes/commerce'));
app.use('/api', require('./routes/sellerAdmin'));

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Internal server error' }); });

module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 5001;
  connectDB().then(async () => {
    // Local in-memory only: each process gets its own empty DB, so an explicit
    // `npm run seed` in another process would not be visible here. Auto-seed
    // only when MONGO_URI is unset AND the DB is empty, so production Atlas
    // is never auto-seeded and explicit seeding remains the documented path.
    if (!process.env.MONGO_URI) {
      const { Product } = require('./models');
      if ((await Product.countDocuments()) === 0) {
        console.log('[craftnest] Local DB empty - auto-seeding demo data (in-memory only)');
        await require('./seed').seedData();
      }
    }
    app.listen(port, () => console.log(`[craftnest] API listening on http://localhost:${port}`));
  }).catch(e => { console.error(e); process.exit(1); });
}
