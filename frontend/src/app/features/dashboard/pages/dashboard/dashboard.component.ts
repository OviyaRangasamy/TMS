import { Component, DestroyRef, inject, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { KanbanBoardComponent } from '../../components/kanban-board/kanban-board.component';
import { TicketDialogComponent } from '../../../../shared/components/ticket-dialog/ticket-dialog.component';
import { Ticket, TicketDialogResult } from '../../../../models/ticket.model';
import { AuthService } from '../../../../services/auth.service';
import { normalizeRole } from '../../../../models/role.utils';

@Component({
  imports: [
    KanbanBoardComponent,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  selector: 'app-dashboard',
  styleUrl: './dashboard.component.scss',
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  @ViewChild(KanbanBoardComponent)
  private kanbanBoard?: KanbanBoardComponent;

  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  readonly authService = inject(AuthService);

  readonly normalizeRole = normalizeRole;

  get canManageTickets(): boolean {
    const role = normalizeRole(this.authService.currentUser()?.role);
    return role === 'ADMIN' || role === 'DEVELOPER';
  }

  openCreateTicketDialog(): void {
    if (!this.canManageTickets) {
      return;
    }
    this.openTicketDialog();
  }

  openEditTicketDialog(ticket: Ticket): void {
    if (!this.canManageTickets) {
      return;
    }
    this.openTicketDialog(ticket);
  }

  private openTicketDialog(ticket?: Ticket): void {
    this.dialog
      .open<TicketDialogComponent, Ticket | null, TicketDialogResult>(
        TicketDialogComponent,
        {
          width: 'min(36rem, calc(100vw - 2rem))',
          maxWidth: 'calc(100vw - 2rem)',
          data: ticket ?? null,
          ariaLabel: ticket ? 'Edit ticket' : 'Create ticket',
        },
      )
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (!result) {
          return;
        }

        this.kanbanBoard?.reloadTickets();
        const message = {
          created: 'Ticket created successfully',
          updated: 'Ticket updated successfully',
          deleted: 'Ticket deleted successfully',
        }[result.action];
        this.snackBar.open(message, 'Dismiss', {
          duration: 3000,
        });
      });
  }
}
