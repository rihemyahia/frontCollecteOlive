import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListeVergers } from './liste-vergers';

describe('ListeVergers', () => {
  let component: ListeVergers;
  let fixture: ComponentFixture<ListeVergers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListeVergers]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListeVergers);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
