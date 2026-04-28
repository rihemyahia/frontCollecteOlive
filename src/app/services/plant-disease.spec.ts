import { TestBed } from '@angular/core/testing';

import { PlantDisease } from './plant-disease';

describe('PlantDisease', () => {
  let service: PlantDisease;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlantDisease);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
