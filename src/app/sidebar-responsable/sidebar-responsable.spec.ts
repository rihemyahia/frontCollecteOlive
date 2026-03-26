import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SideBarResponsable } from './sidebar-responsable';

describe('SideBarResponsable', () => {
  let component: SideBarResponsable;
  let fixture: ComponentFixture<SideBarResponsable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SideBarResponsable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SideBarResponsable);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
