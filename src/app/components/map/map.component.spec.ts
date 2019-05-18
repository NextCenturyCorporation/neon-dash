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
import { FormsModule } from '@angular/forms';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    Injector,
    ViewEncapsulation
} from '@angular/core';

import { MapComponent } from './map.component';
import { LegendComponent } from '../legend/legend.component';

import { AbstractSearchService } from '../../services/abstract.search.service';
import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { WidgetService } from '../../services/widget.service';

import { NeonGTDConfig } from '../../neon-gtd-config';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '../../app.material.module';
import { By } from '@angular/platform-browser';
import { AbstractMap, BoundingBoxByDegrees, MapPoint, MapType } from './map.type.abstract';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import { WidgetOptionCollection } from '../../widget-option';

import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';
import { MatDialog } from '@angular/material';

function webgl_support(): any {
    try {
        let canvas = document.createElement('canvas');
        /* tslint:disable:no-string-literal */
        return !!window['WebGLRenderingContext'] && (
            canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        /* tslint:enable:no-string-literal */
    } catch (e) { return false; }
}

@Component({
    selector: 'app-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})

class TestMapComponent extends MapComponent {
    constructor(
        datasetService: DatasetService,
        filterService: FilterService,
        searchService: AbstractSearchService,
        injector: Injector,
        widgetService: AbstractWidgetService,
        ref: ChangeDetectorRef,
        dialog: MatDialog
    ) {
        super(
            datasetService,
            filterService,
            searchService,
            injector,
            widgetService,
            ref,
            dialog
        );
    }

    assignTestMap() {
        this.options.type = -1;
        this.mapObject = new TestMap();
        return this.mapObject;
    }

    getDatasetService(): DatasetService {
        return this.datasetService;
    }

    getInjector(): Injector {
        return this.injector;
    }

    getMapPoints(databaseName: string, tableName: string, idField: string, lngField: string, latField: string, colorField: string,
        hoverPopupField: FieldMetaData, data: any[]
    ) {
        return super.getMapPoints(databaseName, tableName, idField, lngField, latField, colorField, hoverPopupField, data);
    }

    spyOnTestMap(functionName: string) {
        return spyOn(this.mapObject, functionName);
    }
}

/* tslint:disable:component-class-suffix */
class TestMap extends AbstractMap {
    addPoints(points: MapPoint[], layer?: any, cluster?: boolean, layerTitle?: string) {
        /* NO-OP */
    }
    clearLayer(layer: any) {
        /* NO-OP */
    }
    destroy() {
        /* NO-OP */
    }
    doCustomInitialization(mapContainer: ElementRef) {
        /* NO-OP */
    }
    hidePoints(layer: any, value: string) {
        /* NO-OP */
    }
    makeSelectionInexact() {
        /* NO-OP */
    }
    removeFilterBox() {
        /* NO-OP */
    }
    unhidePoints(layer: any, value: string) {
        /* NO-OP */
    }
    unhideAllPoints(layer: any) {
        /* NO-OP */
    }
    zoomIn() {
        /* NO-OP */
    }
    zoomOut() {
        /* NO-OP*/
    }
}
/* tslint:enable:component-class-suffix */

function updateMapLayer1(component: TestMapComponent) {
    component.filterVisible.set('testLayer1', true);
    (component as any).layerIdToElementCount.set('testLayer1', 1);

    component.options.layers[0] = new WidgetOptionCollection(() => [], undefined, {});
    component.options.layers[0]._id = 'testLayer1';
    component.options.layers[0].databases = [];
    component.options.layers[0].database = DatasetServiceMock.DATABASES[0];
    component.options.layers[0].fields = [];
    component.options.layers[0].tables = [];
    component.options.layers[0].table = DatasetServiceMock.TABLES[0];
    component.options.layers[0].title = 'Layer A';
    component.options.layers[0].unsharedFilterField = new FieldMetaData();
    component.options.layers[0].unsharedFilterValue = '';

    component.options.layers[0].idField = DatasetServiceMock.ID_FIELD;
    component.options.layers[0].colorField = DatasetServiceMock.TYPE_FIELD;
    component.options.layers[0].hoverPopupField = DatasetServiceMock.TEXT_FIELD;
    component.options.layers[0].dateField = DatasetServiceMock.DATE_FIELD;
    component.options.layers[0].latitudeField = DatasetServiceMock.Y_FIELD;
    component.options.layers[0].longitudeField = DatasetServiceMock.X_FIELD;
    component.options.layers[0].sizeField = DatasetServiceMock.SIZE_FIELD;
}

function updateMapLayer2(component: TestMapComponent) {
    component.filterVisible.set('testLayer2', true);
    (component as any).layerIdToElementCount.set('testLayer2', 10);

    component.options.layers[1] = new WidgetOptionCollection(() => [], undefined, {});
    component.options.layers[1]._id = 'testLayer2';
    component.options.layers[1].databases = [];
    component.options.layers[1].database = DatasetServiceMock.DATABASES[1];
    component.options.layers[1].fields = [];
    component.options.layers[1].tables = [];
    component.options.layers[1].table = DatasetServiceMock.TABLES[1];
    component.options.layers[1].title = 'Layer B';
    component.options.layers[1].unsharedFilterField = new FieldMetaData();
    component.options.layers[1].unsharedFilterValue = '';

    component.options.layers[1].idField = DatasetServiceMock.ID_FIELD;
    component.options.layers[1].colorField = DatasetServiceMock.TYPE_FIELD;
    component.options.layers[1].hoverPopupField = DatasetServiceMock.TEXT_FIELD;
    component.options.layers[1].dateField = DatasetServiceMock.DATE_FIELD;
    component.options.layers[1].latitudeField = DatasetServiceMock.Y_FIELD;
    component.options.layers[1].longitudeField = DatasetServiceMock.X_FIELD;
    component.options.layers[1].sizeField = DatasetServiceMock.SIZE_FIELD;
}

describe('Component: Map', () => {
    let fixture: ComponentFixture<TestMapComponent>,
        component: TestMapComponent,
        getDebug = (selector: string) => fixture.debugElement.query(By.css(selector)),
        getService = (type: any) => fixture.debugElement.injector.get(type),
        addFilter = (box: BoundingBoxByDegrees, dbName: string, tableName: string, latName: string, lngName: string) => {
            let layer = component.options.layers[0];
            let latfield = new FieldMetaData(latName);
            let lngfield = new FieldMetaData(lngName);
            let catfield = new FieldMetaData('category');
            let table = new TableMetaData(tableName, tableName, [latfield, lngfield, catfield]);
            let database = new DatabaseMetaData(dbName);

            database.tables.push(table);

            layer.database = database;
            layer.table = table;
            layer.latitudeField = latfield;
            layer.longitudeField = lngfield;

            component.filterByLocation(box);
        };

    initializeTestBed('Map', {
        declarations: [
            TestMapComponent,
            LegendComponent
        ],
        providers: [
            DatasetService,
            FilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            Injector,
            { provide: AbstractWidgetService, useClass: WidgetService },
            { provide: 'config', useValue: new NeonGTDConfig() }
        ],
        imports: [
            AppMaterialModule,
            FormsModule,
            BrowserAnimationsModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestMapComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('does have expected options', () => {
        expect(component.options.clusterPixelRange).toEqual(15);
        expect(component.options.customServer).toEqual(null);
        expect(component.options.disableCtrlZoom).toEqual(false);
        expect(component.options.hoverSelect).toEqual(null);
        expect(component.options.limit).toEqual(1000);
        expect(component.options.minClusterSize).toEqual(5);
        expect(component.options.singleColor).toEqual(false);
        expect(component.options.title).toEqual('Map');
        expect(component.options.type).toEqual(MapType.Leaflet);

        expect(component.options.west).toEqual(null);
        expect(component.options.east).toEqual(null);
        expect(component.options.north).toEqual(null);
        expect(component.options.south).toEqual(null);
    });

    it('does have expected public properties', () => {
        expect(component.colorKeys).toEqual([]);
        expect(component.disabledSet).toEqual([]);
        expect(Array.from(component.filterVisible.keys())).toEqual([component.options.layers[0]._id]);
        expect(component.filterVisible.get(component.options.layers[0]._id)).toEqual(true);
    });

    it('does have expected layers', () => {
        expect(component.options.layers[0].databases).toEqual([]);
        expect(component.options.layers[0].database).toEqual(new DatabaseMetaData());
        expect(component.options.layers[0].tables).toEqual([]);
        expect(component.options.layers[0].table).toEqual(new TableMetaData());
        expect(component.options.layers[0].fields).toEqual([]);
        expect(component.options.layers[0].title).toEqual('Layer 1');
        expect(component.options.layers[0].idField).toEqual(new FieldMetaData());
        expect(component.options.layers[0].colorField).toEqual(new FieldMetaData());
        expect(component.options.layers[0].hoverPopupField).toEqual(new FieldMetaData());
        expect(component.options.layers[0].dateField).toEqual(new FieldMetaData());
        expect(component.options.layers[0].latitudeField).toEqual(new FieldMetaData());
        expect(component.options.layers[0].longitudeField).toEqual(new FieldMetaData());
        expect(component.options.layers[0].sizeField).toEqual(new FieldMetaData());
    });

    it('should create the default map (Leaflet)', () => {
        expect(getDebug('.leaflet-container')).toBeTruthy();
    });

    it('does have expected map element', () => {
        if (webgl_support()) {
            component.handleChangeMapType();
            let mapElement = getDebug('.leaflet-container'),
                el = mapElement && mapElement.nativeElement,
                cesium = el && el.firstChild;
            expect(cesium).toBeTruthy('MapElement should have at least 1 child');
        }
    });

    it('should create uncollapsed map points, largest first', () => {
        let aHoverMap = new Map<string, number>().set('a', 1);
        let bHoverMap = new Map<string, number>().set('b', 1);
        let cHoverMap = new Map<string, number>().set('c', 1);
        let dHoverMap = new Map<string, number>().set('d', 1);

        let widgetService = getService(AbstractWidgetService);

        let aColor = widgetService.getColor('myDatabase', 'myTable', 'category', 'a').getComputedCss(component.visualization);
        let bColor = widgetService.getColor('myDatabase', 'myTable', 'category', 'b').getComputedCss(component.visualization);
        let cColor = widgetService.getColor('myDatabase', 'myTable', 'category', 'c').getComputedCss(component.visualization);
        let dColor = widgetService.getColor('myDatabase', 'myTable', 'category', 'd').getComputedCss(component.visualization);

        let dataset1 = {
            data: [
                { id: 'testId1', lat: 0, lng: 0, category: 'a', hoverPopupField: 'Hover Popup Field:  A'},
                { id: 'testId2', lat: 0, lng: 0, category: 'b', hoverPopupField: 'Hover Popup Field:  B' },
                { id: 'testId3', lat: 0, lng: 0, category: 'c', hoverPopupField: 'Hover Popup Field:  C'},
                { id: 'testId4', lat: 0, lng: 0, category: 'd', hoverPopupField: 'Hover Popup Field:  D'},
                { id: 'testId5', lat: 0, lng: 0, category: 'd', hoverPopupField: 'Hover Popup Field:  D'}
            ],
            expected: [
                new MapPoint('testId4', ['testId4', 'testId5'], '0.000\u00b0, 0.000\u00b0', 0, 0, 2,
                    dColor, 'Count: 2', 'category', 'd', dHoverMap),
                new MapPoint('testId1', ['testId1'], '0.000\u00b0, 0.000\u00b0', 0, 0, 1,
                    aColor, 'Count: 1', 'category', 'a', aHoverMap),
                new MapPoint('testId2', ['testId2'], '0.000\u00b0, 0.000\u00b0', 0, 0, 1,
                    bColor, 'Count: 1', 'category', 'b', bHoverMap),
                new MapPoint('testId3', ['testId3'], '0.000\u00b0, 0.000\u00b0', 0, 0, 1,
                    cColor, 'Count: 1', 'category', 'c', cHoverMap)
            ]
        };
        let dataset2 = {
            data: [
                { id: 'testId1', lat: 0, lng: 0, category: 'a', hoverPopupField: 'Hover Popup Field:  A' },
                { id: 'testId2', lat: 0, lng: 1, category: 'b', hoverPopupField: 'Hover Popup Field:  B'},
                { id: 'testId3', lat: 0, lng: 2, category: 'c', hoverPopupField: 'Hover Popup Field:  C' },
                { id: 'testId4', lat: 0, lng: 3, category: 'd', hoverPopupField: 'Hover Popup Field:  D'}
            ],
            expected: [
                new MapPoint('testId1', ['testId1'], '0.000\u00b0, 0.000\u00b0', 0, 0, 1,
                    aColor, 'Count: 1', 'category', 'a', aHoverMap),
                new MapPoint('testId2', ['testId2'], '0.000\u00b0, 1.000\u00b0', 0, 1, 1,
                    bColor, 'Count: 1', 'category', 'b', bHoverMap),
                new MapPoint('testId3', ['testId3'], '0.000\u00b0, 2.000\u00b0', 0, 2, 1,
                    cColor, 'Count: 1', 'category', 'c', cHoverMap),
                new MapPoint('testId4', ['testId4'], '0.000\u00b0, 3.000\u00b0', 0, 3, 1,
                    dColor, 'Count: 1', 'category', 'd', dHoverMap)
            ]
        };
        let dataset3 = {
            data: [
                { id: 'testId1', lat: [0, 0, 0, 0], lng: [0, 0, 0, 0], category: 'a', hoverPopupField: 'Hover Popup Field:  A'},
                { id: 'testId2', lat: [0, 0, 0, 0], lng: [0, 0, 0, 0], category: 'b', hoverPopupField: 'Hover Popup Field:  B' }
            ],
            expected: [
                new MapPoint('testId1', ['testId1', 'testId1', 'testId1', 'testId1'], '0.000\u00b0, 0.000\u00b0', 0, 0, 4,
                    aColor, 'Count: 4', 'category', 'a', aHoverMap),
                new MapPoint('testId2', ['testId2', 'testId2', 'testId2', 'testId2'], '0.000\u00b0, 0.000\u00b0', 0, 0, 4,
                    bColor, 'Count: 4', 'category', 'b', bHoverMap)
            ]
        };
        let dataset4 = {
            data: [
                { id: 'testId1', lat: [0, 0, 0, 0], lng: [0, 1, 2, 3], category: 'a', hoverPopupField: 'Hover Popup Field:  A' },
                { id: 'testId2', lat: [0, 0, 0, 0], lng: [4, 5, 6, 7], category: 'b', hoverPopupField: 'Hover Popup Field:  B' }
            ],
            expected: [
                new MapPoint('testId1', ['testId1'], '0.000\u00b0, 3.000\u00b0', 0, 3, 1,
                    aColor, 'Count: 1', 'category', 'a', aHoverMap),
                new MapPoint('testId1', ['testId1'], '0.000\u00b0, 2.000\u00b0', 0, 2, 1,
                    aColor, 'Count: 1', 'category', 'a', aHoverMap),
                new MapPoint('testId1', ['testId1'], '0.000\u00b0, 1.000\u00b0', 0, 1, 1,
                    aColor, 'Count: 1', 'category', 'a', aHoverMap),
                new MapPoint('testId1', ['testId1'], '0.000\u00b0, 0.000\u00b0', 0, 0, 1,
                    aColor, 'Count: 1', 'category', 'a', aHoverMap),
                new MapPoint('testId2', ['testId2'], '0.000\u00b0, 7.000\u00b0', 0, 7, 1,
                    bColor, 'Count: 1', 'category', 'b', bHoverMap),
                new MapPoint('testId2', ['testId2'], '0.000\u00b0, 6.000\u00b0', 0, 6, 1,
                    bColor, 'Count: 1', 'category', 'b', bHoverMap),
                new MapPoint('testId2', ['testId2'], '0.000\u00b0, 5.000\u00b0', 0, 5, 1,
                    bColor, 'Count: 1', 'category', 'b', bHoverMap),
                new MapPoint('testId2', ['testId2'], '0.000\u00b0, 4.000\u00b0', 0, 4, 1,
                    bColor, 'Count: 1', 'category', 'b', bHoverMap)
            ]
        };

        let mapPoints1 = component.getMapPoints('myDatabase', 'myTable', 'id', 'lng', 'lat', 'category',
            new FieldMetaData('hoverPopupField', 'Hover Popup Field'), dataset1.data);
        expect(mapPoints1).toEqual(dataset1.expected);
        let mapPoints2 = component.getMapPoints(
            'myDatabase', 'myTable', 'id', 'lng', 'lat', 'category', new FieldMetaData(), dataset2.data);
        expect(mapPoints2).toEqual(dataset2.expected);
        let mapPoints3 = component.getMapPoints(
            'myDatabase', 'myTable', 'id', 'lng', 'lat', 'category', new FieldMetaData(), dataset3.data);
        expect(mapPoints3).toEqual(dataset3.expected);
        let mapPoints4 = component.getMapPoints(
            'myDatabase', 'myTable', 'id', 'lng', 'lat', 'category', new FieldMetaData(), dataset4.data);
        expect(mapPoints4).toEqual(dataset4.expected);
    });

    it('constructVisualization does call mapObject.initialize', () => {
        component.assignTestMap();
        let mapSpy = component.spyOnTestMap('initialize');
        component.constructVisualization();
        expect(mapSpy.calls.count()).toBe(1);
    });

    it('designEachFilterWithNoValues does return expected object', () => {
        expect((component as any).designEachFilterWithNoValues()).toEqual([]);

        updateMapLayer1(component);
        let actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(2);
        expect((actual[0].filterDesign as any).type).toEqual('and');
        expect((actual[0].filterDesign as any).filters.length).toEqual(4);
        expect((actual[0].filterDesign as any).filters[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[0].filterDesign as any).filters[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[0].filterDesign as any).filters[0].field).toEqual(DatasetServiceMock.Y_FIELD);
        expect((actual[0].filterDesign as any).filters[0].operator).toEqual('>=');
        expect((actual[0].filterDesign as any).filters[0].value).toBeUndefined();
        expect((actual[0].filterDesign as any).filters[1].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[0].filterDesign as any).filters[1].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[0].filterDesign as any).filters[1].field).toEqual(DatasetServiceMock.Y_FIELD);
        expect((actual[0].filterDesign as any).filters[1].operator).toEqual('<=');
        expect((actual[0].filterDesign as any).filters[1].value).toBeUndefined();
        expect((actual[0].filterDesign as any).filters[2].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[0].filterDesign as any).filters[2].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[0].filterDesign as any).filters[2].field).toEqual(DatasetServiceMock.X_FIELD);
        expect((actual[0].filterDesign as any).filters[2].operator).toEqual('>=');
        expect((actual[0].filterDesign as any).filters[2].value).toBeUndefined();
        expect((actual[0].filterDesign as any).filters[3].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[0].filterDesign as any).filters[3].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[0].filterDesign as any).filters[3].field).toEqual(DatasetServiceMock.X_FIELD);
        expect((actual[0].filterDesign as any).filters[3].operator).toEqual('<=');
        expect((actual[0].filterDesign as any).filters[3].value).toBeUndefined();
        expect(actual[0].redrawCallback.toString()).toEqual((component as any).redrawFilterBox.bind(component).toString());
        expect((actual[1].filterDesign as any).type).toEqual('and');
        expect((actual[1].filterDesign as any).filters.length).toEqual(2);
        expect((actual[1].filterDesign as any).filters[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[1].filterDesign as any).filters[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[1].filterDesign as any).filters[0].field).toEqual(DatasetServiceMock.Y_FIELD);
        expect((actual[1].filterDesign as any).filters[0].operator).toEqual('=');
        expect((actual[1].filterDesign as any).filters[0].value).toBeUndefined();
        expect((actual[1].filterDesign as any).filters[1].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[1].filterDesign as any).filters[1].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[1].filterDesign as any).filters[1].field).toEqual(DatasetServiceMock.X_FIELD);
        expect((actual[1].filterDesign as any).filters[1].operator).toEqual('=');
        expect((actual[1].filterDesign as any).filters[1].value).toBeUndefined();
        expect(actual[1].redrawCallback.toString()).toEqual((component as any).redrawFilterPoint.bind(component).toString());

        updateMapLayer2(component);
        actual = (component as any).designEachFilterWithNoValues();
        expect(actual.length).toEqual(4);
        expect((actual[0].filterDesign as any).type).toEqual('and');
        expect((actual[0].filterDesign as any).filters.length).toEqual(4);
        expect((actual[0].filterDesign as any).filters[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[0].filterDesign as any).filters[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[0].filterDesign as any).filters[0].field).toEqual(DatasetServiceMock.Y_FIELD);
        expect((actual[0].filterDesign as any).filters[0].operator).toEqual('>=');
        expect((actual[0].filterDesign as any).filters[0].value).toBeUndefined();
        expect((actual[0].filterDesign as any).filters[1].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[0].filterDesign as any).filters[1].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[0].filterDesign as any).filters[1].field).toEqual(DatasetServiceMock.Y_FIELD);
        expect((actual[0].filterDesign as any).filters[1].operator).toEqual('<=');
        expect((actual[0].filterDesign as any).filters[1].value).toBeUndefined();
        expect((actual[0].filterDesign as any).filters[2].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[0].filterDesign as any).filters[2].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[0].filterDesign as any).filters[2].field).toEqual(DatasetServiceMock.X_FIELD);
        expect((actual[0].filterDesign as any).filters[2].operator).toEqual('>=');
        expect((actual[0].filterDesign as any).filters[2].value).toBeUndefined();
        expect((actual[0].filterDesign as any).filters[3].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[0].filterDesign as any).filters[3].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[0].filterDesign as any).filters[3].field).toEqual(DatasetServiceMock.X_FIELD);
        expect((actual[0].filterDesign as any).filters[3].operator).toEqual('<=');
        expect((actual[0].filterDesign as any).filters[3].value).toBeUndefined();
        expect(actual[0].redrawCallback.toString()).toEqual((component as any).redrawFilterBox.bind(component).toString());
        expect((actual[1].filterDesign as any).type).toEqual('and');
        expect((actual[1].filterDesign as any).filters.length).toEqual(2);
        expect((actual[1].filterDesign as any).filters[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[1].filterDesign as any).filters[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[1].filterDesign as any).filters[0].field).toEqual(DatasetServiceMock.Y_FIELD);
        expect((actual[1].filterDesign as any).filters[0].operator).toEqual('=');
        expect((actual[1].filterDesign as any).filters[0].value).toBeUndefined();
        expect((actual[1].filterDesign as any).filters[1].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect((actual[1].filterDesign as any).filters[1].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect((actual[1].filterDesign as any).filters[1].field).toEqual(DatasetServiceMock.X_FIELD);
        expect((actual[1].filterDesign as any).filters[1].operator).toEqual('=');
        expect((actual[1].filterDesign as any).filters[1].value).toBeUndefined();
        expect(actual[1].redrawCallback.toString()).toEqual((component as any).redrawFilterPoint.bind(component).toString());
        expect((actual[2].filterDesign as any).type).toEqual('and');
        expect((actual[2].filterDesign as any).filters.length).toEqual(4);
        expect((actual[2].filterDesign as any).filters[0].database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect((actual[2].filterDesign as any).filters[0].table).toEqual(DatasetServiceMock.TABLES[1]);
        expect((actual[2].filterDesign as any).filters[0].field).toEqual(DatasetServiceMock.Y_FIELD);
        expect((actual[2].filterDesign as any).filters[0].operator).toEqual('>=');
        expect((actual[2].filterDesign as any).filters[0].value).toBeUndefined();
        expect((actual[2].filterDesign as any).filters[1].database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect((actual[2].filterDesign as any).filters[1].table).toEqual(DatasetServiceMock.TABLES[1]);
        expect((actual[2].filterDesign as any).filters[1].field).toEqual(DatasetServiceMock.Y_FIELD);
        expect((actual[2].filterDesign as any).filters[1].operator).toEqual('<=');
        expect((actual[2].filterDesign as any).filters[1].value).toBeUndefined();
        expect((actual[2].filterDesign as any).filters[2].database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect((actual[2].filterDesign as any).filters[2].table).toEqual(DatasetServiceMock.TABLES[1]);
        expect((actual[2].filterDesign as any).filters[2].field).toEqual(DatasetServiceMock.X_FIELD);
        expect((actual[2].filterDesign as any).filters[2].operator).toEqual('>=');
        expect((actual[2].filterDesign as any).filters[2].value).toBeUndefined();
        expect((actual[2].filterDesign as any).filters[3].database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect((actual[2].filterDesign as any).filters[3].table).toEqual(DatasetServiceMock.TABLES[1]);
        expect((actual[2].filterDesign as any).filters[3].field).toEqual(DatasetServiceMock.X_FIELD);
        expect((actual[2].filterDesign as any).filters[3].operator).toEqual('<=');
        expect((actual[2].filterDesign as any).filters[3].value).toBeUndefined();
        expect(actual[2].redrawCallback.toString()).toEqual((component as any).redrawFilterBox.bind(component).toString());
        expect((actual[3].filterDesign as any).type).toEqual('and');
        expect((actual[3].filterDesign as any).filters.length).toEqual(2);
        expect((actual[3].filterDesign as any).filters[0].database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect((actual[3].filterDesign as any).filters[0].table).toEqual(DatasetServiceMock.TABLES[1]);
        expect((actual[3].filterDesign as any).filters[0].field).toEqual(DatasetServiceMock.Y_FIELD);
        expect((actual[3].filterDesign as any).filters[0].operator).toEqual('=');
        expect((actual[3].filterDesign as any).filters[0].value).toBeUndefined();
        expect((actual[3].filterDesign as any).filters[1].database).toEqual(DatasetServiceMock.DATABASES[1]);
        expect((actual[3].filterDesign as any).filters[1].table).toEqual(DatasetServiceMock.TABLES[1]);
        expect((actual[3].filterDesign as any).filters[1].field).toEqual(DatasetServiceMock.X_FIELD);
        expect((actual[3].filterDesign as any).filters[1].operator).toEqual('=');
        expect((actual[3].filterDesign as any).filters[1].value).toBeUndefined();
        expect(actual[3].redrawCallback.toString()).toEqual((component as any).redrawFilterPoint.bind(component).toString());
    });

    it('filterByLocation does call exchangeFilters with filters on each layer', () => {
        let spy = spyOn(component, 'exchangeFilters');

        updateMapLayer1(component);

        let box1 = new BoundingBoxByDegrees(1, 2, 3, 4);
        component.filterByLocation(box1);

        expect(spy.calls.count()).toBe(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            type: 'and',
            inflexible: true,
            filters: [{
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.Y_FIELD,
                operator: '>=',
                value: 1
            }, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.Y_FIELD,
                operator: '<=',
                value: 2
            }, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '>=',
                value: 3
            }, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '<=',
                value: 4
            }]
        }]]);

        updateMapLayer2(component);

        let box2 = new BoundingBoxByDegrees(5, 6, 7, 8);
        component.filterByLocation(box2);

        expect(spy.calls.count()).toBe(2);
        expect(spy.calls.argsFor(1)).toEqual([[{
            type: 'and',
            inflexible: true,
            filters: [{
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.Y_FIELD,
                operator: '>=',
                value: 5
            }, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.Y_FIELD,
                operator: '<=',
                value: 6
            }, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '>=',
                value: 7
            }, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '<=',
                value: 8
            }]
        }, {
            type: 'and',
            inflexible: true,
            filters: [{
                datastore: '',
                database: DatasetServiceMock.DATABASES[1],
                table: DatasetServiceMock.TABLES[1],
                field: DatasetServiceMock.Y_FIELD,
                operator: '>=',
                value: 5
            }, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[1],
                table: DatasetServiceMock.TABLES[1],
                field: DatasetServiceMock.Y_FIELD,
                operator: '<=',
                value: 6
            }, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[1],
                table: DatasetServiceMock.TABLES[1],
                field: DatasetServiceMock.X_FIELD,
                operator: '>=',
                value: 7
            }, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[1],
                table: DatasetServiceMock.TABLES[1],
                field: DatasetServiceMock.X_FIELD,
                operator: '<=',
                value: 8
            }]
        }]]);
    });

    it('filterByMapPoint does call exchangeFilters with filters on each layer', () => {
        let spy = spyOn(component, 'exchangeFilters');

        updateMapLayer1(component);

        component.filterByMapPoint(1, 2);

        expect(spy.calls.count()).toBe(1);
        expect(spy.calls.argsFor(0)).toEqual([[{
            type: 'and',
            inflexible: true,
            filters: [{
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.Y_FIELD,
                operator: '=',
                value: 1
            }, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '=',
                value: 2
            }]
        }]]);

        updateMapLayer2(component);

        component.filterByMapPoint(3, 4);

        expect(spy.calls.count()).toBe(2);
        expect(spy.calls.argsFor(1)).toEqual([[{
            type: 'and',
            inflexible: true,
            filters: [{
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.Y_FIELD,
                operator: '=',
                value: 3
            }, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[0],
                table: DatasetServiceMock.TABLES[0],
                field: DatasetServiceMock.X_FIELD,
                operator: '=',
                value: 4
            }]
        }, {
            type: 'and',
            inflexible: true,
            filters: [{
                datastore: '',
                database: DatasetServiceMock.DATABASES[1],
                table: DatasetServiceMock.TABLES[1],
                field: DatasetServiceMock.Y_FIELD,
                operator: '=',
                value: 3
            }, {
                datastore: '',
                database: DatasetServiceMock.DATABASES[1],
                table: DatasetServiceMock.TABLES[1],
                field: DatasetServiceMock.X_FIELD,
                operator: '=',
                value: 4
            }]
        }]]);
    });

    it('destroyVisualization does call mapObject.destroy', () => {
        component.assignTestMap();
        let mapSpy = component.spyOnTestMap('destroy');
        component.destroyVisualization();
        expect(mapSpy.calls.count()).toBe(1);
    });

    it('postAddLayer does update filterVisible', () => {
        component.postAddLayer({
            _id: 'testId1'
        });

        expect(Array.from(component.filterVisible.keys())).toEqual([component.options.layers[0]._id, 'testId1']);
        expect(component.filterVisible.get(component.options.layers[0]._id)).toEqual(true);
        expect(component.filterVisible.get('testId1')).toEqual(true);

        component.postAddLayer({
            _id: 'testId2'
        });

        expect(Array.from(component.filterVisible.keys())).toEqual([component.options.layers[0]._id, 'testId1', 'testId2']);
        expect(component.filterVisible.get(component.options.layers[0]._id)).toEqual(true);
        expect(component.filterVisible.get('testId1')).toEqual(true);
        expect(component.filterVisible.get('testId2')).toEqual(true);
    });

    it('getElementRefs does return expected object', () => {
        let refs = component.getElementRefs();
        expect(refs.headerText).toBeDefined();
        expect(refs.infoText).toBeDefined();
        expect(refs.visualization).toBeDefined();
    });

    it('validateVisualizationQuery does return expected boolean', () => {
        expect(component.validateVisualizationQuery(component.options.layers[0])).toBe(false);

        updateMapLayer1(component);

        expect(component.validateVisualizationQuery(component.options.layers[0])).toBe(true);
    });

    it('finalizeVisualizationQuery does return expected object', () => {
        updateMapLayer1(component);

        component.options.limit = 5678;

        expect(component.finalizeVisualizationQuery(component.options.layers[0], {}, [])).toEqual({
            filter: {
                filters: [{
                    field: 'testYField',
                    operator: '!=',
                    value: null
                }, {
                    field: 'testXField',
                    operator: '!=',
                    value: null
                }],
                type: 'and'
            }
        });

        updateMapLayer2(component);

        expect(component.finalizeVisualizationQuery(component.options.layers[1], {}, [])).toEqual({
            filter: {
                filters: [{
                    field: 'testYField',
                    operator: '!=',
                    value: null
                }, {
                    field: 'testXField',
                    operator: '!=',
                    value: null
                }],
                type: 'and'
            }
        });
    });

    it('updateLegend does update colorKeys', () => {
        component.updateLegend();
        expect(component.colorKeys).toEqual([]);

        updateMapLayer1(component);
        component.updateLegend();
        expect(component.colorKeys).toEqual(['testDatabase1_testTable1_testTypeField']);

        updateMapLayer2(component);
        component.updateLegend();
        expect(component.colorKeys).toEqual(['testDatabase1_testTable1_testTypeField', 'testDatabase2_testTable2_testTypeField']);
    });

    it('convertToFloatIfString does parse float string', () => {
        expect(component.convertToFloatIfString(12.34)).toEqual(12.34);
        expect(component.convertToFloatIfString(-56.78)).toEqual(-56.78);

        expect(component.convertToFloatIfString('12.34')).toEqual(12.34);
        expect(component.convertToFloatIfString('-56.78')).toEqual(-56.78);

        expect(component.convertToFloatIfString(['12.34'])).toEqual([12.34]);
        expect(component.convertToFloatIfString(['12.34', 43.21, '-56.78', 87.65, '90'])).toEqual([12.34, 43.21, -56.78, 87.65, 90]);
    });

    it('addOrUpdateUniquePoint does update data in given map object', () => {
        // TODO
    });

    it('getClausesFromFilterWithIdenticalArguments', () => {
        // TODO
    });

    it('hasLayerFilterChanged does return expected boolean', () => {
        // TODO
    });

    it('handleChangeMapType does change and redraw map', () => {
        // TODO
    });

    it('redrawFilterBox with no filter arguments does remove old filter box', () => {
        component.assignTestMap();
        let mapSpy = component.spyOnTestMap('removeFilterBox');
        (component as any).redrawFilterBox([]);
        expect(mapSpy.calls.count()).toEqual(1);
    });

    it('redrawFilterBox with filter arguments does draw one new filter box', () => {
        // TODO THOR-1103
    });

    it('redrawFilterBox with multiple filter arguments does draw multiple new filter boxes', () => {
        // TODO THOR-1102
    });

    it('redrawFilterBox with filter arguments does draw new filter boxes and remove old filter boxes', () => {
        // TODO THOR-1102
    });

    it('redrawFilterPoint with no filter arguments does remove old points', () => {
        // TODO THOR-1104
    });

    it('redrawFilterPoint with filter arguments does draw new points', () => {
        // TODO THOR-1104
    });

    it('toggleFilter does update filterVisible', () => {
        component.toggleFilter(component.options.layers[0]);
        expect(component.filterVisible.get(component.options.layers[0]._id)).toEqual(false);
        component.toggleFilter(component.options.layers[0]);
        expect(component.filterVisible.get(component.options.layers[0]._id)).toEqual(true);
    });

    it('getIconForFilter does return expected string', () => {
        component.filterVisible.set('testId1', true);
        expect(component.getIconForFilter({
            _id: 'testId1'
        })).toBe('keyboard_arrow_up');
        component.filterVisible.set('testId1', false);
        expect(component.getIconForFilter({
            _id: 'testId1'
        })).toBe('keyboard_arrow_down');
        component.filterVisible.set('testId2', true);
        expect(component.getIconForFilter({
        _id: 'testId2'
        })).toBe('keyboard_arrow_up');
        component.filterVisible.set('testId1', true);
        component.filterVisible.set('testId2', false);
        expect(component.getIconForFilter({
        _id: 'testId2'
        })).toBe('keyboard_arrow_down');
    });

    it('onResizeStop does call mapObject.sizeChanged', () => {
        component.assignTestMap();
        let mapSpy = component.spyOnTestMap('sizeChanged');
        component.onResizeStop();
        expect(mapSpy.calls.count()).toBe(1);
    });
});

