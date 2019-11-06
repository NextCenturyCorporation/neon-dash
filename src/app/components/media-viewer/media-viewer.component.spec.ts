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
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DatabaseConfig, FieldConfig, TableConfig } from 'component-library/dist/core/models/dataset';
import { MediaTypes } from '../../models/types';

import { } from 'jasmine-core';

import { MediaViewerComponent } from './media-viewer.component';

import { AbstractSearchService } from 'component-library/dist/core/services/abstract.search.service';
import { FilterCollection } from 'component-library/dist/core/models/filters';
import { DashboardService } from '../../services/dashboard.service';
import { InjectableFilterService } from '../../services/injectable.filter.service';
import { DashboardServiceMock } from '../../services/mock.dashboard-service';
import { SearchServiceMock } from 'component-library/dist/core/services/mock.search.service';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

import { MediaViewerModule } from './media-viewer.module';

describe('Component: MediaViewer', () => {
    let component: MediaViewerComponent;
    let fixture: ComponentFixture<MediaViewerComponent>;

    initializeTestBed('Media Viewer', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock },
            InjectableFilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock }
        ],
        imports: [
            MediaViewerModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MediaViewerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('exists', () => {
        expect(component).toBeTruthy();
    });

    it('does have expected default class options properties', () => {
        expect(component.options.id).toEqual('');
        expect(component.options.linkPrefix).toEqual('');
        expect(component.options.resize).toEqual(true);
        expect(component.options.typeMap).toEqual({});
        expect(component.options.url).toEqual('');
        expect(component.options.idField).toEqual(FieldConfig.get());
        expect(component.options.linkField).toEqual(FieldConfig.get());
        expect(component.options.linkFields).toEqual([]);
        expect(component.options.nameField).toEqual(FieldConfig.get());
        expect(component.options.typeField).toEqual(FieldConfig.get());
        expect(component.options.autoplay).toEqual(false);
    });

    it('does have expected default class properties', () => {
        expect(component.mediaTypes).toEqual(MediaTypes);
    });

    it('finalizeVisualizationQuery does return expected query', (() => {
        component.options.database = DatabaseConfig.get({ name: 'testDatabase' });
        component.options.table = TableConfig.get({ name: 'testTable' });
        component.options.id = 'testId';
        component.options.idField = DashboardServiceMock.FIELD_MAP.ID;
        component.options.linkFields = [DashboardServiceMock.FIELD_MAP.LINK];
        component.options.nameField = DashboardServiceMock.FIELD_MAP.NAME;
        component.options.typeField = DashboardServiceMock.FIELD_MAP.TYPE;

        expect(component.finalizeVisualizationQuery(component.options, {}, [])).toEqual({
            filter: {
                filters: [{
                    field: 'testLinkField',
                    operator: '!=',
                    value: null
                }, {
                    field: 'testIdField',
                    operator: '=',
                    value: 'testId'
                }],
                type: 'and'
            }
        });
    }));

    it('finalizeVisualizationQuery with no ID field does return expected query', (() => {
        component.options.database = DatabaseConfig.get({ name: 'testDatabase' });
        component.options.table = TableConfig.get({ name: 'testTable' });
        component.options.id = 'testId';
        component.options.linkFields = [DashboardServiceMock.FIELD_MAP.LINK];
        component.options.nameField = DashboardServiceMock.FIELD_MAP.NAME;
        component.options.typeField = DashboardServiceMock.FIELD_MAP.TYPE;

        expect(component.finalizeVisualizationQuery(component.options, {}, [])).toEqual({
            filter: {
                field: 'testLinkField',
                operator: '!=',
                value: null
            }
        });
    }));

    it('finalizeVisualizationQuery with sort field does return expected query', (() => {
        component.options.database = DatabaseConfig.get({ name: 'testDatabase' });
        component.options.table = TableConfig.get({ name: 'testTable' });
        component.options.id = 'testId';
        component.options.idField = DashboardServiceMock.FIELD_MAP.ID;
        component.options.linkFields = [DashboardServiceMock.FIELD_MAP.LINK];
        component.options.nameField = DashboardServiceMock.FIELD_MAP.NAME;
        component.options.sortField = DashboardServiceMock.FIELD_MAP.SORT;
        component.options.typeField = DashboardServiceMock.FIELD_MAP.TYPE;

        expect(component.finalizeVisualizationQuery(component.options, {}, [])).toEqual({
            filter: {
                filters: [{
                    field: 'testLinkField',
                    operator: '!=',
                    value: null
                }, {
                    field: 'testIdField',
                    operator: '=',
                    value: 'testId'
                }],
                type: 'and'
            },
            sort: {
                field: 'testSortField',
                order: 1
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

        component.options.database = DatabaseConfig.get({ name: 'testDatabase' });
        expect(component.validateVisualizationQuery(component.options)).toBe(false);

        component.options.table = TableConfig.get({ name: 'testTable' });
        expect(component.validateVisualizationQuery(component.options)).toBe(false);

        component.options.id = 'testId';
        expect(component.validateVisualizationQuery(component.options)).toBe(false);

        component.options.idField = DashboardServiceMock.FIELD_MAP.ID;
        expect(component.validateVisualizationQuery(component.options)).toBe(false);

        component.options.linkFields = [DashboardServiceMock.FIELD_MAP.LINK];
        expect(component.validateVisualizationQuery(component.options)).toBe(true);
    }));

    it('transformVisualizationQueryResults does set expected properties with no data', (() => {
        component.media = {
            loaded: false,
            name: 'testTabName1',
            selected: {
                border: '',
                link: 'testLink1',
                name: 'testName1',
                type: ''
            },
            list: [{
                border: '',
                link: 'testLink1',
                name: 'testName1',
                type: ''
            }]
        };

        component.transformVisualizationQueryResults(component.options, [], new FilterCollection());

        expect(component.media.selected).toEqual(undefined);
        expect(component.media.list).toEqual([]);
    }));

    it('transformVisualizationQueryResults does reset options.id and return correct error if filter is selected', (() => {
        component.options.idField = FieldConfig.get({ columnName: 'testIdField' });
        component.options.linkField = FieldConfig.get({ columnName: 'testLinkField' });
        component.options.nameField = FieldConfig.get({ columnName: 'testNameField' });
        component.options.typeField = FieldConfig.get({ columnName: 'testTypeField' });
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.id = 'testId';
        component.options.clearMedia = true;
        (component as any).isFiltered = () => false;

        component.transformVisualizationQueryResults(component.options, [{
            testIdField: 'testIdValue',
            testLinkField: 'testLinkValue',
            testNameField: 'testNameValue',
            testTypeField: 'testTypeValue'
        }], new FilterCollection());

        expect((component as any).errorMessage).toBe('No Data');
        expect(component.options.id).toBe('_id');
    }));

    it('transformVisualizationQueryResults does set expected properties with selected filter and no data', (() => {
        component.media = {
            loaded: false,
            name: 'testTabName',
            selected: {
                border: '',
                link: 'testLink',
                name: 'testName',
                type: ''
            },
            list: [{
                border: '',
                link: 'testLink',
                name: 'testName',
                type: ''
            }]
        };
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.id = 'testId';
        component.options.clearMedia = false;
        (component as any).isFiltered = () => true;

        component.transformVisualizationQueryResults(component.options, [], new FilterCollection());

        expect(component.media.selected).toEqual(undefined);
        expect(component.media.list).toEqual([]);
    }));

    it('transformVisualizationQueryResults does set expected properties with selected filter and data', () => {
        component.options.idField = DashboardServiceMock.FIELD_MAP.ID;
        component.options.linkFields = [DashboardServiceMock.FIELD_MAP.LINK];
        component.options.nameField = DashboardServiceMock.FIELD_MAP.NAME;
        component.options.typeField = DashboardServiceMock.FIELD_MAP.TYPE;
        component.options.id = 'testId';
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        (component as any).isFiltered = () => true;

        component.transformVisualizationQueryResults(component.options, [{
            testIdField: 'testIdValue',
            testLinkField: 'testLinkValue',
            testNameField: 'testNameValue',
            testTypeField: 'testTypeValue'
        }], new FilterCollection());

        expect(component.media.selected).toEqual({
            border: '',
            link: 'testLinkValue',
            mask: '',
            name: 'testNameValue',
            type: 'testTypeValue'
        });
        expect(component.media.list).toEqual([{
            border: '',
            link: 'testLinkValue',
            mask: '',
            name: 'testNameValue',
            type: 'testTypeValue'
        }]);
    });

    it('transformVisualizationQueryResults does update expected properties', () => {
        component.options.idField = DashboardServiceMock.FIELD_MAP.ID;
        component.options.linkFields = [DashboardServiceMock.FIELD_MAP.LINK];
        component.options.nameField = DashboardServiceMock.FIELD_MAP.NAME;
        component.options.typeField = DashboardServiceMock.FIELD_MAP.TYPE;
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.id = 'testId';
        (component as any).isFiltered = () => true;

        component.media = {
            loaded: false,
            name: '',
            selected: {
                border: '',
                link: 'testLinkValue1',
                name: 'testNameValue1',
                type: 'testTypeValue1'
            },
            list: [{
                border: '',
                link: 'testLinkValue1',
                name: 'testNameValue1',
                type: 'testTypeValue1'
            }]
        };

        component.transformVisualizationQueryResults(component.options, [{
            testIdField: 'testIdValue2',
            testLinkField: 'testLinkValue2',
            testNameField: 'testNameValue2',
            testTypeField: 'testTypeValue2'
        }], new FilterCollection());

        expect(component.media.selected).toEqual({
            border: '',
            link: 'testLinkValue2',
            mask: '',
            name: 'testNameValue2',
            type: 'testTypeValue2'
        });
        expect(component.media.list).toEqual([{
            border: '',
            link: 'testLinkValue2',
            mask: '',
            name: 'testNameValue2',
            type: 'testTypeValue2'
        }]);
    });

    it('transformVisualizationQueryResults does set expected properties with selected filter and data with multiple links', () => {
        component.options.idField = DashboardServiceMock.FIELD_MAP.ID;
        component.options.linkFields = [DashboardServiceMock.FIELD_MAP.LINK];
        component.options.nameField = DashboardServiceMock.FIELD_MAP.NAME;
        component.options.typeField = DashboardServiceMock.FIELD_MAP.TYPE;
        component.options.id = 'testId';
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        (component as any).isFiltered = () => true;

        component.transformVisualizationQueryResults(component.options, [{
            testIdField: 'testIdValue',
            testLinkField: ['testLinkValue1', 'testLinkValue2'],
            testNameField: 'testNameValue',
            testTypeField: 'testTypeValue'
        }], new FilterCollection());

        expect(component.media.selected).toEqual({
            border: '',
            link: 'testLinkValue1',
            mask: '',
            name: 'testNameValue',
            type: 'testTypeValue'
        });
        expect(component.media.list).toEqual([{
            border: '',
            link: 'testLinkValue1',
            mask: '',
            name: 'testNameValue',
            type: 'testTypeValue'
        }, {
            border: '',
            link: 'testLinkValue2',
            mask: '',
            name: 'testNameValue',
            type: 'testTypeValue'
        }]);
    });

    it('transformVisualizationQueryResults does set expected properties with selected filter and data with many multiples', () => {
        component.options.idField = DashboardServiceMock.FIELD_MAP.ID;
        component.options.linkFields = [DashboardServiceMock.FIELD_MAP.LINK];
        component.options.nameField = DashboardServiceMock.FIELD_MAP.NAME;
        component.options.typeField = DashboardServiceMock.FIELD_MAP.TYPE;
        component.options.id = 'testId';
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        (component as any).isFiltered = () => true;

        component.transformVisualizationQueryResults(component.options, [{
            testIdField: 'testIdValue',
            testLinkField: ['testLinkValue1', 'testLinkValue2'],
            testNameField: ['testNameValue1', 'testNameValue2'],
            testTypeField: ['testTypeValue1', 'testTypeValue2']
        }], new FilterCollection());

        expect(component.media.selected).toEqual({
            border: '',
            link: 'testLinkValue1',
            mask: '',
            name: 'testNameValue1',
            type: 'testTypeValue1'
        });
        expect(component.media.list).toEqual([{
            border: '',
            link: 'testLinkValue1',
            mask: '',
            name: 'testNameValue1',
            type: 'testTypeValue1'
        }, {
            border: '',
            link: 'testLinkValue2',
            mask: '',
            name: 'testNameValue2',
            type: 'testTypeValue2'
        }]);
    });

    it('transformVisualizationQueryResults does ignore empty links', () => {
        component.options.idField = DashboardServiceMock.FIELD_MAP.ID;
        component.options.linkFields = [DashboardServiceMock.FIELD_MAP.LINK];
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.id = 'testTabName';
        (component as any).isFiltered = () => true;

        component.transformVisualizationQueryResults(component.options, [{
            testIdField: 'testIdValue',
            testLinkField: ''
        }], new FilterCollection());

        expect(component.media.selected).toEqual(undefined);
        expect(component.media.list).toEqual([]);
    });

    it('transformVisualizationQueryResults does add border if filter selected', () => {
        component.options.idField = DashboardServiceMock.FIELD_MAP.ID;
        component.options.linkFields = [DashboardServiceMock.FIELD_MAP.LINK];
        component.options.border = 'grey';
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.id = 'testId';
        (component as any).isFiltered = () => true;

        component.transformVisualizationQueryResults(component.options, [{
            testIdField: 'testIdValue',
            testLinkField: 'testLinkValue'
        }], new FilterCollection());

        expect(component.media.selected).toEqual({
            border: 'grey',
            link: 'testLinkValue',
            mask: '',
            name: 'testLinkValue',
            type: ''
        });
        expect(component.media.list).toEqual([{
            border: 'grey',
            link: 'testLinkValue',
            mask: '',
            name: 'testLinkValue',
            type: ''
        }]);
    });

    it('transformVisualizationQueryResults does use linkPrefix if filter selected', () => {
        component.options.idField = DashboardServiceMock.FIELD_MAP.ID;
        component.options.linkFields = [DashboardServiceMock.FIELD_MAP.LINK];
        component.options.linkPrefix = 'linkPrefix/';
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.id = 'testId';
        (component as any).isFiltered = () => true;

        component.transformVisualizationQueryResults(component.options, [{
            testIdField: 'testIdValue',
            testLinkField: 'testLinkValue'
        }], new FilterCollection());

        expect(component.media.selected).toEqual({
            border: '',
            link: 'linkPrefix/testLinkValue',
            mask: '',
            name: 'testLinkValue',
            type: ''
        });
        expect(component.media.list).toEqual([{
            border: '',
            link: 'linkPrefix/testLinkValue',
            mask: '',
            name: 'testLinkValue',
            type: ''
        }]);
    });

    it('transformVisualizationQueryResults does ignore existing linkPrefix', () => {
        component.options.idField = DashboardServiceMock.FIELD_MAP.ID;
        component.options.linkFields = [DashboardServiceMock.FIELD_MAP.LINK];
        component.options.linkPrefix = 'linkPrefix/';
        component.options.id = 'testId';

        component.transformVisualizationQueryResults(component.options, [{
            testIdField: 'testIdValue',
            testLinkField: 'linkPrefix/testLinkValue'
        }], new FilterCollection());

        expect(component.media.selected).toEqual({
            border: '',
            link: 'linkPrefix/testLinkValue',
            mask: '',
            name: 'testLinkValue',
            type: ''
        });
        expect(component.media.list).toEqual([{
            border: '',
            link: 'linkPrefix/testLinkValue',
            mask: '',
            name: 'testLinkValue',
            type: ''
        }]);
    });

    it('transformVisualizationQueryResults does remove existing prefix from name', () => {
        component.options.idField = DashboardServiceMock.FIELD_MAP.ID;
        component.options.linkFields = [DashboardServiceMock.FIELD_MAP.LINK];
        component.options.id = 'testId';

        component.transformVisualizationQueryResults(component.options, [{
            testIdField: 'testIdValue',
            testLinkField: 'prefix/testLinkValue'
        }], new FilterCollection());

        expect(component.media.selected).toEqual({
            border: '',
            link: 'prefix/testLinkValue',
            mask: '',
            name: 'testLinkValue',
            type: ''
        });
        expect(component.media.list).toEqual([{
            border: '',
            link: 'prefix/testLinkValue',
            mask: '',
            name: 'testLinkValue',
            type: ''
        }]);
    });

    it('transformVisualizationQueryResults does use typeMap if filter selected', () => {
        component.options.idField = DashboardServiceMock.FIELD_MAP.ID;
        component.options.linkFields = [DashboardServiceMock.FIELD_MAP.LINK];
        component.options.typeMap = {
            avi: 'vid',
            jpg: 'img',
            txt: 'txt',
            wav: 'aud'
        };
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.id = 'testId';
        (component as any).isFiltered = () => true;

        component.transformVisualizationQueryResults(component.options, [{
            testIdField: 'testIdValue',
            testLinkField: ['video.avi', 'image.jpg', 'alpha.txt', 'audio.wav', 'other.xyz']
        }], new FilterCollection());

        expect((component as any).errorMessage).toBe('');
        expect(component.media.selected).toEqual({
            border: '',
            link: 'video.avi',
            mask: '',
            name: 'video.avi',
            type: 'vid'
        });
        expect(component.media.list).toEqual([{
            border: '',
            link: 'video.avi',
            mask: '',
            name: 'video.avi',
            type: 'vid'
        }, {
            border: '',
            link: 'image.jpg',
            mask: '',
            name: 'image.jpg',
            type: 'img'
        }, {
            border: '',
            link: 'alpha.txt',
            mask: '',
            name: 'alpha.txt',
            type: 'txt'
        }, {
            border: '',
            link: 'audio.wav',
            mask: '',
            name: 'audio.wav',
            type: 'aud'
        }, {
            border: '',
            link: 'other.xyz',
            mask: '',
            name: 'other.xyz',
            type: 'xyz'
        }]);
    });

    /** TODO Test transformVisualizationQueryResults if oneTabPerArray is true **/

    it('refreshVisualization does call changeDetection.detectChanges', (() => {
        let spy = spyOn(component.changeDetection, 'detectChanges');
        component.refreshVisualization();
        expect(spy.calls.count()).toBe(1);
    }));

    it('sanitize function cleans url', (() => {
        component.options.url = 'https://kafka.apache.org/intro';
        expect(component.sanitize(component.options.url).toString()).toBe(
            'SafeValue must use [property]=binding: https://kafka.apache.org/intro (see http://g.co/ng/security#xss)'
        );
    }));

    it('does show toolbar', (() => {
        let container = fixture.debugElement;
        expect(container).not.toBeNull();
        let toolbar = fixture.debugElement.query(By.css('mat-toolbar'));
        expect(toolbar).not.toBeNull();
    }));

    it('does show header in toolbar with visualization name', (() => {
        let header = fixture.debugElement.query(By.css('mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toContain('Media Viewer');
    }));

    it('does hide error-message in toolbar if errorMessage is undefined', (() => {
        let errorMessageInToolbar = fixture.debugElement.query(By.css('mat-toolbar .error-message'));
        expect(errorMessageInToolbar).toBeNull();
    }));

    it('does show error-message in toolbar if errorMessage is defined', async(() => {
        (component as any).errorMessage = 'Test Error Message';
        component.changeDetection.detectChanges();

        let errorMessageInToolbar = fixture.debugElement.query(By.css('mat-toolbar .error-message'));
        expect(errorMessageInToolbar).not.toBeNull();
        expect(errorMessageInToolbar.nativeElement.textContent.indexOf('Test Error Message')).not.toEqual(-1);
    }));

    it('does hide loading overlay by default', (() => {
        let hiddenLoadingOverlay = fixture.debugElement.query(By.css('.not-loading-overlay'));
        expect(hiddenLoadingOverlay).not.toBeNull();

        let hiddenSpinner = fixture.debugElement.query(By.css('.not-loading-overlay mat-spinner'));
        expect(hiddenSpinner).not.toBeNull();
    }));

    it('does show loading overlay if loadingCount is positive', async(() => {
        (component as any).loadingCount = 1;
        component.changeDetection.detectChanges();

        let loadingOverlay = fixture.debugElement.query(By.css('.loading-overlay'));
        expect(loadingOverlay).not.toBeNull();

        let spinner = fixture.debugElement.query(By.css('.loading-overlay mat-spinner'));
        expect(spinner).not.toBeNull();
    }));
});

describe('Component: MediaViewer with config', () => {
    let component: MediaViewerComponent;
    let fixture: ComponentFixture<MediaViewerComponent>;

    initializeTestBed('Media Viewer', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock },
            InjectableFilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock }
        ],
        imports: [
            MediaViewerModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MediaViewerComponent);
        component = fixture.componentInstance;
        component.configOptions = {
            title: 'Test Title',
            tableKey: 'table_key_1',
            idField: 'testIdField',
            linkField: 'testLinkField',
            nameField: 'testNameField',
            typeField: 'testTypeField',
            border: 'grey',
            linkPrefix: 'prefix/',
            id: 'testId',
            resize: false,
            typeMap: { jpg: 'img' },
            url: 'https://kafka.apache.org/intro',
            autoplay: true
        };
        fixture.detectChanges();
    });

    it('does set expected superclass options properties', () => {
        expect(component.options.database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(component.options.databases).toEqual(DashboardServiceMock.DATABASES_LIST);
        expect(component.options.table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(component.options.tables).toEqual(DashboardServiceMock.TABLES_LIST);
        expect(component.options.fields).toEqual(DashboardServiceMock.FIELDS);
        expect(component.options.title).toEqual('Test Title');
    });

    it('does have expected class options properties', () => {
        expect(component.options.border).toEqual('grey');
        expect(component.options.id).toEqual('testId');
        expect(component.options.linkPrefix).toEqual('prefix/');
        expect(component.options.resize).toEqual(false);
        expect(component.options.typeMap).toEqual({
            jpg: 'img'
        });
        expect(component.options.url).toEqual('https://kafka.apache.org/intro');
        expect(component.options.idField).toEqual(DashboardServiceMock.FIELD_MAP.ID);
        expect(component.options.linkField).toEqual(DashboardServiceMock.FIELD_MAP.LINK);
        expect(component.options.nameField).toEqual(DashboardServiceMock.FIELD_MAP.NAME);
        expect(component.options.typeField).toEqual(DashboardServiceMock.FIELD_MAP.TYPE);
        expect(component.options.autoplay).toEqual(true);
    });

    it('does show header in toolbar with title from config', (() => {
        let header = fixture.debugElement.query(By.css('mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toContain('Test Title');
    }));
});
