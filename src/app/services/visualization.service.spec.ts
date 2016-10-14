/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { VisualizationService } from './visualization.service';

describe('Service: Visualization', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VisualizationService]
    });
  });

  it('should ...', inject([VisualizationService], (service: VisualizationService) => {
    expect(service).toBeTruthy();
  }));
});
