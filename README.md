# AI Ticket Management System

An AI-assisted ticket management application for creating, organizing, and tracking team work. It combines an Angular Kanban workspace with a Node.js/Express API, MongoDB persistence, role-based access control, and Google Gemini description analysis.

## Project overview

The system gives teams a shared view of tickets and their workflow status, with permissions appropriate to administrators, developers, and read-only viewers. The Kanban board supports drag-and-drop status changes for authorized users. Gemini analysis helps users understand a ticket and consider recommended next steps; users remain in control of ticket changes and saving.

## Key features

- **Ticket CRUD:** Create, view, edit, and delete tickets. The API permits ticket creation and editing by admins and developers; deletion is admin-only.
- **Kanban workflow:** View tickets in status columns and drag tickets between statuses. Admins and developers can move tickets; failed moves are reverted in the UI.
- **Role-based access control:** `ADMIN`, `DEVELOPER`, and `VIEWER` roles. Viewers can read tickets; admins manage users and can delete tickets; admins and developers can create, edit, move, and analyze tickets. See [Authentication and security](#authentication-and-security) and [Project requirements](PROJECT_REQUIREMENTS.md).
- **AI description analysis:** Google Gemini returns a short summary, priority recommendation, category recommendation, and Markdown troubleshooting suggestions.
- **Review before saving:** The dialog displays AI results for user review. A user can select a troubleshooting suggestion and explicitly apply it to the editable description. This updates the form only; the user must still select **Create Ticket** or **Update Ticket** to save. On successful analysis, the AI category is copied into the editable Category field, which users can then change. The AI priority is displayed but is not copied into the ticket Priority control.

**Known permission gap:** the API currently allows a developer to edit any ticket; it does not enforce the “assigned tickets only” wording found in a backend permission description.

## Technology stack

Versions below are the manifest/lockfile versions or ranges, not a claim that every dependency has been independently upgraded to its latest release.

| Area | Technology |
|---|---|
| Frontend | Angular `^22.2.0`, Angular Material/CDK `^22.2.2` |
| Language | TypeScript `~6.0.2` |
| Frontend tooling and tests | Angular CLI/build `^22.2.2`, Vitest `^5.0.0`, jsdom `^30.0.0`, Prettier `^3.8.1` |
| Backend runtime/framework | Node.js, Express `^4.21.2` |
| Database/ODM | MongoDB, Mongoose `^8.8.2` |
| AI | Google Gemini via `@google/genai` `^2.29.0`; model ID `gemini-3.5-flash-lite` is configured in backend source |
| Backend test script | `npm test` exists but is a placeholder and does not run a backend test suite |

The frontend manifest specifies npm `11.6.2`. Its lockfile requires a Node.js version in `^22.22.3 || ^24.15.0 || >=26.0.0`; use a compatible Node release (for example, Node 22.22.3 or later in the 22.x line).

## Architecture

```text
Angular frontend
  └─ HTTP requests (session cookie) ─> Express REST API
                                        ├─ Ticket/auth/user services ─> MongoDB via Mongoose
                                        └─ AI analysis service ────────> Google Gemini API
```

The browser calls the application API for ticket operations and AI analysis; the Gemini key is used only by the backend. See the [documentation index](docs/README.md) for architecture, deployment, diagram, model, and requirements documents.

## Project structure

```text
.
├── README.md
├── PROJECT_REQUIREMENTS.md
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── package-lock.json
│   ├── scripts/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── services/
│       └── server.js
├── frontend/
│   ├── package.json
│   ├── package-lock.json
│   ├── angular.json
│   └── src/app/
│       ├── core/
│       ├── features/
│       ├── models/
│       ├── services/
│       └── shared/
└── docs/
    ├── architecture/
    ├── diagrams/
    └── models/
```

## Prerequisites and local setup

### Prerequisites

- Node.js compatible with the Angular CLI lockfile requirement above.
- npm (the frontend manifest specifies npm `11.6.2`).
- A running MongoDB instance and a database connection URI.
- A Google Gemini API key for AI analysis.
- Git.

### 1. Clone the repository

Replace `<repository-url>` with the URL for your repository:

```sh
git clone <repository-url>
cd TMS
```

### 2. Configure and start the backend

Install dependencies and create a private environment file from the committed template:

```sh
cd backend
npm ci
```

Copy `backend/.env.example` to `backend/.env` (on Windows PowerShell: `Copy-Item .env.example .env`; on macOS/Linux: `cp .env.example .env`). Edit the new `.env` file and configure:

| Variable | Purpose |
|---|---|
| `PORT` | Express port. Set it to `3000` for the provided Angular development environment. The server defaults to `5000` if unset. |
| `NODE_ENV` | Runtime mode; use `development` locally. |
| `MONGODB_URI` | MongoDB connection URI for this environment. |
| `JWT_SECRET` | Private signing secret; the backend requires at least 32 bytes. Generate a strong random value and never commit it. |
| `FRONTEND_ORIGIN` | Allowed browser origin for credentialed CORS; use the Angular dev server origin locally. |
| `API_KEY` | Gemini API key used by the backend AI service. Never place it in frontend configuration or commit it. |

The example file contains placeholders/defaults: replace credential values with your own private configuration. In particular, do not reuse the example JWT value; generate a strong random secret of at least 32 bytes. The backend loads `.env` through `dotenv`; MongoDB connection fails at startup when `MONGODB_URI` is missing.

Start the backend from the `backend/` directory:

```sh
npm run dev
```

For the non-watch start script, use `npm start`. The API defaults to port `5000` when `PORT` is not set; the frontend's development environment points to port `3000`, so configure the local backend port accordingly or adjust the frontend environment for your setup.

### 3. Install and start the frontend

In a second terminal:

```sh
cd frontend
npm ci
npm start
```

The Angular development server uses the development environment, whose API base URL is `http://localhost:3000/api`. The production environment uses the relative base URL `/api`, so production hosting must route that path to the backend.

### 4. Build the frontend for production

From `frontend/`:

```sh
npm run build
```

This runs `ng build`, which uses the Angular project's production configuration by default. The backend package does not define a build script.

### Administrator setup

New self-registrations are assigned the `VIEWER` role. The backend package defines `npm run create:admin` to create an initial administrator. Before running it, set `ADMIN_EMAIL`, `ADMIN_NAME`, and `ADMIN_PASSWORD` in the backend environment; the password must be 12–72 UTF-8 bytes. The script also requires the MongoDB configuration described above and refuses to create a duplicate email. Keep these credentials private and remove them from the environment when no longer needed.

## API overview

All paths below are relative to `/api`. Ticket and user routes require authentication as shown. Successful resource responses commonly wrap their payload in `data`; error responses use a `message` field. Role restrictions are enforced by backend middleware, not just by the UI.

### Authentication

| Method | Endpoint | Access | Behavior |
|---|---|---|---|
| `POST` | `/auth/register` | Public; optional authentication | Creates a `VIEWER` account; returns `201` and `{ "data": user }`. |
| `POST` | `/auth/login` | Public | Authenticates and sets the `access_token` cookie; returns `{ "data": user }`. |
| `POST` | `/auth/logout` | Public | Clears the session cookie; returns a message. |
| `GET` | `/auth/me` | Authenticated | Returns `{ "data": user }`. |

### Tickets

All ticket endpoints require an authenticated user.

| Method | Endpoint | Roles | Behavior |
|---|---|---|---|
| `GET` | `/tickets` | All authenticated roles | List tickets; `{ "data": tickets }`. |
| `GET` | `/tickets/:id` | All authenticated roles | Read one ticket; `{ "data": ticket }`. |
| `POST` | `/tickets` | `ADMIN`, `DEVELOPER` | Create; `201` with `{ "data": ticket }`. |
| `PUT` | `/tickets/:id` | `ADMIN`, `DEVELOPER` | Update; `{ "data": ticket }`. Assignment ownership is not enforced for developers. |
| `DELETE` | `/tickets/:id` | `ADMIN` | Delete; `{ "message": "...", "data": ticket }`. |
| `PATCH` | `/tickets/:id/status` | `ADMIN`, `DEVELOPER` | Move to a valid status; `{ "data": ticket }`. |
| `POST` | `/tickets/analyze` | `ADMIN`, `DEVELOPER` | Analyze a description; `200` with `{ "data": analysis }`. |

### Users and health

| Method | Endpoint | Access | Behavior |
|---|---|---|---|
| `GET` | `/users` | `ADMIN` | List users; `{ "data": users }`. |
| `GET` | `/users/:id` | `ADMIN` | Read a user; `{ "data": user }`. |
| `PATCH` | `/users/:id/role` | `ADMIN` | Change another user's role to `ADMIN`, `DEVELOPER`, or `VIEWER`. |
| `GET` | `/health` | Public | Returns an API service status response. |

Missing/invalid authentication returns `401`; authenticated users without the required role receive `403`. Ticket create/update validation requires non-empty title and description; supported priorities are `LOW`, `MEDIUM`, `HIGH`, and `CRITICAL`, and statuses are `NEW`, `IN_PROGRESS`, `RESOLVED`, and `CLOSED`. Category is stored as a string; the ticket model does not constrain it to the AI category list.

## Authentication and security

- Authentication uses a signed JWT in an HttpOnly `access_token` cookie. The API also accepts bearer tokens.
- The cookie uses `SameSite=Strict`, is Secure when `NODE_ENV=production`, and expires after one hour.
- Self-registration creates viewers. Admin-only API middleware protects user-management endpoints; frontend route guards are additional UI navigation controls.
- The backend requires `JWT_SECRET` to be at least 32 bytes. Passwords are hashed with bcrypt; the password field is excluded from normal user queries and public JSON.
- CORS allows the configured `FRONTEND_ORIGIN`, or local development origins when it is unset, and enables credentials.
- The AI API key belongs in backend environment configuration only. Rate limiting, role-change audit logging, and a dedicated CSRF defense were not verified in the current source.

## AI integration

The dialog sends the current non-empty ticket description to `POST /api/tickets/analyze`; backend validation limits it to 10,000 characters. The backend calls Google Gemini model `gemini-3.5-flash-lite` using `API_KEY` and returns:

```json
{
  "data": {
    "priority": "HIGH",
    "category": "Backend",
    "aiSummary": "A one- or two-sentence summary.",
    "resolutionSuggestions": "1. Check the relevant service logs."
  }
}
```

Allowed AI priorities are `LOW`, `MEDIUM`, `HIGH`, and `CRITICAL`; allowed AI categories are `UI`, `Backend`, `Infrastructure`, `Database`, `Security`, and `Other`. Suggestions are returned as Markdown list text and displayed as selectable options. Applying a selected suggestion updates the description form field immediately, but does not save the ticket. Analysis also copies the supported category recommendation into the editable Category control. Users must review/edit the form and use the usual create/update action to persist changes.

The dialog shows a loading state during analysis and an error message on failure. Viewers cannot call the endpoint. If AI analysis fails, check that the backend can reach Gemini, `API_KEY` is configured privately, and the requesting account has an allowed role.

## Testing and troubleshooting

### Available package commands

Run commands from the indicated package directory.

| Directory | Command | Purpose |
|---|---|---|
| `frontend/` | `npm start` | Start Angular locally. |
| `frontend/` | `npm run build` | Build the Angular app for production. |
| `frontend/` | `npm test` | Run Angular tests (Angular CLI with Vitest). |
| `frontend/` | `npm run watch` | Build in development watch mode. |
| `backend/` | `npm run dev` | Start Express with nodemon. |
| `backend/` | `npm start` | Start Express with Node.js. |
| `backend/` | `npm test` | Placeholder only: prints “No tests yet”; there is no backend automated test suite configured. |

Common checks:

- **MongoDB connection/startup failure:** make sure MongoDB is running and `MONGODB_URI` is present in `backend/.env`.
- **JWT configuration failure:** configure a private `JWT_SECRET` at least 32 bytes long; restart the backend after changing `.env`.
- **Frontend cannot reach the API:** confirm the backend listens on port `3000` for the checked-in frontend development configuration, and that `FRONTEND_ORIGIN` permits the Angular dev origin.
- **`401` response:** sign in again and confirm the browser is sending the session cookie (the frontend HTTP interceptor enables credentials).
- **`403` response:** check the account role against the endpoint's role table; viewers are read-only and cannot use AI analysis.
- **AI error:** check backend Gemini configuration and provider/model availability. Do not place `API_KEY` in frontend files or share it in logs/issues.
- **Unknown API path:** confirm the path is under `/api`; the backend returns `404` for unmatched routes.

## Documentation index

- [Project requirements](PROJECT_REQUIREMENTS.md)
- [Documentation index](docs/README.md)
- [Architecture documentation index](docs/architecture/README.md)
- [Solution architecture](docs/architecture/solution-architecture.md)
- [Deployment architecture](docs/architecture/deployment-architecture.md)
- [System architecture diagram](docs/diagrams/system-architecture.md)
- [Ticket model](docs/models/ticket-model.md)
- [User model](docs/models/user-model.md)
- [AI analysis model](docs/models/ai-analysis-model.md)

## Deployment

The repository contains target deployment guidance, not evidence of a live deployment. The deployment document describes an Angular frontend host, a Node.js/Express API service, MongoDB, and an external AI provider. For the current implementation, configure Google Gemini credentials on the backend and route `/api` from the deployed frontend origin to the API as appropriate. See [Deployment architecture](docs/architecture/deployment-architecture.md); no live application URL is currently documented.
