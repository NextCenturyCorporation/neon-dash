/* tslint:disable:no-unused-variable */

import { TestBed, inject } from '@angular/core/testing';
import { ColorSchemeService } from './color-scheme.service';

describe('Service: ColorScheme', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ColorSchemeService]
    });
  });

  it('should ...', inject([ColorSchemeService], (service: ColorSchemeService) => {
    expect(service).toBeTruthy();
  }));
});
