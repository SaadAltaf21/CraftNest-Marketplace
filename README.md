# CraftNest — an original Etsy-inspired MERN marketplace

CraftNest is an original marketplace brand. It is inspired by Etsy in functionality only. It does not use Etsy's name, logo, product photos, or code. Demo product images are remote Unsplash URLs.

## What is included
- Customer: register/login, search/filter/sort/pagination, product detail with variations + reviews, cart, wishlist, test checkout + COD, order history, addresses, messages (polling).
- Seller: onboarding, public shop page `/shop/:slug`, dashboard with real stats, product CRUD, order status updates.
- Admin: overview, user list, seller approval, product/order lists, coupons, support, audit log. Admin registration is code-gated: on the Register page, tick “Register as admin” and enter the ADMIN_REGISTRATION_CODE set in the backend environment. A wrong code returns “Admin code registration is not match” and creates no admin account. The code itself is never stored in the code or the frontend.
- Server-side price/total calculation — client prices are never trusted. Stock is checked and decremented on order.

## Run locally (no setup, temporary data)
```bash
cd server && npm install && npm start        # API on http://localhost:5001
# With no MONGO_URI, the server auto-seeds demo data into its own in-memory DB
# on first start (because each mongodb-memory-server process has its own DB,
# a separate `npm run seed` process would not be visible to the server).
# With a real MongoDB, run `npm run seed` explicitly instead — it is idempotent
# (categories/shops/products are upserted by slug/title).
# in a second terminal:
cd client && npm install && npm run dev    # site on http://localhost:5173
# or: npm run build && npm run preview
```
If `MONGO_URI` is unset, the server starts `mongodb-memory-server` automatically. That data is temporary and disappears when the server stops. This is for local testing only.

With a real MongoDB (Atlas or local MongoDB), create `server/.env` from `server/.env.example`:
```
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/craftnest
JWT_SECRET=<a long random secret>
PORT=5001
CLIENT_URL=http://localhost:5173
```

## Demo accounts
- Seeded demo sellers (from `server/src/seed.js`): e.g. `loom-studio@craftnest.demo` / `Seed123!`, `clay-and-ember@craftnest.demo` / `Seed123!` — these are demo seller accounts only, not admins.
- Any visitor can register a new customer, then click “Sell on CraftNest” to create a shop.
- Test coupon: `WELCOME10` (10% off, seeded).

## Create the first admin (owner only, no hardcoded credentials)
```bash
cd server
npm run create-admin -- --email you@example.com --password 'StrongPass123' --name 'Your Name'
```
This creates an admin only if no admin exists yet. It refuses to create a second admin if one already exists.

## Deploy on Vercel (two separate projects, not done in this local build)
1. **Frontend project:** import the repo, Root Directory `client`, Framework Vite, Build `npm run build`, Output `dist`. Set env `VITE_API_URL=https://<your-backend>.vercel.app/api`.
2. **Backend project:** import the repo, Root Directory `server`. The entry is `api/index.js` (see `server/vercel.json`). Set env `MONGO_URI` (Atlas), `JWT_SECRET`, `CLIENT_URL=https://<your-frontend>.vercel.app`.
3. Frontend SPA routing is handled by `client/vercel.json` (rewrite to `/index.html`).
4. This is a personal demonstration project on the free Hobby plan. Do not present it as a commercial marketplace without a compliant paid plan.

## Limitations (honest)
- No real payment provider is connected. Checkout is a labelled test checkout + COD only; no card details are collected or stored. A real payment provider (e.g. Stripe/PayPal sandbox, subject to Pakistan availability and merchant onboarding) would be a separate, owner-approved step.
- No Cloudinary integration: product images are remote URLs (or base64/URL strings supplied by sellers), not uploaded files, so nothing is stored on Vercel's temporary filesystem.
- No email service: password reset by email is not wired up (change-password is implemented for logged-in users). Email would need an owner-approved provider.
- Digital products: no expiring signed download links yet — sellers provide a download URL/link after a test order; this is a documented gap, not a fake download.
- Stock decrement is a sequential check-and-decrement, not a MongoDB transaction (acceptable for a demo; a production multi-seller checkout should use transactions).
- See `docs/API.md` for endpoints.
