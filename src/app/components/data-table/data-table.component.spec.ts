/* tslint:disable:no-unused-variable */
import {  ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Injector } from '@angular/core';

import { NgxDatatableModule } from '@swimlane/ngx-datatable';

import {} from 'jasmine';

import { DataTableComponent } from './data-table.component';
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
import {UnsharedFilterComponent} from '../unshared-filter/unshared-filter.component';
import {VisualizationService} from '../../services/visualization.service';

describe('Component: DataTable', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: DataTableComponent;
    let fixture: ComponentFixture<DataTableComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                DataTableComponent,
                ExportControlComponent,
                UnsharedFilterComponent
            ],
            providers: [
                ConnectionService,
                DatasetService,
                FilterService,
                ExportService,
                TranslationService,
                ErrorNotificationService,
                VisualizationService,
                ThemesService,
                Injector,
                { provide: 'config', useValue: testConfig }
            ],
            imports: [
                AppMaterialModule,
                FormsModule,
                NgxDatatableModule,
                BrowserAnimationsModule
            ]
        });
        fixture = TestBed.createComponent(DataTableComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create an instance', (() => {
        expect(component).toBeTruthy();
    }));
});
