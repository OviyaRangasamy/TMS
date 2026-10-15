# Ticket Management frontend

This is the Angular 22 frontend for the Ticket Management System. It uses
standalone components, strict TypeScript checks, Angular routing, SCSS, and
Angular Material.

## Development

Install dependencies and start the Angular development server:

```bash
npm install
npm start
```

The app is available at `http://localhost:4200`. The development environment
requests tickets from `http://localhost:3000/api`, matching the backend's
local port in this workspace. Start the backend and MongoDB before loading the
ticket list. If the backend uses another port, update
`src/app/environments/environment.development.ts`.

## Build

```bash
npm run build
```

Production builds use the same-origin `/api` base URL configured in
`src/app/environments/environment.ts`; configure the deployment reverse proxy
to route `/api` to the backend.

## Current scope

The dashboard is the default page and includes a four-column Kanban board.
Moving a ticket between columns updates the UI optimistically and persists its
status through the backend ticket API. A separate ticket list remains available
at `/tickets`. Authentication and AI features are intentionally not
implemented yet.
