import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TourneeEdit } from './tournee-edit';

describe('TourneeEdit', () => {
  let component: TourneeEdit;
  let fixture: ComponentFixture<TourneeEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TourneeEdit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TourneeEdit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
