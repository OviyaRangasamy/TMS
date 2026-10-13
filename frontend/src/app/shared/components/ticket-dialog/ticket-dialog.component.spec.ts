import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, of } from 'rxjs';
import {
  Ticket,
  TicketDialogResult,
  TicketInput,
} from '../../../models/ticket.model';
import { TicketService } from '../../../services/ticket.service';
import { TicketDialogComponent } from './ticket-dialog.component';

describe('TicketDialogComponent', () => {
  let fixture: ComponentFixture<TicketDialogComponent>;
  let component: TicketDialogComponent;
  let createTicket: (ticket: TicketInput) => Observable<Ticket>;
  let updateTicket: (id: string, ticket: TicketInput) => Observable<Ticket>;
  let deleteTicket: (id: string) => Observable<Ticket>;
  let closeDialog: (result: TicketDialogResult) => void;

  const savedTicket: Ticket = {
    _id: '65f000000000000000000001',
    title: 'Login issue',
    description: 'Cannot sign in',
    priority: 'HIGH',
    status: 'NEW',
  };

  const createDialog = (data: Ticket | null = null): void => {
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: data });
    fixture = TestBed.createComponent(TicketDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    createTicket = vi.fn(() => of(savedTicket));
    updateTicket = vi.fn(() => of(savedTicket));
    deleteTicket = vi.fn(() => of(savedTicket));
    closeDialog = vi.fn();

    await TestBed.configureTestingModule({
      imports: [TicketDialogComponent],
      providers: [
        {
          provide: TicketService,
          useValue: { createTicket, updateTicket, deleteTicket },
        },
        { provide: MAT_DIALOG_DATA, useValue: null },
        { provide: MatDialogRef, useValue: { close: closeDialog } },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();
  });

  it('defaults to medium priority and the new status in create mode', () => {
    createDialog();

    expect(component.isEditMode).toBe(false);
    expect(component.form.controls.priority.value).toBe('MEDIUM');
    expect(component.form.controls.status.value).toBe('NEW');
  });

  it('does not submit when required fields are missing', () => {
    createDialog();
    component.submit();

    expect(createTicket).not.toHaveBeenCalled();
    expect(component.form.controls.title.touched).toBe(true);
    expect(component.form.controls.description.touched).toBe(true);
  });

  it('creates the ticket and closes with the saved backend ticket', () => {
    createDialog();
    component.form.setValue({
      title: '  Login issue  ',
      description: '  Cannot sign in  ',
      priority: 'HIGH',
      category: '  Authentication  ',
      assignee: '',
      status: 'NEW',
    });

    component.submit();

    expect(createTicket).toHaveBeenCalledWith({
      title: 'Login issue',
      description: 'Cannot sign in',
      priority: 'HIGH',
      status: 'NEW',
      category: 'Authentication',
      assignee: null,
    });
    expect(closeDialog).toHaveBeenCalledWith({
      action: 'created',
      ticket: savedTicket,
    });
  });

  it('prepopulates the form and updates the selected ticket', () => {
    const ticket: Ticket = {
      ...savedTicket,
      category: 'Authentication',
      assignee: '65f000000000000000000002',
      status: 'IN_PROGRESS',
    };
    createDialog(ticket);

    expect(component.isEditMode).toBe(true);
    expect(component.form.getRawValue()).toEqual({
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      category: ticket.category,
      assignee: ticket.assignee,
      status: ticket.status,
    });

    component.form.controls.title.setValue('Login issue updated');
    component.submit();

    expect(updateTicket).toHaveBeenCalledWith(ticket._id, {
      title: 'Login issue updated',
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      category: ticket.category,
      assignee: ticket.assignee,
    });
    expect(createTicket).not.toHaveBeenCalled();
    expect(closeDialog).toHaveBeenCalledWith({
      action: 'updated',
      ticket: savedTicket,
    });
  });

  it('requires confirmation before deleting an edited ticket', () => {
    createDialog(savedTicket);
    component.requestDeleteConfirmation();

    expect(component.confirmingDelete()).toBe(true);
    expect(deleteTicket).not.toHaveBeenCalled();

    component.cancelDelete();
    expect(component.confirmingDelete()).toBe(false);

    component.requestDeleteConfirmation();
    component.confirmDelete();

    expect(deleteTicket).toHaveBeenCalledWith(savedTicket._id);
    expect(closeDialog).toHaveBeenCalledWith({
      action: 'deleted',
      ticketId: savedTicket._id,
    });
  });
});
