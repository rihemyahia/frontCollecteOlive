import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventDetailModal } from './event-detail-modal';

describe('EventDetailModal', () => {
  let component: EventDetailModal;
  let fixture: ComponentFixture<EventDetailModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventDetailModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventDetailModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
