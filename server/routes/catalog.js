const r = require('express').Router();
const { Movie, Theater, Show, Review, User } = require('../models');
const { wrap, auth, optAuth, admin } = require('../middleware');
const { buildSeats } = require('../services/seats');

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const list = (v) => (Array.isArray(v) ? v : String(v || '').split(',')).map((x) => String(x).trim()).filter(Boolean);

// ---- Movies
r.get('/movies', wrap(async (req, res) => {
  const { q, genre, language } = req.query;
  const f = {};
  if (q) f.title = new RegExp(esc(q), 'i');
  if (genre) f.genre = String(genre);
  if (language) f.language = String(language);
  res.json(await Movie.find(f).sort({ releaseDate: -1 }));
}));
r.get('/movies/:id', wrap(async (req, res) => {
  const m = await Movie.findById(req.params.id);
  m ? res.json(m) : res.status(404).json({ message: 'Movie not found.' });
}));
r.post('/movies', auth, admin, wrap(async (req, res) => {
  const b = req.body;
  if (!b.title) return res.status(400).json({ message: 'A title is required.' });
  res.status(201).json(await Movie.create({
    title: b.title, language: b.language, duration: Number(b.duration) || undefined, description: b.description,
    releaseDate: b.releaseDate || undefined, poster: b.poster, genre: list(b.genre), cast: list(b.cast),
  }));
}));
r.delete('/movies/:id', auth, admin, wrap(async (req, res) => { await Movie.findByIdAndDelete(req.params.id); res.json({ ok: true }); }));

// ---- Reviews
r.get('/movies/:id/reviews', wrap(async (req, res) => {
  res.json(await Review.find({ movie: req.params.id }).populate('user', 'name').sort({ createdAt: -1 }));
}));
r.post('/movies/:id/reviews', auth, wrap(async (req, res) => {
  const rating = Number(req.body.rating);
  if (!(rating >= 1 && rating <= 5)) return res.status(400).json({ message: 'Choose a rating from 1 to 5.' });
  await Review.findOneAndUpdate({ user: req.user.id, movie: req.params.id }, { rating, comment: String(req.body.comment || '').slice(0, 500) }, { upsert: true });
  const all = await Review.find({ movie: req.params.id });
  const avg = all.reduce((a, x) => a + x.rating, 0) / all.length;
  await Movie.findByIdAndUpdate(req.params.id, { rating: Math.round(avg * 10) / 10, ratingCount: all.length });
  res.status(201).json({ ok: true });
}));

// ---- Favorites
r.get('/favorites', auth, wrap(async (req, res) => res.json((await User.findById(req.user.id).populate('favorites')).favorites)));
r.post('/favorites/:movieId', auth, wrap(async (req, res) => {
  const u = await User.findById(req.user.id);
  const has = u.favorites.some((id) => String(id) === req.params.movieId);
  has ? u.favorites.pull(req.params.movieId) : u.favorites.push(req.params.movieId);
  await u.save();
  res.json({ favorite: !has });
}));

// ---- Theaters
r.get('/theaters', wrap(async (req, res) => res.json(await Theater.find())));
r.post('/theaters', auth, admin, wrap(async (req, res) => {
  if (!req.body.name) return res.status(400).json({ message: 'A theater name is required.' });
  res.status(201).json(await Theater.create({ name: req.body.name, city: req.body.city, screens: Number(req.body.screens) || 1 }));
}));

// ---- Shows
r.get('/shows', wrap(async (req, res) => {
  const f = { startTime: { $gte: new Date() } };
  if (req.query.movie) f.movie = req.query.movie;
  res.json(await Show.find(f).select('-seats').populate('theater').populate('movie', 'title').sort({ startTime: 1 }));
}));
r.get('/shows/:id', optAuth, wrap(async (req, res) => {
  const s = await Show.findById(req.params.id).populate('movie', 'title duration').populate('theater');
  if (!s) return res.status(404).json({ message: 'Show not found.' });
  const now = new Date(), uid = req.user && String(req.user.id);
  const seats = s.seats.map((x) => ({
    seatNo: x.seatNo,
    status: x.status === 'booked' ? 'booked'
      : x.status === 'locked' && x.lockExpiry > now ? (String(x.lockedBy) === uid ? 'mine' : 'locked') : 'available',
  }));
  res.json({ _id: s._id, movie: s.movie, theater: s.theater, screen: s.screen, startTime: s.startTime, price: s.price, seats });
}));
r.post('/shows', auth, admin, wrap(async (req, res) => {
  const { movie, theater, screen, startTime, price, rows, cols } = req.body;
  if (!movie || !theater || !startTime || !(Number(price) > 0)) return res.status(400).json({ message: 'Movie, theater, start time and price are required.' });
  res.status(201).json(await Show.create({ movie, theater, screen: Number(screen) || 1, startTime, price: Number(price), seats: buildSeats(Number(rows) || 6, Number(cols) || 10) }));
}));
r.delete('/shows/:id', auth, admin, wrap(async (req, res) => { await Show.findByIdAndDelete(req.params.id); res.json({ ok: true }); }));

module.exports = r;
