import { TestBed } from '@angular/core/testing';

import { Collecte } from './collecte';

describe('Collecte', () => {
  let service: Collecte;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Collecte);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
