# AI Ticket Management System

## Objective and scope

Build a ticket management application similar to Azure Boards. The system provides authenticated ticket tracking, role-specific ticket operations, an administrative user and metrics area, a Kanban workflow, and AI-assisted description analysis.

This document distinguishes the **verified implementation** from **planned requirements**. “Implemented” means supported by the inspected source code; “Partially implemented” identifies a known gap or mismatch; “Planned” identifies behavior that is not currently present.

## Technology stack

- **Frontend:** Angular, Angular Material, and Angular CDK.
- **Backend:** Node.js and Express.
- **Database:** MongoDB, accessed through Mongoose.
- **Authentication:** JSON Web Tokens (JWT), delivered to the browser as an HttpOnly cookie.
- **AI provider:** Google Gemini through the `@google/genai` SDK. The backend AI service currently specifies model `gemini-3.5-flash-lite`; the API key is read by the backend from `API_KEY`. Do not put actual credentials in this document.

The model identifier is currently specified in backend source code rather than read from a separate model configuration variable.

## User roles and permissions

The application defines three roles: `ADMIN`, `DEVELOPER`, and `VIEWER`. Backend ticket routes require authentication. Ticket reads are available to any authenticated role; mutations and AI analysis are additionally role-authorized by the API.

| Capability | ADMIN | DEVELOPER | VIEWER |
|---|---|---|---|
| View tickets and the shared ticket board | Implemented | Implemented | Implemented (read-only) |
| View the administrative metrics dashboard | Implemented | Not authorized | Not authorized |
| Create tickets | Implemented | Implemented | Not authorized |
| Edit tickets | Implemented | Implemented by the current API route | Not authorized |
| Delete tickets | Implemented | Not authorized | Not authorized |
| Move tickets between workflow statuses | Implemented | Implemented | Not authorized |
| Manage users and change user roles | Implemented | Not authorized | Not authorized |
| Use AI description analysis | Implemented | Implemented | Not authorized |

**Developer edit scope discrepancy:** a backend permission description says developers edit assigned tickets, but the actual `PUT /api/tickets/:id` role check allows any `DEVELOPER` and the update service does not check ticket assignment or ownership. The current implementation therefore does not enforce assigned-only editing. Enforcing and testing that restriction is a planned authorization correction.

**Authentication and protected routes (implemented):**

- The Angular dashboard and ticket-list routes require a valid session; the administrative area requires the `ADMIN` role.
- The API accepts a bearer token or the `access_token` cookie. The frontend sends credentials with API requests.
- Self-registration is available without an existing session and creates a `VIEWER` account. Login issues a JWT; the cookie is HttpOnly, uses `SameSite=Strict`, is marked Secure in production, and expires after one hour. `/api/auth/me` requires authentication; logout clears the cookie.
- Missing or invalid/expired authentication returns HTTP `401`. An authenticated user without the required role returns HTTP `403` with an explanatory message. Attempts by an administrator to change their own role return `403`.
- User-role changes accept only the three defined roles. The service prevents demoting the last administrator and returns `409` for that case.
- Frontend route guards and hidden/disabled controls improve navigation and usability; API authentication and authorization remain the enforcement boundary.

## Functional requirements

Feature status below reflects the inspected backend routes and Angular implementation.

| Feature | Status | Verified behavior |
|---|---|---|
| Create ticket | Implemented | Admins and developers can create a ticket with a non-empty title and description. The normal dialog sends title, description, priority, status, category, and assignee. |
| View tickets | Implemented | Any authenticated role can retrieve the ticket collection or an individual ticket. |
| Update ticket | Partially implemented | Admins and developers can update tickets. Developer edits are not restricted to assigned tickets, despite the permission description noted above. |
| Delete ticket | Implemented | Admin-only API authorization; the ticket dialog exposes its delete action to administrators and requires confirmation. |
| Ticket status workflow | Implemented | Tickets use `NEW`, `IN_PROGRESS`, `RESOLVED`, and `CLOSED`. Admins and developers can move a ticket through the status endpoint. |
| Kanban board | Implemented | The board groups tickets by status. Admins and developers can drag tickets between columns; failed status updates are reverted and reported. |
| Administrative dashboard | Implemented | Admin-only dashboard shows counts for users, tickets, and each role. |
| User management | Implemented | Administrators can list users, retrieve an individual user, and update another user's role. |
| Ticket assignment | Partially implemented | Tickets have an assignee field and the dialog accepts a MongoDB user ID. Assignment-specific edit authorization and a user-selection workflow are not verified. |
| AI summary | Implemented | The analysis endpoint returns a one- or two-sentence summary and the dialog displays it. |
| AI priority recommendation | Implemented | The endpoint returns an allowed priority and the dialog displays it; it is not automatically applied to the editable Priority control. |
| AI categorization | Partially implemented | A supported recommendation is displayed and automatically copied to the editable Category control; preserving an existing user-entered value is not implemented. |
| AI troubleshooting suggestion selection/application | Implemented | Suggestions are selectable, and an explicit action copies the selected item into the editable description without saving the ticket. |
| Developer-only editing of assigned tickets | Planned | The permission description suggests this scope, but the backend does not enforce ticket assignment when a developer edits. |
| Explicit acceptance before overwriting an existing category with AI | Planned | The current analysis flow writes the returned category into the form automatically. |

