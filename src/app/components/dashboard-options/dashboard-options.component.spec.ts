/* tslint:disable:no-unused-variable */

import { ViewContainerRef } from '@angular/core';
import { TestBed, async, inject } from '@angular/core/testing';
import { DashboardOptionsComponent } from './dashboard-options.component';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { ExportService } from '../../services/export.service';
import { ParameterService } from '../../services/parameter.service';
import { ThemesService } from '../../services/themes.service';
import { MdSnackBar } from '@angular/material';

describe('Component: DashboardOptionsComponent', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        DashboardOptionsComponent, ConnectionService, DatasetService, ErrorNotificationService,
        ExportService, MdSnackBar, ParameterService, ThemesService, ViewContainerRef
      ],
    });
  });

  it('should create an instance', inject([ConnectionService, DatasetService, ErrorNotificationService,
        ExportService, MdSnackBar, ParameterService, ThemesService, ViewContainerRef],
        (cs: ConnectionService,  ds: DatasetService,
            ens: ErrorNotificationService, exs: ExportService,
            mdSnackBar: MdSnackBar, ps: ParameterService,
            ts: ThemesService, viewContainerRef: ViewContainerRef) => {
    let component = new DashboardOptionsComponent(cs, ds, ens, exs, mdSnackBar, ps, ts, viewContainerRef);
    expect(component).toBeTruthy();
  }));
});
