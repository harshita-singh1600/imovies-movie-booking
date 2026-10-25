const r = require('express').Router();
const { User, Movie, Theater, Show, Booking, Payment } = require('../models');
const { wrap, auth, admin } = require('../middleware');

r.use(auth, admin);

r.get('/stats', wrap(async (req, res) => {
  const [users, movies, theaters, shows, bookings, rev] = await Promise.all([
    User.countDocuments(), Movie.countDocuments(), Theater.countDocuments(), Show.countDocuments(),
    Booking.countDocuments({ status: 'confirmed' }),
    Payment.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);
  res.json({ users, movies, theaters, shows, bookings, revenue: rev[0] ? rev[0].total : 0 });
}));

r.get('/bookings', wrap(async (req, res) => {
  res.json(await Booking.find({ status: { $ne: 'pending' } }).sort({ createdAt: -1 }).limit(50)
    .populate('user', 'name email').populate({ path: 'show', select: 'startTime', populate: { path: 'movie', select: 'title' } }));
}));

r.get('/users', wrap(async (req, res) => res.json(await User.find().select('-password -favorites').sort({ createdAt: -1 }).limit(100))));

module.exports = r;
