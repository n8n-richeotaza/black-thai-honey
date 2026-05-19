# NOIR Ecommerce

Full-stack ecommerce application with Node.js/Express backend and vanilla JS frontend.

## Quick Start

```bash
npm install
npm start
```

Server runs on `http://localhost:3000`

## Default Admin Password
- Password: `admin123` (change via `ADMIN_HASH` env variable)

## API Endpoints

### Products
- `GET /api/products` - List products (query: category, search, sort, limit)
- `GET /api/products/:slug` - Get single product
- `POST /api/products` - Create product (auth)
- `PUT /api/products/:id` - Update product (auth)
- `DELETE /api/products/:id` - Delete product (auth)

### Orders
- `POST /api/orders` - Place order
- `GET /api/orders` - List all orders (auth)
- `PATCH /api/orders/:id` - Update status (auth)

### Other
- `POST /api/subscribe` - Newsletter signup
- `POST /api/contact` - Contact form
- `POST /api/admin/login` - Admin login
- `GET /api/admin/stats` - Dashboard stats (auth)

## Environment Variables
Create `.env`:
```
PORT=3000
JWT_SECRET=your-secret
ADMIN_HASH=$2a$10$...  # bcrypt hash of admin password
```
