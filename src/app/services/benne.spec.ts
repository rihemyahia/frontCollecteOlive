import { TestBed } from '@angular/core/testing';

import { Benne } from './benne';

describe('Benne', () => {
  let service: Benne;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Benne);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
