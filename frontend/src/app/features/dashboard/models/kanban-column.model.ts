import { TicketStatus } from '../../../models/ticket.model';

export interface KanbanColumn {
  status: TicketStatus;
  title: string;
}

export const KANBAN_COLUMNS: readonly KanbanColumn[] = [
  { status: 'NEW', title: 'New' },
  { status: 'IN_PROGRESS', title: 'In Progress' },
  { status: 'RESOLVED', title: 'Resolved' },
  { status: 'CLOSED', title: 'Closed' },
];
