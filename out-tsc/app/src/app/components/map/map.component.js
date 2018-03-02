var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';
import { ThemesService } from '../../services/themes.service';
import { ColorSchemeService } from '../../services/color-scheme.service';
import { FieldMetaData } from '../../dataset';
import { neonMappings, neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import { BaseLayeredNeonComponent } from '../base-neon-component/base-layered-neon.component';
import * as _ from 'lodash';
import * as geohash from 'geo-hash';
import { CesiumNeonMap } from './map.type.cesium';
import { MapPoint, MapType, MapTypePairs, whiteString } from './map.type.abstract';
import { LeafletNeonMap } from './map.type.leaflet';
var UniqueLocationPoint = /** @class */ (function () {
    function UniqueLocationPoint(lat, lng, count, colorField, colorValue) {
        this.lat = lat;
        this.lng = lng;
        this.count = count;
        this.colorField = colorField;
        this.colorValue = colorValue;
    }
    return UniqueLocationPoint;
}());
var MapComponent = /** @class */ (function (_super) {
    __extends(MapComponent, _super);
    function MapComponent(activeGridService, connectionService, datasetService, filterService, exportService, injector, themesService, colorSchemeSrv, ref, visualizationService) {
        var _this = _super.call(this, activeGridService, connectionService, datasetService, filterService, exportService, injector, themesService, ref, visualizationService) || this;
        _this.colorByFields = [];
        _this.filterVisible = [];
        _this.mapTypes = MapTypePairs;
        _this.disabledSet = [];
        window.CESIUM_BASE_URL = 'assets/Cesium';
        _this.colorSchemeService = colorSchemeSrv;
        _this.FIELD_ID = '_id';
        _this.optionsFromConfig = {
            title: _this.injector.get('title', null),
            database: _this.injector.get('database', null),
            table: _this.injector.get('table', null),
            limit: _this.injector.get('limit', 1000),
            unsharedFilterField: {},
            unsharedFilterValue: '',
            layers: _this.injector.get('layers', []),
            clustering: _this.injector.get('clustering', 'points'),
            minClusterSize: _this.injector.get('minClusterSize', 5),
            clusterPixelRange: _this.injector.get('clusterPixelRange', 15),
            hoverSelect: _this.injector.get('hoverSelect', null),
            hoverPopupEnabled: _this.injector.get('hoverPopupEnabled', false),
            west: _this.injector.get('west', null),
            east: _this.injector.get('east', null),
            north: _this.injector.get('north', null),
            south: _this.injector.get('south', null),
            customServer: _this.injector.get('customServer', {}),
            mapType: _this.injector.get('mapType', MapType.Leaflet),
            singleColor: _this.injector.get('singleColor', false)
        };
        _this.filters = [];
        _this.active = {
            layers: [],
            andFilters: true,
            limit: _this.optionsFromConfig.limit,
            newLimit: _this.optionsFromConfig.limit,
            filterable: true,
            data: [],
            nextColorIndex: 0,
            unusedColors: [],
            clustering: _this.optionsFromConfig.clustering,
            minClusterSize: _this.optionsFromConfig.minClusterSize,
            clusterPixelRange: _this.optionsFromConfig.clusterPixelRange
        };
        return _this;
    }
    /**
     * Initializes any map sub-components needed.
     *
     * @override
     */
    MapComponent.prototype.subNgOnInit = function () {
        // Do nothing.
    };
    /**
     * Handles any map component post-initialization behavior needed.
     *
     * @override
     */
    MapComponent.prototype.postInit = function () {
        // There is one layer automatically added
        for (var i = 1; i < this.optionsFromConfig.layers.length; i++) {
            this.addEmptyLayer();
        }
        this.defaultActiveColor = this.getPrimaryThemeColor();
    };
    /**
     * Removes the map layer at the given index and redraws the map.
     *
     * @arg {number} layerIndex
     * @override
     */
    MapComponent.prototype.subRemoveLayer = function (layerIndex) {
        this.active.layers.splice(layerIndex, 1);
        // Update the map
        this.handleChangeAllMapLayers();
    };
    /**
     * Sets the properties in the given bindings for the map.
     *
     * @arg {any} bindings
     * @override
     */
    MapComponent.prototype.subGetBindings = function (bindings) {
        bindings.limit = this.active.limit;
        // The map layers objects are different, clear out the old stuff;
        bindings.layers = [];
        for (var _i = 0, _a = this.active.layers; _i < _a.length; _i++) {
            var layer = _a[_i];
            bindings.layers.push({
                title: layer.title,
                latitudeField: layer.latitudeField.columnName,
                longitudeField: layer.longitudeField.columnName,
                sizeField: layer.sizeField.columnName,
                colorField: layer.colorField.columnName,
                dateField: layer.dateField.columnName
            });
        }
    };
    /**
     * Initializes and draws the map.
     */
    MapComponent.prototype.ngAfterViewInit = function () {
        var type = this.optionsFromConfig.mapType;
        if (!_super.prototype.isNumber.call(this, type)) {
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
        this.handleChangeAllMapLayers();
    };
    /**
     * Deletes any map sub-components needed.
     *
     * @override
     */
    MapComponent.prototype.subNgOnDestroy = function () {
        return this.mapObject && this.mapObject.destroy();
    };
    /**
     * Returns the option for the given property from the map config.
     *
     * @arg {string} option
     * @return {any}
     * @override
     */
    MapComponent.prototype.getOptionFromConfig = function (option) {
        return this.optionsFromConfig[option];
    };
    /**
     * Adds a new empty map layer.
     *
     * @override
     */
    MapComponent.prototype.subAddEmptyLayer = function () {
        this.active.layers.push({
            title: '',
            latitudeField: new FieldMetaData(),
            longitudeField: new FieldMetaData(),
            colorField: new FieldMetaData(),
            sizeField: new FieldMetaData(),
            dateField: new FieldMetaData()
        });
        this.filterVisible[this.active.layers.length - 1] = true;
    };
    /**
     * Returns the map export fields for the map layer at the given index.
     *
     * @arg {number} layerIndex
     * @return {array}
     * @override
     */
    MapComponent.prototype.getExportFields = function (layerIndex) {
        var usedFields = [this.active.layers[layerIndex].latitudeField,
            this.active.layers[layerIndex].longitudeField,
            this.active.layers[layerIndex].colorField,
            this.active.layers[layerIndex].sizeField,
            this.active.layers[layerIndex].dateField];
        return usedFields
            .filter(function (header) { return header && header.columnName; })
            .map(function (header) {
            return {
                columnName: header.columnName,
                prettyName: header.prettyName
            };
        });
    };
    /**
     * Removes the filter boudning box from this component and the map.
     *
     * @private
     */
    MapComponent.prototype.removeFilterBox = function () {
        delete this.filterBoundingBox;
        return this.mapObject && this.mapObject.removeFilterBox();
    };
    /**
     * Updates the fields for the map layer at the given index.
     *
     * @arg {number} layerIndex
     * @override
     */
    MapComponent.prototype.onUpdateFields = function (layerIndex) {
        var layer = this.active.layers[layerIndex];
        layer.latitudeField = this.findFieldObject(layerIndex, 'latitudeField', neonMappings.LATITUDE);
        layer.longitudeField = this.findFieldObject(layerIndex, 'longitudeField', neonMappings.LONGITUDE);
        layer.sizeField = this.findFieldObject(layerIndex, 'sizeField', neonMappings.SIZE);
        layer.colorField = this.findFieldObject(layerIndex, 'colorField', neonMappings.COLOR);
        layer.dateField = this.findFieldObject(layerIndex, 'dateField', neonMappings.DATE);
        // Get the title from the options, if it exists
        if (layerIndex >= this.optionsFromConfig.layers.length ||
            !this.optionsFromConfig.layers[layerIndex] || !this.optionsFromConfig.layers[layerIndex].title) {
            layer.title = this.optionsFromConfig.title;
        }
        else {
            layer.title = this.optionsFromConfig.layers[layerIndex].title;
        }
        if (!layer.title || layer.title === '') {
            layer.title = 'New Layer';
        }
    };
    /**
     * Finds and returns the field object for the map layer at the given index with the given binding key or mapping key.
     *
     * @arg {number} layerIndex
     * @arg {string} bindingKey
     * @arg {string} mappingKey
     * @return {FieldMetaData}
     */
    MapComponent.prototype.findFieldObject = function (layerIndex, bindingKey, mappingKey) {
        // If there are no layers or the index is past the end of the layers in the config, default to the original
        if (layerIndex >= this.optionsFromConfig.layers.length || !bindingKey
            || !this.optionsFromConfig.layers[layerIndex][bindingKey]) {
            return _super.prototype.findFieldObject.call(this, layerIndex, bindingKey, mappingKey);
        }
        var me = this;
        var find = function (name) {
            return _.find(me.meta.layers[layerIndex].fields, function (field) {
                return field.columnName === name;
            });
        };
        return find(this.optionsFromConfig.layers[layerIndex][bindingKey]) || this.getBlankField();
    };
    /**
     * Sets the filter bounding box to the given box and adds or replaces the neon map filter.
     *
     * @arg {BoundingBoxByDegrees} box
     */
    MapComponent.prototype.filterByLocation = function (box) {
        this.filterBoundingBox = box;
        var fieldsByLayer = this.active.layers.map(function (l) {
            return {
                latitudeName: l.latitudeField.columnName,
                longitudeName: l.longitudeField.columnName
            };
        });
        var localLayerName = this.getFilterTextByFields(fieldsByLayer);
        var localFilters = this.createFilter(fieldsByLayer, localLayerName);
        this.addLocalFilter(localFilters);
        for (var i = 0; i < localFilters.fieldsByLayer.length; i++) {
            var neonFilters = this.filterService.getFiltersByOwner(this.id);
            if (neonFilters && neonFilters.length) {
                localFilters.id = neonFilters[0].id;
                this.replaceNeonFilter(i, true, localFilters);
            }
            else {
                this.addNeonFilter(i, true, localFilters);
            }
        }
    };
    /**
     * Creates and returns a filter object with the given fields and name.
     *
     * @arg {array} fieldsByLayer
     * @arg {string} name
     * @return {any}
     */
    MapComponent.prototype.createFilter = function (fieldsByLayer, name) {
        return {
            id: undefined,
            fieldsByLayer: fieldsByLayer,
            filterName: name
        };
    };
    /**
     * Adds the given filter object to the map's list of filter objects.
     *
     * @arg {object} filter
     */
    MapComponent.prototype.addLocalFilter = function (filter) {
        this.filters[0] = filter;
    };
    /**
     * Creates and returns the neon filter clause object using the given database, table, and latitude/longitude fields.
     *
     * @arg {string} database
     * @arg {string} table
     * @arg {array} latLonFieldNames
     * @return {object}
     * @override
     */
    MapComponent.prototype.createNeonFilterClauseEquals = function (database, table, latLonFieldNames) {
        var filterClauses = [];
        var latField = latLonFieldNames[0];
        var lonField = latLonFieldNames[1];
        var minLat = this.filterBoundingBox.south;
        var maxLat = this.filterBoundingBox.north;
        var minLon = this.filterBoundingBox.west;
        var maxLon = this.filterBoundingBox.east;
        filterClauses[0] = neon.query.where(latField, '>=', minLat);
        filterClauses[1] = neon.query.where(latField, '<=', maxLat);
        filterClauses[2] = neon.query.where(lonField, '>=', minLon);
        filterClauses[3] = neon.query.where(lonField, '<=', maxLon);
        return neon.query.and.apply(neon.query, filterClauses);
    };
    /**
     * Returns the map filter text using the given fields.
     *
     * @arg {array} fieldsByLayer
     * @return {string}
     */
    MapComponent.prototype.getFilterTextByFields = function (fieldsByLayer) {
        if (fieldsByLayer.length === 1) {
            return this.getFilterTextForLayer(0);
        }
        else {
            return 'Map Filter - multiple layers';
        }
    };
    /**
     * Returns the filter text for the given filter object.
     *
     * @arg {any} filter
     * @return {string}
     * @override
     */
    MapComponent.prototype.getFilterText = function (filter) {
        if (filter && filter.filterName) {
            return filter.filterName;
        }
        else {
            return 'Map Filter';
        }
    };
    /**
     * Returns the map filter text for the map layer at the given index.
     *
     * @arg {number} layerIndex
     * @return {string}
     */
    MapComponent.prototype.getFilterTextForLayer = function (layerIndex) {
        var database = this.meta.layers[layerIndex].database.name;
        var table = this.meta.layers[layerIndex].table.name;
        var latField = this.active.layers[layerIndex].latitudeField.columnName;
        var lonField = this.active.layers[layerIndex].longitudeField.columnName;
        return database + ' - ' + table + ' - ' + latField + ', ' + lonField + ' - ' + layerIndex;
    };
    /**
     * Returns the list of filter fields for the map layer at the given index.
     *
     * @arg {number} layerIndex
     * @return {array}
     * @override
     */
    MapComponent.prototype.getNeonFilterFields = function (layerIndex) {
        return [this.active.layers[layerIndex].latitudeField.columnName, this.active.layers[layerIndex].longitudeField.columnName];
    };
    /**
     * Returns the map's visualization name.
     *
     * @return {string}
     * @override
     */
    MapComponent.prototype.getVisualizationName = function () {
        return 'Map';
    };
    /**
     * Returns the list of filters for the map to ignore (null to ignore no filters).
     *
     * @return {null}
     * @override
     */
    MapComponent.prototype.getFiltersToIgnore = function () {
        return null;
    };
    /**
     * Returns whether the fields for the map layer at the given index are valid.
     *
     * @arg {number} layerIndex
     * @return {boolean}
     * @override
     */
    MapComponent.prototype.isValidQuery = function (layerIndex) {
        var valid = true;
        valid = (this.meta.layers[layerIndex].database && this.meta.layers[layerIndex].database.name && valid);
        valid = (this.meta.layers[layerIndex].table && this.meta.layers[layerIndex].table.name && valid);
        valid = (this.active.layers[layerIndex].longitudeField && this.active.layers[layerIndex].longitudeField.columnName && valid);
        valid = (this.active.layers[layerIndex].latitudeField && this.active.layers[layerIndex].latitudeField.columnName && valid);
        return !!valid;
    };
    /**
     * Creates and returns the query for the map layer at the given index.
     *
     * @arg {number} layerIndex
     * @return {neon.query.Query}
     * @override
     */
    MapComponent.prototype.createQuery = function (layerIndex) {
        var latitudeField = this.active.layers[layerIndex].latitudeField.columnName;
        var longitudeField = this.active.layers[layerIndex].longitudeField.columnName;
        var colorField = this.active.layers[layerIndex].colorField.columnName;
        var sizeField = this.active.layers[layerIndex].sizeField.columnName;
        var dateField = this.active.layers[layerIndex].dateField.columnName;
        var fields = [this.FIELD_ID, latitudeField, longitudeField];
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
    };
    MapComponent.prototype.legendItemSelected = function (event) {
        var fieldName = event.fieldName;
        var value = event.value;
        var currentlyActive = event.currentlyActive;
        if (currentlyActive) {
            for (var _i = 0, _a = this.active.layers; _i < _a.length; _i++) {
                var layer = _a[_i];
                if (layer.colorField.columnName === fieldName) {
                    this.mapObject.hidePoints(layer, value);
                }
            }
            // Mark it as disabled
            this.disabledSet.push([fieldName, value]);
        }
        else {
            for (var _b = 0, _c = this.active.layers; _b < _c.length; _b++) {
                var layer = _c[_b];
                if (layer.colorField.columnName === fieldName) {
                    this.mapObject.unhidePoints(layer, value);
                }
            }
            // Mark it as active again
            this.disabledSet = this.disabledSet.filter(function (set) {
                return !(set[0] === fieldName && set[1] === value);
            });
        }
    };
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
    MapComponent.prototype.getMapPoints = function (lngField, latField, colorField, data) {
        var _this = this;
        var map = new Map();
        for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
            var point = data_1[_i];
            var lngCoord = this.retrieveLocationField(point, lngField), latCoord = this.retrieveLocationField(point, latField), colorValue = colorField && point[colorField];
            if (latCoord instanceof Array && lngCoord instanceof Array) {
                for (var pos = latCoord.length - 1; pos >= 0; pos--) {
                    this.addOrUpdateUniquePoint(map, latCoord[pos], lngCoord[pos], colorField, colorValue);
                }
            }
            else {
                this.addOrUpdateUniquePoint(map, latCoord, lngCoord, colorField, colorValue);
            }
        }
        var mapPoints = [];
        var rgbColor = this.defaultActiveColor.toRgb();
        map.forEach(function (unique) {
            var color = rgbColor;
            if (!_this.optionsFromConfig.singleColor) {
                color = unique.colorValue ? _this.colorSchemeService.getColorFor(colorField, unique.colorValue).toRgb() : whiteString;
            }
            mapPoints.push(new MapPoint(unique.lat.toFixed(3) + "\u00B0, " + unique.lng.toFixed(3) + "\u00B0", unique.lat, unique.lng, unique.count, color, 'Count: ' + unique.count, unique.colorField, unique.colorValue));
        });
        return mapPoints;
    };
    /**
     * Handles the query results for the map layer at the given index and draws the map.
     *
     * @arg {number} layerIndex
     * @arg {any} response
     * @override
     */
    MapComponent.prototype.onQuerySuccess = function (layerIndex, response) {
        if (response.data.length === 1 && response.data[0]._docCount !== undefined) {
            this.meta.layers[layerIndex].docCount = response.data[0]._docCount;
            return;
        }
        // TODO Need to either preprocess data to get color, size scales OR see if neon aggregations can give ranges.
        // TODO break this function into smaller bits so it is more understandable.
        if (!this.mapObject) {
            return;
        }
        var layer = this.active.layers[layerIndex], mapPoints = this.getMapPoints(layer.longitudeField.columnName, layer.latitudeField.columnName, layer.colorField.columnName, response.data);
        // Unhide all points
        for (var _i = 0, _a = this.active.layers; _i < _a.length; _i++) {
            var currentLayer = _a[_i];
            this.mapObject.unhideAllPoints(currentLayer);
        }
        this.disabledSet = [];
        this.mapObject.clearLayer(layer);
        this.mapObject.addPoints(mapPoints, layer, this.active.clustering === 'clusters');
        this.updateLegend();
        this.runDocumentCountQuery(layerIndex);
    };
    /**
     * Updates the map legend using the active layers.
     */
    MapComponent.prototype.updateLegend = function () {
        var colorByFields = [];
        for (var _i = 0, _a = this.active.layers; _i < _a.length; _i++) {
            var layer = _a[_i];
            if (layer.colorField.columnName !== '') {
                colorByFields.push(layer.colorField.columnName);
            }
        }
        this.colorByFields = colorByFields;
    };
    // This allows the map to function if the config file is a little off, i.e. if point isn't a flat dict;
    // like if latFied holds 'JSONMapping.status.geolocation.latitude', but the actual latitude value is
    // saved at point['JSONMapping']['status']['geolocation']['latitude']
    // It also will convert a string to a number, if the lat/lon fields are strings for some reason.
    //    Note that this only solves the problem for this one widget, and does nothing to help the rest of the workspace.
    //     even selecting a bunch of points on the map using shift-click/drag won't work if the lat/lon are stored as strings,
    //     because the region query looks at the data in the database and expects numbers there.
    MapComponent.prototype.retrieveLocationField = function (point, locField) {
        var coordinate = point[locField];
        var fieldSplit = locField.split('.');
        if (!coordinate && fieldSplit.length > 1) {
            coordinate = point[fieldSplit[0]];
            fieldSplit.shift();
            while (fieldSplit.length > 0) {
                if (fieldSplit.length === 1 && coordinate instanceof Array) {
                    coordinate = coordinate.map(function (elem) {
                        return elem[fieldSplit[0]];
                    });
                }
                else {
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
    };
    MapComponent.prototype.addOrUpdateUniquePoint = function (map, lat, lng, colorField, colorValue) {
        if (!_super.prototype.isNumber.call(this, lat) || !_super.prototype.isNumber.call(this, lng)) {
            return;
        }
        var hashCode = geohash.encode(lat, lng), obj = map.get(hashCode);
        if (!obj) {
            obj = new UniqueLocationPoint(lat, lng, 0, colorField, colorValue);
            map.set(hashCode, obj);
        }
        obj.count++;
    };
    /**
     * Refreshes the map.
     *
     * @override
     */
    MapComponent.prototype.refreshVisualization = function () {
        // Cesium doesn't need to be refreshed manually
    };
    /**
     * Returns whether the map layer at the given index has a filter.
     *
     * @arg {number} layerIndex
     * @return {boolean}
     */
    MapComponent.prototype.doesLayerStillHaveFilter = function (layerIndex) {
        var database = this.meta.layers[layerIndex].database.name;
        var table = this.meta.layers[layerIndex].table.name;
        var fields = this.getNeonFilterFields(layerIndex);
        var neonFilters = this.filterService.getFiltersForFields(database, table, fields);
        return neonFilters && neonFilters.length > 0;
    };
    MapComponent.prototype.getClausesFromFilterWithIdenticalArguments = function (filters, args) {
        if (filters && filters.length > 0) {
            for (var _i = 0, filters_1 = filters; _i < filters_1.length; _i++) {
                var filter = filters_1[_i];
                var clauses = void 0;
                if (filter.filter.whereClause.type === 'and') {
                    clauses = filter.filter.whereClause.whereClauses;
                }
                else if (args.length === 1) {
                    // if it is not an 'and' and only has 1 where class.
                    // This shouldn't be used in map, but may be used more generically.
                    clauses = [filter.filter.whereClause];
                }
                var done = clauses && clauses.length > 0;
                for (var _a = 0, clauses_1 = clauses; _a < clauses_1.length; _a++) {
                    var where = clauses_1[_a];
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
    };
    MapComponent.prototype.hasLayerFilterChanged = function (layerIndex) {
        var filterChanged = true;
        var database = this.meta.layers[layerIndex].database.name;
        var table = this.meta.layers[layerIndex].table.name;
        var fields = this.getNeonFilterFields(layerIndex);
        var neonFilters = this.filterService.getFiltersForFields(database, table, fields);
        var clauses = this.getClausesFromFilterWithIdenticalArguments(neonFilters, [
            this.active.layers[layerIndex].latitudeField.columnName,
            this.active.layers[layerIndex].longitudeField.columnName
        ]);
        if (clauses && this.filterBoundingBox) {
            var values_1 = [this.filterBoundingBox.north, this.filterBoundingBox.south, this.filterBoundingBox.east,
                this.filterBoundingBox.west];
            // TODO FIX THE NEXT LINE!!!!
            var emptyIfUnchanged = clauses.filter(function (cl) { return (values_1.indexOf(cl.rhs) === -1); });
            return emptyIfUnchanged.length > 0;
        }
        return true;
    };
    /**
     * Creates filters on init if needed.
     *
     * @override
     */
    MapComponent.prototype.setupFilters = function () {
        // Get neon filters
        // See if any neon filters are local filters and set/clear appropriately
        // TODO needs to be reworked now that we have layers.
        // I'm not sure what it even should do from a user perspective.
        var allLayersHaveFilters = true;
        var oneOrMoreLayersHaveFilters = false;
        var oneOrMoreFiltersHaveChanged = false;
        for (var i = 0; i < this.meta.layers.length; i++) {
            var layerHasFilter = this.doesLayerStillHaveFilter(i);
            oneOrMoreLayersHaveFilters = oneOrMoreLayersHaveFilters || layerHasFilter;
            allLayersHaveFilters = allLayersHaveFilters && layerHasFilter;
            var filterHasChanged = this.hasLayerFilterChanged(i);
            oneOrMoreFiltersHaveChanged = oneOrMoreFiltersHaveChanged || filterHasChanged;
        }
        if (!oneOrMoreLayersHaveFilters) {
            // aka no layers have filters
            this.filters = [];
            this.removeFilterBox();
        }
        else if (oneOrMoreFiltersHaveChanged && this.mapObject && this.filterBoundingBox) {
            this.mapObject.markInexact();
        }
    };
    /**
     * Reruns the queries for all map layers.
     */
    MapComponent.prototype.handleChangeAllMapLayers = function () {
        this.logChangeAndStartAllQueryChain();
    };
    /**
     * Updates the limit, resets the seen bars, and reruns the bar chart query.
     */
    MapComponent.prototype.handleChangeLimit = function () {
        if (_super.prototype.isNumber.call(this, this.active.newLimit)) {
            var newLimit = parseFloat('' + this.active.newLimit);
            if (newLimit > 0) {
                this.active.limit = newLimit;
                this.logChangeAndStartAllQueryChain();
            }
            else {
                this.active.newLimit = this.active.limit;
            }
        }
        else {
            this.active.newLimit = this.active.limit;
        }
    };
    /**
     * Reruns the queries for the map layer at the given index.
     *
     * @arg {number} layerIndex
     */
    MapComponent.prototype.handleChangeMapLayer = function (layerIndex) {
        this.logChangeAndStartQueryChain(layerIndex);
    };
    /**
     * Redraws the map using the given map type.
     *
     * @arg {MapType} mapType
     */
    MapComponent.prototype.handleChangeMapType = function (mapType) {
        if (this.optionsFromConfig.mapType !== mapType) {
            this.optionsFromConfig.mapType = mapType;
            if (this.mapObject) {
                this.mapObject.destroy();
            }
            this.ngAfterViewInit(); // re-initialize map
        }
    };
    /**
     * Returns the list of filter objects.
     *
     * @return {array}
     */
    MapComponent.prototype.getCloseableFilters = function () {
        // TODO
        return this.filters;
    };
    /**
     * Returns the map filter tooltip title text.
     *
     * @return {string}
     */
    MapComponent.prototype.getFilterTitle = function () {
        var title = 'Map Filter';
        if (this.mapObject && !this.mapObject.isExact()) {
            title += ' *Filter was altered outside of Map visualization and selection rectangle may not accurately represent filter.';
        }
        return title;
    };
    /**
     * Returns the map filter text.
     *
     * @arg {string} input
     * @return {string}
     */
    MapComponent.prototype.getFilterCloseText = function (input) {
        if (this.mapObject && !this.mapObject.isExact()) {
            return input + '*';
        }
        return input;
    };
    /**
     * Returns the map filter remove button tooltip title text.
     *
     * @return {string}
     */
    MapComponent.prototype.getRemoveFilterTooltip = function () {
        return 'Delete ' + this.getFilterTitle();
    };
    /**
     * Removes the map component filter and bounding box.
     */
    MapComponent.prototype.removeFilter = function () {
        this.filters = [];
        this.removeFilterBox();
    };
    /**
     * Removes the map component filter and neon filter.
     */
    MapComponent.prototype.handleRemoveFilter = function (filter) {
        for (var i = 0; i < this.meta.layers.length; i++) {
            this.removeLocalFilterFromLocalAndNeon(i, filter, true, false);
        }
        this.removeFilter();
    };
    /**
     * Toggles the visibility of the filter at the given index.
     *
     * @arg {number} index
     */
    MapComponent.prototype.toggleFilter = function (index) {
        this.filterVisible[index] = !(this.filterVisible[index]);
    };
    /**
     * Returns the icon for the filter at the given index.
     *
     * @arg {number} index
     * @return {string}
     */
    MapComponent.prototype.getIconForFilter = function (index) {
        return this.filterVisible[index] ? 'keyboard_arrow_up' : 'keyboard_arrow_down';
    };
    /**
     * Resizes the map.
     */
    MapComponent.prototype.onResizeStop = function () {
        _super.prototype.onResizeStop.call(this);
        return this.mapObject && this.mapObject.sizeChanged();
    };
    /**
     * Creates and returns the basic query for the data aggregation query or the document count query for the layer at the given index.
     *
     * @arg {number} layerIndex
     * @return {neon.query.Query}
     */
    MapComponent.prototype.createBasicQuery = function (layerIndex) {
        var databaseName = this.meta.layers[layerIndex].database.name;
        var tableName = this.meta.layers[layerIndex].table.name;
        var latitudeField = this.active.layers[layerIndex].latitudeField.columnName;
        var longitudeField = this.active.layers[layerIndex].longitudeField.columnName;
        var whereClauses = [];
        whereClauses.push(neon.query.where(latitudeField, '!=', null));
        whereClauses.push(neon.query.where(longitudeField, '!=', null));
        var whereClause = neon.query.and.apply(neon.query, whereClauses);
        return new neon.query.Query().selectFrom(databaseName, tableName).where(whereClause);
    };
    /**
     * Creates and returns the text for the settings button.
     *
     * @return {string}
     * @override
     */
    MapComponent.prototype.getButtonText = function () {
        var prettifyInteger = _super.prototype.prettifyInteger;
        var createButtonText = function (count, limit) {
            if (!count) {
                return 'No Data';
            }
            return (limit < count ? prettifyInteger(limit) + ' of ' : 'Total ') + prettifyInteger(count);
        };
        if (this.active.layers.length && this.meta.layers.length) {
            if (this.meta.layers.length === 1) {
                return createButtonText(this.meta.layers[0].docCount, this.active.limit);
            }
            var self_1 = this;
            return this.meta.layers.map(function (layer, index) {
                if (self_1.active.layers.length >= index) {
                    return self_1.active.layers[index].title + ' (' + createButtonText(layer.docCount, self_1.active.limit) + ')';
                }
                return '';
            }).filter(function (text) {
                return !!text;
            }).join(', ');
        }
        return '';
    };
    /**
     * Creates and executes the document count query for the layer at the given index.
     *
     * @arg {number} layerIndex
     */
    MapComponent.prototype.runDocumentCountQuery = function (layerIndex) {
        var query = this.createBasicQuery(layerIndex).aggregate(neonVariables.COUNT, '*', '_docCount');
        this.executeQuery(layerIndex, query);
    };
    /**
     * Returns an object containing the ElementRef objects for the visualization.
     *
     * @return {any} Object containing:  {ElementRef} headerText, {ElementRef} infoText, {ElementRef} visualization
     * @override
     */
    MapComponent.prototype.getElementRefs = function () {
        return {
            visualization: this.visualization,
            headerText: this.headerText,
            infoText: this.infoText
        };
    };
    __decorate([
        ViewChild('visualization', { read: ElementRef }),
        __metadata("design:type", ElementRef)
    ], MapComponent.prototype, "visualization", void 0);
    __decorate([
        ViewChild('headerText'),
        __metadata("design:type", ElementRef)
    ], MapComponent.prototype, "headerText", void 0);
    __decorate([
        ViewChild('infoText'),
        __metadata("design:type", ElementRef)
    ], MapComponent.prototype, "infoText", void 0);
    __decorate([
        ViewChild('mapElement'),
        __metadata("design:type", ElementRef)
    ], MapComponent.prototype, "mapElement", void 0);
    MapComponent = __decorate([
        Component({
            selector: 'app-map',
            templateUrl: './map.component.html',
            styleUrls: ['./map.component.scss'],
            encapsulation: ViewEncapsulation.Emulated,
            changeDetection: ChangeDetectionStrategy.OnPush
        }),
        __metadata("design:paramtypes", [ActiveGridService, ConnectionService, DatasetService,
            FilterService, ExportService, Injector, ThemesService,
            ColorSchemeService, ChangeDetectorRef, VisualizationService])
    ], MapComponent);
    return MapComponent;
}(BaseLayeredNeonComponent));
export { MapComponent };
//# sourceMappingURL=map.component.js.map