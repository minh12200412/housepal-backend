# HousePal Backend (Node.js + PostgreSQL)

## 1. Mục đích

Backend cho app **HousePal – Ngôi nhà chung**  
Gồm 3 module chính:

1. **Chores** – Việc nhà
2. **Finance** – Quỹ chung & Chi tiêu phát sinh
3. **Bulletin** – Bảng tin & Danh sách mua sắm

Mỗi module đều có: `routes → controllers → services → repositories`.

---

## 2. Cài đặt nhanh

```bash
git clone <link-repo>
cd housepal-backend

npm install
```

### Tạo file `.env` (ở thư mục gốc)

```env
PORT=4000

PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=YOUR_PASSWORD
PG_DATABASE=housepal_db

JWT_SECRET=housepal_secret_key
```

> Thay `YOUR_PASSWORD` = mật khẩu đăng nhập pgAdmin.  
> `PG_DATABASE` = tên database nhóm dùng cho project (vd: `housepal_db`).

### Tạo database trong PostgreSQL

Trong **pgAdmin**:

1. `Servers → PostgreSQL → Databases → Right click → Create → Database…`
2. Đặt tên: **housepal_db** → Save.

(Nếu leader đã tạo sẵn DB từ script, mọi người chỉ cần `.env` đúng là dùng chung được.)

---

## 3. Cấu trúc chính

```text
src/
  app.js          # khởi tạo express app
  server.js       # chạy server

  config/
    env.js        # đọc .env
    db.js         # kết nối PostgreSQL

  routes/
    index.js
    finance.routes.js    # Module 2
    chores.routes.js     # Module 1
    bulletin.routes.js   # Module 3

  controllers/
    finance.controller.js
    chores.controller.js
    bulletin.controller.js

  services/
    finance.service.js
    chores.service.js
    bulletin.service.js

  repositories/
    finance.repository.js
    chores.repository.js
    bulletin.repository.js

  middlewares/
    error.middleware.js

  utils/
    apiResponse.js       # format JSON trả về
```

Flow xử lý:

> **Route → Controller → Service → Repository → DB**

---

## 4. Chạy backend

```bash
npm run dev
```

Mặc định chạy tại:

```text
http://localhost:4000
```

Test nhanh:

```text
GET http://localhost:4000/api/health
```

Nếu trả về:

```json
{
  "success": true,
  "message": "API is healthy",
  "data": { ... }
}
```

→ Backend + PostgreSQL OK ✅

---

## 5. Phân công – Mỗi người code ở đâu?

### 🧹 Module 1 – Việc nhà (Chores)

Code chính ở:

- `src/routes/chores.routes.js`
- `src/controllers/chores.controller.js`
- `src/services/chores.service.js`
- `src/repositories/chores.repository.js`

Nhiệm vụ:

- Thiết kế bảng DB cho việc nhà (chores, assignments, logs…).
- Viết API: việc hôm nay, hoàn thành, xoay vòng, leaderboard,…

---

### 💰 Module 2 – Quỹ chung & Chi tiêu (Finance)

Code chính ở:

- `src/routes/finance.routes.js`
- `src/controllers/finance.controller.js`
- `src/services/finance.service.js`
- `src/repositories/finance.repository.js`

Nhiệm vụ:

- Dùng các bảng: `monthly_funds`, `fund_contributions`, `fund_expenses`,  
  `extra_expenses`, `extra_expense_shares`, `settlements`.
- Viết API: quỹ tháng hiện tại, thêm chi từ quỹ, chi phát sinh, ai nợ ai, thanh toán nợ…

---

### 📌 Module 3 – Bảng tin & Mua sắm (Bulletin)

Code chính ở:

- `src/routes/bulletin.routes.js`
- `src/controllers/bulletin.controller.js`
- `src/services/bulletin.service.js`
- `src/repositories/bulletin.repository.js`

Nhiệm vụ:

- Thiết kế bảng `bulletins`, `shopping_items`.
- Viết API: ghi chú chung, danh sách mua sắm, đánh dấu đã mua,…

---

## 6. Quy ước trả JSON

- Thành công:

```json
{
  "success": true,
  "message": "Thông điệp",
  "data": { ... }
}
```

- Lỗi:

```json
{
  "success": false,
  "message": "Nội dung lỗi"
}
```

---

Các test nhanh có thể thử:
Mọi người chạy chung lệnh:

npm install
npm run dev

Rồi test nhanh:

GET /api/health

GET /api/finance/houses/1/funds/current

GET /api/chores/houses/1/today

GET /api/bulletin/houses/1/notes
