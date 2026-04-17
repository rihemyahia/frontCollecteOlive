import { TestBed } from '@angular/core/testing';

import { Calendrier } from './calendrier';

describe('Calendrier', () => {
  let service: Calendrier;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Calendrier);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
