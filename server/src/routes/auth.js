const express = require('express');
const { User, Shop } = require('../models');
const { signToken, auth } = require('../middleware/auth');
const r = express.Router();

r.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password || password.length < 6) return res.status(400).json({ error: 'Name, valid email and password (min 6 chars) are required' });
    if (await User.findOne({ email: String(email).toLowerCase() })) return res.status(409).json({ error: 'Email already registered' });
    const user = await User.create({ name, email: String(email).toLowerCase(), password });
    return res.status(201).json({ token: signToken(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
r.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email: String(email || '').toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password || ''))) return res.status(401).json({ error: 'Invalid credentials' });
    return res.json({ token: signToken(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});
r.get('/me', auth, async (req, res) => {
  const shop = await Shop.findOne({ user: req.user._id });
  res.json({ id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role, shop: shop ? { id: shop._id, slug: shop.slug, name: shop.name, status: shop.status } : null });
});
r.post('/change-password', auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
  const user = await User.findById(req.user._id).select('+password');
  if (oldPassword && !(await user.comparePassword(oldPassword))) return res.status(401).json({ error: 'Old password is incorrect' });
  user.password = newPassword; await user.save();
  res.json({ ok: true });
});
r.delete('/me', auth, async (req, res) => {
  await User.findByIdAndDelete(req.user._id);
  res.json({ ok: true, message: 'Account deleted' });
});
module.exports = r;
