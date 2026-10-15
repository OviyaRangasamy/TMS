import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize, forkJoin } from 'rxjs';
import { User } from '../../../../models/user.model';
import { normalizeRole } from '../../../../models/role.utils';
import { TicketService } from '../../../../services/ticket.service';
import { UserService } from '../../../../services/user.service';

interface AdminMetrics {
  totalUsers: number;
  totalTickets: number;
  totalAdmins: number;
  totalDevelopers: number;
  totalViewers: number;
}

@Component({
  imports: [MatCardModule, MatSnackBarModule],
  selector: 'app-admin-dashboard',
  styleUrl: './admin-dashboard.component.scss',
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
  readonly metrics = signal<AdminMetrics | null>(null);
  readonly loading = signal(true);

  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar = inject(MatSnackBar);
  private readonly ticketService = inject(TicketService);
  private readonly userService = inject(UserService);

  ngOnInit(): void {
    forkJoin({
      users: this.userService.getAllUsers(),
      tickets: this.ticketService.getAllTickets(),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: ({ users, tickets }) => this.metrics.set(this.getMetrics(users, tickets.length)),
        error: (error: HttpErrorResponse) => {
          console.error('Failed to load admin dashboard metrics:', error);
          this.snackBar.open(
            error.error?.message ?? 'Dashboard metrics could not be loaded.',
            'Dismiss',
            { duration: 5000 },
          );
        },
      });
  }

  private getMetrics(users: User[], totalTickets: number): AdminMetrics {
    return {
      totalUsers: users.length,
      totalTickets,
      totalAdmins: users.filter((user) => normalizeRole(user.role) === 'ADMIN').length,
      totalDevelopers: users.filter((user) => normalizeRole(user.role) === 'DEVELOPER').length,
      totalViewers: users.filter((user) => normalizeRole(user.role) === 'VIEWER').length,
    };
  }
}
