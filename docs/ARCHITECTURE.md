# LuxuryStay HMS Architecture

## Workspace Structure

The active implementation is organized as:

- `client/`
- `server/`
- `docs/`
- `docker/`

## Frontend Architecture

The frontend uses:

- React + Vite + JSX
- Tailwind CSS
- TanStack Query for API state
- Zustand for auth/session store
- role-based routing with a shared `AppShell`

### Frontend Zones

- Public website
- Guest portal
- Admin portal
- Manager portal
- Reception portal
- Housekeeping portal
- Maintenance portal

### Current Frontend Characteristics

- premium hospitality visual language
- responsive dashboard shell
- role-specific sidebars
- async loading states
- live charts for reporting views
- shared status badges, cards, and page headers

## Backend Architecture

The backend uses modular Express + JavaScript with MongoDB and Mongoose.

Core folders:

- `server/src/app`
- `server/src/config`
- `server/src/modules`
- `server/src/shared`

### Shared Backend Concerns

- environment parsing
- DB connection
- logging
- security middleware
- validation middleware
- error handling
- pagination utilities
- JWT token utilities

## Implemented Modules

- `auth`
- `users`
- `guests`
- `staff`
- `roles`
- `room-types`
- `rooms`
- `reservations`
- `billing`
- `housekeeping`
- `maintenance`
- `services`
- `feedback`
- `notifications`
- `reports`
- `settings`
- `audit`

## API Standard

All active APIs are exposed under:

- `/api/v1/*`

Standard response envelope:

```json
{
  "success": true,
  "message": "Human readable message",
  "data": {},
  "meta": {}
}
```

## Security Model

- JWT access token on authenticated requests
- refresh session persistence on backend
- role and permission middleware
- rate limiting
- Helmet
- CORS configuration
- Mongo sanitization
- server-side ownership checks for guest data

## Operational Workflow Links

- reservation lifecycle affects room state
- checkout creates housekeeping task
- housekeeping completion can restore room availability
- urgent maintenance can block inventory
- payments recalculate invoice state
- feedback is restricted to checked-out reservations
- audit logs and notifications are generated for major actions
