require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const sanitize = require('express-mongo-sanitize');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const { releaseExpired } = require('./services/seats');

const app = express();
const server = http.createServer(app);
const origin = process.env.CLIENT_URL || 'http://localhost:5173';
const io = new Server(server, { cors: { origin } });
app.set('io', io);

app.use(helmet());
app.use(cors({ origin }));
app.use(express.json({ limit: '100kb' }));
app.use(sanitize());
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 600 }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 40 }), require('./routes/auth'));
app.use('/api', require('./routes/catalog'));
app.use('/api', require('./routes/booking'));
app.use('/api/admin', require('./routes/admin'));
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid id.' });
  res.status(err.status || 500).json({ message: err.status ? err.message : 'Something went wrong.' });
});

io.on('connection', (s) => {
  s.on('join', (id) => s.join('show:' + id));
  s.on('leave', (id) => s.leave('show:' + id));
});

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/imovies').then(() => {
  setInterval(async () => {
    try { if (await releaseExpired()) io.emit('seats:changed'); } catch (e) { console.error(e.message); }
  }, 30000);
  const port = process.env.PORT || 5000;
  server.listen(port, () => console.log('API on http://localhost:' + port));
}).catch((e) => { console.error('MongoDB connection failed:', e.message); process.exit(1); });
