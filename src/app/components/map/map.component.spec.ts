/**
 * Copyright 2020 CACI (formerly Next Century Corporation)
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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    ViewEncapsulation
} from '@angular/core';

import { MapComponent } from './map.component';

import {
    AbstractSearchService,
    BoundsFilter,
    BoundsFilterDesign,
    CompoundFilterType,
    CoreSearch,
    FieldConfig,
    FilterCollection,
    ListFilterDesign,
    PairFilterDesign,
    SearchServiceMock
} from '@caci-critical-insight-solutions/nucleus-core';
import { InjectableColorThemeService } from '../../services/injectable.color-theme.service';
import { InjectableFilterService } from '../../services/injectable.filter.service';
import { DashboardService } from '../../services/dashboard.service';

import { By } from '@angular/platform-browser';
import { AbstractMap, BoundingBoxByDegrees, MapPoint, MapType } from './map.type.abstract';
import { WidgetOptionCollection } from '../../models/widget-option-collection';

import { DashboardServiceMock } from '../../services/mock.dashboard-service';
import { initializeTestBed } from '../../../testUtils/initializeTestBed';

import { LegendModule } from '../legend/legend.module';
import { CommonWidgetModule } from '../../common-widget.module';

@Component({
    selector: 'app-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
class TestMapComponent extends MapComponent {
    assignTestMap() {
        this.options.type = -1;
        this.mapObject = new TestMap();
        return this.mapObject;
    }

    getMapPoints(databaseName: string, tableName: string, idField: string, filterFields: FieldConfig[], lngField: string,
        latField: string, colorField: string, hoverPopupField: FieldConfig, data: any[]) {
        return super.getMapPoints(databaseName, tableName, idField, filterFields, lngField, latField, colorField, hoverPopupField, data);
    }

    spyOnTestMap(functionName: string) {
        /* eslint-disable-next-line jasmine/no-unsafe-spy */
        return spyOn(this.mapObject, functionName);
    }
}

class TestMap extends AbstractMap {
    addPoints(__points: MapPoint[], __layer?: any, __cluster?: boolean, __layerTitle?: string) {
        /* NO-OP */
    }

    clearLayer(__layer: any) {
        /* NO-OP */
    }

    destroy() {
        /* NO-OP */
    }

    drawBoundary() {
        /* NO-OP */
    }

    doCustomInitialization(__mapContainer: ElementRef) {
        /* NO-OP */
    }

    hidePoints(__layer: any, __value: string) {
        /* NO-OP */
    }

    makeSelectionInexact() {
        /* NO-OP */
    }

    removeFilterBox() {
        /* NO-OP */
    }

    unhidePoints(__layer: any, __value: string) {
        /* NO-OP */
    }

    unhideAllPoints(__layer: any) {
        /* NO-OP */
    }

    zoomIn() {
        /* NO-OP */
    }

    zoomOut() {
        /* NO-OP*/
    }
}

function updateMapLayer1(component: TestMapComponent) {
    component.filterVisible.set('testLayer1', true);
    (component as any).layerIdToElementCount.set('testLayer1', 1);

    component.options.layers[0] = new WidgetOptionCollection(component['dataset']);
    component.options.layers[0]._id = 'testLayer1';
    component.options.layers[0].databases = [];
    component.options.layers[0].database = DashboardServiceMock.DATABASES.testDatabase1;
    component.options.layers[0].fields = [];
    component.options.layers[0].tables = [];
    component.options.layers[0].table = DashboardServiceMock.TABLES.testTable1;
    component.options.layers[0].title = 'Layer A';

    component.options.layers[0].filterFields = [];
    component.options.layers[0].idField = DashboardServiceMock.FIELD_MAP.ID;
    component.options.layers[0].colorField = DashboardServiceMock.FIELD_MAP.CATEGORY;
    component.options.layers[0].hoverPopupField = DashboardServiceMock.FIELD_MAP.TEXT;
    component.options.layers[0].dateField = DashboardServiceMock.FIELD_MAP.DATE;
    component.options.layers[0].latitudeField = DashboardServiceMock.FIELD_MAP.Y;
    component.options.layers[0].longitudeField = DashboardServiceMock.FIELD_MAP.X;
    component.options.layers[0].sizeField = DashboardServiceMock.FIELD_MAP.SIZE;
}

