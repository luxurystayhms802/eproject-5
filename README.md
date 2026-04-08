# LuxuryStay Hospitality Hotel Management System

LuxuryStay HMS is a production-style final-year Software Engineering project for a premium hotel brand. The project is built as a modern role-based MERN platform with a polished public website, operational dashboards, seeded demo data, and evaluator-ready workflows.

## Current Implementation Status

The active implementation lives in:

- `client/` React + Vite JSX frontend
- `server/` Express + JavaScript backend
- `docs/` evaluator and developer documentation

This repository is intentionally kept to one active frontend and one active backend so the structure remains clean for evaluation.

## Tech Stack

- Frontend: React, Vite, JSX, Tailwind CSS, TanStack Query, Zustand, Recharts
- Backend: Node.js, Express, JavaScript, MongoDB, Mongoose
- Security: JWT access tokens, refresh sessions, Helmet, CORS, rate limiting, Mongo sanitization
- Quality: Zod validation, Pino logging, Swagger docs, Vitest

## Working Roles

Seeded demo accounts are available for:

- `superadmin@luxurystay.com / Password123!`
- `admin@luxurystay.com / Password123!`
- `manager@luxurystay.com / Password123!`
- `reception@luxurystay.com / Password123!`
- `housekeeping@luxurystay.com / Password123!`
- `maintenance@luxurystay.com / Password123!`
- `guest1@example.com / Password123!`
- `guest2@example.com / Password123!`

## Implemented Areas

- Public website: home, about, rooms listing, room details, amenities, contact, FAQ, login, register, forgot/reset password
- Auth and RBAC: guest self-registration, login, logout, me, refresh support on backend, role and permission guards
- Core data modules: users, guests, staff, roles, room types, rooms, reservations, billing, housekeeping, maintenance, service requests, feedback, notifications, settings, audit logs, sessions
- Core hotel flows: room availability, booking creation, room assignment, reservation confirmation, check-in, check-out, invoice generation, payment recording, housekeeping task creation, maintenance blocking, guest feedback restrictions
- Dashboards: admin, manager, reception, housekeeping, maintenance, guest
- Oversight: reports dashboard, occupancy report, revenue report, reservations report, housekeeping summary, maintenance summary, feedback summary, notifications, audit logs

## Business Rules Enforced

- Public registration creates guest accounts only
- Staff creation is admin-only
- No overlapping active reservation for the same room
- Reservation can exist before room assignment
- Only confirmed reservations can check in
- A room must be assigned before check-in
- Check-in sets room status to `occupied`
- Check-out finalizes billing and sets room to `cleaning`
- Check-out auto-creates a housekeeping task
- Housekeeping completion restores room only if no blocking maintenance exists
- Urgent maintenance can move room to `maintenance`
- Invoice totals are recalculated from reservation charges, folio charges, discounts, and tax
- Payments update invoice paid amount, balance, and status
- Guests can only access their own data
- Feedback is only allowed after `checked_out`
- Major lifecycle actions create audit logs and notifications

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment files

Use:

- `client/.env.example`
- `server/.env.example`

### 3. Seed demo data

```bash
npm run seed:server
```

### 4. Run backend

```bash
npm run dev:server
```

### 5. Run frontend

```bash
npm run dev:client
```

### 6. Open documentation

- Swagger: `http://localhost:5000/docs`
- Frontend: default Vite local URL

## Verification Commands

```bash
npm run lint:server
npm run build:server
npm run test:server

npm run lint:client
npm run build:client
```

## Demo Walkthrough

Recommended evaluator order:

1. Public website room browsing and guest registration
2. Guest login, reservation visibility, service requests, feedback, notifications
3. Reception room assignment, check-in, check-out, invoice, and payment flow
4. Housekeeping task board and completion flow
5. Maintenance resolution flow
6. Admin operational dashboard, reports, settings, and audit visibility
7. Manager occupancy and revenue review

## Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [Demo Guide](./docs/DEMO_GUIDE.md)
- [Role Matrix](./docs/ROLE_PERMISSION_MATRIX.md)
- [Roadmap](./docs/PROJECT_ROADMAP.md)

## Current Residual Improvement Items

- deeper CRUD forms for admin operational modules
- broader automated test coverage for integration and e2e flows
- richer invoice PDF/download experience
