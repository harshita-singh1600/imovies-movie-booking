import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../auth.jsx';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const { login } = useAuth();
  const nav = useNavigate();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try { login((await api.post('/auth/' + mode, f)).data); nav('/'); }
    catch (er) { setErr(errMsg(er)); }
  };

  return (
    <form className="panel narrow" onSubmit={submit}>
      <h1>{mode === 'login' ? 'Log in' : 'Create your account'}</h1>
      {mode === 'register' && <label>Name<input value={f.name} onChange={set('name')} required /></label>}
      <label>Email<input type="email" value={f.email} onChange={set('email')} required /></label>
      <label>Password<input type="password" value={f.password} onChange={set('password')} minLength={6} required /></label>
      {err && <p className="err">{err}</p>}
      <button>{mode === 'login' ? 'Log in' : 'Create account'}</button>
      <button type="button" className="link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(''); }}>
        {mode === 'login' ? 'New here? Create an account' : 'Already registered? Log in'}
      </button>
    </form>
  );
}
