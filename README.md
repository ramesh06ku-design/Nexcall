# NexCall

NexCall is a SaaS foundation for agencies that manage telecalling teams. Prompt 2 makes authentication, MongoDB persistence, secure sessions, tenant isolation, and role-based access functional while intentionally leaving leads, calls, follow-ups, billing, and advanced analytics for later phases.

## Architecture

```text
nexcall/
├── frontend/                 Next.js App Router application
│   ├── app/                  Marketing, auth and protected role routes
│   ├── components/auth/      AuthProvider, guards, forms and password input
│   ├── components/shared/    Responsive dashboard shell
│   ├── lib/api/              Central credentialed API client
│   ├── lib/auth/             Role redirects and server session lookup
│   └── proxy.ts              Server-side frontend route protection
├── backend/
│   ├── .env.example      Backend environment template
│   └── src/
│       ├── config/           Validated environment and reusable Mongo connection
│       ├── controllers/      Auth and agency HTTP handlers
│       ├── middleware/       Validation, authentication and role authorization
│       ├── models/           User, Agency and SubscriptionPlan
│       ├── routes/           Auth and role-scoped API routes
│       ├── services/         Auth, session and telecaller business logic
│       └── scripts/          Private admin seed command
├── frontend/.env.example Frontend environment template
└── package.json
```

The Express backend is the authorization source of truth. It reloads the current user from MongoDB for authenticated requests and never trusts a role, status, user ID, or agency ID supplied by the browser.

## Roles and entry points

| Role | Account creation | Login | Dashboard |
| --- | --- | --- | --- |
| `admin` | Private seed command | `/login` | `/admin/dashboard` |
| `agency` | Public `/signup` | `/login` | `/agency/dashboard` |
| `telecaller` | Protected agency API | `/worker-login` | `/worker/dashboard` |

There is intentionally no `/admin/login`, `/admin/signup`, or `/worker/signup`.

## Authentication flows

```text
Agency signup
    ↓
Agency + agency owner created atomically
    ↓
HTTP-only session cookie
    ↓
Agency dashboard

Admin
    /login
    ↓
Admin dashboard

Telecaller
    Agency creates account through protected API
    ↓
    /worker-login
    ↓
Worker dashboard
```

Passwords are hashed with bcrypt using 12 rounds. Signed seven-day session tokens are stored only in an HTTP-only cookie; browser storage is not used. Cookies are Secure in production and use `SameSite=Lax`. Logout clears the cookie with the same scope.

Agency signup attempts a MongoDB transaction when connected to Atlas or a replica set. Standalone development MongoDB instances use a compensating rollback so a partial failure does not leave an orphaned agency or owner.

## API endpoints

| Method | Endpoint | Access |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | Public; creates an agency owner only |
| `POST` | `/api/auth/login` | Public; accepts only admin/agency accounts |
| `POST` | `/api/auth/worker-login` | Public; accepts only telecallers |
| `POST` | `/api/auth/logout` | Clears the current session |
| `GET` | `/api/auth/me` | Authenticated; returns a safe user and agency summary |
| `POST` | `/api/agency/telecallers` | Agency only; creates a telecaller in the session agency |
| `GET` | `/api/admin/*` | Admin only |
| `GET` | `/api/agency/*` | Agency only |
| `GET` | `/api/worker/*` | Telecaller only |

`POST /api/agency/telecallers` accepts `name`, `email`, optional `username`, optional `phone`, and `password`. It rejects unknown properties and always derives `agencyId` from the authenticated agency user. It never returns the password hash.

## Prerequisites and installation

- Node.js 20.9 or newer
- npm 10 or newer
- MongoDB 7+ locally, in Docker, or through MongoDB Atlas

```bash
cd nexcall
npm install
```

Create each app's local environment file from its colocated template. A root `.env` is not required.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

