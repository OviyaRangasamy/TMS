import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Ticket, TicketInput, TicketStatus } from '../models/ticket.model';

interface ApiResponse<T> {
  data: T;
}

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly ticketsUrl = `${environment.apiBaseUrl}/tickets`;

  getAllTickets(): Observable<Ticket[]> {
    return this.http
      .get<ApiResponse<Ticket[]>>(this.ticketsUrl)
      .pipe(map(({ data }) => data));
  }

  getTicketById(id: string): Observable<Ticket> {
    return this.http
      .get<ApiResponse<Ticket>>(`${this.ticketsUrl}/${encodeURIComponent(id)}`)
      .pipe(map(({ data }) => data));
  }

  createTicket(ticket: TicketInput): Observable<Ticket> {
    return this.http
      .post<ApiResponse<Ticket>>(this.ticketsUrl, ticket)
      .pipe(map(({ data }) => data));
  }

  updateTicket(id: string, ticket: TicketInput): Observable<Ticket> {
    return this.http
      .put<ApiResponse<Ticket>>(
        `${this.ticketsUrl}/${encodeURIComponent(id)}`,
        ticket,
      )
      .pipe(map(({ data }) => data));
  }

  deleteTicket(id: string): Observable<Ticket> {
    return this.http
      .delete<ApiResponse<Ticket>>(
        `${this.ticketsUrl}/${encodeURIComponent(id)}`,
      )
      .pipe(map(({ data }) => data));
  }

  updateStatus(id: string, status: TicketStatus): Observable<Ticket> {
    return this.http
      .patch<ApiResponse<Ticket>>(
        `${this.ticketsUrl}/${encodeURIComponent(id)}/status`,
        { status },
      )
      .pipe(map(({ data }) => data));
  }
}
