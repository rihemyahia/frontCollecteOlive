import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreerVerger } from './creer-verger';

describe('CreerVerger', () => {
  let component: CreerVerger;
  let fixture: ComponentFixture<CreerVerger>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreerVerger]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreerVerger);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
