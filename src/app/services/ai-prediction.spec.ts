import { TestBed } from '@angular/core/testing';

import { AiPrediction } from './ai-prediction';

describe('AiPrediction', () => {
  let service: AiPrediction;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AiPrediction);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
