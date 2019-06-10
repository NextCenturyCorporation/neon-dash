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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector, ViewEncapsulation } from '@angular/core';
import { } from 'jasmine-core';

import { SampleComponent } from './sample.component';
import { AbstractSubcomponent } from './subcomponent.abstract';
import { SubcomponentImpl1 } from './subcomponent.impl1';
import { SubcomponentImpl2 } from './subcomponent.impl2';

import { AbstractSearchService } from '../../services/abstract.search.service';
import { DashboardService } from '../../services/dashboard.service';
import { FilterService } from '../../services/filter.service';
import { SearchService } from '../../services/search.service';

import { NeonConfig, NeonFieldMetaData } from '../../model/types';

import { DashboardServiceMock } from '../../../testUtils/MockServices/DashboardServiceMock';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { MatDialog } from '@angular/material';

import { CommonWidgetModule } from '../../common-widget.module';
import { ConfigService } from '../../services/config.service';

// Helper functions.

/*
let validateSelect = (element: any, name: string, required: boolean = false, disabled: boolean = false) => {
    expect(element.componentInstance.disabled).toEqual(disabled);
    expect(element.componentInstance.placeholder).toEqual(name);
    expect(element.componentInstance.required).toEqual(required);
};

let validateSelectFields = (element: any, required: boolean = false, selected: string = '') => {
    let options = element.componentInstance.options.toArray();
    expect(options.length).toEqual(DashboardServiceMock.FIELDS.length + (required ? 0 : 1));
    if (!required) {
        // Check for the empty field!
        expect(options[0].getLabel()).toEqual('(None)');
    }
    // Normally you shouldn't use a loop to test elements in an array but the FIELDS are updated for use by many visualizations.
    for (let i = 0; i < DashboardServiceMock.FIELDS.length; ++i) {
        let index = (required ? i : (i + 1));
        expect(options[index].getLabel()).toEqual(DashboardServiceMock.FIELDS[i].prettyName);
        expect(options[index].selected).toEqual(selected ? (DashboardServiceMock.FIELDS[i].columnName === selected) : false);
    }
};

let validateToggle = (element: any, value: any, content: string, checked: boolean) => {
    expect(element.componentInstance.value).toEqual(value);
    expect(element.nativeElement.textContent).toContain(content);
    expect(element.nativeElement.classList.contains('mat-button-toggle-checked')).toEqual(checked);
};
*/

