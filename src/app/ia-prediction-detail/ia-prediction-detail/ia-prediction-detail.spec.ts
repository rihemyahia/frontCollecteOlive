import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IaPredictionDetail } from './ia-prediction-detail';

describe('IaPredictionDetail', () => {
  let component: IaPredictionDetail;
  let fixture: ComponentFixture<IaPredictionDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IaPredictionDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IaPredictionDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
