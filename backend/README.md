# Backend — Beauty Express

Node.js + Express API.

## Setup

```bash
cd backend
npm install
cp .env.example .env    # then fill in real values
npm run dev
```

Server runs at `http://localhost:4000`. Check it's alive at `http://localhost:4000/api/health`.

## Folder structure

- `src/routes/` — API endpoint definitions
- `src/controllers/` — request handling logic
- `src/models/` — database models/queries
- `src/middleware/` — auth checks, error handling, etc.
