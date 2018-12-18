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
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    CUSTOM_ELEMENTS_SCHEMA,
    ElementRef,
    Injector,
    NgModule,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';

import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By, DomSanitizer } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import {} from 'jasmine-core';

import { AnnotationViewerComponent } from './annotation-viewer.component';
import { ExportControlComponent } from '../export-control/export-control.component';
import { UnsharedFilterComponent } from '../unshared-filter/unshared-filter.component';

import { Color } from '../../color';
import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { WidgetService } from '../../services/widget.service';
import { LegendComponent } from '../legend/legend.component';

import { AppMaterialModule } from '../../app.material.module';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { FilterServiceMock } from '../../../testUtils/MockServices/FilterServiceMock';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

// Must define the test component.
@Component({
        selector: 'app-annotation-viewer',
        templateUrl: './annotation-viewer.component.html',
        styleUrls: ['./annotation-viewer.component.scss'],
        encapsulation: ViewEncapsulation.Emulated,
        changeDetection: ChangeDetectionStrategy.OnPush
})

class TestAnnotationViewerComponent extends AnnotationViewerComponent {
    constructor(
        widgetService: AbstractWidgetService,
        connectionService: ConnectionService,
        datasetService: DatasetService,
        filterService: FilterService,
        injector: Injector,
        ref: ChangeDetectorRef
    ) {
        super(
            widgetService,
            connectionService,
            datasetService,
            filterService,
            injector,
            ref
        );
    }

    // TODO Add any needed custom functions here.
}

/* tslint:enable:component-class-suffix */

describe('Component: AnnotationViewer', () => {
    let component: TestAnnotationViewerComponent;
    let fixture: ComponentFixture<TestAnnotationViewerComponent>;
    let getService = (type: any) => fixture.debugElement.injector.get(type);

    initializeTestBed({
        declarations: [
            ExportControlComponent,
            LegendComponent,
            TestAnnotationViewerComponent,
            UnsharedFilterComponent
        ],
        providers: [
            ConnectionService,
            { provide: AbstractWidgetService, useClass: WidgetService },
            { provide: DatasetService, useClass: DatasetServiceMock },
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
        fixture = TestBed.createComponent(TestAnnotationViewerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('exists', () => {
        expect(component).toBeDefined();
    });

    it('properties are set to expected defaults', () => {
        expect(component.activeData).toEqual([]);
        expect(component.docCount).toBeUndefined();
        expect(component.filters).toEqual([]);
        expect(component.lastPage).toEqual(true);
        expect(component.page).toEqual(1);
        expect(component.responseData).toEqual([]);

        // Element Refs
        expect(component.headerText).toBeDefined();
        expect(component.infoText).toBeDefined();
        expect(component.visualization).toBeDefined();

        // Options

    });

    it('Checks if option object has expected defaults', () => {
        expect(component.annotations).toBeUndefined();
        expect(component.options.startCharacterField).toEqual(new FieldMetaData());
        expect(component.options.endCharacterField).toEqual(new FieldMetaData());
        expect(component.options.textField).toEqual(new FieldMetaData());
        expect(component.options.typeField).toEqual(new FieldMetaData());

        expect(component.docCount).toBeUndefined();
        expect(component.options.documentTextField).toEqual(new FieldMetaData());
        expect(component.data).toEqual([]);
        expect(component.options.singleColor).toEqual(false);
    });

    it('addVisualizationFilter does update filters', () => {
        component.addVisualizationFilter({
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        });

        expect(component.filters).toEqual([{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }]);

        component.addVisualizationFilter({
            id: 'idB',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        });

        expect(component.filters).toEqual([{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }, {
            id: 'idB',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        }]);
    });

    it('addVisualizationFilter does update filters if the ID of the given filter and the ID of an existing filter are matching', () => {
        component.addVisualizationFilter({
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        });

        component.addVisualizationFilter({
            id: 'idA',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        });

        expect(component.filters).toEqual([{
            id: 'idA',
            field: 'field2',
            prettyField: 'prettyField2',
            value: 'value2'
        }]);
    });

    it('createVisualizationFilter does return expected filter object', () => {
        expect(component.createVisualizationFilter('idA', 'field1', 'prettyField1', 'value1')).toEqual({
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        });
    });

    it('createWhere does return expected where predicate', () => {
        component.options.documentTextField = new FieldMetaData('testRequiredField1', 'Test Required Field 1');
        component.displayField = 'testRequiredField1';

        expect(component.createWhere()).toEqual(neon.query.where('testRequiredField1', '!=', null));
    });

    it('filterOnItem does add new filter to empty array and call addNeonFilter', () => {
        component.options.database = DatasetServiceMock.DATABASES[0];
        component.options.table = DatasetServiceMock.TABLES[0];
        let spy = spyOn(component, 'addNeonFilter');

        component.filterOnItem({
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        });
        expect(component.filters).toEqual([]);
        expect(spy.calls.count()).toEqual(1);
        expect(spy.calls.argsFor(0)).toEqual([true, {
            id: undefined,
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }, neon.query.where('field1', '=', 'value1')]);
    });
/*
    it('getButtonText does return expected string', () => {
        expect(component.getButtonText()).toEqual('No Data');

        component.options.limit = 1;
        component.activeData = [{}];
        component.responseData = [{}, {}];
        expect(component.getButtonText()).toEqual('1 - 2 of 2');

        component.activeData = [{}, {}];
        expect(component.getButtonText()).toEqual('Total 2');

        component.responseData = [{}, {}, {}, {}];
        expect(component.getButtonText()).toEqual('1 - 4 of 4');

        component.options.limit = 2;
        expect(component.getButtonText()).toEqual('1 - 4 of 4');

        component.page = 2;
        expect(component.getButtonText()).toEqual('51 - 4 of 4'); //Interesting behavior
    });
*/
    it('getCloseableFilters does return expected array of filters', () => {
        expect(component.getCloseableFilters()).toEqual([]);

        component.filters = [{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }];

        expect(component.getCloseableFilters()).toEqual([{
            id: 'idA',
            field: 'field1',
            prettyField: 'prettyField1',
            value: 'value1'
        }]);
    });

    it('goToNextPage does not update page or call updateActiveData if lastPage is true', () => {
        let spy = spyOn(component, 'updateActiveData');
        component.goToNextPage();

        expect(component.page).toEqual(1);
        expect(spy.calls.count()).toEqual(0);
    });

});
