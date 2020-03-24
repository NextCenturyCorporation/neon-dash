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

import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import {
    Component,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    OnInit,
    ViewEncapsulation,
    OnDestroy
} from '@angular/core';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';

import {
    AbstractFilterDesign,
    AbstractSearchService,
    CompoundFilterType,
    ConfigOption,
    ConfigOptionFieldArray,
    ConfigOptionField,
    ConfigOptionFreeText,
    ConfigOptionMultipleSelect,
    ConfigOptionNonPrimitive,
    ConfigOptionSelect,
    FieldConfig,
    FilterCollection,
    ListFilter,
    OptionChoices,
    SearchServiceMock
} from '@caci-critical-insight-solutions/nucleus-core';
import { DashboardService } from '../../services/dashboard.service';
import { InjectableFilterService } from '../../services/injectable.filter.service';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NeonConfig } from '../../models/types';
import { WidgetOptionCollection } from '../../models/widget-option-collection';
import { DashboardServiceMock } from '../../services/mock.dashboard-service';
import { initializeTestBed, getConfigService } from '../../../testUtils/initializeTestBed';
import { neonEvents } from '../../models/neon-namespaces';
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
        dashboardService: DashboardService,
        filterService: InjectableFilterService,
        searchService: AbstractSearchService,
        changeDetection: ChangeDetectorRef,
        dialog: MatDialog
    ) {
        super(
            dashboardService,
            filterService,
            searchService,
            changeDetection,
            dialog
        );
    }

    designEachFilterWithNoValues(): AbstractFilterDesign[] {
        return [];
    }

    createOptions(): ConfigOption[] {
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
            this.searchService.withFilter(query, this.searchService.createCompoundFilterClause(filters));
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
    createOptions(): ConfigOption[] {
        return [
            new ConfigOptionField('testRequiredField', 'Test Required Field', true),
            new ConfigOptionField('testOptionalField', 'Test Optional Field', false),
            new ConfigOptionFieldArray('testMultipleFields', 'Test Multiple Fields', false),
            new ConfigOptionFreeText('testFreeText', 'Test Free Text', false, ''),
            new ConfigOptionMultipleSelect('testMultipleSelect', 'Test Multiple Select', false, [], [{
                prettyName: 'A',
                variable: 'a'
            }, {
                prettyName: 'B',
                variable: 'b'
            }, {
                prettyName: 'C',
                variable: 'c'
            }]),
            new ConfigOptionNonPrimitive('testArray', 'Test Array', false, []),
            new ConfigOptionNonPrimitive('testObject', 'Test Object', false, {}),
            new ConfigOptionSelect('testSelect', 'Test Select', false, 'y', [{
                prettyName: 'X',
                variable: 'x'
            }, {
                prettyName: 'Y',
                variable: 'y'
            }, {
                prettyName: 'Z',
                variable: 'z'
            }]),
            new ConfigOptionSelect('testToggle', 'Test Toggle', false, false, OptionChoices.NoFalseYesTrue)
        ];
    }
}

