# 🏦 Mini Wallet API

This project is a simple wallet system API built with **Express.js**, **MongoDB (Mongoose)**, and **TypeScript**. It supports cash-in, user-to-user transfer, and reporting features, with idempotency and atomic transaction handling.

---

## Features

- Cash-in to one or all users
- User-to-user transfer
- Transaction and user reporting
- Idempotency for safe retries
- Atomic operations for data consistency

---

## Requirements

- Node.js >= 18
- MongoDB
- npm or yarn

---

## Getting Started

1. **Clone the repository:**
	```bash
	git clone https://github.com/YanMyoAungg/mini-wallet-api.git
	cd mini-wallet-api
	npm install
	```
2. **Set up environment variables:**
	- Create a `.env` file in the root directory with your MongoDB connection string and any other required variables.
3. **Run the development server:**
	```bash
	npm run dev
	```
4. **Run tests:**
	```bash
	npm test
	```

---

## API Endpoints


All endpoints are prefixed with `/api/v1/`.

### Cash In

- `POST /api/v1/cashIn`
	- Cash in from company to one user or all users.
	- **Body:**
		- `userId` (optional, string): If provided, cash in to a single user. If omitted, the specified `amount` will be credited to every user in the system (company must have sufficient balance for all users).
		- `amount` (number, required): Amount to cash in per user.
		- `idempotencyKey` (string, required): Unique key for idempotency. When cashing in to all users, a unique key will be generated for each user using this base key.
	- **Behavior:**
		- If `userId` is omitted, the company balance is debited by `amount * number of users`, and each user receives `amount - fee` (fee is calculated per user).
		- If `userId` is provided, only that user receives the cash-in.

### Transfer

- `POST /api/v1/transfer`
	- Transfer funds from one user to another.
	- **Body:**
		- `fromUserId` (string, required): Sender's user ID.
		- `toUserId` (string, required): Recipient's user ID.
		- `amount` (number, required): Amount to transfer.
		- `idempotencyKey` (string, required): Unique key for idempotency.

### Reports

- `GET /api/v1/report/transactions`
	- Get a report of all transactions.

- `GET /api/v1/report/users`
	- Get a report of all users.
	- **Query:**
		- `phone` (optional, string): Filter by user phone number.

---

## Project Structure

- `src/controllers/` - Route handlers
- `src/services/` - Business logic
- `src/models/` - Mongoose models
- `src/routes/` - API route definitions
- `src/middleware/` - Middleware (e.g., idempotency)
- `src/database/` - Database connection
- `src/utils/` - Utility functions
- `src/scripts/seed.ts` - Seed script for test data
- `src/tests/` - Test files

---


