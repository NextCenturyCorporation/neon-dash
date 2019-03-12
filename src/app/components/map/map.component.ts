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

import { Color } from '../../color';

import { AbstractSearchService, NeonFilterClause, NeonQueryPayload } from '../../services/abstract.search.service';
import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';

import {
    AbstractMap,
    BoundingBoxByDegrees,
    FilterListener,
    MapPoint,
    MapType,
    MapTypePairs,
    whiteString
} from './map.type.abstract';
import { BaseNeonComponent, TransformedVisualizationData } from '../base-neon-component/base-neon.component';
import { CesiumNeonMap } from './map.type.cesium';
import { FieldMetaData } from '../../dataset';
import { LeafletNeonMap } from './map.type.leaflet';
import { neonMappings, neonUtilities } from '../../neon-namespaces';
import {
    OptionChoices,
    WidgetFieldArrayOption,
    WidgetFieldOption,
    WidgetFreeTextOption,
    WidgetNonPrimitiveOption,
    WidgetOption,
    WidgetSelectOption
} from '../../widget-option';
import * as neon from 'neon-framework';
import * as _ from 'lodash';
import * as geohash from 'geo-hash';

class UniqueLocationPoint {
    constructor(public idField: string, public idList: string[], public filterList: Map<string, any>[],
        public filterMap: Map<string, any>, public lat: number, public lng: number, public count: number,
        public colorField: string, public colorValue: string, public hoverPopupMap: Map<string, number>) { }
}

