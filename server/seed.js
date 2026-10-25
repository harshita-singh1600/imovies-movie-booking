require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Movie, Theater, Show } = require('./models');
const { buildSeats } = require('./services/seats');

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/imovies');
  await Promise.all([User, Movie, Theater, Show].map((m) => m.deleteMany({})));
  await User.create([
    { name: 'Admin', email: 'admin@imovies.com', password: await bcrypt.hash('admin123', 10), role: 'admin' },
    { name: 'Demo User', email: 'user@imovies.com', password: await bcrypt.hash('user123', 10) },
  ]);
  const movies = await Movie.create([
    { title: 'Midnight Express Lane', genre: ['Thriller'], language: 'English', duration: 118, cast: ['A. Rao', 'J. Miller'], releaseDate: new Date('2026-09-12'), description: 'A night-shift train conductor uncovers a plot hidden in the timetable.' },
    { title: 'Monsoon Letters', genre: ['Drama', 'Romance'], language: 'Hindi', duration: 134, cast: ['S. Verma', 'R. Khan'], releaseDate: new Date('2026-10-02'), description: 'Two strangers trade handwritten letters through one long rainy season.' },
    { title: 'Orbit Kitchen', genre: ['Comedy', 'Sci-Fi'], language: 'English', duration: 102, cast: ['L. Chen', 'D. Okafor'], releaseDate: new Date('2026-10-16'), description: 'The first restaurant in orbit has one week to earn a star.' },
    { title: 'Kaveri Express', genre: ['Action'], language: 'Tamil', duration: 141, cast: ['V. Kumar', 'M. Devi'], releaseDate: new Date('2026-10-30'), description: 'A rescue mission races down a river that is about to flood.' },
  ]);
  const theater = await Theater.create({ name: 'Galaxy Cinemas', city: 'Raipur', screens: 3 });
  const day = 86400000, shows = [];
  for (const m of movies) for (let d = 1; d <= 3; d++) for (const h of [13, 18, 21]) {
    const t = new Date(Date.now() + d * day); t.setHours(h, 0, 0, 0);
    shows.push({ movie: m._id, theater: theater._id, screen: 1 + (h % 3), startTime: t, price: h === 21 ? 280 : 220, seats: buildSeats(6, 10) });
  }
  await Show.create(shows);
  console.log('Seeded: 2 users, 4 movies, 1 theater,', shows.length, 'shows');
  await mongoose.disconnect();
})();
