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
import { ComponentFixture, fakeAsync, inject, TestBed, tick } from '@angular/core/testing';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import { FormsModule } from '@angular/forms';
import { HttpModule, Response, ResponseOptions, XHRBackend } from '@angular/http';
import { Injector } from '@angular/core';
import { MockBackend } from '@angular/http/testing';
import { NeonGTDConfig } from '../../neon-gtd-config';

import {} from 'jasmine-core';
import * as neon from 'neon-framework';

import { ExportControlComponent } from '../export-control/export-control.component';
import { WikiViewerComponent } from './wiki-viewer.component';

import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { ExportService } from '../../services/export.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { VisualizationService } from '../../services/visualization.service';
import { DatasetMock } from '../../../testUtils/MockServices/DatasetMock';

describe('Component: WikiViewer', () => {
    let component: WikiViewerComponent;
    let fixture: ComponentFixture<WikiViewerComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                WikiViewerComponent,
                ExportControlComponent
            ],
            providers: [
                ActiveGridService,
                ConnectionService,
                DatasetService,
                ExportService,
                ErrorNotificationService,
                FilterService,
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
        fixture = TestBed.createComponent(WikiViewerComponent);
        component = fixture.componentInstance;
    });

    it('exists', (() => {
        expect(component).toBeTruthy();
    }));

    it('does have expected active properties', (() => {
        expect(component.active).toEqual({
            allowsTranslations: true,
            errorMessage: '',
            id: '',
            idField: new FieldMetaData(),
            linkField: new FieldMetaData(),
            textColor: '#111',
            wikiName: [],
            wikiText: []
        });
    }));

    it('createNeonFilterClauseEquals does return null', (() => {
        expect(component.createNeonFilterClauseEquals('testDatabase', 'testTable', 'testField')).toBeNull();
    }));

    it('createQuery does return expected query', (() => {
        component.meta.database = new DatabaseMetaData('testDatabase');
        component.meta.table = new TableMetaData('testTable');
        component.active.id = 'testId';
        component.active.idField.columnName = 'testIdField';
        component.active.linkField.columnName = 'testLinkField';

        let query = new neon.query.Query()
            .selectFrom('testDatabase', 'testTable')
            .withFields(['testLinkField']);

        let whereClauses = [
            neon.query.where('testIdField', '=', 'testId'),
            neon.query.where('testLinkField', '!=', null)
        ];

        query.where(neon.query.and.apply(query, whereClauses));

        expect(component.createQuery()).toEqual(query);
    }));

    it('getButtonText does return expected string', () => {
        expect(component.getButtonText()).toBe('No Data');
        component.active.wikiName = ['a'];
        expect(component.getButtonText()).toBe('Total 1');
        component.active.wikiName = ['a', 'b', 'c', 'd'];
        expect(component.getButtonText()).toBe('Total 4');
        component.active.wikiName = ['a', 'b'];
        expect(component.getButtonText()).toBe('Total 2');
    });

    it('getExportFields does return expected array', (() => {
        component.active.idField.columnName = 'testIdField';
        component.active.idField.prettyName = 'Test ID Field';
        component.active.linkField.columnName = 'testLinkField';
        component.active.linkField.prettyName = 'Test Link Field';

        expect(component.getExportFields()).toEqual([{
            columnName: 'testIdField',
            prettyName: 'Test ID Field'
        }, {
            columnName: 'testLinkField',
            prettyName: 'Test Link Field'
        }]);
    }));

    it('getFiltersToIgnore does return null', (() => {
        expect(component.getFiltersToIgnore()).toBeNull();
    }));

    it('getFilterText does return empty string', (() => {
        expect(component.getFilterText({})).toBe('');
        expect(component.getFilterText({
            value: 'testValue'
        })).toBe('');
    }));

    it('getNeonFilterFields does return empty array', (() => {
        expect(component.getNeonFilterFields()).toEqual([]);
    }));

    it('getOptionFromConfig does return null options because config is empty', (() => {
        expect(component.getOptionFromConfig('database')).toBeNull();
        expect(component.getOptionFromConfig('idField')).toBeNull();
        expect(component.getOptionFromConfig('linkField')).toBeNull();
        expect(component.getOptionFromConfig('table')).toBeNull();
        expect(component.getOptionFromConfig('title')).toBeNull();
    }));

    it('getVisualizationName does return expected string', (() => {
        expect(component.getVisualizationName()).toBe('Wiki Viewer');
    }));

    it('isValidQuery does return expected result', (() => {
        expect(component.isValidQuery()).toBe(false);

        component.meta.database = new DatabaseMetaData('testDatabase');
        expect(component.isValidQuery()).toBe(false);

        component.meta.table = new TableMetaData('testTable');
        expect(component.isValidQuery()).toBe(false);

        component.active.id = 'testId';
        expect(component.isValidQuery()).toBe(false);

        component.active.idField.columnName = 'testIdField';
        expect(component.isValidQuery()).toBe(false);

        component.active.linkField.columnName = 'testLinkField';
        expect(component.isValidQuery()).toBe(true);
    }));

    it('onQuerySuccess does set expected properties if response returns no data', (() => {
        component.active.linkField.columnName = 'testLinkField';
        component.active.errorMessage = 'testErrorMessage';
        component.active.wikiName = ['testName'];
        component.active.wikiText = ['testText'];

        component.onQuerySuccess({
            data: []
        });

        expect(component.active.errorMessage).toBe('No Data');
        expect(component.active.wikiName).toEqual([]);
        expect(component.active.wikiText).toEqual([]);
    }));

    it('onQuerySuccess does call http.get and does set expected properties if response returns data',
    fakeAsync(inject([XHRBackend], (mockBackend) => {

        component.active.linkField.columnName = 'testLinkField';
        component.active.errorMessage = 'testErrorMessage';

        mockBackend.connections.subscribe((connection) => {
            connection.mockRespond(new Response(new ResponseOptions({
                body: JSON.stringify({
                    parse: {
                        text: {
                            '*': '<p>Test Content</p>'
                        },
                        title: 'Test Title'
                    }
                })
            })));
        });

        component.onQuerySuccess({
            data: [{
                testLinkField: 'testLinkValue'
            }]
        });

        // Wait for the HTTP response.
        tick(500);
        expect(component.active.errorMessage).toBe('');
        expect(component.active.wikiName).toEqual(['Test Title']);
        expect(component.active.wikiText.length).toBe(1);
        expect(component.active.wikiText[0].toString()).toBe(
            'SafeValue must use [property]=binding: <p>Test Content</p> (see http://g.co/ng/security#xss)');
    })));

    it('onQuerySuccess does call http.get and does set expected properties if response failed',
        fakeAsync(inject([XHRBackend], (mockBackend) => {

        component.active.linkField.columnName = 'testLinkField';
        component.active.wikiName = ['testName'];
        component.active.wikiText = ['testText'];

        mockBackend.connections.subscribe((connection) => {
            connection.mockError(new Response(new ResponseOptions({
                body: 'Test Error Message',
                status: 500
            })));
        });

        component.onQuerySuccess({
            data: [{
                testLinkField: 'testLinkValue'
            }]
        });

        // Wait for the HTTP response.
        tick(500);
        expect(component.active.errorMessage).toBe('');
        expect(component.active.wikiName).toEqual(['testLinkValue']);
        expect(component.active.wikiText.length).toBe(1);
        expect(component.active.wikiText[0].toString()).toBeTruthy();
    })));

    it('onQuerySuccess does call http.get multiple times and does set expected properties if response returns data with multiple links',
    fakeAsync(inject([XHRBackend], (mockBackend) => {

        component.active.linkField.columnName = 'testLinkField';
        component.active.errorMessage = 'testErrorMessage';

        mockBackend.connections.subscribe((connection) => {
            if (connection.request.url === WikiViewerComponent.WIKI_LINK_PREFIX + 'testLinkValue1') {
                connection.mockRespond(new Response(new ResponseOptions({
                    body: JSON.stringify({
                        parse: {
                            text: {
                                '*': '<p>Test Content 1</p>'
                            },
                            title: 'Test Title 1'
                        }
                    })
                })));
            }

            if (connection.request.url === WikiViewerComponent.WIKI_LINK_PREFIX + 'testLinkValue2') {
                connection.mockRespond(new Response(new ResponseOptions({
                    body: JSON.stringify({
                        parse: {
                            text: {
                                '*': '<p>Test Content 2</p>'
                            },
                            title: 'Test Title 2'
                        }
                    })
                })));
            }
        });

        component.onQuerySuccess({
            data: [{
                testLinkField: ['testLinkValue1', 'testLinkValue2']
            }]
        });

        // Wait for the HTTP response.
        tick(500);
        expect(component.active.errorMessage).toBe('');
        expect(component.active.wikiName).toEqual(['Test Title 1', 'Test Title 2']);
        expect(component.active.wikiText.length).toBe(2);
        expect(component.active.wikiText[0].toString()).toBe(
            'SafeValue must use [property]=binding: <p>Test Content 1</p> (see http://g.co/ng/security#xss)');
        expect(component.active.wikiText[1].toString()).toBe(
            'SafeValue must use [property]=binding: <p>Test Content 2</p> (see http://g.co/ng/security#xss)');
    })));

    it('onUpdateFields does set expected fields to empty strings because fields are empty', (() => {
        component.onUpdateFields();
        expect(component.active.idField).toEqual(new FieldMetaData());
        expect(component.active.linkField).toEqual(new FieldMetaData());
    }));

    it('postInit does call executeQueryChain', (() => {
        let spy = spyOn(component, 'executeQueryChain');
        component.postInit();
        expect(spy.calls.count()).toBe(1);
    }));

    it('refreshVisualization does call changeDetection.detectChanges', (() => {
        let spy = spyOn(component.changeDetection, 'detectChanges');
        component.refreshVisualization();
        expect(spy.calls.count()).toBe(1);
    }));

    it('removeFilter function does exist', (() => {
        expect(component.removeFilter).toBeDefined();
    }));

    it('setupFilters function does exist', (() => {
        expect(component.setupFilters).toBeDefined();
    }));

    it('subGetBindings does set expected bindings', (() => {
        component.active.idField.columnName = 'testIdField';
        component.active.linkField.columnName = 'testLinkField';

        let bindings = {};
        component.subGetBindings(bindings);
        expect(bindings).toEqual({
            idField: 'testIdField',
            linkField: 'testLinkField'
        });
    }));

    it('subNgOnDestroy function does exist', (() => {
        expect(component.subNgOnDestroy).toBeDefined();
    }));

    it('subNgOnInit function does exist', (() => {
        expect(component.subNgOnInit).toBeDefined();
    }));

    it('does show toolbar and sidenav', (() => {
        fixture.detectChanges();
        let container = fixture.debugElement.query(By.css('mat-sidenav-container'));
        expect(container).not.toBeNull();
        let toolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar'));
        expect(toolbar).not.toBeNull();
        let sidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav'));
        expect(sidenav).not.toBeNull();
    }));

    it('does show header in toolbar with visualization name', (() => {
        fixture.detectChanges();
        let header = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toBe('Wiki Viewer');
    }));

    it('does hide error-message in toolbar and sidenav if active.errorMessage is undefined', (() => {
        fixture.detectChanges();
        let errorMessageInToolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .error-message'));
        expect(errorMessageInToolbar).toBeNull();

        let iconInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .error-message mat-icon'));
        expect(iconInSidenav).toBeNull();

        let errorMessageInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .error-message > div'));
        expect(errorMessageInSidenav).toBeNull();
    }));

    it('does show error-message in toolbar and sidenav if active.errorMessage is defined', (() => {
        component.active.errorMessage = 'Test Error Message';
        fixture.detectChanges();

        let errorMessageInToolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .error-message'));
        expect(errorMessageInToolbar).not.toBeNull();
        expect(errorMessageInToolbar.nativeElement.textContent).toBe('Test Error Message');

        let iconInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .error-message.icon'));
        expect(iconInSidenav).not.toBeNull();
        expect(iconInSidenav.nativeElement.textContent).toBe('error');

        let errorMessageInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .error-message.text'));
        expect(errorMessageInSidenav).not.toBeNull();
        expect(errorMessageInSidenav.nativeElement.textContent).toBe('Test Error Message');
    }));

    it('does hide wiki-name in toolbar and sidenav if active.wikiName is empty', (() => {
        fixture.detectChanges();
        let nameInToolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .wiki-name'));
        expect(nameInToolbar).toBeNull();

        let iconInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .wiki-name mat-icon'));
        expect(iconInSidenav).toBeNull();

        let nameInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .wiki-name > div'));
        expect(nameInSidenav).toBeNull();
    }));

    it('does show wiki-name in toolbar and sidenav if active.wikiName is not empty', (() => {
        component.active.wikiName = ['Test Name'];
        fixture.detectChanges();

        let nameInToolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .wiki-name'));
        expect(nameInToolbar).not.toBeNull();
        expect(nameInToolbar.nativeElement.textContent).toBe('Total 1');

        let iconInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .wiki-name.icon'));
        expect(iconInSidenav).not.toBeNull();
        expect(iconInSidenav.nativeElement.textContent).toBe('web');

        let nameInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .wiki-name.text'));
        expect(nameInSidenav).not.toBeNull();
        expect(nameInSidenav.nativeElement.textContent).toBe('Total 1');
    }));

    it('does show settings icon button in toolbar', (() => {
        fixture.detectChanges();
        let button = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar button'));
        expect(button.attributes.matTooltip).toBe('Open/Close the Options Menu');

        let icon = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar button mat-icon'));
        expect(icon.nativeElement.textContent).toBe('settings');
    }));

    it('does show sidenav options menu', (() => {
        let menu = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav mat-card'));
        expect(menu).not.toBeNull();

        let content = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content'));
        expect(content).not.toBeNull();
    }));

    it('does show selects in sidenav options menu that have no options', (() => {
        fixture.detectChanges();

        let selects = fixture.debugElement.queryAll(
            By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field mat-select'));
        let placeholders = fixture.debugElement.queryAll(
            By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field .mat-form-field-placeholder-wrapper'));
        expect(selects.length).toBe(4);
        expect(placeholders.length).toBe(4);

        expect(selects[0].componentInstance.disabled).toBe(true);
        expect(placeholders[0].nativeElement.textContent).toContain('Database');
        expect(selects[1].componentInstance.disabled).toBe(true);
        expect(placeholders[1].nativeElement.textContent).toContain('Table');
        expect(selects[2].componentInstance.disabled).toBe(true);
        expect(placeholders[2].nativeElement.textContent).toContain('ID Field');
        expect(selects[3].componentInstance.disabled).toBe(true);
        expect(placeholders[3].nativeElement.textContent).toContain('Link Field');
    }));

    it('does show export control in sidenav options menu', (() => {
        fixture.detectChanges();

        let exportControl = fixture.debugElement.query(By.css(
            'mat-sidenav-container mat-sidenav mat-card mat-card-content app-export-control'));
        expect(exportControl).not.toBeNull();
        expect(exportControl.componentInstance.exportId).toBeDefined();
    }));

    it('does hide loading overlay by default', (() => {
        fixture.detectChanges();

        let hiddenLoadingOverlay = fixture.debugElement.query(By.css('mat-sidenav-container .not-loading-overlay'));
        expect(hiddenLoadingOverlay).not.toBeNull();

        let hiddenSpinner = fixture.debugElement.query(By.css('mat-sidenav-container .not-loading-overlay mat-spinner'));
        expect(hiddenSpinner).not.toBeNull();
    }));

    it('does show loading overlay if isLoading is true', (() => {
        component.isLoading = true;
        fixture.detectChanges();

        let loadingOverlay = fixture.debugElement.query(By.css('mat-sidenav-container .loading-overlay'));
        expect(loadingOverlay).not.toBeNull();

        let spinner = fixture.debugElement.query(By.css('mat-sidenav-container .loading-overlay mat-spinner'));
        expect(spinner).not.toBeNull();
    }));

    it('does show loading overlay if calling onQuerySuccess', fakeAsync(inject([XHRBackend], (mockBackend) => {
        component.active.linkField.columnName = 'testLinkField';

        mockBackend.connections.subscribe((connection) => {
            fixture.detectChanges();

            let loadingOverlay = fixture.debugElement.query(By.css('mat-sidenav-container .loading-overlay'));
            expect(loadingOverlay).not.toBeNull();

            let spinner = fixture.debugElement.query(By.css('mat-sidenav-container .loading-overlay mat-spinner'));
            expect(spinner).not.toBeNull();

            connection.mockRespond(new Response(new ResponseOptions({
                body: JSON.stringify({
                    parse: {
                        text: {
                            '*': ''
                        },
                        title: ''
                    }
                })
            })));
        });

        component.onQuerySuccess({
            data: [{
                testLinkField: 'testLinkValue'
            }]
        });

        // Wait for the HTTP response.
        tick(500);
        fixture.detectChanges();

        let hiddenLoadingOverlay = fixture.debugElement.query(By.css('mat-sidenav-container .not-loading-overlay'));
        expect(hiddenLoadingOverlay).not.toBeNull();

        let hiddenSpinner = fixture.debugElement.query(By.css('mat-sidenav-container .not-loading-overlay mat-spinner'));
        expect(hiddenSpinner).not.toBeNull();
    })));

    it('does hide wiki-text tabs if active.wikiText is empty', inject([DomSanitizer], (sanitizer) => {
        fixture.detectChanges();
        let tabs = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group .mat-tab-label'));
        expect(tabs.length).toBe(0);

        let text = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group .wiki-text'));
        expect(text.length).toBe(0);
    }));

    it('does show wiki-text tabs if active.wikiText is not empty', inject([DomSanitizer], (sanitizer) => {
        component.active.wikiName = ['Tab One', 'Tab Two'];
        component.active.wikiText = [sanitizer.bypassSecurityTrustHtml('<p>one</p>'), sanitizer.bypassSecurityTrustHtml('<p>two</p>')];
        fixture.detectChanges();

        expect(component.active.wikiText.length).toBe(2);
        expect(component.active.wikiText[0].toString()).toBe(
            'SafeValue must use [property]=binding: <p>one</p> (see http://g.co/ng/security#xss)');
        expect(component.active.wikiText[1].toString()).toBe(
            'SafeValue must use [property]=binding: <p>two</p> (see http://g.co/ng/security#xss)');

        let tabs = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group .mat-tab-label'));
        expect(tabs.length).toBe(2);
        expect(tabs[0].nativeElement.textContent).toBe('Tab One');
        expect(tabs[0].nativeElement.classList.contains('mat-tab-label-active')).toBe(true);
        expect(tabs[1].nativeElement.textContent).toBe('Tab Two');
        expect(tabs[1].nativeElement.classList.contains('mat-tab-label-active')).toBe(false);

        let text = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group .wiki-text'));
        expect(text.length).toBe(1);
        expect(text[0].nativeElement.innerHTML).toBe('<p>one</p>');
    }));
});

