/* tslint:disable:no-unused-variable */
import {  ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Injector } from '@angular/core';

import { MaterialModule } from '@angular/material';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

import {} from 'jasmine';

import { FilterBuilderComponent } from './filter-builder.component';
import { ExportService } from '../../services/export.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { TranslationService } from '../../services/translation.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('Component: Filter Builder', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: FilterBuilderComponent;
    let fixture: ComponentFixture<FilterBuilderComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                FilterBuilderComponent
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
                MaterialModule,
                MaterialModule.forRoot(),
                FormsModule,
                NgxDatatableModule,
                BrowserAnimationsModule
            ]
        });
        fixture = TestBed.createComponent(FilterBuilderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create an instance', (() => {
        expect(component).toBeTruthy();
    }));
});
