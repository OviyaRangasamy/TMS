export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TicketStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface Ticket {
  _id: string;
  title: string;
  description: string;
  priority?: TicketPriority;
  status?: TicketStatus;
  category?: string;
  assignee?: string | null;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TicketInput {
  title: string;
  description: string;
  priority?: TicketPriority;
  status?: TicketStatus;
  category?: string;
  assignee?: string | null;
}

export type TicketDialogResult =
  | { action: 'created'; ticket: Ticket }
  | { action: 'updated'; ticket: Ticket }
  | { action: 'deleted'; ticketId: string };
