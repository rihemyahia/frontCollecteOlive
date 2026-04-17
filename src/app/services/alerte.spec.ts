import { TestBed } from '@angular/core/testing';

import { Alerte } from './alerte';

describe('Alerte', () => {
  let service: Alerte;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Alerte);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
