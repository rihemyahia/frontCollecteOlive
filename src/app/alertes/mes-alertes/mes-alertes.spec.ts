import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MesAlertes } from './mes-alertes';

describe('MesAlertes', () => {
  let component: MesAlertes;
  let fixture: ComponentFixture<MesAlertes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MesAlertes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MesAlertes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
