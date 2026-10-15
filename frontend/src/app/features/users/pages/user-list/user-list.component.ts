import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { User, UserRole } from '../../../../models/user.model';
import { normalizeRole } from '../../../../models/role.utils';
import { AuthService } from '../../../../services/auth.service';
import { UserService } from '../../../../services/user.service';
import {
  RoleEditDialogComponent,
  RoleEditDialogData,
} from '../../../../shared/components/role-edit-dialog/role-edit-dialog.component';

@Component({
  imports: [
    DatePipe,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTableModule,
  ],
  selector: 'app-user-list',
  styleUrl: './user-list.component.scss',
  templateUrl: './user-list.component.html',
})
export class UserListComponent implements OnInit {
  readonly displayedColumns = ['name', 'email', 'role', 'created', 'actions'];
  readonly normalizeRole = normalizeRole;
  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly updatingUserIds = signal<ReadonlySet<string>>(new Set());

  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  readonly authService = inject(AuthService);
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
          this.snackBar.open(
            error.error?.message ?? 'Users could not be loaded.',
            'Dismiss',
            { duration: 5000 },
          );
          this.errorMessage.set(
            'Users could not be loaded. Check that the backend is running.',
          );
        },
      });
  }

  updateRole(user: User, role: UserRole): void {
    if (
      normalizeRole(user.role) === normalizeRole(role)
      || this.updatingUserIds().has(user.id)
    ) {
      return;
    }

    this.saveRole(user, role);
  }

  openRoleEditor(user: User): void {
    if (
      user.id === this.authService.currentUser()?.id
      || this.updatingUserIds().has(user.id)
    ) {
      return;
    }

    this.dialog
      .open<RoleEditDialogComponent, RoleEditDialogData, UserRole | undefined>(
        RoleEditDialogComponent,
        {
          data: { userName: user.name, currentRole: user.role },
          width: 'min(28rem, calc(100vw - 2rem))',
          maxWidth: 'calc(100vw - 2rem)',
          ariaLabel: 'Edit user role',
        },
      )
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((role) => {
        if (role) {
          this.updateRole(user, role);
        }
      });
  }

  private saveRole(user: User, role: UserRole): void {
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
          this.authService
            .refreshCurrentUser(true)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (currentUser) => {
                if (normalizeRole(currentUser?.role) !== 'ADMIN') {
                  void this.router.navigateByUrl(
                    currentUser ? '/dashboard' : '/login',
                  );
                  return;
                }
                this.snackBar.open(
                  `${updatedUser.name}'s role was updated to ${updatedUser.role}.`,
                  'Dismiss',
                  { duration: 3000 },
                );
              },
              error: (error: unknown) => {
                console.error('Failed to refresh the current user after a role change:', error);
                this.snackBar.open(
                  'The role was updated, but your session could not be refreshed.',
                  'Dismiss',
                  { duration: 5000 },
                );
              },
            });
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to update user role:', error);
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