### Ticket API contract (implemented)

- `POST /api/tickets` creates a ticket and returns HTTP `201` with `{ "data": ticket }`.
- `GET /api/tickets` and `GET /api/tickets/:id` return HTTP `200` with `{ "data": tickets }` or `{ "data": ticket }`.
- `PUT /api/tickets/:id` updates a ticket and returns HTTP `200` with `{ "data": ticket }`.
- `DELETE /api/tickets/:id` returns HTTP `200` with `{ "message": "Ticket deleted successfully", "data": ticket }`.
- `PATCH /api/tickets/:id/status` changes the workflow status and returns HTTP `200` with `{ "data": ticket }`.

All these ticket routes require authentication. The role restrictions are defined in the role table and enforced by the corresponding backend routes.

Ticket priority values are `LOW`, `MEDIUM`, `HIGH`, and `CRITICAL`. Category is an editable string field in the ticket model and request payload; the backend schema does not restrict it to a fixed enumeration. The AI recommender's supported category values are `UI`, `Backend`, `Infrastructure`, `Database`, `Security`, and `Other`. The backend ticket request validator restricts priority/status values when supplied; priority and status may be omitted by direct API callers even though the Angular form requires both.

The backend validates non-empty title and description, supported priority/status values when supplied, and status changes. The Angular dialog limits title to 120 characters, description to 2,000 characters, and category to 80 characters. The AI endpoint separately accepts descriptions up to 10,000 characters.

## AI integration requirements

### Implemented analysis API

The authenticated endpoint `POST /api/tickets/analyze` is mounted at `/api/tickets/analyze`. Only `ADMIN` and `DEVELOPER` roles may call it. It accepts a JSON object with a non-empty `description` of at most 10,000 characters and returns a JSON `data` object containing:

- `aiSummary`: a non-empty summary of one or two sentences, at most 1,000 characters.
- `priority`: one of `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`.
- `category`: one of `UI`, `Backend`, `Infrastructure`, `Database`, `Security`, or `Other`.
- `resolutionSuggestions`: non-empty Markdown list text, at most 6,000 characters.

The successful endpoint response is HTTP `200` with the shape `{ "data": { "priority": "...", "category": "...", "aiSummary": "...", "resolutionSuggestions": "..." } }`. The backend validates the provider response against these fields and allowed values. The Gemini service treats the supplied description as untrusted data. Invalid description input returns HTTP `400`; failures such as provider/configuration problems and invalid model responses are converted to a generic HTTP `500` ticket error by the controller.

### Implemented Angular behavior and safeguards

- The ticket dialog exposes **Analyze with AI**, displays a loading status while the request runs, and presents an alert if analysis fails. A `403` is reported as an authorization-specific message; other analysis errors use a retry message.
- The summary, priority recommendation, category recommendation, and troubleshooting suggestions are shown for the user to review. The AI priority is displayed but is not currently copied into the editable Priority control.
- The Markdown troubleshooting list is presented as selectable options. Selecting and applying one with **Use Selected Suggestion** replaces the editable description in the form immediately. This action does not create or update a ticket; the user must still activate the normal **Create Ticket** or **Update Ticket** action.
- On successful analysis, a supported AI category is copied into the existing editable Category control and is included in the normal create/update request. The field remains editable.
- Editing the description clears the displayed analysis. AI analysis itself does not save a ticket.

### Recommendation and overwrite requirement

AI output is advisory; the user must review it before saving. AI must not automatically save a ticket or replace the user's description. The description recommendation meets this requirement because replacement requires explicit selection and application.

**Category overwrite gap:** the current dialog automatically writes the AI category into the Category form control after analysis, even if the user already entered a category. This can overwrite user input without confirmation. Preserving a manually entered category and requiring an explicit user action to accept an AI category when it would replace an existing value is a planned safeguard.

## Non-functional requirements

**Implemented baseline**

- The ticket dialog uses responsive widths and wrapping for suggestions and other long text; its content can scroll vertically. The AI controls and ticket operations expose loading/error feedback.
- A failed board status move is reported to the user and restores the prior status.
- Ticket and user data are persisted in MongoDB through Mongoose models.

**Planned requirements**

- Continue to keep the Angular UI usable on narrow screens and with long ticket text, without unnecessary horizontal scrolling or content hidden behind action buttons.
- Keep loading, empty, success, and error states understandable and accessible throughout the application; do not report an operation as successful when the API failed.
- Keep backend secrets server-side and out of source control, client bundles, logs, and documentation.

