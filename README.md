# iMovies – Online Movie Ticket Booking System

## 1. Introduction
The project is developed using the MERN stack, which consists of MongoDB, Express.js, React.js, and Node.js. React.js is used to build the interactive frontend, while Node.js and Express.js handle server-side operations and API requests. MongoDB is used to store application data, including user information, movie details, and booking records. Authentication and role-based access control help distinguish regular users from administrators.
- **Project Title:** iMovies – Online Movie Ticket Booking System
- **Team Member:** Harshita Singh
- **Role:** Full-Stack Developer (Individual Project)

## 2. Project Overview
iMovies is a web application that allows users to browse movies, view showtimes, select seats, and book cinema tickets online.

**Key Features:**
- User registration and JWT-based authentication
- Movie search, filtering, ratings, and reviews
- Theatre and show management
- Interactive seat selection with real-time availability
- Ticket booking, cancellation, and booking history
- Watchlist and favourites
- Admin dashboard for managing movies, theatres, shows, users, and bookings
- Mock payment flow and email notifications (when SMTP is configured)

## 3. Architecture
- **Frontend:** React 18, Vite, React Router, Axios, CSS
- **Backend:** Node.js, Express.js, REST APIs, Socket.IO
- **Database:** MongoDB with Mongoose; stores users, movies, theatres, shows, bookings, payments, and reviews.

## 4. Setup Instructions

**Prerequisites:** Node.js 18+, npm 9+, Git, and MongoDB Atlas or local MongoDB.

```bash
git clone https://github.com/harshita-singh1600/imovies-movie-booking.git
cd imovies-movie-booking
cd server
npm install
```

Create `server/.env` using `.env.example` and configure `PORT`, `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, and `PAYMENT_MODE`.

Install frontend dependencies:

```bash
cd ../client
npm install
```

## 5. Folder Structure

- **client/** – React pages, routing, authentication context, API integration, and styling.
- **server/** – Express server, MongoDB models, API routes, middleware, booking services, and notifications.

## 6. Running the Application

Start the backend:

```bash
cd server
npm start
```

Start the frontend in another terminal:

```bash
cd client
npm run dev
```

Open `http://localhost:5173` in your browser. The backend runs on `http://localhost:5000`.

## 7. API Documentation

All endpoints use `/api`. Protected endpoints require a JWT bearer token.

- **Authentication:** `/auth/register`, `/auth/login`, `/auth/me`
- **Movies:** `/movies`, `/movies/:id`, `/movies/:id/reviews`
- **Theatres and Shows:** `/theaters`, `/shows`, `/shows/:id`
- **Bookings:** `/shows/:id/lock`, `/shows/:id/unlock`, `/bookings`, `/bookings/me`
- **Payments:** `/payments/order`, `/payments/verify`
- **Favourites:** `/favorites`, `/favorites/:movieId`
- **Admin:** `/admin/stats`, `/admin/bookings`, `/admin/users`

## 8. Authentication
Passwords are hashed using bcrypt, and JWTs are used for authentication. Role-based authorization restricts administrative operations to admin users.

## 9. User Interface
The application includes movie listings, movie details, seat selection, login/registration, booking history, and an admin dashboard. Screenshots can be added to this README.

## 10. Testing
Manual functional testing covers authentication, movie browsing, seat locking, bookings, cancellations, payments, and admin access. Automated tests are planned for future development.

## 11. Future Enhancements
- Complete Razorpay Checkout integration and automatic refunds
- QR-code tickets and SMS notifications
- Movie recommendations and promotional offers
- Automated testing, pagination, and performance improvements

**GitHub:** https://github.com/harshita-singh1600/imovies-movie-booking

**Demo Video:** https://drive.google.com/drive/folders/1gskg_JlwGnd2ZKt3qDrE9Y_mKk3f_1en?usp=sharing


