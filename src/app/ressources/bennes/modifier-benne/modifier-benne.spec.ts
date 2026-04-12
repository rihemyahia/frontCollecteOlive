import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModifierBenne } from './modifier-benne';

describe('ModifierBenne', () => {
  let component: ModifierBenne;
  let fixture: ComponentFixture<ModifierBenne>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModifierBenne]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModifierBenne);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
