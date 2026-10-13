import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import {
  UserInformationDialogComponent,
  UserInformationDialogView,
} from './shared/components/user-information-dialog/user-information-dialog.component';

@Component({
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatMenuModule,
    MatSnackBarModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App implements OnInit {
  readonly authService = inject(AuthService);

  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.authService
      .restoreSession()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  openUserInformation(view: UserInformationDialogView): void {
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
