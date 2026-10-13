import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { User } from '../../../models/user.model';
import { ROLE_PERMISSIONS } from '../../../models/role-permissions';

export type UserInformationDialogView = 'profile' | 'roles';

interface UserInformationDialogData {
  user: User;
  view: UserInformationDialogView;
}

@Component({
  imports: [MatButtonModule, MatCardModule, MatDialogModule],
  selector: 'app-user-information-dialog',
  template: `
    <h2 mat-dialog-title>
      {{ data.view === 'profile' ? 'User Profile' : 'Role Information' }}
    </h2>

    <mat-dialog-content>
      @if (data.view === 'profile') {
        <mat-card>
          <mat-card-content>
            <dl class="profile-details">
              <dt>Name</dt>
              <dd>{{ data.user.name }}</dd>
              <dt>Email</dt>
              <dd>{{ data.user.email }}</dd>
              <dt>Role</dt>
              <dd>
                <span
                  class="role-badge"
                  [class.role-admin]="data.user.role === 'ADMIN'"
                  [class.role-developer]="data.user.role === 'DEVELOPER'"
                  [class.role-viewer]="data.user.role === 'VIEWER'"
                >
                  {{ data.user.role }}
                </span>
              </dd>
            </dl>
          </mat-card-content>
        </mat-card>
      } @else {
        <mat-card>
          <mat-card-header>
            <mat-card-title>Permissions by role</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @for (role of roles; track role) {
              <section class="role-permissions">
                <h3>{{ role }}</h3>
                <ul>
                  @for (permission of rolePermissions[role]; track permission) {
                    <li>{{ permission }}</li>
                  }
                </ul>
              </section>
            }
          </mat-card-content>
        </mat-card>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: `
    .profile-details {
      display: grid;
      gap: 0.5rem 1rem;
      grid-template-columns: auto 1fr;
      margin: 0;
    }

    dt {
      color: #64748b;
      font-weight: 600;
    }

    dd {
      margin: 0;
    }

    .role-badge {
      border-radius: 999px;
      display: inline-flex;
      font-size: 0.75rem;
      font-weight: 700;
      line-height: 1.25;
      padding: 0.2rem 0.55rem;
    }

    .role-admin {
      background: #fee2e2;
      color: #b91c1c;
    }

    .role-developer {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .role-viewer {
      background: #e5e7eb;
      color: #4b5563;
    }

    .role-permissions + .role-permissions {
      border-top: 1px solid #e5e7eb;
      margin-top: 1rem;
      padding-top: 0.75rem;
    }

    h3 {
      color: #172554;
      font-size: 1rem;
      margin: 0;
    }

    ul {
      margin: 0.5rem 0 0;
      padding-left: 1.25rem;
    }
  `,
})
export class UserInformationDialogComponent {
  readonly data = inject<UserInformationDialogData>(MAT_DIALOG_DATA);
  readonly roles = Object.keys(ROLE_PERMISSIONS) as Array<
    keyof typeof ROLE_PERMISSIONS
  >;
  readonly rolePermissions = ROLE_PERMISSIONS;
}
