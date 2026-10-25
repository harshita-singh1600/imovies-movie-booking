import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errMsg, when } from '../api';
import { useAuth } from '../auth.jsx';
import { Poster } from './Movies.jsx';

export default function MovieDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [m, setM] = useState(null);
  const [shows, setShows] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [fav, setFav] = useState(false);
  const [rv, setRv] = useState({ rating: 5, comment: '' });
  const [msg, setMsg] = useState('');

  const load = () => {
    api.get('/movies/' + id).then((r) => setM(r.data));
    api.get('/shows', { params: { movie: id } }).then((r) => setShows(r.data));
    api.get(`/movies/${id}/reviews`).then((r) => setReviews(r.data));
  };
  useEffect(() => {
    load();
    if (user) api.get('/favorites').then((r) => setFav(r.data.some((x) => x._id === id)));
  }, [id, user]);

  const toggleFav = async () => setFav((await api.post('/favorites/' + id)).data.favorite);
  const submit = async (e) => {
    e.preventDefault();
    try { await api.post(`/movies/${id}/reviews`, rv); setRv({ rating: 5, comment: '' }); setMsg(''); load(); }
    catch (er) { setMsg(errMsg(er)); }
  };

  if (!m) return <p className="muted">Loading…</p>;
  const days = shows.reduce((a, s) => { const k = new Date(s.startTime).toDateString(); (a[k] = a[k] || []).push(s); return a; }, {});

  return (
    <>
      <div className="detail">
        <Poster m={m} />
        <div>
          <h1>{m.title}</h1>
          <p className="muted">{m.genre.join(', ')} · {m.language} · {m.duration} min · Releases {new Date(m.releaseDate).toLocaleDateString()}</p>
          <p>{m.description}</p>
          <p><b>Cast:</b> {m.cast.join(', ')}</p>
          <p className="rate">{m.ratingCount ? `★ ${m.rating} from ${m.ratingCount} reviews` : 'No ratings yet'}</p>
          {user ? <button className="ghost" onClick={toggleFav}>{fav ? 'Remove from watchlist' : 'Add to watchlist'}</button>
                : <Link to="/login" className="muted">Log in to save this movie</Link>}
        </div>
      </div>

      <h2>Showtimes</h2>
      {!shows.length && <p className="muted">No upcoming shows for this movie yet.</p>}
      {Object.entries(days).map(([d, list]) => (
        <div key={d} className="day">
          <h3>{new Date(d).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
          <div className="times">
            {list.map((s) => (
              <Link key={s._id} to={`/shows/${s._id}/seats`} className="time">
                <b>{new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b>
                <small>{s.theater?.name} · Screen {s.screen}</small>
                <small>₹{s.price}</small>
              </Link>
            ))}
          </div>
        </div>
      ))}

      <h2>Reviews</h2>
      {user && (
        <form className="row" onSubmit={submit}>
          <select value={rv.rating} onChange={(e) => setRv({ ...rv, rating: e.target.value })}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}</select>
          <input placeholder="What did you think?" value={rv.comment} onChange={(e) => setRv({ ...rv, comment: e.target.value })} maxLength={500} />
          <button>Post review</button>
        </form>
      )}
      {msg && <p className="err">{msg}</p>}
      {!reviews.length && <p className="muted">No reviews yet. Watched it? Be the first to review.</p>}
      {reviews.map((r) => <div key={r._id} className="review"><b>{r.user?.name}</b> <span className="rate">{'★'.repeat(r.rating)}</span><p>{r.comment}</p></div>)}
    </>
  );
}
