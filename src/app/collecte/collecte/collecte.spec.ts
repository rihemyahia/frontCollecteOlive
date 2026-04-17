import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Collecte } from './collecte';

describe('Collecte', () => {
  let component: Collecte;
  let fixture: ComponentFixture<Collecte>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Collecte]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Collecte);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