On PowerShell, use `Copy-Item` instead:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local
```

```env
# backend/.env
MONGODB_URI=mongodb://127.0.0.1:27017/nexcall
AUTH_SECRET=replace-with-at-least-32-random-characters
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:4000
PORT=4000
NODE_ENV=development
COOKIE_DOMAIN=
ADMIN_NAME=NexCall Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-strong-password
DEMO_PASSWORD=demo1234

# frontend/.env.local
BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Generate a strong secret rather than using the example:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Never commit either environment file.

The backend resolves `backend/.env` relative to its configuration module, so the same file is used whether backend commands are launched from the repository root or from `backend/`. Next.js natively loads `frontend/.env.local`. `BACKEND_URL` is server-only; only the two non-secret URLs prefixed with `NEXT_PUBLIC_` are exposed to browser code.

Leave `COOKIE_DOMAIN` empty on localhost. For same-site production subdomains, set it to a shared parent such as `.example.com` so both the API and frontend route proxy receive the session cookie. Prefer a same-origin reverse proxy where possible.

## MongoDB

For local development, start MongoDB and use:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/nexcall
```

An Atlas connection string can be used instead. Express establishes one reusable connection during startup, reports selection failures cleanly, and closes the connection during graceful shutdown. Production index creation should be handled through a deployment/migration process; automatic index creation is disabled in production.

## Create the first admin

Configure `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`, then run:

```bash
npm run seed:admin -w backend
```

The command creates an admin only when no admin exists. It never updates an existing admin, never promotes another account, does not expose a public endpoint, hashes the password, and never prints it.

## Seed development demo accounts

Set `DEMO_PASSWORD=demo1234` in `backend/.env`, keep `NODE_ENV=development`, ensure MongoDB is running, then run:

```bash
npm run seed:demo
```

The seed is idempotent and prepares one linked agency workspace without storing plaintext passwords:

| Login | Email | Password | Destination |
| --- | --- | --- | --- |
| Admin | `admin@demo.nexcall.com` | `demo1234` | `/admin/dashboard` |
| Agency owner | `agency@demo.nexcall.com` | `demo1234` | `/agency/dashboard` |
| Worker | `worker@demo.nexcall.com` | `demo1234` | `/worker/dashboard` |

Rahul Sharma owns **Acme Agency**, and Priya Mehta belongs to the same agency. The demo command refuses to run in production and stops if one of these emails belongs to a conflicting role. Running it again refreshes only these explicitly named demo accounts. The shared `/login` accepts admin and agency accounts; `/worker-login` accepts telecallers only. Demo credentials are shown on those pages only in development builds.

The agency dashboard reads identity and agency information from the authenticated MongoDB session. Its summary metrics, seven-day activity chart, follow-up preview, top performers, recent activity, and notifications are intentionally isolated in a typed frontend demo-data module until the corresponding resource APIs are introduced.

## Development commands

## Agency telecaller management

Agency owners can manage their own workers at `/agency/telecallers`. Search, status filtering, pagination, creation, profile editing, activation/deactivation, and tenant-scoped details use these protected routes:

```text
GET   /api/agency/telecallers
POST  /api/agency/telecallers
GET   /api/agency/telecallers/:id
PATCH /api/agency/telecallers/:id
PATCH /api/agency/telecallers/:id/status
```

Every database query derives `agencyId` from the authenticated agency session. Email, role, user ID, and agency ownership cannot be changed through these APIs. Deactivation is a reversible status change rather than deletion, and inactive workers are rejected by Worker Login. Use the seeded agency account to manage the list and the seeded worker account to verify Worker Login.

## Agency lead management

Agency owners manage their active pipeline at `/agency/leads`. Lead statuses are `new`, `contacted`, `interested`, `follow_up`, `converted`, `not_interested`, and `lost`. Search, status/assignee filters, pagination, details, editing, assignment, status changes, and soft archive use:

```text
GET   /api/agency/leads
POST  /api/agency/leads
GET   /api/agency/leads/:id
PATCH /api/agency/leads/:id
PATCH /api/agency/leads/:id/archive
```

Every lead query derives `agencyId` from the authenticated session. The backend independently verifies that an assignee is an active telecaller in that same agency. Archived leads remain in MongoDB and are excluded from the default list. `npm run seed:demo` idempotently prepares four small Acme Agency demo leads and does not multiply them when rerun. Sign in as `agency@demo.nexcall.com` with the documented demo password and open `/agency/leads` to test the workflow.

## Call management and logging

Agency owners record completed conversations at `/agency/calls`; NexCall does not place or record phone calls. Outcomes are `answered`, `no_answer`, `busy`, `callback_requested`, `interested`, `not_interested`, `wrong_number`, and `converted`. Duration is stored in seconds, and callback requests require a future follow-up timestamp foundation.

```text
GET  /api/agency/calls
POST /api/agency/calls
GET  /api/agency/calls/:id
GET  /api/agency/leads/:id/calls
```

Every call is permanently linked to its session-derived agency, a lead in that agency, and an active telecaller in that agency. Historical call records are immutable through the current API. Outcomes apply only conservative lead transitions: new→contacted for answered, interested, converted, or not interested as explicitly selected; converted leads are never downgraded. `npm run seed:demo` idempotently prepares four recent Acme Agency calls. Sign in as the demo agency and open `/agency/calls`; lead details also show newest-first call history.

## Follow-up management

Agency owners manage callback tasks at `/agency/followups`. Follow-ups use `pending`, `completed`, and `cancelled`; overdue is derived from a pending task whose scheduled time has passed. Protected routes are `GET/POST /api/agency/follow-ups`, `GET /api/agency/follow-ups/:id`, and `PATCH /api/agency/follow-ups/:id`. Lead, telecaller, optional call, and follow-up ownership are always checked against the authenticated agency. Callback-requested calls automatically create exactly one follow-up during call creation. The demo seed idempotently prepares today, upcoming, overdue, and completed examples.

Run both applications:

```bash
npm run dev
```

Or separately:

```bash
npm run dev -w frontend
npm run dev -w backend
npm run seed:demo
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Health check: http://localhost:4000/api/health

