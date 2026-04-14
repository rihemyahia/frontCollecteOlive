import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModifierVerger } from './modifier-verger';

describe('ModifierVerger', () => {
  let component: ModifierVerger;
  let fixture: ComponentFixture<ModifierVerger>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModifierVerger]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModifierVerger);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