describe('Component: Map with config', () => {
    let component: TestMapComponent;
    let fixture: ComponentFixture<TestMapComponent>;

    initializeTestBed('Map', {
        declarations: [
            TestMapComponent,
            LegendComponent
        ],
        providers: [
            { provide: DatasetService, useClass: DatasetServiceMock },
            FilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            Injector,
            { provide: AbstractWidgetService, useClass: WidgetService },
            { provide: 'config', useValue: new NeonGTDConfig() },
            { provide: 'tableKey', useValue: 'table_key_1' },
            {
                provide: 'layers', useValue: [{
                    colorField: 'testColorField',
                    hoverPopupField: 'testHoverField',
                    dateField: 'testDateField',
                    latitudeField: 'testLatitudeField',
                    longitudeField: 'testLongitudeField',
                    sizeField: 'testSizeField',
                    title: 'Test Layer Title'
                }]
            },
            { provide: 'limit', useValue: 9999 },
            { provide: 'clusterPixelRange', useValue: 20 },
            { provide: 'customServer', useValue: { mapUrl: 'testUrl', layer: 'testLayer' } },
            { provide: 'disableCtrlZoom', useValue: true },
            { provide: 'hoverSelect', useValue: { hoverTime: 5 } },
            { provide: 'minClusterSize', useValue: 10 },
            { provide: 'singleColor', useValue: true },
            { provide: 'west', useValue: 1 },
            { provide: 'east', useValue: 2 },
            { provide: 'south', useValue: 3 },
            { provide: 'north', useValue: 4 },
            { provide: 'title', useValue: 'Test Title' }
        ],
        imports: [
            AppMaterialModule,
            FormsModule,
            BrowserAnimationsModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestMapComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('does have expected options', () => {
        expect(component.options.clusterPixelRange).toEqual(20);
        expect(component.options.customServer).toEqual({
            mapUrl: 'testUrl',
            layer: 'testLayer'
        });
        expect(component.options.disableCtrlZoom).toEqual(true);
        expect(component.options.hoverSelect).toEqual({
            hoverTime: 5
        });
        expect(component.options.limit).toEqual(9999);
        expect(component.options.minClusterSize).toEqual(10);
        expect(component.options.singleColor).toEqual(true);
        expect(component.options.title).toEqual('Test Title');
        expect(component.options.type).toEqual(MapType.Leaflet);

        expect(component.options.west).toEqual(1);
        expect(component.options.east).toEqual(2);
        expect(component.options.south).toEqual(3);
        expect(component.options.north).toEqual(4);
    });

    it('does have expected layers', () => {
        expect(component.options.layers[0].databases).toEqual(DatasetServiceMock.DATABASES);
        expect(component.options.layers[0].database).toEqual(DatasetServiceMock.DATABASES[0]);
        expect(component.options.layers[0].tables).toEqual(DatasetServiceMock.TABLES);
        expect(component.options.layers[0].table).toEqual(DatasetServiceMock.TABLES[0]);
        expect(component.options.layers[0].fields).toEqual(DatasetServiceMock.FIELDS);
        expect(component.options.layers[0].title).toEqual('Test Layer Title');
    });
});