## Test the auth flow

Automated tests cover route separation, unauthenticated responses, role middleware, cookie/token settings, safe user serialization, and tenant-derived telecaller ownership:

```bash
npm test
```

With MongoDB and both apps running, use the UI to test `/signup`, `/login`, and `/worker-login`. A direct signup check can also use a cookie jar:

```bash
curl -i -c cookies.txt -H "Content-Type: application/json" \
  -d '{"agencyName":"Demo Agency","ownerName":"Demo Owner","email":"owner@example.com","phone":"","password":"password123","confirmPassword":"password123"}' \
  http://localhost:4000/api/auth/signup

curl -i -b cookies.txt http://localhost:4000/api/auth/me

curl -i -b cookies.txt -X POST http://localhost:4000/api/auth/logout
```

Use a disposable development database when repeating signup tests because email addresses are unique.

## Security notes

- MongoDB owns role, tenant, and account-status decisions.
- `passwordHash` uses `select: false`, is removed during JSON serialization, and is omitted by safe-user mapping.
- Agency APIs derive the tenant from `request.user.agencyId`; request-body `agencyId` is never authoritative.
- Credentialed CORS allows only `FRONTEND_URL`, never `*`.
- Frontend proxy protection verifies `/api/auth/me` and redirects role mismatches; Express middleware remains the security boundary.
- Suspended/inactive users and users belonging to suspended agencies are denied.
- If frontend and backend are deployed on completely different sites, review `SameSite`, cookie domain, HTTPS, and CSRF requirements before launch.

## Quality commands

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Dashboard metrics remain explicit development mock data. Telecaller management UI, password reset delivery, email verification, leads, calls, follow-ups, subscriptions, and all later product features remain out of scope.
