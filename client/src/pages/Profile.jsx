import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg, when } from '../api';

export default function Profile() {
  const [bookings, setBookings] = useState([]);
  const [favs, setFavs] = useState([]);
  const [err, setErr] = useState('');

  const load = () => {
    api.get('/bookings/me').then((r) => setBookings(r.data));
    api.get('/favorites').then((r) => setFavs(r.data));
  };
  useEffect(load, []);

  const cancel = async (id) => {
    if (!confirm('Cancel this booking? Your seats will be released.')) return;
    try { await api.delete('/bookings/' + id); load(); } catch (e) { setErr(errMsg(e)); }
  };

  return (
    <>
      <h1>My tickets</h1>
      {err && <p className="err">{err}</p>}
      {!bookings.length && <p className="muted">You have no bookings yet. <Link to="/">Find a movie</Link></p>}
      {bookings.map((b) => (
        <div key={b._id} className={`ticket ${b.status}`}>
          <div>
            <h3>{b.show?.movie?.title}</h3>
            <p className="muted">{b.show?.theater?.name} · Screen {b.show?.screen} · {b.show && when(b.show.startTime)}</p>
            <p>Seats {b.seats.join(', ')} · ₹{b.amount}</p>
          </div>
          <div className="stub">
            <b>{b.status}</b>
            <small>#{b._id.slice(-6)}</small>
            {b.status === 'confirmed' && <button className="ghost" onClick={() => cancel(b._id)}>Cancel</button>}
          </div>
        </div>
      ))}
      <h2>Watchlist</h2>
      {!favs.length && <p className="muted">Nothing saved. Open a movie and choose Add to watchlist.</p>}
      <div className="chips">{favs.map((m) => <Link key={m._id} className="chip" to={`/movies/${m._id}`}>{m.title}</Link>)}</div>
    </>
  );
}
