import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreeAlerte } from './cree-alerte';

describe('CreeAlerte', () => {
  let component: CreeAlerte;
  let fixture: ComponentFixture<CreeAlerte>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreeAlerte]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreeAlerte);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
