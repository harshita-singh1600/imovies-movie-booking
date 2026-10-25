const r = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { wrap, auth } = require('../middleware');

const sign = (u) => jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
const pub = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });
const isStr = (v) => typeof v === 'string';

r.post('/register', wrap(async (req, res) => {
  const { name, email, password } = req.body;
  if (!isStr(name) || !name.trim() || !isStr(email) || !/^\S+@\S+\.\S+$/.test(email) || !isStr(password) || password.length < 6)
    return res.status(400).json({ message: 'Enter your name, a valid email and a password of at least 6 characters.' });
  if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: 'This email is already registered. Try logging in.' });
  const u = await User.create({ name: name.trim(), email, password: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: sign(u), user: pub(u) });
}));

r.post('/login', wrap(async (req, res) => {
  const { email, password } = req.body;
  const u = isStr(email) && isStr(password) ? await User.findOne({ email: email.toLowerCase() }) : null;
  if (!u || !(await bcrypt.compare(password, u.password))) return res.status(401).json({ message: 'Email or password is incorrect.' });
  res.json({ token: sign(u), user: pub(u) });
}));

r.get('/me', auth, wrap(async (req, res) => {
  const u = await User.findById(req.user.id);
  if (!u) return res.status(401).json({ message: 'Please log in again.' });
  res.json(pub(u));
}));

module.exports = r;
