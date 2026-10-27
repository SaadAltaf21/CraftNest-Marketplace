const express = require('express');
const { Cart, Wishlist, Product, Order, Coupon, Address, Notification } = require('../models');
const { auth, pageParams } = require('../middleware/auth');
const r = express.Router();

function unitPrice(product, variationLabel) {
  if (!variationLabel) return product.price;
  const v = (product.variations || []).find(x => x.label === variationLabel);
  return product.price + (v ? v.priceDelta : 0);
}
async function calcCart(userId) {
  const cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart) return { items: [], subtotal: 0 };
  const items = cart.items.filter(i => i.product).map(i => ({ product: i.product, variationLabel: i.variationLabel, qty: i.qty, unitPrice: unitPrice(i.product, i.variationLabel) }));
  return { items, subtotal: items.reduce((s, i) => s + i.unitPrice * i.qty, 0) };
}

// Cart
r.get('/cart', auth, async (req, res) => res.json(await calcCart(req.user._id)));
r.post('/cart', auth, async (req, res) => {
  const { productId, variationLabel, qty = 1 } = req.body || {};
  const p = await Product.findById(productId);
  if (!p || p.status !== 'active') return res.status(404).json({ error: 'Product not available' });
  if (p.stock < qty) return res.status(400).json({ error: 'Not enough stock' });
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });
  const ex = cart.items.find(i => String(i.product) === String(productId) && (i.variationLabel || '') === (variationLabel || ''));
  if (ex) ex.qty += Number(qty); else cart.items.push({ product: productId, variationLabel, qty: Number(qty) });
  await cart.save(); res.json(await calcCart(req.user._id));
});
r.put('/cart/:productId', auth, async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ error: 'Cart empty' });
  const item = cart.items.find(i => String(i.product) === String(req.params.productId));
  if (!item) return res.status(404).json({ error: 'Item not in cart' });
  if (req.body.qty <= 0) cart.items = cart.items.filter(i => i !== item); else item.qty = Number(req.body.qty);
  await cart.save(); res.json(await calcCart(req.user._id));
});
r.delete('/cart/:productId', auth, async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.json({ items: [], subtotal: 0 });
  cart.items = cart.items.filter(i => String(i.product) !== String(req.params.productId));
  await cart.save(); res.json(await calcCart(req.user._id));
});

// Wishlist
r.get('/wishlist', auth, async (req, res) => {
  const w = await Wishlist.findOne({ user: req.user._id }).populate('products');
  res.json(w ? w.products : []);
});
r.post('/wishlist', auth, async (req, res) => {
  let w = await Wishlist.findOne({ user: req.user._id });
  if (!w) w = await Wishlist.create({ user: req.user._id, products: [] });
  if (!w.products.map(String).includes(String(req.body.productId))) w.products.push(req.body.productId);
  await w.save(); res.json(await Wishlist.findById(w._id).populate('products'));
});
r.delete('/wishlist/:productId', auth, async (req, res) => {
  const w = await Wishlist.findOne({ user: req.user._id });
  if (w) { w.products = w.products.filter(p => String(p) !== String(req.params.productId)); await w.save(); }
  res.json({ ok: true });
});

// Coupons
r.get('/coupons/validate', async (req, res) => {
  const c = await Coupon.findOne({ code: String(req.query.code || '').toUpperCase(), active: true });
  if (!c) return res.status(404).json({ error: 'Invalid coupon' });
  if (c.expiresAt && c.expiresAt < new Date()) return res.status(400).json({ error: 'Coupon expired' });
  if (c.usedCount >= c.usageLimit) return res.status(400).json({ error: 'Coupon usage limit reached' });
  res.json(c);
});

// Addresses
r.get('/addresses', auth, async (req, res) => res.json(await Address.find({ user: req.user._id })));
r.post('/addresses', auth, async (req, res) => res.status(201).json(await Address.create({ ...req.body, user: req.user._id })));
r.delete('/addresses/:id', auth, async (req, res) => { await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id }); res.json({ ok: true }); });

// Orders — totals are ALWAYS calculated server-side from DB prices
r.post('/orders', auth, async (req, res) => {
  const { paymentMethod = 'test', couponCode, shippingAddress } = req.body || {};
  if (!['test', 'cod'].includes(paymentMethod)) return res.status(400).json({ error: 'Payment method must be test or cod' });
  const { items, subtotal } = await calcCart(req.user._id);
  if (!items.length) return res.status(400).json({ error: 'Cart is empty' });
  let discount = 0;
  if (couponCode) {
    const c = await Coupon.findOne({ code: String(couponCode).toUpperCase(), active: true });
    if (c) { discount = c.discountPercent ? subtotal * c.discountPercent / 100 : Math.min(c.discountAmount, subtotal); c.usedCount += 1; await c.save(); }
  }
  const shipping = subtotal > 5000 ? 0 : 350;
  const total = Math.max(0, subtotal - discount + shipping);
  // Stock check + decrement (prevents overselling in this single-process demo; production would use a transaction)
  for (const i of items) {
    if (i.product.stock < i.qty) return res.status(400).json({ error: `Not enough stock for ${i.product.title}` });
  }
  for (const i of items) { i.product.stock -= i.qty; i.product.salesCount += i.qty; await i.product.save(); }
  const order = await Order.create({
    user: req.user._id,
    items: items.map(i => ({ product: i.product._id, shop: i.product.shop, title: i.product.title, price: i.unitPrice, qty: i.qty, variationLabel: i.variationLabel })),
    subtotal, shipping, discount, total, paymentMethod,
    paymentStatus: paymentMethod === 'test' ? 'test_paid' : 'cod_pending',
    shippingAddress: shippingAddress || {}, couponCode: couponCode || undefined,
  });
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
  await Notification.create({ user: req.user._id, title: 'Order placed', message: `Your test order ${order._id} was created for Rs ${total}. No real money was charged.` });
  res.status(201).json(order);
});
r.get('/orders', auth, async (req, res) => {
  const { page, limit, skip } = pageParams(req);
  const [items, total] = await Promise.all([Order.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit), Order.countDocuments({ user: req.user._id })]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
});
r.get('/orders/:id', auth, async (req, res) => {
  const o = await Order.findById(req.params.id).populate('items.product', 'title images');
  if (!o) return res.status(404).json({ error: 'Not found' });
  if (req.user.role !== 'admin' && String(o.user) !== String(req.user._id)) {
    const { Shop } = require('../models');
    const shop = await Shop.findOne({ user: req.user._id });
    const mine = shop && o.items.some(i => String(i.shop) === String(shop._id));
    if (!mine) return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(o);
});
r.patch('/orders/:id/status', auth, async (req, res) => {
  const o = await Order.findById(req.params.id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  const { Shop } = require('../models');
  const shop = await Shop.findOne({ user: req.user._id });
  const isSeller = shop && o.items.some(i => String(i.shop) === String(shop._id));
  if (req.user.role !== 'admin' && !isSeller) return res.status(403).json({ error: 'Forbidden' });
  const allowed = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ error: 'Invalid status' });
  o.status = req.body.status; if (req.body.tracking) o.tracking = req.body.tracking; await o.save(); res.json(o);
});

// Notifications
r.get('/notifications', auth, async (req, res) => res.json(await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50)));
r.patch('/notifications/:id/read', auth, async (req, res) => { await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { read: true }); res.json({ ok: true }); });

module.exports = r;
