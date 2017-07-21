/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Injector } from '@angular/core';

import { ChartModule } from 'angular2-chartjs';

import { TextCloudComponent } from './text-cloud.component';
import { ExportControlComponent } from '../export-control/export-control.component';
import { ExportService } from '../../services/export.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { TranslationService } from '../../services/translation.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {AppMaterialModule} from '../../app.material.module';

describe('Component: TextCloud', () => {
  let testConfig: NeonGTDConfig = new NeonGTDConfig();
  let component: TextCloudComponent;
  let fixture: ComponentFixture<TextCloudComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        TextCloudComponent,
        ExportControlComponent
      ],
      providers: [
        ConnectionService,
        DatasetService,
        FilterService,
        ExportService,
        TranslationService,
        ErrorNotificationService,
        ThemesService,
        Injector,
        { provide: 'config', useValue: testConfig }
      ],
      imports: [
        AppMaterialModule,
        FormsModule,
        ChartModule,
        BrowserAnimationsModule
      ]
    });
    fixture = TestBed.createComponent(TextCloudComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create an instance', (() => {
    expect(component).toBeTruthy();
  }));
});
