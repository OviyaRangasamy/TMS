import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { UserRole } from '../../../models/user.model';

export interface RoleEditDialogData {
  userName: string;
  currentRole: UserRole;
}

@Component({
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  selector: 'app-role-edit-dialog',
  template: `
    <h2 mat-dialog-title>Change user role</h2>
    <mat-dialog-content>
      <p>Select a role for {{ data.userName }}.</p>
      <mat-form-field appearance="outline">
        <mat-label>Role</mat-label>
        <mat-select
          [value]="selectedRole()"
          (selectionChange)="selectedRole.set($event.value)"
        >
          @for (role of roles; track role) {
            <mat-option [value]="role">{{ role }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Cancel</button>
      <button
        mat-flat-button
        color="primary"
        type="button"
        [disabled]="selectedRole() === data.currentRole"
        (click)="dialogRef.close(selectedRole())"
      >
        Save role
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    mat-form-field {
      margin-top: 0.5rem;
      width: 100%;
    }
  `,
})
export class RoleEditDialogComponent {
  readonly data = inject<RoleEditDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(
    MatDialogRef<RoleEditDialogComponent, UserRole | undefined>,
  );
  readonly roles: readonly UserRole[] = ['ADMIN', 'DEVELOPER', 'VIEWER'];
  readonly selectedRole = signal(this.data.currentRole);
}
