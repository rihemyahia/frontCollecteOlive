import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListeBennes } from './liste-bennes';

describe('ListeBennes', () => {
  let component: ListeBennes;
  let fixture: ComponentFixture<ListeBennes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListeBennes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListeBennes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
