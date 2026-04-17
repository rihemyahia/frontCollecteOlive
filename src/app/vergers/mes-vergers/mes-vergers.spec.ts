import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MesVergers } from './mes-vergers';

describe('MesVergers', () => {
  let component: MesVergers;
  let fixture: ComponentFixture<MesVergers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MesVergers]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MesVergers);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
