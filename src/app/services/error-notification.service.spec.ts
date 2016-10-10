/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { ErrorNotificationService } from './error-notification.service';

describe('Service: Export', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ErrorNotificationService]
    });
  });

  it('should ...', inject([ErrorNotificationService], (service: ErrorNotificationService) => {
    expect(service).toBeTruthy();
  }));
});
