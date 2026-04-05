import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreerAgriculteur } from './creer-agriculteur';

describe('CreerAgriculteur', () => {
  let component: CreerAgriculteur;
  let fixture: ComponentFixture<CreerAgriculteur>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreerAgriculteur]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreerAgriculteur);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
