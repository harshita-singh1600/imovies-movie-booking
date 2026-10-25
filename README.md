# iMovies – Movie Ticket Booking (MERN)

React + Vite client, Node/Express API, MongoDB, Socket.io for live seat updates.

## Run locally
Requirements: Node 18+, MongoDB (local or Atlas).

```bash
# 1. API
cd server
cp .env.example .env        # set MONGO_URI and JWT_SECRET
npm install
npm run seed                # demo movies, theater, shows + users
npm run dev                 # http://localhost:5000

# 2. Client (new terminal)
cd client
npm install
npm run dev                 # http://localhost:5173
```
Demo logins after seeding: `admin@imovies.com / admin123` (admin), `user@imovies.com / user123`.

## What is included
- Register / login (JWT, bcrypt), role-based admin routes
- Movie listing with search and genre/language filters, details, reviews and ratings
- Watchlist (favorites)
- Theaters and shows (admin), seat grid per show
- Seat locking with expiry (atomic per-seat update) and live updates over Socket.io
- Booking, cancellation, booking history
- Payments: `PAYMENT_MODE=mock` (default) confirms instantly; `razorpay` creates a real order and verifies the signature on the server (you still need to add Razorpay Checkout on the client)
- Email notifications via SMTP (logged to the console if SMTP is not configured; SMS is not implemented)
- Admin dashboard: stats, add movie/theater/show, recent bookings
- Security: helmet, CORS, rate limiting, Mongo sanitization, input checks

## API summary
- Auth: `POST /api/auth/register|login`, `GET /api/auth/me`
- Catalog: `GET /api/movies`, `GET /api/movies/:id`, `GET /api/shows?movie=`, `GET /api/shows/:id`, reviews, favorites
- Booking: `POST /api/shows/:id/lock|unlock`, `POST /api/bookings`, `GET /api/bookings/me`, `DELETE /api/bookings/:id`, `POST /api/payments/order|verify`
- Admin: `/api/admin/stats|bookings|users` plus POST/DELETE on movies, theaters, shows

## Notes
A working starting point, not yet load-tested. Before deploying: set strong secrets, enable HTTPS, add payment webhooks.
