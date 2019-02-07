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
import { ExportControlComponent } from '../export-control/export-control.component';

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
import { TransformedVisualizationData } from '../base-neon-component/base-neon.component';
import { WidgetOptionCollection } from '../../widget-option';

import * as neon from 'neon-framework';

import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { FilterServiceMock } from '../../../testUtils/MockServices/FilterServiceMock';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';
import { SearchServiceMock } from '../../../testUtils/MockServices/SearchServiceMock';

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
        ref: ChangeDetectorRef
    ) {
        super(
            datasetService,
            filterService,
            searchService,
            injector,
            widgetService,
            ref
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

    getFilterBoundingBox() {
        return this.filterBoundingBox;
    }

    getFilters() {
        return this.filters;
    }

    getInjector(): Injector {
        return this.injector;
    }

    getMapPoints(databaseName: string, tableName: string, idField: string, lngField: string, latField: string, colorField: string,
        hoverPopupField: FieldMetaData, data: any[]
    ) {
        return super.getMapPoints(databaseName, tableName, idField, lngField, latField, colorField, hoverPopupField, data);
    }

    setFilterBoundingBox(box: BoundingBoxByDegrees) {
        this.filterBoundingBox = box;
    }

    spyOnTestMap(functionName: string) {
        return spyOn(this.mapObject, functionName);
    }
}

/* tslint:disable:component-class-suffix */
class TestMap extends AbstractMap {
    addPoints(points: MapPoint[], layer?: any, cluster?: boolean) {
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
    (component as any).layerIdToActiveData.set('testLayer1', new TransformedVisualizationData([{}]));
    (component as any).layerIdToElementCount.set('testLayer1', 1);

    component.options.layers[0] = new WidgetOptionCollection(undefined, {});
    component.options.layers[0]._id = 'testLayer1';
    component.options.layers[0].databases = [];
    component.options.layers[0].database = new DatabaseMetaData('testDatabase1');
    component.options.layers[0].fields = [];
    component.options.layers[0].tables = [];
    component.options.layers[0].table = new TableMetaData('testTable1');
    component.options.layers[0].title = 'Layer A';
    component.options.layers[0].unsharedFilterField = new FieldMetaData();
    component.options.layers[0].unsharedFilterValue = '';

    component.options.layers[0].idField = new FieldMetaData('testId1', 'Test ID 1');
    component.options.layers[0].colorField = new FieldMetaData('testColor1', 'Test Color 1');
    component.options.layers[0].hoverPopupField = new FieldMetaData('testHover1', 'Test Hover 1');
    component.options.layers[0].dateField = new FieldMetaData('testDate1', 'Test Date 1');
    component.options.layers[0].latitudeField = new FieldMetaData('testLatitude1', 'Test Latitude 1');
    component.options.layers[0].longitudeField = new FieldMetaData('testLongitude1', 'Test Longitude 1');
    component.options.layers[0].sizeField = new FieldMetaData('testSize1', 'Test Size 1');
}

function updateMapLayer2(component: TestMapComponent) {
    component.filterVisible.set('testLayer2', true);
    (component as any).layerIdToActiveData.set('testLayer2', new TransformedVisualizationData([{}, {}, {}, {}, {}, {}, {}, {}, {}, {}]));
    (component as any).layerIdToElementCount.set('testLayer2', 10);

    component.options.layers[1] = new WidgetOptionCollection(undefined, {});
    component.options.layers[1]._id = 'testLayer2';
    component.options.layers[1].databases = [];
    component.options.layers[1].database = new DatabaseMetaData('testDatabase2');
    component.options.layers[1].fields = [];
    component.options.layers[1].tables = [];
    component.options.layers[1].table = new TableMetaData('testTable2');
    component.options.layers[1].title = 'Layer B';
    component.options.layers[1].unsharedFilterField = new FieldMetaData();
    component.options.layers[1].unsharedFilterValue = '';

    component.options.layers[1].idField = new FieldMetaData('testId2', 'Test ID 2');
    component.options.layers[1].colorField = new FieldMetaData('testColor2', 'Test Color 2');
    component.options.layers[1].hoverPopupField = new FieldMetaData('testHover2', 'Test Hover 2');
    component.options.layers[1].dateField = new FieldMetaData('testDate2', 'Test Date 2');
    component.options.layers[1].latitudeField = new FieldMetaData('testLatitude2', 'Test Latitude 2');
    component.options.layers[1].longitudeField = new FieldMetaData('testLongitude2', 'Test Longitude 2');
    component.options.layers[1].sizeField = new FieldMetaData('testSize2', 'Test Size 2');
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
            LegendComponent,
            ExportControlComponent
        ],
        providers: [
            DatasetService,
            { provide: FilterService, useClass: FilterServiceMock },
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

    it('should create an instance', () => {
        expect(component).toBeTruthy();
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

    it('should filter by bounding box', () => {
        let box = new BoundingBoxByDegrees(10, 0, 0, 10),
            dbName = 'testDB',
            tableName = 'testTable',
            latName = 'lat',
            lngName = 'lng';

        addFilter(box, dbName, tableName, latName, lngName);

        let whereClauses = component.createNeonBoxFilter(box, latName, lngName),
            filterClauses = [
                neon.query.where(latName, '>=', box.south),
                neon.query.where(latName, '<=', box.north),
                neon.query.where(lngName, '>=', box.west),
                neon.query.where(lngName, '<=', box.east)
            ],
            expected = neon.query.and.apply(neon.query, filterClauses);

        expect(whereClauses).toEqual(expected);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('should remove filter when clicked', () => {
        let box = new BoundingBoxByDegrees(10, 0, 0, 10),
            dbName = 'testDB',
            tableName = 'testTable',
            latName = 'lat',
            lngName = 'lng';

        addFilter(box, dbName, tableName, latName, lngName);

        let xEl = getDebug('.filter-reset .mat-icon-button');
        xEl.triggerEventHandler('click', null);
        expect(getService(FilterService).getFilters().length).toBe(0);

        getService(FilterService).removeFilters(null, getService(FilterService).getFilters().map((filter) => {
            return filter.id;
        }));
    });

    it('constructVisualization does call mapObject.initialize', () => {
        component.assignTestMap();
        let mapSpy = component.spyOnTestMap('initialize');
        component.constructVisualization();
        expect(mapSpy.calls.count()).toBe(1);
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

    it('filterByLocation does set filterBoundingBox and does call addNeonFilter on each layer', () => {
        let spy = spyOn(component, 'addNeonFilter');

        updateMapLayer1(component);

        let box1 = new BoundingBoxByDegrees(1, 2, 3, 4);
        component.filterByLocation(box1);

        expect(component.getFilterBoundingBox()).toEqual(box1);
        expect(spy.calls.count()).toBe(1);
        expect(spy.calls.argsFor(0)).toEqual([component.options.layers[0], true, {
            id: undefined,
            fieldsByLayer: [{
                latitude: 'testLatitude1',
                longitude: 'testLongitude1',
                prettyLatitude: 'Test Latitude 1',
                prettyLongitude: 'Test Longitude 1'
            }],
            filterName: 'Test Latitude 1 from 1 to 2 and Test Longitude 1 from 3 to 4'
        }, neon.query.and.apply(neon.query, [
            neon.query.where('testLatitude1', '>=', 1),
            neon.query.where('testLatitude1', '<=', 2),
            neon.query.where('testLongitude1', '>=', 3),
            neon.query.where('testLongitude1', '<=', 4)
        ])]);

        updateMapLayer2(component);

        let box2 = new BoundingBoxByDegrees(5, 6, 7, 8);
        component.filterByLocation(box2);

        expect(component.getFilterBoundingBox()).toEqual(box2);
        expect(spy.calls.count()).toBe(3);
        expect(spy.calls.argsFor(1)).toEqual([component.options.layers[0], true, {
            id: undefined,
            fieldsByLayer: [{
                latitude: 'testLatitude1',
                longitude: 'testLongitude1',
                prettyLatitude: 'Test Latitude 1',
                prettyLongitude: 'Test Longitude 1'
            }, {
                latitude: 'testLatitude2',
                longitude: 'testLongitude2',
                prettyLatitude: 'Test Latitude 2',
                prettyLongitude: 'Test Longitude 2'
            }],
            filterName: 'latitude from 5 to 6 and longitude from 7 to 8'
        }, neon.query.and.apply(neon.query, [
            neon.query.where('testLatitude1', '>=', 5),
            neon.query.where('testLatitude1', '<=', 6),
            neon.query.where('testLongitude1', '>=', 7),
            neon.query.where('testLongitude1', '<=', 8)
        ])]);
        expect(spy.calls.argsFor(2)).toEqual([component.options.layers[1], true, {
            id: undefined,
            fieldsByLayer: [{
                latitude: 'testLatitude1',
                longitude: 'testLongitude1',
                prettyLatitude: 'Test Latitude 1',
                prettyLongitude: 'Test Longitude 1'
            }, {
                latitude: 'testLatitude2',
                longitude: 'testLongitude2',
                prettyLatitude: 'Test Latitude 2',
                prettyLongitude: 'Test Longitude 2'
            }],
            filterName: 'latitude from 5 to 6 and longitude from 7 to 8'
        }, neon.query.and.apply(neon.query, [
            neon.query.where('testLatitude2', '>=', 5),
            neon.query.where('testLatitude2', '<=', 6),
            neon.query.where('testLongitude2', '>=', 7),
            neon.query.where('testLongitude2', '<=', 8)
        ])]);
    });

    it('createFilter does return expected object', () => {
        expect(component.createFilter([1], 'a')).toEqual({
            id: undefined,
            fieldsByLayer: [1],
            filterName: 'a'
        });
        expect(component.createFilter([2, 3], 'b')).toEqual({
            id: undefined,
            fieldsByLayer: [2, 3],
            filterName: 'b'
        });
    });

    it('addLocalFilter does update filters', () => {
        component.addLocalFilter({
            id: 'testId1',
            fieldsByLayer: {
                latitude: 'testLatitude1',
                longitude: 'testLongitude1',
                prettyLatitude: 'Test Latitude 1',
                prettyLongitude: 'Test Longitude 1'
            },
            filterName: 'testFilter1'
        });
        expect(component.getFilters()).toEqual([{
            id: 'testId1',
            fieldsByLayer: {
                latitude: 'testLatitude1',
                longitude: 'testLongitude1',
                prettyLatitude: 'Test Latitude 1',
                prettyLongitude: 'Test Longitude 1'
            },
            filterName: 'testFilter1'
        }]);
    });

    it('createNeonBoxFilter does return expected object', () => {
        let box1 = new BoundingBoxByDegrees(1, 2, 3, 4);

        let query1 = neon.query.and.apply(neon.query, [
            neon.query.where('testLatitude1', '>=', 1),
            neon.query.where('testLatitude1', '<=', 2),
            neon.query.where('testLongitude1', '>=', 3),
            neon.query.where('testLongitude1', '<=', 4)
        ]);

        expect(component.createNeonBoxFilter(box1, 'testLatitude1', 'testLongitude1')).toEqual(query1);

        let box2 = new BoundingBoxByDegrees(5, 6, 7, 8);

        let query2 = neon.query.and.apply(neon.query, [
            neon.query.where('testLatitude1', '>=', 5),
            neon.query.where('testLatitude1', '<=', 6),
            neon.query.where('testLongitude1', '>=', 7),
            neon.query.where('testLongitude1', '<=', 8)
        ]);

        expect(component.createNeonBoxFilter(box2, 'testLatitude1', 'testLongitude1')).toEqual(query2);
    });

    it('getFilterText does return expected string', () => {
        expect(component.getFilterText({})).toEqual('');
        expect(component.getFilterText({
            filterName: 'testFilter'
        })).toEqual('testFilter');
    });

    it('getFilterTextByFields does return expected string', () => {
        expect(component.getFilterTextByFields(new BoundingBoxByDegrees(1, 2, 3, 4), [{
            prettyLatitude: 'filterLatitude',
            prettyLongitude: 'filterLongitude'
        }])).toEqual('filterLatitude from 1 to 2 and filterLongitude from 3 to 4');

        expect(component.getFilterTextByFields(new BoundingBoxByDegrees(1, 2, 3, 4), [{
            prettyLatitude: 'filterLatitude1',
            prettyLongitude: 'filterLongitude1'
        }, {
            prettyLatitude: 'filterLatitude2',
            prettyLongitude: 'filterLongitude2'
        }])).toEqual('latitude from 1 to 2 and longitude from 3 to 4');
    });

    it('getFilterTextForLayer does return expected string', () => {
        expect(component.getFilterTextForLayer(new BoundingBoxByDegrees(1, 2, 3, 4), {
            prettyLatitude: 'filterLatitude',
            prettyLongitude: 'filterLongitude'
        })).toEqual('filterLatitude from 1 to 2 and filterLongitude from 3 to 4');
    });

    it('getFiltersToIgnore does return null', () => {
        expect(component.getFiltersToIgnore()).toEqual(null);
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
                    field: 'testLatitude1',
                    operator: '!=',
                    value: null
                }, {
                    field: 'testLongitude1',
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
                    field: 'testLatitude2',
                    operator: '!=',
                    value: null
                }, {
                    field: 'testLongitude2',
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
        expect(component.colorKeys).toEqual(['testDatabase1_testTable1_testColor1']);

        updateMapLayer2(component);
        component.updateLegend();
        expect(component.colorKeys).toEqual(['testDatabase1_testTable1_testColor1', 'testDatabase2_testTable2_testColor2']);
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

    it('doesLayerStillHaveFilter does return expected boolean', () => {
        updateMapLayer1(component);
        expect(component.doesLayerStillHaveFilter(component.options.layers[0])).toBe(false);

        getService(FilterService).addFilter(null, 'testName', 'testDatabase1', 'testTable1', neon.query.and.apply(neon.query, [
            neon.query.where('testLatitude1', '!=', null), neon.query.where('testLongitude1', '!=', null)]), 'testFilterName1');
        expect(component.doesLayerStillHaveFilter(component.options.layers[0])).toBe(true);

        updateMapLayer2(component);
        expect(component.doesLayerStillHaveFilter(component.options.layers[1])).toBe(false);

        getService(FilterService).removeFilter(null, getService(FilterService).getLatestFilterId());
        expect(component.doesLayerStillHaveFilter(component.options.layers[0])).toBe(false);
    });

    it('getClausesFromFilterWithIdenticalArguments', () => {
        // TODO
    });

    it('hasLayerFilterChanged does return expected boolean', () => {
        // TODO
    });

    it('setupFilters', () => {
        // TODO
    });

    it('handleChangeMapType does change and redraw map', () => {
        // TODO
    });

    it('getCloseableFilters does return expected array', () => {
        expect(component.getCloseableFilters()).toEqual([]);
        component.addLocalFilter([{
            id: 'testId1',
            fieldsByLayer: {
                latitude: 'testLatitude1',
                longitude: 'testLongitude1',
                prettyLatitude: 'Test Latitude 1',
                prettyLongitude: 'Test Longitude 1'
            },
            filterName: 'testFilter1'
        }]);
        expect(component.getCloseableFilters()).toEqual([[{
            id: 'testId1',
            fieldsByLayer: {
                latitude: 'testLatitude1',
                longitude: 'testLongitude1',
                prettyLatitude: 'Test Latitude 1',
                prettyLongitude: 'Test Longitude 1'
            },
            filterName: 'testFilter1'
        }]]);
    });

    it('removeFilter does delete filterBoundingBox and call mapObject.removeFilterBox', () => {
        component.assignTestMap();
        let mapSpy = component.spyOnTestMap('removeFilterBox');

        let box1 = new BoundingBoxByDegrees(1, 2, 3, 4);
        component.setFilterBoundingBox(box1);

        component.removeFilter();
        expect(component.getFilterBoundingBox()).toBeUndefined();
        expect(mapSpy.calls.count()).toBe(1);
    });

    it('handleRemoveFilter does call removeFilter', () => {
        let spy1 = spyOn(component, 'removeLocalFilterFromLocalAndNeon');
        let spy2 = spyOn(component, 'removeFilter');

        updateMapLayer1(component);

        component.handleRemoveFilter({
            id: 'testId1'
        });

        expect(spy1.calls.count()).toBe(1);
        expect(spy1.calls.argsFor(0)).toEqual([component.options.layers[0], {
            id: 'testId1'
        }, true, false]);
        expect(spy2.calls.count()).toBe(1);

        updateMapLayer2(component);

        component.handleRemoveFilter({
            id: 'testId2'
        });

        expect(spy1.calls.count()).toBe(3);
        expect(spy1.calls.argsFor(1)).toEqual([component.options.layers[0], {
            id: 'testId2'
        }, true, false]);
        expect(spy1.calls.argsFor(2)).toEqual([component.options.layers[1], {
            id: 'testId2'
        }, true, false]);
        expect(spy2.calls.count()).toBe(2);
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
            LegendComponent,
            ExportControlComponent
        ],
        providers: [
            { provide: DatasetService, useClass: DatasetServiceMock },
            { provide: FilterService, useClass: FilterServiceMock },
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            Injector,
            { provide: AbstractWidgetService, useClass: WidgetService },
            { provide: 'config', useValue: new NeonGTDConfig() },
            { provide: 'database', useValue: 'testDatabase1' },
            { provide: 'table', useValue: 'testTable1' },
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
