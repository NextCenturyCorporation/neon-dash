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
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By, DomSanitizer } from '@angular/platform-browser';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {} from 'jasmine-core';

import { SampleComponent } from './sample.component';
import { AbstractSubcomponent, SubcomponentListener } from './subcomponent.abstract';
import { SubcomponentImpl1 } from './subcomponent.impl1';
import { SubcomponentImpl2 } from './subcomponent.impl2';
import { UnsharedFilterComponent } from '../unshared-filter/unshared-filter.component';

import { AbstractSearchService } from '../../services/abstract.search.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { SearchService } from '../../services/search.service';

import { AppMaterialModule } from '../../app.material.module';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import { TransformedVisualizationData } from '../base-neon-component/base-neon.component';

import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { MatDialog } from '@angular/material';

// Helper functions.

let validateSelect = (element: any, name: string, required: boolean = false, disabled: boolean = false) => {
    expect(element.componentInstance.disabled).toEqual(disabled);
    expect(element.componentInstance.placeholder).toEqual(name);
    expect(element.componentInstance.required).toEqual(required);
};

let validateSelectFields = (element: any, required: boolean = false, selected: string = '') => {
    let options = element.componentInstance.options.toArray();
    expect(options.length).toEqual(DatasetServiceMock.FIELDS.length + (required ? 0 : 1));
    if (!required) {
        // Check for the empty field!
        expect(options[0].getLabel()).toEqual('(None)');
    }
    // Normally you shouldn't use a loop to test elements in an array but the FIELDS are updated for use by many visualizations.
    for (let i = 0; i < DatasetServiceMock.FIELDS.length; ++i) {
        let index = (required ? i : (i + 1));
        expect(options[index].getLabel()).toEqual(DatasetServiceMock.FIELDS[i].prettyName);
        expect(options[index].selected).toEqual(selected ? (DatasetServiceMock.FIELDS[i].columnName === selected) : false);
    }
};

