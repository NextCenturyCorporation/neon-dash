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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector, ViewEncapsulation } from '@angular/core';

import { MapComponent } from './map.component';
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
import { AbstractMap, BoundingBoxByDegrees, MapLayer, MapPoint, MapType } from './map.type.abstract';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import * as neon from 'neon-framework';
import { FilterMock } from '../../../testUtils/MockServices/FilterMock';

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
    constructor(activeGridService: ActiveGridService, connectionService: ConnectionService, datasetService: DatasetService,
                filterService: FilterService, exportService: ExportService, injector: Injector, themesService: ThemesService,
                colorSchemeSrv: ColorSchemeService, ref: ChangeDetectorRef, visualizationService: VisualizationService) {
        super(activeGridService, connectionService, datasetService, filterService, exportService, injector,
            themesService, colorSchemeSrv, ref, visualizationService);
    }

    getMapPoints(lngField: string, latField: string, colorField: string, data: any[]) {
        return super.getMapPoints(lngField, latField, colorField, data);
    }

    setTestMap() {
        this.mapObject = new TestMap();
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
}
/* tslint:enable:component-class-suffix */

describe('Component: Map', () => {
    let fixture: ComponentFixture<TestMapComponent>,
        component: TestMapComponent,
        getDebug = (selector: string) => fixture.debugElement.query(By.css(selector)),
        getService = (type: any) => fixture.debugElement.injector.get(type),
        addFilter = (box: BoundingBoxByDegrees, dbName: string, tableName: string, latName: string, lngName: string) => {
            let meta = component.meta,
                layerIndex = 0,
                layer = meta.layers[layerIndex],
                active = component.active.layers[layerIndex],
                latfield = new FieldMetaData(latName),
                lngfield = new FieldMetaData(lngName),
                catfield = new FieldMetaData('category'),
                table = new TableMetaData(tableName, tableName, [latfield, lngfield, catfield]),
                database = new DatabaseMetaData(dbName);

            database.tables.push(table);

            active.latitudeField = latfield;
            active.longitudeField = lngfield;

            meta.databases[layerIndex] = layer.database = database;
            layer.table = table;

            component.filterByLocation(box);
        };

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                TestMapComponent,
                LegendComponent,
                ExportControlComponent
            ],
            providers: [
                ActiveGridService,
                ConnectionService,
                DatasetService,
                { provide: FilterService, useClass: FilterMock },
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
        fixture = TestBed.createComponent(TestMapComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create an instance', () => {
        expect(component).toBeTruthy();
    });

    it('creates an empty layer on init', () => {
        expect(component.active.layers).toEqual([{
            title: '',
            latitudeField: new FieldMetaData(),
            longitudeField: new FieldMetaData(),
            colorField: new FieldMetaData(),
            sizeField: new FieldMetaData(),
            dateField: new FieldMetaData()
        }]);
    });

    it('should set default configuration values', () => {
        expect(component.getOptionFromConfig('limit')).toBe(1000);
        expect(component.getOptionFromConfig('layers')).toEqual([]);
        expect(component.getOptionFromConfig('clustering')).toBe('points');
        expect(component.getOptionFromConfig('minClusterSize')).toBe(5);
        expect(component.getOptionFromConfig('clusterPixelRange')).toBe(15);
        expect(component.getOptionFromConfig('hoverPopupEnabled')).toBe(false);
        expect(component.getOptionFromConfig('customServer')).toEqual({});
        expect(component.getOptionFromConfig('mapType')).toBe(MapType.Leaflet);
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

    it('should create collapsed map points', () => {
        let colorService = getService(ColorSchemeService),
            datasets = [
                {
                    data: [
                        {lat: 0, lng: 0, category: 'a'},
                        {lat: 0, lng: 0, category: 'b'},
                        {lat: 0, lng: 0, category: 'c'},
                        {lat: 0, lng: 0, category: 'd'}
                    ],
                    expected: [
                        new MapPoint(
                            '0.000\u00b0, 0.000\u00b0', 0, 0, 4,
                            colorService.getColorFor('category', 'a').toRgb(), 'Count: 4',
                            'category', 'a'
                        )
                    ]
                },
                {
                    data: [
                        {lat: 0, lng: 0, category: 'a'},
                        {lat: 0, lng: 1, category: 'b'},
                        {lat: 0, lng: 2, category: 'c'},
                        {lat: 0, lng: 3, category: 'd'}
                    ],
                    expected: [
                        new MapPoint(
                            '0.000\u00b0, 0.000\u00b0', 0, 0, 1,
                            colorService.getColorFor('category', 'a').toRgb(), 'Count: 1',
                            'category', 'a'
                        ),
                        new MapPoint(
                            '0.000\u00b0, 1.000\u00b0', 0, 1, 1,
                            colorService.getColorFor('category', 'b').toRgb(), 'Count: 1',
                            'category', 'b'
                        ),
                        new MapPoint(
                            '0.000\u00b0, 2.000\u00b0', 0, 2, 1,
                            colorService.getColorFor('category', 'c').toRgb(), 'Count: 1',
                            'category', 'c'
                        ),
                        new MapPoint(
                            '0.000\u00b0, 3.000\u00b0', 0, 3, 1,
                            colorService.getColorFor('category', 'd').toRgb(), 'Count: 1',
                            'category', 'd'
                        )
                    ]
                },
                {
                    data: [
                        {lat: [0, 0, 0, 0], lng: [0, 0, 0, 0], category: 'a'},
                        {lat: [0, 0, 0, 0], lng: [0, 0, 0, 0], category: 'b'}
                    ],
                    expected: [
                        new MapPoint(
                            '0.000\u00b0, 0.000\u00b0', 0, 0, 8,
                            colorService.getColorFor('category', 'a').toRgb(), 'Count: 8',
                            'category', 'a'
                        )
                    ]
                },
                {
                    data: [
                        {lat: [0, 0, 0, 0], lng: [0, 1, 2, 3], category: 'a'},
                        {lat: [0, 0, 0, 0], lng: [4, 5, 6, 7], category: 'b'}
                    ],
                    expected: [
                        new MapPoint(
                            '0.000\u00b0, 3.000\u00b0', 0, 3, 1,
                            colorService.getColorFor('category', 'a').toRgb(), 'Count: 1',
                            'category', 'a'
                        ),
                        new MapPoint(
                            '0.000\u00b0, 2.000\u00b0', 0, 2, 1,
                            colorService.getColorFor('category', 'a').toRgb(), 'Count: 1',
                            'category', 'a'
                        ),
                        new MapPoint(
                            '0.000\u00b0, 1.000\u00b0', 0, 1, 1,
                            colorService.getColorFor('category', 'a').toRgb(), 'Count: 1',
                            'category', 'a'
                        ),
                        new MapPoint(
                            '0.000\u00b0, 0.000\u00b0', 0, 0, 1,
                            colorService.getColorFor('category', 'a').toRgb(), 'Count: 1',
                            'category', 'a'
                        ),
                        new MapPoint(
                            '0.000\u00b0, 7.000\u00b0', 0, 7, 1,
                            colorService.getColorFor('category', 'b').toRgb(), 'Count: 1',
                            'category', 'b'
                        ),
                        new MapPoint(
                            '0.000\u00b0, 6.000\u00b0', 0, 6, 1,
                            colorService.getColorFor('category', 'b').toRgb(), 'Count: 1',
                            'category', 'b'
                        ),
                        new MapPoint(
                            '0.000\u00b0, 5.000\u00b0', 0, 5, 1,
                            colorService.getColorFor('category', 'b').toRgb(), 'Count: 1',
                            'category', 'b'
                        ),
                        new MapPoint(
                            '0.000\u00b0, 4.000\u00b0', 0, 4, 1,
                            colorService.getColorFor('category', 'b').toRgb(), 'Count: 1',
                            'category', 'b'
                        )
                    ]
                }
            ];

        for (let dataset of datasets) {
            let mapPoints = component.getMapPoints('lng', 'lat', 'category', dataset.data);
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

        let whereClauses = component.createNeonFilterClauseEquals(dbName, tableName, [latName, lngName]),
            filterClauses = [
                neon.query.where(latName, '>=', box.south),
                neon.query.where(latName, '<=', box.north),
                neon.query.where(lngName, '>=', box.west),
                neon.query.where(lngName, '<=', box.east)
            ],
            expected = neon.query.and.apply(neon.query, filterClauses);

        expect(whereClauses).toEqual(expected);
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
    });

    it('should add layer when new layer button is clicked', () => {
        let addEl = getDebug('a');
        addEl.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.active.layers.length).toBe(2);
    });

    it('returns expected object from createBasicQuery', () => {
        component.meta.layers[0] = {
            database: new DatabaseMetaData('testDatabase'),
            tables: [],
            table: new TableMetaData('testTable'),
            unsharedFilterField: {},
            unsharedFilterValue: '',
            fields: [],
            docCount: 1234
        };

        component.active.layers[0] = {
            title: 'Layer A',
            latitudeField: new FieldMetaData('testLatitude'),
            longitudeField: new FieldMetaData('testLongitude'),
            colorField: new FieldMetaData('testColor'),
            sizeField: new FieldMetaData('testSize'),
            dateField: new FieldMetaData('testDate')
        };

        let whereClauses = [neon.query.where('testLatitude', '!=', null), neon.query.where('testLongitude', '!=', null)];
        let query = new neon.query.Query().selectFrom('testDatabase', 'testTable').where(neon.query.and.apply(neon.query, whereClauses));

        expect(component.createBasicQuery(0)).toEqual(query);
    });

    it('returns expected object from createQuery', () => {
        component.meta.layers[0] = {
            database: new DatabaseMetaData('testDatabase'),
            tables: [],
            table: new TableMetaData('testTable'),
            unsharedFilterField: {},
            unsharedFilterValue: '',
            fields: [],
            docCount: 1234
        };

        component.active.layers[0] = {
            title: 'Layer A',
            latitudeField: new FieldMetaData('testLatitude'),
            longitudeField: new FieldMetaData('testLongitude'),
            colorField: new FieldMetaData('testColor'),
            sizeField: new FieldMetaData('testSize'),
            dateField: new FieldMetaData('testDate')
        };

        component.active.limit = 5678;

        let whereClauses = [neon.query.where('testLatitude', '!=', null), neon.query.where('testLongitude', '!=', null)];
        let query = new neon.query.Query().selectFrom('testDatabase', 'testTable').where(neon.query.and.apply(neon.query, whereClauses))
                .withFields(['_id', 'testLatitude', 'testLongitude', 'testColor', 'testSize', 'testDate']).limit(5678);

        expect(component.createQuery(0)).toEqual(query);
    });

    it('returns expected string from getButtonText with one layer', () => {
        component.meta.layers[0] = {
            database: new DatabaseMetaData('testDatabase'),
            tables: [],
            table: new TableMetaData('testTable'),
            unsharedFilterField: {},
            unsharedFilterValue: '',
            fields: [],
            docCount: 1234
        };

        component.active.layers[0] = {
            title: 'Layer A',
            latitudeField: new FieldMetaData('testLatitude'),
            longitudeField: new FieldMetaData('testLongitude'),
            colorField: new FieldMetaData('testColor'),
            sizeField: new FieldMetaData('testSize'),
            dateField: new FieldMetaData('testDate')
        };

        expect(component.getButtonText()).toEqual('1000 of 1234');

        component.active.limit = 2000;

        expect(component.getButtonText()).toEqual('Total 1234');
    });

    it('returns expected string from getButtonText with multiple layers', () => {
        component.meta.layers[0] = {
            database: new DatabaseMetaData('testDatabase'),
            tables: [],
            table: new TableMetaData('testTable'),
            unsharedFilterField: {},
            unsharedFilterValue: '',
            fields: [],
            docCount: 1234
        };

        component.active.layers[0] = {
            title: 'Layer A',
            latitudeField: new FieldMetaData('testLatitude'),
            longitudeField: new FieldMetaData('testLongitude'),
            colorField: new FieldMetaData('testColor'),
            sizeField: new FieldMetaData('testSize'),
            dateField: new FieldMetaData('testDate')
        };

        component.meta.layers.push({
            database: new DatabaseMetaData('testDatabase'),
            tables: [],
            table: new TableMetaData('testTable'),
            unsharedFilterField: {},
            unsharedFilterValue: '',
            fields: [],
            docCount: 5678
        });

        component.active.layers.push({
            title: 'Layer B',
            latitudeField: new FieldMetaData('testLatitude'),
            longitudeField: new FieldMetaData('testLongitude'),
            colorField: new FieldMetaData('testColor'),
            sizeField: new FieldMetaData('testSize'),
            dateField: new FieldMetaData('testDate')
        });

        expect(component.getButtonText()).toEqual('Layer A (1000 of 1234), Layer B (1000 of 5678)');

        component.active.limit = 2000;

        expect(component.getButtonText()).toEqual('Layer A (Total 1234), Layer B (2000 of 5678)');
    });

    it('onQuerySuccess does call runDocumentCountQuery if response is not a docCount', () => {
        component.meta.layers[0] = {
            database: new DatabaseMetaData('testDatabase'),
            tables: [],
            table: new TableMetaData('testTable'),
            unsharedFilterField: {},
            unsharedFilterValue: '',
            fields: [],
            docCount: 1234
        };

        component.active.layers[0] = {
            title: 'Layer A',
            latitudeField: new FieldMetaData('testLatitude'),
            longitudeField: new FieldMetaData('testLongitude'),
            colorField: new FieldMetaData('testColor'),
            sizeField: new FieldMetaData('testSize'),
            dateField: new FieldMetaData('testDate')
        };

        let indexArgs = [];
        component.runDocumentCountQuery = function(layerIndex) {
            indexArgs.push(layerIndex);
        };

        component.setTestMap();

        component.onQuerySuccess(0, {
            data: [{
                testColor: 'testValue',
                testDate: '2018-01-01T00:00:00',
                testLatitude: 0,
                testLongitude: 0,
                testSize: 1
            }]
        });

        expect(indexArgs).toEqual([0]);
    });

    it('onQuerySuccess does set layer docCount and does not call runDocumentCountQuery if response is a docCount', () => {
        component.meta.layers[0] = {
            database: new DatabaseMetaData('testDatabase'),
            tables: [],
            table: new TableMetaData('testTable'),
            unsharedFilterField: {},
            unsharedFilterValue: '',
            fields: [],
            docCount: 1234
        };

        component.active.layers[0] = {
            title: 'Layer A',
            latitudeField: new FieldMetaData('testLatitude'),
            longitudeField: new FieldMetaData('testLongitude'),
            colorField: new FieldMetaData('testColor'),
            sizeField: new FieldMetaData('testSize'),
            dateField: new FieldMetaData('testDate')
        };

        let indexArgs = [];
        component.runDocumentCountQuery = function(layerIndex) {
            indexArgs.push(layerIndex);
        };

        component.onQuerySuccess(0, {
            data: [{
                _docCount: 5678
            }]
        });

        expect(indexArgs).toEqual([]);
        expect(component.meta.layers[0].docCount).toEqual(5678);
    });

    it('runDocumentCountQuery does call executeQuery', () => {
        component.meta.layers[0] = {
            database: new DatabaseMetaData('testDatabase'),
            tables: [],
            table: new TableMetaData('testTable'),
            unsharedFilterField: {},
            unsharedFilterValue: '',
            fields: [],
            docCount: 1234
        };

        component.active.layers[0] = {
            title: 'Layer A',
            latitudeField: new FieldMetaData('testLatitude'),
            longitudeField: new FieldMetaData('testLongitude'),
            colorField: new FieldMetaData('testColor'),
            sizeField: new FieldMetaData('testSize'),
            dateField: new FieldMetaData('testDate')
        };

        let indexArgs = [];
        let queryArgs = [];
        component.executeQuery = function(layerIndex, queryInput) {
            indexArgs.push(layerIndex);
            queryArgs.push(queryInput);
        };

        component.runDocumentCountQuery(0);

        let whereClauses = [neon.query.where('testLatitude', '!=', null), neon.query.where('testLongitude', '!=', null)];
        let query = new neon.query.Query().selectFrom('testDatabase', 'testTable').where(neon.query.and.apply(neon.query, whereClauses))
                .aggregate('count', '*', '_docCount');

        expect(indexArgs).toEqual([0]);
        expect(queryArgs).toEqual([query]);
    });
});
