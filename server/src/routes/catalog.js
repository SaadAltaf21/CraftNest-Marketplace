const express = require('express');
const { Category, Product, Shop, Review } = require('../models');
const { auth, requireRole, audit, slugify, pageParams } = require('../middleware/auth');
const r = express.Router();

// Categories
r.get('/categories', async (req, res) => { res.json(await Category.find().sort({ name: 1 })); });
r.post('/categories', auth, requireRole('admin'), async (req, res) => {
  const { name, description, image } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Name required' });
  const c = await Category.create({ name, slug: slugify(name), description, image });
  await audit(req.user._id, 'category.create', name); res.status(201).json(c);
});
r.put('/categories/:id', auth, requireRole('admin'), async (req, res) => {
  const c = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!c) return res.status(404).json({ error: 'Not found' }); res.json(c);
});
r.delete('/categories/:id', auth, requireRole('admin'), async (req, res) => {
  await Category.findByIdAndDelete(req.params.id); res.json({ ok: true });
});

// Products list: search, category, shop, price, rating, type, sort, pagination
r.get('/products', async (req, res) => {
  const { q, category, shop, minPrice, maxPrice, minRating, type, sort = 'newest' } = req.query;
  const filter = { status: 'active' };
  if (q) filter.$text = { $search: q };
  if (type) filter.type = type;
  if (minPrice || maxPrice) filter.price = { ...(minPrice ? { $gte: Number(minPrice) } : {}), ...(maxPrice ? { $lte: Number(maxPrice) } : {}) };
  if (minRating) filter.ratingAvg = { $gte: Number(minRating) };
  if (category) { const cat = await Category.findOne({ slug: category }); if (cat) filter.category = cat._id; else if (category.match(/^[0-9a-fA-F]{24}$/)) filter.category = category; }
  if (shop) { const s = await Shop.findOne({ slug: shop }); if (s) filter.shop = s._id; }
  const sorts = { newest: { createdAt: -1 }, price_asc: { price: 1 }, price_desc: { price: -1 }, popular: { salesCount: -1 }, rating: { ratingAvg: -1 } };
  const { page, limit, skip } = pageParams(req);
  const [items, total] = await Promise.all([
    Product.find(filter).populate('shop', 'name slug status').populate('category', 'name slug').sort(sorts[sort] || sorts.newest).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
});
r.get('/products/:id', async (req, res) => {
  const p = await Product.findById(req.params.id).populate('shop', 'name slug description logo banner policies').populate('category', 'name slug');
  if (!p) return res.status(404).json({ error: 'Product not found' });
  const related = await Product.find({ category: p.category, _id: { $ne: p._id }, status: 'active' }).limit(4);
  res.json({ ...p.toObject(), related });
});
r.post('/products', auth, requireRole('seller', 'admin'), async (req, res) => {
  const shop = req.user.role === 'admin' ? await Shop.findById(req.body.shop) : await Shop.findOne({ user: req.user._id });
  if (!shop && req.user.role !== 'admin') return res.status(400).json({ error: 'Create a shop first' });
  const { title, description, price, compareAtPrice, images, stock, type, variations, personalization, category } = req.body || {};
  if (!title || price === undefined) return res.status(400).json({ error: 'Title and price required' });
  let catId = category;
  if (category && !String(category).match(/^[0-9a-fA-F]{24}$/)) { const c = await Category.findOne({ slug: category }); catId = c ? c._id : undefined; }
  const p = await Product.create({ shop: shop ? shop._id : req.body.shop, seller: req.user._id, category: catId, title, description, price: Number(price), compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined, images: Array.isArray(images) ? images : (images ? [images] : []), stock: Number(stock || 0), type, variations: variations || [], personalization: !!personalization });
  res.status(201).json(p);
});
r.put('/products/:id', auth, requireRole('seller', 'admin'), async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  if (req.user.role === 'seller' && String(p.seller) !== String(req.user._id)) return res.status(403).json({ error: 'Not your product' });
  Object.assign(p, req.body); await p.save(); res.json(p);
});
r.delete('/products/:id', auth, requireRole('seller', 'admin'), async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  if (req.user.role === 'seller' && String(p.seller) !== String(req.user._id)) return res.status(403).json({ error: 'Not your product' });
  await p.deleteOne(); res.json({ ok: true });
});

// Reviews
r.get('/products/:id/reviews', async (req, res) => {
  res.json(await Review.find({ product: req.params.id, status: 'approved' }).populate('user', 'name').sort({ createdAt: -1 }));
});
r.post('/products/:id/reviews', auth, async (req, res) => {
  const { rating, comment, images } = req.body || {};
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating 1-5 required' });
  const rev = await Review.create({ product: req.params.id, user: req.user._id, rating: Number(rating), comment, images: images || [], isDemo: false });
  const all = await Review.find({ product: req.params.id, status: 'approved' });
  const avg = all.reduce((s, x) => s + x.rating, 0) / (all.length || 1);
  await Product.findByIdAndUpdate(req.params.id, { ratingAvg: avg, reviewCount: all.length });
  res.status(201).json(rev);
});
r.patch('/reviews/:id/respond', auth, requireRole('seller', 'admin'), async (req, res) => {
  const rev = await Review.findByIdAndUpdate(req.params.id, { sellerResponse: req.body.sellerResponse }, { new: true });
  if (!rev) return res.status(404).json({ error: 'Not found' }); res.json(rev);
});
r.patch('/reviews/:id/moderate', auth, requireRole('admin'), async (req, res) => {
  const rev = await Review.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!rev) return res.status(404).json({ error: 'Not found' }); res.json(rev);
});
module.exports = r;
