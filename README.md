# 🍔 Uber Eats Clone (Node.js + Express + MongoDB + Redis)

A Uber Eats–style backend built with **Node.js, Express, MongoDB, and Redis caching**.

---

## 🚀 Features
- **User Authentication** (JWT) with caching
- **Restaurant CRUD** (create, update, delete)
- **Menu Management**
- **Nearby Restaurants Search** (MongoDB geospatial queries)
- **Redis Caching**
  - Dynamic hot/cold TTL via `CacheService.getOrSetAutoHotness`
  - Automatic cache invalidation on updates/deletes
- **Admin Cache Dashboard**

---

## 📦 Tech Stack
- **Backend**: Node.js, Express
- **Database**: MongoDB + Mongoose
- **Cache**: Redis
- **Auth**: JWT (JSON Web Tokens)

---

## 🛠 Installation
1. **Clone repository**
```bash
git clone https://github.com/ayaderaghul/uber-eats-clone.git
cd uber-eats-clone
```


2. **Install dependencies**

```bash
npm install
```

3. **Set environment variables (.env)**
```.env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ubereats
JWT_SECRET=your_secret_key
REDIS_URL=redis://localhost:6379

```

4. **Run server**

```bash
npm run dev```

##📌 API Endpoints
Restaurants

```
POST /api/restaurants (protected) → Create restaurant
PUT /api/restaurants/:id (protected) → Update restaurant
DELETE /api/restaurants/:id (protected) → Delete restaurant
GET /api/restaurants → Get all restaurants (cached)
GET /api/restaurants/nearby?lat=..&lng=..&radius=.. → Nearby search (cached)
GET /api/restaurants/:id → Get restaurant by ID (cached)
GET /api/restaurants/:id/menu → Get restaurant menu (cached)
```

Users
MenuItems

## 📂 Project Structure

```
src/
│── config/
│   └── redis.js
│── controllers/
│   └── restaurantController.js
│── models/
│   ├── Restaurant.js
│   ├── MenuItem.js
│   └── User.js
│── routes/
│   └── restaurantRoutes.js
│── services/
│   └── cacheService.js
│── middlewares/
│   ├── authMiddleware.js
│   └── errorMiddleware.js
│── server.js
```

## 🧠 Caching Logic
Read routes use CacheService.getOrSetAutoHotness() to cache popular endpoints longer.

Write routes (create, update, delete) automatically clear cache.

Nearby search caches results based on coordinates and radius.

## 📊 Admin Cache Dashboard (optional)
View cache stats:

```
GET /admin/cache/stats
Response:

json
Copy code
{
  "totalKeys": 4,
  "stats": [
    {
      "key": "restaurants:all",
      "ttl": "5400s",
      "hits": "120",
      "status": "HOT"
    }
  ]
}
```

##⚡ Contribution
PRs are welcome! Make sure to:

Follow REST best practices.

Maintain caching strategy.

## 🛠 Troubleshooting
- Cache not working?
Check REDIS_URL and ensure Redis is running.

- Nearby query error?
Ensure address.coordinates field has a 2dsphere index.
