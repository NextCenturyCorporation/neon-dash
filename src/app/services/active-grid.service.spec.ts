/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { ActiveGridService } from './active-grid.service';

describe('Service: ActiveGrid', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ActiveGridService]
    });
  });

  it('should ...', inject([ActiveGridService], (service: ActiveGridService) => {
    expect(service).toBeTruthy();
  }));
});
