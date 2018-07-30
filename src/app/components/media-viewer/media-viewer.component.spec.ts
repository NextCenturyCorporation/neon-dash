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
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import { FormsModule } from '@angular/forms';
import { Injector } from '@angular/core';
import { NeonGTDConfig } from '../../neon-gtd-config';

import {} from 'jasmine-core';
import * as neon from 'neon-framework';

import { ExportControlComponent } from '../export-control/export-control.component';
import { MediaViewerComponent } from './media-viewer.component';

import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { ExportService } from '../../services/export.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { VisualizationService } from '../../services/visualization.service';
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
            ActiveGridService,
            ConnectionService,
            DatasetService,
            ExportService,
            ErrorNotificationService,
            { provide: FilterService, useClass: FilterServiceMock },
            ThemesService,
            VisualizationService,
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
        expect(component.options.idField).toEqual(component.emptyField);
        expect(component.options.linkField).toEqual(component.emptyField);
        expect(component.options.linkFields).toEqual([]);
        expect(component.options.nameField).toEqual(component.emptyField);
        expect(component.options.typeField).toEqual(component.emptyField);
    });

    it('does have expected class properties', () => {
        expect(component.tabsAndMedia).toEqual([]);
        expect(component.isLoadingMedia).toEqual(false);
    });

    it('createQuery does return expected query', (() => {
        component.options.database = new DatabaseMetaData('testDatabase');
        component.options.table = new TableMetaData('testTable');
        component.options.id = 'testId';
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.linkFields = [DatasetServiceMock.LINK_FIELD];
        component.options.nameField = DatasetServiceMock.NAME_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;

        let query = new neon.query.Query()
            .selectFrom('testDatabase', 'testTable')
            .withFields(['testIdField', 'testLinkField', 'testNameField', 'testTypeField']);

        let whereClauses = [
            neon.query.where('testIdField', '=', 'testId'),
            neon.query.where('testLinkField', '!=', null)
        ];

        query.where(neon.query.and.apply(query, whereClauses));

        expect(component.createQuery()).toEqual(query);
    }));

    it('getButtonText does return expected string', () => {
        expect(component.getButtonText()).toBe('Please Select');
        component.options.url = 'https://test.com';
        expect(component.getButtonText()).toBe('No Data');
        component.tabsAndMedia = [{
            name: 'https://test.com',
            selected: {
                border: '',
                link: 'a',
                name: 'a',
                type: ''
            },
            list: [{
                border: '',
                link: 'a',
                name: 'a',
                type: ''
            }]
        }];
        component.options.url = '';
        expect(component.getButtonText()).toBe('Total Files 1');
        component.tabsAndMedia = [{
            name: 'https://test.com',
            selected: {
                border: '',
                link: 'a',
                name: 'a',
                type: ''
            },
            list: [{
                border: '',
                link: 'a',
                name: 'a',
                type: ''
            }, {
                border: '',
                link: 'b',
                name: 'b',
                type: ''
            }, {
                border: '',
                link: 'c',
                name: 'c',
                type: ''
            }, {
                border: '',
                link: 'd',
                name: 'd',
                type: ''
            }]
        }];
        expect(component.getButtonText()).toBe('Total Files 4');
    });

    it('getElementRefs does return expected object', () => {
        let refs = component.getElementRefs();
        expect(refs.headerText).toBeDefined();
        expect(refs.infoText).toBeDefined();
        expect(refs.visualization).toBeDefined();
    });

    it('getExportFields does return expected array', (() => {
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.linkFields = [DatasetServiceMock.LINK_FIELD];

        expect(component.getExportFields()).toEqual([{
            columnName: 'testIdField',
            prettyName: 'Test ID Field'
        }, {
            columnName: 'testLinkField',
            prettyName: 'Test Link Field'
        }]);
    }));

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

    it('isValidQuery does return expected result', (() => {
        expect(component.isValidQuery()).toBe(false);

        component.options.database = new DatabaseMetaData('testDatabase');
        expect(component.isValidQuery()).toBe(false);

        component.options.table = new TableMetaData('testTable');
        expect(component.isValidQuery()).toBe(false);

        component.options.id = 'testId';
        expect(component.isValidQuery()).toBe(false);

        component.options.idField = DatasetServiceMock.ID_FIELD;
        expect(component.isValidQuery()).toBe(false);

        component.options.linkFields = [DatasetServiceMock.LINK_FIELD];
        expect(component.isValidQuery()).toBe(true);
    }));

    it('onQuerySuccess does set expected properties if response returns no data', (() => {
        component.errorMessage = 'testErrorMessage';
        component.tabsAndMedia = [{
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
        }];

        component.onQuerySuccess({
            data: []
        });

        expect(component.errorMessage).toBe('No Data');
        expect(component.tabsAndMedia).toEqual([]);
    }));

    it('onQuerySuccess does set expected properties if response returns data', () => {
        component.errorMessage = 'testErrorMessage';
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.linkFields = [DatasetServiceMock.LINK_FIELD];
        component.options.nameField = DatasetServiceMock.NAME_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.id = 'testTabName';

        component.onQuerySuccess({
            data: [{
                testIdField: 'testIdValue',
                testLinkField: 'testLinkValue',
                testNameField: 'testNameValue',
                testTypeField: 'testTypeValue'
            }]
        });

        expect(component.errorMessage).toBe('');
        expect(component.tabsAndMedia).toEqual([{
            name: 'testTabName',
            selected: {
                border: '',
                link: 'testLinkValue',
                name: 'testNameValue',
                type: 'testTypeValue'
            },
            list: [{
                border: '',
                link: 'testLinkValue',
                name: 'testNameValue',
                type: 'testTypeValue'
            }]
        }]);
    });

    it('onQuerySuccess does set expected properties if response failed', () => {
        component.errorMessage = 'testErrorMessage';
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.linkFields = [DatasetServiceMock.LINK_FIELD];
        component.options.nameField = DatasetServiceMock.NAME_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.id = 'testTabName';
        component.tabsAndMedia = [{
            name: 'testTabName',
            selected: {
                border: '',
                link: 'testLinkValue',
                name: 'testNameValue',
                type: 'testTypeValue'
            },
            list: [{
                border: '',
                link: 'testLinkValue',
                name: 'testNameValue',
                type: 'testTypeValue'
            }]
        }];

        component.onQuerySuccess({
            data: [{
                testIdField: 'testIdValue',
                testLinkField: 'testLinkValue',
                testNameField: 'testNameValue',
                testTypeField: 'testTypeValue'
            }]
        });

        expect(component.errorMessage).toBe('');
        expect(component.tabsAndMedia).toEqual([{
            name: 'testTabName',
            selected: {
                border: '',
                link: 'testLinkValue',
                name: 'testNameValue',
                type: 'testTypeValue'
            },
            list: [{
                border: '',
                link: 'testLinkValue',
                name: 'testNameValue',
                type: 'testTypeValue'
            }]
        }]);
    });

    it('onQuerySuccess does set expected properties if response returns data with multiple links', () => {
        component.errorMessage = 'testErrorMessage';
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.linkFields = [DatasetServiceMock.LINK_FIELD];
        component.options.nameField = DatasetServiceMock.NAME_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.id = 'testTabName';

        component.onQuerySuccess({
            data: [{
                testIdField: 'testIdValue',
                testLinkField: ['testLinkValue1', 'testLinkValue2'],
                testNameField: 'testNameValue',
                testTypeField: 'testTypeValue'
            }]
        });

        expect(component.errorMessage).toBe('');
        expect(component.tabsAndMedia).toEqual([{
            name: 'testTabName',
            selected: {
                border: '',
                link: 'testLinkValue1',
                name: 'testNameValue',
                type: 'testTypeValue'
            },
            list: [{
                border: '',
                link: 'testLinkValue1',
                name: 'testNameValue',
                type: 'testTypeValue'
            }, {
                border: '',
                link: 'testLinkValue2',
                name: 'testNameValue',
                type: 'testTypeValue'
            }]
        }]);
    });

    it('onQuerySuccess does set expected properties if response returns data with multiple links/names/types', () => {
        component.errorMessage = 'testErrorMessage';
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.linkFields = [DatasetServiceMock.LINK_FIELD];
        component.options.nameField = DatasetServiceMock.NAME_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.id = 'testTabName';

        component.onQuerySuccess({
            data: [{
                testIdField: 'testIdValue',
                testLinkField: ['testLinkValue1', 'testLinkValue2'],
                testNameField: ['testNameValue1', 'testNameValue2'],
                testTypeField: ['testTypeValue1', 'testTypeValue2']
            }]
        });

        expect(component.errorMessage).toBe('');
        expect(component.tabsAndMedia).toEqual([{
            name: 'testTabName',
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
            }, {
                border: '',
                link: 'testLinkValue2',
                name: 'testNameValue2',
                type: 'testTypeValue2'
            }]
        }]);
    });

    it('onQuerySuccess does ignore empty links', () => {
        component.errorMessage = 'testErrorMessage';
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.linkFields = [DatasetServiceMock.LINK_FIELD];
        component.options.linkPrefix = 'prefix/';

        component.onQuerySuccess({
            data: [{
                testIdField: 'testIdValue',
                testLinkField: ''
            }]
        });

        expect(component.errorMessage).toBe('');
        expect(component.tabsAndMedia).toEqual([]);
    });

    it('onQuerySuccess does add border', () => {
        component.errorMessage = 'testErrorMessage';
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.linkFields = [DatasetServiceMock.LINK_FIELD];
        component.options.border = 'grey';
        component.options.id = 'testTabName';

        component.onQuerySuccess({
            data: [{
                testIdField: 'testIdValue',
                testLinkField: 'testLinkValue'
            }]
        });

        expect(component.errorMessage).toBe('');
        expect(component.tabsAndMedia).toEqual([{
            name: 'testTabName',
            selected: {
                border: 'grey',
                link: 'testLinkValue',
                name: 'Test Link Field',
                type: ''
            },
            list: [{
                border: 'grey',
                link: 'testLinkValue',
                name: 'Test Link Field',
                type: ''
            }]
        }]);
    });

    it('onQuerySuccess does use linkPrefix', () => {
        component.errorMessage = 'testErrorMessage';
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.linkFields = [DatasetServiceMock.LINK_FIELD];
        component.options.linkPrefix = 'prefix/';
        component.options.id = 'testTabName';

        component.onQuerySuccess({
            data: [{
                testIdField: 'testIdValue',
                testLinkField: 'testLinkValue'
            }]
        });

        expect(component.errorMessage).toBe('');
        expect(component.tabsAndMedia).toEqual([{
            name: 'testTabName',
            selected: {
                border: '',
                link: 'prefix/testLinkValue',
                name: 'Test Link Field',
                type: ''
            },
            list: [{
                border: '',
                link: 'prefix/testLinkValue',
                name: 'Test Link Field',
                type: ''
            }]
        }]);
    });

    it('onQuerySuccess does use typeMap', () => {
        component.errorMessage = 'testErrorMessage';
        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.linkFields = [DatasetServiceMock.LINK_FIELD];
        component.options.typeMap = {
            avi: 'vid',
            jpg: 'img',
            txt: 'txt'
        };
        component.options.id = 'testTabName';

        component.onQuerySuccess({
            data: [{
                testIdField: 'testIdValue',
                testLinkField: ['video.avi', 'image.jpg', 'alpha.txt', 'other.xyz']
            }]
        });

        expect(component.errorMessage).toBe('');
        expect(component.tabsAndMedia).toEqual([{
            name: 'testTabName',
            selected: {
                border: '',
                link: 'video.avi',
                name: 'Test Link Field 1',
                type: 'vid'
            },
            list: [{
                border: '',
                link: 'video.avi',
                name: 'Test Link Field 1',
                type: 'vid'
            }, {
                border: '',
                link: 'image.jpg',
                name: 'Test Link Field 2',
                type: 'img'
            }, {
                border: '',
                link: 'alpha.txt',
                name: 'Test Link Field 3',
                type: 'txt'
            }, {
                border: '',
                link: 'other.xyz',
                name: 'Test Link Field 4',
                type: ''
            }]
        }]);
    });

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
        let bindings = {};

        component.subGetBindings(bindings);
        expect(bindings).toEqual({
            idField: '',
            linkField: '',
            linkFields: [],
            nameField: '',
            typeField: '',
            border: '',
            delimiter: ',',
            linkPrefix: '',
            resize: true,
            typeMap: {}
        });

        component.options.idField = DatasetServiceMock.ID_FIELD;
        component.options.linkField = DatasetServiceMock.LINK_FIELD;
        component.options.linkFields = [new FieldMetaData('testLinkField1'), new FieldMetaData('testLinkField2')];
        component.options.nameField = DatasetServiceMock.NAME_FIELD;
        component.options.typeField = DatasetServiceMock.TYPE_FIELD;
        component.options.border = 'grey';
        component.options.delimiter = ';';
        component.options.linkPrefix = '/prefix';
        component.options.resize = false;
        component.options.typeMap = {
            jpg: 'img'
        };

        component.subGetBindings(bindings);
        expect(bindings).toEqual({
            idField: 'testIdField',
            linkField: 'testLinkField',
            linkFields: ['testLinkField1', 'testLinkField2'],
            nameField: 'testNameField',
            typeField: 'testTypeField',
            border: 'grey',
            delimiter: ';',
            linkPrefix: '/prefix',
            resize: false,
            typeMap: {
                jpg: 'img'
            }
        });
    }));

    it('subNgOnDestroy function does exist', (() => {
        expect(component.subNgOnDestroy).toBeDefined();
    }));

    it('subNgOnInit function does exist', (() => {
        expect(component.subNgOnInit).toBeDefined();
    }));

    it('sanitize function cleans url', (() => {
        component.options.url = 'https://kafka.apache.org/intro';
        expect(component.sanitize(component.options.url).toString()).toBe(
            'SafeValue must use [property]=binding: https://kafka.apache.org/intro (see http://g.co/ng/security#xss)');
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
        expect(header.nativeElement.textContent).toBe('Media Viewer');
    }));

    it('does hide error-message in toolbar and sidenav if errorMessage is undefined', (() => {
        fixture.detectChanges();
        let errorMessageInToolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .error-message'));
        expect(errorMessageInToolbar).toBeNull();

        let iconInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .error-message mat-icon'));
        expect(iconInSidenav).toBeNull();

        let errorMessageInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .error-message div'));
        expect(errorMessageInSidenav).toBeNull();
    }));

    it('does show error-message in toolbar and sidenav if errorMessage is defined', async(() => {
        component.errorMessage = 'Test Error Message';
        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let errorMessageInToolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .error-message'));
            expect(errorMessageInToolbar).not.toBeNull();
            expect(errorMessageInToolbar.nativeElement.textContent.indexOf('Test Error Message') >= 0).toBe(true);

            let iconInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .error-message mat-icon'));
            expect(iconInSidenav).not.toBeNull();
            expect(iconInSidenav.nativeElement.textContent).toBe('error');

            let errorMessageInSidenav = fixture.debugElement.query(By.css('mat-sidenav-container mat-sidenav .error-message span'));
            expect(errorMessageInSidenav).not.toBeNull();
            expect(errorMessageInSidenav.nativeElement.textContent.indexOf('Test Error Message') >= 0).toBe(true);
        });
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

    it('does show selects in sidenav options menu that have default options', async(() => {
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let inputs = fixture.debugElement.queryAll(
                By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field input'));
            expect(inputs.length).toBe(5);

            expect(inputs[0].attributes.placeholder).toEqual('Title');
            expect(inputs[0].nativeElement.value).toEqual('Media Viewer');

            expect(inputs[1].attributes.placeholder).toEqual('Border');
            expect(inputs[1].nativeElement.value).toEqual('');

            expect(inputs[2].attributes.placeholder).toEqual('ID');
            expect(inputs[2].nativeElement.value).toEqual('');

            expect(inputs[3].attributes.placeholder).toEqual('Link Prefix');
            expect(inputs[3].nativeElement.value).toEqual('');

            expect(inputs[4].attributes.placeholder).toEqual('URL');
            expect(inputs[4].nativeElement.value).toEqual('');

            let options;
            let selects = fixture.debugElement.queryAll(
                By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field mat-select'));
            expect(selects.length).toBe(6);

            expect(selects[0].componentInstance.disabled).toEqual(true);
            expect(selects[0].componentInstance.placeholder).toEqual('Database');
            expect(selects[0].componentInstance.required).toEqual(true);
            options = selects[0].componentInstance.options.toArray();
            expect(options.length).toEqual(0);

            expect(selects[1].componentInstance.disabled).toEqual(true);
            expect(selects[1].componentInstance.placeholder).toEqual('Table');
            expect(selects[1].componentInstance.required).toEqual(true);
            options = selects[1].componentInstance.options.toArray();
            expect(options.length).toEqual(0);

            expect(selects[2].componentInstance.disabled).toEqual(true);
            expect(selects[2].componentInstance.placeholder).toEqual('ID Field');
            expect(selects[2].componentInstance.required).toEqual(true);
            options = selects[2].componentInstance.options.toArray();
            expect(options.length).toEqual(0);

            expect(selects[3].componentInstance.disabled).toEqual(true);
            expect(selects[3].componentInstance.placeholder).toEqual('Link Fields');
            expect(selects[3].componentInstance.required).toEqual(true);
            options = selects[3].componentInstance.options.toArray();
            expect(options.length).toEqual(0);

            expect(selects[4].componentInstance.disabled).toEqual(true);
            expect(selects[4].componentInstance.placeholder).toEqual('Name Field');
            expect(selects[4].componentInstance.required).toEqual(false);
            options = selects[4].componentInstance.options.toArray();
            expect(options.length).toEqual(1);
            expect(options[0].getLabel()).toEqual('(None)');

            expect(selects[5].componentInstance.disabled).toEqual(true);
            expect(selects[5].componentInstance.placeholder).toEqual('Type Field');
            expect(selects[5].componentInstance.required).toEqual(false);
            options = selects[5].componentInstance.options.toArray();
            expect(options.length).toEqual(1);
            expect(options[0].getLabel()).toEqual('(None)');
        });
    }));

    it('does hide loading overlay by default', (() => {
        fixture.detectChanges();

        let hiddenLoadingOverlay = fixture.debugElement.query(By.css('mat-sidenav-container .not-loading-overlay'));
        expect(hiddenLoadingOverlay).not.toBeNull();

        let hiddenSpinner = fixture.debugElement.query(By.css('mat-sidenav-container .not-loading-overlay mat-spinner'));
        expect(hiddenSpinner).not.toBeNull();
    }));

    it('does show loading overlay if isLoading is true', async(() => {
        component.isLoading = true;
        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let loadingOverlay = fixture.debugElement.query(By.css('mat-sidenav-container .loading-overlay'));
            expect(loadingOverlay).not.toBeNull();

            let spinner = fixture.debugElement.query(By.css('mat-sidenav-container .loading-overlay mat-spinner'));
            expect(spinner).not.toBeNull();
        });
    }));

    it('does hide tabs if tabsAndMedia is empty', inject([DomSanitizer], (sanitizer) => {
        component.tabsAndMedia = [];
        fixture.detectChanges();
        let tabs = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group .mat-tab-label'));
        expect(tabs.length).toBe(0);
        let slider = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group mat-slider'));
        expect(slider.length).toBe(0);
    }));

    it('does show tabs if tabsAndMedia is not empty', async(inject([DomSanitizer], (sanitizer) =>  {
        component.tabsAndMedia = [{
            name: 'testTabName1',
            selected: {
                border: '',
                link: 'testLinkValue1',
                name: 'testNameValue1',
                type: ''
            },
            list: [{
                border: '',
                link: 'testLinkValue1',
                name: 'testNameValue1',
                type: ''
            }]
        }, {
            name: 'testTabName2',
            selected: {
                border: '',
                link: 'testLinkValue2',
                name: 'testNameValue2',
                type: ''
            },
            list: [{
                border: '',
                link: 'testLinkValue2',
                name: 'testNameValue2',
                type: ''
            }]
        }];
        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();

            expect(component.tabsAndMedia.length).toBe(2);

            let tabs = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group .mat-tab-label'));
            expect(tabs.length).toBe(2);
            expect(tabs[0].nativeElement.textContent).toBe('testTabName1');
            expect(tabs[0].nativeElement.classList.contains('mat-tab-label-active')).toBe(true);
            expect(tabs[1].nativeElement.textContent).toBe('testTabName2');
            expect(tabs[1].nativeElement.classList.contains('mat-tab-label-active')).toBe(false);

            let slider = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group mat-slider'));
            expect(slider.length).toBe(0);
        });
    })));

    it('does show single image tag according to the image type', async(inject([DomSanitizer], (sanitizer) => {
        let imgSrc = 'https://homepages.cae.wisc.edu/~ece533/images/airplane.png';
        component.tabsAndMedia = [{
            name: 'testTabName',
            selected: {
                border: '',
                link: imgSrc,
                name: 'testName',
                type: 'img'
            },
            list: [{
                border: '',
                link: imgSrc,
                name: 'testName',
                type: 'img'
            }]
        }];
        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();
            let media = fixture.debugElement.queryAll(By.css('mat-sidenav-container .single-medium'));
            expect(media.length).toBe(1);
            expect(media[0].nativeElement.innerHTML).toContain('<img');
            expect(media[0].nativeElement.innerHTML).toContain('src="' + imgSrc + '" alt="testName"');
        });
    })));

    it('does show multiple image tags in tabs according to the image type', async(inject([DomSanitizer], (sanitizer) => {
        let imgSrc = 'https://homepages.cae.wisc.edu/~ece533/images/airplane.png';
        component.tabsAndMedia = [{
            name: 'testTabName1',
            selected: {
                border: '',
                link: imgSrc,
                name: 'testName',
                type: 'img'
            },
            list: [{
                border: '',
                link: imgSrc,
                name: 'testName',
                type: 'img'
            }]
        }, {
            name: 'testTabName2',
            selected: {
                border: '',
                link: imgSrc,
                name: 'testName',
                type: 'img'
            },
            list: [{
                border: '',
                link: imgSrc,
                name: 'testName',
                type: 'img'
            }]
        }];
        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();
            let tabs = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group .mat-tab-label'));
            expect(tabs.length).toBe(2);
            let media = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group mat-tab-body > div > div'));
            expect(media.length).toBe(1);
            expect(media[0].nativeElement.innerHTML).toContain('<img');
            expect(media[0].nativeElement.innerHTML).toContain('src="' + imgSrc + '" alt="testName"');
        });
    })));

    it('does show single video tag according to the video type', async(inject([DomSanitizer], (sanitizer) => {
        let vidSrc = 'https://youtu.be/Mxesac55Puo';
        component.tabsAndMedia = [{
            name: 'testTabName',
            selected: {
                border: '',
                link: vidSrc,
                name: 'testName',
                type: 'vid'
            },
            list: [{
                border: '',
                link: vidSrc,
                name: 'testName',
                type: 'vid'
            }]
        }];
        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();
            let media = fixture.debugElement.queryAll(By.css('mat-sidenav-container .single-medium'));
            expect(media.length).toBe(1);
            expect(media[0].nativeElement.innerHTML).toContain('<video');
            expect(media[0].nativeElement.innerHTML).toContain('src="' + vidSrc + '"');
        });
    })));

    it('does show multiple video tags in tabs according to the video type', async(inject([DomSanitizer], (sanitizer) => {
        let vidSrc = 'https://youtu.be/Mxesac55Puo';
        component.tabsAndMedia = [{
            name: 'testTabName1',
            selected: {
                border: '',
                link: vidSrc,
                name: 'testName',
                type: 'vid'
            },
            list: [{
                border: '',
                link: vidSrc,
                name: 'testName',
                type: 'vid'
            }]
        }, {
            name: 'testTabName2',
            selected: {
                border: '',
                link: vidSrc,
                name: 'testName',
                type: 'vid'
            },
            list: [{
                border: '',
                link: vidSrc,
                name: 'testName',
                type: 'vid'
            }]
        }];
        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();
            let tabs = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group .mat-tab-label'));
            expect(tabs.length).toBe(2);
            let media = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group mat-tab-body > div > div'));
            expect(media.length).toBe(1);
            expect(media[0].nativeElement.innerHTML).toContain('<video');
            expect(media[0].nativeElement.innerHTML).toContain('src="' + vidSrc + '"');
        });
    })));

    it('does show single iframe tag according to the empty type', async(inject([DomSanitizer], (sanitizer) => {
        let docSrc = 'https://homepages.cae.wisc.edu/~ece533/images/p64int.txt';
        component.tabsAndMedia = [{
            name: 'testTabName',
            selected: {
                border: '',
                link: docSrc,
                name: 'testName',
                type: ''
            },
            list: [{
                border: '',
                link: docSrc,
                name: 'testName',
                type: ''
            }]
        }];
        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();
            let media = fixture.debugElement.queryAll(By.css('mat-sidenav-container .single-medium'));
            expect(media.length).toBe(1);
            expect(media[0].nativeElement.innerHTML).toContain('<iframe');
            expect(media[0].nativeElement.innerHTML).toContain('src="' + docSrc + '"');
        });
    })));

    it('does show multiple iframe tags in tabs according to the empty type', async(inject([DomSanitizer], (sanitizer) => {
        let docSrc = 'https://homepages.cae.wisc.edu/~ece533/images/p64int.txt';
        component.tabsAndMedia = [{
            name: 'testTabName1',
            selected: {
                border: '',
                link: docSrc,
                name: 'testName',
                type: ''
            },
            list: [{
                border: '',
                link: docSrc,
                name: 'testName',
                type: ''
            }]
        }, {
            name: 'testTabName2',
            selected: {
                border: '',
                link: docSrc,
                name: 'testName',
                type: ''
            },
            list: [{
                border: '',
                link: docSrc,
                name: 'testName',
                type: ''
            }]
        }];
        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();
            let tabs = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group .mat-tab-label'));
            expect(tabs.length).toBe(2);
            let media = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group mat-tab-body > div > div'));
            expect(media.length).toBe(1);
            expect(media[0].nativeElement.innerHTML).toContain('<iframe');
            expect(media[0].nativeElement.innerHTML).toContain('src="' + docSrc + '"');
        });
    })));

    it('does show tabs and slider', async(inject([DomSanitizer], (sanitizer) =>  {
        component.tabsAndMedia = [{
            name: 'testTabName1',
            selected: {
                border: '',
                link: 'testLinkValue1',
                name: 'testNameValue1',
                type: ''
            },
            list: [{
                border: '',
                link: 'testLinkValue1',
                name: 'testNameValue1',
                type: ''
            }, {
                border: '',
                link: 'testLinkValue3',
                name: 'testNameValue3',
                type: ''
            }]
        }, {
            name: 'testTabName2',
            selected: {
                border: '',
                link: 'testLinkValue2',
                name: 'testNameValue2',
                type: ''
            },
            list: [{
                border: '',
                link: 'testLinkValue2',
                name: 'testNameValue2',
                type: ''
            }]
        }];
        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();

            expect(component.tabsAndMedia.length).toBe(2);

            let tabs = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group .mat-tab-label'));
            expect(tabs.length).toBe(2);
            expect(tabs[0].nativeElement.textContent).toBe('testTabName1');
            expect(tabs[0].nativeElement.classList.contains('mat-tab-label-active')).toBe(true);
            expect(tabs[1].nativeElement.textContent).toBe('testTabName2');
            expect(tabs[1].nativeElement.classList.contains('mat-tab-label-active')).toBe(false);

            let slider = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-tab-group mat-slider'));
            expect(slider.length).toBe(1);
        });
    })));

    it('does show single medium and slider', async(inject([DomSanitizer], (sanitizer) =>  {
        let imgSrc = 'https://homepages.cae.wisc.edu/~ece533/images/airplane.png';
        component.tabsAndMedia = [{
            name: 'testTabName1',
            selected: {
                border: '',
                link: imgSrc,
                name: 'testName',
                type: 'img'
            },
            list: [{
                border: '',
                link: imgSrc,
                name: 'testName',
                type: 'img'
            }, {
                border: '',
                link: imgSrc,
                name: 'testName',
                type: 'img'
            }]
        }];
        fixture.detectChanges();

        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let media = fixture.debugElement.queryAll(By.css('mat-sidenav-container .single-medium'));
            expect(media.length).toBe(1);
            expect(media[0].nativeElement.innerHTML).toContain('<img');
            expect(media[0].nativeElement.innerHTML).toContain('src="' + imgSrc + '" alt="testName"');

            let slider = fixture.debugElement.queryAll(By.css('mat-sidenav-container mat-slider'));
            expect(slider.length).toBe(1);
        });
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
            ActiveGridService,
            ConnectionService,
            { provide: DatasetService, useClass: DatasetServiceMock },
            ExportService,
            ErrorNotificationService,
            FilterService,
            ThemesService,
            VisualizationService,
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
            { provide: 'url', useValue: 'https://kafka.apache.org/intro' }
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
        expect(component.options.id).toEqual(undefined);
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
    });

    it('does show header in toolbar with title from config', (() => {
        fixture.detectChanges();
        let header = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toBe('Test Title');
    }));

    it('does show selects in sidenav options menu that have expected options', async(() => {
        fixture.detectChanges();
        fixture.whenStable().then(() => {
            fixture.detectChanges();

            let inputs = fixture.debugElement.queryAll(
                By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field input'));
            expect(inputs.length).toBe(5);

            expect(inputs[0].attributes.placeholder).toEqual('Title');
            expect(inputs[0].nativeElement.value).toEqual('Test Title');

            expect(inputs[1].attributes.placeholder).toEqual('Border');
            expect(inputs[1].nativeElement.value).toEqual('grey');

            expect(inputs[2].attributes.placeholder).toEqual('ID');
            expect(inputs[2].nativeElement.value).toEqual('');

            expect(inputs[3].attributes.placeholder).toEqual('Link Prefix');
            expect(inputs[3].nativeElement.value).toEqual('prefix/');

            expect(inputs[4].attributes.placeholder).toEqual('URL');
            expect(inputs[4].nativeElement.value).toEqual('https://kafka.apache.org/intro');

            let options;
            let selects = fixture.debugElement.queryAll(
                By.css('mat-sidenav-container mat-sidenav mat-card mat-card-content mat-form-field mat-select'));
            expect(selects.length).toBe(6);

            expect(selects[0].componentInstance.disabled).toEqual(false);
            expect(selects[0].componentInstance.placeholder).toEqual('Database');
            expect(selects[0].componentInstance.required).toEqual(true);
            options = selects[0].componentInstance.options.toArray();
            expect(options.length).toEqual(2);
            expect(options[0].getLabel()).toEqual('Test Database 1');
            expect(options[0].selected).toEqual(true);
            expect(options[1].getLabel()).toEqual('Test Database 2');
            expect(options[1].selected).toEqual(false);

            expect(selects[1].componentInstance.disabled).toEqual(false);
            expect(selects[1].componentInstance.placeholder).toEqual('Table');
            expect(selects[1].componentInstance.required).toEqual(true);
            options = selects[1].componentInstance.options.toArray();
            expect(options.length).toEqual(2);
            expect(options[0].getLabel()).toEqual('Test Table 1');
            expect(options[0].selected).toEqual(true);
            expect(options[1].getLabel()).toEqual('Test Table 2');
            expect(options[1].selected).toEqual(false);

            expect(selects[2].componentInstance.disabled).toEqual(false);
            expect(selects[2].componentInstance.placeholder).toEqual('ID Field');
            expect(selects[2].componentInstance.required).toEqual(true);
            options = selects[2].componentInstance.options.toArray();
            expect(options.length).toEqual(DatasetServiceMock.FIELDS.length);
            for (let i = 0; i < DatasetServiceMock.FIELDS.length; ++i) {
                expect(options[i].getLabel()).toEqual(DatasetServiceMock.FIELDS[i].prettyName);
                expect(options[i].selected).toEqual(DatasetServiceMock.FIELDS[i].columnName === 'testIdField');
            }

            expect(selects[3].componentInstance.disabled).toEqual(false);
            expect(selects[3].componentInstance.placeholder).toEqual('Link Fields');
            expect(selects[3].componentInstance.required).toEqual(true);
            options = selects[3].componentInstance.options.toArray();
            expect(options.length).toEqual(DatasetServiceMock.FIELDS.length);
            for (let i = 0; i < DatasetServiceMock.FIELDS.length; ++i) {
                expect(options[i].getLabel()).toEqual(DatasetServiceMock.FIELDS[i].prettyName);
                expect(options[i].selected).toEqual(DatasetServiceMock.FIELDS[i].columnName === 'testLinkField');
            }

            expect(selects[4].componentInstance.disabled).toEqual(false);
            expect(selects[4].componentInstance.placeholder).toEqual('Name Field');
            expect(selects[4].componentInstance.required).toEqual(false);
            options = selects[4].componentInstance.options.toArray();
            expect(options.length).toEqual(DatasetServiceMock.FIELDS.length + 1);
            expect(options[0].getLabel()).toEqual('(None)');
            for (let i = 0; i < DatasetServiceMock.FIELDS.length; ++i) {
                expect(options[i + 1].getLabel()).toEqual(DatasetServiceMock.FIELDS[i].prettyName);
                expect(options[i + 1].selected).toEqual(DatasetServiceMock.FIELDS[i].columnName === 'testNameField');
            }

            expect(selects[5].componentInstance.disabled).toEqual(false);
            expect(selects[5].componentInstance.placeholder).toEqual('Type Field');
            expect(selects[5].componentInstance.required).toEqual(false);
            options = selects[5].componentInstance.options.toArray();
            expect(options.length).toEqual(DatasetServiceMock.FIELDS.length + 1);
            expect(options[0].getLabel()).toEqual('(None)');
            for (let i = 0; i < DatasetServiceMock.FIELDS.length; ++i) {
                expect(options[i + 1].getLabel()).toEqual(DatasetServiceMock.FIELDS[i].prettyName);
                expect(options[i + 1].selected).toEqual(DatasetServiceMock.FIELDS[i].columnName === 'testTypeField');
            }
        });
    }));
});
