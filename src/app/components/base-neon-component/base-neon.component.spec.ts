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

import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import {
    Component,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Injector,
    OnInit,
    ViewEncapsulation
} from '@angular/core';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';

import { AbstractSearchService, AggregationType } from '../../services/abstract.search.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterBehavior, FilterService } from '../../services/filter.service';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FieldMetaData } from '../../dataset';
import { NeonGTDConfig } from '../../neon-gtd-config';
import {
    OptionChoices,
    WidgetFieldArrayOption,
    WidgetFieldOption,
    WidgetFreeTextOption,
    WidgetMultipleSelectOption,
    WidgetNonPrimitiveOption,
    WidgetOption,
    WidgetOptionCollection,
    WidgetSelectOption
} from '../../widget-option';
import { eventing } from 'neon-framework';
import { OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';
import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { neonEvents } from '../../neon-namespaces';
import { MatDialog, MatDialogModule } from '@angular/material';
import { of } from 'rxjs';
import { ConfigService } from '../../services/config.service';
import { DynamicDialogComponent } from '../dynamic-dialog/dynamic-dialog.component';

@Component({
    selector: 'app-test-base-neon',
    templateUrl: './base-neon.component.html',
    styleUrls: ['./base-neon.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
class TestBaseNeonComponent extends BaseNeonComponent implements OnInit, OnDestroy {
    public filters: any[] = [];

    // It's not a useless constructor!  Silly linter!
    /* eslint-disable-next-line @typescript-eslint/no-useless-constructor */
    constructor(
        datasetService: DatasetService,
        filterService: FilterService,
        searchService: AbstractSearchService,
        injector: Injector,
        changeDetection: ChangeDetectorRef,
        dialog: MatDialog
    ) {
        super(
            datasetService,
            filterService,
            searchService,
            injector,
            changeDetection,
            dialog
        );
    }

    designEachFilterWithNoValues(): FilterBehavior[] {
        return [];
    }

    createFieldOptions(): (WidgetFieldOption | WidgetFieldArrayOption)[] {
        return [];
    }

    createNonFieldOptions(): WidgetOption[] {
        return [];
    }

    getElementRefs() {
        return {};
    }

    getVisualizationDefaultLimit(): number {
        return 1000;
    }

    getVisualizationDefaultTitle(): string {
        return 'Mock Superclass';
    }

    validateVisualizationQuery() {
        return false;
    }

    finalizeVisualizationQuery(__options, query, filters) {
        if (filters.length) {
            this.searchService.updateFilter(query, this.searchService.buildCompoundFilterClause(filters));
        }
        return query;
    }

    transformVisualizationQueryResults(__options, __results) {
        return 0;
    }

    refreshVisualization() {
        //
    }
}

@Component({
    selector: 'app-test-advanced-neon',
    templateUrl: './base-neon.component.html',
    styleUrls: ['./base-neon.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
class TestAdvancedNeonComponent extends TestBaseNeonComponent {
    createFieldOptions(): (WidgetFieldOption | WidgetFieldArrayOption)[] {
        return [
            new WidgetFieldOption('testRequiredField', 'Test Required Field', true),
            new WidgetFieldOption('testOptionalField', 'Test Optional Field', false),
            new WidgetFieldArrayOption('testMultipleFields', 'Test Multiple Fields', false)
        ];
    }

    createNonFieldOptions(): WidgetOption[] {
        return [
            new WidgetFreeTextOption('testFreeText', 'Test Free Text', ''),
            new WidgetMultipleSelectOption('testMultipleSelect', 'Test Multiple Select', [], [{
                prettyName: 'A',
                variable: 'a'
            }, {
                prettyName: 'B',
                variable: 'b'
            }, {
                prettyName: 'C',
                variable: 'c'
            }]),
            new WidgetNonPrimitiveOption('testArray', 'Test Array', []),
            new WidgetNonPrimitiveOption('testObject', 'Test Object', {}),
            new WidgetSelectOption('testSelect', 'Test Select', 'y', [{
                prettyName: 'X',
                variable: 'x'
            }, {
                prettyName: 'Y',
                variable: 'y'
            }, {
                prettyName: 'Z',
                variable: 'z'
            }]),
            new WidgetSelectOption('testToggle', 'Test Toggle', false, OptionChoices.NoFalseYesTrue)
        ];
    }
}

describe('BaseNeonComponent', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: BaseNeonComponent;
    let fixture: ComponentFixture<BaseNeonComponent>;

    initializeTestBed('Base Neon', {
        declarations: [
            TestBaseNeonComponent
        ],
        imports: [
            MatDialogModule,
            BrowserAnimationsModule,
            FormsModule
        ],
        providers: [
            { provide: DatasetService, useClass: DatasetServiceMock },
            FilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            Injector,
            { provide: ConfigService, useValue: ConfigService.as(testConfig) },
            { provide: 'testDate', useValue: 'testDateField' },
            { provide: 'testFake', useValue: 'testFakeField' },
            { provide: 'testList', useValue: ['testDateField', 'testFakeField', 'testNameField', 'testSizeField'] },
            { provide: 'testName', useValue: 'testNameField' },
            { provide: 'testSize', useValue: 'testSizeField' },
            { provide: 'testFieldKey1', useValue: 'field_key_1' },
            { provide: 'testListWithFieldKey', useValue: ['field_key_1', 'testNameField'] }
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestBaseNeonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        // Unsubscribe
        component.ngOnDestroy();
    });

    it('does have expected properties', () => {
        expect(component['id']).toBeDefined();
        expect(component['messenger']).toBeDefined();

        expect(component['layerIdToElementCount']).toEqual(new Map<string, number>());
        expect(component['layerIdToQueryIdToQueryObject']).toEqual(new Map<string, Map<string, any>>());

        expect(component['errorMessage']).toEqual('');
        expect(component['initializing']).toEqual(false);
        expect(component['loadingCount']).toEqual(0);
        expect(component['redrawOnResize']).toEqual(false);
        expect(component['selectedDataId']).toEqual('');
        expect(component['showingZeroOrMultipleElementsPerResult']).toEqual(false);
        expect(component['updateOnSelectId']).toEqual(false);

        expect(component['lastPage']).toEqual(true);
        expect(component['page']).toEqual(1);
    });

    it('does have expected option properties', () => {
        expect(component.options).toBeDefined();
        expect(component.options.customEventsToPublish).toEqual([]);
        expect(component.options.customEventsToReceive).toEqual([]);
        expect(component.options.database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(component.options.databases).toEqual(DatasetServiceMock.DATABASES);
        expect(component.options.fields).toEqual(DatasetServiceMock.FIELDS);
        expect(component.options.filter).toEqual(null);
        expect(component.options.hideUnfiltered).toEqual(false);
        expect(component.options.limit).toEqual(1000);
        expect(component.options.table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(component.options.tables).toEqual(DatasetServiceMock.TABLES);
        expect(component.options.title).toEqual('Mock Superclass');
        expect(component.options.unsharedFilterField).toEqual(new FieldMetaData());
        expect(component.options.unsharedFilterValue).toEqual('');
    });

    it('ngOnInit does work as expected', () => {
        component['id'] = null;
        component.options = null;
        let spyInitialize = spyOn(component, 'initializeProperties');
        let spyMessengerSubscribe = spyOn(component['messenger'], 'subscribe');
        component.ngOnInit();
        expect(component['id']).toBeDefined();
        expect(component['initializing']).toEqual(false);
        expect(component.options).toBeDefined();
        expect(spyInitialize.calls.count()).toEqual(1);
        expect(spyMessengerSubscribe.calls.count()).toEqual(3);
        expect(spyMessengerSubscribe.calls.argsFor(0)[0]).toEqual(neonEvents.DASHBOARD_REFRESH);
        expect(spyMessengerSubscribe.calls.argsFor(1)[0]).toEqual('filters_changed');
        expect(spyMessengerSubscribe.calls.argsFor(2)[0]).toEqual(neonEvents.SELECT_ID);
    });

    it('ngAfterViewInit does work as expected', () => {
        let spyConstruct = spyOn(component, 'constructVisualization');
        let spyExecute = spyOn(component, 'executeAllQueryChain');
        component.ngAfterViewInit();
        expect(spyConstruct.calls.count()).toEqual(1);
        expect(spyExecute.calls.count()).toEqual(1);
    });

    it('ngAfterViewInit on multi layer widget does work as expected', () => {
        component.addLayer(component.options);
        let spyConstruct = spyOn(component, 'constructVisualization');
        let spyExecute = spyOn(component, 'executeAllQueryChain');
        component.ngAfterViewInit();
        expect(spyConstruct.calls.count()).toEqual(1);
        expect(spyExecute.calls.count()).toEqual(1);
    });

    it('ngOnDestroy does work as expected', () => {
        let spyDestroy = spyOn(component, 'destroyVisualization');
        let spyMessengerUnsubscribe = spyOn(component['messenger'], 'unsubscribeAll');
        let spyMessengerPublish = spyOn(component['messenger'], 'publish');
        component.ngOnDestroy();
        expect(spyDestroy.calls.count()).toEqual(1);
        expect(spyMessengerUnsubscribe.calls.count()).toEqual(1);
        expect(spyMessengerPublish.calls.count()).toEqual(1);
        expect(spyMessengerPublish.calls.argsFor(0)).toEqual([neonEvents.WIDGET_UNREGISTER, {
            id: component['id']
        }]);
    });

    it('addLayer with this.options does add a new layer to this.options', () => {
        expect(component.options.layers.length).toEqual(0);
        let spyPostAddLayer = spyOn(component, 'postAddLayer');
        component.addLayer(component.options);
        expect(component.options.layers.length).toEqual(1);
        expect(component.options.layers[0].title).toEqual('Layer 1');
        expect(component.options.layers[0].databases).toEqual(DatasetServiceMock.DATABASES);
        expect(component.options.layers[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(component.options.layers[0].tables).toEqual(DatasetServiceMock.TABLES);
        expect(component.options.layers[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(component.options.layers[0].fields).toEqual(DatasetServiceMock.FIELDS);
        expect(component['layerIdToQueryIdToQueryObject'].get(component.options.layers[0]._id)).toEqual(new Map<string, any>());
        expect(spyPostAddLayer.calls.count()).toEqual(1);
        expect(spyPostAddLayer.calls.argsFor(0)).toEqual([component.options.layers[0]]);
    });

    it('addLayer with options does add a new layer to it', () => {
        let inputOptions: any = new WidgetOptionCollection(() => [], undefined, {});
        expect(inputOptions.layers.length).toEqual(0);
        let spyPostAddLayer = spyOn(component, 'postAddLayer');
        component.addLayer(inputOptions);
        expect(inputOptions.layers.length).toEqual(1);
        expect(inputOptions.layers[0].title).toEqual('Layer 1');
        expect(inputOptions.layers[0].databases).toEqual(DatasetServiceMock.DATABASES);
        expect(inputOptions.layers[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(inputOptions.layers[0].tables).toEqual(DatasetServiceMock.TABLES);
        expect(inputOptions.layers[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(inputOptions.layers[0].fields).toEqual(DatasetServiceMock.FIELDS);
        expect(component['layerIdToQueryIdToQueryObject'].get(inputOptions.layers[0]._id)).toEqual(new Map<string, any>());
        expect(spyPostAddLayer.calls.count()).toEqual(1);
        expect(spyPostAddLayer.calls.argsFor(0)).toEqual([inputOptions.layers[0]]);
    });

    it('addLayer with options with existing layers does add a new layer to it', () => {
        let inputOptions: any = new WidgetOptionCollection(() => [], undefined, {});
        inputOptions.layers.push(new WidgetOptionCollection(() => [], undefined, {}));
        expect(inputOptions.layers.length).toEqual(1);
        let spyPostAddLayer = spyOn(component, 'postAddLayer');
        component.addLayer(inputOptions);
        expect(inputOptions.layers.length).toEqual(2);
        expect(inputOptions.layers[1].title).toEqual('Layer 1');
        expect(inputOptions.layers[1].databases).toEqual(DatasetServiceMock.DATABASES);
        expect(inputOptions.layers[1].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(inputOptions.layers[1].tables).toEqual(DatasetServiceMock.TABLES);
        expect(inputOptions.layers[1].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(inputOptions.layers[1].fields).toEqual(DatasetServiceMock.FIELDS);
        expect(component['layerIdToQueryIdToQueryObject'].get(inputOptions.layers[1]._id)).toEqual(new Map<string, any>());
        expect(spyPostAddLayer.calls.count()).toEqual(1);
        expect(spyPostAddLayer.calls.argsFor(0)).toEqual([inputOptions.layers[1]]);
    });

    it('addLayer with options and bindings does add a new layer to it', () => {
        let inputOptions: any = new WidgetOptionCollection(() => [], undefined, {});
        expect(inputOptions.layers.length).toEqual(0);
        /* eslint-disable-next-line @typescript-eslint/unbound-method */
        component.createLayerFieldOptions = () => [new WidgetFieldOption('testField', 'Test Field', false)];
        /* eslint-disable-next-line @typescript-eslint/unbound-method */
        component.createLayerNonFieldOptions = () => [new WidgetFreeTextOption('testValue', 'Test Value', '')];
        let spyPostAddLayer = spyOn(component, 'postAddLayer');
        component.addLayer(inputOptions, {
            tableKey: 'table_key_2',
            testField: 'testCategoryField',
            testValue: 'value binding',
            title: 'Title Binding'
        });
        expect(inputOptions.layers.length).toEqual(1);
        expect(inputOptions.layers[0].title).toEqual('Title Binding');
        expect(inputOptions.layers[0].databases).toEqual(DatasetServiceMock.DATABASES);
        expect(inputOptions.layers[0].database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect(inputOptions.layers[0].tables).toEqual(DatasetServiceMock.TABLES);
        expect(inputOptions.layers[0].table).toEqual(DatasetServiceMock.TABLES[1]);
        expect(inputOptions.layers[0].fields).toEqual(DatasetServiceMock.FIELDS);
        expect(inputOptions.layers[0].testField).toEqual(DatasetServiceMock.CATEGORY_FIELD);
        expect(inputOptions.layers[0].testValue).toEqual('value binding');
        expect(component['layerIdToQueryIdToQueryObject'].get(inputOptions.layers[0]._id)).toEqual(new Map<string, any>());
        expect(spyPostAddLayer.calls.count()).toEqual(1);
        expect(spyPostAddLayer.calls.argsFor(0)).toEqual([inputOptions.layers[0]]);
    });

    it('createCompleteVisualizationQuery does return expected query object', () => {
        expect(component.createCompleteVisualizationQuery(component.options)).toEqual({
            database: 'testDatabase1',
            table: 'testTable1',
            fields: ['*']
        });
    });

    it('createCompleteVisualizationQuery with advanced options does return expected query object', () => {
        component.options.database = DatasetServiceMock.DATABASES[1];
        component.options.table = DatasetServiceMock.TABLES[1];
        component.options.unsharedFilterField = DatasetServiceMock.FILTER_FIELD;
        component.options.unsharedFilterValue = 'testFilterValue';
        component.options.filter = {
            lhs: 'testIdField',
            operator: '!=',
            rhs: 'testIdValue'
        };
        component.options.append(new WidgetFieldOption('testEmptyField', 'Test Empty Field', false), new FieldMetaData());
        component.options.append(new WidgetFieldOption('testField', 'Test Field', false), DatasetServiceMock.CATEGORY_FIELD);
        component.options.append(
            new WidgetFieldArrayOption('testFieldArray', 'Test Field Array', false),
            [DatasetServiceMock.X_FIELD, DatasetServiceMock.Y_FIELD]
        );
        component.options.customEventsToPublish = [{
            fields: [{
                columnName: 'testDateField'
            }]
        }, {
            fields: [{
                columnName: 'testLinkField'
            }, {
                columnName: 'testNameField'
            }]
        }];
        component.options.customEventsToReceive = [{
            fields: [{
                columnName: 'testSizeField'
            }]
        }, {
            fields: [{
                columnName: 'testTextField'
            }, {
                columnName: 'testTypeField'
            }]
        }];

        expect(component.createCompleteVisualizationQuery(component.options)).toEqual({
            database: 'testDatabase2',
            table: 'testTable2',
            fields: [
                'testIdField',
                'testFilterField',
                'testCategoryField',
                'testXField',
                'testYField',
                'testDateField',
                'testLinkField',
                'testNameField',
                'testSizeField',
                'testTextField',
                'testTypeField'
            ],
            filter: {
                type: 'and',
                filters: [{
                    field: 'testIdField',
                    operator: '!=',
                    value: 'testIdValue'
                }, {
                    field: 'testFilterField',
                    operator: '=',
                    value: 'testFilterValue'
                }]
            }
        });
    });

    it('createExportData does return expected data', () => {
        let spyExportFields = spyOn(component, 'getExportFields').and.returnValue([{
            columnName: 'export_1',
            prettyName: 'Export 1'
        }, {
            columnName: 'export_2',
            prettyName: 'Export 2'
        }]);
        expect(component.createExportData()).toEqual([{
            data: {
                fields: [{
                    query: 'export_1',
                    pretty: 'Export 1'
                }, {
                    query: 'export_2',
                    pretty: 'Export 2'
                }],
                ignoreFilters: undefined,
                ignoredFilterIds: [],
                name: 'Mock Superclass-' + component.options._id,
                query: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    fields: ['*']
                },
                selectionOnly: undefined,
                type: 'query'
            }
        }]);
        expect(spyExportFields.calls.count()).toEqual(1);
        expect(spyExportFields.calls.argsFor(0)).toEqual([component.options]);
    });

    it('createExportData with multiple layers does return expected data', () => {
        // Setup:  Create multiple layers
        component.addLayer(component.options);
        component.addLayer(component.options);
        expect(component.options.layers.length).toEqual(2);
        expect(component.options.layers[0].title).toEqual('Layer 1');
        expect(component.options.layers[1].title).toEqual('Layer 2');
        component.options.layers[1].database = DatasetServiceMock.DATABASES[1];
        component.options.layers[1].table = DatasetServiceMock.TABLES[1];
        // End setup

        let spyExportFields = spyOn(component, 'getExportFields').and.callFake((options, __query) => {
            if (options === component.options.layers[0]) {
                return [{
                    columnName: 'export_1',
                    prettyName: 'Export 1'
                }, {
                    columnName: 'export_2',
                    prettyName: 'Export 2'
                }];
            }
            if (options === component.options.layers[1]) {
                return [{
                    columnName: 'export_3',
                    prettyName: 'Export 3'
                }, {
                    columnName: 'export_4',
                    prettyName: 'Export 4'
                }];
            }
            return [];
        });
        expect(component.createExportData()).toEqual([{
            data: {
                fields: [{
                    query: 'export_1',
                    pretty: 'Export 1'
                }, {
                    query: 'export_2',
                    pretty: 'Export 2'
                }],
                ignoreFilters: undefined,
                ignoredFilterIds: [],
                name: 'Layer 1-' + component.options.layers[0]._id,
                query: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    fields: ['*']
                },
                selectionOnly: undefined,
                type: 'query'
            }
        }, {
            data: {
                fields: [{
                    query: 'export_3',
                    pretty: 'Export 3'
                }, {
                    query: 'export_4',
                    pretty: 'Export 4'
                }],
                ignoreFilters: undefined,
                ignoredFilterIds: [],
                name: 'Layer 2-' + component.options.layers[1]._id,
                query: {
                    database: 'testDatabase2',
                    table: 'testTable2',
                    fields: ['*']
                },
                selectionOnly: undefined,
                type: 'query'
            }
        }]);
        expect(spyExportFields.calls.count()).toEqual(2);
        expect(spyExportFields.calls.argsFor(0)).toEqual([component.options.layers[0]]);
        expect(spyExportFields.calls.argsFor(1)).toEqual([component.options.layers[1]]);
    });

    it('createLayer does return expected object', () => {
        let layerOptions = component['createLayer'](component.options);
        expect(component.options.layers.length).toEqual(1);
        expect(component.options.layers[0].title).toEqual('Layer 1');
        expect(component.options.layers[0].databases).toEqual(DatasetServiceMock.DATABASES);
        expect(component.options.layers[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(component.options.layers[0].tables).toEqual(DatasetServiceMock.TABLES);
        expect(component.options.layers[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(component.options.layers[0].fields).toEqual(DatasetServiceMock.FIELDS);
        expect(component.options.layers[0]).toEqual(layerOptions);
    });

    it('createLayer with bindings does return expected object', () => {
        let layerOptions = component['createLayer'](component.options, {
            tableKey: 'table_key_2',
            title: 'Title Binding'
        });
        expect(component.options.layers.length).toEqual(1);
        expect(component.options.layers[0].title).toEqual('Title Binding');
        expect(component.options.layers[0].databases).toEqual(DatasetServiceMock.DATABASES);
        expect(component.options.layers[0].database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect(component.options.layers[0].tables).toEqual(DatasetServiceMock.TABLES);
        expect(component.options.layers[0].table).toEqual(DatasetServiceMock.TABLES[1]);
        expect(component.options.layers[0].fields).toEqual(DatasetServiceMock.FIELDS);
        expect(component.options.layers[0]).toEqual(layerOptions);
    });

    it('createSharedFilters does return expected array', () => {
        expect(component.createSharedFilters(component.options)).toEqual([]);

        component.options.filter = {
            lhs: 'testField1',
            operator: '!=',
            rhs: 'testValue1'
        };

        expect(component.createSharedFilters(component.options)).toEqual([{
            field: 'testField1',
            operator: '!=',
            value: 'testValue1'
        }]);

        component.options.unsharedFilterField = new FieldMetaData('testField2');
        component.options.unsharedFilterValue = 'testValue2';

        expect(component.createSharedFilters(component.options)).toEqual([{
            field: 'testField1',
            operator: '!=',
            value: 'testValue1'
        }, {
            field: 'testField2',
            operator: '=',
            value: 'testValue2'
        }]);

        component.options.filter = null;

        expect(component.createSharedFilters(component.options)).toEqual([{
            field: 'testField2',
            operator: '=',
            value: 'testValue2'
        }]);

        component.options.unsharedFilterField = null;
        component.options.unsharedFilterValue = null;

        spyOn((component as any), 'getGlobalFilterClauses').and.returnValue([{
            field: 'testField1',
            operator: '>',
            value: 'testValue1'
        }, {
            field: 'testField2',
            operator: '<',
            value: 'testValue2'
        }]);

        expect(component.createSharedFilters(component.options)).toEqual([{
            field: 'testField1',
            operator: '>',
            value: 'testValue1'
        }, {
            field: 'testField2',
            operator: '<',
            value: 'testValue2'
        }]);

        component.options.filter = {
            lhs: 'testField3',
            operator: '!=',
            rhs: 'testValue3'
        };

        expect(component.createSharedFilters(component.options)).toEqual([{
            field: 'testField1',
            operator: '>',
            value: 'testValue1'
        }, {
            field: 'testField2',
            operator: '<',
            value: 'testValue2'
        }, {
            field: 'testField3',
            operator: '!=',
            value: 'testValue3'
        }]);

        component.options.unsharedFilterField = new FieldMetaData('testField4');
        component.options.unsharedFilterValue = 'testValue4';

        expect(component.createSharedFilters(component.options)).toEqual([{
            field: 'testField1',
            operator: '>',
            value: 'testValue1'
        }, {
            field: 'testField2',
            operator: '<',
            value: 'testValue2'
        }, {
            field: 'testField3',
            operator: '!=',
            value: 'testValue3'
        }, {
            field: 'testField4',
            operator: '=',
            value: 'testValue4'
        }]);
    });

    it('deleteLayer does work as expected', () => {
        component.addLayer(component.options);
        let id1 = component.options.layers[0]._id;
        expect(component.options.layers.length).toEqual(1);

        let result = component['deleteLayer'](component.options, component.options.layers[0]);
        expect(component.options.layers.length).toEqual(1);
        expect(component.options.layers[0]._id).toEqual(id1);
        expect(result).toEqual(false);

        component.addLayer(component.options);
        let id2 = component.options.layers[1]._id;
        expect(component.options.layers.length).toEqual(2);

        result = component['deleteLayer'](component.options, component.options.layers[0]);
        expect(component.options.layers.length).toEqual(1);
        expect(component.options.layers[0]._id).toEqual(id2);
        expect(result).toEqual(true);

        result = component['deleteLayer'](component.options, component.options.layers[0]);
        expect(component.options.layers.length).toEqual(1);
        expect(component.options.layers[0]._id).toEqual(id2);
        expect(result).toEqual(false);
    });

    it('executeAllQueryChain does call executeQueryChain', () => {
        let spy = spyOn(component, 'executeQueryChain');

        component['executeAllQueryChain']();
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([component.options]);

        component.addLayer(component.options);
        component.addLayer(component.options);
        expect(component.options.layers.length).toEqual(2);

        component['executeAllQueryChain']();
        expect(spy.calls.count()).toEqual(3);
        expect(spy.calls.argsFor(1)).toEqual([component.options.layers[0]]);
        expect(spy.calls.argsFor(2)).toEqual([component.options.layers[1]]);
    });

    it('executeAllQueryChain does not call executeQueryChain if initializing', () => {
        let spy = spyOn(component, 'executeQueryChain');

        component['initializing'] = true;
        component['executeAllQueryChain']();
        expect(spy.calls.count()).toEqual(0);

        component.addLayer(component.options);
        component.addLayer(component.options);
        expect(component.options.layers.length).toEqual(2);

        component['initializing'] = true;
        component['executeAllQueryChain']();
        expect(spy.calls.count()).toEqual(0);
    });

    it('executeQueryChain does call executeQuery', () => {
        let spy = spyOn(component, 'executeQuery');
        /* eslint-disable-next-line @typescript-eslint/unbound-method */
        component.validateVisualizationQuery = () => true;
        component['executeQueryChain']();
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)[0]).toEqual(component.options);
        expect(spy.calls.argsFor(0)[1]).toEqual({
            database: 'testDatabase1',
            table: 'testTable1',
            fields: ['*'],
            limit: 1000
        });
        expect(spy.calls.argsFor(0)[2]).toEqual('default visualization query');
        expect(spy.calls.argsFor(0)[3]).toBeDefined();
    });

    it('executeQueryChain does not call executeQuery if initializing or validateVisualizationQuery is false', () => {
        let spy = spyOn(component, 'executeQuery');
        component['initializing'] = true;
        /* eslint-disable-next-line @typescript-eslint/unbound-method */
        component.validateVisualizationQuery = () => true;
        component['executeQueryChain']();
        expect(spy.calls.count()).toEqual(0);

        (component['initializing'] as boolean) = false;
        /* eslint-disable-next-line @typescript-eslint/unbound-method */
        component.validateVisualizationQuery = () => false;
        component['executeQueryChain']();
        expect(spy.calls.count()).toEqual(0);
    });

    it('executeQueryChain with pagination does call executeQuery', () => {
        let spy = spyOn(component, 'executeQuery');
        component['visualizationQueryPaginates'] = true;
        /* eslint-disable-next-line @typescript-eslint/unbound-method */
        component.validateVisualizationQuery = () => true;
        component['executeQueryChain']();
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)[0]).toEqual(component.options);
        expect(spy.calls.argsFor(0)[1]).toEqual({
            database: 'testDatabase1',
            table: 'testTable1',
            fields: ['*'],
            limit: 1000,
            offset: 0
        });
        expect(spy.calls.argsFor(0)[2]).toEqual('default visualization query');
        expect(spy.calls.argsFor(0)[3]).toBeDefined();

        component['page'] = 2;
        component['executeQueryChain']();
        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)[0]).toEqual(component.options);
        expect(spy.calls.argsFor(1)[1]).toEqual({
            database: 'testDatabase1',
            table: 'testTable1',
            fields: ['*'],
            limit: 1000,
            offset: 1000
        });
        expect(spy.calls.argsFor(1)[2]).toEqual('default visualization query');
        expect(spy.calls.argsFor(1)[3]).toBeDefined();
    });

    it('executeQueryChain with advanced options does call executeQuery', () => {
        component.options.database = DatasetServiceMock.DATABASES[1];
        component.options.table = DatasetServiceMock.TABLES[1];
        component.options.unsharedFilterField = DatasetServiceMock.FILTER_FIELD;
        component.options.unsharedFilterValue = 'testFilterValue';
        component.options.filter = {
            lhs: 'testIdField',
            operator: '!=',
            rhs: 'testIdValue'
        };
        component.options.append(new WidgetFieldOption('testEmptyField', 'Test Empty Field', false), new FieldMetaData());
        component.options.append(new WidgetFieldOption('testField', 'Test Field', false), DatasetServiceMock.CATEGORY_FIELD);
        component.options.append(new WidgetFieldArrayOption('testFieldArray', 'Test Field Array', false), [DatasetServiceMock.X_FIELD,
            DatasetServiceMock.Y_FIELD]);
        component.options.customEventsToPublish = [{
            fields: [{
                columnName: 'testDateField'
            }]
        }, {
            fields: [{
                columnName: 'testLinkField'
            }, {
                columnName: 'testNameField'
            }]
        }];
        component.options.customEventsToReceive = [{
            fields: [{
                columnName: 'testSizeField'
            }]
        }, {
            fields: [{
                columnName: 'testTextField'
            }, {
                columnName: 'testTypeField'
            }]
        }];

        let spy = spyOn(component, 'executeQuery');
        /* eslint-disable-next-line @typescript-eslint/unbound-method */
        component.validateVisualizationQuery = () => true;
        component['executeQueryChain']();
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)[0]).toEqual(component.options);
        expect(spy.calls.argsFor(0)[1]).toEqual({
            database: 'testDatabase2',
            table: 'testTable2',
            fields: [
                'testIdField',
                'testFilterField',
                'testCategoryField',
                'testXField',
                'testYField',
                'testDateField',
                'testLinkField',
                'testNameField',
                'testSizeField',
                'testTextField',
                'testTypeField'
            ],
            filter: {
                type: 'and',
                filters: [{
                    field: 'testIdField',
                    operator: '!=',
                    value: 'testIdValue'
                }, {
                    field: 'testFilterField',
                    operator: '=',
                    value: 'testFilterValue'
                }]
            },
            limit: 1000
        });
        expect(spy.calls.argsFor(0)[2]).toEqual('default visualization query');
        expect(spy.calls.argsFor(0)[3]).toBeDefined();
    });

    it('getVisualizationTitle does return expected string', () => {
        expect(component.getVisualizationTitle('dataTableTitle')).toEqual('Documents');
        expect(component.getVisualizationTitle('News Feed')).toEqual('News Feed');
    });

    it('finalizeCreateLayer does work as expected', () => {
        let options = {
            _id: 'testId'
        };
        let spy = spyOn(component, 'postAddLayer');
        component['finalizeCreateLayer'](options);
        expect(component['layerIdToQueryIdToQueryObject'].has('testId')).toEqual(true);
        let queryIdToQueryObject: Map<string, any> = component['layerIdToQueryIdToQueryObject'].get('testId');
        expect(queryIdToQueryObject.size).toEqual(0);
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([options]);
    });

    it('finalizeDeleteLayer does work as expected', () => {
        let options = {
            _id: 'testId'
        };
        let queryIdToQueryObject = new Map<string, any>();
        let calledA = 0;
        let calledB = 0;
        queryIdToQueryObject.set('a', {
            abort: () => {
                calledA++;
            }
        });
        queryIdToQueryObject.set('b', {
            abort: () => {
                calledB++;
            }
        });
        component['layerIdToQueryIdToQueryObject'].set('testId', queryIdToQueryObject);
        let spy = spyOn(component, 'handleChangeData');
        component['finalizeDeleteLayer'](options);
        expect(calledA).toEqual(1);
        expect(calledB).toEqual(1);
        expect(component['layerIdToQueryIdToQueryObject'].has('testId')).toEqual(false);
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([options]);
    });

    it('finishQueryExecution does work as expected', () => {
        let spyUpdateHeader = spyOn(component, 'updateHeaderTextStyles');
        let spyRefreshVisualization = spyOn(component, 'refreshVisualization');
        let spyNoData = spyOn(component, 'noDataCheck');

        component['finishQueryExecution']();
        expect(component['loadingCount']).toEqual(-1);
        expect(spyUpdateHeader.calls.count()).toEqual(1);
        expect(spyRefreshVisualization.calls.count()).toEqual(1);
        expect(spyNoData.calls.count()).toEqual(1);
    });

    it('noDataCheck works as intended', () => {
        component.noDataCheck();
        expect(component.showNoData).toEqual(false);
    });

    it('getBindings does return expected object', () => {
        expect(component.getBindings()).toEqual({
            contributionKeys: null,
            customEventsToPublish: [],
            customEventsToReceive: [],
            database: 'testDatabase1',
            filter: null,
            hideUnfiltered: false,
            layers: undefined,
            limit: 1000,
            table: 'testTable1',
            title: 'Mock Superclass',
            unsharedFilterValue: '',
            unsharedFilterField: ''
        });

        component.options.append(new WidgetFieldOption('testField', 'Test Field', false), new FieldMetaData());
        component.options.append(new WidgetFreeTextOption('testValue', 'Test Value', ''), '');
        expect(component.getBindings()).toEqual({
            contributionKeys: null,
            customEventsToPublish: [],
            customEventsToReceive: [],
            database: 'testDatabase1',
            filter: null,
            hideUnfiltered: false,
            layers: undefined,
            limit: 1000,
            table: 'testTable1',
            testField: '',
            testValue: '',
            title: 'Mock Superclass',
            unsharedFilterValue: '',
            unsharedFilterField: ''
        });
    });

    it('getButtonText does return expected string', () => {
        expect(component.getButtonText()).toEqual('');

        component['layerIdToElementCount'].set(component.options._id, 0);
        expect(component.getButtonText()).toEqual('0 Results');

        component['layerIdToElementCount'].set(component.options._id, 1);
        expect(component.getButtonText()).toEqual('1 Result');

        component['layerIdToElementCount'].set(component.options._id, 2);
        expect(component.getButtonText()).toEqual('2 Results');

        component['layerIdToElementCount'].set(component.options._id, 1234);
        expect(component.getButtonText()).toEqual('1,234 Results');
    });

    it('getButtonText with multiple layers does return expected string', () => {
        expect(component.getButtonText()).toEqual('');

        let layerA: any = new WidgetOptionCollection(() => [], undefined, {});
        layerA.title = 'Layer A';
        component.options.layers.push(layerA);

        component['layerIdToElementCount'].set(layerA._id, 0);
        expect(component.getButtonText()).toEqual('0 Results');

        component['layerIdToElementCount'].set(layerA._id, 1);
        expect(component.getButtonText()).toEqual('1 Result');

        component['layerIdToElementCount'].set(layerA._id, 2);
        expect(component.getButtonText()).toEqual('2 Results');

        let layerB: any = new WidgetOptionCollection(() => [], undefined, {});
        layerB.title = 'Layer B';
        component.options.layers.push(layerB);

        component['layerIdToElementCount'].set(layerB._id, 0);
        expect(component.getButtonText()).toEqual('Layer A (2 Results), Layer B (0 Results)');

        component['layerIdToElementCount'].set(layerB._id, 10);
        expect(component.getButtonText()).toEqual('Layer A (2 Results), Layer B (10 Results)');

        component['layerIdToElementCount'].set(layerA._id, 1234);
        expect(component.getButtonText()).toEqual('Layer A (1,234 Results), Layer B (10 Results)');

        component['layerIdToElementCount'].delete(layerA._id);
        expect(component.getButtonText()).toEqual('Layer B (10 Results)');
    });

    it('getButtonText with pagination does return expected string', () => {
        component['visualizationQueryPaginates'] = true;

        expect(component.getButtonText()).toEqual('');

        component['layerIdToElementCount'].set(component.options._id, 0);
        expect(component.getButtonText()).toEqual('0 Results');

        component['layerIdToElementCount'].set(component.options._id, 1234);
        expect(component.getButtonText()).toEqual('1 - 1,000 of 1,234 Results');

        component.options.limit = 100;
        expect(component.getButtonText()).toEqual('1 - 100 of 1,234 Results');

        component['page'] = 2;
        expect(component.getButtonText()).toEqual('101 - 200 of 1,234 Results');

        component['page'] = 13;
        expect(component.getButtonText()).toEqual('1,201 - 1,234 of 1,234 Results');
    });

    it('getExportFields does return expected array', () => {
        expect(component.getExportFields()).toEqual([]);

        component.options.append(new WidgetFieldOption('testEmptyField', 'Test Empty Field', false), new FieldMetaData());
        component.options.append(new WidgetFieldOption('testField1', 'Test Field 1', false), DatasetServiceMock.NAME_FIELD);
        component.options.append(new WidgetFieldOption('testField2', 'Test Field 2', false), DatasetServiceMock.TYPE_FIELD);
        component.options.append(new WidgetFieldOption('testRepeatedField', 'Test Repeated Field', false), DatasetServiceMock.NAME_FIELD);
        component.options.append(new WidgetFieldArrayOption('testFieldArray', 'Test Field Array', false), [DatasetServiceMock.X_FIELD,
            DatasetServiceMock.Y_FIELD]);

        expect(component.getExportFields()).toEqual([{
            columnName: 'testNameField',
            prettyName: 'Test Name Field'
        }, {
            columnName: 'testTypeField',
            prettyName: 'Test Type Field'
        }, {
            columnName: 'testXField',
            prettyName: 'Test X Field'
        }, {
            columnName: 'testYField',
            prettyName: 'Test Y Field'
        }]);
    });

    it('getGlobalFilterClauses does return expected array', () => {
        expect(component['getGlobalFilterClauses'](component.options)).toEqual([]);

        spyOn(component['filterService'], 'getFiltersToSearch').and.returnValue([{
            field: 'testField1',
            operator: '!=',
            value: 'testValue1'
        }, {
            field: 'testField2',
            operator: '=',
            value: 'testValue2'
        }]);

        expect(component['getGlobalFilterClauses'](component.options)).toEqual([{
            field: 'testField1',
            operator: '!=',
            value: 'testValue1'
        }, {
            field: 'testField2',
            operator: '=',
            value: 'testValue2'
        }]);
    });

    it('getGlobalFilterClauses with cached filters and shouldFilterSelf()=>false does call getFiltersToSearch with expected list', () => {
        let called = 0;
        spyOn((component as any), 'shouldFilterSelf').and.returnValue(false);
        spyOn(component['cachedFilters'], 'getDataSources').and.returnValue(['key1', 'key2']);
        spyOn(component['cachedFilters'], 'getFilters').and.callFake((key) => {
            if (key === 'key1') {
                return [{
                    toDesign: () => ({
                        field: 'testField1',
                        operator: '!=',
                        value: 'testValue1'
                    })
                }];
            }
            if (key === 'key2') {
                return [{
                    toDesign: () => ({
                        field: 'testField2',
                        operator: '=',
                        value: 'testValue2'
                    })
                }];
            }
            return [];
        });
        spyOn(component['filterService'], 'getFiltersToSearch').and.callFake((__datastore, __database, __table, __search, ignoreList) => {
            ++called;
            expect(ignoreList).toEqual([{
                field: 'testField1',
                operator: '!=',
                value: 'testValue1'
            }, {
                field: 'testField2',
                operator: '=',
                value: 'testValue2'
            }]);
            return [];
        });

        component['getGlobalFilterClauses'](component.options);
        expect(called).toEqual(1);
    });

    it('getGlobalFilterClauses with cached filters and shouldFilterSelf()=>true does call getFiltersToSearch with expected list', () => {
        let called = 0;
        spyOn((component as any), 'shouldFilterSelf').and.returnValue(true);
        spyOn(component['cachedFilters'], 'getDataSources').and.returnValue(['key1', 'key2']);
        spyOn(component['cachedFilters'], 'getFilters').and.callFake((key) => {
            if (key === 'key1') {
                return [{
                    toDesign: () => [{
                        field: 'testField1',
                        operator: '!=',
                        value: 'testValue1'
                    }]
                }];
            }
            if (key === 'key2') {
                return [{
                    toDesign: () => [{
                        field: 'testField2',
                        operator: '=',
                        value: 'testValue2'
                    }]
                }];
            }
            return [];
        });
        spyOn(component['filterService'], 'getFiltersToSearch').and.callFake((__datastore, __database, __table, __search, ignoreList) => {
            ++called;
            expect(ignoreList).toEqual([]);
            return [];
        });

        component['getGlobalFilterClauses'](component.options);
        expect(called).toEqual(1);
    });

    it('getVisualizationDefaultLimit does return expected number', () => {
        expect(component.getVisualizationDefaultLimit()).toEqual(1000);
    });

    it('getVisualizationDefaultTitle does return expected string', () => {
        expect(component.getVisualizationDefaultTitle()).toEqual('Mock Superclass');
    });

    it('goToNextPage does not update page or execute query if lastPage is true', () => {
        let spy = spyOn(component, 'executeAllQueryChain');
        component.goToNextPage();

        expect(component['page']).toEqual(1);
        expect(spy.calls.count()).toEqual(0);
    });

    it('goToNextPage does update page and execute query if lastPage is false', () => {
        let spy = spyOn(component, 'executeAllQueryChain');
        component['lastPage'] = false;

        component.goToNextPage();
        expect(component['page']).toEqual(2);
        expect(spy.calls.count()).toEqual(1);

        component.goToNextPage();
        expect(component['page']).toEqual(3);
        expect(spy.calls.count()).toEqual(2);
    });

    it('goToPreviousPage does not update page or execute query if page is 1', () => {
        let spy = spyOn(component, 'executeAllQueryChain');
        component.goToPreviousPage();

        expect(component['page']).toEqual(1);
        expect(spy.calls.count()).toEqual(0);
    });

    it('goToPreviousPage does update page and execute query if page is not 1', () => {
        let spy = spyOn(component, 'executeAllQueryChain');
        component['page'] = 3;

        component.goToPreviousPage();
        expect(component['page']).toEqual(2);
        expect(spy.calls.count()).toEqual(1);

        component.goToPreviousPage();
        expect(component['page']).toEqual(1);
        expect(spy.calls.count()).toEqual(2);
    });

    it('handleChangeFilterField does work as expected', () => {
        let spyUpdateFilters = spyOn((component as any), 'updateCollectionWithGlobalCompatibleFilters');
        let spyChangeData = spyOn(component, 'handleChangeData');

        component.handleChangeFilterField(component.options);

        expect(spyUpdateFilters.calls.count()).toEqual(1);
        expect(spyChangeData.calls.count()).toEqual(1);
        expect(spyChangeData.calls.argsFor(0)).toEqual([component.options, undefined]);
    });

    it('handleChangeData does work as expected', () => {
        let spyChangeData = spyOn(component, 'onChangeData');
        let spyExecuteQuery = spyOn(component, 'executeAllQueryChain');
        component['layerIdToElementCount'].set(component.options._id, 1234);
        component['errorMessage'] = 'testErrorMessage';
        component['lastPage'] = false;
        component['page'] = 2;
        component['showingZeroOrMultipleElementsPerResult'] = true;
        component.handleChangeData();
        expect(component['layerIdToElementCount'].get(component.options._id)).toEqual(0);
        expect(component['errorMessage']).toEqual('');
        expect(component['lastPage']).toEqual(true);
        expect(component['page']).toEqual(1);
        expect(component['showingZeroOrMultipleElementsPerResult']).toEqual(false);
        expect(spyChangeData.calls.count()).toEqual(1);
        expect(spyExecuteQuery.calls.count()).toEqual(1);
    });

    it('handleChangeData with options argument does work as expected', () => {
        let spyChangeData = spyOn(component, 'onChangeData');
        let spyExecuteQuery = spyOn(component, 'executeQueryChain');
        let options = {
            _id: 'testId'
        };
        component['layerIdToElementCount'].set('testId', 1234);
        component['errorMessage'] = 'testErrorMessage';
        component['lastPage'] = false;
        component['page'] = 2;
        component['showingZeroOrMultipleElementsPerResult'] = true;
        component.handleChangeData(options);
        expect(component['layerIdToElementCount'].get('testId')).toEqual(0);
        expect(component['errorMessage']).toEqual('');
        expect(component['lastPage']).toEqual(true);
        expect(component['page']).toEqual(1);
        expect(component['showingZeroOrMultipleElementsPerResult']).toEqual(false);
        expect(spyChangeData.calls.count()).toEqual(1);
        expect(spyExecuteQuery.calls.count()).toEqual(1);
        expect(spyExecuteQuery.calls.argsFor(0)).toEqual([options]);
    });

    it('handleSuccessfulVisualizationQuery with no data does work as expected', (done) => {
        let spy = spyOn(component, 'handleTransformVisualizationQueryResults');
        component['handleSuccessfulVisualizationQuery'](component.options, {}, () => {
            expect(spy.calls.count()).toEqual(0);
            expect(component['errorMessage']).toEqual('No Data');
            expect(component['layerIdToElementCount'].get(component.options._id)).toEqual(0);
            done();
        });
    });

    it('handleSuccessfulVisualizationQuery does call handleTransformVisualizationQueryResults with expected failure callback', (done) => {
        let spy = spyOn(component, 'handleTransformVisualizationQueryResults');
        let expectedError = new Error('Test Error');
        /* eslint-disable-next-line @typescript-eslint/unbound-method */
        component['messenger'].publish = () => {
            // Override the messenger publish function so it does not print expected error messages to the console during the test.
        };

        component['handleSuccessfulVisualizationQuery'](component.options, {
            data: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
        }, () => {
            expect(component['errorMessage']).toEqual('Error');
            expect(component['layerIdToElementCount'].get(component.options._id)).toEqual(0);
            done();
        });
        expect(spy.calls.count()).toEqual(1);
        let args = spy.calls.argsFor(0);
        expect(args[0]).toEqual(component.options);
        expect(args[1]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        expect(typeof args[2]).toEqual('function');
        expect(typeof args[3]).toEqual('function');

        // Call the failure callback
        args[3](expectedError);
    });

    it('handleSuccessfulVisualizationQuery does call handleTransformVisualizationQueryResults with expected success callback', (done) => {
        let spy = spyOn(component, 'handleTransformVisualizationQueryResults');
        component['handleSuccessfulVisualizationQuery'](component.options, {
            data: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
        }, () => {
            expect(component['errorMessage']).toEqual('');
            expect(component['layerIdToElementCount'].get(component.options._id)).toEqual(10);
            done();
        });
        expect(spy.calls.count()).toEqual(1);
        let args = spy.calls.argsFor(0);
        expect(args[0]).toEqual(component.options);
        expect(args[1]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        expect(typeof args[2]).toEqual('function');
        expect(typeof args[3]).toEqual('function');

        // Call the success callback
        args[2](10);
    });

    it('handleSuccessfulVisualizationQuery with pagination does execute total count query and does not call the success callback', () => {
        let spy = spyOn(component, 'handleTransformVisualizationQueryResults');
        let spyExecuteQuery = spyOn(component, 'executeQuery');
        component['visualizationQueryPaginates'] = true;
        component['handleSuccessfulVisualizationQuery'](component.options, {
            data: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
        }, () => {
            fail();
        });
        expect(spy.calls.count()).toEqual(1);
        expect(spyExecuteQuery.calls.count()).toEqual(0);
        let args = spy.calls.argsFor(0);
        expect(args[0]).toEqual(component.options);
        expect(args[1]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        expect(typeof args[2]).toEqual('function');
        expect(typeof args[3]).toEqual('function');

        // Call the success callback
        args[2](10);
        expect(component['errorMessage']).toEqual('');
        expect(component['layerIdToElementCount'].has(component.options._id)).toEqual(false);
        expect(spyExecuteQuery.calls.count()).toEqual(1);
        expect(spyExecuteQuery.calls.argsFor(0)[0]).toEqual(component.options);
        expect(spyExecuteQuery.calls.argsFor(0)[1]).toEqual({
            database: 'testDatabase1',
            table: 'testTable1',
            fields: ['*'],
            aggregation: [{
                name: '_count',
                type: AggregationType.COUNT,
                field: '*'
            }]
        });
        expect(spyExecuteQuery.calls.argsFor(0)[2]).toEqual('total count query');
        expect(spyExecuteQuery.calls.argsFor(0)[3]).toBeDefined();
    });

    it('handleSuccessfulVisualizationQuery with pagination and page > 1 and element count does always execute total count query', () => {
        let spy = spyOn(component, 'handleTransformVisualizationQueryResults');
        let spyExecuteQuery = spyOn(component, 'executeQuery');
        component.options.limit = 10;
        component['lastPage'] = false;
        component['layerIdToElementCount'].set(component.options._id, 20);
        component['page'] = 2;
        component['visualizationQueryPaginates'] = true;
        component['handleSuccessfulVisualizationQuery'](component.options, {
            data: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
        }, () => {
            fail();
        });
        expect(spy.calls.count()).toEqual(1);
        expect(spyExecuteQuery.calls.count()).toEqual(0);
        let args = spy.calls.argsFor(0);
        expect(args[0]).toEqual(component.options);
        expect(args[1]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        expect(typeof args[2]).toEqual('function');
        expect(typeof args[3]).toEqual('function');

        // Call the success callback
        args[2](10);
        expect(component['errorMessage']).toEqual('');
        expect(spyExecuteQuery.calls.count()).toEqual(1);
        expect(spyExecuteQuery.calls.argsFor(0)[0]).toEqual(component.options);
        expect(spyExecuteQuery.calls.argsFor(0)[1]).toEqual({
            database: 'testDatabase1',
            table: 'testTable1',
            fields: ['*'],
            aggregation: [{
                name: '_count',
                type: AggregationType.COUNT,
                field: '*'
            }]
        });
        expect(spyExecuteQuery.calls.argsFor(0)[2]).toEqual('total count query');
        expect(spyExecuteQuery.calls.argsFor(0)[3]).toBeDefined();
    });

    it('handleSuccessfulVisualizationQuery with showingZeroOrMultipleElementsPerResult does not execute total count query', (done) => {
        let spy = spyOn(component, 'handleTransformVisualizationQueryResults');
        let spyExecuteQuery = spyOn(component, 'executeQuery');
        component['visualizationQueryPaginates'] = true;
        component['showingZeroOrMultipleElementsPerResult'] = true;
        component['lastPage'] = true;
        component['handleSuccessfulVisualizationQuery'](component.options, {
            data: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
        }, () => {
            expect(component['errorMessage']).toEqual('');
            expect(component['lastPage']).toEqual(false);
            expect(component['layerIdToElementCount'].get(component.options._id)).toEqual(10);
            expect(spyExecuteQuery.calls.count()).toEqual(0);
            done();
        });
        expect(spy.calls.count()).toEqual(1);
        expect(spyExecuteQuery.calls.count()).toEqual(0);
        let args = spy.calls.argsFor(0);
        expect(args[0]).toEqual(component.options);
        expect(args[1]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        expect(typeof args[2]).toEqual('function');
        expect(typeof args[3]).toEqual('function');

        // Call the success callback
        args[2](10);
    });

    it('handleSuccessfulTotalCountQuery with data does update properties and call callback', (done) => {
        component['lastPage'] = true;
        component['handleSuccessfulTotalCountQuery'](component.options, {
            data: [{
                _count: 4321
            }]
        }, () => {
            expect(component['layerIdToElementCount'].get(component.options._id)).toEqual(4321);
            expect(component['lastPage']).toEqual(false);
            expect(component['loadingCount']).toEqual(-1);
            done();
        });
    });

    it('handleSuccessfulTotalCountQuery with no data does update properties and call callback', (done) => {
        component['lastPage'] = true;
        component['handleSuccessfulTotalCountQuery'](component.options, {}, () => {
            expect(component['layerIdToElementCount'].get(component.options._id)).toEqual(0);
            expect(component['lastPage']).toEqual(true);
            expect(component['loadingCount']).toEqual(-1);
            done();
        });
    });

    it('handleTransformVisualizationQueryResults does call success callback function', (done) => {
        let expectedOptions = new WidgetOptionCollection(() => [], undefined, {});
        let expectedResults = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        /* eslint-disable-next-line @typescript-eslint/unbound-method */
        component.transformVisualizationQueryResults = (options, results) => {
            expect(options).toEqual(expectedOptions);
            expect(results).toEqual(expectedResults);
            return 10;
        };

        let successCallback = (elementCount: number) => {
            expect(elementCount).toEqual(10);
            done();
        };
        let failureCallback = (__err: Error) => {
            fail();
            done();
        };
        component['handleTransformVisualizationQueryResults'](expectedOptions, expectedResults, successCallback, failureCallback);
    });

    it('handleTransformVisualizationQueryResults does call failure callback function', (done) => {
        let expectedError = new Error('Test Error');
        let expectedOptions = new WidgetOptionCollection(() => [], undefined, {});
        let expectedResults = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        /* eslint-disable-next-line @typescript-eslint/unbound-method */
        component.transformVisualizationQueryResults = (__options, __results) => {
            throw expectedError;
        };

        let successCallback = (__elementCount: number) => {
            fail();
            done();
        };
        let failureCallback = (err: Error) => {
            expect(err).toEqual(expectedError);
            done();
        };
        component['handleTransformVisualizationQueryResults'](expectedOptions, expectedResults, successCallback, failureCallback);
    });

    it('hasUnsharedFilter does return expected boolean', () => {
        expect(component['hasUnsharedFilter']()).toEqual(false);
        component.options.unsharedFilterField = DatasetServiceMock.FILTER_FIELD;
        expect(component['hasUnsharedFilter']()).toEqual(false);
        component.options.unsharedFilterValue = '';
        expect(component['hasUnsharedFilter']()).toEqual(false);
        component.options.unsharedFilterValue = 0;
        expect(component['hasUnsharedFilter']()).toEqual(true);
        component.options.unsharedFilterValue = false;
        expect(component['hasUnsharedFilter']()).toEqual(true);
        component.options.unsharedFilterValue = 'value';
        expect(component['hasUnsharedFilter']()).toEqual(true);

        // Given argument, still returns false
        expect(component['hasUnsharedFilter']({})).toEqual(false);
    });

    it('hasUnsharedFilter with options argument does return expected boolean', () => {
        expect(component['hasUnsharedFilter']({})).toEqual(false);
        expect(component['hasUnsharedFilter']({
            unsharedFilterField: DatasetServiceMock.FILTER_FIELD
        })).toEqual(false);
        expect(component['hasUnsharedFilter']({
            unsharedFilterField: DatasetServiceMock.FILTER_FIELD,
            unsharedFilterValue: ''
        })).toEqual(false);
        expect(component['hasUnsharedFilter']({
            unsharedFilterField: DatasetServiceMock.FILTER_FIELD,
            unsharedFilterValue: 0
        })).toEqual(true);
        expect(component['hasUnsharedFilter']({
            unsharedFilterField: DatasetServiceMock.FILTER_FIELD,
            unsharedFilterValue: false
        })).toEqual(true);
        expect(component['hasUnsharedFilter']({
            unsharedFilterField: DatasetServiceMock.FILTER_FIELD,
            unsharedFilterValue: 'value'
        })).toEqual(true);

        // Given no argument, still returns false
        expect(component['hasUnsharedFilter']()).toEqual(false);
    });

    it('isFiltered does call filterService.isFiltered', () => {
        let expectedFilterDesign = {};
        let spy = spyOn(component['filterService'], 'isFiltered').and.returnValue(true);

        component['isFiltered']();
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([component['cachedFilters'], undefined]);

        component['isFiltered'](expectedFilterDesign);
        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)).toEqual([component['cachedFilters'], expectedFilterDesign]);
    });

    it('isNumber does return expected boolean', () => {
        expect(component.isNumber(true)).toEqual(false);
        expect(component.isNumber('a')).toEqual(false);
        expect(component.isNumber([1, 2])).toEqual(false);
        expect(component.isNumber({
            value: 1
        })).toEqual(false);

        expect(component.isNumber(1)).toEqual(true);
        expect(component.isNumber(12.34)).toEqual(true);
        expect(component.isNumber(-12.34)).toEqual(true);
        expect(component.isNumber('1')).toEqual(true);
        expect(component.isNumber('12.34')).toEqual(true);
        expect(component.isNumber('-12.34')).toEqual(true);
    });

    it('onResizeStop works as expected', () => {
        let spyUpdateHeader = spyOn(component, 'updateHeaderTextStyles');
        let spyUpdateSubclass = spyOn(component, 'updateOnResize');
        let spyRefreshVisualization = spyOn(component, 'refreshVisualization');
        component.onResizeStop();
        expect(spyUpdateHeader.calls.count()).toEqual(1);
        expect(spyUpdateSubclass.calls.count()).toEqual(1);
        expect(spyRefreshVisualization.calls.count()).toEqual(0);
    });

    it('onResizeStop does call refreshVisualization if redrawOnResize is true', (done) => {
        component['redrawOnResize'] = true;
        let spyUpdateHeader = spyOn(component, 'updateHeaderTextStyles');
        let spyUpdateSubclass = spyOn(component, 'updateOnResize');
        let spyRefreshVisualization = spyOn(component, 'refreshVisualization');
        component.onResizeStop();
        expect(spyUpdateHeader.calls.count()).toEqual(1);
        expect(spyUpdateSubclass.calls.count()).toEqual(1);
        setTimeout(() => {
            expect(spyRefreshVisualization.calls.count()).toEqual(1);
            done();
        }, 500);
    });

    it('prettifyInteger does return expected string', () => {
        expect(component.prettifyInteger(0)).toEqual('0');
        expect(component.prettifyInteger(1)).toEqual('1');
        expect(component.prettifyInteger(12)).toEqual('12');
        expect(component.prettifyInteger(123)).toEqual('123');
        expect(component.prettifyInteger(1234)).toEqual('1,234');
        expect(component.prettifyInteger(1234567890)).toEqual('1,234,567,890');
    });

    it('shouldFilterSelf does return expected boolean', () => {
        expect(component['shouldFilterSelf']()).toEqual(true);
        component.options.ignoreSelf = true;
        expect(component['shouldFilterSelf']()).toEqual(false);
    });

    it('showPagination does return expected boolean', () => {
        expect(component.showPagination()).toEqual(false);

        component['visualizationQueryPaginates'] = true;
        expect(component.showPagination()).toEqual(false);

        component['page'] = 2;
        expect(component.showPagination()).toEqual(true);

        component['page'] = 1;
        component['showingZeroOrMultipleElementsPerResult'] = true;
        expect(component.showPagination()).toEqual(true);

        (component['showingZeroOrMultipleElementsPerResult'] as boolean) = false;
        component['layerIdToElementCount'].set(component.options._id, 1000);
        expect(component.showPagination()).toEqual(false);

        component['layerIdToElementCount'].set(component.options._id, 2000);
        expect(component.showPagination()).toEqual(true);

        component.options.limit = 2000;
        expect(component.showPagination()).toEqual(false);

        component['layerIdToElementCount'].set(component.options._id, 3000);
        expect(component.showPagination()).toEqual(true);

        (component['visualizationQueryPaginates'] as boolean) = false;
        expect(component.showPagination()).toEqual(false);
    });

    it('stopEventPropagation does work as expected', () => {
        let event1: any = {};
        component.stopEventPropagation(event1);
        expect(event1.returnValue).toEqual(false);

        let called = 0;
        let event2: any = {
            stopPropagation: () => {
                called++;
            }
        };
        component.stopEventPropagation(event2);
        expect(event2.returnValue).toEqual(undefined);
        expect(called).toEqual(1);
    });

    it('updateHeaderTextStyles does update headerText styles', () => {
        let elementRefs = {
            headerText: {
                nativeElement: {
                    style: {
                        maxWidth: 0
                    }
                }
            },
            infoText: {
                nativeElement: {
                    clientWidth: 100
                }
            },
            visualization: {
                nativeElement: {
                    clientWidth: 1000
                }
            }
        };
        /* eslint-disable-next-line @typescript-eslint/unbound-method */
        component.getElementRefs = () => elementRefs;
        component['updateHeaderTextStyles']();
        expect(elementRefs.headerText.nativeElement.style.maxWidth).toEqual('839px');
    });

    it('updateCollectionWithGlobalCompatibleFilters does call filterService.updateCollectionWithGlobalCompatibleFilters', () => {
        let spy = spyOn(component['filterService'], 'updateCollectionWithGlobalCompatibleFilters');

        component['updateCollectionWithGlobalCompatibleFilters']();
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[], component['cachedFilters']]);

        let compatibleFilterBehaviorList = [{
            filterDesign: {},
            redrawCallback: () => { /* Do nothing */ }
        }, {
            filterDesign: {},
            redrawCallback: () => { /* Do nothing */ }
        }];
        spyOn((component as any), 'designEachFilterWithNoValues').and.returnValue(compatibleFilterBehaviorList);

        component['updateCollectionWithGlobalCompatibleFilters']();
        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)).toEqual([compatibleFilterBehaviorList, component['cachedFilters']]);
    });

    it('does call updateCollectionWithGlobalCompatibleFilters and executeAllQueryChain on FILTERS_CHANGED event', () => {
        component['id'] = 'testId';
        spyOn((component as any), 'shouldFilterSelf').and.returnValue(true);

        let spyUpdateFilters = spyOn((component as any), 'updateCollectionWithGlobalCompatibleFilters');
        let spyExecuteQuery = spyOn((component as any), 'executeAllQueryChain');

        let messenger = new eventing.Messenger();
        messenger.publish(neonEvents.FILTERS_CHANGED, {
            source: 'testSource'
        });

        expect(spyUpdateFilters.calls.count()).toEqual(1);
        expect(spyExecuteQuery.calls.count()).toEqual(1);
    });

    it('does call updateCollectionWithGlobalCompatibleFilters and executeAllQueryChain on FILTERS_CHANGED event if ID=source', () => {
        component['id'] = 'testSource';
        spyOn((component as any), 'shouldFilterSelf').and.returnValue(true);

        let spyUpdateFilters = spyOn((component as any), 'updateCollectionWithGlobalCompatibleFilters');
        let spyExecuteQuery = spyOn((component as any), 'executeAllQueryChain');

        let messenger = new eventing.Messenger();
        messenger.publish(neonEvents.FILTERS_CHANGED, {
            source: 'testSource'
        });

        expect(spyUpdateFilters.calls.count()).toEqual(1);
        expect(spyExecuteQuery.calls.count()).toEqual(1);
    });

    it('does call updateCollectionWithGlobalCompatibleFilters and executeAllQueryChain on FILTERS_CHANGED event if !filterSelf', () => {
        component['id'] = 'testId';
        spyOn((component as any), 'shouldFilterSelf').and.returnValue(false);

        let spyUpdateFilters = spyOn((component as any), 'updateCollectionWithGlobalCompatibleFilters');
        let spyExecuteQuery = spyOn((component as any), 'executeAllQueryChain');

        let messenger = new eventing.Messenger();
        messenger.publish(neonEvents.FILTERS_CHANGED, {
            source: 'testSource'
        });

        expect(spyUpdateFilters.calls.count()).toEqual(1);
        expect(spyExecuteQuery.calls.count()).toEqual(1);
    });

    it('does not call executeAllQueryChain on FILTERS_CHANGED event if ID equals source AND shouldFilterSelf()=>false', () => {
        component['id'] = 'testSource';
        spyOn((component as any), 'shouldFilterSelf').and.returnValue(false);

        let spyUpdateFilters = spyOn((component as any), 'updateCollectionWithGlobalCompatibleFilters');
        let spyExecuteQuery = spyOn((component as any), 'executeAllQueryChain');

        let messenger = new eventing.Messenger();
        messenger.publish(neonEvents.FILTERS_CHANGED, {
            caller: 'testSource'
        });

        expect(spyUpdateFilters.calls.count()).toEqual(1);
        expect(spyExecuteQuery.calls.count()).toEqual(0);
    });

    it('deleteFilters does call filterService.deleteFilters and update savedPages', () => {
        spyOn((component as any), 'shouldFilterSelf').and.returnValue(false);
        let map = new Map<any, any[]>();
        map.set('key1', [{
            id: 'filterId1'
        }]);
        let spy = spyOn(component['filterService'], 'deleteFilters').and.returnValue(map);
        component['id'] = 'testId';
        component['page'] = 10;
        component['savedPages'].set('filterId1', 5);

        component.deleteFilters();

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testId', component['searchService'], undefined]);
        expect(component['savedPages'].has('filterId1')).toEqual(false);
        expect(component['page']).toEqual(10);
    });

    it('deleteFilters does update page if shouldFilterSelf()=>true', () => {
        spyOn((component as any), 'shouldFilterSelf').and.returnValue(true);
        let map = new Map<any, any[]>();
        map.set('key1', [{
            id: 'filterId1'
        }]);
        let spy = spyOn(component['filterService'], 'deleteFilters').and.returnValue(map);
        component['id'] = 'testId';
        component['page'] = 10;
        component['savedPages'].set('filterId1', 5);

        component.deleteFilters();

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testId', component['searchService'], undefined]);
        expect(component['savedPages'].has('filterId1')).toEqual(false);
        expect(component['page']).toEqual(5);
    });

    it('exchangeFilters does call filterService.exchangeFilters and update savedPages', () => {
        spyOn((component as any), 'shouldFilterSelf').and.returnValue(false);
        let map = new Map<any, any[]>();
        map.set('key1', [{
            id: 'filterId1'
        }]);
        let spy = spyOn(component['filterService'], 'exchangeFilters').and.returnValue(map);
        component['id'] = 'testId';
        component['page'] = 10;

        let filters = [{}];
        component.exchangeFilters(filters);

        let relations = component['datasetService'].findRelationDataList();
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testId', filters, relations, component['searchService'], undefined]);
        expect(component['savedPages'].get('filterId1')).toEqual(10);
        expect(component['page']).toEqual(10);
    });

    it('exchangeFilters does update page if shouldFilterSelf()=>true', () => {
        spyOn((component as any), 'shouldFilterSelf').and.returnValue(true);
        let map = new Map<any, any[]>();
        map.set('key1', [{
            id: 'filterId1'
        }]);
        let spy = spyOn(component['filterService'], 'exchangeFilters').and.returnValue(map);
        component['id'] = 'testId';
        component['page'] = 10;

        let filters = [{}];
        component.exchangeFilters(filters);

        let relations = component['datasetService'].findRelationDataList();
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testId', filters, relations, component['searchService'], undefined]);
        expect(component['savedPages'].get('filterId1')).toEqual(10);
        expect(component['page']).toEqual(1);
    });

    it('toggleFilters does call filterService.toggleFilters and update savedPages', () => {
        spyOn((component as any), 'shouldFilterSelf').and.returnValue(false);
        let map = new Map<any, any[]>();
        map.set('key1', [{
            id: 'filterId1'
        }]);
        let spy = spyOn(component['filterService'], 'toggleFilters').and.returnValue(map);
        component['id'] = 'testId';
        component['page'] = 10;

        let filters = [{}];
        component.toggleFilters(filters);

        let relations = component['datasetService'].findRelationDataList();
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testId', filters, relations, component['searchService']]);
        expect(component['savedPages'].get('filterId1')).toEqual(10);
        expect(component['page']).toEqual(10);
    });

    it('toggleFilters does update page if shouldFilterSelf()=>true', () => {
        spyOn((component as any), 'shouldFilterSelf').and.returnValue(true);
        let map = new Map<any, any[]>();
        map.set('key1', [{
            id: 'filterId1'
        }]);
        let spy = spyOn(component['filterService'], 'toggleFilters').and.returnValue(map);
        component['id'] = 'testId';
        component['page'] = 10;

        let filters = [{}];
        component.toggleFilters(filters);

        let relations = component['datasetService'].findRelationDataList();
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testId', filters, relations, component['searchService']]);
        expect(component['savedPages'].get('filterId1')).toEqual(10);
        expect(component['page']).toEqual(1);
    });

    it('showContribution() returns false', () => {
        expect(component['showContribution']()).toBeFalsy();
    });

    it('getContributorsForComponent() returns empty array', () => {
        expect(component['getContributorsForComponent']()).toEqual([]);
    });

    it('getContributorAbbreviations() returns empty string', () => {
        expect(component['getContributorAbbreviations']()).toEqual('');
    });
});

describe('Advanced BaseNeonComponent with config', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: BaseNeonComponent;
    let fixture: ComponentFixture<BaseNeonComponent>;

    let datasetService = new DatasetServiceMock();
    datasetService.getCurrentDashboard().contributors = {
        organization1: {
            orgName: 'Organization 1',
            abbreviation: 'ORG ONE',
            contactName: 'Test Name 1',
            contactEmail: 'test1@email.com',
            website: 'https://localhost:4200/1',
            logo: 'fake-logo-1.jpg'
        },
        organization2: {
            orgName: 'Organization 2',
            abbreviation: 'ORG TWO',
            contactName: 'Test Name 2',
            contactEmail: 'test2@email.com',
            website: 'https://localhost:4200/2',
            logo: 'fake-logo-2.jpg'
        }
    };

    initializeTestBed('Base Neon', {
        declarations: [
            TestAdvancedNeonComponent
        ],
        imports: [
            MatDialogModule
        ],
        providers: [
            { provide: DatasetService, useValue: datasetService },
            FilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            Injector,
            { provide: ConfigService, useValue: ConfigService.as(testConfig) },
            { provide: 'configFilter', useValue: { lhs: 'testConfigField', operator: '!=', rhs: 'testConfigValue' } },
            { provide: 'contributionKeys', useValue: ['organization1', 'organization2'] },
            {
                provide: 'customEventsToPublish',
                useValue: [{
                    id: 'testPublishId',
                    fields: [{
                        columnName: 'testPublishColumnName',
                        prettyName: 'testPublishPrettyName'
                    }]
                }]
            },
            {
                provide: 'customEventsToReceive',
                useValue: [{
                    id: 'testReceiveId',
                    fields: [{
                        columnName: 'testReceiveColumnName',
                        type: 'testReceiveType'
                    }]
                }]
            },
            { provide: 'hideUnfiltered', useValue: true },
            { provide: 'limit', useValue: 10 },
            { provide: 'tableKey', useValue: 'table_key_2' },
            { provide: 'testArray', useValue: [4, 3, 2, 1] },
            { provide: 'testFreeText', useValue: 'the quick brown fox jumps over the lazy dog' },
            { provide: 'testMultipleFields', useValue: ['testXField', 'testYField'] },
            { provide: 'testMultipleSelect', useValue: ['b', 'c'] },
            { provide: 'testObject', useValue: { key: 'value' } },
            { provide: 'testOptionalField', useValue: 'testNameField' },
            { provide: 'testRequiredField', useValue: 'testSizeField' },
            { provide: 'testSelect', useValue: 'z' },
            { provide: 'testToggle', useValue: true },
            { provide: 'title', useValue: 'VisualizationTitle' },
            { provide: 'unsharedFilterField', useValue: 'testFilterField' },
            { provide: 'unsharedFilterValue', useValue: 'testFilterValue' }
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestAdvancedNeonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('does have expected advanced config option properties', () => {
        expect(component.options.customEventsToPublish).toEqual([{
            id: 'testPublishId',
            fields: [{
                columnName: 'testPublishColumnName',
                prettyName: 'testPublishPrettyName'
            }]
        }]);
        expect(component.options.customEventsToReceive).toEqual([{
            id: 'testReceiveId',
            fields: [{
                columnName: 'testReceiveColumnName',
                type: 'testReceiveType'
            }]
        }]);
        expect(component.options.database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect(component.options.databases).toEqual(DatasetServiceMock.DATABASES);
        expect(component.options.fields).toEqual(DatasetServiceMock.FIELDS);
        expect(component.options.filter).toEqual({
            lhs: 'testConfigField',
            operator: '!=',
            rhs: 'testConfigValue'
        });
        expect(component.options.hideUnfiltered).toEqual(true);
        expect(component.options.limit).toEqual(10);
        expect(component.options.table).toEqual(DatasetServiceMock.TABLES[1]);
        expect(component.options.tables).toEqual(DatasetServiceMock.TABLES);
        expect(component.options.testArray).toEqual([4, 3, 2, 1]);
        expect(component.options.testFreeText).toEqual('the quick brown fox jumps over the lazy dog');
        expect(component.options.testMultipleFields).toEqual([DatasetServiceMock.X_FIELD, DatasetServiceMock.Y_FIELD]);
        expect(component.options.testMultipleSelect).toEqual(['b', 'c']);
        expect(component.options.testObject).toEqual({
            key: 'value'
        });
        expect(component.options.testOptionalField).toEqual(DatasetServiceMock.NAME_FIELD);
        expect(component.options.testRequiredField).toEqual(DatasetServiceMock.SIZE_FIELD);
        expect(component.options.testSelect).toEqual('z');
        expect(component.options.testToggle).toEqual(true);
        expect(component.options.title).toEqual('VisualizationTitle');
        expect(component.options.unsharedFilterField).toEqual(DatasetServiceMock.FILTER_FIELD);
        expect(component.options.unsharedFilterValue).toEqual('testFilterValue');
    });

    it('createCompleteVisualizationQuery on widget with advanced config does return expected query object', () => {
        expect(component.createCompleteVisualizationQuery(component.options)).toEqual({
            database: 'testDatabase2',
            table: 'testTable2',
            fields: [
                'testConfigField',
                'testSizeField',
                'testNameField',
                'testXField',
                'testYField',
                'testFilterField',
                'testPublishColumnName',
                'testReceiveColumnName'
            ],
            filter: {
                type: 'and',
                filters: [{
                    field: 'testConfigField',
                    operator: '!=',
                    value: 'testConfigValue'
                }, {
                    field: 'testFilterField',
                    operator: '=',
                    value: 'testFilterValue'
                }]
            }
        });
    });

    it('createSharedFilters on widget with advanced config does return expected array', () => {
        expect(component.createSharedFilters(component.options)).toEqual([{
            field: 'testConfigField',
            operator: '!=',
            value: 'testConfigValue'
        }, {
            field: 'testFilterField',
            operator: '=',
            value: 'testFilterValue'
        }]);
    });

    it('getBindings on widget with advanced config does return expected object', () => {
        expect(component.getBindings()).toEqual({
            contributionKeys: ['organization1', 'organization2'],
            customEventsToPublish: [{
                id: 'testPublishId',
                fields: [{
                    columnName: 'testPublishColumnName',
                    prettyName: 'testPublishPrettyName'
                }]
            }],
            customEventsToReceive: [{
                id: 'testReceiveId',
                fields: [{
                    columnName: 'testReceiveColumnName',
                    type: 'testReceiveType'
                }]
            }],
            database: 'testDatabase2',
            filter: {
                lhs: 'testConfigField',
                operator: '!=',
                rhs: 'testConfigValue'
            },
            hideUnfiltered: true,
            layers: undefined,
            limit: 10,
            table: 'testTable2',
            testArray: [4, 3, 2, 1],
            testFreeText: 'the quick brown fox jumps over the lazy dog',
            testMultipleFields: ['testXField', 'testYField'],
            testMultipleSelect: ['b', 'c'],
            testObject: {
                key: 'value'
            },
            testOptionalField: 'testNameField',
            testRequiredField: 'testSizeField',
            testSelect: 'z',
            testToggle: true,
            title: 'VisualizationTitle',
            unsharedFilterValue: 'testFilterValue',
            unsharedFilterField: 'testFilterField'
        });
    });

    it('getExportFields on widget with advanced config does return expected array', () => {
        expect(component.getExportFields()).toEqual([{
            columnName: 'testSizeField',
            prettyName: 'Test Size Field'
        }, {
            columnName: 'testNameField',
            prettyName: 'Test Name Field'
        }, {
            columnName: 'testXField',
            prettyName: 'Test X Field'
        }, {
            columnName: 'testYField',
            prettyName: 'Test Y Field'
        }, {
            columnName: 'testFilterField',
            prettyName: 'Test Filter Field'
        }]);
    });

    it('hasUnsharedFilter on widget with advanced config does return expected boolean', () => {
        expect(component['hasUnsharedFilter']()).toEqual(true);
    });

    it('showContribution() returns true', () => {
        expect(component['showContribution']()).toBeTruthy();
    });

    it('getContributorsForComponent() returns array of correct values', () => {
        expect(component['getContributorsForComponent']()).toEqual([{
            orgName: 'Organization 1',
            abbreviation: 'ORG ONE',
            contactName: 'Test Name 1',
            contactEmail: 'test1@email.com',
            website: 'https://localhost:4200/1',
            logo: 'fake-logo-1.jpg'
        }, {
            orgName: 'Organization 2',
            abbreviation: 'ORG TWO',
            contactName: 'Test Name 2',
            contactEmail: 'test2@email.com',
            website: 'https://localhost:4200/2',
            logo: 'fake-logo-2.jpg'
        }]);
    });

    it('getContributorAbbreviations() returns correctly formatted string', () => {
        expect(component['getContributorAbbreviations']()).toEqual('ORG ONE, ORG TWO');
    });

    it('openContributionDialog() has expected behavior', fakeAsync(() => {
        expect(component['contributorsRef']).toBeUndefined();
        let contributors = component['getContributorsForComponent']();
        let config = { data: { component: 'contribution-dialog', contributors: contributors }, width: '400px', minHeight: '200px' };
        spyOn(component.dialog, 'open').and.returnValue({ afterClosed: () => of({ isSuccess: true }) });

        component['openContributionDialog']();

        /* eslint-disable-next-line @typescript-eslint/unbound-method */
        expect(component.dialog.open).toHaveBeenCalledWith(DynamicDialogComponent, config);
        expect(component['contributorsRef']).toBeNull();
    }));
});
