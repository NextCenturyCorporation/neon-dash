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
import { FilterCollection } from 'nucleus/dist/core/models/filters';
import { FieldConfig } from 'nucleus/dist/core/models/dataset';

import { } from 'jasmine-core';

import { ThumbnailGridComponent } from './thumbnail-grid.component';

import { AbstractSearchService } from 'nucleus/dist/core/services/abstract.search.service';
import { CompoundFilterType } from 'nucleus/dist/core/models/config-option';
import { DashboardService } from '../../services/dashboard.service';
import { InjectableFilterService } from '../../services/injectable.filter.service';
import { DashboardServiceMock } from '../../services/mock.dashboard-service';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { SearchServiceMock } from 'nucleus/dist/core/services/mock.search.service';

import { ThumbnailGridModule } from './thumbnail-grid.module';
import { CoreSearch } from 'nucleus/dist/core/services/search.service';

describe('Component: ThumbnailGrid', () => {
    let component: ThumbnailGridComponent;
    let fixture: ComponentFixture<ThumbnailGridComponent>;

    initializeTestBed('Thumbnail Grid', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock },
            InjectableFilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock }
        ],
        imports: [
            ThumbnailGridModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ThumbnailGridComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('does have expected default class options properties', () => {
        expect(component.options.border).toEqual('');
        expect(component.options.borderCompareValue).toEqual('');
        expect(component.options.borderPercentThreshold).toEqual(0.5);
        expect(component.options.cropAndScale).toEqual('');
        expect(component.options.defaultLabel).toEqual('');
        expect(component.options.defaultPercent).toEqual('');
        expect(component.options.id).toEqual('');

        expect(component.options.ignoreSelf).toEqual(false);
        expect(component.options.linkPrefix).toEqual('');
        expect(component.options.openOnMouseClick).toEqual(true);
        expect(component.options.sortDescending).toEqual(false);
        expect(component.options.textMap).toEqual({});
        expect(component.options.typeMap).toEqual({});

        expect(component.options.categoryField).toEqual(FieldConfig.get());
        expect(component.options.compareField).toEqual(FieldConfig.get());
        expect(component.options.filterFields).toEqual([]);
        expect(component.options.idField).toEqual(FieldConfig.get());
        expect(component.options.linkField).toEqual(FieldConfig.get());
        expect(component.options.nameField).toEqual(FieldConfig.get());
        expect(component.options.objectIdField).toEqual(FieldConfig.get());
        expect(component.options.objectNameField).toEqual(FieldConfig.get());
        expect(component.options.percentField).toEqual(FieldConfig.get());
        expect(component.options.predictedNameField).toEqual(FieldConfig.get());
        expect(component.options.sortField).toEqual(FieldConfig.get());
        expect(component.options.typeField).toEqual(FieldConfig.get());

        expect(component.headerText).toBeDefined();
        expect(component.infoText).toBeDefined();
        expect(component.thumbnailGrid).toBeDefined();
        expect(component.visualization).toBeDefined();
    });

    it('does have expected class properties', () => {
        expect(component.gridArray).toEqual([]);
        expect(component.mediaTypes).toBeDefined();
    });

    it('does show toolbar', () => {
        let container = fixture.debugElement;
        expect(container).not.toBeNull();
        let toolbar = fixture.debugElement.query(By.css('mat-toolbar'));
        expect(toolbar).not.toBeNull();
    });

    it('does show header in toolbar with visualization title', () => {
        let header = fixture.debugElement.query(By.css('mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toContain('Thumbnail Grid');
    });

    it('does show data-info and hide error-message in toolbar if errorMessage is undefined', async(() => {
        (component as any).layerIdToElementCount.set(component.options._id, 10);

        // Force the component to update all its ngFor and ngIf elements.
        component.changeDetection.detectChanges();

        let dataInfoTextInToolbar = fixture.debugElement.query(By.css('mat-toolbar .data-info'));
        expect(dataInfoTextInToolbar).not.toBeNull();
        expect(dataInfoTextInToolbar.nativeElement.textContent).toContain('10 Items');

        let errorMessageInToolbar = fixture.debugElement.query(By.css('mat-toolbar .error-message'));
        expect(errorMessageInToolbar).toBeNull();
    }));

    it('does show error-message in toolbar if errorMessage is defined', async(() => {
        (component as any).errorMessage = 'Test Error Message';

        // Force the component to update all its ngFor and ngIf elements.
        component.changeDetection.detectChanges();

        let dataInfoTextInToolbar = fixture.debugElement.query(By.css('mat-toolbar .data-info'));
        expect(dataInfoTextInToolbar).toBeNull();

        let errorMessageInToolbar = fixture.debugElement.query(By.css('mat-toolbar .error-message'));
        expect(errorMessageInToolbar).not.toBeNull();
        expect(errorMessageInToolbar.nativeElement.textContent).toContain('Test Error Message');
    }));

    it('does hide loading overlay by default', () => {
        (component as any).loadingCount = null;
        component.changeDetection.detectChanges();
        let hiddenLoadingOverlay = fixture.debugElement.query(By.css('.not-loading-overlay'));
        expect(hiddenLoadingOverlay).not.toBeNull();

        let hiddenSpinner = fixture.debugElement.query(By.css('.not-loading-overlay mat-spinner'));
        expect(hiddenSpinner).not.toBeNull();
    });

    it('does show loading overlay if loadingCount is positive', async(() => {
        (component as any).loadingCount = 1;

        // Force the component to update all its ngFor and ngIf elements.
        component.changeDetection.detectChanges();

        let loadingOverlay = fixture.debugElement.query(By.css('.loading-overlay'));
        expect(loadingOverlay).not.toBeNull();

        let spinner = fixture.debugElement.query(By.css('.loading-overlay mat-spinner'));
        expect(spinner).not.toBeNull();
    }));

    it('does show body-container', () => {
        let bodyContainer = fixture.debugElement.query(By.css('.body-container'));
        expect(bodyContainer).not.toBeNull();
    });

    it('does not show thumbnail-grid-div elements if gridArray is empty array', () => {
        component.options.viewType = 'card';
        let elements = fixture.debugElement.queryAll(By.css('.body-container .thumbnail-grid-div'));
        expect(elements.length).toEqual(0);
    });

    it('does show thumbnail-grid-div-scaled elements if gridArray is non-empty array', async(() => {
        component.options.linkField = FieldConfig.get({
            columnName: 'testLinkField', prettyName: 'Test Link Field'
        });
        component.options.nameField = FieldConfig.get({
            columnName: 'testNameField', prettyName: 'Test Name Field'
        });
        component.options.objectIdField = FieldConfig.get({
            columnName: 'testObjectIdField', prettyName: 'Test Object ID Field'
        });
        component.options.objectNameField = FieldConfig.get({
            columnName: 'testObjectNameField', prettyName: 'Test Object Name Field'
        });
        component.options.percentField = FieldConfig.get({
            columnName: 'testPercentField', prettyName: 'Test Percent Field'
        });
        component.options.predictedNameField = FieldConfig.get({
            columnName: 'testPredictedNameField', prettyName: 'Test Predicted Name Field'
        });

        component.gridArray = [{
            testNameField: 'name1',
            testObjectIdField: 'objectId1',
            testObjectNameField: 'objectName1',
            testPercentField: 0.1,
            testPredictedNameField: 'predictedName1',
            constructedUrl: 'link1'
        }, {
            testNameField: 'name2',
            testObjectIdField: 'objectId2',
            testObjectNameField: 'objectName2',
            testPercentField: 0.2,
            testPredictedNameField: 'predictedName2',
            constructedUrl: 'link2'
        }];

        // Force the component to update all its ngFor and ngIf elements.
        component.changeDetection.detectChanges();

        let elements = fixture.debugElement.queryAll(By.css('.body-container .thumbnail-grid-div-scaled'));
        expect(elements.length).toEqual(2);

        expect(elements[0].nativeElement.classList.contains('with-text')).toEqual(true);
        expect(elements[0].nativeElement.classList.contains('selected')).toEqual(false);

        expect(elements[1].nativeElement.classList.contains('with-text')).toEqual(true);
        expect(elements[1].nativeElement.classList.contains('selected')).toEqual(false);

        let divElements = fixture.debugElement.queryAll(By.css('.body-container .thumbnail-grid-div-scaled'));
        expect(divElements.length).toEqual(2);
    }));

    it('does not show footer-container or pagination-button elements by default', () => {
        component.changeDetection.detectChanges();
        let footerContainer = fixture.debugElement.query(By.css('.footer'));
        expect(footerContainer).toBeNull();

        let bodyContainer = fixture.debugElement.query(By.css('.body-container.with-footer'));
        expect(bodyContainer).toBeNull();
    });

    it('does show footer-container and pagination-button elements if on first page', async(() => {
        (component as any).layerIdToElementCount.set(component.options._id, 3);
        (component as any).lastPage = false;
        (component as any).page = 1;
        component.options.limit = 1;

        // Force the component to update all its ngFor and ngIf elements.
        component.changeDetection.detectChanges();

        let footerContainer = fixture.debugElement.query(By.css('.footer'));
        expect(footerContainer).not.toBeNull();

        let footerButtons = fixture.debugElement.queryAll(By.css(
            '.footer .footer-button-container .pagination-button'
        ));
        expect(footerButtons.length).toEqual(2);

        expect(footerButtons[0].componentInstance.disabled).toEqual(true);
        expect(footerButtons[0].nativeElement.textContent).toContain('Previous');

        expect(footerButtons[1].componentInstance.disabled).toEqual(false);
        expect(footerButtons[1].nativeElement.textContent).toContain('Next');
    }));

    it('does show footer-container and pagination-button elements if on middle page', async(() => {
        (component as any).layerIdToElementCount.set(component.options._id, 3);
        (component as any).lastPage = false;
        (component as any).page = 2;
        component.options.limit = 1;

        // Force the component to update all its ngFor and ngIf elements.
        component.changeDetection.detectChanges();

        let footerContainer = fixture.debugElement.query(By.css('.footer'));
        expect(footerContainer).not.toBeNull();

        let footerButtons = fixture.debugElement.queryAll(By.css(
            '.footer .footer-button-container .pagination-button'
        ));
        expect(footerButtons.length).toEqual(2);

        expect(footerButtons[0].componentInstance.disabled).toEqual(false);
        expect(footerButtons[0].nativeElement.textContent).toContain('Previous');

        expect(footerButtons[1].componentInstance.disabled).toEqual(false);
        expect(footerButtons[1].nativeElement.textContent).toContain('Next');
    }));

    it('does show footer-container and pagination-button elements if on last page', async(() => {
        (component as any).layerIdToElementCount.set(component.options._id, 3);
        (component as any).lastPage = true;
        (component as any).page = 3;
        component.options.limit = 1;

        // Force the component to update all its ngFor and ngIf elements.
        component.changeDetection.detectChanges();

        let footerContainer = fixture.debugElement.query(By.css('.footer'));
        expect(footerContainer).not.toBeNull();

        let footerButtons = fixture.debugElement.queryAll(By.css(
            '.footer .footer-button-container .pagination-button'
        ));
        expect(footerButtons.length).toEqual(2);

        expect(footerButtons[0].componentInstance.disabled).toEqual(false);
        expect(footerButtons[0].nativeElement.textContent).toContain('Previous');

        expect(footerButtons[1].componentInstance.disabled).toEqual(true);
        expect(footerButtons[1].nativeElement.textContent).toContain('Next');
    }));

    it('finalizeVisualizationQuery does return expected query', () => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.linkField = FieldConfig.get({ columnName: 'testLinkField', prettyName: 'Test Link Field' });
        component.options.sortField = FieldConfig.get({ columnName: 'testSortField', prettyName: 'Test Sort Field' });

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
                        field: 'testLinkField'
                    },
                    operator: '!=',
                    rhs: null
                }, {
                    type: 'where',
                    lhs: {
                        database: 'testDatabase1',
                        table: 'testTable1',
                        field: 'testLinkField'
                    },
                    operator: '!=',
                    rhs: ''
                }]
            },
            aggregateClauses: [],
            groupByClauses: [],
            orderByClauses: [{
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testSortField'
                },
                order: 1
            }],
            limitClause: null,
            offsetClause: null,
            joinClauses: [],
            isDistinct: false
        });

        component.options.sortDescending = true;
        searchObject = new CoreSearch(component.options.database.name, component.options.table.name);

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
                        field: 'testLinkField'
                    },
                    operator: '!=',
                    rhs: null
                }, {
                    type: 'where',
                    lhs: {
                        database: 'testDatabase1',
                        table: 'testTable1',
                        field: 'testLinkField'
                    },
                    operator: '!=',
                    rhs: ''
                }]
            },
            aggregateClauses: [],
            groupByClauses: [],
            orderByClauses: [{
                type: 'field',
                fieldClause: {
                    database: 'testDatabase1',
                    table: 'testTable1',
                    field: 'testSortField'
                },
                order: -1
            }],
            limitClause: null,
            offsetClause: null,
            joinClauses: [],
            isDistinct: false
        });

        component.options.sortField = new FieldConfig();
        searchObject = new CoreSearch(component.options.database.name, component.options.table.name);

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
                        field: 'testLinkField'
                    },
                    operator: '!=',
                    rhs: null
                }, {
                    type: 'where',
                    lhs: {
                        database: 'testDatabase1',
                        table: 'testTable1',
                        field: 'testLinkField'
                    },
                    operator: '!=',
                    rhs: ''
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

    it('getElementRefs does return expected object', () => {
        let refs = component.getElementRefs();
        expect(refs.headerText).toBeDefined();
        expect(refs.infoText).toBeDefined();
        expect(refs.thumbnailGrid).toBeDefined();
        expect(refs.visualization).toBeDefined();
    });

    it('getThumbnailLabel does return expected string', () => {
        expect(component.getThumbnailLabel({})).toEqual('');

        expect(component.getThumbnailLabel({
            testObjectNameField: 'myObjectName',
            testPredictedNameField: 'myPredictedName'
        })).toEqual('');

        component.options.objectNameField = FieldConfig.get({
            columnName: 'testObjectNameField', prettyName: 'Test Object Name Field'
        });

        expect(component.getThumbnailLabel({
            testObjectNameField: 'myObjectName',
            testPredictedNameField: 'myPredictedName'
        })).toEqual('myObjectName');

        expect(component.getThumbnailLabel({
            testPredictedNameField: 'myPredictedName'
        })).toEqual('');

        component.options.predictedNameField = FieldConfig.get({
            columnName: 'testPredictedNameField', prettyName: 'Test Predicted Name Field'
        });

        expect(component.getThumbnailLabel({
            testObjectNameField: 'myObjectName',
            testPredictedNameField: 'myPredictedName'
        })).toEqual('myPredictedName');

        expect(component.getThumbnailLabel({
            testObjectNameField: 'myObjectName'
        })).toEqual('');
    });

    it('getThumbnailPercent does return expected string', () => {
        expect(component.getThumbnailPercent({})).toEqual('');

        expect(component.getThumbnailPercent({
            testPercentField: 0.1234
        })).toEqual('');

        component.options.percentField = FieldConfig.get({
            columnName: 'testPercentField', prettyName: 'Test Percent Field'
        });

        expect(component.getThumbnailPercent({})).toEqual('');

        expect(component.getThumbnailPercent({
            testPercentField: 0.1234
        })).toEqual('12.3%');

        expect(component.getThumbnailPercent({
            testPercentField: 0.5678
        })).toEqual('56.8%');

        expect(component.getThumbnailPercent({
            testPercentField: 0
        })).toEqual('0%');

        expect(component.getThumbnailPercent({
            testPercentField: 0.5
        })).toEqual('50%');

        expect(component.getThumbnailPercent({
            testPercentField: 1
        })).toEqual('100%');
    });

    it('getThumbnailTitle does return expected string', () => {
        expect(component.getThumbnailTitle({})).toEqual('');

        expect(component.getThumbnailTitle({
            testNameField: 'myName',
            testObjectNameField: 'myObjectName',
            testPercentField: 0.1234,
            testPredictedNameField: 'myPredictedName'
        })).toEqual('');

        component.options.nameField = FieldConfig.get({
            columnName: 'testNameField', prettyName: 'Test Name Field'
        });
        component.options.objectNameField = FieldConfig.get({
            columnName: 'testObjectNameField', prettyName: 'Test Object Name Field'
        });
        component.options.percentField = FieldConfig.get({
            columnName: 'testPercentField', prettyName: 'Test Percent Field'
        });
        component.options.predictedNameField = FieldConfig.get({
            columnName: 'testPredictedNameField', prettyName: 'Test Predicted Name Field'
        });

        expect(component.getThumbnailTitle({
            testNameField: 'myName',
            testObjectNameField: 'myObjectName',
            testPercentField: 0.1234,
            testPredictedNameField: 'myPredictedName'
        })).toEqual('myName, Prediction : myPredictedName, Actual : myObjectName');
    });

    it('getThumbnailTitle does use textMap', () => {
        component.options.nameField = FieldConfig.get({
            columnName: 'testNameField', prettyName: 'Test Name Field'
        });
        component.options.objectNameField = FieldConfig.get({
            columnName: 'testObjectNameField', prettyName: 'Test Object Name Field'
        });
        component.options.percentField = FieldConfig.get({
            columnName: 'testPercentField', prettyName: 'Test Percent Field'
        });
        component.options.predictedNameField = FieldConfig.get({
            columnName: 'testPredictedNameField', prettyName: 'Test Predicted Name Field'
        });
        component.options.textMap = {
            actual: 'MyActualText',
            name: 'MyNameText',
            percentage: 'MyPercentageText',
            prediction: 'MyPredictionText'
        };

        expect(component.getThumbnailTitle({
            testNameField: 'myName',
            testObjectNameField: 'myObjectName',
            testPercentField: 0.1234,
            testPredictedNameField: 'myPredictedName'
        })).toEqual('MyNameText : myName, MyPredictionText : myPredictedName, MyActualText : myObjectName');
    });

    it('designEachFilterWithNoValues does return expected object', () => {
        expect((component as any).designEachFilterWithNoValues()).toEqual([]);

        component.options.filterFields = [DashboardServiceMock.FIELD_MAP.FILTER];
        let actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(1);
        expect((actual[0]).type).toEqual(CompoundFilterType.OR);
        expect((actual[0]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.FILTER.columnName);
        expect((actual[0]).operator).toEqual('=');
        expect((actual[0]).values).toEqual([undefined]);
    });

    it('isSelectable does return expected boolean', () => {
        component.options.openOnMouseClick = false;
        expect(component.isSelectable()).toEqual(false);

        component.options.idField = FieldConfig.get({ columnName: 'testIdField', prettyName: 'Test ID Field' });
        expect(component.isSelectable()).toEqual(true);
        component.options.idField = FieldConfig.get();

        component.options.openOnMouseClick = true;
        expect(component.isSelectable()).toEqual(true);
    });

    it('isSelected does return expected boolean', () => {
        expect(component.isSelected({
            _filtered: false,
            testFilterField: 'testFilterValue1'
        })).toEqual(false);

        expect(component.isSelected({
            _filtered: true,
            testFilterField: 'testFilterValue1'
        })).toEqual(true);
    });

    it('validateVisualizationQuery does return expected boolean', () => {
        expect(component.validateVisualizationQuery(component.options)).toEqual(false);

        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        expect(component.validateVisualizationQuery(component.options)).toEqual(false);

        component.options.table = DashboardServiceMock.TABLES.testTable1;
        expect(component.validateVisualizationQuery(component.options)).toEqual(false);
    });

    it('transformVisualizationQueryResults with aggregation query data does return expected data', () => {
        component.options.categoryField = FieldConfig.get({
            columnName: 'testCategoryField',
            prettyName: 'Test Category Field'
        });
        component.options.compareField = FieldConfig.get({
            columnName: 'testCompareField',
            prettyName: 'Test Compare Field'
        });
        component.options.filterFields = [FieldConfig.get({
            columnName: 'testFilterField',
            prettyName: 'Test Filter Field'
        })];
        component.options.idField = FieldConfig.get({
            columnName: '_id',
            prettyName: 'Test ID Field'
        });
        component.options.linkField = FieldConfig.get({
            columnName: 'testLinkField',
            prettyName: 'Test Link Field'
        });
        component.options.nameField = FieldConfig.get({
            columnName: 'testNameField',
            prettyName: 'Test Name Field'
        });
        component.options.objectIdField = FieldConfig.get({
            columnName: 'testObjectIdField',
            prettyName: 'Test Object ID Field'
        });
        component.options.objectNameField = FieldConfig.get({
            columnName: 'testObjectNameField',
            prettyName: 'Test Object Name Field'
        });
        component.options.percentField = FieldConfig.get({
            columnName: 'testPercentField',
            prettyName: 'Test Percent Field'
        });
        component.options.predictedNameField = FieldConfig.get({
            columnName: 'testPredictedNameField',
            prettyName: 'Test Predicted Name Field'
        });
        component.options.sortField = FieldConfig.get({
            columnName: 'testSortField',
            prettyName: 'Test Sort Field'
        });
        component.options.typeField = FieldConfig.get({
            columnName: 'testTypeField',
            prettyName: 'Test Type Field'
        });

        let actual = component.transformVisualizationQueryResults(component.options, [{
            _id: 'id1',
            testCategoryField: 'category1',
            testCompareField: 'compare1',
            testFilterField: 'filter1',
            testLinkField: 'link1',
            testNameField: 'name1',
            testObjectIdField: 'objectId1',
            testObjectNameField: 'objectName1',
            testPercentField: 0.1,
            testPredictedNameField: 'predictedName1',
            testSortField: 'sort1',
            testTypeField: 'type1'
        }, {
            _id: 'id2',
            testCategoryField: 'category2',
            testCompareField: 'compare2',
            testFilterField: 'filter2',
            testLinkField: 'link2',
            testNameField: 'name2',
            testObjectIdField: 'objectId2',
            testObjectNameField: 'objectName2',
            testPercentField: 0.2,
            testPredictedNameField: 'predictedName2',
            testSortField: 'sort2',
            testTypeField: 'type2'
        }], new FilterCollection());

        expect(component.gridArray).toEqual([{
            _filtered: false,
            _id: 'id1',
            testCategoryField: 'category1',
            testCompareField: 'compare1',
            testFilterField: 'filter1',
            constructedUrl: 'link1.type1',
            testNameField: 'name1',
            testObjectIdField: 'objectId1',
            testObjectNameField: 'objectName1',
            testPercentField: 0.1,
            testPredictedNameField: 'predictedName1',
            testSortField: 'sort1',
            testTypeField: 'type1'
        }, {
            _filtered: false,
            _id: 'id2',
            testCategoryField: 'category2',
            testCompareField: 'compare2',
            testFilterField: 'filter2',
            constructedUrl: 'link2.type2',
            testNameField: 'name2',
            testObjectIdField: 'objectId2',
            testObjectNameField: 'objectName2',
            testPercentField: 0.2,
            testPredictedNameField: 'predictedName2',
            testSortField: 'sort2',
            testTypeField: 'type2'
        }]);
        expect(actual).toEqual(2);
    });

    it('transformVisualizationQueryResults with empty aggregation query data does return expected data', () => {
        component.options.fields = DashboardServiceMock.FIELDS;
        component.options.linkField = FieldConfig.get({ columnName: 'testLinkField', prettyName: 'Test Link Field' });

        let actual = component.transformVisualizationQueryResults(component.options, [], new FilterCollection());

        expect(component.gridArray).toEqual([]);
        expect(actual).toEqual(0);
    });

    it('transformVisualizationQueryResults with link prefix does return expected data', () => {
        component.options.fields = DashboardServiceMock.FIELDS;
        component.options.idField = FieldConfig.get({ columnName: '_id', prettyName: 'Test ID Field' });
        component.options.linkField = FieldConfig.get({ columnName: 'testLinkField', prettyName: 'Test Link Field' });
        component.options.nameField = FieldConfig.get({ columnName: 'testNameField', prettyName: 'Test Name Field' });
        component.options.percentField = FieldConfig.get({ columnName: 'testSizeField', prettyName: 'Test Size Field' });
        component.options.typeField = FieldConfig.get({ columnName: 'testTypeField', prettyName: 'Test Type Field' });
        component.options.linkPrefix = 'prefix/';

        let actual = component.transformVisualizationQueryResults(component.options, [{
            _id: 'id1',
            testLinkField: 'link1',
            testNameField: 'name1',
            testSizeField: 0.1,
            testTypeField: 'type1'
        }, {
            _id: 'id2',
            testLinkField: 'link2',
            testNameField: 'name2',
            testSizeField: 0.2,
            testTypeField: 'type2'
        }], new FilterCollection());

        expect(component.gridArray).toEqual([{
            _filtered: false,
            _id: 'id1',
            constructedUrl: 'prefix/link1.type1',
            testNameField: 'name1',
            testSizeField: 0.1,
            testTypeField: 'type1'
        }, {
            _filtered: false,
            _id: 'id2',
            constructedUrl: 'prefix/link2.type2',
            testNameField: 'name2',
            testSizeField: 0.2,
            testTypeField: 'type2'
        }]);
        expect(actual).toEqual(2);
    });

    it('refreshVisualization does call changeDetection.detectChanges', () => {
        let spy = spyOn(component.changeDetection, 'detectChanges');

        component.refreshVisualization();
        expect(spy.calls.count()).toEqual(1);
    });

    it('selectGridItem does call publishSelectId if idField is set', () => {
        let spy = spyOn(component, 'publishSelectId');

        component.selectGridItem({
            testIdField: 'id1'
        });
        expect(spy.calls.count()).toEqual(0);

        component.options.idField = FieldConfig.get({ columnName: 'testIdField', prettyName: 'Test ID Field' });

        component.selectGridItem({
            testIdField: 'id1'
        });
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual(['id1']);
    });

    it('selectGridItem does call createFilter if filterFields is set', () => {
        let spy = spyOn(component, 'createFilter');

        component.selectGridItem({
            testFilterField: 'filter1'
        });

        expect(spy.calls.count()).toEqual(0);

        component.options.filterFields = [DashboardServiceMock.FIELD_MAP.FILTER];

        component.selectGridItem({
            testFilterField: 'filter1'
        });
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([{
            testFilterField: 'filter1'
        }]);
    });
});

