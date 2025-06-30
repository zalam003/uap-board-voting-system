# 🗳️ UAP Board Voting System

A secure, OTP-based online voting system for electing the Chairperson of the University of Asia Pacific Board.

This project includes:

- ✅ OTP-based voter authentication via email
- ✅ Vote casting and storage
- ✅ Admin dashboard with real-time tally visualization
- ✅ CSV export of votes
- ✅ UAP branding (logo and color scheme)

---

## 📦 Tech Stack

| Component     | Technology              |
|---------------|--------------------------|
| Frontend      | Next.js 14 (App Router) + React + TailwindCSS + Recharts |
| Backend       | FastAPI + SQLAlchemy + SendGrid |
| Database      | SQLite (or PostgreSQL)   |
| Deployment    | Vercel (Frontend) + Render or Railway (Backend) |

---

## 🛠️ Local Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/uap-voting-system.git
cd uap-voting-system
````

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```env
DATABASE_URL=sqlite:///./test.db
SENDGRID_API_KEY=your_real_sendgrid_key
FROM_EMAIL=noreply@uap-bd.edu
ADMIN_SECRET=your_secure_admin_password
```

Run the server:

```bash
uvicorn app.main:app --reload
```

Access the API docs at: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Visit the frontend at: [http://localhost:3000](http://localhost:3000)

---

## 🚀 Deployment

### Deploy Frontend to Vercel

1. Push your frontend code to a GitHub repo
2. Go to [https://vercel.com](https://vercel.com)
3. Import the repo and deploy
4. Set up `vercel.json` to proxy to your backend

### 🖥️ Backend Deployment to Render

#### 🔧 1. Push your backend code to a GitHub repository

Create a repo like `uap-voting-backend` and push all files from the `backend/` folder.

---

#### 🚀 2. Deploy on Render.com

1. Go to [https://render.com](https://render.com)
2. Click **"New Web Service"**
3. Connect your GitHub account and select your backend repo
4. Use the following settings:

| Key               | Value                                              |
| ----------------- | -------------------------------------------------- |
| **Environment**   | `Python 3`                                         |
| **Build Command** | `pip install -r requirements.txt`                  |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port 10000` |
| **Environment**   | `Add your .env values`                             |

Example `.env` entries:

```
DATABASE_URL=sqlite:///./test.db
SENDGRID_API_KEY=your_real_key
FROM_EMAIL=noreply@uap-bd.edu
ADMIN_SECRET=your_admin_password
```

> ✅ Render will give you a URL like `https://uap-vote-backend.onrender.com`

---

#### 🔁 3. Update your frontend `vercel.json`

```json
"rewrites": [
  {
    "source": "/api/:path*",
    "destination": "https://uap-vote-backend.onrender.com/:path*"
  }
]
```

Now your frontend hosted on Vercel will call your backend deployed on Render.

---

## 🧪 Test Admin Panel

1. Visit `/admin`
2. Enter the password set in `ADMIN_SECRET`
3. View the vote tally
4. Download CSV of all votes

---

## ✅ Features Overview

* 🔒 One vote per email
* ⏲️ OTP expires in 5 minutes
* 📊 Vote results shown as live chart
* ⬇️ CSV download for record keeping

---

## 📁 Project Structure

```
uap-voting-system/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── auth.py
│   │   ├── vote.py
│   │   ├── admin.py
│   │   ├── models.py
│   │   └── database.py
│   ├── .env
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── vote/page.tsx
│   │   └── admin/page.tsx
│   ├── public/logo.png
│   ├── globals.css
│   ├── package.json
│   └── tsconfig.json
```

---

## ✉️ License

This project is developed for academic and institutional use by the University of Asia Pacific. Contributions are welcome via pull requests.
