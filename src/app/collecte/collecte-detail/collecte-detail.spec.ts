import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollecteDetail } from './collecte-detail';

describe('CollecteDetail', () => {
  let component: CollecteDetail;
  let fixture: ComponentFixture<CollecteDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollecteDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CollecteDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
