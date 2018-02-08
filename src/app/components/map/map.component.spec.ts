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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, ViewEncapsulation } from '@angular/core';

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
import { BoundingBoxByDegrees, MapPoint, MapType } from './map.type.abstract';
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
}

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

    it('should set default configuration values', () => {
        expect(component.getOptionFromConfig('limit')).toBe(1000);
        expect(component.getOptionFromConfig('layers')).toEqual([]);
        expect(component.getOptionFromConfig('clustering')).toBe('points');
        expect(component.getOptionFromConfig('minClusterSize')).toBe(5);
        expect(component.getOptionFromConfig('clusterPixelRange')).toBe(15);
        expect(component.getOptionFromConfig('hoverPopupEnabled')).toBe(false);
        expect(component.getOptionFromConfig('customServer')).toEqual({});
        expect(component.getOptionFromConfig('mapType')).toBe(MapType.leaflet);
    });

    it('should create the default map (Leaflet)', () => {
        expect(getDebug('.leaflet-container')).toBeTruthy();
    });

    it('should change map type to Cesium', () => {
        if (webgl_support()) {
            component.handleChangeMapType(MapType.cesium);
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
                            colorService.getColorFor('category', 'a').toRgb(), 'Count: 4'
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
                            colorService.getColorFor('category', 'a').toRgb(), 'Count: 1'
                        ),
                        new MapPoint(
                            '0.000\u00b0, 1.000\u00b0', 0, 1, 1,
                            colorService.getColorFor('category', 'b').toRgb(), 'Count: 1'
                        ),
                        new MapPoint(
                            '0.000\u00b0, 2.000\u00b0', 0, 2, 1,
                            colorService.getColorFor('category', 'c').toRgb(), 'Count: 1'
                        ),
                        new MapPoint(
                            '0.000\u00b0, 3.000\u00b0', 0, 3, 1,
                            colorService.getColorFor('category', 'd').toRgb(), 'Count: 1'
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
                            colorService.getColorFor('category', 'a').toRgb(), 'Count: 8'
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
                            colorService.getColorFor('category', 'a').toRgb(), 'Count: 1'
                        ),
                        new MapPoint(
                            '0.000\u00b0, 2.000\u00b0', 0, 2, 1,
                            colorService.getColorFor('category', 'a').toRgb(), 'Count: 1'
                        ),
                        new MapPoint(
                            '0.000\u00b0, 1.000\u00b0', 0, 1, 1,
                            colorService.getColorFor('category', 'a').toRgb(), 'Count: 1'
                        ),
                        new MapPoint(
                            '0.000\u00b0, 0.000\u00b0', 0, 0, 1,
                            colorService.getColorFor('category', 'a').toRgb(), 'Count: 1'
                        ),
                        new MapPoint(
                            '0.000\u00b0, 7.000\u00b0', 0, 7, 1,
                            colorService.getColorFor('category', 'b').toRgb(), 'Count: 1'
                        ),
                        new MapPoint(
                            '0.000\u00b0, 6.000\u00b0', 0, 6, 1,
                            colorService.getColorFor('category', 'b').toRgb(), 'Count: 1'
                        ),
                        new MapPoint(
                            '0.000\u00b0, 5.000\u00b0', 0, 5, 1,
                            colorService.getColorFor('category', 'b').toRgb(), 'Count: 1'
                        ),
                        new MapPoint(
                            '0.000\u00b0, 4.000\u00b0', 0, 4, 1,
                            colorService.getColorFor('category', 'b').toRgb(), 'Count: 1'
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

        let xEl = getDebug('.mat-18').parent.parent;
        xEl.triggerEventHandler('click', null);
        expect(getService(FilterService).getFilters().length).toBe(0);
    });

    it('should add layer when new layer button is clicked', () => {
        let layerCount = component.active.layers.length;

        let addEl = getDebug('a.mat-mini-fab.mat-accent').parent;
        addEl.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.active.layers.length).toBe(layerCount + 1);
    });
});
