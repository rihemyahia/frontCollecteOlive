import { TestBed } from '@angular/core/testing';

import { Tracteur } from './tracteur';

describe('Tracteur', () => {
  let service: Tracteur;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Tracteur);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
