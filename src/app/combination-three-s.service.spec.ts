import { TestBed } from '@angular/core/testing';

import { CombinationThreeSService } from './combination-three-s.service';

describe('CombinationThreeSService', () => {
  let service: CombinationThreeSService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CombinationThreeSService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
