const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Schema } = mongoose;

const addressSchema = new Schema({
  label: { type: String, default: 'Home' },
  line1: String, city: String, postal: String, country: { type: String, default: 'Pakistan' },
  phone: String, isDefault: { type: Boolean, default: false },
}, { _id: true });

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['customer', 'seller', 'admin'], default: 'customer' },
  avatar: String,
}, { timestamps: true });
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
userSchema.methods.comparePassword = function (pw) { return bcrypt.compare(pw, this.password); };

const shopSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: String, logo: String, banner: String,
  policies: String, shippingOrigin: String, contactEmail: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  announcement: String,
}, { timestamps: true });

const categorySchema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: String, image: String,
}, { timestamps: true });

const variationSchema = new Schema({
  label: { type: String, required: true },
  priceDelta: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  sku: String,
}, { _id: false });

const productSchema = new Schema({
  shop: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category' },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0 },
  images: [{ type: String }],
  stock: { type: Number, default: 0, min: 0 },
  type: { type: String, enum: ['handmade', 'vintage', 'personalized', 'digital'], default: 'handmade' },
  variations: [variationSchema],
  personalization: { type: Boolean, default: false },
  personalizationNote: String,
  status: { type: String, enum: ['draft', 'active', 'archived'], default: 'active' },
  ratingAvg: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  salesCount: { type: Number, default: 0 },
}, { timestamps: true });
productSchema.index({ title: 'text', description: 'text' });

const cartSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variationLabel: String, qty: { type: Number, default: 1, min: 1 },
  }],
}, { timestamps: true });

const wishlistSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
}, { timestamps: true });

const orderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product' },
  shop: { type: Schema.Types.ObjectId, ref: 'Shop' },
  title: String, price: { type: Number, required: true }, qty: { type: Number, required: true },
  variationLabel: String,
}, { _id: false });

const orderSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: [orderItemSchema],
  subtotal: { type: Number, required: true },
  shipping: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['test', 'cod'], default: 'test' },
  paymentStatus: { type: String, enum: ['test_pending', 'test_paid', 'cod_pending', 'paid'], default: 'test_pending' },
  status: { type: String, enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  shippingAddress: addressSchema,
  couponCode: String, tracking: String,
}, { timestamps: true });

const reviewSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
  images: [String],
  isDemo: { type: Boolean, default: false },
  verifiedPurchase: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  sellerResponse: String,
}, { timestamps: true });

const conversationSchema = new Schema({
  participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  shop: { type: Schema.Types.ObjectId, ref: 'Shop' },
  product: { type: Schema.Types.ObjectId, ref: 'Product' },
  lastMessageAt: { type: Date, default: Date.now },
}, { timestamps: true });

const messageSchema = new Schema({
  conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, maxlength: 2000 },
  read: { type: Boolean, default: false },
}, { timestamps: true });

const couponSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountPercent: { type: Number, min: 0, max: 100, default: 0 },
  discountAmount: { type: Number, default: 0, min: 0 },
  shop: { type: Schema.Types.ObjectId, ref: 'Shop' },
  expiresAt: Date, usageLimit: { type: Number, default: 100 }, usedCount: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
}, { timestamps: true });

const addressModelSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  label: { type: String, default: 'Home' },
  line1: String, city: String, postal: String, country: { type: String, default: 'Pakistan' },
  phone: String, isDefault: { type: Boolean, default: false },
}, { timestamps: true });

const notificationSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: String, message: String, read: { type: Boolean, default: false },
}, { timestamps: true });

const supportSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  subject: { type: String, required: true }, message: { type: String, required: true },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
}, { timestamps: true });

const auditSchema = new Schema({
  actor: { type: Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true }, details: String,
}, { timestamps: true });

module.exports = {
  User: mongoose.model('User', userSchema),
  Shop: mongoose.model('Shop', shopSchema),
  Category: mongoose.model('Category', categorySchema),
  Product: mongoose.model('Product', productSchema),
  Cart: mongoose.model('Cart', cartSchema),
  Wishlist: mongoose.model('Wishlist', wishlistSchema),
  Order: mongoose.model('Order', orderSchema),
  Review: mongoose.model('Review', reviewSchema),
  Conversation: mongoose.model('Conversation', conversationSchema),
  Message: mongoose.model('Message', messageSchema),
  Coupon: mongoose.model('Coupon', couponSchema),
  Address: mongoose.model('Address', addressModelSchema),
  Notification: mongoose.model('Notification', notificationSchema),
  SupportRequest: mongoose.model('SupportRequest', supportSchema),
  AuditLog: mongoose.model('AuditLog', auditSchema),
};
