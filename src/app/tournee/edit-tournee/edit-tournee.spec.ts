import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTournee } from './edit-tournee';

describe('EditTournee', () => {
  let component: EditTournee;
  let fixture: ComponentFixture<EditTournee>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditTournee]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditTournee);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
