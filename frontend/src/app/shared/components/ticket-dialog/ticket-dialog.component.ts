import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import {
  Ticket,
  TicketDialogResult,
  TicketInput,
  TicketPriority,
  TicketStatus,
} from '../../../models/ticket.model';
import {
  TicketDescriptionAnalysis,
  TicketService,
} from '../../../services/ticket.service';
import { AuthService } from '../../../services/auth.service';
import { normalizeRole } from '../../../models/role.utils';

@Component({
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    ReactiveFormsModule,
  ],
  selector: 'app-ticket-dialog',
  styleUrl: './ticket-dialog.component.scss',
  templateUrl: './ticket-dialog.component.html',
})
export class TicketDialogComponent {
  private readonly data = inject<Ticket | null>(MAT_DIALOG_DATA);

  readonly priorities: readonly TicketPriority[] = [
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL',
  ];
  readonly statuses: readonly TicketStatus[] = [
    'NEW',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED',
  ];
  readonly saving = signal(false);
  readonly confirmingDelete = signal(false);
  readonly analyzing = signal(false);
  readonly analysis = signal<TicketDescriptionAnalysis | null>(null);
  readonly analysisError = signal<string | null>(null);

  readonly form = inject(FormBuilder).nonNullable.group({
    title: [this.data?.title ?? '', [Validators.required, Validators.pattern(/\S/)]],
    description: [
      this.data?.description ?? '',
      [Validators.required, Validators.pattern(/\S/)],
    ],
    priority: [this.data?.priority ?? 'MEDIUM' as TicketPriority, Validators.required],
    category: [this.data?.category ?? ''],
    assignee: [
      this.data?.assignee ?? '',
      Validators.pattern(/^[a-f\d]{24}$/i),
    ],
    status: [this.data?.status ?? 'NEW' as TicketStatus, Validators.required],
  });

  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogRef = inject(
    MatDialogRef<TicketDialogComponent, TicketDialogResult>,
  );
  private readonly snackBar = inject(MatSnackBar);
  private readonly ticketService = inject(TicketService);
  private readonly authService = inject(AuthService);

  get isEditMode(): boolean {
    return this.data !== null;
  }

  get dataTitle(): string {
    return this.data?.title ?? 'this ticket';
  }

  get canDelete(): boolean {
    return normalizeRole(this.authService.currentUser()?.role) === 'ADMIN';
  }

  clearAnalysis(): void {
    this.analysis.set(null);
    this.analysisError.set(null);
  }

  analyzeDescription(): void {
    const description = this.form.controls.description.value.trim();
    if (!description || this.analyzing()) {
      return;
    }

    this.analyzing.set(true);
    this.analysis.set(null);
    this.analysisError.set(null);
    this.ticketService
      .analyzeTicketDescription(description)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.analyzing.set(false)),
      )
      .subscribe({
        next: (analysis) => {
          if (this.form.controls.description.value.trim() === description) {
            this.analysis.set(analysis);
          }
        },
        error: (error: HttpErrorResponse) => {
          if (this.form.controls.description.value.trim() === description) {
            this.analysisError.set(
              error.status === 403
                ? 'Your role is not authorized to use AI ticket analysis. Contact an administrator if you need access.'
                : 'AI analysis could not be completed. Please try again.',
            );
          }
        },
      });
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.getRawValue();
    const ticket: TicketInput = {
      title: values.title.trim(),
      description: values.description.trim(),
      priority: values.priority,
      status: values.status,
      category: values.category.trim(),
      assignee: values.assignee.trim() || null,
    };

    this.saving.set(true);
    const saveRequest = this.data
      ? this.ticketService.updateTicket(this.data._id, ticket)
      : this.ticketService.createTicket(ticket);

    saveRequest
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (savedTicket) =>
          this.dialogRef.close({
            action: this.isEditMode ? 'updated' : 'created',
            ticket: savedTicket,
          }),
        error: (error: HttpErrorResponse) => {
          console.error(
            `Failed to ${this.isEditMode ? 'update' : 'create'} ticket:`,
            error,
          );
          this.snackBar.open(
            `Ticket could not be ${this.isEditMode ? 'updated' : 'created'}. Please try again.`,
            'Dismiss',
            { duration: 5000 },
          );
        },
      });
  }

  requestDeleteConfirmation(): void {
    this.confirmingDelete.set(true);
  }

  cancelDelete(): void {
    this.confirmingDelete.set(false);
  }

  confirmDelete(): void {
    if (!this.data || this.saving()) {
      return;
    }

    const ticketId = this.data._id;
    this.saving.set(true);
    this.ticketService
      .deleteTicket(ticketId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () =>
          this.dialogRef.close({
            action: 'deleted',
            ticketId,
          }),
        error: (error: HttpErrorResponse) => {
          console.error('Failed to delete ticket:', error);
          this.snackBar.open(
            'Ticket could not be deleted. Please try again.',
            'Dismiss',
            { duration: 5000 },
          );
        },
      });
  }
}
