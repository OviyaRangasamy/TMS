import { Component, input, output } from '@angular/core';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import { Ticket, TicketStatus } from '../../../../models/ticket.model';
import { TicketCardComponent } from '../ticket-card/ticket-card.component';

@Component({
  imports: [CdkDrag, CdkDropList, TicketCardComponent],
  selector: 'app-kanban-column',
  styleUrl: './kanban-column.component.scss',
  templateUrl: './kanban-column.component.html',
})
export class KanbanColumnComponent {
  readonly canEdit = input(false);
  readonly canMove = input(false);
  readonly status = input.required<TicketStatus>();
  readonly title = input.required<string>();
  readonly tickets = input.required<Ticket[]>();
  readonly pendingTicketIds = input<ReadonlySet<string>>(new Set<string>());
  readonly ticketDropped = output<CdkDragDrop<Ticket[], Ticket[], Ticket>>();
  readonly ticketSelected = output<Ticket>();
}
