import { HttpErrorResponse } from '@angular/common/http';
import { CdkDragDrop, CdkDropListGroup } from '@angular/cdk/drag-drop';
import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { Ticket, TicketStatus } from '../../../../models/ticket.model';
import { TicketService } from '../../../../services/ticket.service';
import { KANBAN_COLUMNS } from '../../models/kanban-column.model';
import { KanbanColumnComponent } from '../kanban-column/kanban-column.component';

@Component({
  imports: [
    CdkDropListGroup,
    KanbanColumnComponent,
    MatButtonModule,
    MatSnackBarModule,
  ],
  selector: 'app-kanban-board',
  styleUrl: './kanban-board.component.scss',
  templateUrl: './kanban-board.component.html',
})
export class KanbanBoardComponent implements OnInit {
  readonly ticketSelected = output<Ticket>();
  readonly columns = KANBAN_COLUMNS;
  readonly tickets = signal<Ticket[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly pendingTicketIds = signal<ReadonlySet<string>>(new Set<string>());

  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar = inject(MatSnackBar);
  private readonly ticketService = inject(TicketService);

  ngOnInit(): void {
    this.loadTickets();
  }

  ticketsFor(status: TicketStatus): Ticket[] {
    return this.tickets().filter((ticket) => (ticket.status ?? 'NEW') === status);
  }

  onTicketDropped(event: CdkDragDrop<Ticket[], Ticket[], Ticket>): void {
    if (event.previousContainer === event.container) {
      return;
    }

    const ticket = event.item.data;
    const nextStatus = this.statusFromColumnId(event.container.id);
    const previousStatus = ticket.status ?? 'NEW';

    if (
      !nextStatus
      || nextStatus === previousStatus
      || this.pendingTicketIds().has(ticket._id)
    ) {
      return;
    }

    this.tickets.update((tickets) =>
      tickets.map((current) =>
        current._id === ticket._id ? { ...current, status: nextStatus } : current,
      ),
    );
    this.setPending(ticket._id, true);

    this.ticketService
      .updateStatus(ticket._id, nextStatus)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.setPending(ticket._id, false)),
      )
      .subscribe({
        next: (savedTicket) => {
          this.tickets.update((tickets) =>
            tickets.map((current) =>
              current._id === savedTicket._id ? savedTicket : current,
            ),
          );
          this.snackBar.open('Ticket status updated', 'Dismiss', {
            duration: 3000,
          });
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to update ticket status:', error);
          this.tickets.update((tickets) =>
            tickets.map((current) =>
              current._id === ticket._id
                ? { ...current, status: previousStatus }
                : current,
            ),
          );
          this.snackBar.open(
            'Could not update ticket status. The change was reverted.',
            'Dismiss',
            { duration: 5000 },
          );
        },
      });
  }

  reloadTickets(): void {
    this.loadTickets();
  }

  private loadTickets(): void {
    this.loading.set(true);
    this.loadError.set(false);

    this.ticketService
      .getAllTickets()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (tickets) => this.tickets.set(tickets),
        error: (error: HttpErrorResponse) => {
          console.error('Failed to load tickets for dashboard:', error);
          this.loadError.set(true);
        },
      });
  }

  private setPending(ticketId: string, pending: boolean): void {
    this.pendingTicketIds.update((current) => {
      const updated = new Set(current);
      if (pending) {
        updated.add(ticketId);
      } else {
        updated.delete(ticketId);
      }
      return updated;
    });
  }

  private statusFromColumnId(columnId: string): TicketStatus | null {
    return this.columns.find((column) => column.status === columnId)?.status ?? null;
  }
}
