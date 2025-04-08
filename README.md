# 📈 Financial Management API

A robust financial management and expense control API built with **Fastify**, **Prisma**, **Zod**, **JWT**, **Redis**, and **GraphQL**. This hybrid API supports both **REST** and **GraphQL**, offering flexibility, performance, and developer productivity for modern financial apps.

---

## 🚀 Features

- 🔐 **User Authentication:** Secure login with **JWT**
- 🔍 **Input Validation:** Strong data validation using **Zod**
- 🔑 **Password Security:** Hashed credentials with **Bcrypt**
- 🚀 **High Performance API:** Built with **Fastify**
- 📊 **Financial Management:** Track income, expenses, and budgeting
- 🧠 **GraphQL Support:** Flexible data querying with **Mercurius + TypeGraphQL**
- ⚡ **Redis Integration:** Caching, session control, or pub/sub events
- 🤖 **Discord Bot Integration:** Notifications, commands, or budget alerts via Discord

---

## 💠 Tech Stack

- **Node.js**
- **Fastify**
- **Prisma** (ORM)
- **Zod** (Validation)
- **JWT** (Auth)
- **Bcrypt** (Hashing)
- **PostgreSQL**
- **GraphQL** (TypeGraphQL + Mercurius)
- **Redis** (via ioredis or node-redis)
- **Discord.js** (Bot integration)

---

## 📂 Project Structure

```
financial-management-api/
🔾 controllers/        # REST: Business logic
🔾 graphql/
   🔾 resolvers/       # GraphQL resolvers
   🔾 dtos/            # Models and inputs (TypeGraphQL)
🔾 lib/                # DB, Redis, Discord bot config
🔾 middlewares/        # Auth, validation, error handlers
🔾 models/             # TypeScript interfaces
🔾 routes/             # REST endpoints
🔾 tests/              # Unit and integration tests
🔾 index.ts            # App entry point (REST + GraphQL boot)
```

---

## 🔥 Getting Started

### 1. **Clone the repository**
```sh
git clone https://github.com/johnnyFR26/api.thinktech.git
cd api.thinktech
```

### 2. **Install dependencies**
```sh
npm install
```

### 3. **Set up environment variables**
Create a `.env` file:

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/yourdb"
JWT_SECRET="your_jwt_secret"
REDIS_URL="redis://localhost:6379"
DISCORD_TOKEN="your_bot_token"
DISCORD_CHANNEL_ID="your_channel_id"
```

### 4. **Run Prisma migrations**
```sh
npx prisma migrate dev --name init
```

### 5. **Start the server**
```sh
npm run dev
```

Access:
- REST: [http://localhost:3000](http://localhost:3000)
- GraphQL Playground: [http://localhost:3000/graphiql](http://localhost:3000/graphiql)

---

## ⚙️ API Overview

### REST Endpoints

#### Authentication
- `POST /auth/login` – Authenticate and receive a JWT

#### Users
- `GET /users` – List all users
- `POST /users` – Create a user
- `DELETE /users/:id` – Delete a user

#### Transactions
- `GET /transactions` – List all transactions
- `POST /transactions` – Create a transaction
- `DELETE /transactions/:id` – Remove a transaction

### GraphQL Endpoint
- Accessible at `/graphiql`
- Supports full CRUD via resolvers (User, Account, Transaction, etc.)

---

## 🤖 Discord Bot

- Sends transaction alerts or budgeting summaries directly to a Discord channel.
- Can support custom commands or notifications via webhook or `discord.js`.

---

## 🧠 Redis Usage

- Used for:
  - Caching frequently accessed queries
  - Session/token management (future)
  - Event pub/sub (e.g., Discord integration or webhooks)

---

## 🧪 Running Tests
```sh
npm run test
```

---

## 🔐 Security Best Practices

- Passwords hashed with Bcrypt
- All input validated via Zod
- Auth protected routes using JWT
- Secrets stored in `.env`
- HTTPS recommended in production

---

## 📄 License

This project is licensed under the **MIT License**

---

## 👥 Contributing

Found a bug or have an idea?  
Pull requests and suggestions are welcome.  
Let’s build something awesome together! 🚀

