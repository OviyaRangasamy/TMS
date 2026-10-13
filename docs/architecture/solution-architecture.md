# Solution Architecture

## Context
The AI Ticket Management System is a workflow-focused application modeled after Azure Boards. It allows teams to manage work items with a visual Kanban board while leveraging AI for summarization and prioritization.

## Architecture Style
- Client-server architecture
- Express REST APIs with JWT-backed authentication
- MongoDB persistence through Mongoose
- External AI integration through Google Gemini, called by the backend
- Modular frontend feature structure for scalable Angular development

## Components
### 1. Angular Frontend
Responsibilities:
- Render dashboard, ticket workspace, and ticket forms
- Manage Kanban board state
- Support drag-and-drop interactions
- Invoke backend APIs for CRUD and AI assistance

### 2. Express API Layer
Responsibilities:
- Accept REST requests from the frontend
- Validate payloads
- Route requests to service layers
- Return consistent response structures

### 3. Domain Services
Responsibilities:
- Ticket lifecycle management
- Ticket status updates
- AI description-analysis orchestration

### 4. MongoDB Data Layer
Responsibilities:
- Persist ticket and user records
- Store ticket status, priority, category, assignment, and timestamps

### 5. Google Gemini Integration
Responsibilities:
- Analyze the supplied ticket description
- Return a one- or two-sentence summary
- Recommend priority and category
- Return Markdown troubleshooting suggestions

## Integration Pattern
The frontend does not call Gemini directly. It sends the description to the authenticated `POST /api/tickets/analyze` endpoint. The Express backend validates the input, calls Gemini using the backend-only `API_KEY`, validates the structured result, and returns it to the frontend. The current response fields are `aiSummary`, `priority`, `category`, and `resolutionSuggestions`; the endpoint does not create a ticket or persist a separate analysis record.

## Non-Functional Requirements to Consider
- Secure API communication
- Role-aware access control for tickets and board actions
- Keep provider credentials on the backend
- Clear error handling for AI failures
- Response time monitoring for Kanban and AI interactions (future operational work)
