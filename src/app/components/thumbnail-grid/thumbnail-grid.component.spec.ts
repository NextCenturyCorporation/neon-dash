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
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FieldMetaData } from '../../dataset';
import { Injector } from '@angular/core';
import { NeonGTDConfig } from '../../neon-gtd-config';

import { } from 'jasmine-core';

import { ThumbnailGridComponent } from './thumbnail-grid.component';

import { AbstractSearchService, CompoundFilterType } from '../../services/abstract.search.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';

import { ThumbnailGridModule } from './thumbnail-grid.module';
import { ConfigService } from '../../services/config.service';

describe('Component: ThumbnailGrid', () => {
    let component: ThumbnailGridComponent;
    let fixture: ComponentFixture<ThumbnailGridComponent>;

    initializeTestBed('Thumbnail Grid', {
        providers: [
            { provide: DatasetService, useClass: DatasetServiceMock },
            FilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            Injector,
            { provide: ConfigService, useValue: ConfigService.as(new NeonGTDConfig()) }

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

        expect(component.options.categoryField).toEqual(new FieldMetaData());
        expect(component.options.compareField).toEqual(new FieldMetaData());
        expect(component.options.filterFields).toEqual([]);
        expect(component.options.idField).toEqual(new FieldMetaData());
        expect(component.options.linkField).toEqual(new FieldMetaData());
        expect(component.options.nameField).toEqual(new FieldMetaData());
        expect(component.options.objectIdField).toEqual(new FieldMetaData());
        expect(component.options.objectNameField).toEqual(new FieldMetaData());
        expect(component.options.percentField).toEqual(new FieldMetaData());
        expect(component.options.predictedNameField).toEqual(new FieldMetaData());
        expect(component.options.sortField).toEqual(new FieldMetaData());
        expect(component.options.typeField).toEqual(new FieldMetaData());

        expect(component.headerText).toBeDefined();
        expect(component.infoText).toBeDefined();
        expect(component.thumbnailGrid).toBeDefined();
        expect(component.visualization).toBeDefined();
    });

    it('does have expected class properties', () => {
        expect(component.gridArray).toEqual([]);
        expect(component.mediaTypes).toEqual({
            image: 'img',
            video: 'vid',
            html: 'htm',
            pdf: 'pdf',
            audio: 'aud',
            maskImage: 'mask'
        });
    });

    it('does show toolbar', () => {
        let container = fixture.debugElement.query(By.css('.visualization-sidenav'));
        expect(container).not.toBeNull();
        let toolbar = fixture.debugElement.query(By.css('.visualization-sidenav mat-toolbar'));
        expect(toolbar).not.toBeNull();
    });

    it('does show header in toolbar with visualization title', () => {
        let header = fixture.debugElement.query(By.css('.visualization-sidenav mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toContain('Thumbnail Grid');
    });

    it('does show data-info and hide error-message in toolbar if errorMessage is undefined', async(() => {
        (component as any).layerIdToElementCount.set(component.options._id, 10);

        // Force the component to update all its ngFor and ngIf elements.
        component.changeDetection.detectChanges();

        let dataInfoTextInToolbar = fixture.debugElement.query(By.css('.visualization-sidenav mat-toolbar .data-info'));
        expect(dataInfoTextInToolbar).not.toBeNull();
        expect(dataInfoTextInToolbar.nativeElement.textContent).toContain('10 Items');

        let errorMessageInToolbar = fixture.debugElement.query(By.css('.visualization-sidenav mat-toolbar .error-message'));
        expect(errorMessageInToolbar).toBeNull();
    }));

    it('does show error-message in toolbar if errorMessage is defined', async(() => {
        (component as any).errorMessage = 'Test Error Message';

        // Force the component to update all its ngFor and ngIf elements.
        component.changeDetection.detectChanges();

        let dataInfoTextInToolbar = fixture.debugElement.query(By.css('.visualization-sidenav mat-toolbar .data-info'));
        expect(dataInfoTextInToolbar).toBeNull();

        let errorMessageInToolbar = fixture.debugElement.query(By.css('.visualization-sidenav mat-toolbar .error-message'));
        expect(errorMessageInToolbar).not.toBeNull();
        expect(errorMessageInToolbar.nativeElement.textContent).toContain('Test Error Message');
    }));

    it('does show settings icon button in toolbar', () => {
        let icon = fixture.debugElement.query(By.css('.visualization-sidenav mat-toolbar button mat-icon'));
        expect(icon.nativeElement.textContent).toEqual('settings');
    });

    it('does hide loading overlay by default', () => {
        component.changeDetection.detectChanges();
        let hiddenLoadingOverlay = fixture.debugElement.query(By.css('.visualization-sidenav .not-loading-overlay'));
        expect(hiddenLoadingOverlay).not.toBeNull();

        let hiddenSpinner = fixture.debugElement.query(By.css('.visualization-sidenav .not-loading-overlay mat-spinner'));
        expect(hiddenSpinner).not.toBeNull();
    });

    it('does show loading overlay if loadingCount is positive', async(() => {
        (component as any).loadingCount = 1;

        // Force the component to update all its ngFor and ngIf elements.
        component.changeDetection.detectChanges();

        let loadingOverlay = fixture.debugElement.query(By.css('.visualization-sidenav .loading-overlay'));
        expect(loadingOverlay).not.toBeNull();

        let spinner = fixture.debugElement.query(By.css('.visualization-sidenav .loading-overlay mat-spinner'));
        expect(spinner).not.toBeNull();
    }));

    it('does show body-container', () => {
        let bodyContainer = fixture.debugElement.query(By.css('.visualization-sidenav .body-container'));
        expect(bodyContainer).not.toBeNull();
    });

    it('does not show thumbnail-grid-div elements if gridArray is empty array', () => {
        let elements = fixture.debugElement.queryAll(By.css('.visualization-sidenav .body-container .thumbnail-grid-div'));
        expect(elements.length).toEqual(0);
    });

    it('does show thumbnail-grid-div elements if gridArray is non-empty array', async(() => {
        component.options.linkField = new FieldMetaData('testLinkField', 'Test Link Field');
        component.options.nameField = new FieldMetaData('testNameField', 'Test Name Field');
        component.options.objectIdField = new FieldMetaData('testObjectIdField', 'Test Object ID Field');
        component.options.objectNameField = new FieldMetaData('testObjectNameField', 'Test Object Name Field');
        component.options.percentField = new FieldMetaData('testPercentField', 'Test Percent Field');
        component.options.predictedNameField = new FieldMetaData('testPredictedNameField', 'Test Predicted Name Field');

        component.gridArray = [{
            testLinkField: 'link1',
            testNameField: 'name1',
            testObjectIdField: 'objectId1',
            testObjectNameField: 'objectName1',
            testPercentField: 0.1,
            testPredictedNameField: 'predictedName1'
        }, {
            testLinkField: 'link2',
            testNameField: 'name2',
            testObjectIdField: 'objectId2',
            testObjectNameField: 'objectName2',
            testPercentField: 0.2,
            testPredictedNameField: 'predictedName2'
        }];

        // Force the component to update all its ngFor and ngIf elements.
        component.changeDetection.detectChanges();

        let elements = fixture.debugElement.queryAll(By.css('.visualization-sidenav .body-container .thumbnail-grid-div'));
        expect(elements.length).toEqual(2);

        expect(elements[0].nativeElement.classList.contains('with-text')).toEqual(true);
        expect(elements[0].nativeElement.classList.contains('selected')).toEqual(false);

        expect(elements[1].nativeElement.classList.contains('with-text')).toEqual(true);
        expect(elements[1].nativeElement.classList.contains('selected')).toEqual(false);

        let divElements = fixture.debugElement.queryAll(By.css('.visualization-sidenav .body-container .thumbnail-grid-div'));
        expect(divElements.length).toEqual(2);
    }));

    it('does not show footer-container or pagination-button elements by default', () => {
        component.changeDetection.detectChanges();
        let footerContainer = fixture.debugElement.query(By.css('.visualization-sidenav .footer'));
        expect(footerContainer).toBeNull();

        let bodyContainer = fixture.debugElement.query(By.css('.visualization-sidenav .body-container.with-footer'));
        expect(bodyContainer).toBeNull();
    });

    it('does show footer-container and pagination-button elements if on first page', async(() => {
        (component as any).layerIdToElementCount.set(component.options._id, 3);
        (component as any).lastPage = false;
        (component as any).page = 1;
        component.options.limit = 1;

        // Force the component to update all its ngFor and ngIf elements.
        component.changeDetection.detectChanges();

        let footerContainer = fixture.debugElement.query(By.css('.visualization-sidenav .footer'));
        expect(footerContainer).not.toBeNull();

        let bodyContainer = fixture.debugElement.query(By.css('.visualization-sidenav .body-container.with-footer'));
        expect(bodyContainer).not.toBeNull();

        let footerButtons = fixture.debugElement.queryAll(By.css(
            '.visualization-sidenav .footer .footer-button-container .pagination-button'
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

        let footerContainer = fixture.debugElement.query(By.css('.visualization-sidenav .footer'));
        expect(footerContainer).not.toBeNull();

        let bodyContainer = fixture.debugElement.query(By.css('.visualization-sidenav .body-container.with-footer'));
        expect(bodyContainer).not.toBeNull();

        let footerButtons = fixture.debugElement.queryAll(By.css(
            '.visualization-sidenav .footer .footer-button-container .pagination-button'
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

        let footerContainer = fixture.debugElement.query(By.css('.visualization-sidenav .footer'));
        expect(footerContainer).not.toBeNull();

        let bodyContainer = fixture.debugElement.query(By.css('.visualization-sidenav .body-container.with-footer'));
        expect(bodyContainer).not.toBeNull();

        let footerButtons = fixture.debugElement.queryAll(By.css(
            '.visualization-sidenav .footer .footer-button-container .pagination-button'
        ));
        expect(footerButtons.length).toEqual(2);

        expect(footerButtons[0].componentInstance.disabled).toEqual(false);
        expect(footerButtons[0].nativeElement.textContent).toContain('Previous');

        expect(footerButtons[1].componentInstance.disabled).toEqual(true);
        expect(footerButtons[1].nativeElement.textContent).toContain('Next');
    }));

    it('finalizeVisualizationQuery does return expected query', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.linkField = new FieldMetaData('testLinkField', 'Test Link Field');
        component.options.sortField = new FieldMetaData('testSortField', 'Test Sort Field');

        expect(component.finalizeVisualizationQuery(component.options, {}, [])).toEqual({
            fields: ['*'],
            filter: {
                filters: [{
                    field: 'testLinkField',
                    operator: '!=',
                    value: null
                }, {
                    field: 'testLinkField',
                    operator: '!=',
                    value: ''
                }],
                type: 'and'
            },
            sort: {
                field: 'testSortField',
                order: 1
            }
        });

        component.options.sortDescending = true;

        expect(component.finalizeVisualizationQuery(component.options, {}, [])).toEqual({
            fields: ['*'],
            filter: {
                filters: [{
                    field: 'testLinkField',
                    operator: '!=',
                    value: null
                }, {
                    field: 'testLinkField',
                    operator: '!=',
                    value: ''
                }],
                type: 'and'
            },
            sort: {
                field: 'testSortField',
                order: -1
            }
        });

        delete component.options.sortField.columnName;

        expect(component.finalizeVisualizationQuery(component.options, {}, [])).toEqual({
            fields: ['*'],
            filter: null
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

        component.options.objectNameField = new FieldMetaData('testObjectNameField', 'Test Object Name Field');

        expect(component.getThumbnailLabel({
            testObjectNameField: 'myObjectName',
            testPredictedNameField: 'myPredictedName'
        })).toEqual('myObjectName');

        expect(component.getThumbnailLabel({
            testPredictedNameField: 'myPredictedName'
        })).toEqual('');

        component.options.predictedNameField = new FieldMetaData('testPredictedNameField', 'Test Predicted Name Field');

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

        component.options.percentField = new FieldMetaData('testPercentField', 'Test Percent Field');

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

        component.options.nameField = new FieldMetaData('testNameField', 'Test Name Field');
        component.options.objectNameField = new FieldMetaData('testObjectNameField', 'Test Object Name Field');
        component.options.percentField = new FieldMetaData('testPercentField', 'Test Percent Field');
        component.options.predictedNameField = new FieldMetaData('testPredictedNameField', 'Test Predicted Name Field');

        expect(component.getThumbnailTitle({
            testNameField: 'myName',
            testObjectNameField: 'myObjectName',
            testPercentField: 0.1234,
            testPredictedNameField: 'myPredictedName'
        })).toEqual('myName, Prediction : myPredictedName, Actual : myObjectName');
    });

    it('getThumbnailTitle does use textMap', () => {
        component.options.nameField = new FieldMetaData('testNameField', 'Test Name Field');
        component.options.objectNameField = new FieldMetaData('testObjectNameField', 'Test Object Name Field');
        component.options.percentField = new FieldMetaData('testPercentField', 'Test Percent Field');
        component.options.predictedNameField = new FieldMetaData('testPredictedNameField', 'Test Predicted Name Field');
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

        component.options.filterFields = [DatasetServiceMock.FILTER_FIELD];
        let actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(2);
        expect((actual[0].filterDesign).database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[0].filterDesign).table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[0].filterDesign).field).toEqual(DatasetServiceMock.FILTER_FIELD);
        expect((actual[0].filterDesign).operator).toEqual('=');
        expect((actual[0].filterDesign).value).toBeUndefined();
        expect((actual[1].filterDesign).type).toEqual(CompoundFilterType.OR);
        expect((actual[1].filterDesign).filters.length).toEqual(1);
        expect((actual[1].filterDesign).filters[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[1].filterDesign).filters[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[1].filterDesign).filters[0].field).toEqual(DatasetServiceMock.FILTER_FIELD);
        expect((actual[1].filterDesign).filters[0].operator).toEqual('=');
        expect((actual[1].filterDesign).filters[0].value).toBeUndefined();
    });

    it('isSelectable does return expected boolean', () => {
        component.options.openOnMouseClick = false;
        expect(component.isSelectable()).toEqual(false);

        component.options.idField = new FieldMetaData('testIdField', 'Test ID Field');
        expect(component.isSelectable()).toEqual(true);
        component.options.idField = new FieldMetaData();

        component.options.openOnMouseClick = true;
        expect(component.isSelectable()).toEqual(true);
    });

    it('isSelected does return expected boolean', () => {
        expect(component.isSelected({})).toEqual(false);

        expect(component.isSelected({
            testFilterField: 'testFilterValue1'
        })).toEqual(false);

        component.options.filterFields = [DatasetServiceMock.FILTER_FIELD];

        expect(component.isSelected({
            testFilterField: 'testFilterValue1'
        })).toEqual(false);

        spyOn((component as any), 'isFiltered').and.callFake((filterDesign) => filterDesign.database === component.options.database &&
            filterDesign.table === component.options.table && filterDesign.field === component.options.filterFields[0] &&
            filterDesign.operator === '=' && filterDesign.value === 'testFilterValue1');

        expect(component.isSelected({
            testFilterField: 'testFilterValue1'
        })).toEqual(true);

        expect(component.isSelected({
            testFilterField: 'testFilterValue2'
        })).toEqual(false);

        expect(component.isSelected({
            testNotAFilterField: 'testFilterValue1'
        })).toEqual(false);

        component.options.filterFields = [];

        expect(component.isSelected({
            testFilterField: 'testFilterValue1'
        })).toEqual(false);
    });

    it('validateVisualizationQuery does return expected boolean', () => {
        expect(component.validateVisualizationQuery(component.options)).toEqual(false);

        component.options.database = DatasetServiceMock.DATABASES[0];
        expect(component.validateVisualizationQuery(component.options)).toEqual(false);

        component.options.table = DatasetServiceMock.TABLES[0];
        expect(component.validateVisualizationQuery(component.options)).toEqual(false);

        component.options.linkField = new FieldMetaData('testLinkField', 'Test Link Field');
        expect(component.validateVisualizationQuery(component.options)).toEqual(true);
    });

    it('transformVisualizationQueryResults with aggregation query data does return expected data', () => {
        component.options.categoryField = new FieldMetaData('testCategoryField', 'Test Category Field');
        component.options.compareField = new FieldMetaData('testCompareField', 'Test Compare Field');
        component.options.filterFields = [new FieldMetaData('testFilterField', 'Test Filter Field')];
        component.options.idField = new FieldMetaData('_id', 'Test ID Field');
        component.options.linkField = new FieldMetaData('testLinkField', 'Test Link Field');
        component.options.nameField = new FieldMetaData('testNameField', 'Test Name Field');
        component.options.objectIdField = new FieldMetaData('testObjectIdField', 'Test Object ID Field');
        component.options.objectNameField = new FieldMetaData('testObjectNameField', 'Test Object Name Field');
        component.options.percentField = new FieldMetaData('testPercentField', 'Test Percent Field');
        component.options.predictedNameField = new FieldMetaData('testPredictedNameField', 'Test Predicted Name Field');
        component.options.sortField = new FieldMetaData('testSortField', 'Test Sort Field');
        component.options.typeField = new FieldMetaData('testTypeField', 'Test Type Field');

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
        }]);

        expect(component.gridArray).toEqual([{
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
        }]);
        expect(actual).toEqual(2);
    });

    it('transformVisualizationQueryResults with empty aggregation query data does return expected data', () => {
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.linkField = new FieldMetaData('testLinkField', 'Test Link Field');

        let actual = component.transformVisualizationQueryResults(component.options, []);

        expect(component.gridArray).toEqual([]);
        expect(actual).toEqual(0);
    });

    it('transformVisualizationQueryResults with link prefix does return expected data', () => {
        component.options.fields = DatasetServiceMock.FIELDS;
        component.options.idField = new FieldMetaData('_id', 'Test ID Field');
        component.options.linkField = new FieldMetaData('testLinkField', 'Test Link Field');
        component.options.nameField = new FieldMetaData('testNameField', 'Test Name Field');
        component.options.percentField = new FieldMetaData('testSizeField', 'Test Size Field');
        component.options.typeField = new FieldMetaData('testTypeField', 'Test Type Field');
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
        }]);

        expect(component.gridArray).toEqual([{
            _id: 'id1',
            testLinkField: 'prefix/link1',
            testNameField: 'name1',
            testSizeField: 0.1,
            testTypeField: 'type1'
        }, {
            _id: 'id2',
            testLinkField: 'prefix/link2',
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

        component.options.idField = new FieldMetaData('testIdField', 'Test ID Field');

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

        component.options.filterFields = [DatasetServiceMock.FILTER_FIELD];

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
            { provide: DatasetService, useClass: DatasetServiceMock },
            FilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            Injector,
            { provide: ConfigService, useValue: ConfigService.as(new NeonGTDConfig()) },
            { provide: 'filter', useValue: { lhs: 'testConfigFilterField', operator: '=', rhs: 'testConfigFilterValue' } },
            { provide: 'limit', useValue: 10 },
            { provide: 'border', useValue: 'percentCompare' },
            { provide: 'borderCompareValue', useValue: 'Test Compare Value' },
            { provide: 'borderPercentThreshold', useValue: 0.25 },
            { provide: 'categoryField', useValue: 'testCategoryField' },
            { provide: 'compareField', useValue: 'testCategoryField' },
            { provide: 'cropAndScale', useValue: 'both' },
            { provide: 'dateField', useValue: 'testDateField' },
            { provide: 'defaultLabel', useValue: 'testDefaultLabel' },
            { provide: 'defaultPercent', useValue: 'testDefaultPercent' },
            { provide: 'filterFields', useValue: ['testFilterField'] },
            { provide: 'id', useValue: 'testId' },
            { provide: 'idField', useValue: 'testIdField' },
            { provide: 'ignoreSelf', useValue: true },
            { provide: 'linkField', useValue: 'testLinkField' },
            { provide: 'linkPrefix', useValue: 'prefix/' },
            { provide: 'nameField', useValue: 'testNameField' },
            { provide: 'objectIdField', useValue: 'testIdField' },
            { provide: 'objectNameField', useValue: 'testNameField' },
            { provide: 'openOnMouseClick', useValue: false },
            { provide: 'percentField', useValue: 'testSizeField' },
            { provide: 'predictedNameField', useValue: 'testNameField' },
            { provide: 'sortDescending', useValue: false },
            { provide: 'sortField', useValue: 'testSortField' },
            { provide: 'tableKey', useValue: 'table_key_2' },
            { provide: 'textMap', useValue: { actual: 'Truth', percentage: 'Score' } },
            { provide: 'title', useValue: 'Test Title' },
            { provide: 'typeField', useValue: 'testTypeField' },
            { provide: 'typeMap', useValue: { jpg: 'img', mov: 'vid' } }
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

    it('does have expected superclass options properties', () => {
        expect(component.options.database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect(component.options.databases).toEqual(DatasetServiceMock.DATABASES);
        expect(component.options.table).toEqual(DatasetServiceMock.TABLES[1]);
        expect(component.options.tables).toEqual(DatasetServiceMock.TABLES);
        expect(component.options.fields).toEqual(DatasetServiceMock.FIELDS);
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

        expect(component.options.categoryField).toEqual(new FieldMetaData('testCategoryField', 'Test Category Field', false, 'string'));
        expect(component.options.compareField).toEqual(new FieldMetaData('testCategoryField', 'Test Category Field', false, 'string'));
        expect(component.options.dateField).toEqual(new FieldMetaData('testDateField', 'Test Date Field', false, 'date'));
        expect(component.options.filterFields).toEqual([new FieldMetaData('testFilterField', 'Test Filter Field', false, 'string')]);
        expect(component.options.idField).toEqual(new FieldMetaData('testIdField', 'Test ID Field', false, 'string'));
        expect(component.options.linkField).toEqual(new FieldMetaData('testLinkField', 'Test Link Field', false, 'string'));
        expect(component.options.nameField).toEqual(new FieldMetaData('testNameField', 'Test Name Field', false, 'string'));
        expect(component.options.objectIdField).toEqual(new FieldMetaData('testIdField', 'Test ID Field', false, 'string'));
        expect(component.options.objectNameField).toEqual(new FieldMetaData('testNameField', 'Test Name Field', false, 'string'));
        expect(component.options.percentField).toEqual(new FieldMetaData('testSizeField', 'Test Size Field', false, 'float'));
        expect(component.options.predictedNameField).toEqual(new FieldMetaData('testNameField', 'Test Name Field', false, 'string'));
        expect(component.options.sortField).toEqual(new FieldMetaData('testSortField', 'Test Sort Field', false, 'string'));
        expect(component.options.typeField).toEqual(new FieldMetaData('testTypeField', 'Test Type Field', false, 'string'));
    });

    it('does show header in toolbar with visualization title from config', () => {
        let header = fixture.debugElement.query(By.css('.visualization-sidenav mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toContain('Test Title');
    });
});
