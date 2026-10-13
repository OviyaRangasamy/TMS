# Deployment Architecture

## Target Deployment Model
This document describes a target deployment model; it does not assert that the application has been deployed. The system can be deployed as a modular application environment using a web application deployment pattern:

- Frontend: Angular application served from a web host or static hosting layer
- Backend: Node.js/Express application deployed as an API service
- Database: MongoDB deployed as a managed or self-hosted instance
- AI: Google Gemini external cloud service, called by the backend

## Recommended Deployment Topology
### Presentation Tier
- Angular SPA served through a CDN or application hosting platform
- Assets and UI configuration separated from API logic

### Application Tier
- Express server running in a Node.js runtime
- Environment-based configuration for `PORT`, `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_ORIGIN`, and `API_KEY`
- The API server exposes a public `GET /health` endpoint

### Data Tier
- MongoDB cluster or single-instance deployment
- Assess and add indexes based on measured ticket lookup, status filtering, and assignee-query needs; these indexes were not verified in the current schema

### AI Tier
- Google Gemini API called by the backend AI analysis service
- Keep `API_KEY` private in the backend deployment environment; do not expose it to the browser
- Rate limiting and fallback handling are recommended future operational controls, not verified current features

## Environments
- Development
- Staging
- Production

## Operational Considerations
- Use the existing API health endpoint and separately monitor database connectivity
- Centralized logging and monitoring
- Error capture for AI service failures
- Backups for MongoDB ticket records
- Deployment pipelines for frontend and backend releases

The checked-in production frontend environment uses the relative API base path `/api`; production hosting must route that path to the Express service. The development frontend uses `http://localhost:3000/api`. Configure CORS with the deployed frontend origin through `FRONTEND_ORIGIN`.
