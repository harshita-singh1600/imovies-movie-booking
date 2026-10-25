import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import api, { errMsg, when } from '../api';
import { useAuth } from '../auth.jsx';

export default function Seats() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [show, setShow] = useState(null);
  const [sel, setSel] = useState([]);
  const [hold, setHold] = useState(null);
  const [left, setLeft] = useState(0);
  const [err, setErr] = useState('');

  const load = () => api.get('/shows/' + id).then((r) => setShow(r.data)).catch((e) => setErr(errMsg(e)));

  useEffect(() => {
    load();
    const s = io(import.meta.env.VITE_API_URL || undefined);
    s.emit('join', id);
    s.on('seats:changed', load);
    return () => { s.emit('leave', id); s.disconnect(); };
  }, [id, user]);

  useEffect(() => {
    if (!hold) return;
    const t = setInterval(() => {
      const l = Math.max(0, Math.round((new Date(hold.expiresAt) - Date.now()) / 1000));
      setLeft(l);
      if (!l) { setHold(null); setSel([]); setErr('Your hold expired. Pick your seats again.'); load(); }
    }, 500);
    return () => clearInterval(t);
  }, [hold]);

  // If another viewer takes a seat I selected, drop it from my selection.
  useEffect(() => {
    if (show && !hold) setSel((s) => s.filter((n) => ['available', 'mine'].includes(show.seats.find((x) => x.seatNo === n)?.status)));
  }, [show]);

  if (!show) return <p className={err ? 'err' : 'muted'}>{err || 'Loading…'}</p>;

  const rows = show.seats.reduce((a, s) => { (a[s.seatNo[0]] = a[s.seatNo[0]] || []).push(s); return a; }, {});
  const toggle = (s) => {
    if (hold || !['available', 'mine'].includes(s.status)) return;
    setErr('');
    setSel(sel.includes(s.seatNo) ? sel.filter((n) => n !== s.seatNo) : sel.length < 8 ? [...sel, s.seatNo] : sel);
  };

  const reserve = async () => {
    if (!user) return nav('/login');
    setErr('');
    try {
      const l = await api.post(`/shows/${id}/lock`, { seats: sel });
      const b = await api.post('/bookings', { showId: id, seats: sel });
      setHold({ booking: b.data, expiresAt: l.data.expiresAt });
    } catch (e) { setErr(errMsg(e)); setSel([]); load(); }
  };
  const pay = async () => {
    try {
      const o = await api.post('/payments/order', { bookingId: hold.booking._id });
      // mock mode: confirm straight away. For Razorpay, open Checkout here and pass its response to /payments/verify.
      await api.post('/payments/verify', { bookingId: hold.booking._id, orderId: o.data.orderId, paymentId: 'mock_pay_' + Date.now() });
      nav('/profile');
    } catch (e) { setErr(errMsg(e)); }
  };
  const release = async () => { await api.post(`/shows/${id}/unlock`, { seats: sel }); setHold(null); setSel([]); load(); };

  return (
    <>
      <h1>{show.movie.title}</h1>
      <p className="muted">{show.theater.name} · Screen {show.screen} · {when(show.startTime)} · ₹{show.price} per seat</p>
      <div className="screen">Screen this way</div>
      <div className="seatmap">
        {Object.entries(rows).map(([r, seats]) => (
          <div className="seatrow" key={r}>
            <span className="rowlabel">{r}</span>
            {seats.map((s) => (
              <button key={s.seatNo} title={`${s.seatNo} · ${s.status}`} disabled={hold || !['available', 'mine'].includes(s.status)}
                className={`seat ${sel.includes(s.seatNo) ? 'sel' : s.status}`} onClick={() => toggle(s)}>
                {s.seatNo.slice(1)}
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="legend"><i className="seat available" />Free <i className="seat sel" />Yours <i className="seat locked" />Held by someone <i className="seat booked" />Booked</div>

      <div className="bar">
        {!hold ? (
          <>
            <span>{sel.length ? `${sel.join(', ')} · ₹${sel.length * show.price}` : 'Choose up to 8 seats'}</span>
            <button disabled={!sel.length} onClick={reserve}>{user ? 'Hold seats and pay' : 'Log in to book'}</button>
          </>
        ) : (
          <>
            <span>{hold.booking.seats.join(', ')} held for {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</span>
            <span><button className="ghost" onClick={release}>Release seats</button> <button onClick={pay}>Pay ₹{hold.booking.amount}</button></span>
          </>
        )}
      </div>
      {err && <p className="err">{err}</p>}
    </>
  );
}
