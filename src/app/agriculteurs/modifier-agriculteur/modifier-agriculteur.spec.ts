import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModifierAgriculteur } from './modifier-agriculteur';

describe('ModifierAgriculteur', () => {
  let component: ModifierAgriculteur;
  let fixture: ComponentFixture<ModifierAgriculteur>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModifierAgriculteur]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModifierAgriculteur);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
