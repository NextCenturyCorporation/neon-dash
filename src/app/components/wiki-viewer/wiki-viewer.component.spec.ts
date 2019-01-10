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
import { async, ComponentFixture, fakeAsync, inject, TestBed } from '@angular/core/testing';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { Injector } from '@angular/core';
import { NeonGTDConfig } from '../../neon-gtd-config';

import {} from 'jasmine-core';
import * as neon from 'neon-framework';

import { ExportControlComponent } from '../export-control/export-control.component';
import { WikiViewerComponent } from './wiki-viewer.component';

import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';

import { TransformedVisualizationData } from '../base-neon-component/base-neon.component';
import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

describe('Component: WikiViewer', () => {
    let component: WikiViewerComponent;
    let fixture: ComponentFixture<WikiViewerComponent>;

    initializeTestBed({
        declarations: [
            WikiViewerComponent,
            ExportControlComponent
        ],
        providers: [
            ConnectionService,
            DatasetService,
            FilterService,
            Injector,
            { provide: 'config', useValue: new NeonGTDConfig() }
        ],
        imports: [
            AppMaterialModule,
            BrowserAnimationsModule,
            FormsModule,
            HttpClientModule,
            HttpClientTestingModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WikiViewerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('exists', (() => {
        expect(component).toBeTruthy();
    }));

    it('does set expected options properties', () => {
        expect(component.options.idField).toEqual(new FieldMetaData());
        expect(component.options.linkField).toEqual(new FieldMetaData());
        expect(component.options.id).toEqual('');
    });

    it('finalizeVisualizationQuery does return expected query', (() => {
        component.options.database = new DatabaseMetaData('testDatabase');
        component.options.table = new TableMetaData('testTable');
        component.options.id = 'testId';
        component.options.idField = new FieldMetaData('testIdField');
        component.options.linkField = new FieldMetaData('testLinkField');

        let inputQuery = new neon.query.Query()
            .selectFrom('testDatabase', 'testTable')
            .withFields(['testLinkField']);

        let whereClauses = [
            neon.query.where('testIdField', '=', 'testId'),
            neon.query.where('testLinkField', '!=', null)
        ];

        let query = new neon.query.Query()
            .selectFrom('testDatabase', 'testTable')
            .withFields(['testLinkField'])
            .where(neon.query.and.apply(neon.query, whereClauses));

        expect(component.finalizeVisualizationQuery(component.options, inputQuery, [])).toEqual(query);
    }));

    it('getElementRefs does return expected object', () => {
        let refs = component.getElementRefs();
        expect(refs.headerText).toBeDefined();
        expect(refs.infoText).toBeDefined();
        expect(refs.visualization).toBeDefined();
    });

    it('getFiltersToIgnore does return null', (() => {
        expect(component.getFiltersToIgnore()).toBeNull();
    }));

    it('getFilterText does return empty string', (() => {
        expect(component.getFilterText({})).toBe('');
        expect(component.getFilterText({
            value: 'testValue'
        })).toBe('');
    }));

    it('validateVisualizationQuery does return expected result', (() => {
        expect(component.validateVisualizationQuery(component.options)).toBe(false);

        component.options.database = new DatabaseMetaData('testDatabase');
        expect(component.validateVisualizationQuery(component.options)).toBe(false);

        component.options.table = new TableMetaData('testTable');
        expect(component.validateVisualizationQuery(component.options)).toBe(false);

        component.options.id = 'testId';
        expect(component.validateVisualizationQuery(component.options)).toBe(false);
        expect(component.options.idField).toEqual(new FieldMetaData());
        expect(component.options.linkField).toEqual(new FieldMetaData());

        component.options.idField = new FieldMetaData('testIdField');
        expect(component.validateVisualizationQuery(component.options)).toBe(false);

        component.options.linkField = new FieldMetaData('testLinkField');
        expect(component.validateVisualizationQuery(component.options)).toBe(true);
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

    it('does show toolbar and sidenav', (() => {
        fixture.detectChanges();
        let toolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar'));
        expect(toolbar).not.toBeNull();
    }));

    it('does show header in toolbar with visualization name', (() => {
        fixture.detectChanges();
        let header = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toBe('Wiki Viewer');
    }));

    it('does hide error-message in toolbar and sidenav if errorMessage is undefined', (() => {
        fixture.detectChanges();
        let errorMessageInToolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .error-message'));
        expect(errorMessageInToolbar).toBeNull();
    }));

    it('does show settings icon button in toolbar', (() => {
        fixture.detectChanges();
        let button = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar button'));
        expect(button.attributes.matTooltip).toBe('Open/Close the Options Menu');

        let icon = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar button mat-icon'));
        expect(icon.nativeElement.textContent).toBe('settings');
    }));

    it('does hide loading overlay by default', (() => {
        fixture.detectChanges();

        let hiddenLoadingOverlay = fixture.debugElement.query(By.css('mat-sidenav-container .not-loading-overlay'));
        expect(hiddenLoadingOverlay).not.toBeNull();

        let hiddenSpinner = fixture.debugElement.query(By.css('mat-sidenav-container .not-loading-overlay mat-spinner'));
        expect(hiddenSpinner).not.toBeNull();
    }));

    it('does hide wiki-text tabs if active data is empty', inject([DomSanitizer], (sanitizer) => {
        fixture.detectChanges();
        let tabs = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group .mat-tab-label'));
        expect(tabs.length).toBe(0);

        let text = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group .wiki-text'));
        expect(text.length).toBe(0);
    }));
});

describe('Component: WikiViewer with mock HTTP', () => {
    let component: WikiViewerComponent;
    let fixture: ComponentFixture<WikiViewerComponent>;
    let backend;

    initializeTestBed({
        declarations: [
            WikiViewerComponent,
            ExportControlComponent
        ],
        providers: [
            ConnectionService,
            DatasetService,
            FilterService,
            Injector,
            { provide: 'config', useValue: new NeonGTDConfig() }
        ],
        imports: [
            AppMaterialModule,
            BrowserAnimationsModule,
            FormsModule,
            HttpClientModule,
            HttpClientTestingModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WikiViewerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    beforeEach(inject([HttpTestingController], (injectedBackend) => {
        backend = injectedBackend;
    }));

    it('handleTransformVisualizationQueryResults with no data does call callback function with expected data', (done) => {
        (component as any).errorMessage = 'testErrorMessage';

        let successCallback = (data) => {
            expect(data.data).toEqual([]);
            done();
        };

        let failureCallback = (data) => {
            fail();
            done();
        };

        component.handleTransformVisualizationQueryResults(component.options, [], successCallback, failureCallback);
    });

    it('handleTransformVisualizationQueryResults with data does call http.get', (done) => {
        component.options.linkField.columnName = 'testLinkField';

        let successCallback = (data) => {
            expect(data.data.length).toEqual(1);
            expect(data.data[0].name).toEqual('Test Title');
            expect(data.data[0].text.toString()).toBe(
                'SafeValue must use [property]=binding: <p>Test Content</p> (see http://g.co/ng/security#xss)');
            done();
        };

        let failureCallback = (data) => {
            fail();
            done();
        };

        component.handleTransformVisualizationQueryResults(component.options, [{
            testLinkField: 'testLinkValue'
        }], successCallback, failureCallback);

        let request = backend.expectOne({
            url: 'https://en.wikipedia.org/w/api.php?action=parse&format=json&origin=*&prop=text&page=testLinkValue',
            method: 'GET'
        });
        request.flush({
            body: JSON.stringify({
                parse: {
                    text: {
                        '*': '<p>Test Content</p>'
                    },
                    title: 'Test Title'
                }
            })
        });
    });

    it('handleTransformVisualizationQueryResults on fail does call http.get', (done) => {
        component.options.linkField.columnName = 'testLinkField';

        let successCallback = (data) => {
            expect(data.data.length).toEqual(1);
            expect(data.data[0].name).toEqual('testLinkValue');
            expect(data.data[0].text.toString()).toBe('Missing Title: The page you specified doesn\'t exist.');
            done();
        };

        let failureCallback = (data) => {
            fail();
            done();
        };

        component.handleTransformVisualizationQueryResults(component.options, [{
            testLinkField: 'testLinkValue'
        }], successCallback, failureCallback);

        let request = backend.expectOne({
            url: 'https://en.wikipedia.org/w/api.php?action=parse&format=json&origin=*&prop=text&page=testLinkValue',
            method: 'GET'
        });
        request.flush({
            error: {
                code: 'Missing Title',
                info: 'The page you specified doesn\'t exist.'
            }
        });
    });

    it('handleTransformVisualizationQueryResults with multiple links does call http.get multiple times', (done) => {
        component.options.linkField.columnName = 'testLinkField';

        let successCallback = (data) => {
            expect(data.data.length).toEqual(2);
            expect(data.data[0].name).toEqual('Test Title 1');
            expect(data.data[1].name).toEqual('Test Title 2');
            expect(data.data[0].text.toString()).toBe(
                'SafeValue must use [property]=binding: <p>Test Content 1</p> (see http://g.co/ng/security#xss)');
            expect(data.data[1].text.toString()).toBe(
                'SafeValue must use [property]=binding: <p>Test Content 2</p> (see http://g.co/ng/security#xss)');
            done();
        };

        let failureCallback = (data) => {
            fail();
            done();
        };

        component.handleTransformVisualizationQueryResults(component.options, [{
            testLinkField: ['testLinkValue1', 'testLinkValue2']
        }], successCallback, failureCallback);

        let request1 = backend.expectOne({
            url: 'https://en.wikipedia.org/w/api.php?action=parse&format=json&origin=*&prop=text&page=testLinkValue1',
            method: 'GET'
        });
        request1.flush({
            body: JSON.stringify({
                parse: {
                    text: {
                        '*': '<p>Test Content 1</p>'
                    },
                    title: 'Test Title 1'
                }
            })
        });

        let request2 = backend.expectOne({
            url: 'https://en.wikipedia.org/w/api.php?action=parse&format=json&origin=*&prop=text&page=testLinkValue2',
            method: 'GET'
        });
        request2.flush({
            body: JSON.stringify({
                parse: {
                    text: {
                        '*': '<p>Test Content 2</p>'
                    },
                    title: 'Test Title 2'
                }
            })
        });
    });
});

describe('Component: WikiViewer with config', () => {
    let component: WikiViewerComponent;
    let fixture: ComponentFixture<WikiViewerComponent>;

    initializeTestBed({
        declarations: [
            WikiViewerComponent,
            ExportControlComponent
        ],
        providers: [
            ConnectionService,
            { provide: DatasetService, useClass: DatasetServiceMock },
            FilterService,
            Injector,
            { provide: 'config', useValue: new NeonGTDConfig() },
            { provide: 'database', useValue: 'testDatabase1' },
            { provide: 'table', useValue: 'testTable1' },
            { provide: 'id', useValue: 'testId' },
            { provide: 'idField', useValue: 'testIdField' },
            { provide: 'linkField', useValue: 'testLinkField' },
            { provide: 'title', useValue: 'Test Title' }
        ],
        imports: [
            AppMaterialModule,
            BrowserAnimationsModule,
            FormsModule,
            HttpClientModule,
            HttpClientTestingModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WikiViewerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('does set expected superclass options properties', (() => {
        expect(component.options.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(component.options.databases).toEqual(DatasetServiceMock.DATABASES);
        expect(component.options.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(component.options.tables).toEqual(DatasetServiceMock.TABLES);
        expect(component.options.fields).toEqual(DatasetServiceMock.FIELDS);
    }));

    it('does set expected options properties', () => {
        expect(component.options.idField).toEqual(new FieldMetaData('testIdField', 'Test ID Field', false, 'string'));
        expect(component.options.linkField).toEqual(new FieldMetaData('testLinkField', 'Test Link Field', false, 'string'));
        expect(component.options.id).toEqual('testId');
    });

    it('does show header in toolbar with title from config', (() => {
        fixture.detectChanges();
        let header = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toBe('Test Title');
    }));
});
