import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { finalize } from 'rxjs';
import { User, UserRole } from '../../../../models/user.model';
import { UserService } from '../../../../services/user.service';

@Component({
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule,
  ],
  selector: 'app-user-list',
  styleUrl: './user-list.component.scss',
  templateUrl: './user-list.component.html',
})
export class UserListComponent implements OnInit {
  readonly displayedColumns = ['name', 'email', 'role'];
  readonly roles: readonly UserRole[] = ['ADMIN', 'DEVELOPER', 'VIEWER'];
  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly updatingUserIds = signal<ReadonlySet<string>>(new Set());

  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar = inject(MatSnackBar);
  private readonly userService = inject(UserService);

  ngOnInit(): void {
    this.userService
      .getAllUsers()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (users) => this.users.set(users),
        error: (error: HttpErrorResponse) => {
          console.error('Failed to load users:', error);
          this.errorMessage.set(
            'Users could not be loaded. Check that the backend is running.',
          );
        },
      });
  }

  updateRole(user: User, role: UserRole): void {
    if (user.role === role || this.updatingUserIds().has(user.id)) {
      return;
    }

    this.setUserUpdating(user.id, true);
    this.userService
      .updateRole(user.id, role)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.setUserUpdating(user.id, false)),
      )
      .subscribe({
        next: (updatedUser) => {
          this.users.update((users) =>
            users.map((currentUser) =>
              currentUser.id === updatedUser.id ? updatedUser : currentUser,
            ),
          );
          this.snackBar.open(
            `${updatedUser.name}'s role was updated to ${updatedUser.role}.`,
            'Dismiss',
            { duration: 3000 },
          );
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to update user role:', error);
          this.users.update((users) => [...users]);
          this.snackBar.open(
            error.error?.message ?? 'The user role could not be updated.',
            'Dismiss',
            { duration: 5000 },
          );
        },
      });
  }

  private setUserUpdating(userId: string, updating: boolean): void {
    this.updatingUserIds.update((current) => {
      const next = new Set(current);
      if (updating) {
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return next;
    });
  }
}
