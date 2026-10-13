import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Ticket } from '../../../../models/ticket.model';

@Component({
  imports: [DatePipe, MatCardModule],
  selector: 'app-ticket-card',
  styleUrl: './ticket-card.component.scss',
  templateUrl: './ticket-card.component.html',
})
export class TicketCardComponent {
  readonly ticket = input.required<Ticket>();
  readonly pending = input(false);
  readonly selected = output<Ticket>();

  activate(event?: Event): void {
    event?.stopPropagation();
    this.selected.emit(this.ticket());
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      this.activate();
    }
  }
}
