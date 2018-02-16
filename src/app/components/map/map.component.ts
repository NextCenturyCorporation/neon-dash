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
export class MapComponent extends BaseLayeredNeonComponent implements OnInit,
    OnDestroy, AfterViewInit, FilterListener {

        private FIELD_ID: string;
        private filters: {
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

        private colorSchemeService: ColorSchemeService;

        public optionsFromConfig: OptionsFromConfig;
        protected mapObject: AbstractMap;
        private filterBoundingBox: BoundingBoxByDegrees;

        public disabledSet: [string[]] = [] as [string[]];
        private defaultActiveColor: Color;

        @ViewChild('mapElement') mapElement: ElementRef;

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
                latitudeField: this.injector.get('latitudeField', null),
                longitudeField: this.injector.get('longitudeField', null),
                colorField: this.injector.get('colorField', null),
                sizeField: this.injector.get('sizeField', null),
                dateField: this.injector.get('dateField', null),
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
                filterable: true,
                data: [],
                nextColorIndex: 0,
                unusedColors: [],
                clustering: this.optionsFromConfig.clustering,
                minClusterSize: this.optionsFromConfig.minClusterSize,
                clusterPixelRange: this.optionsFromConfig.clusterPixelRange
            };

            this.queryTitle = this.optionsFromConfig.title || 'Map';
        }

        subNgOnInit() {
            // Do nothing.
        }

        postInit() {
            // There is one layer automatically added
            for (let i = 1; i < this.optionsFromConfig.layers.length; i++) {
                this.addEmptyLayer();
            }

            this.defaultActiveColor = this.getPrimaryThemeColor();
        }

        subRemoveLayer(index: number) {
            this.active.layers.splice(index, 1);

            // Update the map
            this.handleChangeLimit();
        }

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

        ngAfterViewInit() {
            let type = this.optionsFromConfig.mapType;
            if (!this.isNumeric(type)) {
                type = MapType[type] || MapType.Leaflet;
                this.optionsFromConfig.mapType = type;
            }
            switch (type) {
                case MapType.Cesium:
                    this.mapObject = new CesiumNeonMap();
                    break;
                case MapType.Leaflet:
                default:
                    this.mapObject = new LeafletNeonMap();
            }

            this.mapObject.initialize(this.mapElement, this.optionsFromConfig, this);

            // Draw everything
            this.handleChangeLimit();
        }

        subNgOnDestroy() {
            return this.mapObject && this.mapObject.destroy();
        }

        getOptionFromConfig(field) {
            return this.optionsFromConfig[field];
        }

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

        getExportFields(layerIndex) {
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

        private removeFilterBox() {
            delete this.filterBoundingBox;
            return this.mapObject && this.mapObject.removeFilterBox();
        }

        onUpdateFields(layerIndex) {
            let layer = this.active.layers[layerIndex];
            layer.latitudeField = this.findFieldObject(layerIndex, 'latitudeField', neonMappings.TAGS);
            layer.longitudeField = this.findFieldObject(layerIndex, 'longitudeField', neonMappings.TAGS);
            layer.sizeField = this.findFieldObject(layerIndex, 'sizeField', neonMappings.TAGS);
            layer.colorField = this.findFieldObject(layerIndex, 'colorField', neonMappings.TAGS);
            layer.dateField = this.findFieldObject(layerIndex, 'dateField', neonMappings.TAGS);

            // Get the title from the options, if it exists
            if (layerIndex >= this.optionsFromConfig.layers.length ||
                !this.optionsFromConfig.layers[layerIndex] || !this.optionsFromConfig.layers[layerIndex].title) {
                layer.title = this.optionsFromConfig.title;
            } else {
                layer.title = this.optionsFromConfig.layers[layerIndex].title;
            }
            if (!layer.title || layer.title === '') {
                layer.title = 'New Layer';
            }
        }

        findFieldObject(layerIndex: number, bindingKey: string, mappingKey?: string): FieldMetaData {
            // If there are no layers or the index is past the end of the layers in the config, default to the original
            if (layerIndex >= this.optionsFromConfig.layers.length || !bindingKey
                || !this.optionsFromConfig.layers[layerIndex][bindingKey]) {
                return super.findFieldObject(layerIndex, bindingKey, mappingKey);
            }

            let me = this;
            let find = function(name) {
                return _.find(me.meta.layers[layerIndex].fields, function(field) {
                    return field.columnName === name;
                });
            };

            return find(this.optionsFromConfig.layers[layerIndex][bindingKey]) || this.getBlankField();
        }

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

        createFilter(fieldsByLayer, name) {
            return {
                id: undefined,
                fieldsByLayer: fieldsByLayer,
                filterName: name
            };
        }

        addLocalFilter(filter) {
            this.filters[0] = filter;
        }

        createNeonFilterClauseEquals(database: string, table: string, latLonFieldNames: string[]) {
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

        getFilterTextByFields(fieldsByLayer: any[]) {
            if (fieldsByLayer.length === 1) {
                return this.getFilterTextForLayer(0);
            } else {
                return 'Map Filter - multiple layers';
            }
        }

        getFilterText(filter) {
            if (filter && filter.filterName) {
                return filter.filterName;
            } else {
                return 'Map Filter';
            }
        }

        getFilterTextForLayer(layerIndex: number) {
            let database = this.meta.layers[layerIndex].database.name;
            let table = this.meta.layers[layerIndex].table.name;
            let latField = this.active.layers[layerIndex].latitudeField.columnName;
            let lonField = this.active.layers[layerIndex].longitudeField.columnName;
            return database + ' - ' + table + ' - ' + latField + ', ' + lonField + ' - ' + layerIndex;
        }

        getNeonFilterFields(layerIndex) {
            return [this.active.layers[layerIndex].latitudeField.columnName, this.active.layers[layerIndex].longitudeField.columnName];
        }

        getVisualizationName() {
            return 'Map';
        }

        getFiltersToIgnore() {
            return null;
        }

        isValidQuery(layerIndex) {
            let valid = true;
            valid = (this.meta.layers[layerIndex].database && this.meta.layers[layerIndex].database.name && valid);
            valid = (this.meta.layers[layerIndex].table && this.meta.layers[layerIndex].table.name && valid);
            valid = (this.active.layers[layerIndex].longitudeField && this.active.layers[layerIndex].longitudeField.columnName && valid);
            valid = (this.active.layers[layerIndex].latitudeField && this.active.layers[layerIndex].latitudeField.columnName && valid);
            return valid;
        }

        /**
         * Creates and returns the query for the layer at the given index.
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

        isNumeric(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        }

        public legendItemSelected(event: any) {
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

        protected getMapPoints(lngField: string, latField: string, colorField: string, data: any[]) {
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
         * Handles the query results for the layer at the given index.
         *
         * @arg {number} layerIndex
         * @arg {object} response
         * @override
         */
        onQuerySuccess(layerIndex, response) {
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
            let lngCoord = point[locField];
            let lngFieldParts = locField.split('.');

            if (!lngCoord && lngFieldParts.length > 1) {
                lngCoord = point[lngFieldParts[0]];
                lngFieldParts.shift();
                while (lngFieldParts.length > 0) {
                    if (lngFieldParts.length === 1 && lngCoord instanceof Array) {
                        lngCoord = lngCoord.map((elem) => {
                            return elem[lngFieldParts[0]];
                        });
                    } else {
                        lngCoord = lngCoord[lngFieldParts[0]];
                    }
                    lngFieldParts.shift();
                }
            }
            if (lngCoord.constructor.name === 'String') {
                if (parseFloat(lngCoord) > -181 && parseFloat(lngCoord) < 181) {
                    lngCoord = parseFloat(lngCoord);
                }
            }
            return lngCoord;
        }

        addOrUpdateUniquePoint(map: Map<string, UniqueLocationPoint>, lat: number, lng: number,
            colorField: string, colorValue: string) {
            if (!this.isNumeric(lat) || !this.isNumeric(lng)) {
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

        refreshVisualization() {
            // Cesium doesn't need to be refreshed manually
        }

        doesLayerStillHaveFilter(i): boolean {
            let database = this.meta.layers[i].database.name;
            let table = this.meta.layers[i].table.name;
            let fields = this.getNeonFilterFields(i);
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
                    let continu = clauses && clauses.length > 0;
                    for (let where of clauses) {
                        if (args.indexOf(where.lhs) === -1) {
                            continu = false;
                            break;
                        }
                    }
                    if (continu) {
                        return clauses;
                    }
                }
            }
            return null;
        }

        hasLayerFilterChanged(i): boolean {
            let filterChanged = true;
            let database = this.meta.layers[i].database.name;
            let table = this.meta.layers[i].table.name;
            let fields = this.getNeonFilterFields(i);
            let neonFilters = this.filterService.getFiltersForFields(database, table, fields);
            let clauses = this.getClausesFromFilterWithIdenticalArguments(neonFilters, [
                this.active.layers[i].latitudeField.columnName,
                this.active.layers[i].longitudeField.columnName
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

        handleChangeLimit() {
            this.logChangeAndStartAllQueryChain();
        }

        handleChangeDateField(layerIndex) {
            this.logChangeAndStartQueryChain(layerIndex);
        }

        handleChangeSizeField(layerIndex) {
            this.logChangeAndStartQueryChain(layerIndex);
        }

        handleChangeColorField(layerIndex) {
            this.logChangeAndStartQueryChain(layerIndex);
        }

        handleChangeLatitudeField(layerIndex) {
            this.logChangeAndStartQueryChain(layerIndex);
        }

        handleChangeLongitudeField(layerIndex) {
            this.logChangeAndStartQueryChain(layerIndex);
        }

        handleChangeAndFilters() {
            this.logChangeAndStartAllQueryChain();
        }

        handleChangeClustering() {
            this.logChangeAndStartAllQueryChain();
        }

        handleChangeMapType(value: MapType) {
            if (this.optionsFromConfig.mapType !== value) {
                this.optionsFromConfig.mapType = value;
                if (this.mapObject) {
                    this.mapObject.destroy();
                }
                this.ngAfterViewInit(); // re-initialize map
            }
        }

        // Get filters and format for each call in HTML
        getCloseableFilters() {
            // TODO
            return this.filters;
        }

        getFilterTitle(): string {
            let title = 'Map Filter';
            if (this.mapObject && !this.mapObject.isExact()) {
                title += ' *Filter was altered outside of Map visualization and selection rectange may not accurately represent filter.';
            }
            return title;
        }

        getFilterCloseText(value: string) {
            let v = value;
            if (this.mapObject && !this.mapObject.isExact()) {
                v += '*';
            }
            return v;
        }

        getRemoveFilterTooltip() {
            let tooltip = 'Delete ' + this.getFilterTitle();
            return tooltip;
        }

        removeFilter(): void {
            this.filters = [];
            this.removeFilterBox();
        }

        handleRemoveFilter(filter: any): void {
            for (let i = 0; i < this.meta.layers.length; i++) {
                this.removeLocalFilterFromLocalAndNeon(i, filter, true, false);
            }
            this.removeFilter();
        }

        toggleFilter(index: number): void {
            this.filterVisible[index] = !(this.filterVisible[index]);
        }

        getIconForFilter(index: number): string {
            return this.filterVisible[index] ? 'keyboard_arrow_up' : 'keyboard_arrow_down';
        }

        onResizeStop(): void {
            super.onResizeStop();
            return this.mapObject && this.mapObject.sizeChanged();
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
            if (this.active.layers.length && this.meta.layers.length) {
                if (this.meta.layers.length === 1) {
                    return (this.active.limit < this.meta.layers[0].docCount ? this.active.limit + ' of ' : 'Total ') +
                        this.meta.layers[0].docCount;
                }
                let self = this;
                return this.meta.layers.map(function(layer, index) {
                    if (self.active.layers.length >= index) {
                        return self.active.layers[index].title + ' (' + (self.active.limit < layer.docCount ? self.active.limit + ' of ' :
                            'Total ') + layer.docCount + ')';
                    }
                    return '';
                }).filter(function(text) {
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
    }
