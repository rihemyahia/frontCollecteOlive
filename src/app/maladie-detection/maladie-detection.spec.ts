import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaladieDetection } from './maladie-detection';

describe('MaladieDetection', () => {
  let component: MaladieDetection;
  let fixture: ComponentFixture<MaladieDetection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaladieDetection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaladieDetection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
