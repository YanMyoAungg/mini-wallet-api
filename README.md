# 🏦 Mini Wallet API

A simple wallet system API built with **Express.js**, **MongoDB (Mongoose)**, and **TypeScript**.  
Implements **cash-in**, **transfer**, and **reporting** functionality with idempotency, transaction handling and atomicity.  

---

## 1. Requirements

- Node.js >= 18  
- MongoDB (Atlas or local instance)  
- npm or yarn 
---

## 2. Installation

```bash
git clone https://github.com/YanMyoAungg/mini-wallet-api.git
cd mini-wallet-api
npm install
```
## 3. API endpoints

- api/v1/report/transactions (get all transactions report)
- api/v1/report/users (get all users report)
- api/v1/report/users?phone=<phone> to only filter one person
- api/v1/transfer (transfer user to user)
- api/v1/cashIn (cash in from company to one user or all users)
---


