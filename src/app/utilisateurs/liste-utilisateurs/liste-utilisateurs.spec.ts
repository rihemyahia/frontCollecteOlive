import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListeUtilisateurs } from './liste-utilisateurs';

describe('ListeUtilisateurs', () => {
  let component: ListeUtilisateurs;
  let fixture: ComponentFixture<ListeUtilisateurs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListeUtilisateurs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListeUtilisateurs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
