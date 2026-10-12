# System Architecture Diagram

```mermaid
flowchart LR
    U[Angular User Interface] -->|REST API| B[Express API Layer]
    B -->|CRUD Operations| D[(MongoDB)]
    B -->|AI Requests| A[OpenAI API]
    U -->|Drag and Drop Events| B
    B -->|Ticket Data + AI Results| U
```

## Diagram Notes
- The frontend remains independent from the AI provider
- The backend orchestrates API communication and domain logic boundaries
- MongoDB persists ticket and workflow state
- OpenAI provides summary and recommendation capabilities
