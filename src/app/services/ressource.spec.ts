import { TestBed } from '@angular/core/testing';

import { Ressource } from './ressource';

describe('Ressource', () => {
  let service: Ressource;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Ressource);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
