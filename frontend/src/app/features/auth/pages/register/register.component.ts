import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { UserRole } from '../../../../models/user.model';
import { AuthService } from '../../../../services/auth.service';

@Component({
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  selector: 'app-register',
  styleUrl: './register.component.scss',
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly roles: readonly UserRole[] = ['ADMIN', 'DEVELOPER', 'VIEWER'];
  readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.pattern(/\S/)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(12)]],
    role: ['VIEWER' as UserRole, Validators.required],
  });

  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, email, password, role } = this.form.getRawValue();
    this.errorMessage.set(null);
    this.submitting.set(true);
    this.authService
      .register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.submitting.set(false)),
      )
      .subscribe({
        next: () => void this.router.navigateByUrl('/dashboard'),
        error: (error: HttpErrorResponse) => {
          console.error('Registration failed:', error);
          this.errorMessage.set(
            error.error?.message ?? 'Unable to create the account. Please try again.',
          );
        },
      });
  }
}
