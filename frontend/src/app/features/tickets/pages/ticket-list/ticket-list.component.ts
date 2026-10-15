import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { finalize } from 'rxjs';
import { Ticket } from '../../../../models/ticket.model';
import { TicketService } from '../../../../services/ticket.service';

@Component({
  imports: [MatTableModule],
  selector: 'app-ticket-list',
  styleUrl: './ticket-list.component.scss',
  templateUrl: './ticket-list.component.html',
})
export class TicketListComponent implements OnInit {
  readonly displayedColumns = ['title', 'priority', 'status', 'category'];
  readonly tickets = signal<Ticket[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  private readonly destroyRef = inject(DestroyRef);
  private readonly ticketService = inject(TicketService);

  ngOnInit(): void {
    this.ticketService
      .getAllTickets()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (tickets) => this.tickets.set(tickets),
        error: (error: HttpErrorResponse) => {
          console.error('Failed to load tickets:', error);
          this.errorMessage.set(
            'Tickets could not be loaded. Check that the backend is running.',
          );
        },
      });
  }
}
