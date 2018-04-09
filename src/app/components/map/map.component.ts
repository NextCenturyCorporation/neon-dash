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
    HostListener,
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
    MapConfiguration,
    MapLayer,
    MapPoint,
    MapType,
    MapTypePairs,
    whiteString
} from './map.type.abstract';
import { LeafletNeonMap } from './map.type.leaflet';

class UniqueLocationPoint {
    constructor(public lat: number, public lng: number, public count: number,
        public colorField: string, public colorValue: string) { }
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

    protected FIELD_ID: string;
    protected filters: {
        id: string,
        fieldsByLayer: {
            latitude: string,
            longitude: string
            prettyLatitude: string,
            prettyLongitude: string
        },
        filterName: string
    }[];

    public active: {
        layers: MapLayer[],
        andFilters: boolean,
        filterable: boolean,
        data: number[][],
        unusedColors: string[],
        nextColorIndex: number,
        clustering: string,
        singleColor: boolean,
        disableCtrlZoom: boolean
    };

    public colorByFields: string[] = [];

    public filterVisible: boolean[] = [];

    public mapTypes = MapTypePairs;

    protected colorSchemeService: ColorSchemeService;

    public mapConfiguration: MapConfiguration;
    protected mapObject: AbstractMap;
    protected filterBoundingBox: BoundingBoxByDegrees;

    public disabledSet: [string[]] = [] as [string[]];
    protected defaultActiveColor: Color;
    mapType: MapType | string;

    constructor(activeGridService: ActiveGridService, connectionService: ConnectionService, datasetService: DatasetService,
        filterService: FilterService, exportService: ExportService, injector: Injector, themesService: ThemesService,
        colorSchemeSrv: ColorSchemeService, ref: ChangeDetectorRef, visualizationService: VisualizationService) {
        super(activeGridService, connectionService, datasetService, filterService,
            exportService, injector, themesService, ref, visualizationService);

        (<any> window).CESIUM_BASE_URL = 'assets/Cesium';

        this.colorSchemeService = colorSchemeSrv;
        this.mapType = this.injector.get('mapType', MapType.Leaflet);
        this.FIELD_ID = '_id';

        this.mapConfiguration = {
            west: this.injector.get('west', null),
            east: this.injector.get('east', null),
            north: this.injector.get('north', null),
            south: this.injector.get('south', null),
            clusterPixelRange: this.injector.get('clusterPixelRange', 15),
            customServer: this.injector.get('customServer', {}),
            hoverSelect: this.injector.get('hoverSelect', null),
            hoverPopupEnabled: this.injector.get('hoverPopupEnabled', false),
            minClusterSize: this.injector.get('minClusterSize', 5)
        };

        this.filters = [];

        this.active = {
            layers: [],
            andFilters: true,
            filterable: true,
            data: [],
            nextColorIndex: 0,
            unusedColors: [],
            clustering: this.injector.get('clustering', 'points'),
            singleColor: this.injector.get('singleColor', false),
            disableCtrlZoom: this.injector.get('disableCtrlZoom', false)
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
        for (let layer of this.injector.get('layers', [])) {
            this.addEmptyLayer(layer);
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
        // The map layers objects are different, clear out the old stuff;
        bindings.layers = [];
        for (let layer of this.active.layers) {
            bindings.layers.push({
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
        if (!super.isNumber(this.mapType)) {
            this.mapType = MapType[this.mapType] || MapType.Leaflet;
        }
        switch (this.mapType) {
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

        this.mapObject.initialize(this.mapElement, this.mapConfiguration, this);

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
     * @arg {object} metaObject
     * @arg {object} layerOptions
     * @override
     */
    onUpdateFields(metaObject: any, layerOptions?: any) {
        let layer = this.active.layers[metaObject.index];
        layer.latitudeField = this.findFieldObject(metaObject, layerOptions, 'latitudeField', neonMappings.LATITUDE);
        layer.longitudeField = this.findFieldObject(metaObject, layerOptions, 'longitudeField', neonMappings.LONGITUDE);
        layer.sizeField = this.findFieldObject(metaObject, layerOptions, 'sizeField');
        layer.colorField = this.findFieldObject(metaObject, layerOptions, 'colorField');
        layer.dateField = this.findFieldObject(metaObject, layerOptions, 'dateField', neonMappings.DATE);
        // Must copy the title into the active layer for the map object.
        layer.title = metaObject.title;
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

        let fieldsByLayer = this.active.layers.map((layer) => {
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
            let neonFilter = this.createNeonFilter(this.filterBoundingBox, localFilters.fieldsByLayer[i].latitude,
                localFilters.fieldsByLayer[i].longitude);

            if (neonFilters && neonFilters.length) {
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
    createNeonFilter(boundingBox: BoundingBoxByDegrees, latitudeField: string, longitudeField: string): neon.query.WherePredicate {
        let filterClauses = [
            neon.query.where(latitudeField, '>=', boundingBox.south),
            neon.query.where(latitudeField, '<=', boundingBox.north),
            neon.query.where(longitudeField, '>=', boundingBox.west),
            neon.query.where(longitudeField, '<=', boundingBox.east)
        ];
        return neon.query.and.apply(neon.query, filterClauses);
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

        return this.createBasicQuery(layerIndex).withFields(fields).limit(this.meta.limit);
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
            if (!this.active.singleColor) {
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
        let fields = [this.active.layers[layerIndex].latitudeField.columnName,
        this.active.layers[layerIndex].longitudeField.columnName];
        let neonFilters = this.filterService.getFiltersForFields(this.meta.layers[layerIndex].database.name,
            this.meta.layers[layerIndex].table.name, fields);
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
        let fields = [this.active.layers[layerIndex].latitudeField.columnName,
        this.active.layers[layerIndex].longitudeField.columnName];
        let neonFilters = this.filterService.getFiltersForFields(this.meta.layers[layerIndex].database.name,
            this.meta.layers[layerIndex].table.name, fields);
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
     * Redraws the map using the given map type.
     *
     * @arg {MapType} mapType
     */
    handleChangeMapType(mapType: MapType) {
        if (this.mapType !== mapType) {
            this.mapType = mapType;
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
                return createButtonText(this.meta.layers[0].docCount, this.meta.limit);
            }
            return this.meta.layers.map((layer) => {
                return layer.title + ' (' + createButtonText(layer.docCount, this.meta.limit) + ')';
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
     * Returns the default limit for the visualization.
     *
     * @return {number}
     * @override
     */
    getDefaultLimit() {
        return 1000;
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

    mouseWheelUp(_event) {
        if (_event.ctrlKey || _event.metaKey && !this.active.disableCtrlZoom && (this.mapType === 'Leaflet')) {
            this.mapObject.zoomIn();
        }
    }

    mouseWheelDown(_event) {
        if (_event.ctrlKey || _event.metaKey && !this.active.disableCtrlZoom && (this.mapType === 'Leaflet')) {
            this.mapObject.zoomOut();
        }
    }
}
