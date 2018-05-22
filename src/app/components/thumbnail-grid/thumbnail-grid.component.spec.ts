/*
 * Copyright 2017 Next Century Corporation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
import { AppMaterialModule } from '../../app.material.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By, DomSanitizer } from '@angular/platform-browser';
import { async, ComponentFixture, fakeAsync, inject, TestBed, tick } from '@angular/core/testing';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import { FormsModule } from '@angular/forms';
import { HttpModule, Response, ResponseOptions, XHRBackend } from '@angular/http';
import { Injector } from '@angular/core';
import { MockBackend } from '@angular/http/testing';
import { NeonGTDConfig } from '../../neon-gtd-config';

import {} from 'jasmine-core';
import * as neon from 'neon-framework';

import { ExportControlComponent } from '../export-control/export-control.component';
import { ThumbnailGridComponent } from './thumbnail-grid.component';

import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { ExportService } from '../../services/export.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { VisualizationService } from '../../services/visualization.service';
import { DatasetMock } from '../../../testUtils/MockServices/DatasetMock';
import { FilterMock } from '../../../testUtils/MockServices/FilterMock';

describe('Component: ThumbnailGrid', () => {
    let component: ThumbnailGridComponent;
    let fixture: ComponentFixture<ThumbnailGridComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                ThumbnailGridComponent,
                ExportControlComponent
            ],
            providers: [
                ActiveGridService,
                ConnectionService,
                DatasetService,
                ExportService,
                ErrorNotificationService,
                { provide: FilterService, useClass: FilterMock },
                ThemesService,
                VisualizationService,
                Injector,
                { provide: 'config', useValue: new NeonGTDConfig() },
                // Mock for testing Http
                { provide: XHRBackend, useClass: MockBackend }
            ],
            imports: [
                AppMaterialModule,
                BrowserAnimationsModule,
                FormsModule,
                HttpModule
            ]
        });
        fixture = TestBed.createComponent(ThumbnailGridComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('does have expected class options properties', () => {
        expect(component.options.ascending).toEqual(false);
        expect(component.options.border).toEqual('');
        expect(component.options.cropAndScale).toEqual('');
        expect(component.options.id).toEqual('');
        expect(component.options.linkPrefix).toEqual('');
        expect(component.options.openOnMouseClick).toEqual(true);
        expect(component.options.styleClass).toEqual('');
        expect(component.options.textMap).toEqual({});
        expect(component.options.typeMap).toEqual({});

        expect(component.options.categoryField).toEqual(component.emptyField);
        expect(component.options.filterField).toEqual(component.emptyField);
        expect(component.options.idField).toEqual(component.emptyField);
        expect(component.options.linkField).toEqual(component.emptyField);
        expect(component.options.nameField).toEqual(component.emptyField);
        expect(component.options.objectIdField).toEqual(component.emptyField);
        expect(component.options.objectNameField).toEqual(component.emptyField);
        expect(component.options.percentField).toEqual(component.emptyField);
        expect(component.options.predictedNameField).toEqual(component.emptyField);
        expect(component.options.sortField).toEqual(component.emptyField);
        expect(component.options.typeField).toEqual(component.emptyField);

        expect(component.headerText).toBeDefined();
        expect(component.infoText).toBeDefined();
        expect(component.thumbnailGrid).toBeDefined();
        expect(component.visualization).toBeDefined();
    });

    it('does have expected class properties', () => {
        expect(component.gridArray).toEqual([]);
        expect(component.filters).toEqual([]);
        expect(component.isLoading).toEqual(false);
        expect(component.lastPage).toEqual(true);
        expect(component.mediaTypes).toEqual({
            image: 'img',
            video: 'vid',
            html: 'htm',
            pdf: 'pdf'
        });
        expect(component.page).toEqual(1);
        expect(component.pagingGrid).toEqual([]);
    });

    it('does show toolbar and sidenav', () => {
        let container = fixture.debugElement.query(By.css('mat-sidenav-container'));
        expect(container).not.toBeNull();
        let toolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar'));
        expect(toolbar).not.toBeNull();
        let sidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav'));
        expect(sidenav).not.toBeNull();
    });

    it('does show header in toolbar with visualization title', () => {
        let header = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toContain('Thumbnail Grid');
    });

    it('does show data-info and hide error-message in toolbar and sidenav if errorMessage is undefined', () => {
        let dataInfoTextInToolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .data-info'));
        expect(dataInfoTextInToolbar).not.toBeNull();
        expect(dataInfoTextInToolbar.nativeElement.textContent).toContain('No Data');

        let dataInfoIconInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .data-info mat-icon'));
        expect(dataInfoIconInSidenav).not.toBeNull();
        expect(dataInfoIconInSidenav.nativeElement.textContent).toEqual('info');

        let dataInfoTextInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .data-info span'));
        expect(dataInfoTextInSidenav).not.toBeNull();
        expect(dataInfoTextInSidenav.nativeElement.textContent).toContain('No Data');

        let errorMessageInToolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .error-message'));
        expect(errorMessageInToolbar).toBeNull();

        let errorIconInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .error-message mat-icon'));
        expect(errorIconInSidenav).toBeNull();

        let errorMessageInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .error-message span'));
        expect(errorMessageInSidenav).toBeNull();
    });

    it('does show error-message in toolbar and sidenav if errorMessage is defined', async(() => {
        component.errorMessage = 'Test Error Message';

        // Force the component to update all its ngFor and ngIf elements.
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let dataInfoTextInToolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .data-info'));
            expect(dataInfoTextInToolbar).toBeNull();

            let dataInfoIconInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .data-info mat-icon'));
            expect(dataInfoIconInSidenav).not.toBeNull();
            expect(dataInfoIconInSidenav.nativeElement.textContent).toEqual('info');

            let dataInfoTextInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .data-info span'));
            expect(dataInfoTextInSidenav).not.toBeNull();
            expect(dataInfoTextInSidenav.nativeElement.textContent).toContain('No Data');

            let errorMessageInToolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .error-message'));
            expect(errorMessageInToolbar).not.toBeNull();
            expect(errorMessageInToolbar.nativeElement.textContent).toContain('Test Error Message');

            let errorIconInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .error-message mat-icon'));
            expect(errorIconInSidenav).not.toBeNull();
            expect(errorIconInSidenav.nativeElement.textContent).toEqual('error');

            let errorMessageInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .error-message span'));
            expect(errorMessageInSidenav).not.toBeNull();
            expect(errorMessageInSidenav.nativeElement.textContent).toContain('Test Error Message');
        });
    }));

    it('does show settings icon button in toolbar', () => {
        let button = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar button'));

        let icon = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar button mat-icon'));
        expect(icon.nativeElement.textContent).toEqual('settings');
    });

    it('does show sidenav options menu', () => {
        let menu = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav mat-card'));
        expect(menu).not.toBeNull();

        let content = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content'));
        expect(content).not.toBeNull();
    });
});

describe('Component: ThumbnailGrid with config', () => {
    let component: ThumbnailGridComponent;
    let fixture: ComponentFixture<ThumbnailGridComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                ThumbnailGridComponent,
                ExportControlComponent
            ],
            providers: [
                ActiveGridService,
                ConnectionService,
                { provide: DatasetService, useClass: DatasetMock },
                ExportService,
                ErrorNotificationService,
                { provide: FilterService, useClass: FilterMock },
                ThemesService,
                VisualizationService,
                Injector,
                { provide: 'config', useValue: new NeonGTDConfig() },
                { provide: 'database', useValue: 'testDatabase2' },
                { provide: 'table', useValue: 'testTable2' },
                { provide: 'configFilter', useValue: {lhs: 'testConfigFilterField', operator: '=', rhs: 'testConfigFilterValue' } },
                { provide: 'ascending', useValue: true },
                { provide: 'border', useValue: 'grey' },
                { provide: 'cropAndScale', useValue: 'both' },
                { provide: 'id', useValue: 'testId' },
                { provide: 'linkPrefix', useValue: 'prefix/' },
                { provide: 'openOnMouseClick', useValue: true },
                { provide: 'styleClass', useValue: 'style2' },
                { provide: 'textMap', useValue: { actual: 'Truth', percentage: 'Score' } },
                { provide: 'typeMap', useValue: { jpg: 'img', mov: 'vid' } },
                { provide: 'categoryField', useValue: 'testGroupField' },
                { provide: 'filterField', useValue: 'testFilterField' },
                { provide: 'idField', useValue: 'testIdField' },
                { provide: 'linkField', useValue: 'testLinkField' },
                { provide: 'nameField', useValue: 'testNameField' },
                { provide: 'objectIdField', useValue: 'testIdField' },
                { provide: 'objectNameField', useValue: 'testNameField' },
                { provide: 'percentField', useValue: 'testSizeField' },
                { provide: 'predictedNameField', useValue: 'testNameField' },
                { provide: 'sortField', useValue: 'testSortField' },
                { provide: 'typeField', useValue: 'testTypeField' },
                { provide: 'title', useValue: 'Test Title' }
            ],
            imports: [
                AppMaterialModule,
                BrowserAnimationsModule,
                FormsModule,
                HttpModule
            ]
        });
        fixture = TestBed.createComponent(ThumbnailGridComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('does have expected superclass options properties', () => {
        expect(component.options.database).toEqual(DatasetMock.DATABASES[1]);
        expect(component.options.databases).toEqual(DatasetMock.DATABASES);
        expect(component.options.table).toEqual(DatasetMock.TABLES[1]);
        expect(component.options.tables).toEqual(DatasetMock.TABLES);
        expect(component.options.fields).toEqual(DatasetMock.FIELDS);
        expect(component.options.title).toEqual('Test Title');
        expect(component.options.filter).toEqual({
            lhs: 'testConfigFilterField',
            operator: '=',
            rhs: 'testConfigFilterValue'
        });
    });

    it('does have expected class options properties', () => {
        expect(component.options.ascending).toEqual(true);
        expect(component.options.border).toEqual('grey');
        expect(component.options.cropAndScale).toEqual('both');
        expect(component.options.id).toEqual('testId');
        expect(component.options.linkPrefix).toEqual('prefix/');
        expect(component.options.openOnMouseClick).toEqual(true);
        expect(component.options.styleClass).toEqual('style2');
        expect(component.options.textMap).toEqual({
            actual: 'Truth',
            percentage: 'Score'
        });
        expect(component.options.typeMap).toEqual({
            jpg: 'img',
            mov: 'vid'
        });

        expect(component.options.categoryField).toEqual(new FieldMetaData('testGroupField', 'Test Group Field'));
        expect(component.options.filterField).toEqual(new FieldMetaData('testFilterField', 'Test Filter Field'));
        expect(component.options.idField).toEqual(new FieldMetaData('testIdField', 'Test ID Field'));
        expect(component.options.linkField).toEqual(new FieldMetaData('testLinkField', 'Test Link Field'));
        expect(component.options.nameField).toEqual(new FieldMetaData('testNameField', 'Test Name Field'));
        expect(component.options.objectIdField).toEqual(new FieldMetaData('testIdField', 'Test ID Field'));
        expect(component.options.objectNameField).toEqual(new FieldMetaData('testNameField', 'Test Name Field'));
        expect(component.options.percentField).toEqual(new FieldMetaData('testSizeField', 'Test Size Field'));
        expect(component.options.predictedNameField).toEqual(new FieldMetaData('testNameField', 'Test Name Field'));
        expect(component.options.sortField).toEqual(new FieldMetaData('testSortField', 'Test Sort Field'));
        expect(component.options.typeField).toEqual(new FieldMetaData('testTypeField', 'Test Type Field'));
    });

    it('updateFieldsOnTableChanged does set field options as expected from config bindings', () => {
        component.options.categoryField = component.emptyField;
        component.options.filterField = component.emptyField;
        component.options.idField = component.emptyField;
        component.options.linkField = component.emptyField;
        component.options.nameField = component.emptyField;
        component.options.objectIdField = component.emptyField;
        component.options.objectNameField = component.emptyField;
        component.options.percentField = component.emptyField;
        component.options.predictedNameField = component.emptyField;
        component.options.sortField = component.emptyField;
        component.options.typeField = component.emptyField;

        component.options.updateFieldsOnTableChanged();

        expect(component.options.categoryField).toEqual(new FieldMetaData('testGroupField', 'Test Group Field'));
        expect(component.options.filterField).toEqual(new FieldMetaData('testFilterField', 'Test Filter Field'));
        expect(component.options.idField).toEqual(new FieldMetaData('testIdField', 'Test ID Field'));
        expect(component.options.linkField).toEqual(new FieldMetaData('testLinkField', 'Test Link Field'));
        expect(component.options.nameField).toEqual(new FieldMetaData('testNameField', 'Test Name Field'));
        expect(component.options.objectIdField).toEqual(new FieldMetaData('testIdField', 'Test ID Field'));
        expect(component.options.objectNameField).toEqual(new FieldMetaData('testNameField', 'Test Name Field'));
        expect(component.options.percentField).toEqual(new FieldMetaData('testSizeField', 'Test Size Field'));
        expect(component.options.predictedNameField).toEqual(new FieldMetaData('testNameField', 'Test Name Field'));
        expect(component.options.sortField).toEqual(new FieldMetaData('testSortField', 'Test Sort Field'));
        expect(component.options.typeField).toEqual(new FieldMetaData('testTypeField', 'Test Type Field'));
    });

    it('does show header in toolbar with visualization title from config', () => {
        let header = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toContain('Test Title');
    });
});
