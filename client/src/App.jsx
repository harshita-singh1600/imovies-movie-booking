import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Movies from './pages/Movies.jsx';
import MovieDetail from './pages/MovieDetail.jsx';
import Seats from './pages/Seats.jsx';
import Profile from './pages/Profile.jsx';
import Login from './pages/Login.jsx';
import Admin from './pages/Admin.jsx';

function Guard({ children, admin }) {
  const { user, ready } = useAuth();
  if (!ready) return <p className="muted">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user, logout } = useAuth();
  return (
    <>
      <header className="nav">
        <Link to="/" className="brand">iMovies</Link>
        <nav>
          <NavLink to="/" end>Now showing</NavLink>
          {user && <NavLink to="/profile">My tickets</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
          {user ? <button className="link" onClick={logout}>Log out ({user.name.split(' ')[0]})</button> : <NavLink to="/login">Log in</NavLink>}
        </nav>
      </header>
      <main className="wrap">
        <Routes>
          <Route path="/" element={<Movies />} />
          <Route path="/movies/:id" element={<MovieDetail />} />
          <Route path="/shows/:id/seats" element={<Seats />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Guard><Profile /></Guard>} />
          <Route path="/admin" element={<Guard admin><Admin /></Guard>} />
          <Route path="*" element={<p className="muted">That page does not exist. <Link to="/">Back to movies</Link></p>} />
        </Routes>
      </main>
    </>
  );
}
