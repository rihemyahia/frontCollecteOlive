import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TourneeList } from './tournee-list';

describe('TourneeList', () => {
  let component: TourneeList;
  let fixture: ComponentFixture<TourneeList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TourneeList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TourneeList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
