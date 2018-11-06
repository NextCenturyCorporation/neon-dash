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
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostListener,
    Injector,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { ActiveGridService } from '../../services/active-grid.service';
import { Color, ColorSchemeService } from '../../services/color-scheme.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { ExportService } from '../../services/export.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { VisualizationService } from '../../services/visualization.service';

import {
    AbstractMap,
    BoundingBoxByDegrees,
    FilterListener,
    MapPoint,
    MapType,
    MapTypePairs,
    whiteString
} from './map.type.abstract';
import { BaseLayeredNeonComponent, BaseNeonLayer, BaseNeonMultiLayerOptions } from '../base-neon-component/base-layered-neon.component';
import { CesiumNeonMap } from './map.type.cesium';
import { FieldMetaData } from '../../dataset';
import { LeafletNeonMap } from './map.type.leaflet';
import { neonMappings, neonUtilities, neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import * as _ from 'lodash';
import * as geohash from 'geo-hash';

class UniqueLocationPoint {
    constructor(public idField: string, public idList: string[], public lat: number, public lng: number, public count: number,
        public colorField: string, public colorValue: string, public hoverPopupMap: Map<string, number>) { }
}

export class MapLayer extends BaseNeonLayer {
    public idField: FieldMetaData;
    public colorField: FieldMetaData;
    public dateField: FieldMetaData;
    public latitudeField: FieldMetaData;
    public longitudeField: FieldMetaData;
    public sizeField: FieldMetaData;
    public hoverPopupField: FieldMetaData;

    /**
     * Appends all the non-field bindings for the specific layer to the given bindings object and returns the bindings object.
     *
     * @arg {any} bindings
     * @return {any}
     * @override
     */
    appendNonFieldBindings(bindings: any): any {
        return bindings;
    }

    /**
     * Returns the list of field properties for the specific layer.
     *
     * @return {string[]}
     * @override
     */
    getFieldProperties(): string[] {
        return [
            'idField',
            'colorField',
            'dateField',
            'hoverPopupField',
            'latitudeField',
            'longitudeField',
            'sizeField'
        ];
    }

    /**
     * Returns the list of field array properties for the specific layer.
     *
     * @return {string[]}
     * @override
     */
    getFieldArrayProperties(): string[] {
        return [];
    }

    /**
     * Initializes all the non-field bindings for the specific layer.
     *
     * @override
     */
    initializeNonFieldBindings() {
        // Do nothing.
    }
}

export class MapOptions extends BaseNeonMultiLayerOptions {
    public id: string;
    public clustering: string;
    public clusterPixelRange: number;
    public customServer: {
        useCustomServer: boolean,
        mapUrl: string,
        layer: string
    };
    public disableCtrlZoom: boolean;
    public hoverPopupEnabled: boolean;
    public hoverSelect: {
        hoverTime: number;
    };
    public minClusterSize: number;
    public singleColor: boolean;
    public type: MapType | string;

    public west: number;
    public east: number;
    public north: number;
    public south: number;

    public layers: MapLayer[] = [];

    /**
     * Returns the layers for the options.
     *
     * @return {BaseNeonLayer[]}
     * @override
     */
    public getLayers(): BaseNeonLayer[] {
        return this.layers;
    }

    /**
     * Initializes all the non-field bindings for the specific visualization.
     *
     * @override
     */
    public initializeNonFieldBindings() {
        this.clustering = this.injector.get('clustering', 'points');
        this.clusterPixelRange = this.injector.get('clusterPixelRange', 15);
        this.customServer = this.injector.get('customServer', null);
        this.disableCtrlZoom = this.injector.get('disableCtrlZoom', false);
        this.hoverPopupEnabled = this.injector.get('hoverPopupEnabled', false);
        this.hoverSelect = this.injector.get('hoverSelect', null);
        this.minClusterSize = this.injector.get('minClusterSize', 5);
        this.singleColor = this.injector.get('singleColor', false);
        this.type = this.injector.get('mapType', MapType.Leaflet);

        this.west = this.injector.get('west', null);
        this.east = this.injector.get('east', null);
        this.north = this.injector.get('north', null);
        this.south = this.injector.get('south', null);
    }
}

@Component({
    selector: 'app-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapComponent extends BaseLayeredNeonComponent implements OnInit, OnDestroy, AfterViewInit, FilterListener {
    @ViewChild('visualization', { read: ElementRef }) visualization: ElementRef;
    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;

    @ViewChild('mapElement') mapElement: ElementRef;
    @ViewChild('mapOverlay') mapOverlayRef: ElementRef;

    protected FIELD_ID: string = '_id';

    protected filters: {
        id: string,
        fieldsByLayer: {
            latitude: string,
            longitude: string
            prettyLatitude: string,
            prettyLongitude: string
        },
        filterName: string
    }[] = [];

    protected filterHistory = new Array();

    public options: MapOptions;

    public docCount: number[] = [];

    public colorByFields: string[] = [];

    public filterVisible: boolean[] = [];

    public mapTypes = MapTypePairs;

    public previousId = '';

    protected mapObject: AbstractMap;
    protected filterBoundingBox: BoundingBoxByDegrees;

    public disabledSet: [string[]] = [] as [string[]];
    protected defaultActiveColor: Color;

    constructor(
        activeGridService: ActiveGridService,
        connectionService: ConnectionService,
        datasetService: DatasetService,
        filterService: FilterService,
        exportService: ExportService,
        injector: Injector,
        themesService: ThemesService,
        protected colorSchemeService: ColorSchemeService,
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
            ref,
            visualizationService
        );

        (<any> window).CESIUM_BASE_URL = 'assets/Cesium';

        this.options = new MapOptions(this.injector, 'Map', 1000);

        this.subscribeToSelectId(this.getSelectIdCallback());
    }

    /**
     * Converts the given input to a float if it is a string (or to an array of floats if it is an array of strings) and returns the value.
     *
     * @arg {any} input
     * @return {any}
     */
    convertToFloatIfString(input: any): any {
        if (input.constructor.name === 'Array') {
            return input.map((element) => this.convertToFloatIfString(element));
        }
        if (input.constructor.name === 'String') {
            if (parseFloat(input) > -181 && parseFloat(input) < 181) {
                return parseFloat(input);
            }
        }
        return input;
    }

    /**
     * Initializes any map sub-components needed.
     *
     * @override
     */
    subNgOnInit() {
        // Do nothing.
    }

    /**
     * Handles any map component post-initialization behavior needed.
     *
     * @override
     */
    postInit() {
        // There is one layer automatically added
        for (let layer of this.injector.get('layers', [])) {
            this.addLayer(layer);
        }

        this.defaultActiveColor = this.getPrimaryThemeColor();
    }

    /**
     * Removes the map layer at the given index and redraws the map.
     *
     * @arg {number} layerIndex
     * @override
     */
    subRemoveLayer(layerIndex: number) {
        this.options.layers.splice(layerIndex, 1);

        // Update the map
        this.handleChangeData();
    }

    /**
     * Initializes and draws the map.
     */
    ngAfterViewInit() {
        if (!super.isNumber(this.options.type)) {
            this.options.type = MapType[this.options.type] || MapType.Leaflet;
        }
        switch (this.options.type) {
            case MapType.Cesium:
                this.mapObject = new CesiumNeonMap();
                break;
            case MapType.Leaflet:
                this.mapObject = new LeafletNeonMap();
                break;
            default:
                if (!this.mapObject) {
                    this.mapObject = new LeafletNeonMap();
                }
        }

        this.mapObject.initialize(this.mapElement, this.options, this);

        // Draw everything
        this.handleChangeData();
    }

    /**
     * Deletes any map sub-components needed.
     *
     * @override
     */
    subNgOnDestroy() {
        return this.mapObject && this.mapObject.destroy();
    }

    /**
     * Adds a new empty layer for the specific visualization using the given config.
     *
     * @arg {any} config
     * @override
     */
    subAddLayer(config: any) {
        let layer: MapLayer = new MapLayer(config, this.injector, this.datasetService);
        this.options.layers.push(layer);
        this.docCount[this.options.layers.length - 1] = 0;
        this.filterVisible[this.options.layers.length - 1] = true;
    }

    /**
     * Removes the filter boudning box from this component and the map.
     *
     * @private
     */
    private removeFilterBox() {
        delete this.filterBoundingBox;
        return this.mapObject && this.mapObject.removeFilterBox();
    }

    /**
     * Sets the filter bounding box to the given box and adds or replaces the neon map filter.
     *
     * Function for the FilterListener interface.
     *
     * @arg {BoundingBoxByDegrees} box
     * @override
     */
    filterByLocation(box: BoundingBoxByDegrees) {
        this.filterBoundingBox = box;

        let fieldsByLayer = this.options.layers.map((layer) => {
            return {
                latitude: layer.latitudeField.columnName,
                longitude: layer.longitudeField.columnName,
                prettyLatitude: layer.latitudeField.prettyName,
                prettyLongitude: layer.longitudeField.prettyName
            };
        });
        let localLayerName = this.getFilterTextByFields(box, fieldsByLayer);
        let localFilters = this.createFilter(fieldsByLayer, localLayerName);
        this.addLocalFilter(localFilters);
        for (let i = 0; i < localFilters.fieldsByLayer.length; i++) {
            let neonFilters = this.filterService.getFiltersByOwner(this.id);
            let neonFilter = this.createNeonBoxFilter(this.filterBoundingBox, localFilters.fieldsByLayer[i].latitude,
                localFilters.fieldsByLayer[i].longitude);

            if (neonFilters && neonFilters.length) {
                this.filterHistory.push(neonFilters[0]);
                localFilters.id = neonFilters[0].id;
                this.replaceNeonFilter(i, true, localFilters, neonFilter);
            } else {
                this.addNeonFilter(i, true, localFilters, neonFilter);
            }
        }
    }

    filterByMapPoint(lat: number, lon: number) {
        let fieldsByLayer = this.options.layers.map((layer) => {
            return {
                latitude: layer.latitudeField.columnName,
                longitude: layer.longitudeField.columnName,
                prettyLatitude: layer.latitudeField.prettyName,
                prettyLongitude: layer.longitudeField.prettyName
            };
        });
        let localLayerName = 'latitude equals ' + lat + ' and longitude equals ' + lon;
        let localFilters = this.createFilter(fieldsByLayer, localLayerName);
        this.addLocalFilter(localFilters);
        for (let i = 0; i < localFilters.fieldsByLayer.length; i++) {
            let neonFilters = this.filterService.getFiltersByOwner(this.id);
            let neonFilter = this.createNeonPointFilter(lat, lon, localFilters.fieldsByLayer[i].latitude,
                localFilters.fieldsByLayer[i].longitude);

            if (neonFilters && neonFilters.length) {
                this.filterHistory.push(neonFilters[0]);
                localFilters.id = neonFilters[0].id;
                this.replaceNeonFilter(i, true, localFilters, neonFilter);
            } else {
                this.addNeonFilter(i, true, localFilters, neonFilter);
            }
        }
    }

    /**
     * Creates and returns a filter object with the given fields and name.
     *
     * @arg {array} fieldsByLayer
     * @arg {string} name
     * @return {any}
     */
    createFilter(fieldsByLayer, name): any {
        return {
            id: undefined,
            fieldsByLayer: fieldsByLayer,
            filterName: name
        };
    }

    /**
     * Adds the given filter object to the map's list of filter objects.
     *
     * @arg {object} filter
     */
    addLocalFilter(filter) {
        this.filters[0] = filter;
    }

    /**
     * Creates and returns the neon filter object using the given bounding box, latitude field, and longitude field.
     *
     * @arg {BoundingBoxByDegrees} boundingBox
     * @arg {string} latitudeField
     * @arg {string} longitudeField
     * @return {neon.query.WherePredicate}
     */
    createNeonBoxFilter(boundingBox: BoundingBoxByDegrees, latitudeField: string, longitudeField: string): neon.query.WherePredicate {
        let filterClauses = [
            neon.query.where(latitudeField, '>=', boundingBox.south),
            neon.query.where(latitudeField, '<=', boundingBox.north),
            neon.query.where(longitudeField, '>=', boundingBox.west),
            neon.query.where(longitudeField, '<=', boundingBox.east)
        ];
        return neon.query.and.apply(neon.query, filterClauses);
    }

    createNeonPointFilter(lat: number, lon: number, latitudeField: string, longitudeField: string): neon.query.WherePredicate {
        return neon.query.and(
            neon.query.where(latitudeField, '=', lat),
            neon.query.where(longitudeField, '=', lon)
        );
    }

    /**
     * Returns the map filter text using the given fields.
     *
     * @arg {BoundingBoxByDegrees} box
     * @arg {array} fieldsByLayer
     * @return {string}
     */
    getFilterTextByFields(box: BoundingBoxByDegrees, fieldsByLayer: any[]): string {
        if (fieldsByLayer.length === 1) {
            return this.getFilterTextForLayer(box, fieldsByLayer[0]);
        }
        return 'latitude from ' + box.south + ' to ' + box.north + ' and longitude from ' + box.west + ' to ' + box.east;
    }

    /**
     * Returns the map filter text for the map layer at the given index.
     *
     * @arg {BoundingBoxByDegrees} box
     * @arg {object} fieldsByLayer
     * @return {string}
     */
    getFilterTextForLayer(box: BoundingBoxByDegrees, fieldsByLayer: any): string {
        return fieldsByLayer.prettyLatitude + ' from ' + box.south + ' to ' + box.north + ' and ' + fieldsByLayer.prettyLongitude +
            ' from ' + box.west + ' to ' + box.east;
    }

    /**
     * Returns the filter text for the given filter object.
     *
     * @arg {any} filter
     * @return {string}
     * @override
     */
    getFilterText(filter: any): string {
        return filter.filterName || '';
    }

    /**
     * Returns the map filter detail.
     *
     * @return {string}
     */
    getFilterDetail(): string {
        return (!this.mapObject || this.mapObject.isExact()) ? '' :
            ' *Filter was altered outside of Map visualization and selection rectangle may not accurately represent filter.';
    }

    /**
     * Returns the list of filters for the map to ignore (null to ignore no filters).
     *
     * @return {null}
     * @override
     */
    getFiltersToIgnore() {
        return null;
    }

    /**
     * Returns whether the fields for the map layer at the given index are valid.
     *
     * @arg {number} layerIndex
     * @return {boolean}
     * @override
     */
    isValidQuery(layerIndex: number): boolean {
        let valid = true;
        valid = (this.options.layers[layerIndex].database && this.options.layers[layerIndex].database.name && valid);
        valid = (this.options.layers[layerIndex].table && this.options.layers[layerIndex].table.name && valid);
        valid = (this.options.layers[layerIndex].longitudeField && this.options.layers[layerIndex].longitudeField.columnName && valid);
        valid = (this.options.layers[layerIndex].latitudeField && this.options.layers[layerIndex].latitudeField.columnName && valid);
        return !!valid;
    }

    /**
     * Creates and returns the query for the map layer at the given index.
     *
     * @arg {number} layerIndex
     * @return {neon.query.Query}
     * @override
     */
    createQuery(layerIndex: number): neon.query.Query {
        let idField = this.options.layers[layerIndex].idField.columnName;
        let latitudeField = this.options.layers[layerIndex].latitudeField.columnName;
        let longitudeField = this.options.layers[layerIndex].longitudeField.columnName;
        let colorField = this.options.layers[layerIndex].colorField.columnName;
        let sizeField = this.options.layers[layerIndex].sizeField.columnName;
        let dateField = this.options.layers[layerIndex].dateField.columnName;
        let hoverPopupField = this.options.layers[layerIndex].hoverPopupField.columnName;

        let fields = [this.FIELD_ID, latitudeField, longitudeField];

        if (idField) {
            fields.push(idField);
        }
        if (colorField) {
            fields.push(colorField);
        }
        if (sizeField) {
            fields.push(sizeField);
        }
        if (dateField) {
            fields.push(dateField);
        }
        if (hoverPopupField) {
            fields.push(hoverPopupField);
        }

        return this.createBasicQuery(layerIndex).withFields(fields).limit(this.options.limit);
    }

    legendItemSelected(event: any) {
        let fieldName: string = event.fieldName;
        let value: string = event.value;
        let currentlyActive: boolean = event.currentlyActive;

        if (currentlyActive) {
            for (let layer of this.options.layers) {
                if (layer.colorField.columnName === fieldName) {
                    this.mapObject.hidePoints(layer, value);
                }
            }

            // Mark it as disabled
            this.disabledSet.push([fieldName, value]);
        } else {
            for (let layer of this.options.layers) {
                if (layer.colorField.columnName === fieldName) {
                    this.mapObject.unhidePoints(layer, value);
                }
            }

            // Mark it as active again
            this.disabledSet = this.disabledSet.filter((set) => {
                return !(set[0] === fieldName && set[1] === value);
            }) as [string[]];
        }
    }

    /**
     * Creates and returns the map points in the given data using the given fields.
     *
     * @arg {string} lngField
     * @arg {string} latField
     * @arg {string} colorField
     * @arg {string} hoverPopupField
     * @arg {array} data
     * @return {array}
     * @protected
     */

    protected getMapPoints(idField: string, lngField: string, latField: string, colorField: string,
        hoverPopupField: string, data: any[]): any[] {

        let map = new Map<string, UniqueLocationPoint>();

        for (let point of data) {
            let lngCoord = this.convertToFloatIfString(neonUtilities.deepFind(point, lngField)),
                latCoord = this.convertToFloatIfString(neonUtilities.deepFind(point, latField)),
                colorValue = neonUtilities.deepFind(point, colorField),
                idValue = neonUtilities.deepFind(point, idField),
                hoverPopupValue = hoverPopupField ? neonUtilities.deepFind(point, hoverPopupField) : '';

            //use first value if deepFind returns an array
            colorValue = colorValue instanceof Array ? (colorValue.length ? colorValue[0] : '') : colorValue;
            idValue = idValue instanceof Array ? (idValue.length ? idValue[0] : '') : idValue;

            if (latCoord instanceof Array && lngCoord instanceof Array) {
                for (let pos = latCoord.length - 1; pos >= 0; pos--) {

                    //check if hover popup value is nested within coordinate array
                    if (hoverPopupValue instanceof Array) {
                        this.addOrUpdateUniquePoint(map, idValue, latCoord[pos], lngCoord[pos], colorField, colorValue,
                            hoverPopupValue[pos]);
                    } else {
                        this.addOrUpdateUniquePoint(map, idValue, latCoord[pos], lngCoord[pos], colorField, colorValue,
                            hoverPopupValue);
                    }
                }
            } else {
                this.addOrUpdateUniquePoint(map, idValue, latCoord, lngCoord, colorField, colorValue, hoverPopupValue);
            }
        }

        let mapPoints: MapPoint[] = [];
        let rgbColor = this.defaultActiveColor.toRgb();
        map.forEach((unique) => {
            let color = rgbColor;
            if (!this.options.singleColor) {
                color = unique.colorValue ? this.colorSchemeService.getColorFor(colorField, unique.colorValue).toRgb() : whiteString;
            }

            mapPoints.push(
                new MapPoint(unique.idField, unique.idList, `${unique.lat.toFixed(3)}\u00b0, ${unique.lng.toFixed(3)}\u00b0`,
                    unique.lat, unique.lng, unique.count, color,
                    'Count: ' + unique.count,
                    unique.colorField, unique.colorValue, unique.hoverPopupMap
                ));
        });
        mapPoints.sort((a, b) => b.count - a.count);
        return mapPoints;
    }

    /**
     * Handles the query results for the map layer at the given index and draws the map.
     *
     * @arg {number} layerIndex
     * @arg {any} response
     * @override
     */
    onQuerySuccess(layerIndex: number, response: any) {
        if (response.data.length === 1 && response.data[0]._docCount !== undefined) {
            this.docCount[layerIndex] = response.data[0]._docCount;
            return;
        }

        // TODO Need to either preprocess data to get color, size scales OR see if neon aggregations can give ranges.
        // TODO break this function into smaller bits so it is more understandable.

        if (!this.mapObject) {
            return;
        }

        //check if colorField was not defines or (None)
        if (this.options.layers[layerIndex].colorField.columnName === '') {
            this.options.singleColor = true;
        } else {
            this.options.singleColor = false;
        }

        let layer = this.options.layers[layerIndex],
            mapPoints = this.getMapPoints(
                layer.idField.columnName,
                layer.longitudeField.columnName,
                layer.latitudeField.columnName,
                layer.colorField.columnName,
                layer.hoverPopupField.columnName,
                response.data
            );

        // Unhide all points
        for (let currentLayer of this.options.layers) {
            this.mapObject.unhideAllPoints(currentLayer);
        }

        this.mapObject.clearLayer(layer);
        this.mapObject.addPoints(mapPoints, layer, this.options.clustering === 'clusters');

        this.filterMapForLegend();
        this.updateLegend();
        this.runDocumentCountQuery(layerIndex);
    }

    /**
     * Updates the map legend using the layers.
     */
    updateLegend() {
        let colorByFields: string[] = [];
        for (let layer of this.options.layers) {
            if (layer.colorField.columnName !== '') {
                colorByFields.push(layer.colorField.columnName);
            }
        }
        this.colorByFields = colorByFields;
    }

    /**
     * Filters out the disabledSets from the legend after QuerySucess (keeps the disabled sets after a filter is set)
     */
    filterMapForLegend() {
        for (let disabledField of this.disabledSet) {
            let fieldName = disabledField[0];
            let value = disabledField[1];
            for (let layer of this.options.layers) {
                if (layer.colorField.columnName === fieldName) {
                    this.mapObject.hidePoints(layer, value);
                }
            }
        }
    }

    addOrUpdateUniquePoint(map: Map<string, UniqueLocationPoint>, idValue: string, lat: number, lng: number, colorField: string,
         colorValue: string, hoverPopupValue: string) {

        if (!super.isNumber(lat) || !super.isNumber(lng)) {
            return;
        }

        let hashCode = geohash.encode(lat, lng) + ' - ' + colorValue,
            obj = map.get(hashCode);

        //check if point has already been created
        if (!obj) {

            let idList: string[] = [];
            idList.push(idValue);  //store the id of the unique point

            let hoverPopupMap = new Map<string, number>();

            if (hoverPopupValue) { hoverPopupMap.set(hoverPopupValue, 1); } //add to map if hover value exists

            obj = new UniqueLocationPoint(idValue, idList, lat, lng, 1, colorField, colorValue, hoverPopupMap);
            map.set(hashCode, obj);
        } else {
            obj.idList.push(idValue); //add the id to the list of points
            obj.count++;

            //check if popup value already exists increase count in map
            if (hoverPopupValue && (obj.hoverPopupMap.has(hoverPopupValue)))  {
                    obj.hoverPopupMap.set(hoverPopupValue, obj.count);
            }
        }

    }

    /**
     * Refreshes the map.
     *
     * @override
     */
    refreshVisualization() {
        // Cesium doesn't need to be refreshed manually
    }

    /**
     * Returns whether the map layer at the given index has a filter.
     *
     * @arg {number} layerIndex
     * @return {boolean}
     */
    doesLayerStillHaveFilter(layerIndex: number): boolean {
        let fields = [this.options.layers[layerIndex].latitudeField.columnName,
        this.options.layers[layerIndex].longitudeField.columnName];
        let neonFilters = this.filterService.getFiltersForFields(this.options.layers[layerIndex].database.name,
            this.options.layers[layerIndex].table.name, fields);
        return neonFilters && neonFilters.length > 0;
    }

    getClausesFromFilterWithIdenticalArguments(filters, args: string[]) {
        if (filters && filters.length > 0) {
            for (let filter of filters) {
                let clauses;
                if (filter.filter.whereClause.type === 'and') {
                    clauses = filter.filter.whereClause.whereClauses;
                } else if (args.length === 1) {
                    // if it is not an 'and' and only has 1 where class.
                    // This shouldn't be used in map, but may be used more generically.
                    clauses = [filter.filter.whereClause];
                }
                let done = clauses && clauses.length > 0;
                for (let where of clauses) {
                    if (args.indexOf(where.lhs) === -1) {
                        done = false;
                        break;
                    }
                }
                if (done) {
                    return clauses;
                }
            }
        }
        return null;
    }

    hasLayerFilterChanged(layerIndex: number): boolean {
        let filterChanged = true;
        let fields = [this.options.layers[layerIndex].latitudeField.columnName,
        this.options.layers[layerIndex].longitudeField.columnName];
        let neonFilters = this.filterService.getFiltersForFields(this.options.layers[layerIndex].database.name,
            this.options.layers[layerIndex].table.name, fields);
        let clauses = this.getClausesFromFilterWithIdenticalArguments(neonFilters, [
            this.options.layers[layerIndex].latitudeField.columnName,
            this.options.layers[layerIndex].longitudeField.columnName
        ]);
        if (clauses && this.filterBoundingBox) {
            let values = [this.filterBoundingBox.north, this.filterBoundingBox.south, this.filterBoundingBox.east,
            this.filterBoundingBox.west];
            // TODO FIX THE NEXT LINE!!!!
            let emptyIfUnchanged = clauses.filter((cl) => (values.indexOf(cl.rhs) === -1));
            return emptyIfUnchanged.length > 0;
        }
        return true;
    }

    /**
     * Creates filters on init if needed.
     *
     * @override
     */
    setupFilters() {
        // Get neon filters
        // See if any neon filters are local filters and set/clear appropriately
        // TODO needs to be reworked now that we have layers.
        // I'm not sure what it even should do from a user perspective.
        let allLayersHaveFilters = true;
        let oneOrMoreLayersHaveFilters = false;
        let oneOrMoreFiltersHaveChanged = false;
        for (let i = 0; i < this.options.layers.length; i++) {
            let layerHasFilter: boolean = this.doesLayerStillHaveFilter(i);
            oneOrMoreLayersHaveFilters = oneOrMoreLayersHaveFilters || layerHasFilter;
            allLayersHaveFilters = allLayersHaveFilters && layerHasFilter;
            let filterHasChanged = this.hasLayerFilterChanged(i);
            oneOrMoreFiltersHaveChanged = oneOrMoreFiltersHaveChanged || filterHasChanged;
        }
        if (!oneOrMoreLayersHaveFilters) {
            // aka no layers have filters
            this.filters = [];
            this.removeFilterBox();
        } else if (oneOrMoreFiltersHaveChanged && this.mapObject && this.filterBoundingBox) {
            this.mapObject.markInexact();
        }
    }

    /**
     * Redraws the map using the given map type.
     *
     * @arg {MapType} mapType
     */
    handleChangeMapType(mapType: MapType) {
        if (this.options.type !== mapType) {
            this.options.type = mapType;
            if (this.mapObject) {
                this.mapObject.destroy();
            }
            this.ngAfterViewInit(); // re-initialize map
        }
    }

    /**
     * Returns the list of filter objects.
     *
     * @return {array}
     * @override
     */
    getCloseableFilters(): object[] {
        return this.filters;
    }

    /**
     * Removes the map component filter and bounding box.
     */
    removeFilter(): void {
        this.filters = [];
        this.removeFilterBox();
    }

    /**
     * Removes the map component filter and neon filter.
     */
    handleRemoveFilter(filter: any): void {
        let neonFilters = this.filterService.getFiltersByOwner(this.id);
        this.filterHistory.push(neonFilters[0]);
        for (let i = 0; i < this.options.layers.length; i++) {
            this.removeLocalFilterFromLocalAndNeon(i, filter, true, false);
        }
        this.removeFilter();
    }

    /**
     * Toggles the visibility of the filter at the given index.
     *
     * @arg {number} index
     */
    toggleFilter(index: number): void {
        this.filterVisible[index] = !(this.filterVisible[index]);
    }

    /**
     * Returns the icon for the filter at the given index.
     *
     * @arg {number} index
     * @return {string}
     */
    getIconForFilter(index: number): string {
        return this.filterVisible[index] ? 'keyboard_arrow_up' : 'keyboard_arrow_down';
    }

    /**
     * Resizes the map.
     */
    onResizeStop(): void {
        super.onResizeStop();
        if (this.mapObject) {
            this.mapObject.sizeChanged();
        }
    }

    /**
     * Creates and returns the basic query for the data aggregation query or the document count query for the layer at the given index.
     *
     * @arg {number} layerIndex
     * @return {neon.query.Query}
     */
    createBasicQuery(layerIndex: number): neon.query.Query {
        let databaseName = this.options.layers[layerIndex].database.name;
        let tableName = this.options.layers[layerIndex].table.name;

        let latitudeField = this.options.layers[layerIndex].latitudeField.columnName;
        let longitudeField = this.options.layers[layerIndex].longitudeField.columnName;

        let whereClauses = [];
        whereClauses.push(neon.query.where(latitudeField, '!=', null));
        whereClauses.push(neon.query.where(longitudeField, '!=', null));
        let whereClause = neon.query.and.apply(neon.query, whereClauses);

        return new neon.query.Query().selectFrom(databaseName, tableName).where(whereClause);
    }

    /**
     * Creates and returns the text for the settings button.
     *
     * @return {string}
     * @override
     */
    getButtonText(): string {
        let prettifyInteger = super.prettifyInteger;
        let createButtonText = (count, limit) => {
            if (!count) {
                return 'No Data';
            }
            return (limit < count ? prettifyInteger(limit) + ' of ' : 'Total ') + prettifyInteger(count);
        };

        if (this.options.layers.length === 1) {
            return createButtonText(this.docCount[0], this.options.limit);
        }
        if (this.options.layers.length) {
            return this.options.layers.map((layer, index) => {
                return layer.title + ' (' + createButtonText(this.docCount[index], this.options.limit) + ')';
            }).filter((text) => {
                return !!text;
            }).join(', ');
        }
        return '';
    }

    /**
     * Creates and executes the document count query for the layer at the given index.
     *
     * @arg {number} layerIndex
     */
    runDocumentCountQuery(layerIndex: number): void {
        let query = this.createBasicQuery(layerIndex).aggregate(neonVariables.COUNT, '*', '_docCount');
        this.executeQuery(layerIndex, query);
    }

    /**
     * Returns an object containing the ElementRef objects for the visualization.
     *
     * @return {any} Object containing:  {ElementRef} headerText, {ElementRef} infoText, {ElementRef} visualization
     * @override
     */
    getElementRefs() {
        return {
            visualization: this.visualization,
            headerText: this.headerText,
            infoText: this.infoText
        };
    }

    /**
     * Creates and returns the callback function for a select_id event.
     *
     * @arg {number}
     * @return {function}
     * @private
     */
    private getSelectIdCallback() {
        return (eventMessage) => {

            //get the message id and set it
            this.options.id = Array.isArray(eventMessage.id) ? eventMessage.id[0] : eventMessage.id;

            //loop through all of the layers
            this.options.layers.forEach((elem, index) => {

                //check if database and table exists in the current layer
                if ((eventMessage.database === elem.database.name) && (eventMessage.table === elem.table.name)) {

                    if (this.options.id !== this.previousId) {
                        this.previousId = this.options.id;
                        this.executeQueryChain(index);
                    }
                }

                //reset previousId for next layer
                this.previousId = '';
            });
        };
    }

    /**
     * Returns the options for the specific visualization.
     *
     * @return {BaseNeonMultiLayerOptions}
     * @override
     */
    getOptions(): BaseNeonMultiLayerOptions {
        return this.options;
    }

    mouseWheelUp(e) {
        const action = (this.shouldZoom(e)
            ? this.mapObject.zoomIn()
            : this.overlay()
        );
    }

    mouseWheelDown(e) {
        const action = (this.shouldZoom(e)
            ? this.mapObject.zoomOut()
            : this.overlay()
        );
    }

    shouldZoom(e) {
        const ctrlMetaPressed = e.ctrlKey || e.metaKey;
        const usingLeaflet = this.options.type === MapType.Leaflet;
        const ctrlZoomEnabled = !this.options.disableCtrlZoom;
        return (ctrlMetaPressed && ctrlZoomEnabled && usingLeaflet);
    }

    overlay() {
        this.mapOverlayRef.nativeElement.style.zIndex = '1000';
        setTimeout(
            () => { this.mapOverlayRef.nativeElement.style.zIndex = '-1'; },
            1400);
    }

    getOverlayText() {
        return (
            navigator.platform.toLowerCase().includes('mac')
                ? 'Use ⌘ + scroll wheel to zoom'
                : 'Use ctrl + scroll wheel to zoom'
        );
    }
}