function updateMapLayer2(component: TestMapComponent) {
    component.filterVisible.set('testLayer2', true);
    (component as any).layerIdToElementCount.set('testLayer2', 10);

    component.options.layers[1] = new WidgetOptionCollection(component['dataset']);
    component.options.layers[1]._id = 'testLayer2';
    component.options.layers[1].databases = [];
    component.options.layers[1].database = DashboardServiceMock.DATABASES.testDatabase2;
    component.options.layers[1].fields = [];
    component.options.layers[1].tables = [];
    component.options.layers[1].table = DashboardServiceMock.TABLES.testTable2;
    component.options.layers[1].title = 'Layer B';

    component.options.layers[1].filterFields = [];
    component.options.layers[1].idField = DashboardServiceMock.FIELD_MAP.ID;
    component.options.layers[1].colorField = DashboardServiceMock.FIELD_MAP.CATEGORY;
    component.options.layers[1].hoverPopupField = DashboardServiceMock.FIELD_MAP.TEXT;
    component.options.layers[1].dateField = DashboardServiceMock.FIELD_MAP.DATE;
    component.options.layers[1].latitudeField = DashboardServiceMock.FIELD_MAP.Y;
    component.options.layers[1].longitudeField = DashboardServiceMock.FIELD_MAP.X;
    component.options.layers[1].sizeField = DashboardServiceMock.FIELD_MAP.SIZE;
}

