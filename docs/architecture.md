# Architecture Overview

## System Design

```
┌─────────────────────────────────────────────┐
│              Client (React + Vite)           │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │  Pages   │→ │  Routes  │→ │ Axios API │  │
│  └──────────┘  └──────────┘  └─────┬─────┘  │
└──────────────────────────────────────┼───────┘
                                       │ HTTP/REST
┌──────────────────────────────────────┼───────┐
│           Server (Express + TS)      │       │
│  ┌────────────────────────────────────▼────┐  │
│  │  Middlewares (Morgan, Helmet, CORS...)  │  │
│  └────────────────────────────────────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Routes   │→ │Controllers│→ │  Services  │  │
│  └──────────┘  └──────────┘  └─────┬──────┘  │
│                                     │         │
│  ┌──────────────────────────────────▼──────┐  │
│  │          Repositories (DB layer)        │  │
│  └──────────────────────────────────────┬─┘  │
└─────────────────────────────────────────┼────┘
                                           │
          ┌────────────────────────────────┤
          │                                │
   ┌──────▼──────┐                  ┌──────▼──────┐
   │    MySQL     │                  │    Redis     │
   │  (Prisma)    │                  │   (Cache)    │
   └─────────────┘                  └─────────────┘
```

## Key Design Decisions

| Decision | Rationale |
|---|---|
| TypeScript everywhere | Type safety, better IDE support, fewer runtime bugs |
| Layered architecture | Separation of concerns, easy to test each layer in isolation |
| Zod env validation | Server fails fast on startup with clear errors if config is wrong |
| Dual JWT tokens | Short access tokens reduce exposure; refresh tokens rotated on use |
| Redis caching | Reduces DB load on read-heavy property listing queries |
| Rate limiting | Protects auth endpoints from brute-force, global rate-limit for DDoS |
| Centralised error handler | Single place to format errors; stack traces hidden in production |

## Module Structure

Each feature module under `api/v1/` follows this pattern:

```
/auth
  auth.routes.ts       → URL definitions, middleware chains
  auth.controller.ts   → Parse request, call service, return response
  auth.service.ts      → Business logic (hashing, token generation)
  auth.repository.ts   → Database queries via Prisma client
```
