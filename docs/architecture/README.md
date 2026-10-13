# Architecture Overview

For the complete documentation catalog, see the [documentation index](../README.md).

## Purpose
This document summarizes the architecture design. The implementation details below should be read alongside the current application source; the [solution architecture](solution-architecture.md) and [deployment architecture](deployment-architecture.md) describe the intended component boundaries and deployment approach.

## Solution Summary
- Frontend: Angular single-page application
- Backend: Node.js with Express
- Database: MongoDB
- AI provider: Google Gemini through the backend `@google/genai` service
- Core domain: ticket lifecycle, Kanban board, AI recommendations, and summaries

## Architectural Principles
- Maintain separation between UI, API, domain, and AI concerns
- Prefer stateless backend services for scalability
- Use MongoDB collections for flexible ticket and workflow data
- Keep AI integrations isolated behind service boundaries
- Extend the existing feature modules as requirements grow

## Layered View
1. Presentation Layer
   - Angular client
   - Dashboard, Kanban board, and ticket form
2. Application Layer
   - Express REST APIs
   - Request validation, orchestration, logic boundary
3. Domain Layer
   - Ticket and user operations
4. Data Layer
   - MongoDB ticket and user records managed through Mongoose
5. AI Layer
   - Google Gemini description analysis, orchestrated by the Express backend

## High-Level Scope
The solution supports ticket creation, updates, deletion, drag-and-drop Kanban movement, AI-based summary generation, AI priority recommendation, and AI-based categorization.

The current analysis endpoint returns `aiSummary`, `priority`, `category`, and `resolutionSuggestions` to the frontend. It does not persist a separate AI-analysis record.

Comments and analytics views are not part of the currently verified application implementation.