describe('Component: Map', () => {
    let fixture: ComponentFixture<TestMapComponent>;
    let component: TestMapComponent;
    let getDebug = (selector: string) => fixture.debugElement.query(By.css(selector));
    let getService = (type: any) => fixture.debugElement.injector.get(type);

    initializeTestBed('Map', {
        declarations: [
            TestMapComponent
        ],
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock },
            InjectableFilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            InjectableColorThemeService
        ],
        imports: [
            CommonWidgetModule,
            LegendModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestMapComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('does have expected default options', () => {
        expect(component.options.clusterPixelRange).toEqual(15);
        expect(component.options.customServer).toEqual(undefined);
        expect(component.options.disableCtrlZoom).toEqual(false);
        expect(component.options.hoverSelect).toEqual(undefined);
        expect(component.options.searchLimit).toEqual(1000);
        expect(component.options.minClusterSize).toEqual(5);
        expect(component.options.singleColor).toEqual(false);
        expect(component.options.title).toEqual('Map');
        expect(component.options.type).toEqual(MapType.Leaflet);

        expect(component.options.west).toEqual(undefined);
        expect(component.options.east).toEqual(undefined);
        expect(component.options.north).toEqual(undefined);
        expect(component.options.south).toEqual(undefined);
    });

    it('does have expected public properties', () => {
        expect(component.colorKeys).toEqual([]);
        expect(component.disabledSet).toEqual([]);
        expect(Array.from(component.filterVisible.keys())).toEqual([component.options.layers[0]._id]);
        expect(component.filterVisible.get(component.options.layers[0]._id)).toEqual(true);
    });

    it('does have expected default layers', () => {
        expect(component.options.layers[0].databases).toEqual(DashboardServiceMock.DATABASES_LIST);
        expect(component.options.layers[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(component.options.layers[0].tables).toEqual(DashboardServiceMock.TABLES_LIST);
        expect(component.options.layers[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(component.options.layers[0].fields).toEqual(DashboardServiceMock.FIELDS);
        expect(component.options.layers[0].title).toEqual('Layer 1');
        expect(component.options.layers[0].idField).toEqual(FieldConfig.get());
        expect(component.options.layers[0].colorField).toEqual(FieldConfig.get());
        expect(component.options.layers[0].hoverPopupField).toEqual(FieldConfig.get());
        expect(component.options.layers[0].dateField).toEqual(FieldConfig.get());
        expect(component.options.layers[0].latitudeField).toEqual(FieldConfig.get());
        expect(component.options.layers[0].longitudeField).toEqual(FieldConfig.get());
        expect(component.options.layers[0].sizeField).toEqual(FieldConfig.get());
    });

    it('should create the default map (Leaflet)', () => {
        expect(getDebug('.leaflet-container')).toBeTruthy();
    });

    it('should create uncollapsed map points, largest first', () => {
        let aHoverMap = new Map<string, number>().set('a', 1);
        let bHoverMap = new Map<string, number>().set('b', 1);
        let cHoverMap = new Map<string, number>().set('c', 1);
        let dHoverMap = new Map<string, number>().set('d', 1);

        let filter1 = new Map<string, any>().set('filterFields', [1]);
        let filter2 = new Map<string, any>().set('filterFields', [1, 2]);
        let filter3 = new Map<string, any>().set('filterFields', [3]);
        let filter4 = new Map<string, any>().set('filterFields', [2, 4]);
        let filter5 = new Map<string, any>().set('filterFields', [5]);

        let colorThemeService = getService(InjectableColorThemeService);

        let aColor = colorThemeService.getColor('myDatabase', 'myTable', 'category', 'a').getComputedCss(
            component.visualization.nativeElement
        );
        let bColor = colorThemeService.getColor('myDatabase', 'myTable', 'category', 'b').getComputedCss(
            component.visualization.nativeElement
        );
        let cColor = colorThemeService.getColor('myDatabase', 'myTable', 'category', 'c').getComputedCss(
            component.visualization.nativeElement
        );
        let dColor = colorThemeService.getColor('myDatabase', 'myTable', 'category', 'd').getComputedCss(
            component.visualization.nativeElement
        );

        let dataset1 = {
            data: [
                { id: 'testId1', lat: 0, lng: 0, category: 'a', hoverPopupField: 'Hover Popup Field:  A', filterFields: [1] },
                { id: 'testId2', lat: 0, lng: 0, category: 'b', hoverPopupField: 'Hover Popup Field:  B', filterFields: [1, 2] },
                { id: 'testId3', lat: 0, lng: 0, category: 'c', hoverPopupField: 'Hover Popup Field:  C', filterFields: [3] },
                { id: 'testId4', lat: 0, lng: 0, category: 'd', hoverPopupField: 'Hover Popup Field:  D', filterFields: [2, 4] },
                { id: 'testId5', lat: 0, lng: 0, category: 'd', hoverPopupField: 'Hover Popup Field:  D', filterFields: [5] }
            ],
            expected: [
                new MapPoint('testId4', ['testId4', 'testId5'], [filter4, filter5], filter4, '0.000\u00b0, 0.000\u00b0', 0, 0, 2,
                    dColor, 'Count: 2', 'category', 'd', dHoverMap),
                new MapPoint('testId1', ['testId1'], [filter1], filter1, '0.000\u00b0, 0.000\u00b0', 0, 0, 1,
                    aColor, 'Count: 1', 'category', 'a', aHoverMap),
                new MapPoint('testId2', ['testId2'], [filter2], filter2, '0.000\u00b0, 0.000\u00b0', 0, 0, 1,
                    bColor, 'Count: 1', 'category', 'b', bHoverMap),
                new MapPoint('testId3', ['testId3'], [filter3], filter3, '0.000\u00b0, 0.000\u00b0', 0, 0, 1,
                    cColor, 'Count: 1', 'category', 'c', cHoverMap)
            ]
        };

        let dataset2 = {
            data: [
                { id: 'testId1', lat: 0, lng: 0, category: 'a', hoverPopupField: 'Hover Popup Field:  A', filterFields: [1] },
                { id: 'testId2', lat: 0, lng: 1, category: 'b', hoverPopupField: 'Hover Popup Field:  B', filterFields: [1, 2] },
                { id: 'testId3', lat: 0, lng: 2, category: 'c', hoverPopupField: 'Hover Popup Field:  C', filterFields: [3] },
                { id: 'testId4', lat: 0, lng: 3, category: 'd', hoverPopupField: 'Hover Popup Field:  D', filterFields: [2, 4] }
            ],
            expected: [
                new MapPoint('testId1', ['testId1'], [filter1], filter1, '0.000\u00b0, 0.000\u00b0', 0, 0, 1,
                    aColor, 'Count: 1', 'category', 'a', aHoverMap),
                new MapPoint('testId2', ['testId2'], [filter2], filter2, '0.000\u00b0, 1.000\u00b0', 0, 1, 1,
                    bColor, 'Count: 1', 'category', 'b', bHoverMap),
                new MapPoint('testId3', ['testId3'], [filter3], filter3, '0.000\u00b0, 2.000\u00b0', 0, 2, 1,
                    cColor, 'Count: 1', 'category', 'c', cHoverMap),
                new MapPoint('testId4', ['testId4'], [filter4], filter4, '0.000\u00b0, 3.000\u00b0', 0, 3, 1,
                    dColor, 'Count: 1', 'category', 'd', dHoverMap)
            ]
        };
        let dataset3 = {
            data: [
                {
                    id: 'testId1',
                    lat: [0, 0, 0, 0],
                    lng: [0, 0, 0, 0],
                    category: 'a',
                    hoverPopupField: 'Hover Popup Field:  A',
                    filterFields: [1]
                },
                {
                    id: 'testId2',
                    lat: [0, 0, 0, 0],
                    lng: [0, 0, 0, 0],
                    category: 'b',
                    hoverPopupField: 'Hover Popup Field:  B',
                    filterFields: [1, 2]
                }
            ],
            expected: [
                new MapPoint('testId1', ['testId1', 'testId1', 'testId1', 'testId1'], [filter1, filter1, filter1, filter1], filter1,
                    '0.000\u00b0, 0.000\u00b0', 0, 0, 4, aColor, 'Count: 4', 'category', 'a', aHoverMap),
                new MapPoint('testId2', ['testId2', 'testId2', 'testId2', 'testId2'], [filter2, filter2, filter2, filter2], filter2,
                    '0.000\u00b0, 0.000\u00b0',
                    0, 0, 4, bColor, 'Count: 4', 'category', 'b', bHoverMap)
            ]
        };
        let dataset4 = {
            data: [
                {
                    id: 'testId1',
                    lat: [0, 0, 0, 0],
                    lng: [0, 1, 2, 3],
                    category: 'a',
                    hoverPopupField: 'Hover Popup Field:  A',
                    filterFields: [1]
                },
                {
                    id: 'testId2',
                    lat: [0, 0, 0, 0],
                    lng: [4, 5, 6, 7],
                    category: 'b',
                    hoverPopupField: 'Hover Popup Field:  B',
                    filterFields: [1, 2]
                }
            ],
            expected: [
                new MapPoint('testId1', ['testId1'], [filter1], filter1, '0.000\u00b0, 3.000\u00b0', 0, 3, 1,
                    aColor, 'Count: 1', 'category', 'a', aHoverMap),
                new MapPoint('testId1', ['testId1'], [filter1], filter1, '0.000\u00b0, 2.000\u00b0', 0, 2, 1,
                    aColor, 'Count: 1', 'category', 'a', aHoverMap),
                new MapPoint('testId1', ['testId1'], [filter1], filter1, '0.000\u00b0, 1.000\u00b0', 0, 1, 1,
                    aColor, 'Count: 1', 'category', 'a', aHoverMap),
                new MapPoint('testId1', ['testId1'], [filter1], filter1, '0.000\u00b0, 0.000\u00b0', 0, 0, 1,
                    aColor, 'Count: 1', 'category', 'a', aHoverMap),
                new MapPoint('testId2', ['testId2'], [filter2], filter2, '0.000\u00b0, 7.000\u00b0', 0, 7, 1,
                    bColor, 'Count: 1', 'category', 'b', bHoverMap),
                new MapPoint('testId2', ['testId2'], [filter2], filter2, '0.000\u00b0, 6.000\u00b0', 0, 6, 1,
                    bColor, 'Count: 1', 'category', 'b', bHoverMap),
                new MapPoint('testId2', ['testId2'], [filter2], filter2, '0.000\u00b0, 5.000\u00b0', 0, 5, 1,
                    bColor, 'Count: 1', 'category', 'b', bHoverMap),
                new MapPoint('testId2', ['testId2'], [filter2], filter2, '0.000\u00b0, 4.000\u00b0', 0, 4, 1,
                    bColor, 'Count: 1', 'category', 'b', bHoverMap)
            ]
        };

        let mapPoints1 = component.getMapPoints('myDatabase', 'myTable', 'id',
            [FieldConfig.get({ columnName: 'filterFields', prettyName: 'Filter Fields' })], 'lng', 'lat',
            'category', FieldConfig.get({ columnName: 'hoverPopupField', prettyName: 'Hover Popup Field' }), dataset1.data);
        expect(mapPoints1).toEqual(dataset1.expected);
        // TODO expect(mapPoints1[0].name).toEqual(dataset1.expected[0].name);
        let mapPoints2 = component.getMapPoints('myDatabase', 'myTable', 'id',
            [FieldConfig.get({ columnName: 'filterFields', prettyName: 'Filter Fields' })], 'lng', 'lat', 'category',
            FieldConfig.get({ columnName: 'hoverPopupField', prettyName: 'Hover Popup Field' }), dataset2.data);
        expect(mapPoints2).toEqual(dataset2.expected);
        let mapPoints3 = component.getMapPoints('myDatabase', 'myTable', 'id',
            [FieldConfig.get({ columnName: 'filterFields', prettyName: 'Filter Fields' })], 'lng', 'lat', 'category',
            FieldConfig.get({ columnName: 'hoverPopupField', prettyName: 'Hover Popup Field' }), dataset3.data);
        expect(mapPoints3).toEqual(dataset3.expected);
        let mapPoints4 = component.getMapPoints('myDatabase', 'myTable', 'id',
            [FieldConfig.get({ columnName: 'filterFields', prettyName: 'Filter Fields' })], 'lng', 'lat', 'category',
            FieldConfig.get({ columnName: 'hoverPopupField', prettyName: 'Hover Popup Field' }), dataset4.data);
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
        let actual1 = (component as any).designEachFilterWithNoValues();
        expect(actual1.length).toEqual(2);
        // Layer 1 box filter
        expect((actual1[0]).fieldKey1).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.Y.columnName);
        expect((actual1[0]).fieldKey2).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.X.columnName);
        expect(actual1[0].begin1).toBeUndefined();
        expect(actual1[0].begin2).toBeUndefined();
        expect(actual1[0].end1).toBeUndefined();
        expect(actual1[0].end2).toBeUndefined();
        // Layer 1 point filter
        expect(actual1[1].type).toEqual('and');
        expect((actual1[1]).fieldKey1).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.Y.columnName);
        expect((actual1[1]).fieldKey2).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.X.columnName);
        expect(actual1[1].operator1).toEqual('=');
        expect(actual1[1].operator2).toEqual('=');
        expect(actual1[1].value1).toBeUndefined();
        expect(actual1[1].value2).toBeUndefined();

        updateMapLayer2(component);
        let actual2 = (component as any).designEachFilterWithNoValues();
        expect(actual2.length).toEqual(4);
        expect(actual2[0]).toEqual(actual1[0]);
        expect(actual2[1]).toEqual(actual1[1]);
        // Layer 2 box filter
        expect((actual2[2]).fieldKey1).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase2.name + '.' + DashboardServiceMock.TABLES.testTable2.name + '.' +
            DashboardServiceMock.FIELD_MAP.Y.columnName);
        expect((actual2[2]).fieldKey2).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase2.name + '.' + DashboardServiceMock.TABLES.testTable2.name + '.' +
            DashboardServiceMock.FIELD_MAP.X.columnName);
        expect(actual2[2].begin1).toBeUndefined();
        expect(actual2[2].begin2).toBeUndefined();
        expect(actual2[2].end1).toBeUndefined();
        expect(actual2[2].end2).toBeUndefined();
        // Layer 2 point filter
        expect(actual2[3].type).toEqual('and');
        expect((actual2[3]).fieldKey1).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase2.name + '.' + DashboardServiceMock.TABLES.testTable2.name + '.' +
            DashboardServiceMock.FIELD_MAP.Y.columnName);
        expect((actual2[3]).fieldKey2).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase2.name + '.' + DashboardServiceMock.TABLES.testTable2.name + '.' +
            DashboardServiceMock.FIELD_MAP.X.columnName);
        expect(actual2[3].operator1).toEqual('=');
        expect(actual2[3].operator2).toEqual('=');
        expect(actual2[3].value1).toBeUndefined();
        expect(actual2[3].value2).toBeUndefined();

        component.options.layers[0].filterFields = [DashboardServiceMock.FIELD_MAP.FILTER];
        let actual3 = (component as any).designEachFilterWithNoValues();
        expect(actual3.length).toEqual(5);
        expect(actual3[0]).toEqual(actual2[0]);
        expect(actual3[1]).toEqual(actual2[1]);
        expect(actual3[3]).toEqual(actual2[2]);
        expect(actual3[4]).toEqual(actual2[3]);
        // Layer 1 filter fields
        expect(actual3[2].type).toEqual('or');
        expect((actual3[2]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase1.name + '.' + DashboardServiceMock.TABLES.testTable1.name + '.' +
            DashboardServiceMock.FIELD_MAP.FILTER.columnName);
        expect(actual3[2].operator).toEqual('=');
        expect(actual3[2].values).toEqual([undefined]);

        component.options.layers[1].filterFields = [DashboardServiceMock.FIELD_MAP.FILTER,
            DashboardServiceMock.FIELD_MAP.NAME,
            DashboardServiceMock.FIELD_MAP.TYPE];
        let actual4 = (component as any).designEachFilterWithNoValues();
        expect(actual4.length).toEqual(8);
        expect(actual4[0]).toEqual(actual3[0]);
        expect(actual4[1]).toEqual(actual3[1]);
        expect(actual4[2]).toEqual(actual3[2]);
        expect(actual4[3]).toEqual(actual3[3]);
        expect(actual4[4]).toEqual(actual3[4]);
        // Layer 2 filter fields
        expect(actual4[5].type).toEqual('or');
        expect((actual4[5]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase2.name + '.' + DashboardServiceMock.TABLES.testTable2.name + '.' +
            DashboardServiceMock.FIELD_MAP.FILTER.columnName);
        expect(actual4[5].operator).toEqual('=');
        expect(actual4[5].values).toEqual([undefined]);
        expect(actual4[6].type).toEqual('or');
        expect((actual4[6]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase2.name + '.' + DashboardServiceMock.TABLES.testTable2.name + '.' +
            DashboardServiceMock.FIELD_MAP.NAME.columnName);
        expect(actual4[6].operator).toEqual('=');
        expect(actual4[6].values).toEqual([undefined]);
        expect(actual4[7].type).toEqual('or');
        expect((actual4[7]).fieldKey).toEqual(DashboardServiceMock.DATASTORE.name + '.' +
            DashboardServiceMock.DATABASES.testDatabase2.name + '.' + DashboardServiceMock.TABLES.testTable2.name + '.' +
            DashboardServiceMock.FIELD_MAP.TYPE.columnName);
        expect(actual4[7].operator).toEqual('=');
        expect(actual4[7].values).toEqual([undefined]);
    });

    it('filterByLocation does call exchangeFilters with filters on each layer', () => {
        let spy = spyOn(component, 'exchangeFilters');

        updateMapLayer1(component);

        let box1 = new BoundingBoxByDegrees(1, 2, 3, 4);
        component.filterByLocation(box1);

        expect(spy.calls.count()).toBe(1);
        expect(spy.calls.argsFor(0)).toEqual([[
            new BoundsFilterDesign(
                DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name + '.' +
                DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.Y.columnName,
                DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name + '.' +
                DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.X.columnName,
                1, 3, 2, 4
            )
        ], [], true]);

        updateMapLayer2(component);

        let box2 = new BoundingBoxByDegrees(5, 6, 7, 8);
        component.filterByLocation(box2);

        expect(spy.calls.count()).toBe(2);
        expect(spy.calls.argsFor(1)).toEqual([[
            new BoundsFilterDesign(
                DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name + '.' +
                DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.Y.columnName,
                DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name + '.' +
                DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.X.columnName,
                5, 7, 6, 8
            ),
            new BoundsFilterDesign(
                DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase2.name + '.' +
                DashboardServiceMock.TABLES.testTable2.name + '.' + DashboardServiceMock.FIELD_MAP.Y.columnName,
                DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase2.name + '.' +
                DashboardServiceMock.TABLES.testTable2.name + '.' + DashboardServiceMock.FIELD_MAP.X.columnName,
                5, 7, 6, 8
            )
        ], [], true]);
    });

    it('filterByMapPoint does call exchangeFilters with filters on each layer', () => {
        let spy = spyOn(component, 'exchangeFilters');

        updateMapLayer1(component);

        component.filterByMapPoint([new Map<string, any>()], 1, 2);

        expect(spy.calls.count()).toBe(1);
        expect(spy.calls.argsFor(0)).toEqual([
            [
                new PairFilterDesign(CompoundFilterType.AND,
                    DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name + '.' +
                    DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.Y.columnName,
                    DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name + '.' +
                    DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.X.columnName,
                    '=', '=', 1, 2)
            ],
            []
        ]);

        updateMapLayer2(component);

        component.filterByMapPoint([new Map<string, any>()], 3, 4);

        expect(spy.calls.count()).toBe(2);
        expect(spy.calls.argsFor(1)).toEqual([
            [
                new PairFilterDesign(CompoundFilterType.AND,
                    DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name + '.' +
                    DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.Y.columnName,
                    DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name + '.' +
                    DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.X.columnName,
                    '=', '=', 3, 4),
                new PairFilterDesign(CompoundFilterType.AND,
                    DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase2.name + '.' +
                    DashboardServiceMock.TABLES.testTable2.name + '.' + DashboardServiceMock.FIELD_MAP.Y.columnName,
                    DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase2.name + '.' +
                    DashboardServiceMock.TABLES.testTable2.name + '.' + DashboardServiceMock.FIELD_MAP.X.columnName,
                    '=', '=', 3, 4)
            ],
            []
        ]);
    });

    it('filterByMapPoint does create filters on filter fields', () => {
        let spy = spyOn(component, 'exchangeFilters');

        updateMapLayer1(component);
        component.options.layers[0].filterFields = [DashboardServiceMock.FIELD_MAP.FILTER];

        let filterDataA = new Map<string, any>();
        filterDataA.set(DashboardServiceMock.FIELD_MAP.FILTER.columnName, 'testFilterA');
        component.filterByMapPoint([filterDataA], 1, 2);

        expect(spy.calls.count()).toBe(1);
        expect(spy.calls.argsFor(0)).toEqual([
            [
                new PairFilterDesign(CompoundFilterType.AND,
                    DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name + '.' +
                    DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.Y.columnName,
                    DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name + '.' +
                    DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.X.columnName,
                    '=', '=', 1, 2),
                new ListFilterDesign(CompoundFilterType.OR,
                    DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name + '.' +
                    DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.FILTER.columnName,
                    '=', ['testFilterA'])
            ],
            []
        ]);

        updateMapLayer2(component);
        component.options.layers[1].filterFields = [DashboardServiceMock.FIELD_MAP.FILTER,
            DashboardServiceMock.FIELD_MAP.NAME,
            DashboardServiceMock.FIELD_MAP.TYPE];

        let filterDataB = new Map<string, any>();
        filterDataB.set(DashboardServiceMock.FIELD_MAP.FILTER.columnName, 'testFilterB');
        filterDataB.set(DashboardServiceMock.FIELD_MAP.NAME.columnName, 'testNameB');
        filterDataB.set(DashboardServiceMock.FIELD_MAP.TYPE.columnName, 'testTypeB');
        let filterDataC = new Map<string, any>();
        filterDataC.set(DashboardServiceMock.FIELD_MAP.NAME.columnName, 'testNameC');
        filterDataC.set(DashboardServiceMock.FIELD_MAP.TYPE.columnName, 'testTypeC');
        component.filterByMapPoint([filterDataB, filterDataC], 3, 4);

        expect(spy.calls.count()).toBe(2);
        expect(spy.calls.argsFor(1)).toEqual([
            [
                new PairFilterDesign(CompoundFilterType.AND,
                    DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name + '.' +
                    DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.Y.columnName,
                    DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name + '.' +
                    DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.X.columnName,
                    '=', '=', 3, 4),
                new ListFilterDesign(CompoundFilterType.OR,
                    DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name + '.' +
                    DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.FILTER.columnName,
                    '=', ['testFilterB']),
                new PairFilterDesign(CompoundFilterType.AND,
                    DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase2.name + '.' +
                    DashboardServiceMock.TABLES.testTable2.name + '.' + DashboardServiceMock.FIELD_MAP.Y.columnName,
                    DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase2.name + '.' +
                    DashboardServiceMock.TABLES.testTable2.name + '.' + DashboardServiceMock.FIELD_MAP.X.columnName,
                    '=', '=', 3, 4),
                new ListFilterDesign(CompoundFilterType.OR,
                    DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase2.name + '.' +
                    DashboardServiceMock.TABLES.testTable2.name + '.' + DashboardServiceMock.FIELD_MAP.FILTER.columnName,
                    '=', ['testFilterB']),
                new ListFilterDesign(CompoundFilterType.OR,
                    DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase2.name + '.' +
                    DashboardServiceMock.TABLES.testTable2.name + '.' + DashboardServiceMock.FIELD_MAP.NAME.columnName,
                    '=', ['testNameB', 'testNameC']),
                new ListFilterDesign(CompoundFilterType.OR,
                    DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase2.name + '.' +
                    DashboardServiceMock.TABLES.testTable2.name + '.' + DashboardServiceMock.FIELD_MAP.TYPE.columnName,
                    '=', ['testTypeB', 'testTypeC'])
            ],
            []
        ]);
    });

    it('filterByMapPoint does delete filters on filter fields', () => {
        let spy = spyOn(component, 'exchangeFilters');

        updateMapLayer1(component);
        component.options.layers[0].filterFields = [DashboardServiceMock.FIELD_MAP.FILTER];

        component.filterByMapPoint([new Map<string, any>()], 1, 2);

        expect(spy.calls.count()).toBe(1);
        expect(spy.calls.argsFor(0)).toEqual([
            [
                new PairFilterDesign(CompoundFilterType.AND,
                    DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name + '.' +
                    DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.Y.columnName,
                    DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name + '.' +
                    DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.X.columnName,
                    '=', '=', 1, 2)
            ], [
                new ListFilterDesign(CompoundFilterType.OR,
                    DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name + '.' +
                    DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.FILTER.columnName,
                    '=', [undefined])
            ]
        ]);

        updateMapLayer2(component);
        component.options.layers[1].filterFields = [DashboardServiceMock.FIELD_MAP.FILTER,
            DashboardServiceMock.FIELD_MAP.NAME,
            DashboardServiceMock.FIELD_MAP.TYPE];

        component.filterByMapPoint([new Map<string, any>()], 3, 4);

        expect(spy.calls.count()).toBe(2);
        expect(spy.calls.argsFor(1)).toEqual([
            [
                new PairFilterDesign(CompoundFilterType.AND,
                    DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name + '.' +
                    DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.Y.columnName,
                    DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name + '.' +
                    DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.X.columnName,
                    '=', '=', 3, 4),
                new PairFilterDesign(CompoundFilterType.AND,
                    DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase2.name + '.' +
                    DashboardServiceMock.TABLES.testTable2.name + '.' + DashboardServiceMock.FIELD_MAP.Y.columnName,
                    DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase2.name + '.' +
                    DashboardServiceMock.TABLES.testTable2.name + '.' + DashboardServiceMock.FIELD_MAP.X.columnName,
                    '=', '=', 3, 4)
            ], [
                new ListFilterDesign(CompoundFilterType.OR,
                    DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name + '.' +
                    DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.FILTER.columnName,
                    '=', [undefined]),
                new ListFilterDesign(CompoundFilterType.OR,
                    DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase2.name + '.' +
                    DashboardServiceMock.TABLES.testTable2.name + '.' + DashboardServiceMock.FIELD_MAP.FILTER.columnName,
                    '=', [undefined]),
                new ListFilterDesign(CompoundFilterType.OR,
                    DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase2.name + '.' +
                    DashboardServiceMock.TABLES.testTable2.name + '.' + DashboardServiceMock.FIELD_MAP.NAME.columnName,
                    '=', [undefined]),
                new ListFilterDesign(CompoundFilterType.OR,
                    DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase2.name + '.' +
                    DashboardServiceMock.TABLES.testTable2.name + '.' + DashboardServiceMock.FIELD_MAP.TYPE.columnName,
                    '=', [undefined])
            ]
        ]);
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

        component.options.searchLimit = 5678;

        let searchObject = new CoreSearch(component.options.layers[0].database.name, component.options.layers[0].table.name);

        expect(JSON.parse(JSON.stringify(component.finalizeVisualizationQuery(component.options.layers[0], searchObject, [])))).toEqual({
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
                        field: 'testYField'
                    },
                    operator: '!=',
                    rhs: null
                }, {
                    type: 'where',
                    lhs: {
                        database: 'testDatabase1',
                        table: 'testTable1',
                        field: 'testXField'
                    },
                    operator: '!=',
                    rhs: null
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

        updateMapLayer2(component);

        searchObject = new CoreSearch(component.options.layers[1].database.name, component.options.layers[1].table.name);

        expect(JSON.parse(JSON.stringify(component.finalizeVisualizationQuery(component.options.layers[1], searchObject, [])))).toEqual({
            selectClause: {
                database: 'testDatabase2',
                table: 'testTable2',
                fieldClauses: []
            },
            whereClause: {
                type: 'and',
                whereClauses: [{
                    type: 'where',
                    lhs: {
                        database: 'testDatabase2',
                        table: 'testTable2',
                        field: 'testYField'
                    },
                    operator: '!=',
                    rhs: null
                }, {
                    type: 'where',
                    lhs: {
                        database: 'testDatabase2',
                        table: 'testTable2',
                        field: 'testXField'
                    },
                    operator: '!=',
                    rhs: null
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

    it('updateLegend does update colorKeys', () => {
        component.updateLegend();
        expect(component.colorKeys).toEqual([]);

        updateMapLayer1(component);
        component.updateLegend();
        expect(component.colorKeys).toEqual(['testDatabase1_testTable1_testCategoryField']);

        updateMapLayer2(component);
        component.updateLegend();
        expect(component.colorKeys).toEqual(['testDatabase1_testTable1_testCategoryField', 'testDatabase2_testTable2_testCategoryField']);
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

    it('redrawFilters with box filter arguments does draw one new filter box', () => {
        component.assignTestMap();
        let mapSpy = component.spyOnTestMap('drawBoundary');

        const layer = new WidgetOptionCollection(component['dataset']);
        layer.longitudeField = DashboardServiceMock.FIELD_MAP.X;
        layer.latitudeField = DashboardServiceMock.FIELD_MAP.Y;
        layer.filterFields = [];
        component.options.layers[0] = layer;

        let testCollection = new FilterCollection();
        spyOn(testCollection, 'getCompatibleFilters').and.callFake((filterDesign) => filterDesign instanceof BoundsFilterDesign ? [
            new BoundsFilter(
                DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name + '.' +
                DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.X.columnName,
                DashboardServiceMock.DATASTORE.name + '.' + DashboardServiceMock.DATABASES.testDatabase1.name + '.' +
                DashboardServiceMock.TABLES.testTable1.name + '.' + DashboardServiceMock.FIELD_MAP.Y.columnName,
                1, 3, 2, 4
            )
        ] : []);

        component['redrawFilters'](testCollection);
        expect(mapSpy.calls.count()).toEqual(1);
    });

    it('redrawFilters with no box filter arguments does remove old filter box', () => {
        component.assignTestMap();
        let mapSpy = component.spyOnTestMap('removeFilterBox');
        component['redrawFilters'](new FilterCollection());
        expect(mapSpy.calls.count()).toEqual(1);
    });

    it('redrawFilters with multiple box filter arguments does draw multiple new filter boxes', () => {
        // TODO THOR-1102
    });

    it('redrawFilters with box filter arguments does draw new filter boxes and remove old filter boxes', () => {
        // TODO THOR-1102
    });

    it('redrawFilters with no point filter arguments does remove old points', () => {
        // TODO THOR-1104
    });

    it('redrawFilters with point filter arguments does draw new points', () => {
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
            TestMapComponent
        ],
        providers: [
            { provide: DashboardService, useClass: DashboardServiceMock },
            InjectableFilterService,
            { provide: AbstractSearchService, useClass: SearchServiceMock },
            InjectableColorThemeService
        ],
        imports: [
            CommonWidgetModule,
            LegendModule
        ]
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestMapComponent);
        component = fixture.componentInstance;
        component.configOptions = {
            tableKey: 'table_key_1',
            layers: [{
                colorField: 'testColorField',
                hoverPopupField: 'testHoverField',
                dateField: 'testDateField',
                latitudeField: 'testLatitudeField',
                longitudeField: 'testLongitudeField',
                sizeField: 'testSizeField',
                title: 'Test Layer Title'
            }],
            limit: 9999,
            clusterPixelRange: 20,
            customServer: { mapUrl: 'testUrl', layer: 'testLayer' },
            disableCtrlZoom: true,
            hoverSelect: { hoverTime: 5 },
            minClusterSize: 10,
            singleColor: true,
            west: 1,
            east: 2,
            south: 3,
            north: 4,
            title: 'Test Title'
        };
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
        expect(component.options.searchLimit).toEqual(9999);
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
        expect(component.options.layers[0].databases).toEqual(DashboardServiceMock.DATABASES_LIST);
        expect(component.options.layers[0].database).toEqual(DashboardServiceMock.DATABASES.testDatabase1);
        expect(component.options.layers[0].tables).toEqual(DashboardServiceMock.TABLES_LIST);
        expect(component.options.layers[0].table).toEqual(DashboardServiceMock.TABLES.testTable1);
        expect(component.options.layers[0].fields).toEqual(DashboardServiceMock.FIELDS);
        expect(component.options.layers[0].title).toEqual('Test Layer Title');
    });
});