let validateToggle = (element: any, value: any, content: string, checked: boolean) => {
    expect(element.componentInstance.value).toEqual(value);
    expect(element.nativeElement.textContent).toContain(content);
    expect(element.nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(checked);
};

// Must define the test component.
@Component({
        selector: 'app-test-sample',
        templateUrl: './sample.component.html',
        styleUrls: ['./sample.component.scss'],
        encapsulation: ViewEncapsulation.Emulated,
        changeDetection: ChangeDetectionStrategy.OnPush
})

class TestSampleComponent extends SampleComponent {
    constructor(
        datasetService: DatasetService,
        filterService: FilterService,
        searchService: AbstractSearchService,
        injector: Injector,
        ref: ChangeDetectorRef,
        dialog: MatDialog
    ) {

        super(
            datasetService,
            filterService,
            searchService,
            injector,
            ref,
            dialog
        );
    }

    // TODO Add any needed custom functions here.
}

// TODO Create a test implementation of your subcomponent so you can test its behavior.

/* tslint:disable:component-class-suffix */
class TestSubcomponent extends AbstractSubcomponent {
    buildElements(elementRef: ElementRef) {
        // TODO
    }

    destroyElements() {
        // TODO
    }

    updateData(data: any[]) {
        // TODO
    }
}
/* tslint:enable:component-class-suffix */

describe('Component: Sample', () => {
    let component: TestSampleComponent;
    let fixture: ComponentFixture<TestSampleComponent>;
    let getService = (type: any) => fixture.debugElement.injector.get(type);

    initializeTestBed('Sample', {
        declarations: [
            TestSampleComponent,
            UnsharedFilterComponent
        ],
        providers: [
            { provide: DatasetService, useClass: DatasetServiceMock },
            FilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
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
        fixture = TestBed.createComponent(TestSampleComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('class options properties are set to expected defaults', () => {
        expect(component.options.sampleOptionalField).toEqual(new FieldMetaData());
        expect(component.options.sampleRequiredField).toEqual(new FieldMetaData());
        expect(component.options.sortDescending).toEqual(false);
        expect(component.options.subcomponentType).toEqual('Impl1');
    });

    it('class properties are set to expected defaults', () => {
        // Element Refs
        expect(component.headerText).toBeDefined();
        expect(component.infoText).toBeDefined();
        expect(component.visualization).toBeDefined();

        // Subcomponent
        expect(component.subcomponentObject.constructor.name).toEqual(SubcomponentImpl1.name);
    });

    it('constructVisualization does work as expected', () => {
        let spy = spyOn(component, 'initializeSubcomponent');

        component.constructVisualization();
        expect(spy.calls.count()).toEqual(1);
    });

    it('designEachFilterWithNoValues does return expected object', () => {
        expect((component as any).designEachFilterWithNoValues()).toEqual([]);

        component.options.sampleRequiredField = DatasetServiceMock.FILTER_FIELD;
        let actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(1);
        expect((actual[0].filterDesign as any).database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[0].filterDesign as any).table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[0].filterDesign as any).field).toEqual(DatasetServiceMock.FILTER_FIELD);
        expect((actual[0].filterDesign as any).operator).toEqual('=');
        expect((actual[0].filterDesign as any).value).toBeUndefined();
    });

    it('finalizeVisualizationQuery does return expected query', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.sampleRequiredField = new FieldMetaData('testRequiredField1', 'Test Required Field 1');

        expect(component.finalizeVisualizationQuery(component.options, {}, [])).toEqual({
            aggregation: [{
                field: '*',
                name: '_count',
                type: 'count'
            }],
            filter: {
                field: 'testRequiredField1',
                operator: '!=',
                value: null
            },
            groups: ['testRequiredField1'],
            sort: {
                field: '_count',
                order: -1
            }
        });
    });

    it('finalizeVisualizationQuery does return expected query with sampleOptionalField', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        component.options.sampleRequiredField = new FieldMetaData('testRequiredField1', 'Test Required Field 1');
        component.options.sampleOptionalField = new FieldMetaData('testOptionalField1', 'Test Optional Field 1');

        expect(component.finalizeVisualizationQuery(component.options, {}, [])).toEqual({
            aggregation: [{
                field: '*',
                name: '_count',
                type: 'count'
            }],
            filter: {
                filters: [{
                    field: 'testRequiredField1',
                    operator: '!=',
                    value: null
                }, {
                    field: 'testOptionalField1',
                    operator: '!=',
                    value: null
                }],
                type: 'and'
            },
            groups: ['testRequiredField1', 'testOptionalField1'],
            sort: {
                field: '_count',
                order: -1
            }
        });
    });

    it('destroyVisualization does work as expected', () => {
        let spy = spyOn(component.subcomponentObject, 'destroyElements');

        component.destroyVisualization();
        expect(spy.calls.count()).toEqual(1);
    });

    it('filterFromSubcomponent does call filterOnItem', () => {
        component.options.sampleRequiredField = new FieldMetaData('testRequiredField1', 'Test Required Field 1');
        let spy = spyOn(component, 'filterOnItem');

        component.filterFromSubcomponent('testInput');
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([{
            field: component.options.sampleRequiredField,
            value: 'testInput'
        }]);
    });

    it('filterOnItem does call exchangeFilters if replaceAll=true', () => {
        let spyExchange = spyOn((component as any), 'exchangeFilters');
        let spyToggle = spyOn((component as any), 'toggleFilters');

        (component as any).filterOnItem({
            field: DatasetServiceMock.FILTER_FIELD,
            value: 'testFilterValue'
        }, true);

        expect(spyExchange.calls.count()).toEqual(1);
        expect(spyExchange.calls.argsFor(0)).toEqual([[{
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.FILTER_FIELD,
            operator: '=',
            value: 'testFilterValue'
        }]]);
        expect(spyToggle.calls.count()).toEqual(0);
    });

    it('filterOnItem does call toggleFilters if replaceAll=false', () => {
        let spyExchange = spyOn((component as any), 'exchangeFilters');
        let spyToggle = spyOn((component as any), 'toggleFilters');

        (component as any).filterOnItem({
            field: DatasetServiceMock.FILTER_FIELD,
            value: 'testFilterValue'
        });

        expect(spyExchange.calls.count()).toEqual(0);
        expect(spyToggle.calls.count()).toEqual(1);
        expect(spyToggle.calls.argsFor(0)).toEqual([[{
            datastore: '',
            database: DatasetServiceMock.DATABASES[0],
            table: DatasetServiceMock.TABLES[0],
            field: DatasetServiceMock.FILTER_FIELD,
            operator: '=',
            value: 'testFilterValue'
        }]]);
    });

    it('getElementRefs does return expected object', () => {
        let refs = component.getElementRefs();
        expect(refs.headerText).toBeDefined();
        expect(refs.infoText).toBeDefined();
        expect(refs.visualization).toBeDefined();
    });

    it('handleChangeSubcomponentType does update subcomponentType and call expected functions', () => {
        let spy1 = spyOn(component, 'initializeSubcomponent');
        let spy2 = spyOn(component, 'handleChangeData');
        let spy3 = spyOn(component.subcomponentObject, 'destroyElements');

        component.handleChangeSubcomponentType('Impl2');

        expect(component.options.subcomponentType).toEqual('Impl2');
        expect(spy1.calls.count()).toEqual(1);
        expect(spy2.calls.count()).toEqual(1);
        expect(spy3.calls.count()).toEqual(1);
    });

    it('handleChangeSubcomponentType does not call expected functions if new type equals subcomponentType', () => {
        let spy1 = spyOn(component, 'initializeSubcomponent');
        let spy2 = spyOn(component, 'handleChangeData');
        let spy3 = spyOn(component.subcomponentObject, 'destroyElements');

        component.handleChangeSubcomponentType('Impl1');

        expect(component.options.subcomponentType).toEqual('Impl1');
        expect(spy1.calls.count()).toEqual(0);
        expect(spy2.calls.count()).toEqual(0);
        expect(spy3.calls.count()).toEqual(0);
    });

    it('initializeSubcomponent does update subcomponentObject', () => {
        component.subcomponentObject = null;
        component.initializeSubcomponent();
        expect(component.subcomponentObject.constructor.name).toEqual(SubcomponentImpl1.name);
    });

    it('validateVisualizationQuery does return expected boolean', () => {
        expect(component.validateVisualizationQuery(component.options)).toEqual(false);

        component.options.database = DatasetServiceMock.DATABASES[0];
        expect(component.validateVisualizationQuery(component.options)).toEqual(false);

        component.options.table = DatasetServiceMock.TABLES[0];
        expect(component.validateVisualizationQuery(component.options)).toEqual(false);

        component.options.sampleRequiredField = new FieldMetaData('testRequiredField1', 'Test Required Field 1');
        expect(component.validateVisualizationQuery(component.options)).toEqual(true);
    });

    it('transformVisualizationQueryResults with aggregation query data does return expected data', () => {
        component.options.sampleRequiredField = new FieldMetaData('testRequiredField1', 'Test Required Field 1');

        let actual = component.transformVisualizationQueryResults(component.options, [{
            _count: 2,
            testRequiredField1: 'a'
        }, {
            _count: 1,
            testRequiredField1: 'z'
        }]);
        expect(actual.data).toEqual([{
            count: 2,
            field: component.options.sampleRequiredField,
            label: 'a',
            value: 'a'
        }, {
            count: 1,
            field: component.options.sampleRequiredField,
            label: 'z',
            value: 'z'
        }]);
    });

    it('transformVisualizationQueryResults with empty aggregation query data does return expected data', () => {
        component.options.sampleRequiredField = new FieldMetaData('testRequiredField1', 'Test Required Field 1');

        let actual = component.transformVisualizationQueryResults(component.options, []);
        expect(actual.data).toEqual([]);
    });

    it('transformVisualizationQueryResults with aggregation query data and optional field does return expected data', () => {
        component.options.sampleOptionalField = new FieldMetaData('testOptionalField1', 'Test Optional Field 1');
        component.options.sampleRequiredField = new FieldMetaData('testRequiredField1', 'Test Required Field 1');

        let actual = component.transformVisualizationQueryResults(component.options, [{
            _count: 2,
            testOptionalField1: 'alpha',
            testRequiredField1: 'a'
        }, {
            _count: 1,
            testOptionalField1: 'omega',
            testRequiredField1: 'z'
        }]);
        expect(actual.data).toEqual([{
            count: 2,
            field: component.options.sampleRequiredField,
            label: 'a - alpha',
            value: 'a'
        }, {
            count: 1,
            field: component.options.sampleRequiredField,
            label: 'z - omega',
            value: 'z'
        }]);
    });

    it('refreshVisualization does call subcomponentObject.updateData', () => {
        let spy = spyOn(component.subcomponentObject, 'updateData');

        component.refreshVisualization();
        expect(spy.calls.count()).toEqual(0);

        (component as any).layerIdToActiveData.set(component.options._id, new TransformedVisualizationData([]));
        component.refreshVisualization();
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[]]);

        (component as any).layerIdToActiveData.set(component.options._id, new TransformedVisualizationData([{}, {}]));
        component.refreshVisualization();
        expect(spy.calls.count()).toEqual(2);
        expect(spy.calls.argsFor(1)).toEqual([[{}, {}]]);
    });

    it('updateOnResize does work as expected', () => {
        let spy = spyOn(component.subcomponentObject, 'redraw');

        component.updateOnResize();
        expect(spy.calls.count()).toEqual(1);
    });

    it('does show toolbarand body-container', () => {
        let container = fixture.debugElement.query(By.css('mat-sidenav-container'));
        expect(container).not.toBeNull();
        let toolbar = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar'));
        expect(toolbar).not.toBeNull();
        let bodyContainer = fixture.debugElement.query(By.css('mat-sidenav-container .body-container'));
        expect(bodyContainer).not.toBeNull();
    });

    it('does show header in toolbar with visualization title', () => {
        let header = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toContain('Sample');
    });

    it('does show settings icon button in toolbar', () => {
        let button = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar button'));

        let icon = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar button mat-icon'));
        expect(icon.nativeElement.textContent).toEqual('settings');
    });

    it('does hide loading overlay by default', () => {
        let hiddenLoadingOverlay = fixture.debugElement.query(By.css('mat-sidenav-container .not-loading-overlay'));
        expect(hiddenLoadingOverlay).not.toBeNull();

        let hiddenSpinner = fixture.debugElement.query(By.css('mat-sidenav-container .not-loading-overlay mat-spinner'));
        expect(hiddenSpinner).not.toBeNull();
    });

    it('does show loading overlay if loadingCount is positive', () => {
        (component as any).loadingCount = 1;

        // Force the component to update all its ngFor and ngIf elements.
        component.changeDetection.detectChanges();

        let loadingOverlay = fixture.debugElement.query(By.css('mat-sidenav-container .loading-overlay'));
        expect(loadingOverlay).not.toBeNull();

        let spinner = fixture.debugElement.query(By.css('mat-sidenav-container .loading-overlay mat-spinner'));
        expect(spinner).not.toBeNull();
    });

    it('does not show data-item elements if active data is empty array', () => {
        let dataItems = fixture.debugElement.queryAll(By.css('mat-sidenav-container .body-container .data-item'));
        expect(dataItems.length).toEqual(0);
    });

    it('does show data-item elements if active data is non-empty array', () => {
        (component as any).layerIdToActiveData.set(component.options._id, new TransformedVisualizationData([{
            count: 2,
            label: 'alpha',
            value: 'a'
        }, {
            count: 1,
            label: 'omega',
            value: 'z'
        }]));

        // Force the component to update all its ngFor and ngIf elements.
        component.changeDetection.detectChanges();

        let dataItems = fixture.debugElement.queryAll(By.css('mat-sidenav-container .body-container .data-item'));
        expect(dataItems.length).toEqual(2);

        let dataItemLabels = fixture.debugElement.queryAll(By.css('mat-sidenav-container .body-container .data-item .text'));
        expect(dataItemLabels.length).toEqual(2);

        expect(dataItemLabels[0].nativeElement.textContent).toContain('alpha: 2');
        expect(dataItemLabels[1].nativeElement.textContent).toContain('omega: 1');

        let dataItemButtons = fixture.debugElement.queryAll(By.css('mat-sidenav-container .body-container .data-item button'));
        expect(dataItemButtons.length).toEqual(4);

        let dataItemIcons = fixture.debugElement.queryAll(By.css('mat-sidenav-container .body-container .data-item mat-icon'));
        expect(dataItemIcons.length).toEqual(4);

        expect(dataItemIcons[0].nativeElement.textContent).toEqual('search');
        expect(dataItemIcons[1].nativeElement.textContent).toEqual('find_replace');
        expect(dataItemIcons[2].nativeElement.textContent).toEqual('search');
        expect(dataItemIcons[3].nativeElement.textContent).toEqual('find_replace');
    });
});

