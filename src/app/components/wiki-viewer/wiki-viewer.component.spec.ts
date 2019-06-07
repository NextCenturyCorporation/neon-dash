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
import { By } from '@angular/platform-browser';
import { ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { NeonConfig, NeonDatabaseMetaData, NeonFieldMetaData, NeonTableMetaData } from '../../types';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { Injector } from '@angular/core';

import { } from 'jasmine-core';

import { WikiViewerComponent } from './wiki-viewer.component';

import { AbstractSearchService } from '../../services/abstract.search.service';
import { DashboardService } from '../../services/dashboard.service';
import { FilterService } from '../../services/filter.service';

import { DashboardServiceMock } from '../../../testUtils/MockServices/DashboardServiceMock';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';

import { WikiViewerModule } from './wiki-viewer.module';

import { ConfigService } from '../../services/config.service';

describe('Component: WikiViewer', () => {
    let component: WikiViewerComponent;
    let fixture: ComponentFixture<WikiViewerComponent>;

    initializeTestBed('Wiki Viewer', {
        providers: [
            DashboardService,
            FilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            Injector,
            { provide: ConfigService, useValue: ConfigService.as(NeonConfig.get()) }

        ],
        imports: [
            WikiViewerModule,
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

    it('does set expected default options properties', () => {
        expect(component.options.idField).toEqual(NeonFieldMetaData.get());
        expect(component.options.linkField).toEqual(NeonFieldMetaData.get());
        expect(component.options.id).toEqual('');
    });

    it('finalizeVisualizationQuery does return expected query', (() => {
        component.options.database = NeonDatabaseMetaData.get({ name: 'testDatabase' });
        component.options.table = NeonTableMetaData.get({ name: 'testTable' });
        component.options.id = 'testId';
        component.options.idField = NeonFieldMetaData.get({ columnName: 'testIdField' });
        component.options.linkField = NeonFieldMetaData.get({ columnName: 'testLinkField' });

        expect(component.finalizeVisualizationQuery(component.options, {}, [])).toEqual({
            filter: {
                filters: [{
                    field: 'testIdField',
                    operator: '=',
                    value: 'testId'
                }, {
                    field: 'testLinkField',
                    operator: '!=',
                    value: null
                }],
                type: 'and'
            }
        });
    }));

    it('getElementRefs does return expected object', () => {
        let refs = component.getElementRefs();
        expect(refs.headerText).toBeDefined();
        expect(refs.infoText).toBeDefined();
        expect(refs.visualization).toBeDefined();
    });

    it('validateVisualizationQuery does return expected result', (() => {
        expect(component.validateVisualizationQuery(component.options)).toBe(false);

        component.options.database = NeonDatabaseMetaData.get({ name: 'testDatabase' });
        expect(component.validateVisualizationQuery(component.options)).toBe(false);

        component.options.table = NeonTableMetaData.get({ name: 'testTable' });
        expect(component.validateVisualizationQuery(component.options)).toBe(false);

        component.options.id = 'testId';
        expect(component.validateVisualizationQuery(component.options)).toBe(false);
        expect(component.options.idField).toEqual(NeonFieldMetaData.get());
        expect(component.options.linkField).toEqual(NeonFieldMetaData.get());

        component.options.idField = NeonFieldMetaData.get({ columnName: 'testIdField' });
        expect(component.validateVisualizationQuery(component.options)).toBe(false);

        component.options.linkField = NeonFieldMetaData.get({ columnName: 'testLinkField' });
        expect(component.validateVisualizationQuery(component.options)).toBe(true);
    }));

    it('refreshVisualization does call changeDetection.detectChanges', (() => {
        let spy = spyOn(component.changeDetection, 'detectChanges');
        component.refreshVisualization();
        expect(spy.calls.count()).toBe(1);
    }));

    it('does show toolbar and sidenav', (() => {
        let toolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar'));
        expect(toolbar).not.toBeNull();
    }));

    it('does show header in toolbar with visualization name', (() => {
        let header = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toBe('Wiki Viewer');
    }));

    it('does hide error-message in toolbar and sidenav if errorMessage is undefined', (() => {
        let errorMessageInToolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .error-message'));
        expect(errorMessageInToolbar).toBeNull();
    }));

    it('does show settings icon button in toolbar', (() => {
        let button = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar button'));
        expect(button.attributes.matTooltip).toBe('Open/Close the Options Menu');

        let icon = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar button mat-icon'));
        expect(icon.nativeElement.textContent).toBe('settings');
    }));

    it('does hide loading overlay by default', (() => {
        let hiddenLoadingOverlay = fixture.debugElement.query(By.css('mat-sidenav-container .not-loading-overlay'));
        expect(hiddenLoadingOverlay).not.toBeNull();

        let hiddenSpinner = fixture.debugElement.query(By.css('mat-sidenav-container .not-loading-overlay mat-spinner'));
        expect(hiddenSpinner).not.toBeNull();
    }));

    it('does hide wiki-text tabs if active data is empty', () => {
        let tabs = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group .mat-tab-label'));
        expect(tabs.length).toBe(0);

        let text = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group .wiki-text'));
        expect(text.length).toBe(0);
    });
});

describe('Component: WikiViewer with mock HTTP', () => {
    let component: WikiViewerComponent;
    let fixture: ComponentFixture<WikiViewerComponent>;
    let backend;

    initializeTestBed('Wiki Viewer', {
        providers: [
            DashboardService,
            FilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            Injector,
            { provide: ConfigService, useValue: ConfigService.as(NeonConfig.get()) }

        ],
        imports: [
            WikiViewerModule,
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

        let successCallback = (elementCount) => {
            expect(elementCount).toEqual(0);
            done();
        };

        let failureCallback = () => {
            fail();
            done();
        };

        (component as any).handleTransformVisualizationQueryResults(component.options, [], successCallback, failureCallback);
    });

    it('handleTransformVisualizationQueryResults with data does call http.get', (done) => {
        component.options.linkField.columnName = 'testLinkField';

        let successCallback = (elementCount) => {
            expect(elementCount).toEqual(1);
            expect(component.wikiViewerData.length).toEqual(1);
            expect(component.wikiViewerData[0].name).toEqual('Test Title');
            expect(component.wikiViewerData[0].text.toString()).toBe(
                'SafeValue must use [property]=binding: <p>Test Content</p> (see http://g.co/ng/security#xss)'
            );
            done();
        };

        let failureCallback = () => {
            fail();
            done();
        };

        (component as any).handleTransformVisualizationQueryResults(component.options, [{
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

        let successCallback = (elementCount) => {
            expect(elementCount).toEqual(1);
            expect(component.wikiViewerData.length).toEqual(1);
            expect(component.wikiViewerData[0].name).toEqual('testLinkValue');
            expect(component.wikiViewerData[0].text.toString()).toBe('Missing Title: The page you specified doesn\'t exist.');
            done();
        };

        let failureCallback = () => {
            fail();
            done();
        };

        (component as any).handleTransformVisualizationQueryResults(component.options, [{
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

        let successCallback = (elementCount) => {
            expect(elementCount).toEqual(2);
            expect(component.wikiViewerData.length).toEqual(2);
            expect(component.wikiViewerData[0].name).toEqual('Test Title 1');
            expect(component.wikiViewerData[1].name).toEqual('Test Title 2');
            expect(component.wikiViewerData[0].text.toString()).toBe(
                'SafeValue must use [property]=binding: <p>Test Content 1</p> (see http://g.co/ng/security#xss)'
            );
            expect(component.wikiViewerData[1].text.toString()).toBe(
                'SafeValue must use [property]=binding: <p>Test Content 2</p> (see http://g.co/ng/security#xss)'
            );
            done();
        };

        let failureCallback = () => {
            fail();
            done();
        };

        (component as any).handleTransformVisualizationQueryResults(component.options, [{
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

    initializeTestBed('Wiki Viewer', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock },
            FilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            Injector,
            { provide: ConfigService, useValue: ConfigService.as(NeonConfig.get()) },
            { provide: 'tableKey', useValue: 'table_key_1' },
            { provide: 'id', useValue: 'testId' },
            { provide: 'idField', useValue: 'testIdField' },
            { provide: 'linkField', useValue: 'testLinkField' },
            { provide: 'title', useValue: 'Test Title' }
        ],
        imports: [
            WikiViewerModule,
            HttpClientTestingModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WikiViewerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('does set expected superclass options properties', (() => {
        expect(component.options.database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(component.options.databases).toEqual(DashboardServiceMock.DATABASES_LIST);
        expect(component.options.table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(component.options.tables).toEqual(DashboardServiceMock.TABLES_LIST);
        expect(component.options.fields).toEqual(DashboardServiceMock.FIELDS);
    }));

    it('does set expected options properties', () => {
        expect(component.options.idField).toEqual(NeonFieldMetaData.get({ columnName: 'testIdField', prettyName: 'Test ID Field', hide: false, type: 'string' }));
        expect(component.options.linkField).toEqual(NeonFieldMetaData.get({ columnName: 'testLinkField', prettyName: 'Test Link Field', hide: false, type: 'string' }));
        expect(component.options.id).toEqual('testId');
    });

    it('does show header in toolbar with title from config', (() => {
        fixture.detectChanges();
        let header = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toBe('Test Title');
    }));
});
