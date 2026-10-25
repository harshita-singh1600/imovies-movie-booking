import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export const Poster = ({ m }) => {
  const hue = [...(m.title || 'x')].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return m.poster
    ? <img className="poster" src={m.poster} alt={m.title} />
    : <div className="poster ph" style={{ '--h': hue }}><span>{m.title}</span></div>;
};

export default function Movies() {
  const [movies, setMovies] = useState([]);
  const [f, setF] = useState({ q: '', genre: '', language: '' });
  const [all, setAll] = useState([]);

  useEffect(() => { api.get('/movies').then((r) => setAll(r.data)); }, []);
  useEffect(() => {
    const t = setTimeout(() => api.get('/movies', { params: f }).then((r) => setMovies(r.data)), 200);
    return () => clearTimeout(t);
  }, [f]);

  const genres = [...new Set(all.flatMap((m) => m.genre))];
  const langs = [...new Set(all.map((m) => m.language).filter(Boolean))];
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <>
      <h1>Now showing</h1>
      <div className="filters">
        <input placeholder="Search by title" value={f.q} onChange={set('q')} />
        <select value={f.genre} onChange={set('genre')}><option value="">All genres</option>{genres.map((g) => <option key={g}>{g}</option>)}</select>
        <select value={f.language} onChange={set('language')}><option value="">All languages</option>{langs.map((l) => <option key={l}>{l}</option>)}</select>
      </div>
      {!movies.length && <p className="muted">No movies match these filters. Clear a filter to see more.</p>}
      <div className="grid">
        {movies.map((m) => (
          <Link to={`/movies/${m._id}`} key={m._id} className="card">
            <Poster m={m} />
            <h3>{m.title}</h3>
            <p className="muted">{m.genre.join(', ')} · {m.language} · {m.duration} min</p>
            <p className="rate">{m.ratingCount ? `★ ${m.rating} (${m.ratingCount})` : 'No ratings yet'}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
