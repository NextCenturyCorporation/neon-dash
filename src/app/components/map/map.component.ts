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
import { VisualizationService } from '../../services/visualization.service';

import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    Injector,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';
import { ThemesService } from '../../services/themes.service';
import { Color, ColorSchemeService } from '../../services/color-scheme.service';
import { FieldMetaData } from '../../dataset';
import { neonMappings, neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import { BaseLayeredNeonComponent } from '../base-neon-component/base-layered-neon.component';
import * as _ from 'lodash';
import * as geohash from 'geo-hash';
import { CesiumNeonMap } from './map.type.cesium';
import {
    AbstractMap,
    BoundingBoxByDegrees,
    FilterListener,
    MapLayer,
    MapPoint,
    MapType,
    MapTypePairs,
    OptionsFromConfig,
    whiteString
} from './map.type.abstract';
import { LeafletNeonMap } from './map.type.leaflet';

class UniqueLocationPoint {
    constructor(public lat: number, public lng: number, public count: number,
        public colorField: string, public colorValue: string) {}
}

@Component({
    selector: 'app-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapComponent extends BaseLayeredNeonComponent implements OnInit, OnDestroy, AfterViewInit, FilterListener {
        @ViewChild('visualization', {read: ElementRef}) visualization: ElementRef;
        @ViewChild('headerText') headerText: ElementRef;
        @ViewChild('infoText') infoText: ElementRef;

        @ViewChild('mapElement') mapElement: ElementRef;

        protected FIELD_ID: string;
        protected filters: {
            id: string,
            fieldsByLayer: {
                latField: string,
                lonField: string
            },
            filterName: string
        }[];

        public active: {
            layers: MapLayer[],
            andFilters: boolean,
            limit: number,
            newLimit: number,
            filterable: boolean,
            data: number[][],
            unusedColors: string[],
            nextColorIndex: number,
            clustering: string,
            minClusterSize: number,
            clusterPixelRange: number
        };

        public colorByFields: string[] = [];

        public filterVisible: boolean[] = [];

        public mapTypes = MapTypePairs;

        protected colorSchemeService: ColorSchemeService;

        public optionsFromConfig: OptionsFromConfig;
        protected mapObject: AbstractMap;
        protected filterBoundingBox: BoundingBoxByDegrees;

        public disabledSet: [string[]] = [] as [string[]];
        protected defaultActiveColor: Color;

        constructor(activeGridService: ActiveGridService, connectionService: ConnectionService, datasetService: DatasetService,
            filterService: FilterService, exportService: ExportService, injector: Injector, themesService: ThemesService,
            colorSchemeSrv: ColorSchemeService, ref: ChangeDetectorRef, visualizationService: VisualizationService) {
            super(activeGridService, connectionService, datasetService, filterService,
                exportService, injector, themesService, ref, visualizationService);
            (<any> window).CESIUM_BASE_URL = 'assets/Cesium';
            this.colorSchemeService = colorSchemeSrv;
            this.FIELD_ID = '_id';
            this.optionsFromConfig = {
                title: this.injector.get('title', null),
                database: this.injector.get('database', null),
                table: this.injector.get('table', null),
                limit: this.injector.get('limit', 1000),
                unsharedFilterField: {},
                unsharedFilterValue: '',
                layers: this.injector.get('layers', []),
                clustering: this.injector.get('clustering', 'points'),
                minClusterSize: this.injector.get('minClusterSize', 5),
                clusterPixelRange: this.injector.get('clusterPixelRange', 15),
                hoverSelect: this.injector.get('hoverSelect', null),
                hoverPopupEnabled: this.injector.get('hoverPopupEnabled', false),
                west: this.injector.get('west', null),
                east: this.injector.get('east', null),
                north: this.injector.get('north', null),
                south: this.injector.get('south', null),
                customServer: this.injector.get('customServer', {}),
                mapType: this.injector.get('mapType', MapType.Leaflet),
                singleColor: this.injector.get('singleColor', false)
            };

            this.filters = [];

            this.active = {
                layers: [],
                andFilters: true,
                limit: this.optionsFromConfig.limit,
                newLimit: this.optionsFromConfig.limit,
                filterable: true,
                data: [],
                nextColorIndex: 0,
                unusedColors: [],
                clustering: this.optionsFromConfig.clustering,
                minClusterSize: this.optionsFromConfig.minClusterSize,
                clusterPixelRange: this.optionsFromConfig.clusterPixelRange
            };
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
            for (let i = 1; i < this.optionsFromConfig.layers.length; i++) {
                this.addEmptyLayer();
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
            this.active.layers.splice(layerIndex, 1);

            // Update the map
            this.handleChangeData();
        }

        /**
         * Sets the properties in the given bindings for the map.
         *
         * @arg {any} bindings
         * @override
         */
        subGetBindings(bindings: any) {
            bindings.limit = this.active.limit;
            // The map layers objects are different, clear out the old stuff;
            bindings.layers = [];
            for (let layer of this.active.layers) {
                bindings.layers.push({
                    title: layer.title,
                    latitudeField: layer.latitudeField.columnName,
                    longitudeField: layer.longitudeField.columnName,
                    sizeField: layer.sizeField.columnName,
                    colorField: layer.colorField.columnName,
                    dateField: layer.dateField.columnName
                });
            }
        }

        /**
         * Initializes and draws the map.
         */
        ngAfterViewInit() {
            let type = this.optionsFromConfig.mapType;
            if (!super.isNumber(type)) {
                type = MapType[type] || MapType.Leaflet;
                this.optionsFromConfig.mapType = type;
            }
            switch (type) {
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

            this.mapObject.initialize(this.mapElement, this.optionsFromConfig, this);

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
         * Returns the option for the given property from the map config.
         *
         * @arg {string} option
         * @return {any}
         * @override
         */
        getOptionFromConfig(option: string): any {
            return this.optionsFromConfig[option];
        }

        /**
         * Adds a new empty map layer.
         *
         * @override
         */
        subAddEmptyLayer() {
            this.active.layers.push({
                title: '',
                latitudeField: new FieldMetaData(),
                longitudeField: new FieldMetaData(),
                colorField: new FieldMetaData(),
                sizeField: new FieldMetaData(),
                dateField: new FieldMetaData()
            });
            this.filterVisible[this.active.layers.length - 1] = true;
        }

        /**
         * Returns the map export fields for the map layer at the given index.
         *
         * @arg {number} layerIndex
         * @return {array}
         * @override
         */
        getExportFields(layerIndex: number): any[] {
            let usedFields = [this.active.layers[layerIndex].latitudeField,
                this.active.layers[layerIndex].longitudeField,
                this.active.layers[layerIndex].colorField,
                this.active.layers[layerIndex].sizeField,
                this.active.layers[layerIndex].dateField];
            return usedFields
                .filter((header) => header && header.columnName)
                .map((header) => {
                    return {
                        columnName: header.columnName,
                        prettyName: header.prettyName
                    };
                });
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
         * Updates the fields for the map layer contained within the given object.
         *
         * @arg {any} metaObject
         * @override
         */
        onUpdateFields(metaObject: any) {
            let layer = this.active.layers[metaObject.index];
            layer.latitudeField = this.findFieldObject(metaObject.index, 'latitudeField', neonMappings.LATITUDE);
            layer.longitudeField = this.findFieldObject(metaObject.index, 'longitudeField', neonMappings.LONGITUDE);
            layer.sizeField = this.findFieldObject(metaObject.index, 'sizeField');
            layer.colorField = this.findFieldObject(metaObject.index, 'colorField');
            layer.dateField = this.findFieldObject(metaObject.index, 'dateField', neonMappings.DATE);

            // Get the title from the options, if it exists
            if (metaObject.index >= this.optionsFromConfig.layers.length ||
                !this.optionsFromConfig.layers[metaObject.index] || !this.optionsFromConfig.layers[metaObject.index].title) {
                layer.title = this.optionsFromConfig.title;
            } else {
                layer.title = this.optionsFromConfig.layers[metaObject.index].title;
            }
            if (!layer.title || layer.title === '') {
                layer.title = 'New Layer';
            }
        }

        /**
         * Finds and returns the field object for the map layer at the given index with the given binding key or mapping key.
         *
         * @arg {number} layerIndex
         * @arg {string} bindingKey
         * @arg {string} mappingKey
         * @return {FieldMetaData}
         */
        findFieldObject(layerIndex: number, bindingKey: string, mappingKey?: string): FieldMetaData {
            // If there are no layers or the index is past the end of the layers in the config, default to the original
            if (layerIndex >= this.optionsFromConfig.layers.length || !bindingKey
                || !this.optionsFromConfig.layers[layerIndex][bindingKey]) {
                return super.findFieldObject(layerIndex, bindingKey, mappingKey);
            }

            let find = (name) => {
                return _.find(this.meta.layers[layerIndex].fields, (field) => {
                    return field.columnName === name;
                });
            };

            return find(this.optionsFromConfig.layers[layerIndex][bindingKey]) || this.getBlankField();
        }

        /**
         * Sets the filter bounding box to the given box and adds or replaces the neon map filter.
         *
         * @arg {BoundingBoxByDegrees} box
         */
        filterByLocation(box: BoundingBoxByDegrees) {
            this.filterBoundingBox = box;

            let fieldsByLayer = this.active.layers.map((l) => {
                return {
                    latitudeName: l.latitudeField.columnName,
                    longitudeName: l.longitudeField.columnName
                };
            });
            let localLayerName = this.getFilterTextByFields(fieldsByLayer);
            let localFilters = this.createFilter(fieldsByLayer, localLayerName);
            this.addLocalFilter(localFilters);
            for (let i = 0; i < localFilters.fieldsByLayer.length; i++) {
                let neonFilters = this.filterService.getFiltersByOwner(this.id);
                if (neonFilters && neonFilters.length) {
                    localFilters.id = neonFilters[0].id;
                    this.replaceNeonFilter(i, true, localFilters);
                } else {
                    this.addNeonFilter(i, true, localFilters);
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
         * Creates and returns the neon filter clause object using the given database, table, and latitude/longitude fields.
         *
         * @arg {string} database
         * @arg {string} table
         * @arg {array} latLonFieldNames
         * @return {object}
         * @override
         */
        createNeonFilterClauseEquals(database: string, table: string, latLonFieldNames: string[]): object {
            let filterClauses = [];
            let latField = latLonFieldNames[0];
            let lonField = latLonFieldNames[1];
            let minLat = this.filterBoundingBox.south;
            let maxLat = this.filterBoundingBox.north;
            let minLon = this.filterBoundingBox.west;
            let maxLon = this.filterBoundingBox.east;
            filterClauses[0] = neon.query.where(latField, '>=', minLat);
            filterClauses[1] = neon.query.where(latField, '<=', maxLat);
            filterClauses[2] = neon.query.where(lonField, '>=', minLon);
            filterClauses[3] = neon.query.where(lonField, '<=', maxLon);
            return neon.query.and.apply(neon.query, filterClauses);
        }

        /**
         * Returns the map filter text using the given fields.
         *
         * @arg {array} fieldsByLayer
         * @return {string}
         */
        getFilterTextByFields(fieldsByLayer: any[]): string {
            if (fieldsByLayer.length === 1) {
                return this.getFilterTextForLayer(0);
            } else {
                return 'Map Filter - multiple layers';
            }
        }

        /**
         * Returns the filter text for the given filter object.
         *
         * @arg {any} filter
         * @return {string}
         * @override
         */
        getFilterText(filter: any): string {
            if (filter && filter.filterName) {
                return filter.filterName;
            } else {
                return 'Map Filter';
            }
        }

        /**
         * Returns the map filter text for the map layer at the given index.
         *
         * @arg {number} layerIndex
         * @return {string}
         */
        getFilterTextForLayer(layerIndex: number): string {
            let database = this.meta.layers[layerIndex].database.name;
            let table = this.meta.layers[layerIndex].table.name;
            let latField = this.active.layers[layerIndex].latitudeField.columnName;
            let lonField = this.active.layers[layerIndex].longitudeField.columnName;
            return database + ' - ' + table + ' - ' + latField + ', ' + lonField + ' - ' + layerIndex;
        }

        /**
         * Returns the list of filter fields for the map layer at the given index.
         *
         * @arg {number} layerIndex
         * @return {array}
         * @override
         */
        getNeonFilterFields(layerIndex: number): string[] {
            return [this.active.layers[layerIndex].latitudeField.columnName, this.active.layers[layerIndex].longitudeField.columnName];
        }

        /**
         * Returns the map's visualization name.
         *
         * @return {string}
         * @override
         */
        getVisualizationName(): string {
            return 'Map';
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
            valid = (this.meta.layers[layerIndex].database && this.meta.layers[layerIndex].database.name && valid);
            valid = (this.meta.layers[layerIndex].table && this.meta.layers[layerIndex].table.name && valid);
            valid = (this.active.layers[layerIndex].longitudeField && this.active.layers[layerIndex].longitudeField.columnName && valid);
            valid = (this.active.layers[layerIndex].latitudeField && this.active.layers[layerIndex].latitudeField.columnName && valid);
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
            let latitudeField = this.active.layers[layerIndex].latitudeField.columnName;
            let longitudeField = this.active.layers[layerIndex].longitudeField.columnName;
            let colorField = this.active.layers[layerIndex].colorField.columnName;
            let sizeField = this.active.layers[layerIndex].sizeField.columnName;
            let dateField = this.active.layers[layerIndex].dateField.columnName;

            let fields = [this.FIELD_ID, latitudeField, longitudeField];
            if (colorField) {
                fields.push(colorField);
            }
            if (sizeField) {
                fields.push(sizeField);
            }
            if (dateField) {
                fields.push(dateField);
            }

            return this.createBasicQuery(layerIndex).withFields(fields).limit(this.active.limit);
        }

        legendItemSelected(event: any) {
            let fieldName: string = event.fieldName;
            let value: string = event.value;
            let currentlyActive: boolean = event.currentlyActive;

            if (currentlyActive) {
                for (let layer of this.active.layers) {
                    if (layer.colorField.columnName === fieldName) {
                        this.mapObject.hidePoints(layer, value);
                    }
                }

                // Mark it as disabled
                this.disabledSet.push([fieldName, value]);
            } else {
                for (let layer of this.active.layers) {
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
         * @arg {array} data
         * @return {array}
         * @protected
         */
        protected getMapPoints(lngField: string, latField: string, colorField: string, data: any[]): any[] {
            let map = new Map<string, UniqueLocationPoint>();

            for (let point of data) {
                let lngCoord = this.retrieveLocationField(point, lngField),
                    latCoord = this.retrieveLocationField(point, latField),
                    colorValue = colorField && point[colorField];

                if (latCoord instanceof Array && lngCoord instanceof Array) {
                    for (let pos = latCoord.length - 1; pos >= 0; pos--) {
                        this.addOrUpdateUniquePoint(map, latCoord[pos], lngCoord[pos], colorField, colorValue);
                    }
                } else {
                    this.addOrUpdateUniquePoint(map, latCoord, lngCoord, colorField, colorValue);
                }
            }

            let mapPoints: MapPoint[] = [];
            let rgbColor = this.defaultActiveColor.toRgb();
            map.forEach((unique) => {
                let color = rgbColor;
                if (!this.optionsFromConfig.singleColor) {
                    color = unique.colorValue ? this.colorSchemeService.getColorFor(colorField, unique.colorValue).toRgb() : whiteString;
                }
                mapPoints.push(
                    new MapPoint(`${unique.lat.toFixed(3)}\u00b0, ${unique.lng.toFixed(3)}\u00b0`,
                        unique.lat, unique.lng, unique.count, color,
                        'Count: ' + unique.count,
                        unique.colorField, unique.colorValue
                    ));
            });
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
                this.meta.layers[layerIndex].docCount = response.data[0]._docCount;
                return;
            }

            // TODO Need to either preprocess data to get color, size scales OR see if neon aggregations can give ranges.
            // TODO break this function into smaller bits so it is more understandable.

            if (!this.mapObject) {
                return;
            }

            let layer = this.active.layers[layerIndex],
                mapPoints = this.getMapPoints(
                    layer.longitudeField.columnName,
                    layer.latitudeField.columnName,
                    layer.colorField.columnName,
                    response.data
                );

            // Unhide all points
            for (let currentLayer of this.active.layers) {
                this.mapObject.unhideAllPoints(currentLayer);
            }
            this.disabledSet = [] as [string[]];

            this.mapObject.clearLayer(layer);
            this.mapObject.addPoints(mapPoints, layer, this.active.clustering === 'clusters');

            this.updateLegend();
            this.runDocumentCountQuery(layerIndex);
        }

        /**
         * Updates the map legend using the active layers.
         */
        updateLegend() {
            let colorByFields: string[] = [];
            for (let layer of this.active.layers) {
                if (layer.colorField.columnName !== '') {
                    colorByFields.push(layer.colorField.columnName);
                }
            }
            this.colorByFields = colorByFields;
        }

        // This allows the map to function if the config file is a little off, i.e. if point isn't a flat dict;
        // like if latFied holds 'JSONMapping.status.geolocation.latitude', but the actual latitude value is
        // saved at point['JSONMapping']['status']['geolocation']['latitude']
        // It also will convert a string to a number, if the lat/lon fields are strings for some reason.
        //    Note that this only solves the problem for this one widget, and does nothing to help the rest of the workspace.
        //     even selecting a bunch of points on the map using shift-click/drag won't work if the lat/lon are stored as strings,
        //     because the region query looks at the data in the database and expects numbers there.
        retrieveLocationField(point, locField) {
            let coordinate = point[locField];
            let fieldSplit = locField.split('.');

            if (!coordinate && fieldSplit.length > 1) {
                coordinate = point[fieldSplit[0]];
                fieldSplit.shift();
                while (fieldSplit.length > 0) {
                    if (fieldSplit.length === 1 && coordinate instanceof Array) {
                        coordinate = coordinate.map((elem) => {
                            return elem[fieldSplit[0]];
                        });
                    } else {
                        coordinate = coordinate[fieldSplit[0]];
                    }
                    fieldSplit.shift();
                }
            }
            if (coordinate.constructor.name === 'String') {
                if (parseFloat(coordinate) > -181 && parseFloat(coordinate) < 181) {
                    coordinate = parseFloat(coordinate);
                }
            }
            return coordinate;
        }

        addOrUpdateUniquePoint(map: Map<string, UniqueLocationPoint>, lat: number, lng: number, colorField: string, colorValue: string) {
            if (!super.isNumber(lat) || !super.isNumber(lng)) {
                return;
            }

            let hashCode = geohash.encode(lat, lng),
                obj = map.get(hashCode);

            if (!obj) {
                obj = new UniqueLocationPoint(lat, lng, 0, colorField, colorValue);
                map.set(hashCode, obj);
            }

            obj.count++;
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
            let database = this.meta.layers[layerIndex].database.name;
            let table = this.meta.layers[layerIndex].table.name;
            let fields = this.getNeonFilterFields(layerIndex);
            let neonFilters = this.filterService.getFiltersForFields(database, table, fields);
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
            let database = this.meta.layers[layerIndex].database.name;
            let table = this.meta.layers[layerIndex].table.name;
            let fields = this.getNeonFilterFields(layerIndex);
            let neonFilters = this.filterService.getFiltersForFields(database, table, fields);
            let clauses = this.getClausesFromFilterWithIdenticalArguments(neonFilters, [
                this.active.layers[layerIndex].latitudeField.columnName,
                this.active.layers[layerIndex].longitudeField.columnName
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
            for (let i = 0; i < this.meta.layers.length; i++) {
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
         * Updates the limit, resets the seen bars, and reruns the bar chart query.
         */
        handleChangeLimit() {
            if (super.isNumber(this.active.newLimit)) {
                let newLimit = parseFloat('' + this.active.newLimit);
                if (newLimit > 0) {
                    this.active.limit = newLimit;
                    this.logChangeAndStartAllQueryChain();
                } else {
                    this.active.newLimit = this.active.limit;
                }
            } else {
                this.active.newLimit = this.active.limit;
            }
        }

        /**
         * Redraws the map using the given map type.
         *
         * @arg {MapType} mapType
         */
        handleChangeMapType(mapType: MapType) {
            if (this.optionsFromConfig.mapType !== mapType) {
                this.optionsFromConfig.mapType = mapType;
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
         */
        getCloseableFilters(): object[] {
            // TODO
            return this.filters;
        }

        /**
         * Returns the map filter tooltip title text.
         *
         * @return {string}
         */
        getFilterTitle(): string {
            let title = 'Map Filter';
            if (this.mapObject && !this.mapObject.isExact()) {
                title += ' *Filter was altered outside of Map visualization and selection rectangle may not accurately represent filter.';
            }
            return title;
        }

        /**
         * Returns the map filter text.
         *
         * @arg {string} input
         * @return {string}
         */
        getFilterCloseText(input: string): string {
            if (this.mapObject && !this.mapObject.isExact()) {
                return input + '*';
            }
            return input;
        }

        /**
         * Returns the map filter remove button tooltip title text.
         *
         * @return {string}
         */
        getRemoveFilterTooltip(): string {
            return 'Delete ' + this.getFilterTitle();
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
            for (let i = 0; i < this.meta.layers.length; i++) {
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
            let databaseName = this.meta.layers[layerIndex].database.name;
            let tableName = this.meta.layers[layerIndex].table.name;

            let latitudeField = this.active.layers[layerIndex].latitudeField.columnName;
            let longitudeField = this.active.layers[layerIndex].longitudeField.columnName;

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

            if (this.active.layers.length && this.meta.layers.length) {
                if (this.meta.layers.length === 1) {
                    return createButtonText(this.meta.layers[0].docCount, this.active.limit);
                }
                return this.meta.layers.map((layer, index) => {
                    if (this.active.layers.length >= index) {
                        return this.active.layers[index].title + ' (' + createButtonText(layer.docCount, this.active.limit) + ')';
                    }
                    return '';
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
    }
