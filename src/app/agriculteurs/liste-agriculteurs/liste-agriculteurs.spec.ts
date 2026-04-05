import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListeAgriculteurs } from './liste-agriculteurs';

describe('ListeAgriculteurs', () => {
  let component: ListeAgriculteurs;
  let fixture: ComponentFixture<ListeAgriculteurs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListeAgriculteurs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListeAgriculteurs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