describe('Component: ThumbnailGrid with config', () => {
    let component: ThumbnailGridComponent;
    let fixture: ComponentFixture<ThumbnailGridComponent>;

    initializeTestBed('Thumbnail Grid', {
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock },
            InjectableFilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock }
        ],
        imports: [
            ThumbnailGridModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ThumbnailGridComponent);
        component = fixture.componentInstance;
        component.configOptions = {
            filter: { lhs: 'testConfigFilterField', operator: '=', rhs: 'testConfigFilterValue' },
            limit: 10,
            border: 'percentCompare',
            borderCompareValue: 'Test Compare Value',
            borderPercentThreshold: 0.25,
            categoryField: 'testCategoryField',
            compareField: 'testCategoryField',
            cropAndScale: 'both',
            dateField: 'testDateField',
            defaultLabel: 'testDefaultLabel',
            defaultPercent: 'testDefaultPercent',
            filterFields: ['testFilterField'],
            id: 'testId',
            idField: 'testIdField',
            ignoreSelf: true,
            linkField: 'testLinkField',
            linkPrefix: 'prefix/',
            nameField: 'testNameField',
            objectIdField: 'testIdField',
            objectNameField: 'testNameField',
            openOnMouseClick: false,
            percentField: 'testSizeField',
            predictedNameField: 'testNameField',
            sortDescending: false,
            sortField: 'testSortField',
            tableKey: 'table_key_2',
            textMap: { actual: 'Truth', percentage: 'Score' },
            title: 'Test Title',
            typeField: 'testTypeField',
            typeMap: { jpg: 'img', mov: 'vid' }
        };
        fixture.detectChanges();
    });

    it('does have expected superclass options properties', () => {
        expect(component.options.database).toEqual(DashboardServiceMock.DATABASES.testDatabase2);
        expect(component.options.databases).toEqual(DashboardServiceMock.DATABASES_LIST);
        expect(component.options.table).toEqual(DashboardServiceMock.TABLES.testTable2);
        expect(component.options.tables).toEqual(DashboardServiceMock.TABLES_LIST);
        expect(component.options.fields).toEqual(DashboardServiceMock.FIELDS);
        expect(component.options.limit).toEqual(10);
        expect(component.options.title).toEqual('Test Title');
        expect(component.options.filter).toEqual({
            lhs: 'testConfigFilterField',
            operator: '=',
            rhs: 'testConfigFilterValue'
        });
    });

    it('does have expected class options properties', () => {
        expect(component.options.border).toEqual('percentCompare');
        expect(component.options.borderCompareValue).toEqual('Test Compare Value');
        expect(component.options.borderPercentThreshold).toEqual(0.25);
        expect(component.options.cropAndScale).toEqual('both');
        expect(component.options.defaultLabel).toEqual('testDefaultLabel');
        expect(component.options.defaultPercent).toEqual('testDefaultPercent');
        expect(component.options.id).toEqual('testId');
        expect(component.options.ignoreSelf).toEqual(true);
        expect(component.options.linkPrefix).toEqual('prefix/');
        expect(component.options.openOnMouseClick).toEqual(false);
        expect(component.options.sortDescending).toEqual(false);

        expect(component.options.textMap).toEqual({
            actual: 'Truth',
            percentage: 'Score'
        });
        expect(component.options.typeMap).toEqual({
            jpg: 'img',
            mov: 'vid'
        });

        expect(component.options.categoryField).toEqual(DashboardServiceMock.FIELD_MAP.CATEGORY);
        expect(component.options.compareField).toEqual(DashboardServiceMock.FIELD_MAP.CATEGORY);
        expect(component.options.dateField).toEqual(DashboardServiceMock.FIELD_MAP.DATE);
        expect(component.options.filterFields).toEqual([DashboardServiceMock.FIELD_MAP.FILTER]);
        expect(component.options.idField).toEqual(DashboardServiceMock.FIELD_MAP.ID);
        expect(component.options.linkField).toEqual(DashboardServiceMock.FIELD_MAP.LINK);
        expect(component.options.nameField).toEqual(DashboardServiceMock.FIELD_MAP.NAME);
        expect(component.options.objectIdField).toEqual(DashboardServiceMock.FIELD_MAP.ID);
        expect(component.options.objectNameField).toEqual(DashboardServiceMock.FIELD_MAP.NAME);
        expect(component.options.percentField).toEqual(DashboardServiceMock.FIELD_MAP.SIZE);
        expect(component.options.predictedNameField).toEqual(DashboardServiceMock.FIELD_MAP.NAME);
        expect(component.options.sortField).toEqual(DashboardServiceMock.FIELD_MAP.SORT);
        expect(component.options.typeField).toEqual(DashboardServiceMock.FIELD_MAP.TYPE);
    });

    it('does show header in toolbar with visualization title from config', () => {
        let header = fixture.debugElement.query(By.css('mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toContain('Test Title');
    });
});
