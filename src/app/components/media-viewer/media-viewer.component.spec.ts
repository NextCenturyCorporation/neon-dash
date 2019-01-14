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
import { async, ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { DatabaseMetaData, FieldMetaData, TableMetaData, MediaTypes } from '../../dataset';
import { FormsModule } from '@angular/forms';
import { Injector } from '@angular/core';
import { NeonGTDConfig } from '../../neon-gtd-config';

import { } from 'jasmine-core';
import * as neon from 'neon-framework';

import { ExportControlComponent } from '../export-control/export-control.component';
import { MediaViewerComponent } from './media-viewer.component';

import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { FilterServiceMock } from '../../../testUtils/MockServices/FilterServiceMock';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

describe('Component: MediaViewer', () => {
    let component: MediaViewerComponent;
    let fixture: ComponentFixture<MediaViewerComponent>;
    let getService = (type: any) => fixture.debugElement.injector.get(type);

    initializeTestBed({
        declarations: [
            MediaViewerComponent,
            ExportControlComponent
        ],
        providers: [
            ConnectionService,
            DatasetService,
            { provide: FilterService, useClass: FilterServiceMock },
            Injector,
            { provide: 'config', useValue: new NeonGTDConfig() }
        ],
        imports: [
            AppMaterialModule,
            BrowserAnimationsModule,
            FormsModule
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

    it('does have expected class options properties', () => {
        expect(component.options.id).toEqual('');
        expect(component.options.linkPrefix).toEqual('');
        expect(component.options.resize).toEqual(true);
        expect(component.options.typeMap).toEqual({});
        expect(component.options.url).toEqual('');
        expect(component.options.idField).toEqual(new FieldMetaData());
        expect(component.options.linkField).toEqual(new FieldMetaData());
        expect(component.options.linkFields).toEqual([]);
        expect(component.options.nameField).toEqual(new FieldMetaData());
        expect(component.options.typeField).toEqual(new FieldMetaData());
        expect(component.options.autoplay).toEqual(false);
    });

    it('does have expected class properties', () => {
        expect(component.tabsAndMedia).toEqual([]);
        expect(component.mediaTypes).toEqual(MediaTypes);
    });

    it('finalizeVisualizationQuery does return expected query', (() => {
        component.options.database = new DatabaseMetaData('testDatabase');
        component.options.table = new TableMetaData('testTable');
        component.options.id = 'testId';
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.linkFields = [DatasetServiceMock.LINK_FIELD];
        component.options.nameField = DatasetServiceMock.NAME_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;

        let inputQuery = new neon.query.Query()
            .selectFrom('testDatabase', 'testTable')
            .withFields(['testIdField', 'testLinkField', 'testNameField', 'testTypeField']);

        let query = new neon.query.Query()
            .selectFrom('testDatabase', 'testTable')
            .withFields(['testIdField', 'testLinkField', 'testNameField', 'testTypeField']);

        let whereClauses = [
            neon.query.where('testIdField', '=', 'testId'),
            neon.query.where('testLinkField', '!=', null)
        ];

        query.where(neon.query.and.apply(query, whereClauses));

        expect(component.finalizeVisualizationQuery(component.options, inputQuery, [])).toEqual(query);
    }));

    it('getElementRefs does return expected object', () => {
        let refs = component.getElementRefs();
        expect(refs.headerText).toBeDefined();
        expect(refs.infoText).toBeDefined();
        expect(refs.visualization).toBeDefined();
    });

    it('getFiltersToIgnore does return empty array if no filters are set', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.idField = DatasetServiceMock.ID_FIELD;

        expect(component.getFiltersToIgnore()).toEqual(null);
    });

    it('getFiltersToIgnore does return expected array of IDs if filters are set matching database/table', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testIdField1', '!=', null), 'testFilterName1');

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.idField = new FieldMetaData('testIdField1', 'Test ID Field 1');

        expect(component.getFiltersToIgnore()).toEqual(['testDatabase1-testTable1-testFilterName1']);

        component.options.idField = new FieldMetaData('testIdField2', 'Test ID Field 2');

        expect(component.getFiltersToIgnore()).toEqual(['testDatabase1-testTable1-testFilterName1']);
    });

    it('getFiltersToIgnore does return null if no filters are set matching database/table', () => {
        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testIdField', '!=', null), 'testFilterName');

        component.options.database = DatasetServiceMock.DATABASES[1];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.idField = DatasetServiceMock.ID_FIELD;

        // Test matching database but not table.
        expect(component.getFiltersToIgnore()).toEqual(null);

        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[1];

        // Test matching table but not database.
        expect(component.getFiltersToIgnore()).toEqual(null);
    });

    it('getFilterText does return empty string', (() => {
        expect(component.getFilterText({})).toBe('');
        expect(component.getFilterText({
            value: 'testValue'
        })).toBe('');
    }));

    it('getCloseableFilters does return null', (() => {
        expect(component.getCloseableFilters()).toEqual([]);
    }));

    it('getTabLabel does return expected tab label', (() => {
        let names = [];
        let index = null;
        expect(component.getTabLabel(names, index)).toBe('');

        names = ['a', 'b', 'c', 'd'];
        index = 2;
        expect(component.getTabLabel(names, index)).toBe('c');

    }));

    it('validateVisualizationQuery does return expected result', (() => {
        expect(component.validateVisualizationQuery(component.options)).toBe(false);

        component.options.database = new DatabaseMetaData('testDatabase');
        expect(component.validateVisualizationQuery(component.options)).toBe(false);

        component.options.table = new TableMetaData('testTable');
        expect(component.validateVisualizationQuery(component.options)).toBe(false);

        component.options.id = 'testId';
        expect(component.validateVisualizationQuery(component.options)).toBe(false);

        component.options.idField = DatasetServiceMock.ID_FIELD;
        expect(component.validateVisualizationQuery(component.options)).toBe(false);

        component.options.linkFields = [DatasetServiceMock.LINK_FIELD];
        expect(component.validateVisualizationQuery(component.options)).toBe(true);
    }));

    it('transformVisualizationQueryResults does set expected properties with no data', (() => {
        component.tabsAndMedia = [{
            loaded: false,
            slider: 0,
            name: 'testTabName',
            selected: {
                border: '',
                link: 'testLink',
                mask: '',
                name: 'testName',
                type: ''
            },
            list: [{
                border: '',
                link: 'testLink',
                mask: '',
                name: 'testName',
                type: ''
            }]
        }];

        component.transformVisualizationQueryResults(component.options, []);

        expect(component.tabsAndMedia).toEqual([]);
    }));

    it('transformVisualizationQueryResults does reset options.id and return correct error if filter is selected but rhs is empty,', (() => {
        component.options.idField = new FieldMetaData('testIdField');
        component.options.linkField = new FieldMetaData('testLinkField');
        component.options.nameField = new FieldMetaData('testNameField');
        component.options.typeField = new FieldMetaData('testTypeField');
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.id = 'testId';
        component.options.clearMedia = true;

        getService(FilterService).addFilter(null, 'testName2', DatasetServiceMock.DATABASES[1].name, DatasetServiceMock.TABLES[1].name,
            neon.query.where('testIdField', '==', ''), 'testFilterName');

        component.transformVisualizationQueryResults(component.options, [{
            testIdField: 'testIdValue',
            testLinkField: 'testLinkValue',
            testNameField: 'testNameValue',
            testTypeField: 'testTypeValue'
        }]);

        expect(component.options.id).toBe('_id');
    }));

    it('transformVisualizationQueryResults does set expected properties with selected filter and no data', (() => {
        component.tabsAndMedia = [{
            loaded: false,
            slider: 0,
            name: 'testTabName',
            selected: {
                border: '',
                link: 'testLink',
                mask: '',
                name: 'testName',
                type: ''
            },
            list: [{
                border: '',
                link: 'testLink',
                mask: '',
                name: 'testName',
                type: ''
            }]
        }];
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.id = 'testId';
        component.options.clearMedia = false;

        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testIdField', '==', '123'), 'testFilterName');

        component.transformVisualizationQueryResults(component.options, []);

        expect(component.tabsAndMedia).toEqual([]);
    }));

    it('transformVisualizationQueryResults does set expected properties with selected filter and data', () => {
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.linkFields = [DatasetServiceMock.LINK_FIELD];
        component.options.nameField = DatasetServiceMock.NAME_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.id = 'testId';
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];

        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testIdField', '==', '123'), 'testFilterName');

        component.transformVisualizationQueryResults(component.options, [{
            testIdField: 'testIdValue',
            testLinkField: 'testLinkValue',
            testNameField: 'testNameValue',
            testTypeField: 'testTypeValue'
        }]);

        expect(component.tabsAndMedia).toEqual([{
            loaded: false,
            slider: 0,
            name: 'testNameValue',
            selected: {
                border: '',
                link: 'testLinkValue',
                mask: '',
                name: 'testNameValue',
                type: 'testTypeValue'
            },
            list: [{
                border: '',
                link: 'testLinkValue',
                mask: '',
                name: 'testNameValue',
                type: 'testTypeValue'
            }]
        }]);
    });

    it('transformVisualizationQueryResults does update expected properties', () => {
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.linkFields = [DatasetServiceMock.LINK_FIELD];
        component.options.nameField = DatasetServiceMock.NAME_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.id = 'testId';

        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testIdField', '==', '123'), 'testFilterName');

        component.tabsAndMedia = [{
            loaded: false,
            slider: 0,
            name: 'testOldTab',
            selected: {
                border: '',
                link: 'testLinkValue1',
                mask: '',
                name: 'testNameValue1',
                type: 'testTypeValue1'
            },
            list: [{
                border: '',
                link: 'testLinkValue1',
                mask: '',
                name: 'testNameValue1',
                type: 'testTypeValue1'
            }]
        }];

        component.transformVisualizationQueryResults(component.options, [{
            testIdField: 'testIdValue2',
            testLinkField: 'testLinkValue2',
            testNameField: 'testNameValue2',
            testTypeField: 'testTypeValue2'
        }]);

        expect(component.tabsAndMedia).toEqual([{
            loaded: false,
            slider: 0,
            name: 'testNameValue2',
            selected: {
                border: '',
                link: 'testLinkValue2',
                mask: '',
                name: 'testNameValue2',
                type: 'testTypeValue2'
            },
            list: [{
                border: '',
                link: 'testLinkValue2',
                mask: '',
                name: 'testNameValue2',
                type: 'testTypeValue2'
            }]
        }]);
    });

    it('transformVisualizationQueryResults does set expected properties with selected filter and data with multiple links', () => {
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.linkFields = [DatasetServiceMock.LINK_FIELD];
        component.options.nameField = DatasetServiceMock.NAME_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.id = 'testId';
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];

        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testIdField', '==', '123'), 'testFilterName');

        component.transformVisualizationQueryResults(component.options, [{
            testIdField: 'testIdValue',
            testLinkField: ['testLinkValue1', 'testLinkValue2'],
            testNameField: 'testNameValue',
            testTypeField: 'testTypeValue'
        }]);

        expect(component.tabsAndMedia).toEqual([{
            loaded: false,
            slider: 0,
            name: '1: testNameValue',
            selected: {
                border: '',
                link: 'testLinkValue1',
                mask: '',
                name: 'testNameValue',
                type: 'testTypeValue'
            },
            list: [{
                border: '',
                link: 'testLinkValue1',
                mask: '',
                name: 'testNameValue',
                type: 'testTypeValue'
            }]
        }, {
            loaded: false,
            slider: 0,
            name: '2: testNameValue',
            selected: {
                border: '',
                link: 'testLinkValue2',
                mask: '',
                name: 'testNameValue',
                type: 'testTypeValue'
            },
            list: [{
                border: '',
                link: 'testLinkValue2',
                mask: '',
                name: 'testNameValue',
                type: 'testTypeValue'
            }]
        }]);
    });

    it('transformVisualizationQueryResults does set expected properties with selected filter and data with many multiples', () => {
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.linkFields = [DatasetServiceMock.LINK_FIELD];
        component.options.nameField = DatasetServiceMock.NAME_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.id = 'testId';
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];

        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testIdField', '==', '123'), 'testFilterName');

        component.transformVisualizationQueryResults(component.options, [{
            testIdField: 'testIdValue',
            testLinkField: ['testLinkValue1', 'testLinkValue2'],
            testNameField: ['testNameValue1', 'testNameValue2'],
            testTypeField: ['testTypeValue1', 'testTypeValue2']
        }]);

        expect(component.tabsAndMedia).toEqual([{
            loaded: false,
            slider: 0,
            name: '1: testNameValue1',
            selected: {
                border: '',
                link: 'testLinkValue1',
                mask: '',
                name: 'testNameValue1',
                type: 'testTypeValue1'
            },
            list: [{
                border: '',
                link: 'testLinkValue1',
                mask: '',
                name: 'testNameValue1',
                type: 'testTypeValue1'
            }]
        }, {
            loaded: false,
            slider: 0,
            name: '2: testNameValue2',
            selected: {
                border: '',
                link: 'testLinkValue2',
                mask: '',
                name: 'testNameValue2',
                type: 'testTypeValue2'
            },
            list: [{
                border: '',
                link: 'testLinkValue2',
                mask: '',
                name: 'testNameValue2',
                type: 'testTypeValue2'
            }]
        }]);
    });

    it('transformVisualizationQueryResults does ignore empty links', () => {
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.linkFields = [DatasetServiceMock.LINK_FIELD];
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.id = 'testTabName';

        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testIdField', '==', '123'), 'testFilterName');

        component.transformVisualizationQueryResults(component.options, [{
            testIdField: 'testIdValue',
            testLinkField: ''
        }]);

        expect(component.tabsAndMedia).toEqual([]);
    });

    it('transformVisualizationQueryResults does add border if filter selected', () => {
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.linkFields = [DatasetServiceMock.LINK_FIELD];
        component.options.border = 'grey';
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.id = 'testId';

        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testIdField', '==', '123'), 'testFilterName');

        component.transformVisualizationQueryResults(component.options, [{
            testIdField: 'testIdValue',
            testLinkField: 'testLinkValue'
        }]);

        expect(component.tabsAndMedia).toEqual([{
            loaded: false,
            slider: 0,
            name: 'testLinkValue',
            selected: {
                border: 'grey',
                link: 'testLinkValue',
                mask: '',
                name: 'testLinkValue',
                type: ''
            },
            list: [{
                border: 'grey',
                link: 'testLinkValue',
                mask: '',
                name: 'testLinkValue',
                type: ''
            }]
        }]);
    });

    it('transformVisualizationQueryResults does use linkPrefix if filter selected', () => {
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.linkFields = [DatasetServiceMock.LINK_FIELD];
        component.options.linkPrefix = 'linkPrefix/';
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.id = 'testId';

        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testIdField', '==', '123'), 'testFilterName');

        component.transformVisualizationQueryResults(component.options, [{
            testIdField: 'testIdValue',
            testLinkField: 'testLinkValue'
        }]);

        expect(component.tabsAndMedia).toEqual([{
            loaded: false,
            slider: 0,
            name: 'testLinkValue',
            selected: {
                border: '',
                link: 'linkPrefix/testLinkValue',
                mask: '',
                name: 'testLinkValue',
                type: ''
            },
            list: [{
                border: '',
                link: 'linkPrefix/testLinkValue',
                mask: '',
                name: 'testLinkValue',
                type: ''
            }]
        }]);
    });

    it('transformVisualizationQueryResults does ignore existing linkPrefix', () => {
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.linkFields = [DatasetServiceMock.LINK_FIELD];
        component.options.linkPrefix = 'linkPrefix/';
        component.options.id = 'testId';

        component.transformVisualizationQueryResults(component.options, [{
            testIdField: 'testIdValue',
            testLinkField: 'linkPrefix/testLinkValue'
        }]);

        expect(component.tabsAndMedia).toEqual([{
            loaded: false,
            slider: 0,
            name: 'testLinkValue',
            selected: {
                border: '',
                link: 'linkPrefix/testLinkValue',
                mask: '',
                name: 'testLinkValue',
                type: ''
            },
            list: [{
                border: '',
                link: 'linkPrefix/testLinkValue',
                mask: '',
                name: 'testLinkValue',
                type: ''
            }]
        }]);
    });

    it('transformVisualizationQueryResults does remove existing prefix from name', () => {
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.linkFields = [DatasetServiceMock.LINK_FIELD];
        component.options.id = 'testId';

        component.transformVisualizationQueryResults(component.options, [{
            testIdField: 'testIdValue',
            testLinkField: 'prefix/testLinkValue'
        }]);

        expect(component.tabsAndMedia).toEqual([{
            loaded: false,
            slider: 0,
            name: 'testLinkValue',
            selected: {
                border: '',
                link: 'prefix/testLinkValue',
                mask: '',
                name: 'testLinkValue',
                type: ''
            },
            list: [{
                border: '',
                link: 'prefix/testLinkValue',
                mask: '',
                name: 'testLinkValue',
                type: ''
            }]
        }]);
    });

    it('transformVisualizationQueryResults does use typeMap if filter selected', () => {
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.linkFields = [DatasetServiceMock.LINK_FIELD];
        component.options.typeMap = {
            avi: 'vid',
            jpg: 'img',
            txt: 'txt',
            wav: 'aud'
        };
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.id = 'testId';

        getService(FilterService).addFilter(null, 'testName', DatasetServiceMock.DATABASES[0].name, DatasetServiceMock.TABLES[0].name,
            neon.query.where('testIdField', '==', '123'), 'testFilterName');

        component.transformVisualizationQueryResults(component.options, [{
            testIdField: 'testIdValue',
            testLinkField: ['video.avi', 'image.jpg', 'alpha.txt', 'audio.wav', 'other.xyz']
        }]);

        expect((component as any).errorMessage).toBe('');
        expect(component.tabsAndMedia).toEqual([{
            loaded: false,
            slider: 0,
            name: '1: video.avi',
            selected: {
                border: '',
                link: 'video.avi',
                mask: '',
                name: 'video.avi',
                type: 'vid'
            },
            list: [{
                border: '',
                link: 'video.avi',
                mask: '',
                name: 'video.avi',
                type: 'vid'
            }]
        }, {
            loaded: false,
            slider: 0,
            name: '2: image.jpg',
            selected: {
                border: '',
                link: 'image.jpg',
                mask: '',
                name: 'image.jpg',
                type: 'img'
            },
            list: [{
                border: '',
                link: 'image.jpg',
                mask: '',
                name: 'image.jpg',
                type: 'img'
            }]
        }, {
            loaded: false,
            slider: 0,
            name: '3: alpha.txt',
            selected: {
                border: '',
                link: 'alpha.txt',
                mask: '',
                name: 'alpha.txt',
                type: 'txt'
            },
            list: [{
                border: '',
                link: 'alpha.txt',
                mask: '',
                name: 'alpha.txt',
                type: 'txt'
            }]
        }, {
            loaded: false,
            slider: 0,
            name: '4: audio.wav',
            selected: {
                border: '',
                link: 'audio.wav',
                mask: '',
                name: 'audio.wav',
                type: 'aud'
            },
            list: [{
                border: '',
                link: 'audio.wav',
                mask: '',
                name: 'audio.wav',
                type: 'aud'
            }]
        }, {
            loaded: false,
            slider: 0,
            name: '5: other.xyz',
            selected: {
                border: '',
                link: 'other.xyz',
                mask: '',
                name: 'other.xyz',
                type: ''
            },
            list: [{
                border: '',
                link: 'other.xyz',
                mask: '',
                name: 'other.xyz',
                type: ''
            }]
        }]);
    });

    /************************************************************/
    /**** TODO Test transformVisualizationQueryResults if oneTabPerArray is true ****/
    /************************************************************/

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

    it('sanitize function cleans url', (() => {
        component.options.url = 'https://kafka.apache.org/intro';
        expect(component.sanitize(component.options.url).toString()).toBe(
            'SafeValue must use [property]=binding: https://kafka.apache.org/intro (see http://g.co/ng/security#xss)');
    }));

    it('does show toolbar', (() => {
        fixture.detectChanges();
        let container = fixture.debugElement.query(By.css('mat-sidenav-container'));
        expect(container).not.toBeNull();
        let toolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar'));
        expect(toolbar).not.toBeNull();
    }));

    it('does show header in toolbar with visualization name', (() => {
        fixture.detectChanges();
        let header = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toBe('Media Viewer');
    }));

    it('does hide error-message in toolbar if errorMessage is undefined', (() => {
        fixture.detectChanges();
        let errorMessageInToolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .error-message'));
        expect(errorMessageInToolbar).toBeNull();
    }));

    it('does show error-message in toolbar if errorMessage is defined', async(() => {
        (component as any).errorMessage = 'Test Error Message';
        component.changeDetection.detectChanges();

        let errorMessageInToolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .error-message'));
        expect(errorMessageInToolbar).not.toBeNull();
        expect(errorMessageInToolbar.nativeElement.textContent.indexOf('Test Error Message') >= 0).toBe(true);
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

    it('does show loading overlay if loadingCount is positive', async(() => {
        (component as any).loadingCount = 1;
        component.changeDetection.detectChanges();

        let loadingOverlay = fixture.debugElement.query(By.css('mat-sidenav-container .loading-overlay'));
        expect(loadingOverlay).not.toBeNull();

        let spinner = fixture.debugElement.query(By.css('mat-sidenav-container .loading-overlay mat-spinner'));
        expect(spinner).not.toBeNull();
    }));

    it('does hide tabs if tabsAndMedia is empty', inject([DomSanitizer], (sanitizer) => {
        component.tabsAndMedia = [];
        fixture.detectChanges();
        let tabs = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group .mat-tab-label'));
        expect(tabs.length).toBe(0);
        let slider = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group mat-slider'));
        expect(slider.length).toBe(0);
    }));

    it('does show tabs if tabsAndMedia is not empty', async(inject([DomSanitizer], (sanitizer) => {
        component.tabsAndMedia = [{
            loaded: false,
            slider: 0,
            name: 'testTabName1',
            selected: {
                border: '',
                link: 'testLinkValue1',
                mask: '',
                name: 'testNameValue1',
                type: ''
            },
            list: [{
                border: '',
                link: 'testLinkValue1',
                mask: '',
                name: 'testNameValue1',
                type: ''
            }]
        }, {
            loaded: false,
            slider: 0,
            name: 'testTabName2',
            selected: {
                border: '',
                link: 'testLinkValue2',
                mask: '',
                name: 'testNameValue2',
                type: ''
            },
            list: [{
                border: '',
                link: 'testLinkValue2',
                mask: '',
                name: 'testNameValue2',
                type: ''
            }]
        }];
        component.changeDetection.detectChanges();

        expect(component.tabsAndMedia.length).toBe(2);

        let tabs = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group .mat-tab-label'));
        expect(tabs.length).toBe(2);
        expect(tabs[0].nativeElement.textContent).toBe('testTabName1');
        expect(tabs[0].nativeElement.classList.contains('mat-tab-label-active')).toBe(true);
        expect(tabs[1].nativeElement.textContent).toBe('testTabName2');
        expect(tabs[1].nativeElement.classList.contains('mat-tab-label-active')).toBe(false);

        let slider = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group mat-slider'));
        expect(slider.length).toBe(0);
    })));

    it('does show single image tag according to the image type', async(inject([DomSanitizer], (sanitizer) => {
        let imgSrc = 'https://homepages.cae.wisc.edu/~ece533/images/airplane.png';
        component.tabsAndMedia = [{
            loaded: false,
            slider: 0,
            name: 'testTabName',
            selected: {
                border: '',
                link: imgSrc,
                mask: '',
                name: 'testName',
                type: 'img'
            },
            list: [{
                border: '',
                link: imgSrc,
                mask: '',
                name: 'testName',
                type: 'img'
            }]
        }];
        component.changeDetection.detectChanges();

        let media = fixture.debugElement.queryAll(By.css('mat-sidenav-container .single-medium'));
        expect(media.length).toBe(1);
        expect(media[0].nativeElement.innerHTML).toContain('<img');
        expect(media[0].nativeElement.innerHTML).toContain('src="' + imgSrc + '" alt="testName"');
    })));

    it('does show multiple image tags in tabs according to the image type', async(inject([DomSanitizer], (sanitizer) => {
        let imgSrc = 'https://homepages.cae.wisc.edu/~ece533/images/airplane.png';
        component.tabsAndMedia = [{
            loaded: false,
            slider: 0,
            name: 'testTabName1',
            selected: {
                border: '',
                link: imgSrc,
                mask: '',
                name: 'testName',
                type: 'img'
            },
            list: [{
                border: '',
                link: imgSrc,
                mask: '',
                name: 'testName',
                type: 'img'
            }]
        }, {
            loaded: false,
            slider: 0,
            name: 'testTabName2',
            selected: {
                border: '',
                link: imgSrc,
                mask: '',
                name: 'testName',
                type: 'img'
            },
            list: [{
                border: '',
                link: imgSrc,
                mask: '',
                name: 'testName',
                type: 'img'
            }]
        }];
        component.changeDetection.detectChanges();
        let tabs = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group .mat-tab-label'));
        expect(tabs.length).toBe(2);
        let media = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group mat-tab-body > div > div'));
        expect(media.length).toBe(1);
        expect(media[0].nativeElement.innerHTML).toContain('<img');
        expect(media[0].nativeElement.innerHTML).toContain('src="' + imgSrc + '" alt="testName"');
    })));

    it('does show single video tag according to the video type', async(inject([DomSanitizer], (sanitizer) => {
        let vidSrc = 'https://youtu.be/Mxesac55Puo';
        component.tabsAndMedia = [{
            loaded: false,
            slider: 0,
            name: 'testTabName',
            selected: {
                border: '',
                link: vidSrc,
                mask: '',
                name: 'testName',
                type: 'vid'
            },
            list: [{
                border: '',
                link: vidSrc,
                mask: '',
                name: 'testName',
                type: 'vid'
            }]
        }];
        component.changeDetection.detectChanges();

        let media = fixture.debugElement.queryAll(By.css('mat-sidenav-container .single-medium'));
        expect(media.length).toBe(1);
        expect(media[0].nativeElement.innerHTML).toContain('<video');
        expect(media[0].nativeElement.innerHTML).toContain('src="' + vidSrc + '"');
    })));

    it('does show multiple video tags in tabs according to the video type', async(inject([DomSanitizer], (sanitizer) => {
        let vidSrc = 'https://youtu.be/Mxesac55Puo';
        component.tabsAndMedia = [{
            loaded: false,
            slider: 0,
            name: 'testTabName1',
            selected: {
                border: '',
                link: vidSrc,
                mask: '',
                name: 'testName',
                type: 'vid'
            },
            list: [{
                border: '',
                link: vidSrc,
                mask: '',
                name: 'testName',
                type: 'vid'
            }]
        }, {
            loaded: false,
            slider: 0,
            name: 'testTabName2',
            selected: {
                border: '',
                link: vidSrc,
                mask: '',
                name: 'testName',
                type: 'vid'
            },
            list: [{
                border: '',
                link: vidSrc,
                mask: '',
                name: 'testName',
                type: 'vid'
            }]
        }];
        component.changeDetection.detectChanges();

        let tabs = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group .mat-tab-label'));
        expect(tabs.length).toBe(2);
        let media = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group mat-tab-body > div > div'));
        expect(media.length).toBe(1);
        expect(media[0].nativeElement.innerHTML).toContain('<video');
        expect(media[0].nativeElement.innerHTML).toContain('src="' + vidSrc + '"');
    })));

    it('does show single audio tag according to the audio type', async(inject([DomSanitizer], (sanitizer) => {
        let audSrc = './assets/audio/test-audio.wav';
        component.tabsAndMedia = [{
            loaded: false,
            slider: 0,
            name: 'testTabName',
            selected: {
                border: '',
                link: audSrc,
                mask: '',
                name: 'testName',
                type: 'aud'
            },
            list: [{
                border: '',
                link: audSrc,
                mask: '',
                name: 'testName',
                type: 'aud'
            }]
        }];
        component.changeDetection.detectChanges();

        let media = fixture.debugElement.queryAll(By.css('mat-sidenav-container .single-medium'));
        expect(media.length).toBe(1);
        expect(media[0].nativeElement.innerHTML).toContain('<audio');
        expect(media[0].nativeElement.innerHTML).toContain('src="' + audSrc + '"');
    })));

    it('does show multiple audio tags in tabs according to the audio type', async(inject([DomSanitizer], (sanitizer) => {
        let audSrc = './assets/audio/test-audio.wav';
        component.tabsAndMedia = [{
            loaded: false,
            slider: 0,
            name: 'testTabName1',
            selected: {
                border: '',
                link: audSrc,
                mask: '',
                name: 'testName',
                type: 'aud'
            },
            list: [{
                border: '',
                link: audSrc,
                mask: '',
                name: 'testName',
                type: 'aud'
            }]
        }, {
            loaded: false,
            slider: 0,
            name: 'testTabName2',
            selected: {
                border: '',
                link: audSrc,
                mask: '',
                name: 'testName',
                type: 'aud'
            },
            list: [{
                border: '',
                link: audSrc,
                mask: '',
                name: 'testName',
                type: 'aud'
            }]
        }];
        component.changeDetection.detectChanges();

        let tabs = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group .mat-tab-label'));
        expect(tabs.length).toBe(2);
        let media = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group mat-tab-body > div > div'));
        expect(media.length).toBe(1);
        expect(media[0].nativeElement.innerHTML).toContain('<audio');
        expect(media[0].nativeElement.innerHTML).toContain('src="' + audSrc + '"');
    })));

    it('does show single iframe tag according to the empty type', async(inject([DomSanitizer], (sanitizer) => {
        let docSrc = 'https://homepages.cae.wisc.edu/~ece533/images/p64int.txt';
        component.tabsAndMedia = [{
            loaded: false,
            slider: 0,
            name: 'testTabName',
            selected: {
                border: '',
                link: docSrc,
                mask: '',
                name: 'testName',
                type: ''
            },
            list: [{
                border: '',
                link: docSrc,
                mask: '',
                name: 'testName',
                type: ''
            }]
        }];
        component.changeDetection.detectChanges();
        let media = fixture.debugElement.queryAll(By.css('mat-sidenav-container .single-medium'));
        expect(media.length).toBe(1);
        expect(media[0].nativeElement.innerHTML).toContain('<iframe');
        expect(media[0].nativeElement.innerHTML).toContain('src="' + docSrc + '"');
    })));

    it('does show multiple iframe tags in tabs according to the empty type', async(inject([DomSanitizer], (sanitizer) => {
        let docSrc = 'https://homepages.cae.wisc.edu/~ece533/images/p64int.txt';
        component.tabsAndMedia = [{
            loaded: false,
            slider: 0,
            name: 'testTabName1',
            selected: {
                border: '',
                link: docSrc,
                mask: '',
                name: 'testName',
                type: ''
            },
            list: [{
                border: '',
                link: docSrc,
                mask: '',
                name: 'testName',
                type: ''
            }]
        }, {
            loaded: false,
            slider: 0,
            name: 'testTabName2',
            selected: {
                border: '',
                link: docSrc,
                mask: '',
                name: 'testName',
                type: ''
            },
            list: [{
                border: '',
                link: docSrc,
                mask: '',
                name: 'testName',
                type: ''
            }]
        }];
        component.changeDetection.detectChanges();
        let tabs = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group .mat-tab-label'));
        expect(tabs.length).toBe(2);
        let media = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group mat-tab-body > div > div'));
        expect(media.length).toBe(1);
        expect(media[0].nativeElement.innerHTML).toContain('<iframe');
        expect(media[0].nativeElement.innerHTML).toContain('src="' + docSrc + '"');
    })));

    it('does show two images and slider', async(inject([DomSanitizer], (sanitizer) => {
        let baseSource = 'https://homepages.cae.wisc.edu/~ece533/images/airplane.png';
        let maskSource = 'https://homepages.cae.wisc.edu/~ece533/images/boat.png';
        component.tabsAndMedia = [{
            loaded: false,
            slider: 0,
            name: 'testTabName1',
            selected: {
                border: '',
                link: baseSource,
                mask: maskSource,
                name: 'testName',
                type: 'mask'
            },
            list: [{
                border: '',
                link: baseSource,
                mask: maskSource,
                name: 'testName',
                type: 'mask'
            }]
        }];
        component.changeDetection.detectChanges();

        let medium = fixture.debugElement.queryAll(By.css('mat-sidenav-container .single-medium'));
        expect(medium.length).toBe(1);
        let images = fixture.debugElement.queryAll(By.css('mat-sidenav-container .single-medium img'));
        expect(images.length).toBe(2);
        expect(images[0].nativeElement.outerHTML).toContain('src="' + baseSource + '" alt="testName"');
        expect(images[1].nativeElement.outerHTML).toContain('src="' + maskSource + '" alt="testName"');

        let slider = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-slider'));
        expect(slider.length).toBe(1);
    })));
});

describe('Component: MediaViewer with config', () => {
    let component: MediaViewerComponent;
    let fixture: ComponentFixture<MediaViewerComponent>;

    initializeTestBed({
        declarations: [
            MediaViewerComponent,
            ExportControlComponent
        ],
        providers: [
            ConnectionService,
            { provide: DatasetService, useClass: DatasetServiceMock },
            FilterService,
            Injector,
            { provide: 'config', useValue: new NeonGTDConfig() },
            { provide: 'title', useValue: 'Test Title' },
            { provide: 'database', useValue: 'testDatabase1' },
            { provide: 'table', useValue: 'testTable1' },
            { provide: 'idField', useValue: 'testIdField' },
            { provide: 'linkField', useValue: 'testLinkField' },
            { provide: 'nameField', useValue: 'testNameField' },
            { provide: 'typeField', useValue: 'testTypeField' },
            { provide: 'border', useValue: 'grey' },
            { provide: 'linkPrefix', useValue: 'prefix/' },
            { provide: 'id', useValue: 'testId' },
            { provide: 'resize', useValue: false },
            { provide: 'typeMap', useValue: { jpg: 'img' } },
            { provide: 'url', useValue: 'https://kafka.apache.org/intro' },
            { provide: 'autoplay', useValue: true }
        ],
        imports: [
            AppMaterialModule,
            BrowserAnimationsModule,
            FormsModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MediaViewerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('does set expected superclass options properties', () => {
        expect(component.options.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(component.options.databases).toEqual(DatasetServiceMock.DATABASES);
        expect(component.options.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(component.options.tables).toEqual(DatasetServiceMock.TABLES);
        expect(component.options.fields).toEqual(DatasetServiceMock.FIELDS);
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
        expect(component.options.idField).toEqual(DatasetServiceMock.ID_FIELD);
        expect(component.options.linkField).toEqual(DatasetServiceMock.LINK_FIELD);
        expect(component.options.nameField).toEqual(DatasetServiceMock.NAME_FIELD);
        expect(component.options.typeField).toEqual(DatasetServiceMock.TYPE_FIELD);
        expect(component.options.autoplay).toEqual(true);
    });

    it('does show header in toolbar with title from config', (() => {
        fixture.detectChanges();
        let header = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toBe('Test Title');
    }));

});
