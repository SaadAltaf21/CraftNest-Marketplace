const express = require('express');
const { Shop, Product, Order, User, Category, Coupon, SupportRequest, AuditLog, Conversation, Message, Notification } = require('../models');
const { auth, requireRole, audit, slugify } = require('../middleware/auth');
const r = express.Router();

// Shops
r.post('/shops', auth, async (req, res) => {
  const { name, description, logo, banner, policies, shippingOrigin, contactEmail } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Shop name required' });
  if (await Shop.findOne({ user: req.user._id })) return res.status(409).json({ error: 'You already have a shop' });
  let slug = slugify(name); if (await Shop.findOne({ slug })) slug = `${slug}-${Date.now().toString(36)}`;
  const shop = await Shop.create({ user: req.user._id, name, slug, description, logo, banner, policies, shippingOrigin, contactEmail });
  await User.findByIdAndUpdate(req.user._id, { role: 'seller' });
  await audit(req.user._id, 'shop.create', name);
  res.status(201).json(shop);
});
r.get('/shops', async (req, res) => res.json(await Shop.find({ status: 'approved' }).sort({ createdAt: -1 })));
r.get('/shops/:slug', async (req, res) => {
  const shop = await Shop.findOne({ slug: req.params.slug }).populate('user', 'name');
  if (!shop) return res.status(404).json({ error: 'Shop not found' });
  const products = await Product.find({ shop: shop._id, status: 'active' });
  res.json({ ...shop.toObject(), products });
});
r.put('/shops/me', auth, requireRole('seller', 'admin'), async (req, res) => {
  const shop = await Shop.findOneAndUpdate({ user: req.user._id }, req.body, { new: true });
  if (!shop) return res.status(404).json({ error: 'Shop not found' }); res.json(shop);
});
r.get('/seller/orders', auth, requireRole('seller', 'admin'), async (req, res) => {
  const shop = req.user.role === 'admin' ? null : await Shop.findOne({ user: req.user._id });
  const orders = await Order.find().sort({ createdAt: -1 });
  if (!shop) return res.json(orders);
  return res.json(orders.filter(o => o.items.some(i => String(i.shop) === String(shop._id))).map(o => ({ ...o.toObject(), items: o.items.filter(i => String(i.shop) === String(shop._id)) })));
});
r.get('/seller/stats', auth, requireRole('seller', 'admin'), async (req, res) => {
  const shop = req.user.role === 'admin' ? null : await Shop.findOne({ user: req.user._id });
  const products = shop ? await Product.find({ shop: shop._id }) : await Product.find();
  const orders = await Order.find();
  const mine = shop ? orders.filter(o => o.items.some(i => String(i.shop) === String(shop._id))) : orders;
  const gross = mine.reduce((s, o) => s + o.items.filter(i => !shop || String(i.shop) === String(shop._id)).reduce((a, i) => a + i.price * i.qty, 0), 0);
  res.json({ totalProducts: products.length, activeListings: products.filter(p => p.status === 'active').length, totalOrders: mine.length, pendingOrders: mine.filter(o => o.status === 'pending').length, completedOrders: mine.filter(o => o.status === 'delivered').length, grossSales: gross, estimatedEarnings: Math.round(gross * 0.9) });
});

// Messages (polling)
r.post('/conversations', auth, async (req, res) => {
  const { shopId, productId, otherUserId } = req.body || {};
  let participants = [req.user._id];
  if (otherUserId) participants.push(otherUserId);
  else if (shopId) { const s = await Shop.findById(shopId); if (s) participants.push(s.user); }
  const c = await Conversation.create({ participants, shop: shopId, product: productId });
  res.status(201).json(c);
});
r.get('/conversations', auth, async (req, res) => {
  res.json(await Conversation.find({ participants: req.user._id }).populate('participants', 'name').populate('shop', 'name slug').sort({ updatedAt: -1 }));
});
r.get('/conversations/:id/messages', auth, async (req, res) => {
  const c = await Conversation.findById(req.params.id);
  if (!c || !c.participants.map(String).includes(String(req.user._id))) return res.status(403).json({ error: 'Forbidden' });
  res.json(await Message.find({ conversation: c._id }).populate('sender', 'name').sort({ createdAt: 1 }));
});
r.post('/conversations/:id/messages', auth, async (req, res) => {
  const c = await Conversation.findById(req.params.id);
  if (!c || !c.participants.map(String).includes(String(req.user._id))) return res.status(403).json({ error: 'Forbidden' });
  if (!req.body.text) return res.status(400).json({ error: 'Text required' });
  const m = await Message.create({ conversation: c._id, sender: req.user._id, text: req.body.text });
  c.lastMessageAt = new Date(); await c.save();
  const other = c.participants.find(p => String(p) !== String(req.user._id));
  if (other) await Notification.create({ user: other, title: 'New message', message: req.body.text.slice(0, 100) });
  res.status(201).json(m);
});

// Support
r.post('/support', auth, async (req, res) => res.status(201).json(await SupportRequest.create({ user: req.user._id, subject: req.body.subject, message: req.body.message })));
r.get('/support', auth, requireRole('admin'), async (req, res) => res.json(await SupportRequest.find().populate('user', 'name email').sort({ createdAt: -1 })));
r.patch('/support/:id', auth, requireRole('admin'), async (req, res) => res.json(await SupportRequest.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true })));

// Coupons (admin)
r.post('/coupons', auth, requireRole('admin'), async (req, res) => res.status(201).json(await Coupon.create(req.body)));
r.get('/coupons', auth, requireRole('admin'), async (req, res) => res.json(await Coupon.find().sort({ createdAt: -1 })));

// Admin
r.get('/admin/overview', auth, requireRole('admin'), async (req, res) => {
  const [customers, sellers, products, orders] = await Promise.all([User.countDocuments(), Shop.countDocuments(), Product.countDocuments(), Order.countDocuments()]);
  const all = await Order.find();
  res.json({ totalCustomers: customers, totalSellers: sellers, totalProducts: products, totalOrders: orders, orderValue: all.reduce((s, o) => s + o.total, 0) });
});
r.get('/admin/users', auth, requireRole('admin'), async (req, res) => res.json(await User.find().select('-password').sort({ createdAt: -1 })));
r.patch('/admin/users/:id/role', auth, requireRole('admin'), async (req, res) => {
  // Never allow self-promotion to admin through a normal route: this endpoint is admin-only and logs the change.
  const u = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true }).select('-password');
  await audit(req.user._id, 'admin.role_change', `${req.params.id} -> ${req.body.role}`);
  res.json(u);
});
r.get('/admin/shops', auth, requireRole('admin'), async (req, res) => res.json(await Shop.find().populate('user', 'name email').sort({ createdAt: -1 })));
r.patch('/admin/shops/:id/status', auth, requireRole('admin'), async (req, res) => {
  const s = await Shop.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  await audit(req.user._id, 'admin.shop_status', `${req.params.id} -> ${req.body.status}`);
  res.json(s);
});
r.get('/admin/orders', auth, requireRole('admin'), async (req, res) => res.json(await Order.find().sort({ createdAt: -1 }).limit(100)));
r.get('/admin/audit-logs', auth, requireRole('admin'), async (req, res) => res.json(await AuditLog.find().populate('actor', 'name email').sort({ createdAt: -1 }).limit(100)));
r.get('/admin/products', auth, requireRole('admin'), async (req, res) => res.json(await Product.find().populate('shop', 'name').sort({ createdAt: -1 }).limit(100)));

module.exports = r;