describe('Component: Sample with config', () => {
    let component: TestSampleComponent;
    let fixture: ComponentFixture<TestSampleComponent>;
    let getService = (type: any) => fixture.debugElement.injector.get(type);

    initializeTestBed('Sample', {
        declarations: [
            TestSampleComponent,
            UnsharedFilterComponent
        ],
        providers: [
            { provide: DatasetService, useClass: DatasetServiceMock },
            FilterService,
            { provide: AbstractSearchService, useClass: SearchService },
            Injector,
            { provide: 'config', useValue: new NeonGTDConfig() },
            { provide: 'customEventsToPublish', useValue: [{ id: 'test_publish_event', fields: [{ columnName: 'testPublishField' }] }] },
            { provide: 'customEventsToReceive', useValue: [{ id: 'test_receive_event', fields: [{ columnName: 'testReceiveField' }] }] },
            { provide: 'filter', useValue: { lhs: 'testConfigFilterField', operator: '=', rhs: 'testConfigFilterValue' } },
            { provide: 'hideUnfiltered', useValue: true },
            { provide: 'limit', useValue: 1234 },
            { provide: 'sampleOptionalField', useValue: 'testNameField' },
            { provide: 'sampleRequiredField', useValue: 'testCategoryField' },
            { provide: 'sortDescending', useValue: true },
            { provide: 'subcomponentType', useValue: 'Impl2' },
            { provide: 'tableKey', useValue: 'table_key_2' },
            { provide: 'title', useValue: 'Test Title' },
            { provide: 'unsharedFilterField', useValue: 'testFilterField' },
            { provide: 'unsharedFilterValue', useValue: 'testFilterValue' }
        ],
        imports: [
            AppMaterialModule,
            BrowserAnimationsModule,
            FormsModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestSampleComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('superclass options properties are set to expected values from config', () => {
        expect(component.options.database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect(component.options.table).toEqual(DatasetServiceMock.TABLES[1]);
        expect(component.options.limit).toEqual(1234);
        expect(component.options.title).toEqual('Test Title');
        expect(component.options.unsharedFilterField).toEqual(DatasetServiceMock.FILTER_FIELD);
        expect(component.options.unsharedFilterValue).toEqual('testFilterValue');
        expect(component.options.customEventsToPublish).toEqual([{
            id: 'test_publish_event',
            fields: [{
                columnName: 'testPublishField'
            }]
        }]);
        expect(component.options.customEventsToReceive).toEqual([{
            id: 'test_receive_event',
            fields: [{
                columnName: 'testReceiveField'
            }]
        }]);
        expect(component.options.filter).toEqual({
            lhs: 'testConfigFilterField',
            operator: '=',
            rhs: 'testConfigFilterValue'
        });
    });

    it('class options properties are set to expected values from config', () => {
        expect(component.options.sampleOptionalField).toEqual(DatasetServiceMock.NAME_FIELD);
        expect(component.options.sampleRequiredField).toEqual(DatasetServiceMock.CATEGORY_FIELD);
        expect(component.options.sortDescending).toEqual(true);
        expect(component.options.subcomponentType).toEqual('Impl2');
        expect(component.subcomponentTypes).toEqual(['Impl1', 'Impl2']);
        expect(component.subcomponentObject.constructor.name).toEqual(SubcomponentImpl2.name);
    });

    it('class data properties are set to expected defaults', () => {
        // Element Refs
        expect(component.headerText).toBeDefined();
        expect(component.infoText).toBeDefined();
        // expect(component.subcomponentElementRef).toBeDefined();
        expect(component.visualization).toBeDefined();
    });

    it('does show header in toolbar with visualization title from config', () => {
        let header = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toContain('Test Title');
    });
});
