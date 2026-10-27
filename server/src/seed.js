require('dotenv').config();
const { connectDB } = require('./config/db');
const { User, Shop, Category, Product, Review, Coupon } = require('./models');

const IMG = {
  jewelry: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80',
  jewelry2: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80',
  decor: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80',
  decor2: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
  fashion: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80',
  fashion2: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80',
  art: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&q=80',
  art2: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80',
  bag: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80',
  candle: 'https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?w=800&q=80',
  ceramic: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&q=80',
  knit: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&q=80',
  soap: 'https://images.unsplash.com/photo-1600857544200-b2f666e9a2ec?w=800&q=80',
  print: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80',
};
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

async function main() {
  await connectDB();
  const cats = [
    ['Handmade Jewelry', IMG.jewelry], ['Home Décor', IMG.decor], ['Vintage Fashion', IMG.fashion],
    ['Personalized Gifts', IMG.art], ['Art and Prints', IMG.print], ['Wedding Accessories', IMG.jewelry2],
    ['Craft Supplies', IMG.knit], ['Digital Downloads', IMG.art2], ['Handmade Clothing', IMG.fashion2],
    ['Bags and Accessories', IMG.bag], ['Beauty Accessories', IMG.soap], ['Custom Home Gifts', IMG.decor2],
  ];
  const catMap = {};
  for (const [name, image] of cats) {
    const c = await Category.findOneAndUpdate({ slug: slug(name) }, { name, slug: slug(name), description: `Original ${name} made by independent sellers.`, image }, { upsert: true, new: true });
    catMap[name] = c;
  }
  const shopsDef = [
    ['Lahore Loom Studio', 'Handwoven textiles, knitwear and home pieces from Lahore.', 'loom-studio'],
    ['Clay & Ember', 'Small-batch ceramics, candles and warm home décor.', 'clay-and-ember'],
    ['Paper Petal Press', 'Art prints, wedding stationery and personalised paper gifts.', 'paper-petal-press'],
    ['Silver Thread Atelier', 'Handmade jewellery and vintage-inspired accessories.', 'silver-thread-atelier'],
  ];
  const shops = [];
  for (const [name, desc, s] of shopsDef) {
    const email = `${s}@craftnest.demo`;
    let user = await User.findOne({ email });
    if (!user) user = await User.create({ name: `${name} (demo seller)`, email, password: 'Seed123!', role: 'seller' });
    const shop = await Shop.findOneAndUpdate({ slug: s }, { user: user._id, name, slug: s, description: desc, status: 'approved', shippingOrigin: 'Lahore, Pakistan' }, { upsert: true, new: true });
    shops.push({ shop, user });
  }
  const P = (title, cat, shopIdx, price, compare, img, type, stock) => ({ title, cat, shopIdx, price, compare, img, type, stock });
  const defs = [
    P('Handmade Brass Pendant Necklace', 'Handmade Jewelry', 3, 2850, 3600, IMG.jewelry, 'handmade', 18),
    P('Sterling Silver Leaf Earrings', 'Handmade Jewelry', 3, 3200, null, IMG.jewelry2, 'handmade', 12),
    P('Ceramic Speckled Coffee Mug', 'Home Décor', 1, 1950, 2400, IMG.ceramic, 'handmade', 30),
    P('Scented Soy Candle — Amber & Cedar', 'Home Décor', 1, 1450, null, IMG.candle, 'handmade', 40),
    P('Handwoven Cotton Throw Blanket', 'Home Décor', 0, 5400, 6800, IMG.decor, 'handmade', 9),
    P('Vintage Denim Jacket — Reworked', 'Vintage Fashion', 0, 6200, null, IMG.fashion, 'vintage', 5),
    P('Vintage Silk Scarf', 'Vintage Fashion', 3, 2750, 3400, IMG.fashion2, 'vintage', 7),
    P('Personalised Name Wooden Sign', 'Personalized Gifts', 2, 3100, null, IMG.decor2, 'personalized', 20),
    P('Custom Wedding Invitation Set (20)', 'Wedding Accessories', 2, 8900, 11000, IMG.art2, 'personalized', 15),
    P('Botanical Art Print A3', 'Art and Prints', 2, 1650, null, IMG.print, 'handmade', 50),
    P('Abstract Landscape Print — Digital', 'Digital Downloads', 2, 850, 1200, IMG.art, 'digital', 999),
    P('Hand-knitted Chunky Scarf', 'Handmade Clothing', 0, 3850, null, IMG.knit, 'handmade', 14),
    P('Leather Tote Bag — Tan', 'Bags and Accessories', 3, 7400, 9200, IMG.bag, 'handmade', 8),
    P('Natural Rose Soap Gift Set', 'Beauty Accessories', 1, 1750, null, IMG.soap, 'handmade', 35),
    P('Embroidery Starter Kit', 'Craft Supplies', 0, 2450, 2900, IMG.knit, 'handmade', 22),
    P('Hand-painted Ceramic Vase', 'Custom Home Gifts', 1, 4300, null, IMG.ceramic, 'handmade', 11),
    P('Gold Vermeil Hoop Earrings', 'Handmade Jewelry', 3, 2980, null, IMG.jewelry2, 'handmade', 16),
    P('Macramé Wall Hanging', 'Home Décor', 0, 3650, 4500, IMG.decor, 'handmade', 10),
    P('Personalised Birthstone Bracelet', 'Personalized Gifts', 3, 3350, null, IMG.jewelry, 'personalized', 19),
    P('Wedding Hair Comb — Pearl', 'Wedding Accessories', 3, 4100, null, IMG.jewelry2, 'handmade', 6),
    P('Watercolour Wedding Portrait — Digital', 'Digital Downloads', 2, 1500, null, IMG.art, 'digital', 999),
    P('Handloom Cotton Kurta', 'Handmade Clothing', 0, 5800, 7200, IMG.fashion, 'handmade', 13),
    P('Canvas Market Tote — Printed', 'Bags and Accessories', 2, 1950, null, IMG.bag, 'handmade', 28),
    P('Herbal Bath Salt Trio', 'Beauty Accessories', 1, 1550, 1900, IMG.soap, 'handmade', 33),
    P('Wooden Jewellery Box — Engraved', 'Custom Home Gifts', 1, 4900, null, IMG.decor2, 'personalized', 9),
  ];
  let created = 0;
  for (const d of defs) {
    const { shop } = shops[d.shopIdx];
    const ex = await Product.findOne({ title: d.title, shop: shop._id });
    if (ex) continue;
    const p = await Product.create({ shop: shop._id, seller: shops[d.shopIdx].user._id, category: catMap[d.cat]._id, title: d.title, description: `Original ${d.title} made in small batches by ${shop.name}. Ships from Lahore. Demo listing — images are remote stock-style photos for demonstration.`, price: d.price, compareAtPrice: d.compare || undefined, images: [d.img], stock: d.stock, type: d.type, variations: [{ label: 'Standard', priceDelta: 0, stock: d.stock, sku: slug(d.title).slice(0, 20).toUpperCase() }, { label: 'Gift wrapped', priceDelta: 250, stock: d.stock, sku: 'GIFT-' + slug(d.title).slice(0, 12).toUpperCase() }], personalization: d.type === 'personalized', salesCount: Math.floor(Math.random() * 20) });
    created++;
    // A few demo reviews, clearly flagged, NOT verified purchases
    if (created % 6 === 1) {
      await Review.create({ product: p._id, user: shops[0].user._id, rating: 5, comment: 'Demo review: beautiful quality and careful packaging.', isDemo: true, verifiedPurchase: false });
      await Product.findByIdAndUpdate(p._id, { ratingAvg: 5, reviewCount: 1 });
    }
  }
  await Coupon.findOneAndUpdate({ code: 'WELCOME10' }, { code: 'WELCOME10', discountPercent: 10, usageLimit: 500, active: true }, { upsert: true, new: true });
  console.log(`[craftnest] Seed done. Categories: ${cats.length}, shops: ${shops.length}, new products: ${created} (total products in DB may be higher if already seeded)`);
  return { categories: cats.length, shops: shops.length, newProducts: created };
}
if (require.main === module) main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
module.exports = { seedData: main };
