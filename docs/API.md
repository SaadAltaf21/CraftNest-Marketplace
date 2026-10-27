# CraftNest API

Base: `http://localhost:5001/api` (or your deployed backend URL + `/api`)

Auth: `Authorization: Bearer <JWT>` for protected routes.

- GET /health → { ok, service }
- GET /db-check → { ok, db, userCount } — actually queries Mongo
- POST /auth/register {name,email,password} → {token,user}
- POST /auth/login {email,password} → {token,user}
- GET /auth/me (auth)
- GET /categories, POST/PUT/DELETE /categories (admin)
- GET /products?q&category&shop&type&minPrice&maxPrice&minRating&sort&page&limit
- GET /products/:id (includes related)
- POST/PUT/DELETE /products (seller owner or admin)
- GET /products/:id/reviews, POST /products/:id/reviews (auth)
- GET /cart, POST /cart, PUT /cart/:productId, DELETE /cart/:productId (auth)
- GET/POST/DELETE /wishlist (auth)
- GET /coupons/validate?code=
- GET/POST/DELETE /addresses (auth)
- POST /orders (auth; server calculates totals, paymentMethod test|cod)
- GET /orders, GET /orders/:id, PATCH /orders/:id/status (owner/seller/admin)
- POST /shops (auth, creates shop + upgrades to seller), GET /shops, GET /shops/:slug, PUT /shops/me
- GET /seller/stats, GET /seller/orders (seller/admin)
- POST/GET /conversations, GET/POST /conversations/:id/messages (auth, polling)
- POST /support (auth), GET/PATCH /support (admin)
- POST/GET /coupons (admin)
- GET /admin/overview, /admin/users, /admin/shops, /admin/orders, /admin/products, /admin/audit-logs; PATCH /admin/shops/:id/status, PATCH /admin/users/:id/role (admin only)
