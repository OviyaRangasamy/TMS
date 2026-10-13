import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Ticket } from '../../../../models/ticket.model';
import { TicketCardComponent } from './ticket-card.component';

describe('TicketCardComponent', () => {
  let fixture: ComponentFixture<TicketCardComponent>;
  let component: TicketCardComponent;

  const ticket: Ticket = {
    _id: '65f000000000000000000001',
    title: 'Login issue',
    description: 'Cannot sign in',
    status: 'NEW',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TicketCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('ticket', ticket);
    fixture.detectChanges();
  });

  it('emits the selected ticket on click', () => {
    const selected = vi.fn();
    component.selected.subscribe(selected);

    fixture.nativeElement.querySelector('mat-card').click();

    expect(selected).toHaveBeenCalledWith(ticket);
  });

  it('supports keyboard activation with Enter and Space', () => {
    const selected = vi.fn();
    component.selected.subscribe(selected);

    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      cancelable: true,
    });
    component.onKeydown(enterEvent);
    const spaceEvent = new KeyboardEvent('keydown', {
      key: ' ',
      cancelable: true,
    });
    component.onKeydown(spaceEvent);

    expect(selected).toHaveBeenCalledTimes(2);
    expect(enterEvent.defaultPrevented).toBe(true);
    expect(spaceEvent.defaultPrevented).toBe(true);
  });
});
