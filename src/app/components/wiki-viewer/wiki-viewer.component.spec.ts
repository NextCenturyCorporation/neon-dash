/**
 * Copyright 2019 Next Century Corporation
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
 */
import { By } from '@angular/platform-browser';
import { ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { DatabaseConfig, FieldConfig, TableConfig } from '@caci-critical-insight-solutions/nucleus-core';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';

import { } from 'jasmine-core';

import { WikiViewerComponent } from './wiki-viewer.component';

import { AbstractSearchService } from '@caci-critical-insight-solutions/nucleus-core';
import { DashboardService } from '../../services/dashboard.service';
import { InjectableFilterService } from '../../services/injectable.filter.service';

import { DashboardServiceMock } from '../../services/mock.dashboard-service';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { SearchServiceMock } from '@caci-critical-insight-solutions/nucleus-core';

import { WikiViewerModule } from './wiki-viewer.module';
import { CoreSearch } from '@caci-critical-insight-solutions/nucleus-core';

describe('Component: WikiViewer', () => {
    let component: WikiViewerComponent;
    let fixture: ComponentFixture<WikiViewerComponent>;

    initializeTestBed('Wiki Viewer', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock },
            InjectableFilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock }

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
        expect(component.options.idField).toEqual(FieldConfig.get());
        expect(component.options.linkField).toEqual(FieldConfig.get());
        expect(component.options.id).toEqual('');
    });

    it('finalizeVisualizationQuery does return expected query', (() => {
        component.options.database = DatabaseConfig.get({ name: 'testDatabase1' });
        component.options.table = TableConfig.get({ name: 'testTable1' });
        component.options.id = 'testId';
        component.options.idField = FieldConfig.get({ columnName: 'testIdField' });
        component.options.linkField = FieldConfig.get({ columnName: 'testLinkField' });

        let searchObject = new CoreSearch(component.options.database.name, component.options.table.name);

        expect(JSON.parse(JSON.stringify(component.finalizeVisualizationQuery(component.options, searchObject, [])))).toEqual({
            selectClause: {
                database: 'testDatabase1',
                table: 'testTable1',
                fieldClauses: []
            },
            whereClause: {
                type: 'and',
                whereClauses: [{
                    type: 'where',
                    lhs: {
                        database: 'testDatabase1',
                        table: 'testTable1',
                        field: 'testIdField'
                    },
                    operator: '=',
                    rhs: 'testId'
                }, {
                    type: 'where',
                    lhs: {
                        database: 'testDatabase1',
                        table: 'testTable1',
                        field: 'testLinkField'
                    },
                    operator: '!=',
                    rhs: null
                }]
            },
            aggregateClauses: [],
            groupByClauses: [],
            orderByClauses: [],
            limitClause: null,
            offsetClause: null,
            joinClauses: [],
            isDistinct: false
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

        component.options.database = DatabaseConfig.get({ name: 'testDatabase' });
        expect(component.validateVisualizationQuery(component.options)).toBe(false);

        component.options.table = TableConfig.get({ name: 'testTable' });
        expect(component.validateVisualizationQuery(component.options)).toBe(false);

        component.options.id = 'testId';
        expect(component.validateVisualizationQuery(component.options)).toBe(false);
        expect(component.options.idField).toEqual(FieldConfig.get());
        expect(component.options.linkField).toEqual(FieldConfig.get());

        component.options.idField = FieldConfig.get({ columnName: 'testIdField' });
        expect(component.validateVisualizationQuery(component.options)).toBe(false);

        component.options.linkField = FieldConfig.get({ columnName: 'testLinkField' });
        expect(component.validateVisualizationQuery(component.options)).toBe(true);
    }));

    it('does show toolbar and sidenav', (() => {
        let toolbar = fixture.debugElement.query(By.css('mat-toolbar'));
        expect(toolbar).not.toBeNull();
    }));

    it('does show header in toolbar with visualization name', (() => {
        let header = fixture.debugElement.query(By.css('mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toBe('Wiki Viewer');
    }));

    it('does hide error-message in toolbar and sidenav if errorMessage is undefined', (() => {
        let errorMessageInToolbar = fixture.debugElement.query(By.css('mat-toolbar .error-message'));
        expect(errorMessageInToolbar).toBeNull();
    }));

    it('does hide loading overlay by default', (() => {
        let hiddenLoadingOverlay = fixture.debugElement.query(By.css('.not-loading-overlay'));
        expect(hiddenLoadingOverlay).not.toBeNull();

        let hiddenSpinner = fixture.debugElement.query(By.css('.not-loading-overlay mat-spinner'));
        expect(hiddenSpinner).not.toBeNull();
    }));

    it('does hide wiki-text tabs if active data is empty', () => {
        let tabs = fixture.debugElement.queryAll(By.css('mat-tab-group .mat-tab-label'));
        expect(tabs.length).toBe(0);

        let text = fixture.debugElement.queryAll(By.css('mat-tab-group .wiki-text'));
        expect(text.length).toBe(0);
    });
});

describe('Component: WikiViewer with mock HTTP', () => {
    let component: WikiViewerComponent;
    let fixture: ComponentFixture<WikiViewerComponent>;
    let backend;

    initializeTestBed('Wiki Viewer', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock },
            InjectableFilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock }

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
            parse: {
                text: {
                    '*': '<p>Test Content</p>'
                },
                title: 'Test Title'
            }
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
            parse: {
                text: {
                    '*': '<p>Test Content 1</p>'
                },
                title: 'Test Title 1'
            }
        });

        let request2 = backend.expectOne({
            url: 'https://en.wikipedia.org/w/api.php?action=parse&format=json&origin=*&prop=text&page=testLinkValue2',
            method: 'GET'
        });
        request2.flush({
            parse: {
                text: {
                    '*': '<p>Test Content 2</p>'
                },
                title: 'Test Title 2'
            }
        });
    });
});

describe('Component: WikiViewer with config', () => {
    let component: WikiViewerComponent;
    let fixture: ComponentFixture<WikiViewerComponent>;

    initializeTestBed('Wiki Viewer', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock },
            InjectableFilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock }
        ],
        imports: [
            WikiViewerModule,
            HttpClientTestingModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WikiViewerComponent);
        component = fixture.componentInstance;
        component.configOptions = {
            tableKey: 'table_key_1',
            id: 'testId',
            idField: 'testIdField',
            linkField: 'testLinkField',
            title: 'Test Title'
        };
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
        expect(component.options.idField).toEqual(DashboardServiceMock.FIELD_MAP.ID);
        expect(component.options.linkField).toEqual(DashboardServiceMock.FIELD_MAP.LINK);
        expect(component.options.id).toEqual('testId');
    });

    it('does show header in toolbar with title from config', (() => {
        fixture.detectChanges();
        let header = fixture.debugElement.query(By.css('mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toBe('Test Title');
    }));
});
