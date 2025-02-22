# 📈 Financial Management API

A robust financial management and expense control API built with **Fastify**, **Prisma**, **Zod**, **JWT**, and **Bcrypt**. This API allows secure authentication, user management, and financial transaction tracking to support financial management applications.

---

## 🚀 Features
- **User Authentication:** Secure login with **JWT**.
- **Data Validation:** Strong validation using **Zod**.
- **Password Security:** Hashing and verification with **Bcrypt**.
- **Database ORM:** **Prisma** for robust and easy database management.
- **Fast and Lightweight:** Built with **Fastify** for performance.
- **Financial Management:** Manage income, expenses, and budget efficiently.

---

## 🛠️ Tech Stack
- **Node.js**
- **Fastify**
- **Prisma**
- **Zod**
- **JWT (JsonWebToken)**
- **Bcrypt**
- **PostgreSQL**

---

## 📂 Project Structure
```
financial-management-api/
├─ controllers/    # Business logic
├─ lib/            # External library configurations (e.g., Prisma client)
├─ middlewares/    # Authentication and validation middleware
├─ models/         # Interfaces of TS
├─ routes/         # API endpoints
├─ tests/          # Unit and integration tests
└─ index.ts        # Application entry point
```

---

## 🔥 Getting Started
### 1. **Clone the repository:**
```sh
git clone https://github.com/johnnyFR26/api.thinktech.git
cd api.thinktech
```

### 2. **Install dependencies:**
```sh
npm install
```

### 3. **Set up environment variables:**
Create a `.env` file in the root directory with the following variables:
```env
DATABASE_URL="file:./dev.db"  # For SQLite (or use a PostgreSQL connection string)
JWT_SECRET="your_secret_key"
```

### 4. **Run Prisma migrations:**
```sh
npx prisma migrate dev --name init
```

### 5. **Start the server:**
```sh
npm run dev
```
Access at: [http://localhost:3000](http://localhost:3000)

---

## 🚦 **API Endpoints**
### Authentication
- `POST /auth/login` - Authenticate a user and receive a JWT.

### User Management
- `GET /users` - Get all users.
- `POST /users` - Create a new user.

### Financial Transactions
- `GET /transactions` - Get all financial transactions.
- `POST /transactions` - Create a new transaction.
- `DELETE /transactions/:id` - Delete a transaction.

---

## 🧪 **Running Tests**
```sh
npm run test
```

---

## 🔒 **Security Best Practices**
- Store secrets in environment variables.
- Hash passwords before saving to the database.
- Validate all input with **Zod**.
- Use HTTPS in production.

---

## 📄 **License**
This project is licensed under the MIT License.

---

## 👨‍💻 **Contributing**
Feel free to open issues or submit pull requests to help improve this project!

