# DevDynamics-Assignment-Backend-Intern
Code Repository of Assignment for Backend Intern at DevDynamics


This project is a backend API built for managing shared group expenses, calculating how much each person owes or is owed, and generating optimized settlements.

Built with:
- Node.js + Express
- Prisma ORM with PostgreSQL
- Zod for validation
- Tailwind + React (for frontend - see below)
- Deployed using Railway (backend) and Vercel (frontend)

---

## 🌐 Live Backend URL
yamanote.proxy.rlwy.net:21144/


All endpoints are deployed and accessible via this base URL.

---

## 📘 Backend API Routes & Descriptions

### 📦 Expense Management

| Method | Route               | Description                                                                 |
|--------|---------------------|-----------------------------------------------------------------------------|
| `POST`| `/expenses`         | Add a new expense. Auto-creates people and splits the expense accordingly. |
| `GET` | `/expenses`         | Fetch all recorded expenses with split and payer information.              |
| `PUT` | `/expense/:id`      | Update an expense by ID. Modifies payer, amount, description, and splits.  |
| `DELETE`| `/expense/:id`    | Delete an expense by ID along with its split information.                  |

---

### 👥 People & Balances

| Method | Route              | Description                                                                 |
|--------|--------------------|-----------------------------------------------------------------------------|
| `GET` | `/people`          | Returns list of all participants (payers/split members).                    |
| `GET` | `/balances`        | Shows each person's total paid, owed, and final balance.                    |
| `GET` | `/settlements`     | Shows simplified settlements: who should pay whom and how much.             |

---

### 📊 Analytics

| Method | Route                   | Description                                                               |
|--------|-------------------------|---------------------------------------------------------------------------|
| `GET` | `/category-expenses`    | Returns total amount spent per category (Food, Rent, Travel, etc.).       |
| `GET` | `/monthly-expenses`     | Returns expenses from the last 30 days + per-category monthly totals.     |

---

## 🧠 Settlement Calculation Logic

The API uses the following logic to simplify settlements:

1. Calculate for each person:
   - `totalPaid`: sum of expenses they paid
   - `totalOwed`: sum of what they owe across all splits
   - `balance = totalPaid - totalOwed`

2. Group people into:
   - **Creditors** (positive balance)
   - **Debtors** (negative balance)

3. Use a **greedy algorithm** to match debtors to creditors and minimize number of transactions:
   - e.g., Sanket pays Shantanu ₹220

✅ All calculations round to two decimals and eliminate unnecessary micro-payments.

---

## 👤 Test Users

These users are pre-populated for testing:

- `Shantanu`
- `Sanket`
- `Om`

---

## 🧾 Sample Test Expenses (used in Postman)

| Description     | Amount | Paid By   | Split Type | Status         |
|----------------|--------|-----------|------------|----------------|
| Dinner          | ₹600   | Shantanu  | Equal      | ✅ Added        |
| Groceries       | ₹450   | Sanket    | Equal      | ✅ Added        |
| Petrol          | ₹300   | Om        | Equal      | ✅ Added        |
| Movie Tickets   | ₹500   | Shantanu  | Equal      | ✅ Added        |
| Pizza           | ₹280   | Sanket    | Equal      | ✅ Added/Deleted|

> ✅ Update petrol to ₹350 via PUT  
> ✅ Delete pizza via DELETE

---

## 💡 Validations (Zod)

- Negative amounts ❌ rejected
- Missing `description`, `paid_by`, or `split` ❌ rejected
- `splitType` must be one of: `equal`, `exact`, or `percentage`
- At least 1 person required in each split

---

## 🖥 Frontend (Bonus UI)

- Built using **React + Tailwind**
- `/dashboard` view includes:
  - 💰 Balances
  - 🤝 Settlements
  - 📊 Category & Monthly Analytics
  - 👥 People
  - ➕ Add Expense button
- `/add-expense`:
  - Dynamic form with validation and live split configuration

> Frontend connects to deployed backend and reflects live balances

---

## 🧪 Local Setup (Backend)

```bash
git clone https://github.com/your-username/DevDynamics-Assignment-Backend-Intern
cd backend
npm install
cd db
npx prisma generate
npx prisma migrate dev --name init
tsc -b
node dist/node index.js



##Backend Routes
POST /expenses 
GET /expenses
PUT /expense/:id
DELETE /expense/:id
GET /people 
GET /settlements
GET /balances
GET /category-expenses
GET /monthly-expenses