// Must define the test component.
@Component({
    selector: 'app-test-sample',
    templateUrl: './sample.component.html',
    styleUrls: ['./sample.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})

/* eslint-disable @typescript-eslint/no-useless-constructor */
class TestSampleComponent extends SampleComponent {
    constructor(
        dashboardService: DashboardService,
        filterService: FilterService,
        searchService: AbstractSearchService,
        injector: Injector,
        ref: ChangeDetectorRef,
        dialog: MatDialog
    ) {
        super(
            dashboardService,
            filterService,
            searchService,
            injector,
            ref,
            dialog
        );
    }

    // TODO Add any needed custom functions here.
}
/* eslint-enable @typescript-eslint/no-useless-constructor */

// TODO Create a test implementation of your subcomponent so you can test its behavior.

/* eslint-disable @typescript-eslint/no-unused-vars */
class TestSubcomponent extends AbstractSubcomponent {
    buildElements(_elementRef: ElementRef) {
        // TODO
    }

    destroyElements() {
        // TODO
    }

    updateData(_data: any[]) {
        // TODO
    }
}
/* eslint-enable @typescript-eslint/no-unused-vars */

describe('Component: Sample', () => {
    let component: TestSampleComponent;
    let fixture: ComponentFixture<TestSampleComponent>;

    initializeTestBed('Sample', {
        declarations: [
            TestSampleComponent
        ],
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock },
            FilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            Injector,
            { provide: ConfigService, useValue: ConfigService.as(NeonConfig.get()) }

        ],
        imports: [
            CommonWidgetModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestSampleComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('class options properties are set to expected defaults', () => {
        expect(component.options.sampleOptionalField).toEqual(NeonFieldMetaData.get());
        expect(component.options.sampleRequiredField).toEqual(NeonFieldMetaData.get());
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

        component.options.sampleRequiredField = DashboardServiceMock.FIELD_MAP.FILTER;
        let actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(1);
        expect((actual[0].filterDesign).database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect((actual[0].filterDesign).table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect((actual[0].filterDesign).field).toEqual(DashboardServiceMock.FIELD_MAP.FILTER);
        expect((actual[0].filterDesign).operator).toEqual('=');
        expect((actual[0].filterDesign).value).toBeUndefined();
    });

    it('finalizeVisualizationQuery does return expected query', () => {
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.sampleRequiredField = NeonFieldMetaData.get({ columnName: 'testRequiredField1', prettyName: 'Test Required Field 1' });

        expect(component.finalizeVisualizationQuery(component.options, {}, [])).toEqual({
            aggregation: [{
                field: 'testRequiredField1',
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
        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        component.options.table = DashboardServiceMock.TABLES.testTable1;
        component.options.sampleRequiredField = NeonFieldMetaData.get({ columnName: 'testRequiredField1', prettyName: 'Test Required Field 1' });
        component.options.sampleOptionalField = NeonFieldMetaData.get({ columnName: 'testOptionalField1', prettyName: 'Test Optional Field 1' });

        expect(component.finalizeVisualizationQuery(component.options, {}, [])).toEqual({
            aggregation: [{
                field: 'testOptionalField1',
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
        component.options.sampleRequiredField = NeonFieldMetaData.get({ columnName: 'testRequiredField1', prettyName: 'Test Required Field 1' });
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
            field: DashboardServiceMock.FIELD_MAP.FILTER,
            value: 'testFilterValue'
        }, true);

        expect(spyExchange.calls.count()).toEqual(1);
        expect(spyExchange.calls.argsFor(0)).toEqual([[{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.FILTER,
            operator: '=',
            value: 'testFilterValue'
        }]]);
        expect(spyToggle.calls.count()).toEqual(0);
    });

    it('filterOnItem does call toggleFilters if replaceAll=false', () => {
        let spyExchange = spyOn((component as any), 'exchangeFilters');
        let spyToggle = spyOn((component as any), 'toggleFilters');

        (component as any).filterOnItem({
            field: DashboardServiceMock.FIELD_MAP.FILTER,
            value: 'testFilterValue'
        });

        expect(spyExchange.calls.count()).toEqual(0);
        expect(spyToggle.calls.count()).toEqual(1);
        expect(spyToggle.calls.argsFor(0)).toEqual([[{
            datastore: '',
            database: DashboardServiceMock.DATABASES.testDatabase1,
            table: DashboardServiceMock.TABLES.testTable1,
            field: DashboardServiceMock.FIELD_MAP.FILTER,
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

        component.options.database = DashboardServiceMock.DATABASES.testDatabase1;
        expect(component.validateVisualizationQuery(component.options)).toEqual(false);

        component.options.table = DashboardServiceMock.TABLES.testTable1;
        expect(component.validateVisualizationQuery(component.options)).toEqual(false);

        component.options.sampleRequiredField = NeonFieldMetaData.get({ columnName: 'testRequiredField1', prettyName: 'Test Required Field 1' });
        expect(component.validateVisualizationQuery(component.options)).toEqual(true);
    });

    it('transformVisualizationQueryResults with aggregation query data does return expected data', () => {
        component.options.sampleRequiredField = NeonFieldMetaData.get({ columnName: 'testRequiredField1', prettyName: 'Test Required Field 1' });

        let actual = component.transformVisualizationQueryResults(component.options, [{
            _count: 2,
            testRequiredField1: 'a'
        }, {
            _count: 1,
            testRequiredField1: 'z'
        }]);
        expect(component.visualizationData).toEqual([{
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
        expect(actual).toEqual(2);
    });

    it('transformVisualizationQueryResults with empty aggregation query data does return expected data', () => {
        component.options.sampleRequiredField = NeonFieldMetaData.get({ columnName: 'testRequiredField1', prettyName: 'Test Required Field 1' });

        let actual = component.transformVisualizationQueryResults(component.options, []);
        expect(component.visualizationData).toEqual([]);
        expect(actual).toEqual(0);
    });

    it('transformVisualizationQueryResults with aggregation query data and optional field does return expected data', () => {
        component.options.sampleOptionalField = NeonFieldMetaData.get({ columnName: 'testOptionalField1', prettyName: 'Test Optional Field 1' });
        component.options.sampleRequiredField = NeonFieldMetaData.get({ columnName: 'testRequiredField1', prettyName: 'Test Required Field 1' });

        let actual = component.transformVisualizationQueryResults(component.options, [{
            _count: 2,
            testOptionalField1: 'alpha',
            testRequiredField1: 'a'
        }, {
            _count: 1,
            testOptionalField1: 'omega',
            testRequiredField1: 'z'
        }]);
        expect(component.visualizationData).toEqual([{
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
        expect(actual).toEqual(2);
    });

    it('refreshVisualization does call subcomponentObject.updateData', () => {
        let spy = spyOn(component.subcomponentObject, 'updateData');

        component.refreshVisualization();
        expect(spy.calls.count()).toEqual(0);

        (component as any).visualizationData = [];
        component.refreshVisualization();
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([[]]);

        (component as any).visualizationData = [{}, {}];
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
        (component as any).visualizationData = [{
            count: 2,
            label: 'alpha',
            value: 'a'
        }, {
            count: 1,
            label: 'omega',
            value: 'z'
        }];

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

    initializeTestBed('Sample', {
        declarations: [
            TestSampleComponent
        ],
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock },
            FilterService,
            { provide: AbstractSearchService, useClass: SearchService },
            Injector,
            { provide: ConfigService, useValue: ConfigService.as(NeonConfig.get()) },
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
            CommonWidgetModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestSampleComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('superclass options properties are set to expected values from config', () => {
        expect(component.options.database).toEqual(DashboardServiceMock.DATABASES.testDatabase2);
        expect(component.options.table).toEqual(DashboardServiceMock.TABLES.testTable2);
        expect(component.options.limit).toEqual(1234);
        expect(component.options.title).toEqual('Test Title');
        expect(component.options.unsharedFilterField).toEqual(DashboardServiceMock.FIELD_MAP.FILTER);
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
        expect(component.options.sampleOptionalField).toEqual(DashboardServiceMock.FIELD_MAP.NAME);
        expect(component.options.sampleRequiredField).toEqual(DashboardServiceMock.FIELD_MAP.CATEGORY);
        expect(component.options.sortDescending).toEqual(true);
        expect(component.options.subcomponentType).toEqual('Impl2');
        expect(component.subcomponentTypes).toEqual(['Impl1', 'Impl2']);
        expect(component.subcomponentObject.constructor.name).toEqual(SubcomponentImpl2.name);
    });

    it('class data properties are set to expected defaults', () => {
        // Element Refs
        expect(component.headerText).toBeDefined();
        expect(component.infoText).toBeDefined();
        // TODO expect(component.subcomponentElementRef).toBeDefined();
        expect(component.visualization).toBeDefined();
    });

    it('does show header in toolbar with visualization title from config', () => {
        let header = fixture.debugElement.query(By.css('mat-sidenav-container mat-toolbar .header'));
        expect(header).not.toBeNull();
        expect(header.nativeElement.textContent).toContain('Test Title');
    });
});
