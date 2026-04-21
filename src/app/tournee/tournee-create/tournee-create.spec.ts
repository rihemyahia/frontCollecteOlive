import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TourneeCreate } from './tournee-create';

describe('TourneeCreate', () => {
  let component: TourneeCreate;
  let fixture: ComponentFixture<TourneeCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TourneeCreate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TourneeCreate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