@Component({
    selector: 'app-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapComponent extends BaseNeonComponent implements OnInit, OnDestroy, AfterViewInit, FilterListener {
    @ViewChild('visualization', { read: ElementRef }) visualization: ElementRef;
    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;

    @ViewChild('mapElement') mapElement: ElementRef;
    @ViewChild('mapOverlay') mapOverlayRef: ElementRef;

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

    public colorKeys: string[] = [];

    public filterVisible: Map<string, boolean> = new Map<string, boolean>();

    public mapTypes = MapTypePairs;

    protected mapObject: AbstractMap;
    protected filterBoundingBox: BoundingBoxByDegrees;

    public disabledSet: [string[]] = [] as any;

    constructor(
        datasetService: DatasetService,
        filterService: FilterService,
        searchService: AbstractSearchService,
        injector: Injector,
        protected widgetService: AbstractWidgetService,
        ref: ChangeDetectorRef
    ) {
        super(
            datasetService,
            filterService,
            searchService,
            injector,
            ref
        );

        this.isMultiLayerWidget = true;

        (<any> window).CESIUM_BASE_URL = 'assets/Cesium';

        this.updateOnSelectId = true;
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
     * Initializes any visualization properties when the widget is created.
     *
     * @override
     */
    initializeProperties() {
        // Backwards compatibility (mapType deprecated and replaced by type).
        this.options.type = this.injector.get('mapType', this.options.type);
    }

    /**
     * Creates any visualization elements when the widget is drawn.
     *
     * @override
     */
    constructVisualization() {
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
    }

    /**
     * Removes any visualization elements when the widget is deleted.
     *
     * @override
     */
    destroyVisualization() {
        return this.mapObject && this.mapObject.destroy();
    }

    /**
     * Runs any needed behavior after a new layer was added.
     *
     * @arg {any} options
     * @override
     */
    postAddLayer(options: any) {
        this.filterVisible.set(options._id, true);
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
                this.replaceNeonFilter(this.options.layers[i], true, localFilters, neonFilter);
            } else {
                this.addNeonFilter(this.options.layers[i], true, localFilters, neonFilter);
            }
        }
    }

    filterByMapPoint(filters: Map<string, any>[], lat: number, lon: number) {
        let fieldsByLayer = this.options.layers.map((layer) => {
            return {
                latitude: layer.latitudeField.columnName,
                longitude: layer.longitudeField.columnName,
                prettyLatitude: layer.latitudeField.prettyName,
                prettyLongitude: layer.longitudeField.prettyName,
                fields: layer.filterFields
            };
        });

        let localLayerName = 'latitude equals ' + lat + ' and longitude equals ' + lon,
            localFilters = this.createFilter(fieldsByLayer, localLayerName),
            neonFilters = this.filterService.getFiltersByOwner(this.id);

        this.addLocalFilter(localFilters);

        for (let i = 0; i < localFilters.fieldsByLayer.length; i++) {
            let neonPointFilter = this.createNeonPointFilter(lat, lon, localFilters.fieldsByLayer[i].latitude,
                localFilters.fieldsByLayer[i].longitude);

            if (neonFilters && neonFilters.length) {
                this.filterHistory.push(neonFilters[0]);
                localFilters.id = neonFilters[0].id;
                this.replaceNeonFilter(this.options.layers[i], true, localFilters, neonPointFilter);
            } else {
                this.addNeonFilter(this.options.layers[i], true, localFilters, neonPointFilter);
            }
        }

        for (let i = 0; i < this.options.layers.length; i++) {
            this.manageFieldFilters(fieldsByLayer[i], this.options.layers[i], filters, neonFilters);
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
     * Creates and returns the neon filter clause object using the given arguments
     *
     * @arg {string} idField
     * @arg {array} idValues
     * @return {neon.query.WherePredicate}
     */
    createNeonFieldFilter(idField: string, idValues: string[]): neon.query.WherePredicate {
        let clauses = [];

        for (let value of idValues) {
            clauses.push(neon.query.where(idField, '=', value));
        }

        return neon.query.or.apply(neon.query, clauses);
    }

    /**
     * Creates or replaces neon filter with the given fields and name.
     *
     * @arg {array} fieldsByLayer
     * @arg {array} fieldFilters
     * @arg {array} neonFilters
     */
    manageFieldFilters(fieldsByLayer, layerOptions, fieldFilters, neonFilters) {
        for (let field of fieldsByLayer.fields) {
            let fieldValues: string[] = [],
                fieldName = field.columnName;
            for (let filter of fieldFilters) {
                fieldValues.push(filter.get(fieldName));
            }
            fieldValues = neonUtilities.flatten(fieldValues);
            let fieldObject = this.createFilter(fieldsByLayer, ' ' + fieldName + ' = ' + fieldValues.join(',')),
                neonIdFilter = this.createNeonFieldFilter(fieldName, fieldValues);
            if (neonFilters && neonFilters.length) {
                if (fieldObject) {
                    this.replaceNeonFilter(layerOptions, true, fieldObject, neonIdFilter);
                }
            } else {
                this.addNeonFilter(layerOptions, true, fieldObject, neonIdFilter);
            }
        }
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
     * Returns whether the visualization query created using the given options is valid.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     * @override
     */
    validateVisualizationQuery(options: any): boolean {
        return !!(options.database.name && options.table.name && options.latitudeField.columnName && options.longitudeField.columnName);
    }

    /**
     * Finalizes the given visualization query by adding the aggregations, filters, groups, and sort using the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {NeonQueryPayload} queryPayload
     * @arg {NeonFilterClause[]} sharedFilters
     * @return {NeonQueryPayload}
     * @override
     */
    finalizeVisualizationQuery(options: any, query: NeonQueryPayload, sharedFilters: NeonFilterClause[]): NeonQueryPayload {
        let filters: NeonFilterClause[] = [
            this.searchService.buildFilterClause(options.latitudeField.columnName, '!=', null),
            this.searchService.buildFilterClause(options.longitudeField.columnName, '!=', null)
        ];

        this.searchService.updateFilter(query, this.searchService.buildBoolFilterClause(sharedFilters.concat(filters)));

        return query;
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
                    this.mapObject.unhidePoints(layer._id, value);
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
     * @arg {string} databaseName
     * @arg {string} tableName
     * @arg {string} idField
     * @arg {string} lngField
     * @arg {string} latField
     * @arg {string} colorField
     * @arg {FieldMetaData} hoverPopupField
     * @arg {array} data
     * @return {array}
     * @protected
     */
    protected getMapPoints(databaseName: string, tableName: string, idField: string, filterFields: FieldMetaData[],
       lngField: string, latField: string, colorField: string, hoverPopupField: FieldMetaData, data: any[]
    ): any[] {

        let map = new Map<string, UniqueLocationPoint>();

        for (let point of data) {
            let lngCoord = this.convertToFloatIfString(neonUtilities.deepFind(point, lngField)),
                latCoord = this.convertToFloatIfString(neonUtilities.deepFind(point, latField)),
                colorValue = neonUtilities.deepFind(point, colorField),
                idValue = neonUtilities.deepFind(point, idField),
                filterValues = new Map<string, any>(),
                hoverPopupValue = hoverPopupField.columnName ? neonUtilities.deepFind(point, hoverPopupField.columnName) : '';

            for (let field of filterFields) {
                let fieldValue = neonUtilities.deepFind(point, field.columnName);
                filterValues.set(field.columnName, fieldValue);
            }

            //use first value if deepFind returns an array
            colorValue = colorValue instanceof Array ? (colorValue.length ? colorValue[0] : '') : colorValue;
            idValue = idValue instanceof Array ? (idValue.length ? idValue[0] : '') : idValue;

            if (latCoord instanceof Array && lngCoord instanceof Array) {
                for (let pos = latCoord.length - 1; pos >= 0; pos--) {

                    //check if hover popup value is nested within coordinate array
                    if (hoverPopupValue instanceof Array) {
                        this.addOrUpdateUniquePoint(map, filterValues, idValue, latCoord[pos], lngCoord[pos], colorField, colorValue,
                            (hoverPopupField.prettyName ? hoverPopupField.prettyName + ':  ' : '') + hoverPopupValue[pos]);
                    } else {
                        this.addOrUpdateUniquePoint(map, filterValues, idValue, latCoord[pos], lngCoord[pos], colorField, colorValue,
                            (hoverPopupField.prettyName ? hoverPopupField.prettyName + ':  ' : '') + hoverPopupValue);
                    }
                }
            } else {
                this.addOrUpdateUniquePoint(map, filterValues, idValue, latCoord, lngCoord, colorField, colorValue, hoverPopupValue);
            }
        }

        let mapPoints: MapPoint[] = [];
        let rgbColor = this.widgetService.getThemeAccentColorHex();
        map.forEach((unique) => {
            let color = rgbColor;
            if (!this.options.singleColor) {
                color = !unique.colorValue ? whiteString : this.widgetService.getColor(databaseName, tableName, colorField,
                    unique.colorValue).getComputedCss(this.visualization);
            }

            let name = `${unique.lat.toFixed(3)}\u00b0, ${unique.lng.toFixed(3)}\u00b0`;
            mapPoints.push(new MapPoint(unique.idField, unique.idList, unique.filterList, unique.filterMap, name, unique.lat, unique.lng,
                unique.count, color, 'Count: ' + unique.count, unique.colorField, unique.colorValue, unique.hoverPopupMap));
        });
        mapPoints.sort((a, b) => b.count - a.count);
        return mapPoints;
    }

    /**
     * Transforms the given array of query results using the given options into the array of objects to be shown in the visualization.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any[]} results
     * @return {TransformedVisualizationData}
     * @override
     */
    transformVisualizationQueryResults(options: any, results: any[]): TransformedVisualizationData {
        // TODO Need to either preprocess data to get color, size scales OR see if neon aggregations can give ranges.
        // TODO break this function into smaller bits so it is more understandable.

        if (!this.mapObject) {
            return;
        }

        // TODO Move singleColor to layer options.
        //check if colorField was not defines or (None)
        if (options.colorField.columnName === '') {
            this.options.singleColor = true;
        } else {
            this.options.singleColor = false;
        }

        let mapPoints: MapPoint[] = this.getMapPoints(
            options.database.name,
            options.table.name,
            options.idField.columnName,
            options.filterFields,
            options.longitudeField.columnName,
            options.latitudeField.columnName,
            options.colorField.columnName,
            options.hoverPopupField,
            results
        );

        this.mapObject.unhideAllPoints(options._id);

        this.mapObject.clearLayer(options._id);
        this.mapObject.addPoints(mapPoints, options._id, options.cluster);

        this.filterMapForLegend();
        this.updateLegend();

        return new TransformedVisualizationData(mapPoints);
    }

    /**
     * Updates the map legend using the layers.
     */
    updateLegend() {
        let colorKeys: string[] = [];
        for (let layer of this.options.layers) {
            if (layer.colorField.columnName !== '') {
                colorKeys.push(this.widgetService.getColorKey(layer.database.name, layer.table.name, layer.colorField.columnName));
            }
        }
        this.colorKeys = colorKeys;
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
                    this.mapObject.hidePoints(layer._id, value);
                }
            }
        }
    }

    addOrUpdateUniquePoint(map: Map<string, UniqueLocationPoint>, filterMap: Map<string, any>, idValue: string, lat: number, lng: number,
        colorField: string, colorValue: string, hoverPopupValue: string) {

        if (!super.isNumber(lat) || !super.isNumber(lng)) {
            return;
        }

        let hashCode = geohash.encode(lat, lng) + ' - ' + colorValue,
            obj = map.get(hashCode);

        //check if point has already been created
        if (!obj) {

            let idList: string[] = [];
                idList.push(idValue);  //store the id of the unique point

            let filterList: any[] = [];
            filterList.push(filterMap);

            let hoverPopupMap = new Map<string, number>();

            //add to map if hover value exists
            if (hoverPopupValue) {
                hoverPopupMap.set(hoverPopupValue, 1);
            }
            obj = new UniqueLocationPoint(idValue, idList, filterList, filterMap, lat, lng, 1, colorField, colorValue, hoverPopupMap);
            map.set(hashCode, obj);
        } else {
            obj.idList.push(idValue);  //add the id to the list of points
            obj.filterList.push(filterMap);
            obj.count++;

            //check if popup value already exists increase count in map
            if (hoverPopupValue && (obj.hoverPopupMap.has(hoverPopupValue)))  {
                obj.hoverPopupMap.set(hoverPopupValue, obj.hoverPopupMap.get(hoverPopupValue));
            } else {
                obj.hoverPopupMap.set(hoverPopupValue, 1);
            }
        }
    }

    /**
     * Updates and redraws the elements and properties for the visualization.
     *
     * @override
     */
    refreshVisualization() {
        // Cesium doesn't need to be refreshed manually
    }

    /**
     * Returns whether the layer with the given options is filtered.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    doesLayerStillHaveFilter(options: any): boolean {
        let fields = [options.latitudeField.columnName, options.longitudeField.columnName];
        let neonFilters = this.filterService.getFiltersForFields(options.database.name, options.table.name, fields);
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

    hasLayerFilterChanged(options: any): boolean {
        let filterChanged = true;
        let fields = [options.latitudeField.columnName, options.longitudeField.columnName];
        let neonFilters = this.filterService.getFiltersForFields(options.database.name, options.table.name, fields);
        let clauses = this.getClausesFromFilterWithIdenticalArguments(neonFilters, [
            options.latitudeField.columnName,
            options.longitudeField.columnName
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
        this.options.layers.forEach((layer) => {
            let layerHasFilter: boolean = this.doesLayerStillHaveFilter(layer);
            oneOrMoreLayersHaveFilters = oneOrMoreLayersHaveFilters || layerHasFilter;
            allLayersHaveFilters = allLayersHaveFilters && layerHasFilter;
            let filterHasChanged = this.hasLayerFilterChanged(layer);
            oneOrMoreFiltersHaveChanged = oneOrMoreFiltersHaveChanged || filterHasChanged;
        });
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

        this.options.layers.forEach((layer) => {
            if (neonFilters.length > 1) {
                this.filterHistory.push(neonFilters);
                for (let neonFilter of neonFilters) {
                    this.removeLocalFilterFromLocalAndNeon(layer, neonFilter, true, false);
                }
            } else {
                this.filterHistory.push(neonFilters[0]);
                this.removeLocalFilterFromLocalAndNeon(layer, filter, true, false);
            }
        });

        this.removeFilter();
    }

    /**
     * Toggles the visibility of the filter for the layer with the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     */
    toggleFilter(options: any): void {
        this.filterVisible.set(options._id, !(this.filterVisible.get(options._id)));
    }

    /**
     * Returns the icon for the filter for the layer with the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {string}
     */
    getIconForFilter(options: any): string {
        return this.filterVisible.get(options._id) ? 'keyboard_arrow_up' : 'keyboard_arrow_down';
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
     * Returns the label for the data items that are currently shown in this visualization (Bars, Lines, Nodes, Points, Rows, Terms, ...).
     * Uses the given count to determine plurality.
     *
     * @arg {number} count
     * @return {string}
     * @override
     */
    public getVisualizationElementLabel(count: number): string {
        return 'Point' + (count === 1 ? '' : 's');
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

    /**
     * Creates and returns an array of field options for the visualization.
     *
     * @return {(WidgetFieldOption|WidgetFieldArrayOption)[]}
     * @override
     */
    createFieldOptions(): (WidgetFieldOption | WidgetFieldArrayOption)[] {
        return [];
    }

    /**
     * Creates and returns an array of field options for a layer for the visualization.
     *
     * @return {(WidgetFieldOption|WidgetFieldArrayOption)[]}
     * @override
     */
    createLayerFieldOptions(): (WidgetFieldOption | WidgetFieldArrayOption)[] {
        return [
            new WidgetFieldOption('latitudeField', 'Latitude Field', true),
            new WidgetFieldOption('longitudeField', 'Longitude Field', true),
            new WidgetFieldOption('colorField', 'Color Field', false),
            new WidgetFieldOption('dateField', 'Date Field', false),
            new WidgetFieldOption('hoverPopupField', 'Hover Popup Field', false),
            new WidgetFieldOption('idField', 'ID Field', false),
            new WidgetFieldOption('sizeField', 'Size Field', false),
            new WidgetFieldArrayOption('filterFields', 'Filter Fields', false)
        ];
    }

    /**
     * Creates and returns an array of non-field options for a layer for the visualization.
     *
     * @return {WidgetOption[]}
     * @override
     */
    createLayerNonFieldOptions(): WidgetOption[] {
        return [
            new WidgetSelectOption('cluster', 'Cluster', false, OptionChoices.NoFalseYesTrue)
        ];
    }

    /**
     * Creates and returns an array of non-field options for the visualization.
     *
     * @return {WidgetOption[]}
     * @override
     */
    createNonFieldOptions(): WidgetOption[] {
        return [
            new WidgetFreeTextOption('clusterPixelRange', 'Cluster Pixel Range', 15),
            new WidgetSelectOption('showPointDataOnHover', 'Coordinates on Point Hover', false, OptionChoices.HideFalseShowTrue),
            // Properties of customServer:  useCustomServer: boolean, mapUrl: string, layer: string
            new WidgetNonPrimitiveOption('customServer', 'Custom Server', null),
            new WidgetSelectOption('disableCtrlZoom', 'Disable Control Zoom', false, OptionChoices.NoFalseYesTrue),
            new WidgetFreeTextOption('east', 'East', null),
            // Properties of hoverSelect:  hoverTime: number
            new WidgetNonPrimitiveOption('hoverSelect', 'Hover Select', null),
            new WidgetFreeTextOption('minClusterSize', 'Minimum Cluster Size', 5),
            new WidgetFreeTextOption('north', 'North', null),
            new WidgetSelectOption('singleColor', 'Single Color', false, OptionChoices.NoFalseYesTrue),
            new WidgetFreeTextOption('south', 'South', null),
            new WidgetSelectOption('type', 'Map Type', MapType.Leaflet, [{
                prettyName: 'Leaflet',
                variable: MapType.Leaflet
            }, {
                prettyName: 'Cesium',
                variable: MapType.Cesium
            }]),
            new WidgetFreeTextOption('west', 'West', null)
        ];
    }
    /**
     * Returns the default limit for the visualization.
     *
     * @return {string}
     * @override
     */
    getVisualizationDefaultLimit(): number {
        return 1000;
    }

    /**
     * Returns the default title for the visualization.
     *
     * @return {string}
     * @override
     */
    getVisualizationDefaultTitle(): string {
        return 'Map';
    }
}
