# AI Mail Agent

Full-stack email assistant with:
- Professional auth pages (login, register, forgot password, reset password)
- JWT-based session auth
- MongoDB-backed users and email threads
- Protected mailbox APIs
- Branded AI Mail Agent logo

## Tech Stack

- Frontend: React + TypeScript + Material UI
- Backend: Node.js + Express + MongoDB (Mongoose)
- Auth: bcrypt password hashing + JWT access token + reset token flow

## Quick Start

1. Install dependencies

```bash
yarn install
```

2. Configure environment

```bash
cp .env.example .env
```

Update `.env` values:
- `MONGODB_URI` for your MongoDB instance
- `JWT_SECRET` with a strong random secret

3. Run frontend + backend together

```bash
yarn dev
```

Frontend runs on `http://localhost:3000` and backend runs on `http://localhost:5000`.

## Scripts

- `yarn dev` runs frontend + backend together
- `yarn start` runs only frontend
- `yarn server:dev` runs backend with nodemon
- `yarn server` runs backend with node
- `yarn test` runs frontend tests
- `yarn build` builds frontend

## API Overview

Auth routes:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me`

Email routes (protected with `Authorization: Bearer <token>`):
- `GET /api/emails`
- `POST /api/emails/add`
- `GET /api/emails/thread/:threadId`
- `POST /api/emails/ai-reply`
- `GET /api/emails/stats`

## Notes

- Forgot-password currently returns `resetToken` and `resetUrl` in API response so local development works without SMTP/email provider setup.
- Logo asset is at `src/assets/ai-mail-agent-logo.svg`.
