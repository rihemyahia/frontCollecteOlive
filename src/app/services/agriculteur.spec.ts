import { TestBed } from '@angular/core/testing';

import { Agriculteur } from './agriculteur';

describe('Agriculteur', () => {
  let service: Agriculteur;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Agriculteur);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