describe('BaseNeonComponent', () => {
    let testConfig: NeonConfig = NeonConfig.get();
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
            { provide: DashboardService, useClass: DashboardServiceMock },
            InjectableFilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            { provide: ConfigService, useValue: getConfigService(testConfig) },
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
        expect(component.options.database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(component.options.databases).toEqual(DashboardServiceMock.DATABASES_LIST);
        expect(component.options.fields).toEqual(DashboardServiceMock.FIELDS);
        expect(component.options.filter).toEqual(undefined);
        expect(component.options.hideUnfiltered).toEqual('false');
        expect(component.options.limit).toEqual(1000);
        expect(component.options.table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(component.options.tables).toEqual(DashboardServiceMock.TABLES_LIST);
        expect(component.options.title).toEqual('Mock Superclass');
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
        expect(spyMessengerSubscribe.calls.count()).toEqual(2);
        expect(spyMessengerSubscribe.calls.argsFor(0)[0]).toEqual(neonEvents.DASHBOARD_REFRESH);
        expect(spyMessengerSubscribe.calls.argsFor(1)[0]).toEqual(neonEvents.SELECT_ID);
    });

    it('ngAfterViewInit does work as expected', () => {
        let spyConstruct = spyOn(component, 'constructVisualization');
        let spyExecute = spyOn(component, 'executeAllQueryChain');
        component.ngAfterViewInit();
        expect(spyConstruct.calls.count()).toEqual(1);
        expect(spyExecute.calls.count()).toEqual(1);
    });

    it('ngAfterViewInit on multi layer widget does work as expected', () => {
        component['finalizeCreateLayer'](component['createLayer'](component.options));
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

    it('createCompleteVisualizationQuery does return expected query object', () => {
        expect(JSON.parse(JSON.stringify(component.createCompleteVisualizationQuery(component.options)))).toEqual({
            selectClause: {
                database: 'testDatabase1',
                table: 'testTable1',
                fieldClauses: []
            },
            whereClause: null,
            aggregateClauses: [],
            groupByClauses: [],
            orderByClauses: [],
            limitClause: null,
            offsetClause: null,
            joinClauses: [],
            isDistinct: false
        });
    });

    it('createCompleteVisualizationQuery with advanced options does return expected query object', () => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase2;
        component.options.table = DashboardServiceMock.TABLES.testTable2;
        component.options.filter = {
            lhs: 'testIdField',
            operator: '!=',
            rhs: 'testIdValue'
        };
        component.options.append(new ConfigOptionField('testEmptyField', 'Test Empty Field', false), FieldConfig.get());
        component.options.append(new ConfigOptionField('testField', 'Test Field', false), DashboardServiceMock.FIELD_MAP.CATEGORY);
        component.options.append(
            new ConfigOptionFieldArray('testFieldArray', 'Test Field Array', false),
            [DashboardServiceMock.FIELD_MAP.X, DashboardServiceMock.FIELD_MAP.Y]
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

        expect(JSON.parse(JSON.stringify(component.createCompleteVisualizationQuery(component.options)))).toEqual({
            selectClause: {
                database: 'testDatabase2',
                table: 'testTable2',
                fieldClauses: [{
                    database: 'testDatabase2',
                    table: 'testTable2',
                    field: 'testCategoryField'
                }, {
                    database: 'testDatabase2',
                    table: 'testTable2',
                    field: 'testXField'
                }, {
                    database: 'testDatabase2',
                    table: 'testTable2',
                    field: 'testYField'
                }, {
                    database: 'testDatabase2',
                    table: 'testTable2',
                    field: 'testIdField'
                }, {
                    database: 'testDatabase2',
                    table: 'testTable2',
                    field: 'testDateField'
                }, {
                    database: 'testDatabase2',
                    table: 'testTable2',
                    field: 'testLinkField'
                }, {
                    database: 'testDatabase2',
                    table: 'testTable2',
                    field: 'testNameField'
                }, {
                    database: 'testDatabase2',
                    table: 'testTable2',
                    field: 'testSizeField'
                }, {
                    database: 'testDatabase2',
                    table: 'testTable2',
                    field: 'testTextField'
                }, {
                    database: 'testDatabase2',
                    table: 'testTable2',
                    field: 'testTypeField'
                }]
            },
            whereClause: {
                type: 'where',
                lhs: {
                    database: 'testDatabase2',
                    table: 'testTable2',
                    field: 'testIdField'
                },
                operator: '!=',
                rhs: 'testIdValue'
            },
            aggregateClauses: [],
            groupByClauses: [],
            orderByClauses: [],
            limitClause: null,
            offsetClause: null,
            joinClauses: [],
            isDistinct: false
        });
    });

    it('createCompleteVisualizationQuery with multiple config filters does return expected query object', () => {
        component.options.filter = [{
            lhs: 'testNameField',
            operator: '!=',
            rhs: 'testName'
        }, {
            lhs: 'testTypeField',
            operator: '!=',
            rhs: 'testType'
        }];
        expect(JSON.parse(JSON.stringify(component.createCompleteVisualizationQuery(component.options)))).toEqual({
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
                        field: 'testNameField'
                    },
                    operator: '!=',
                    rhs: 'testName'
                }, {
                    type: 'where',
                    lhs: {
                        database: 'testDatabase1',
                        table: 'testTable1',
                        field: 'testTypeField'
                    },
                    operator: '!=',
                    rhs: 'testType'
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
    });

    it('createCompleteVisualizationQuery with fieldkey config filters does return expected query object', () => {
        component.options.filter = [{
            lhs: 'field_key_1',
            operator: '=',
            rhs: 'testValue'
        }];
        expect(JSON.parse(JSON.stringify(component.createCompleteVisualizationQuery(component.options)))).toEqual({
            selectClause: {
                database: 'testDatabase1',
                table: 'testTable1',
                fieldClauses: []
            },
            whereClause: {
                type: 'where',
                lhs: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testFieldKeyField'
                },
                operator: '=',
                rhs: 'testValue'
            },
            aggregateClauses: [],
            groupByClauses: [],
            orderByClauses: [],
            limitClause: null,
            offsetClause: null,
            joinClauses: [],
            isDistinct: false
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
        expect(JSON.parse(JSON.stringify(component.createExportData()))).toEqual([{
            data: {
                fieldNamePrettyNamePairs: [{
                    query: 'export_1',
                    pretty: 'Export 1'
                }, {
                    query: 'export_2',
                    pretty: 'Export 2'
                }],
                fileName: 'Mock Superclass-' + component.options._id,
                query: {
                    selectClause: {
                        database: 'testDatabase1',
                        table: 'testTable1',
                        fieldClauses: []
                    },
                    whereClause: null,
                    aggregateClauses: [],
                    groupByClauses: [],
                    orderByClauses: [],
                    limitClause: null,
                    offsetClause: null,
                    joinClauses: [],
                    isDistinct: false
                },
                hostName: 'testHostname',
                dataStoreType: 'testDatastore'
            }
        }]);
        expect(spyExportFields.calls.count()).toEqual(1);
        expect(spyExportFields.calls.argsFor(0)).toEqual([component.options]);
    });

    it('createExportData with multiple layers does return expected data', () => {
        // Setup:  Create multiple layers
        component['finalizeCreateLayer'](component['createLayer'](component.options));
        component['finalizeCreateLayer'](component['createLayer'](component.options));
        expect(component.options.layers.length).toEqual(2);
        expect(component.options.layers[0].title).toEqual('Layer 1');
        expect(component.options.layers[1].title).toEqual('Layer 2');
        component.options.layers[1].database = DashboardServiceMock.DATABASES.testDatabase2;
        component.options.layers[1].table = DashboardServiceMock.TABLES.testTable2;
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
        expect(JSON.parse(JSON.stringify(component.createExportData()))).toEqual([{
            data: {
                fieldNamePrettyNamePairs: [{
                    query: 'export_1',
                    pretty: 'Export 1'
                }, {
                    query: 'export_2',
                    pretty: 'Export 2'
                }],
                fileName: 'Layer 1-' + component.options.layers[0]._id,
                query: {
                    selectClause: {
                        database: 'testDatabase1',
                        table: 'testTable1',
                        fieldClauses: []
                    },
                    whereClause: null,
                    aggregateClauses: [],
                    groupByClauses: [],
                    orderByClauses: [],
                    limitClause: null,
                    offsetClause: null,
                    joinClauses: [],
                    isDistinct: false
                },
                hostName: 'testHostname',
                dataStoreType: 'testDatastore'
            }
        }, {
            data: {
                fieldNamePrettyNamePairs: [{
                    query: 'export_3',
                    pretty: 'Export 3'
                }, {
                    query: 'export_4',
                    pretty: 'Export 4'
                }],
                fileName: 'Layer 2-' + component.options.layers[1]._id,
                query: {
                    selectClause: {
                        database: 'testDatabase2',
                        table: 'testTable2',
                        fieldClauses: []
                    },
                    whereClause: null,
                    aggregateClauses: [],
                    groupByClauses: [],
                    orderByClauses: [],
                    limitClause: null,
                    offsetClause: null,
                    joinClauses: [],
                    isDistinct: false
                },
                hostName: 'testHostname',
                dataStoreType: 'testDatastore'
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
        expect(component.options.layers[0].databases).toEqual(DashboardServiceMock.DATABASES_LIST);
        expect(component.options.layers[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(component.options.layers[0].tables).toEqual(DashboardServiceMock.TABLES_LIST);
        expect(component.options.layers[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(component.options.layers[0].fields).toEqual(DashboardServiceMock.FIELDS);
        expect(component.options.layers[0]).toEqual(layerOptions);
    });

    it('createLayer with bindings does return expected object', () => {
        let layerOptions = component['createLayer'](component.options, {
            tableKey: 'table_key_2',
            title: 'Title Binding'
        });
        expect(component.options.layers.length).toEqual(1);
        expect(component.options.layers[0].title).toEqual('Title Binding');
        expect(component.options.layers[0].databases).toEqual(DashboardServiceMock.DATABASES_LIST);
        expect(component.options.layers[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase2);
        expect(component.options.layers[0].tables).toEqual(DashboardServiceMock.TABLES_LIST);
        expect(component.options.layers[0].table).toEqual(DashboardServiceMock.TABLES.testTable2);
        expect(component.options.layers[0].fields).toEqual(DashboardServiceMock.FIELDS);
        expect(component.options.layers[0]).toEqual(layerOptions);
    });

    it('createSharedFilters does return expected array', () => {
        expect(JSON.parse(JSON.stringify(component.createSharedFilters(component.options)))).toEqual([]);

        component.options.filter = {
            lhs: 'testField1',
            operator: '=',
            rhs: 'testValue1'
        };

        expect(JSON.parse(JSON.stringify(component.createSharedFilters(component.options)))).toEqual([{
            type: 'where',
            lhs: {
                database: 'testDatabase1',
                table: 'testTable1',
                field: 'testField1'
            },
            operator: '=',
            rhs: 'testValue1'
        }]);

        spyOn((component as any), 'retrieveApplicableFilters').and.returnValue([
            new ListFilter(CompoundFilterType.OR, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.TEXT.columnName, 'contains', ['testValue1']),
            new ListFilter(CompoundFilterType.OR, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
                DashboardServiceMock.FIELD_MAP.TEXT.columnName, 'not contains', ['testValue2'])
        ]);

        expect(JSON.parse(JSON.stringify(component.createSharedFilters(component.options)))).toEqual([{
            type: 'where',
            lhs: {
                database: 'testDatabase1',
                table: 'testTable1',
                field: 'testTextField'
            },
            operator: 'contains',
            rhs: 'testValue1'
        }, {
            type: 'where',
            lhs: {
                database: 'testDatabase1',
                table: 'testTable1',
                field: 'testTextField'
            },
            operator: 'not contains',
            rhs: 'testValue2'
        }, {
            type: 'where',
            lhs: {
                database: 'testDatabase1',
                table: 'testTable1',
                field: 'testField1'
            },
            operator: '=',
            rhs: 'testValue1'
        }]);

        component.options.filter = {
            lhs: 'testField2',
            operator: '!=',
            rhs: 'testValue2'
        };

        expect(JSON.parse(JSON.stringify(component.createSharedFilters(component.options)))).toEqual([{
            type: 'where',
            lhs: {
                database: 'testDatabase1',
                table: 'testTable1',
                field: 'testTextField'
            },
            operator: 'contains',
            rhs: 'testValue1'
        }, {
            type: 'where',
            lhs: {
                database: 'testDatabase1',
                table: 'testTable1',
                field: 'testTextField'
            },
            operator: 'not contains',
            rhs: 'testValue2'
        }, {
            type: 'where',
            lhs: {
                database: 'testDatabase1',
                table: 'testTable1',
                field: 'testField2'
            },
            operator: '!=',
            rhs: 'testValue2'
        }]);

        component.options.filter = [{
            lhs: 'testField2',
            operator: '!=',
            rhs: 'testValue2'
        }, {
            lhs: 'testField3',
            operator: '=',
            rhs: 'testValue3'
        }];

        expect(JSON.parse(JSON.stringify(component.createSharedFilters(component.options)))).toEqual([{
            type: 'where',
            lhs: {
                database: 'testDatabase1',
                table: 'testTable1',
                field: 'testTextField'
            },
            operator: 'contains',
            rhs: 'testValue1'
        }, {
            type: 'where',
            lhs: {
                database: 'testDatabase1',
                table: 'testTable1',
                field: 'testTextField'
            },
            operator: 'not contains',
            rhs: 'testValue2'
        }, {
            type: 'where',
            lhs: {
                database: 'testDatabase1',
                table: 'testTable1',
                field: 'testField2'
            },
            operator: '!=',
            rhs: 'testValue2'
        }, {
            type: 'where',
            lhs: {
                database: 'testDatabase1',
                table: 'testTable1',
                field: 'testField3'
            },
            operator: '=',
            rhs: 'testValue3'
        }]);
    });

    it('deleteLayer does work as expected', () => {
        component.options.addLayer();
        let id1 = component.options.layers[0]._id;
        expect(component.options.layers.length).toEqual(1);

        let result = component['deleteLayer'](component.options, component.options.layers[0]);
        expect(component.options.layers.length).toEqual(1);
        expect(component.options.layers[0]._id).toEqual(id1);
        expect(result).toEqual(false);

        component.options.addLayer();
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

        component['finalizeCreateLayer'](component['createLayer'](component.options));
        component['finalizeCreateLayer'](component['createLayer'](component.options));
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

        component['finalizeCreateLayer'](component['createLayer'](component.options));
        component['finalizeCreateLayer'](component['createLayer'](component.options));
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
        expect(JSON.parse(JSON.stringify(spy.calls.argsFor(0)[1]))).toEqual({
            selectClause: {
                database: 'testDatabase1',
                table: 'testTable1',
                fieldClauses: []
            },
            whereClause: null,
            aggregateClauses: [],
            groupByClauses: [],
            orderByClauses: [],
            limitClause: {
                limit: 1000
            },
            offsetClause: null,
            joinClauses: [],
            isDistinct: false
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
        expect(JSON.parse(JSON.stringify(spy.calls.argsFor(0)[1]))).toEqual({
            selectClause: {
                database: 'testDatabase1',
                table: 'testTable1',
                fieldClauses: []
            },
            whereClause: null,
            aggregateClauses: [],
            groupByClauses: [],
            orderByClauses: [],
            limitClause: {
                limit: 1000
            },
            offsetClause: {
                offset: 0
            },
            joinClauses: [],
            isDistinct: false
        });
        expect(spy.calls.argsFor(0)[2]).toEqual('default visualization query');
        expect(spy.calls.argsFor(0)[3]).toBeDefined();

        component['page'] = 2;
        component['executeQueryChain']();
        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)[0]).toEqual(component.options);
        expect(JSON.parse(JSON.stringify(spy.calls.argsFor(1)[1]))).toEqual({
            selectClause: {
                database: 'testDatabase1',
                table: 'testTable1',
                fieldClauses: []
            },
            whereClause: null,
            aggregateClauses: [],
            groupByClauses: [],
            orderByClauses: [],
            limitClause: {
                limit: 1000
            },
            offsetClause: {
                offset: 1000
            },
            joinClauses: [],
            isDistinct: false
        });
        expect(spy.calls.argsFor(1)[2]).toEqual('default visualization query');
        expect(spy.calls.argsFor(1)[3]).toBeDefined();
    });

    it('executeQueryChain with advanced options does call executeQuery', () => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase2;
        component.options.table = DashboardServiceMock.TABLES.testTable2;
        component.options.filter = {
            lhs: 'testIdField',
            operator: '!=',
            rhs: 'testIdValue'
        };
        component.options.append(new ConfigOptionField('testEmptyField', 'Test Empty Field', false), FieldConfig.get());
        component.options.append(new ConfigOptionField('testField', 'Test Field', false), DashboardServiceMock.FIELD_MAP.CATEGORY);
        component.options.append(
            new ConfigOptionFieldArray('testFieldArray', 'Test Field Array', false),
            [DashboardServiceMock.FIELD_MAP.X, DashboardServiceMock.FIELD_MAP.Y]
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

        let spy = spyOn(component, 'executeQuery');
        /* eslint-disable-next-line @typescript-eslint/unbound-method */
        component.validateVisualizationQuery = () => true;
        component['executeQueryChain']();
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)[0]).toEqual(component.options);
        expect(JSON.parse(JSON.stringify(spy.calls.argsFor(0)[1]))).toEqual({
            selectClause: {
                database: 'testDatabase2',
                table: 'testTable2',
                fieldClauses: [{
                    database: 'testDatabase2',
                    table: 'testTable2',
                    field: 'testCategoryField'
                }, {
                    database: 'testDatabase2',
                    table: 'testTable2',
                    field: 'testXField'
                }, {
                    database: 'testDatabase2',
                    table: 'testTable2',
                    field: 'testYField'
                }, {
                    database: 'testDatabase2',
                    table: 'testTable2',
                    field: 'testIdField'
                }, {
                    database: 'testDatabase2',
                    table: 'testTable2',
                    field: 'testDateField'
                }, {
                    database: 'testDatabase2',
                    table: 'testTable2',
                    field: 'testLinkField'
                }, {
                    database: 'testDatabase2',
                    table: 'testTable2',
                    field: 'testNameField'
                }, {
                    database: 'testDatabase2',
                    table: 'testTable2',
                    field: 'testSizeField'
                }, {
                    database: 'testDatabase2',
                    table: 'testTable2',
                    field: 'testTextField'
                }, {
                    database: 'testDatabase2',
                    table: 'testTable2',
                    field: 'testTypeField'
                }]
            },
            whereClause: {
                type: 'where',
                lhs: {
                    database: 'testDatabase2',
                    table: 'testTable2',
                    field: 'testIdField'
                },
                operator: '!=',
                rhs: 'testIdValue'
            },
            aggregateClauses: [],
            groupByClauses: [],
            orderByClauses: [],
            limitClause: {
                limit: 1000
            },
            offsetClause: null,
            joinClauses: [],
            isDistinct: false
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
        let spy = spyOn(component, 'handleChangeOptions');
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
        expect(component.showNoData).toEqual(true);
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

        let layerA: any = new WidgetOptionCollection(component['dataset']);
        layerA.title = 'Layer A';
        component.options.layers.push(layerA);

        component['layerIdToElementCount'].set(layerA._id, 0);
        expect(component.getButtonText()).toEqual('0 Results');

        component['layerIdToElementCount'].set(layerA._id, 1);
        expect(component.getButtonText()).toEqual('1 Result');

        component['layerIdToElementCount'].set(layerA._id, 2);
        expect(component.getButtonText()).toEqual('2 Results');

        let layerB: any = new WidgetOptionCollection(component['dataset']);
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

        component.options.append(new ConfigOptionField('testEmptyField', 'Test Empty Field', false), FieldConfig.get());
        component.options.append(new ConfigOptionField('testField1', 'Test Field 1', false), DashboardServiceMock.FIELD_MAP.NAME);
        component.options.append(new ConfigOptionField('testField2', 'Test Field 2', false), DashboardServiceMock.FIELD_MAP.TYPE);
        component.options.append(
            new ConfigOptionField('testRepeatedField', 'Test Repeated Field', false),
            DashboardServiceMock.FIELD_MAP.NAME
        );
        component.options.append(
            new ConfigOptionFieldArray('testFieldArray', 'Test Field Array', false),
            [DashboardServiceMock.FIELD_MAP.X, DashboardServiceMock.FIELD_MAP.Y]
        );

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

    it('retrieveApplicableFilters does return expected array', () => {
        expect(component['retrieveApplicableFilters'](component.options)).toEqual([]);

        let filters = [
            new ListFilter(CompoundFilterType.OR, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1 + '.' + DashboardServiceMock.TABLES.testTable1 + '.' +
                DashboardServiceMock.FIELD_MAP.TEXT, '!=', ['testValue1']),
            new ListFilter(CompoundFilterType.OR, DashboardServiceMock.DATASTORE.name + '.' +
                DashboardServiceMock.DATABASES.testDatabase1 + '.' + DashboardServiceMock.TABLES.testTable1 + '.' +
                DashboardServiceMock.FIELD_MAP.TEXT, '=', ['testValue2'])
        ];

        spyOn(component['filterService'], 'getFiltersToSearch').and.returnValue(filters);

        expect(component['retrieveApplicableFilters'](component.options)).toEqual(filters);
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

    it('handleChangeOptions does work as expected', () => {
        let spyChangeData = spyOn(component, 'onChangeData');
        let spyExecuteQuery = spyOn(component, 'executeAllQueryChain');
        component['layerIdToElementCount'].set(component.options._id, 1234);
        component['errorMessage'] = 'testErrorMessage';
        component['lastPage'] = false;
        component['page'] = 2;
        component['showingZeroOrMultipleElementsPerResult'] = true;
        component.handleChangeOptions();
        expect(component['layerIdToElementCount'].get(component.options._id)).toEqual(0);
        expect(component['errorMessage']).toEqual('');
        expect(component['lastPage']).toEqual(true);
        expect(component['page']).toEqual(1);
        expect(component['showingZeroOrMultipleElementsPerResult']).toEqual(false);
        expect(spyChangeData.calls.count()).toEqual(1);
        expect(spyExecuteQuery.calls.count()).toEqual(1);
    });

    it('handleChangeOptions with options argument does work as expected', () => {
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
        component.handleChangeOptions(options as WidgetOptionCollection); // TODO: Verify Typings
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
        expect(JSON.parse(JSON.stringify((spyExecuteQuery.calls.argsFor(0)[1])))).toEqual({
            selectClause: {
                database: 'testDatabase1',
                table: 'testTable1',
                fieldClauses: []
            },
            whereClause: null,
            aggregateClauses: [{
                type: 'total',
                label: '_count'
            }],
            groupByClauses: [],
            orderByClauses: [],
            limitClause: null,
            offsetClause: null,
            joinClauses: [],
            isDistinct: false
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
        expect(JSON.parse(JSON.stringify(spyExecuteQuery.calls.argsFor(0)[1]))).toEqual({
            selectClause: {
                database: 'testDatabase1',
                table: 'testTable1',
                fieldClauses: []
            },
            whereClause: null,
            aggregateClauses: [{
                type: 'total',
                label: '_count'
            }],
            groupByClauses: [],
            orderByClauses: [],
            limitClause: null,
            offsetClause: null,
            joinClauses: [],
            isDistinct: false
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
        let expectedOptions = new WidgetOptionCollection(component['dataset']);
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
        let expectedOptions = new WidgetOptionCollection(component['dataset']);
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

    it('does call executeAllQueryChain on filter-change event', () => {
        component['id'] = 'testId';
        spyOn((component as any), 'shouldFilterSelf').and.returnValue(true);

        let spyExecuteQuery = spyOn((component as any), 'executeAllQueryChain');

        component['filterService'].notifyFilterChangeListeners('testSource');

        expect(spyExecuteQuery.calls.count()).toEqual(1);
    });

    it('does call executeAllQueryChain on filter-change event if ID=source', () => {
        component['id'] = 'testSource';
        spyOn((component as any), 'shouldFilterSelf').and.returnValue(true);

        let spyExecuteQuery = spyOn((component as any), 'executeAllQueryChain');

        component['filterService'].notifyFilterChangeListeners('testSource');

        expect(spyExecuteQuery.calls.count()).toEqual(1);
    });

    it('does call executeAllQueryChain on filter-change event if !filterSelf', () => {
        component['id'] = 'testId';
        spyOn((component as any), 'shouldFilterSelf').and.returnValue(false);

        let spyExecuteQuery = spyOn((component as any), 'executeAllQueryChain');

        component['filterService'].notifyFilterChangeListeners('testSource');

        expect(spyExecuteQuery.calls.count()).toEqual(1);
    });

    it('does not call executeAllQueryChain on filter-change event if ID equals source AND shouldFilterSelf()=>false', () => {
        component['id'] = 'testSource';
        spyOn((component as any), 'shouldFilterSelf').and.returnValue(false);

        let spyExecuteQuery = spyOn((component as any), 'executeAllQueryChain');

        component['filterService'].notifyFilterChangeListeners('testSource');

        expect(spyExecuteQuery.calls.count()).toEqual(0);
    });

    it('deleteFilters does call filterService.deleteFilters', () => {
        spyOn((component as any), 'shouldFilterSelf').and.returnValue(false);
        let map = new Map<any, any[]>();
        map.set('key1', [{
            id: 'filterId1'
        }]);
        let spy = spyOn(component['filterService'], 'deleteFilters').and.returnValue(map);
        component['id'] = 'testId';
        component['page'] = 10;

        component.deleteFilters();

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testId', undefined]);
        expect(component['page']).toEqual(10);
    });

    it('exchangeFilters does call filterService.exchangeFilters and update cachedPage', () => {
        spyOn((component as any), 'shouldFilterSelf').and.returnValue(false);
        let map = new Map<any, any[]>();
        map.set('key1', [{
            id: 'filterId1'
        }]);
        let spy = spyOn(component['filterService'], 'exchangeFilters').and.returnValue(map);
        component['id'] = 'testId';
        component['page'] = 10;

        let filters = [null];
        component.exchangeFilters(filters);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testId', filters, component['dataset'], undefined, undefined, undefined]);
        expect(component['cachedPage']).toEqual(10);
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

        let filters = [null];
        component.exchangeFilters(filters);

        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['testId', filters, component['dataset'], undefined, undefined, undefined]);
        expect(component['cachedPage']).toEqual(10);
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

    it('handleFiltersChanged does not update page if filtered', () => {
        spyOn(component, 'executeAllQueryChain');

        let testFilterCollection = new FilterCollection();
        spyOn(testFilterCollection, 'getFilters').and.returnValue([null, null]);
        spyOn(component, 'retrieveCompatibleFilters').and.returnValue(testFilterCollection);

        component['cachedPage'] = 5;
        component['page'] = 1;

        component['handleFiltersChanged']('TestCallerID');

        expect(component['page']).toEqual(1);
        expect(component['cachedPage']).toEqual(5);
    });

    it('handleFiltersChanged does not update page if cachedPage is not set', () => {
        spyOn(component, 'executeAllQueryChain');

        let testFilterCollection = new FilterCollection();
        spyOn(component, 'retrieveCompatibleFilters').and.returnValue(testFilterCollection);

        component['cachedPage'] = -1;
        component['page'] = 1;

        component['handleFiltersChanged']('TestCallerID');

        expect(component['page']).toEqual(1);
        expect(component['cachedPage']).toEqual(-1);
    });

    it('handleFiltersChanged does update page if not filtered and cachedPage is set', () => {
        let testFilterCollection = new FilterCollection();
        spyOn(component, 'retrieveCompatibleFilters').and.returnValue(testFilterCollection);

        component['cachedPage'] = 5;
        component['page'] = 1;

        component['handleFiltersChanged']('TestCallerID');

        expect(component['page']).toEqual(5);
        expect(component['cachedPage']).toEqual(-1);
    });
});

describe('Advanced BaseNeonComponent with config', () => {
    let testConfig: NeonConfig = NeonConfig.get();
    let component: BaseNeonComponent;
    let fixture: ComponentFixture<BaseNeonComponent>;

    let dashboardService = new DashboardServiceMock(getConfigService(testConfig));
    dashboardService.state.dashboard.contributors = {
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
            { provide: DashboardService, useValue: dashboardService },
            InjectableFilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            { provide: ConfigService, useValue: getConfigService(testConfig) }
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestAdvancedNeonComponent);
        component = fixture.componentInstance;
        component.configOptions = {
            configFilter: { lhs: 'testConfigField', operator: '!=', rhs: 'testConfigValue' },
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
            hideUnfiltered: 'true',
            limit: 10,
            tableKey: 'table_key_2',
            testArray: [4, 3, 2, 1],
            testFreeText: 'the quick brown fox jumps over the lazy dog',
            testMultipleFields: ['testXField', 'testYField'],
            testMultipleSelect: ['b', 'c'],
            testObject: { key: 'value' },
            testOptionalField: 'testNameField',
            testRequiredField: 'testSizeField',
            testSelect: 'z',
            testToggle: true,
            title: 'VisualizationTitle'
        };
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
        expect(component.options.database).toEqual(DashboardServiceMock.DATABASES.testDatabase2);
        expect(component.options.databases).toEqual(DashboardServiceMock.DATABASES_LIST);
        expect(component.options.fields).toEqual(DashboardServiceMock.FIELDS);
        expect(component.options.filter).toEqual({
            lhs: 'testConfigField',
            operator: '!=',
            rhs: 'testConfigValue'
        });
        expect(component.options.hideUnfiltered).toEqual('true');
        expect(component.options.limit).toEqual(10);
        expect(component.options.table).toEqual(DashboardServiceMock.TABLES.testTable2);
        expect(component.options.tables).toEqual(DashboardServiceMock.TABLES_LIST);
        expect(component.options.testArray).toEqual([4, 3, 2, 1]);
        expect(component.options.testFreeText).toEqual('the quick brown fox jumps over the lazy dog');
        expect(component.options.testMultipleFields).toEqual([DashboardServiceMock.FIELD_MAP.X, DashboardServiceMock.FIELD_MAP.Y]);
        expect(component.options.testMultipleSelect).toEqual(['b', 'c']);
        expect(component.options.testObject).toEqual({
            key: 'value'
        });
        expect(component.options.testOptionalField).toEqual(DashboardServiceMock.FIELD_MAP.NAME);
        expect(component.options.testRequiredField).toEqual(DashboardServiceMock.FIELD_MAP.SIZE);
        expect(component.options.testSelect).toEqual('z');
        expect(component.options.testToggle).toEqual(true);
        expect(component.options.title).toEqual('VisualizationTitle');
    });

    it('createCompleteVisualizationQuery on widget with advanced config does return expected query object', () => {
        expect(JSON.parse(JSON.stringify(component.createCompleteVisualizationQuery(component.options)))).toEqual({
            selectClause: {
                database: 'testDatabase2',
                table: 'testTable2',
                fieldClauses: [{
                    database: 'testDatabase2',
                    table: 'testTable2',
                    field: 'testSizeField'
                }, {
                    database: 'testDatabase2',
                    table: 'testTable2',
                    field: 'testNameField'
                }, {
                    database: 'testDatabase2',
                    table: 'testTable2',
                    field: 'testXField'
                }, {
                    database: 'testDatabase2',
                    table: 'testTable2',
                    field: 'testYField'
                }, {
                    database: 'testDatabase2',
                    table: 'testTable2',
                    field: 'testConfigField'
                }, {
                    database: 'testDatabase2',
                    table: 'testTable2',
                    field: 'testPublishColumnName'
                }, {
                    database: 'testDatabase2',
                    table: 'testTable2',
                    field: 'testReceiveColumnName'
                }]
            },
            whereClause: {
                type: 'where',
                lhs: {
                    database: 'testDatabase2',
                    table: 'testTable2',
                    field: 'testConfigField'
                },
                operator: '!=',
                rhs: 'testConfigValue'
            },
            aggregateClauses: [],
            groupByClauses: [],
            orderByClauses: [],
            limitClause: null,
            offsetClause: null,
            joinClauses: [],
            isDistinct: false
        });
    });

    it('createSharedFilters on widget with advanced config does return expected array', () => {
        expect(JSON.parse(JSON.stringify(component.createSharedFilters(component.options)))).toEqual([{
            type: 'where',
            lhs: {
                database: 'testDatabase2',
                table: 'testTable2',
                field: 'testConfigField'
            },
            operator: '!=',
            rhs: 'testConfigValue'
        }]);
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
        }]);
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
