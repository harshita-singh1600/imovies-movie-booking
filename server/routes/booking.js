const r = require('express').Router();
const crypto = require('crypto');
const { Show, Booking, Payment, User } = require('../models');
const { wrap, auth } = require('../middleware');
const { release, oid, UNLOCK } = require('../services/seats');
const { email } = require('../services/notify');

const HOLD_MS = (+process.env.SEAT_HOLD_MINUTES || 8) * 60000;
const changed = (req, showId) => req.app.get('io').to('show:' + showId).emit('seats:changed');
const cleanSeats = (v) => [...new Set(Array.isArray(v) ? v.map(String) : [])];

// ---- Seat holds: each seat is claimed with one atomic update, so two users can never hold the same seat.
r.post('/shows/:id/lock', auth, wrap(async (req, res) => {
  const seats = cleanSeats(req.body.seats);
  if (!seats.length || seats.length > 8) return res.status(400).json({ message: 'Pick between 1 and 8 seats.' });
  const now = new Date(), expiresAt = new Date(+now + HOLD_MS), uid = oid(req.user.id), got = [];
  for (const s of seats) {
    const hit = await Show.updateOne(
      { _id: req.params.id, seats: { $elemMatch: { seatNo: s, $or: [{ status: 'available' }, { status: 'locked', lockExpiry: { $lt: now } }, { status: 'locked', lockedBy: uid }] } } },
      { $set: { 'seats.$.status': 'locked', 'seats.$.lockedBy': uid, 'seats.$.lockExpiry': expiresAt } }
    );
    if (!hit.matchedCount) {
      await release(req.params.id, got, req.user.id);
      changed(req, req.params.id);
      return res.status(409).json({ message: `Seat ${s} was just taken. Please choose another.` });
    }
    got.push(s);
  }
  changed(req, req.params.id);
  res.json({ seats: got, expiresAt });
}));

r.post('/shows/:id/unlock', auth, wrap(async (req, res) => {
  await release(req.params.id, cleanSeats(req.body.seats), req.user.id);
  await Booking.updateMany({ user: req.user.id, show: req.params.id, status: 'pending' }, { status: 'cancelled' });
  changed(req, req.params.id);
  res.json({ ok: true });
}));

// ---- Bookings
r.post('/bookings', auth, wrap(async (req, res) => {
  const seats = cleanSeats(req.body.seats);
  const show = await Show.findById(req.body.showId);
  if (!show || !seats.length) return res.status(400).json({ message: 'Choose a show and at least one seat.' });
  const now = new Date();
  const ok = seats.every((n) => {
    const s = show.seats.find((x) => x.seatNo === n);
    return s && s.status === 'locked' && String(s.lockedBy) === String(req.user.id) && s.lockExpiry > now;
  });
  if (!ok) return res.status(409).json({ message: 'Your seat hold has expired. Please select seats again.' });
  await Booking.updateMany({ user: req.user.id, show: show._id, status: 'pending' }, { status: 'cancelled' });
  res.status(201).json(await Booking.create({ user: req.user.id, show: show._id, seats, amount: show.price * seats.length }));
}));

r.get('/bookings/me', auth, wrap(async (req, res) => {
  res.json(await Booking.find({ user: req.user.id, status: { $ne: 'pending' } })
    .populate({ path: 'show', select: '-seats', populate: [{ path: 'movie', select: 'title' }, { path: 'theater' }] }).sort({ createdAt: -1 }));
}));

r.delete('/bookings/:id', auth, wrap(async (req, res) => {
  const b = await Booking.findOne({ _id: req.params.id, user: req.user.id }).populate('show', 'startTime');
  if (!b || b.status !== 'confirmed') return res.status(404).json({ message: 'Booking not found.' });
  if (b.show.startTime < new Date()) return res.status(400).json({ message: 'This show has already started.' });
  await Show.updateOne({ _id: b.show._id }, UNLOCK, { arrayFilters: [{ 's.seatNo': { $in: b.seats } }] });
  b.status = 'cancelled';
  await b.save();
  if (b.payment) await Payment.findByIdAndUpdate(b.payment, { status: 'refund-due' });
  changed(req, b.show._id);
  res.json({ ok: true });
}));

// ---- Payments (PAYMENT_MODE=mock | razorpay)
const razorpay = () => process.env.PAYMENT_MODE === 'razorpay';

r.post('/payments/order', auth, wrap(async (req, res) => {
  const b = await Booking.findOne({ _id: req.body.bookingId, user: req.user.id, status: 'pending' });
  if (!b) return res.status(404).json({ message: 'Booking not found or already paid.' });
  if (!razorpay()) return res.json({ orderId: 'mock_order_' + b._id, amount: b.amount, mode: 'mock' });
  const key = `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`;
  const resp = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + Buffer.from(key).toString('base64') },
    body: JSON.stringify({ amount: b.amount * 100, currency: 'INR', receipt: String(b._id) }),
  });
  const o = await resp.json();
  if (!resp.ok) return res.status(502).json({ message: 'The payment provider returned an error. Please try again.' });
  res.json({ orderId: o.id, amount: b.amount, mode: 'razorpay', keyId: process.env.RAZORPAY_KEY_ID });
}));

r.post('/payments/verify', auth, wrap(async (req, res) => {
  const { bookingId, orderId, paymentId, signature } = req.body;
  const b = await Booking.findOne({ _id: bookingId, user: req.user.id, status: 'pending' });
  if (!b) return res.status(404).json({ message: 'Booking not found or already paid.' });
  if (razorpay()) {
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
    if (expected !== signature) return res.status(400).json({ message: 'Payment could not be verified.' });
  }
  const done = await Show.updateOne(
    { _id: b.show },
    { $set: { 'seats.$[s].status': 'booked' }, $unset: { 'seats.$[s].lockedBy': '', 'seats.$[s].lockExpiry': '' } },
    { arrayFilters: [{ 's.seatNo': { $in: b.seats }, 's.status': 'locked', 's.lockedBy': oid(req.user.id) }] }
  );
  if (!done.modifiedCount) return res.status(410).json({ message: 'Your seat hold expired before payment completed. Please book again.' });
  const p = await Payment.create({ booking: b._id, user: req.user.id, amount: b.amount, orderId, paymentId });
  b.status = 'confirmed'; b.payment = p._id;
  await b.save();
  changed(req, b.show);
  const u = await User.findById(req.user.id);
  const sh = await Show.findById(b.show).populate('movie', 'title').populate('theater');
  email(u.email, `Booking confirmed: ${sh.movie.title}`,
    `Hi ${u.name},\n\nYour booking ${b._id} is confirmed.\nMovie: ${sh.movie.title}\nTheater: ${sh.theater.name}\nTime: ${sh.startTime.toLocaleString()}\nSeats: ${b.seats.join(', ')}\nPaid: Rs. ${b.amount}\n`);
  res.json(b);
}));

module.exports = r;
