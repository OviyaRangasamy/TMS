# TMS Documentation

Documentation index for the AI Ticket Management System. Links point to the existing project documents; this index does not duplicate their contents.

## Architecture

- [Solution architecture](architecture/solution-architecture.md) — application layers and their responsibilities.
- [Deployment architecture](architecture/deployment-architecture.md) — target deployment topology and operational considerations.

## Diagrams

- [System architecture](diagrams/system-architecture.md) — frontend, API, MongoDB, and Gemini integration flow.

## Data models

- [Ticket model](models/ticket-model.md) — implemented ticket fields and workflow values.
- [User model](models/user-model.md) — implemented user fields and role values.
- [AI analysis model](models/ai-analysis-model.md) — analysis request/response contract and persistence behavior.

## Deployment

- [Deployment architecture guide](architecture/deployment-architecture.md) — target deployment model; it does not indicate that the project is deployed.

## Requirements and getting started

- [Project requirements](../PROJECT_REQUIREMENTS.md) — verified behavior, role permissions, gaps, and acceptance criteria.
- [Root README](../README.md) — setup instructions, API overview, and troubleshooting.

The current implementation uses Google Gemini through the backend. If any older design text elsewhere conflicts with the running source, treat the backend and frontend implementation as authoritative.
