import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { normalizeRole } from '../../../models/role.utils';
import {
  UserInformationDialogComponent,
  UserInformationDialogView,
} from '../../../shared/components/user-information-dialog/user-information-dialog.component';

@Component({
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  selector: 'app-admin-layout',
  styleUrl: './admin-layout.component.scss',
  template: `
    <div class="admin-layout">
      <aside class="admin-sidebar" aria-label="Admin navigation">
        <p class="sidebar-title">Admin Portal</p>
        <nav>
          <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            Dashboard
          </a>
          <a routerLink="/admin/tickets" routerLinkActive="active">Tickets</a>
          @if (normalizeRole(authService.currentUser()?.role) === 'ADMIN') {
            <a routerLink="/admin/users" routerLinkActive="active">Users</a>
          }
          <button mat-button type="button" (click)="openProfile('profile')">
            Profile
          </button>
          <button mat-button type="button" (click)="logout()">Logout</button>
        </nav>
      </aside>

      <section class="admin-content">
        <router-outlet />
      </section>
    </div>
  `,
})
export class AdminLayoutComponent {
  readonly authService = inject(AuthService);
  readonly normalizeRole = normalizeRole;

  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  openProfile(view: UserInformationDialogView): void {
    const user = this.authService.currentUser();
    if (!user) {
      return;
    }
    this.dialog.open(UserInformationDialogComponent, {
      data: { user, view },
      width: 'min(36rem, calc(100vw - 2rem))',
      maxWidth: 'calc(100vw - 2rem)',
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => void this.router.navigateByUrl('/login'),
      error: (error: HttpErrorResponse) => {
        console.error('Logout request failed:', error);
        this.snackBar.open(
          'You were signed out locally, but the server could not confirm logout.',
          'Dismiss',
          { duration: 5000 },
        );
        void this.router.navigateByUrl('/login');
      },
    });
  }
}
