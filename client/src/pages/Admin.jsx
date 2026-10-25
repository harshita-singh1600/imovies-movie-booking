import { useEffect, useState } from 'react';
import api, { errMsg, when } from '../api';

const Field = ({ label, ...p }) => <label>{label}<input {...p} /></label>;

export default function Admin() {
  const [stats, setStats] = useState({});
  const [movies, setMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [msg, setMsg] = useState('');
  const [mv, setMv] = useState({ title: '', genre: '', language: '', duration: '', cast: '', releaseDate: '', description: '' });
  const [th, setTh] = useState({ name: '', city: '', screens: 1 });
  const [sh, setSh] = useState({ movie: '', theater: '', screen: 1, startTime: '', price: '' });

  const load = () => {
    api.get('/admin/stats').then((r) => setStats(r.data));
    api.get('/movies').then((r) => setMovies(r.data));
    api.get('/theaters').then((r) => setTheaters(r.data));
    api.get('/admin/bookings').then((r) => setBookings(r.data));
  };
  useEffect(load, []);

  const send = (url, body, reset) => async (e) => {
    e.preventDefault();
    try { await api.post(url, body); reset(); setMsg('Saved.'); load(); } catch (er) { setMsg(errMsg(er)); }
  };
  const del = async (url) => { if (confirm('Delete this? This cannot be undone.')) { await api.delete(url); load(); } };
  const bind = (obj, set) => (k) => ({ value: obj[k], onChange: (e) => set({ ...obj, [k]: e.target.value }) });
  const m = bind(mv, setMv), t = bind(th, setTh), s = bind(sh, setSh);

  return (
    <>
      <h1>Admin dashboard</h1>
      <div className="stats">
        {[['Users', stats.users], ['Movies', stats.movies], ['Theaters', stats.theaters], ['Shows', stats.shows], ['Bookings', stats.bookings], ['Revenue', '₹' + (stats.revenue || 0)]]
          .map(([k, v]) => <div key={k} className="stat"><b>{v ?? 0}</b><span>{k}</span></div>)}
      </div>
      {msg && <p className="muted">{msg}</p>}

      <div className="forms">
        <form className="panel" onSubmit={send('/movies', mv, () => setMv({ title: '', genre: '', language: '', duration: '', cast: '', releaseDate: '', description: '' }))}>
          <h3>Add a movie</h3>
          <Field label="Title" required {...m('title')} />
          <Field label="Genres (comma separated)" {...m('genre')} />
          <Field label="Language" {...m('language')} />
          <Field label="Duration (minutes)" type="number" {...m('duration')} />
          <Field label="Cast (comma separated)" {...m('cast')} />
          <Field label="Release date" type="date" {...m('releaseDate')} />
          <Field label="Description" {...m('description')} />
          <button>Add movie</button>
        </form>

        <form className="panel" onSubmit={send('/theaters', th, () => setTh({ name: '', city: '', screens: 1 }))}>
          <h3>Add a theater</h3>
          <Field label="Name" required {...t('name')} />
          <Field label="City" {...t('city')} />
          <Field label="Screens" type="number" min="1" {...t('screens')} />
          <button>Add theater</button>
        </form>

        <form className="panel" onSubmit={send('/shows', sh, () => setSh({ ...sh, startTime: '', price: '' }))}>
          <h3>Schedule a show</h3>
          <label>Movie<select required {...s('movie')}><option value="">Choose…</option>{movies.map((x) => <option key={x._id} value={x._id}>{x.title}</option>)}</select></label>
          <label>Theater<select required {...s('theater')}><option value="">Choose…</option>{theaters.map((x) => <option key={x._id} value={x._id}>{x.name}</option>)}</select></label>
          <Field label="Screen" type="number" min="1" {...s('screen')} />
          <Field label="Start time" type="datetime-local" required {...s('startTime')} />
          <Field label="Price per seat (₹)" type="number" min="1" required {...s('price')} />
          <button>Schedule show</button>
        </form>
      </div>

      <h2>Movies</h2>
      <div className="chips">{movies.map((x) => <span key={x._id} className="chip">{x.title} <button className="link" onClick={() => del('/movies/' + x._id)}>Delete</button></span>)}</div>

      <h2>Recent bookings</h2>
      {!bookings.length && <p className="muted">No bookings yet.</p>}
      <table>
        <thead><tr><th>Customer</th><th>Movie</th><th>Show</th><th>Seats</th><th>Amount</th><th>Status</th></tr></thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b._id}><td>{b.user?.name}</td><td>{b.show?.movie?.title}</td><td>{b.show && when(b.show.startTime)}</td><td>{b.seats.join(', ')}</td><td>₹{b.amount}</td><td>{b.status}</td></tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
