/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Injector } from '@angular/core';

import { MaterialModule } from '@angular/material';
import { ChartModule } from 'angular2-chartjs';

import {} from 'jasmine';

import { TimelineComponent } from './timeline.component';
import { ExportService } from '../../services/export.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { TranslationService } from '../../services/translation.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { ColorSchemeService } from '../../services/color-scheme.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('Component: Timeline', () => {
  let testConfig: NeonGTDConfig = new NeonGTDConfig();
  let component: TimelineComponent;
  let fixture: ComponentFixture<TimelineComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        TimelineComponent
      ],
      providers: [
        ConnectionService,
        DatasetService,
        FilterService,
        ExportService,
        TranslationService,
        ErrorNotificationService,
        ThemesService,
        ColorSchemeService,
        Injector,
        { provide: 'config', useValue: testConfig }
      ],
      imports: [
        MaterialModule,
        MaterialModule.forRoot(),
        FormsModule,
        ChartModule,
        BrowserAnimationsModule
      ]
    });
    fixture = TestBed.createComponent(TimelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create an instance', () => {
    expect(component).toBeTruthy();
  });
});
