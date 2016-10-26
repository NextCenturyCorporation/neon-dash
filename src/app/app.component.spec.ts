/* tslint:disable:no-unused-variable */

import { ComponentFixture, async, inject, TestBed } from '@angular/core/testing';
import { By }              from '@angular/platform-browser';
import { DebugElement }    from '@angular/core';
import { FormsModule }     from '@angular/forms';

import { AppComponent } from './app.component';
import { AboutNeonComponent } from './components/about-neon/about-neon.component';
import { DatasetSelectorComponent } from './components/dataset-selector/dataset-selector.component';
import { DashboardOptionsComponent } from './components/dashboard-options/dashboard-options.component';
import { VisualizationContainerComponent } from './components/visualization-container/visualization-container.component';

import { NeonGTDConfig } from './neon-gtd-config';

import { ActiveGridService } from './services/active-grid.service';
import { DatasetService } from './services/dataset.service';
import { ConnectionService } from './services/connection.service';
import { ErrorNotificationService } from './services/error-notification.service';
import { ExportService } from './services/export.service';
import { FilterService } from './services/filter.service';
import { ParameterService } from './services/parameter.service';
import { ThemesService } from './services/themes.service';
import { VisualizationService } from './services/visualization.service';

import { NgGridModule, NgGrid, NgGridItem } from 'angular2-grid';

import { MaterialModule } from '@angular/material';

describe('App: NeonGtd', () => {
  let testConfig: NeonGTDConfig = new NeonGTDConfig();
  let fixture: ComponentFixture<AppComponent>;
  let de: DebugElement;
  let el: HTMLElement;
  let component: AppComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        AboutNeonComponent,
        DashboardOptionsComponent,
        DatasetSelectorComponent,
        VisualizationContainerComponent
      ],
      imports: [
        FormsModule,
        MaterialModule,
        MaterialModule.forRoot(),
        NgGridModule
      ],
      providers: [
        { provide: 'config', useValue: testConfig },
        ActiveGridService,
        DatasetService,
        ConnectionService,
        ErrorNotificationService,
        ExportService,
        FilterService,
        ParameterService,
        ThemesService,
        VisualizationService
      ]
    });

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    de = fixture.debugElement;
  });

  it('should create an instance', async(() => {
    expect(component).toBeTruthy();
  }));

  it('should include top level layout components', async(() => {
   // fixture.detectChanges();
    let compiled = fixture.debugElement.nativeElement;
    expect(de.nativeElement.querySelectorAll('md-sidenav-layout')).toBeTruthy();
    expect(de.nativeElement.querySelectorAll('app-dataset-selector')).toBeTruthy();
    // Since the about pane and options pane are rendered only after a user opens their sidenav area,
    // these should not exist upon initial render.
    expect(de.nativeElement.querySelectorAll('app-about-neon').length ===0).toBeTruthy();
    expect(de.nativeElement.querySelectorAll('app-dashboard-options').length === 0).toBeTruthy();
  }));
});