## Security requirements

**Implemented baseline**

- Ticket and user APIs enforce authentication and backend role authorization; frontend guards and hidden/disabled controls are not the API security boundary.
- The user password field is excluded from normal model queries and public JSON. Passwords are hashed with bcrypt using 12 salt rounds before storage.
- JWT configuration rejects a signing secret shorter than 32 bytes. The cookie is HttpOnly, SameSite=Strict, Secure in production, and has a one-hour lifetime.
- CORS accepts configured frontend origins (or the development localhost defaults) and enables credentials.
- Request validation covers required non-empty ticket title/description, supplied priority/status enums, status updates, user role values, and AI description input. The role checks and `401`/`403` behavior are documented above.
- Ticket descriptions are treated as untrusted input in the Gemini instruction. The provider key is read by the backend and is not part of the frontend service request.

**Planned / not verified**

- The existing ticket schema does not limit the category to a fixed set; only AI-recommended category values are enumerated. Enforce a category allowlist only if that is adopted as a product requirement.
- Rate limiting, audit logging for role changes, and a dedicated CSRF defense were not verified in the inspected implementation and remain security-hardening considerations.

## Error handling

- Return `400` for malformed or invalid ticket, user, status, or AI description input.
- Return `401` when authentication is missing or a token is invalid or expired; return `403` when the authenticated role is not authorized.
- Return `404` when a requested ticket or user does not exist, and `409` for duplicate-account or last-administrator conflicts where applicable.
- Ticket, user, and authentication controllers catch their handled internal failures, log them server-side, and return a generic HTTP `500` message. The final Express error middleware logs the stack but currently returns `err.message` when present; generic error text is therefore not guaranteed for errors that reach that middleware. Avoid exposing internal details in all error paths as a planned hardening requirement.
- Show users clear loading/error feedback in the Angular UI. AI analysis currently distinguishes forbidden access from other failures, while ticket save and delete failures display an error notification.

## Acceptance criteria

### Ticket CRUD and board

1. An authenticated `ADMIN` or `DEVELOPER` can create a ticket with a non-empty title and description; the API returns `201` and the created ticket.
2. Any authenticated role can retrieve the ticket list and a valid ticket; unauthenticated requests return `401`.
3. An authorized ticket edit persists the submitted editable fields and returns the updated ticket. A delete by `ADMIN` removes the ticket; delete attempts by other roles return `403`.
4. A valid status move by `ADMIN` or `DEVELOPER` persists one of the four supported statuses. A failed move is reported to the user and the board restores the previous status.
5. Ticket create/update requests from the dialog include the edited category. AI analysis and suggestion application alone do not issue a create, update, or delete request.

### RBAC

1. Verify each ticket route against the role table: all authenticated roles can read; only admins/developers can create, edit, move, and analyze; only admins can delete.
2. Verify every unauthenticated protected-route request returns `401` and every authenticated disallowed-role request returns `403`.
3. Verify only admins can read/manage users and view administrative metrics. Verify a viewer can access the general ticket board read-only, and cannot create, edit, move, delete, or analyze tickets.
4. Resolve the developer-assignment discrepancy: either enforce assigned-only editing in the API and test that another developer cannot edit an unassigned ticket, or update the documented permission definition to explicitly allow developers to edit any ticket. Do not treat assigned-only access as enforced until the API checks it.
5. Verify role changes reject unsupported roles, reject self-role changes with `403`, and prevent demotion of the last admin with `409`.

### AI analysis

1. For `ADMIN` and `DEVELOPER`, a non-empty description of at most 10,000 characters can be analyzed at `POST /api/tickets/analyze`; empty and over-limit input is rejected with `400`. `VIEWER` and unauthenticated callers cannot use the endpoint.
2. Successful analysis returns all four required fields with the documented lengths and supported priority/category values, plus a non-empty troubleshooting list.
3. The UI indicates loading, displays the analysis, and reports analysis failures without claiming success.
4. Applying a selected troubleshooting suggestion changes the editable description immediately, but no ticket is persisted until the user submits the normal create/update form. Without applying a suggestion, the original description remains unchanged.
5. The category remains editable and is sent in the normal ticket request. Before release, prevent AI analysis from silently replacing a user-entered category: preserve the existing value or require explicit acceptance before overwriting it.
6. The AI priority is clearly presented as a recommendation. Applying it to the ticket priority, if supported in a future change, requires explicit user review and must not automatically save the ticket.

## Future enhancements

- Enforce developer edit access only for tickets assigned to that developer, in the API as well as the UI.
- Add explicit acceptance of AI category recommendations when they would replace an existing category.
- Consider making the Gemini model configurable outside source code and adding provider/model health and failure monitoring.
- Consider rate limiting AI requests, auditable user/role changes, and additional CSRF defenses for cookie-authenticated API operations.