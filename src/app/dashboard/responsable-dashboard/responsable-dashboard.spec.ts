import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResponsableDashboard } from './responsable-dashboard';

describe('ResponsableDashboard', () => {
  let component: ResponsableDashboard;
  let fixture: ComponentFixture<ResponsableDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResponsableDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResponsableDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
