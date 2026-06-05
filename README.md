# LinkPreview Pro

A full-stack web application that generates rich link previews, manages collections, and provides API-based preview extraction.

## 🚀 Features
- User Authentication (Login / Register / Forgot Password)
- Link Preview Generator (OG tags, metadata extraction)
- Collections system for organizing links
- API Key system for developers
- Dashboard with saved previews
- Email OTP system for password reset

## 🛠 Tech Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: Prisma (SQLite in dev / configurable in prod)
- Authentication: JWT
- Email: Nodemailer (SMTP / providers)

## 🌐 Live Demo
https://linkpreview-pro.onrender.com

## 📦 Setup (Local)
```bash
npm install
npx prisma db push
npm run dev:all
