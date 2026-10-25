const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const ref = (name) => ({ type: Schema.Types.ObjectId, ref: name });

const User = model('User', new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  favorites: [ref('Movie')],
}, { timestamps: true }));

const Movie = model('Movie', new Schema({
  title: { type: String, required: true, trim: true },
  genre: [String], language: String, duration: Number,
  cast: [String], releaseDate: Date, poster: String, description: String,
  rating: { type: Number, default: 0 }, ratingCount: { type: Number, default: 0 },
}, { timestamps: true }));

const Theater = model('Theater', new Schema({ name: { type: String, required: true }, city: String, screens: { type: Number, default: 1 } }));

const Show = model('Show', new Schema({
  movie: ref('Movie'), theater: ref('Theater'), screen: { type: Number, default: 1 },
  startTime: { type: Date, required: true }, price: { type: Number, required: true },
  seats: [{ seatNo: String, status: { type: String, enum: ['available', 'locked', 'booked'], default: 'available' }, lockedBy: ref('User'), lockExpiry: Date, _id: false }],
}));

const Booking = model('Booking', new Schema({
  user: ref('User'), show: ref('Show'), seats: [String], amount: Number,
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  payment: ref('Payment'),
}, { timestamps: true }));

const Payment = model('Payment', new Schema({
  booking: ref('Booking'), user: ref('User'), amount: Number, orderId: String, paymentId: String,
  status: { type: String, default: 'paid' },
}, { timestamps: true }));

const reviewSchema = new Schema({
  user: ref('User'), movie: ref('Movie'), rating: { type: Number, min: 1, max: 5, required: true }, comment: String,
}, { timestamps: true });
reviewSchema.index({ user: 1, movie: 1 }, { unique: true });
const Review = model('Review', reviewSchema);

module.exports = { User, Movie, Theater, Show, Booking, Payment, Review };
