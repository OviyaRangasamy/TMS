# AI Analysis Response Model

## Purpose
Documents the response returned by the Google Gemini description-analysis endpoint. The current implementation does **not** store a separate AI-analysis model or collection; the analysis is returned to the Angular dialog for review.

## Request

- Endpoint: `POST /api/tickets/analyze`
- Body: `{ "description": string }`
- Authentication: required; allowed roles are `ADMIN` and `DEVELOPER`.
- Validation: description must be a non-empty string and no longer than 10,000 characters.

## Response

Successful responses use HTTP `200` and the following shape:

```json
{
  "data": {
    "priority": "HIGH",
    "category": "Backend",
    "aiSummary": "A concise one- or two-sentence summary.",
    "resolutionSuggestions": "1. Check the relevant service logs."
  }
}
```

| Field | Type | Constraints |
|---|---|---|
| `priority` | string | `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL` |
| `category` | string | `UI`, `Backend`, `Infrastructure`, `Database`, `Security`, or `Other` |
| `aiSummary` | string | Non-empty, at most 1,000 characters, one or two sentences |
| `resolutionSuggestions` | string | Non-empty Markdown list, at most 6,000 characters |

The backend validates the provider response and returns these four fields only. The actual model identifier is `gemini-3.5-flash-lite`, configured in the backend AI service; the Gemini API key is read from the backend `API_KEY` environment variable.

## Frontend behavior

- The dialog displays summary, priority, category, and selectable troubleshooting suggestions.
- Applying a selected troubleshooting suggestion replaces the editable description in the form; it does not save a ticket.
- On successful analysis, the supported category recommendation is copied to the existing editable Category control and included in the normal create/update request.
- The priority recommendation is displayed but is not automatically applied to the ticket Priority control.
- AI results are recommendations for the user to review. The current category behavior can replace an existing category value; preserving prior user input or requiring explicit category acceptance remains a planned improvement.

## Persistence and future considerations

- AI analysis output is not saved as a separate entity by the current implementation.
- The ticket itself stores the user-submitted description, priority, category, status, assignee, creator, and timestamps.
- Persisting analysis history, confidence scores, provider metadata, or raw provider responses would require a future design and implementation; these are not current response fields.
