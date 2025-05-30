import { TestBed } from '@angular/core/testing';

import { CombinationServiceService } from './combination-service.service';

describe('CombinationServiceService', () => {
  let service: CombinationServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CombinationServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
