import { TestBed } from '@angular/core/testing';

import { Verger } from './verger';

describe('Verger', () => {
  let service: Verger;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Verger);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
