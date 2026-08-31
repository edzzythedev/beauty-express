# Beauty Express — Salon Queue & Booking System

A queue and appointment system built for **Beauty Express**, a nail spa, solving the classic problem: customers showing up to a packed nail spa with no idea how long they'll wait.

## What it does

- **Customers** scan a QR code, register, and either book a specific time slot or join the live walk-in queue for a chosen employee.
- **Employees** log in to see their own queue for the day (bookings + walk-ins merged into one timeline), toggle their availability, and mark services as done.
- **Admin** has full control: manage employees, services, settings (like grace period length), and view all activity and payments across the salon.
- Payments happen after service, via **M-Pesa (Safaricom Daraja API)**.
- Customers earn **loyalty points** on confirmed payments, redeemable for future services.
- **WhatsApp** notifications keep customers informed — slot reminders, "your employee is free," released-slot alerts.

Built first for one salon (Beauty Express). Designed so it can later expand into a multi-tenant system serving many salons.

## Project structure

```
beauty-express/
├── backend/     → Node.js API (Express), handles auth, bookings, payments, notifications
├── frontend/    → Web app (no install needed) for customers, employees, and admin
├── docs/        → Database schema and other technical documentation
```

## Tech stack

- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Payments:** Safaricom Daraja API (M-Pesa)
- **Notifications:** WhatsApp Business API
- **Frontend:** (to be decided — likely React)

## Branching strategy

- `main` — stable, production-ready code only
- `development` — integration branch for ongoing work
- `feature/*`, `fix/*`, `chore/*` — individual work branches, merged into `development` via Pull Request

Commit messages follow conventional prefixes: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.

## Getting started

See `backend/README.md` and `frontend/README.md` for setup instructions specific to each part.

## Documentation

- [`docs/database-schema.md`](./docs/database-schema.md) — full database schema and design reasoning
- [`docs/API.md`](./docs/API.md) — API endpoint reference, request/response formats, and error codes
