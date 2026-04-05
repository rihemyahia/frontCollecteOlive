import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivationComptes } from './activation-comptes';

describe('ActivationComptes', () => {
  let component: ActivationComptes;
  let fixture: ComponentFixture<ActivationComptes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivationComptes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActivationComptes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