describe('Component: WikiViewer with config', () => {
    let component: WikiViewerComponent;
    let fixture: ComponentFixture<WikiViewerComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                WikiViewerComponent,
                ExportControlComponent
            ],
            providers: [
                ActiveGridService,
                ConnectionService,
                { provide: DatasetService, useClass: DatasetMock },
                ExportService,
                ErrorNotificationService,
                FilterService,
                ThemesService,
                VisualizationService,
                Injector,
                { provide: 'config', useValue: new NeonGTDConfig() },
                { provide: 'database', useValue: 'testDatabase' },
                { provide: 'table', useValue: 'testTable' },
                { provide: 'id', useValue: 'testId' },
                { provide: 'idField', useValue: 'testIdField' },
                { provide: 'linkField', useValue: 'testLinkField' },
                { provide: 'title', useValue: 'Test Title' }
            ],
            imports: [
                AppMaterialModule,
                BrowserAnimationsModule,
                FormsModule,
                HttpModule
            ]
        });
        fixture = TestBed.createComponent(WikiViewerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('does set expected meta properties', (() => {
        let testTable = new TableMetaData('testTable', 'Test Table', DatasetMock.FIELDS);
        let testDatabase = new DatabaseMetaData('testDatabase', 'Test Database');
        testDatabase.tables = [testTable];

        expect(component.meta.database).toEqual(testDatabase);
        expect(component.meta.table).toEqual(testTable);
        expect(component.meta.databases).toEqual([testDatabase]);
        expect(component.meta.tables).toEqual([testTable]);
        expect(component.meta.fields).toEqual(DatasetMock.FIELDS);
    }));

    it('does set expected active properties', (() => {
        expect(component.active).toEqual({
            allowsTranslations: true,
            errorMessage: '',
            id: 'testId',
            idField: new FieldMetaData('testIdField', 'Test ID Field'),
            linkField: new FieldMetaData('testLinkField', 'Test Link Field'),
            textColor: '#111',
            wikiName: [],
            wikiText: []
        });
    }));

    it('getOptionFromConfig does return expected options because config is set', (() => {
        expect(component.getOptionFromConfig('database')).toBe('testDatabase');
        expect(component.getOptionFromConfig('id')).toBe('testId');
        expect(component.getOptionFromConfig('idField')).toBe('testIdField');
        expect(component.getOptionFromConfig('linkField')).toBe('testLinkField');
        expect(component.getOptionFromConfig('table')).toBe('testTable');
        expect(component.getOptionFromConfig('title')).toBe('Test Title');
    }));

    it('onUpdateFields does set expected fields from config', (() => {
        component.onUpdateFields();
        expect(component.active.idField).toEqual(new FieldMetaData('testIdField', 'Test ID Field'));
        expect(component.active.linkField).toEqual(new FieldMetaData('testLinkField', 'Test Link Field'));
    }));

    it('does show header in toolbar with title from config', (() => {
        fixture.detectChanges();
        let header = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toBe('Test Title');
    }));

    it('does show selects in sidenav options menu that have expected options', (() => {
        let testTable = new TableMetaData('testTable', 'Test Table', DatasetMock.FIELDS);
        let testDatabase = new DatabaseMetaData('testDatabase', 'Test Database');
        testDatabase.tables = [testTable];

        fixture.detectChanges();

        let selects = fixture.debugElement.queryAll(
            By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field mat-select'));
        let placeholders = fixture.debugElement.queryAll(
            By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field .mat-form-field-placeholder-wrapper'));
        expect(selects.length).toBe(4);
        expect(placeholders.length).toBe(4);

        expect(selects[0].componentInstance.disabled).toBe(true);
        expect(placeholders[0].nativeElement.textContent).toContain('Database');
        expect(selects[0].componentInstance.options.toArray().length).toBe(1);
        expect(selects[0].componentInstance.options.toArray()[0].value).toEqual(testDatabase);

        expect(selects[1].componentInstance.disabled).toBe(true);
        expect(placeholders[1].nativeElement.textContent).toContain('Table');
        expect(selects[1].componentInstance.options.toArray().length).toBe(1);
        expect(selects[1].componentInstance.options.toArray()[0].value).toEqual(testTable);

        expect(selects[2].componentInstance.disabled).toBe(false);
        expect(placeholders[2].nativeElement.textContent).toContain('ID Field');
        expect(selects[2].componentInstance.options.toArray().length).toEqual(DatasetMock.FIELDS.length);

        expect(selects[3].componentInstance.disabled).toBe(false);
        expect(placeholders[3].nativeElement.textContent).toContain('Link Field');
        expect(selects[3].componentInstance.options.toArray().length).toEqual(DatasetMock.FIELDS.length);

        // TODO How can we test the selected values?
    }));
});
