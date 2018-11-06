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

import { MapComponent, MapLayer } from './map.component';
import { LegendComponent } from '../legend/legend.component';
import { ExportControlComponent } from '../export-control/export-control.component';
import { ExportService } from '../../services/export.service';
import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { TranslationService } from '../../services/translation.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { ColorSchemeService } from '../../services/color-scheme.service';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '../../app.material.module';
import { VisualizationService } from '../../services/visualization.service';
import { By } from '@angular/platform-browser';
import { AbstractMap, BoundingBoxByDegrees, MapPoint, MapType } from './map.type.abstract';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import * as neon from 'neon-framework';
import { DatasetServiceMock } from '../../../testUtils/MockServices/DatasetServiceMock';
import { FilterServiceMock } from '../../../testUtils/MockServices/FilterServiceMock';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

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
        activeGridService: ActiveGridService,
        connectionService: ConnectionService,
        datasetService: DatasetService,
        filterService: FilterService,
        exportService: ExportService,
        injector: Injector,
        themesService: ThemesService,
        colorSchemeSrv: ColorSchemeService,
        ref: ChangeDetectorRef,
        visualizationService: VisualizationService
    ) {
        super(
            activeGridService,
            connectionService,
            datasetService,
            filterService,
            exportService,
            injector,
            themesService,
            colorSchemeSrv,
            ref,
            visualizationService);
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

    getMapPoints(idField: string, lngField: string, latField: string, colorField: string, hoverPopupField: string, data: any[]) {
        return super.getMapPoints(idField, lngField, latField, colorField, hoverPopupField, data);
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
    addPoints(points: MapPoint[], layer?: MapLayer, cluster?: boolean) {
        /* NO-OP */
    }
    clearLayer(layer: MapLayer) {
        /* NO-OP */
    }
    destroy() {
        /* NO-OP */
    }
    doCustomInitialization(mapContainer: ElementRef) {
        /* NO-OP */
    }
    hidePoints(layer: MapLayer, value: string) {
        /* NO-OP */
    }
    makeSelectionInexact() {
        /* NO-OP */
    }
    removeFilterBox() {
        /* NO-OP */
    }
    unhidePoints(layer: MapLayer, value: string) {
        /* NO-OP */
    }
    unhideAllPoints(layer: MapLayer) {
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
    component.docCount[0] = 1234;

    component.options.layers[0] = new MapLayer({}, component.getInjector(), component.getDatasetService());
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
    component.docCount[1] = 5678;

    component.options.layers[1] = new MapLayer({}, component.getInjector(), component.getDatasetService());
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

    initializeTestBed({
        declarations: [
            TestMapComponent,
            LegendComponent,
            ExportControlComponent
        ],
        providers: [
            ActiveGridService,
            ConnectionService,
            DatasetService,
            { provide: FilterService, useClass: FilterServiceMock },
            ExportService,
            TranslationService,
            ErrorNotificationService,
            VisualizationService,
            ThemesService,
            Injector,
            ColorSchemeService,
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
        expect(component.options.clustering).toEqual('points');
        expect(component.options.clusterPixelRange).toEqual(15);
        expect(component.options.customServer).toEqual(null);
        expect(component.options.disableCtrlZoom).toEqual(false);
        expect(component.options.hoverPopupEnabled).toEqual(false);
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
        expect(component.colorByFields).toEqual([]);
        expect(component.disabledSet).toEqual([]);
        expect(component.docCount).toEqual([0]);
        expect(component.filterVisible).toEqual([true]);
    });

    it('does have expected layers', () => {
        expect(component.options.layers[0].databases).toEqual([]);
        expect(component.options.layers[0].database).toEqual(new DatabaseMetaData());
        expect(component.options.layers[0].tables).toEqual([]);
        expect(component.options.layers[0].table).toEqual(new TableMetaData());
        expect(component.options.layers[0].fields).toEqual([]);
        expect(component.options.layers[0].title).toEqual('New Layer');
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

    it('should change map type to Cesium', () => {
        if (webgl_support()) {
            component.handleChangeMapType(MapType.Cesium);
            let mapElement = getDebug('.leaflet-container'),
                el = mapElement && mapElement.nativeElement,
                cesium = el && el.firstChild;
            expect(cesium).toBeTruthy('MapElement should have at least 1 child');
            expect(cesium.className).toBe('cesium-viewer', 'Failed to create cesium map');
        }
    });

    it('should create uncollapsed map points, largest first', () => {

        //define maps for all test cases
        let aHoverMap1 = new Map<string, number>().set('a', 1),
            bHoverMap1 = new Map<string, number>().set('b', 1),
            cHoverMap1 = new Map<string, number>().set('c', 1),
            dHoverMap1 = new Map<string, number>().set('d', 1);

        let colorService = getService(ColorSchemeService),
            datasets = [
                {
                    data: [
                        { id: 'testId1', lat: 0, lng: 0, category: 'a', aHoverMap1 },
                        { id: 'testId2', lat: 0, lng: 0, category: 'b', bHoverMap1 },
                        { id: 'testId3', lat: 0, lng: 0, category: 'c', cHoverMap1 },
                        { id: 'testId4', lat: 0, lng: 0, category: 'd', dHoverMap1 },
                        { id: 'testId5', lat: 0, lng: 0, category: 'd', dHoverMap1 }
                    ],
                    expected: [
                        new MapPoint(
                            'testId4', ['testId4', 'testId5'], '0.000\u00b0, 0.000\u00b0', 0, 0, 2,
                            colorService.getColorFor('category', 'd').toRgb(), 'Count: 2',
                            'category', 'd', dHoverMap1
                        ),
                        new MapPoint(
                            'testId1', ['testId1'], '0.000\u00b0, 0.000\u00b0', 0, 0, 1,
                            colorService.getColorFor('category', 'a').toRgb(), 'Count: 1',
                            'category', 'a', aHoverMap1
                        ),
                        new MapPoint(
                            'testId2', ['testId2'], '0.000\u00b0, 0.000\u00b0', 0, 0, 1,
                            colorService.getColorFor('category', 'b').toRgb(), 'Count: 1',
                            'category', 'b', bHoverMap1
                        ),
                        new MapPoint(
                            'testId3', ['testId3'], '0.000\u00b0, 0.000\u00b0', 0, 0, 1,
                            colorService.getColorFor('category', 'c').toRgb(), 'Count: 1',
                            'category', 'c', cHoverMap1
                        )
                    ]
                },
                {
                    data: [
                        { id: 'testId1', lat: 0, lng: 0, category: 'a', aHoverMap1 },
                        { id: 'testId2', lat: 0, lng: 1, category: 'b', bHoverMap1 },
                        { id: 'testId3', lat: 0, lng: 2, category: 'c', cHoverMap1 },
                        { id: 'testId4', lat: 0, lng: 3, category: 'd', dHoverMap1 }
                    ],
                    expected: [
                        new MapPoint(
                            'testId1', ['testId1'], '0.000\u00b0, 0.000\u00b0', 0, 0, 1,
                            colorService.getColorFor('category', 'a').toRgb(), 'Count: 1',
                            'category', 'a', aHoverMap1
                        ),
                        new MapPoint(
                            'testId2', ['testId2'], '0.000\u00b0, 1.000\u00b0', 0, 1, 1,
                            colorService.getColorFor('category', 'b').toRgb(), 'Count: 1',
                            'category', 'b', bHoverMap1
                        ),
                        new MapPoint(
                            'testId3', ['testId3'], '0.000\u00b0, 2.000\u00b0', 0, 2, 1,
                            colorService.getColorFor('category', 'c').toRgb(), 'Count: 1',
                            'category', 'c', cHoverMap1
                        ),
                        new MapPoint(
                            'testId4', ['testId4'], '0.000\u00b0, 3.000\u00b0', 0, 3, 1,
                            colorService.getColorFor('category', 'd').toRgb(), 'Count: 1',
                            'category', 'd', dHoverMap1
                        )
                    ]
                },
                {
                    data: [
                        { id: 'testId1', lat: [0, 0, 0, 0], lng: [0, 0, 0, 0], category: 'a', aHoverMap1 },
                        { id: 'testId2', lat: [0, 0, 0, 0], lng: [0, 0, 0, 0], category: 'b', bHoverMap1 }
                    ],
                    expected: [
                        new MapPoint(
                            'testId1', ['testId1', 'testId1', 'testId1', 'testId1'], '0.000\u00b0, 0.000\u00b0', 0, 0, 4,
                            colorService.getColorFor('category', 'a').toRgb(), 'Count: 4',
                            'category', 'a', aHoverMap1
                        ),
                        new MapPoint(
                            'testId2', ['testId2', 'testId2', 'testId2', 'testId2'], '0.000\u00b0, 0.000\u00b0', 0, 0, 4,
                            colorService.getColorFor('category', 'b').toRgb(), 'Count: 4',
                            'category', 'b', bHoverMap1
                        )
                    ]
                },
                {
                    data: [
                        { id: 'testId1', lat: [0, 0, 0, 0], lng: [0, 1, 2, 3], category: 'a', aHoverMap1},
                        { id: 'testId2', lat: [0, 0, 0, 0], lng: [4, 5, 6, 7], category: 'b', bHoverMap1 }
                    ],
                    expected: [
                        new MapPoint(
                            'testId1', ['testId1'], '0.000\u00b0, 3.000\u00b0', 0, 3, 1,
                            colorService.getColorFor('category', 'a').toRgb(), 'Count: 1',
                            'category', 'a', aHoverMap1
                        ),
                        new MapPoint(
                            'testId1', ['testId1'], '0.000\u00b0, 2.000\u00b0', 0, 2, 1,
                            colorService.getColorFor('category', 'a').toRgb(), 'Count: 1',
                            'category', 'a', aHoverMap1
                        ),
                        new MapPoint(
                            'testId1', ['testId1'], '0.000\u00b0, 1.000\u00b0', 0, 1, 1,
                            colorService.getColorFor('category', 'a').toRgb(), 'Count: 1',
                            'category', 'a', aHoverMap1
                        ),
                        new MapPoint(
                            'testId1', ['testId1'], '0.000\u00b0, 0.000\u00b0', 0, 0, 1,
                            colorService.getColorFor('category', 'a').toRgb(), 'Count: 1',
                            'category', 'a', aHoverMap1
                        ),
                        new MapPoint(
                            'testId2', ['testId2'], '0.000\u00b0, 7.000\u00b0', 0, 7, 1,
                            colorService.getColorFor('category', 'b').toRgb(), 'Count: 1',
                            'category', 'b', bHoverMap1
                        ),
                        new MapPoint(
                            'testId2', ['testId2'], '0.000\u00b0, 6.000\u00b0', 0, 6, 1,
                            colorService.getColorFor('category', 'b').toRgb(), 'Count: 1',
                            'category', 'b', bHoverMap1
                        ),
                        new MapPoint(
                            'testId2', ['testId2'], '0.000\u00b0, 5.000\u00b0', 0, 5, 1,
                            colorService.getColorFor('category', 'b').toRgb(), 'Count: 1',
                            'category', 'b', bHoverMap1
                        ),
                        new MapPoint(
                            'testId2', ['testId2'], '0.000\u00b0, 4.000\u00b0', 0, 4, 1,
                            colorService.getColorFor('category', 'b').toRgb(), 'Count: 1',
                            'category', 'b', bHoverMap1
                        )
                    ]
                }
            ];

        for (let dataset of datasets) {
            let mapPoints = component.getMapPoints('id', 'lng', 'lat', 'category', 'hoverPopupField', dataset.data);
            expect(mapPoints).toEqual(dataset.expected);
        }
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

    it('should add layer when new layer button is clicked', () => {
        let addEl = getDebug('a');
        addEl.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.options.layers.length).toBe(2);
    });

    it('subRemoveLayer does remove the layer at the given index and does call handleChangeData', () => {
        updateMapLayer1(component);
        updateMapLayer2(component);

        let spy = spyOn(component, 'handleChangeData');

        component.subRemoveLayer(1);

        expect(component.options.layers[0].title).toEqual('Layer A');
        expect(component.options.layers[0].idField).toEqual(new FieldMetaData('testId1', 'Test ID 1'));
        expect(component.options.layers[0].colorField).toEqual(new FieldMetaData('testColor1', 'Test Color 1'));
        expect(component.options.layers[0].hoverPopupField).toEqual(new FieldMetaData('testHover1', 'Test Hover 1'));
        expect(component.options.layers[0].dateField).toEqual(new FieldMetaData('testDate1', 'Test Date 1'));
        expect(component.options.layers[0].latitudeField).toEqual(new FieldMetaData('testLatitude1', 'Test Latitude 1'));
        expect(component.options.layers[0].longitudeField).toEqual(new FieldMetaData('testLongitude1', 'Test Longitude 1'));
        expect(component.options.layers[0].sizeField).toEqual(new FieldMetaData('testSize1', 'Test Size 1'));
        expect(spy.calls.count()).toBe(1);

        component.subRemoveLayer(0);
        expect(component.options.layers).toEqual([]);
        expect(spy.calls.count()).toBe(2);
    });

    it('options.createBindings does set expected bindings', () => {
        expect(component.options.createBindings()).toEqual({
            configFilter: undefined,
            title: 'Map',
            limit: 1000,
            layers: [{
                idField: '',
                database: '',
                table: '',
                title: 'New Layer',
                unsharedFilterValue: '',
                unsharedFilterField: '',
                latitudeField: '',
                longitudeField: '',
                sizeField: '',
                colorField: '',
                dateField: '',
                hoverPopupField: ''
            }]
        });

        updateMapLayer1(component);
        updateMapLayer2(component);

        expect(component.options.createBindings()).toEqual({
            configFilter: undefined,
            title: 'Map',
            limit: 1000,
            layers: [{
                idField: 'testId1',
                database: 'testDatabase1',
                table: 'testTable1',
                title: 'Layer A',
                unsharedFilterValue: '',
                unsharedFilterField: '',
                latitudeField: 'testLatitude1',
                longitudeField: 'testLongitude1',
                sizeField: 'testSize1',
                colorField: 'testColor1',
                dateField: 'testDate1',
                hoverPopupField: 'testHover1'
            }, {
                idField: 'testId2',
                database: 'testDatabase2',
                table: 'testTable2',
                title: 'Layer B',
                unsharedFilterValue: '',
                unsharedFilterField: '',
                latitudeField: 'testLatitude2',
                longitudeField: 'testLongitude2',
                sizeField: 'testSize2',
                colorField: 'testColor2',
                dateField: 'testDate2',
                hoverPopupField: 'testHover2'
            }]
        });
    });

    it('ngAfterViewInit does call mapObject.initialize and handleChangeData', () => {
        component.assignTestMap();
        let spy = spyOn(component, 'handleChangeData');
        let mapSpy = component.spyOnTestMap('initialize');
        component.ngAfterViewInit();
        expect(spy.calls.count()).toBe(1);
        expect(mapSpy.calls.count()).toBe(1);
    });

    it('subNgOnDestroy does call mapObject.destroy', () => {
        component.assignTestMap();
        let mapSpy = component.spyOnTestMap('destroy');
        component.subNgOnDestroy();
        expect(mapSpy.calls.count()).toBe(1);
    });

    it('subAddLayer creates new layer and updates docCount and filterVisible', () => {
        let layer = component.subAddLayer({});

        expect(component.options.layers[1].title).toEqual('New Layer');
        expect(component.options.layers[1].idField).toEqual(new FieldMetaData());
        expect(component.options.layers[1].colorField).toEqual(new FieldMetaData());
        expect(component.options.layers[1].hoverPopupField).toEqual(new FieldMetaData());
        expect(component.options.layers[1].dateField).toEqual(new FieldMetaData());
        expect(component.options.layers[1].latitudeField).toEqual(new FieldMetaData());
        expect(component.options.layers[1].longitudeField).toEqual(new FieldMetaData());
        expect(component.options.layers[1].sizeField).toEqual(new FieldMetaData());

        expect(component.docCount).toEqual([0, 0]);
        expect(component.filterVisible).toEqual([true, true]);
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
        expect(spy.calls.argsFor(0)).toEqual([0, true, {
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
        expect(spy.calls.argsFor(1)).toEqual([0, true, {
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
        expect(spy.calls.argsFor(2)).toEqual([1, true, {
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

    it('isValidQuery does return expected boolean', () => {
        expect(component.isValidQuery(0)).toBe(false);

        updateMapLayer1(component);

        expect(component.isValidQuery(0)).toBe(true);
    });

    it('createQuery does return expected object', () => {
        updateMapLayer1(component);

        component.options.limit = 5678;

        let where1 = [neon.query.where('testLatitude1', '!=', null), neon.query.where('testLongitude1', '!=', null)];
        let query1 = new neon.query.Query().selectFrom('testDatabase1', 'testTable1').where(neon.query.and.apply(neon.query, where1))
            .withFields(['_id', 'testLatitude1', 'testLongitude1', 'testId1', 'testColor1', 'testSize1',
            'testDate1', 'testHover1']).limit(5678);

        expect(component.createQuery(0)).toEqual(query1);

        updateMapLayer2(component);

        let where2 = [neon.query.where('testLatitude2', '!=', null), neon.query.where('testLongitude2', '!=', null)];
        let query2 = new neon.query.Query().selectFrom('testDatabase2', 'testTable2').where(neon.query.and.apply(neon.query, where2))
            .withFields(['_id', 'testLatitude2', 'testLongitude2', 'testId2', 'testColor2', 'testSize2',
            'testDate2', 'testHover2']).limit(5678);

        expect(component.createQuery(1)).toEqual(query2);
    });

    it('onQuerySuccess does call runDocumentCountQuery if response is not a docCount', () => {
        component.assignTestMap();

        let spy = spyOn(component, 'runDocumentCountQuery');

        updateMapLayer1(component);

        component.onQuerySuccess(0, {
            data: [{
                testId1: 'testId1',
                testColor1: 'testValue',
                testDate1: '2018-01-01T00:00:00',
                testLatitude1: 0,
                testLongitude1: 0,
                testSize1: 1
            }]
        });

        expect(spy.calls.count()).toBe(1);
        expect(spy.calls.argsFor(0)).toEqual([0]);

        updateMapLayer2(component);

        component.onQuerySuccess(1, {
            data: [{
                testId2: 'testId2',
                testColor2: 'testValue',
                testDate2: '2018-01-01T00:00:00',
                testLatitude2: 0,
                testLongitude2: 0,
                testSize2: 1
            }]
        });

        expect(spy.calls.count()).toBe(2);
        expect(spy.calls.argsFor(1)).toEqual([1]);
    });

    it('onQuerySuccess does set layer docCount and does not call runDocumentCountQuery if response is a docCount', () => {
        let spy = spyOn(component, 'runDocumentCountQuery');

        updateMapLayer1(component);

        component.onQuerySuccess(0, {
            data: [{
                _docCount: 1111
            }]
        });

        expect(spy.calls.count()).toBe(0);
        expect(component.docCount[0]).toEqual(1111);

        updateMapLayer2(component);

        component.onQuerySuccess(1, {
            data: [{
                _docCount: 2222
            }]
        });

        expect(spy.calls.count()).toBe(0);
        expect(component.docCount[0]).toEqual(1111);
        expect(component.docCount[1]).toEqual(2222);
    });

    it('updateLegend does update colorByFields', () => {
        component.updateLegend();
        expect(component.colorByFields).toEqual([]);

        updateMapLayer1(component);
        component.updateLegend();
        expect(component.colorByFields).toEqual(['testColor1']);

        updateMapLayer2(component);
        component.updateLegend();
        expect(component.colorByFields).toEqual(['testColor1', 'testColor2']);
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
        expect(component.doesLayerStillHaveFilter(0)).toBe(false);

        getService(FilterService).addFilter(null, 'testName', 'testDatabase1', 'testTable1', neon.query.and.apply(neon.query, [
            neon.query.where('testLatitude1', '!=', null), neon.query.where('testLongitude1', '!=', null)]), 'testFilterName1');
        expect(component.doesLayerStillHaveFilter(0)).toBe(true);

        updateMapLayer2(component);
        expect(component.doesLayerStillHaveFilter(1)).toBe(false);

        getService(FilterService).removeFilter(null, getService(FilterService).getLatestFilterId());
        expect(component.doesLayerStillHaveFilter(0)).toBe(false);
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
        expect(spy1.calls.argsFor(0)).toEqual([0, {
            id: 'testId1'
        }, true, false]);
        expect(spy2.calls.count()).toBe(1);

        updateMapLayer2(component);

        component.handleRemoveFilter({
            id: 'testId2'
        });

        expect(spy1.calls.count()).toBe(3);
        expect(spy1.calls.argsFor(1)).toEqual([0, {
            id: 'testId2'
        }, true, false]);
        expect(spy1.calls.argsFor(2)).toEqual([1, {
            id: 'testId2'
        }, true, false]);
        expect(spy2.calls.count()).toBe(2);
    });

    it('toggleFilter does update filterVisible', () => {
        component.toggleFilter(0);
        expect(component.filterVisible).toEqual([false]);
        component.toggleFilter(0);
        expect(component.filterVisible).toEqual([true]);
    });

    it('getIconForFilter does return expected string', () => {
        component.filterVisible = [true];
        expect(component.getIconForFilter(0)).toBe('keyboard_arrow_up');
        component.filterVisible = [false];
        expect(component.getIconForFilter(0)).toBe('keyboard_arrow_down');
        component.filterVisible = [false, true];
        expect(component.getIconForFilter(1)).toBe('keyboard_arrow_up');
        component.filterVisible = [true, false];
        expect(component.getIconForFilter(1)).toBe('keyboard_arrow_down');
    });

    it('onResizeStop does call mapObject.sizeChanged', () => {
        component.assignTestMap();
        let mapSpy = component.spyOnTestMap('sizeChanged');
        component.onResizeStop();
        expect(mapSpy.calls.count()).toBe(1);
    });

    it('createBasicQuery does return expected object', () => {
        updateMapLayer1(component);

        let where1 = [neon.query.where('testLatitude1', '!=', null), neon.query.where('testLongitude1', '!=', null)];
        let query1 = new neon.query.Query().selectFrom('testDatabase1', 'testTable1').where(neon.query.and.apply(neon.query, where1));

        expect(component.createBasicQuery(0)).toEqual(query1);

        updateMapLayer2(component);

        let where2 = [neon.query.where('testLatitude2', '!=', null), neon.query.where('testLongitude2', '!=', null)];
        let query2 = new neon.query.Query().selectFrom('testDatabase2', 'testTable2').where(neon.query.and.apply(neon.query, where2));

        expect(component.createBasicQuery(1)).toEqual(query2);
    });

    it('getButtonText does return expected string', () => {
        updateMapLayer1(component);

        expect(component.getButtonText()).toEqual('1,000 of 1,234');

        component.options.limit = 2000;

        expect(component.getButtonText()).toEqual('Total 1,234');

        updateMapLayer2(component);

        expect(component.getButtonText()).toEqual('Layer A (Total 1,234), Layer B (2,000 of 5,678)');
    });

    it('runDocumentCountQuery does call executeQuery', () => {
        let spy = spyOn(component, 'executeQuery');

        updateMapLayer1(component);

        component.runDocumentCountQuery(0);

        let where1 = [neon.query.where('testLatitude1', '!=', null), neon.query.where('testLongitude1', '!=', null)];
        let query1 = new neon.query.Query().selectFrom('testDatabase1', 'testTable1').where(neon.query.and.apply(neon.query, where1))
            .aggregate('count', '*', '_docCount');

        expect(spy.calls.count()).toBe(1);
        expect(spy.calls.argsFor(0)).toEqual([0, query1]);

        updateMapLayer2(component);

        component.runDocumentCountQuery(1);

        let where2 = [neon.query.where('testLatitude2', '!=', null), neon.query.where('testLongitude2', '!=', null)];
        let query2 = new neon.query.Query().selectFrom('testDatabase2', 'testTable2').where(neon.query.and.apply(neon.query, where2))
            .aggregate('count', '*', '_docCount');

        expect(spy.calls.count()).toBe(2);
        expect(spy.calls.argsFor(1)).toEqual([1, query2]);
    });
});

describe('Component: Map with config', () => {
    let component: TestMapComponent;
    let fixture: ComponentFixture<TestMapComponent>;

    initializeTestBed({
        declarations: [
            TestMapComponent,
            LegendComponent,
            ExportControlComponent
        ],
        providers: [
            ActiveGridService,
            ConnectionService,
            { provide: DatasetService, useClass: DatasetServiceMock },
            { provide: FilterService, useClass: FilterServiceMock },
            ExportService,
            TranslationService,
            ErrorNotificationService,
            VisualizationService,
            ThemesService,
            Injector,
            ColorSchemeService,
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
            { provide: 'clustering', useValue: 'clusters' },
            { provide: 'clusterPixelRange', useValue: 20 },
            { provide: 'customServer', useValue: { mapUrl: 'testUrl', layer: 'testLayer' } },
            { provide: 'disableCtrlZoom', useValue: true },
            { provide: 'hoverPopupEnabled', useValue: true },
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
        expect(component.options.clustering).toEqual('clusters');
        expect(component.options.clusterPixelRange).toEqual(20);
        expect(component.options.customServer).toEqual({
            mapUrl: 'testUrl',
            layer: 'testLayer'
        });
        expect(component.options.disableCtrlZoom).toEqual(true);
        expect(component.options.hoverPopupEnabled).toEqual(true);
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
