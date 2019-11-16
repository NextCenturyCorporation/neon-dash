/**
 * Copyright 2019 Next Century Corporation
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
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';

import { AbstractSearchService, FilterClause, QueryPayload } from 'component-library/dist/core/services/abstract.search.service';
import { InjectableColorThemeService } from '../../services/injectable.color-theme.service';
import { DashboardService } from '../../services/dashboard.service';
import {
    AbstractFilter,
    AbstractFilterDesign,
    BoundsFilter,
    BoundsFilterDesign,
    BoundsValues,
    FilterCollection,
    ListFilter,
    ListFilterDesign,
    PairFilter,
    PairFilterDesign
} from 'component-library/dist/core/models/filters';
import { InjectableFilterService } from '../../services/injectable.filter.service';

import {
    AbstractMap,
    BoundingBoxByDegrees,
    FilterListener,
    MapPoint,
    MapType,
    MapTypePairs,
    whiteString
} from './map.type.abstract';
import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { DatasetUtil, FieldConfig } from 'component-library/dist/core/models/dataset';
import { LeafletNeonMap } from './map.type.leaflet';
import { CoreUtil } from 'component-library/dist/core/core.util';
import {
    CompoundFilterType,
    OptionChoices,
    ConfigOptionFieldArray,
    ConfigOptionField,
    ConfigOptionNumber,
    ConfigOptionNonPrimitive,
    ConfigOption,
    ConfigOptionSelect
} from 'component-library/dist/core/models/config-option';
import * as geohash from 'geo-hash';
import { MatDialog } from '@angular/material';

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
    @ViewChild('headerText', { static: true }) headerText: ElementRef;
    @ViewChild('infoText', { static: true }) infoText: ElementRef;

    @ViewChild('mapElement', { static: true }) mapElement: ElementRef;
    @ViewChild('mapOverlay', { static: true }) mapOverlayRef: ElementRef;

    public colorKeys: string[] = [];

    public filterVisible: Map<string, boolean> = new Map<string, boolean>();

    public mapTypes = MapTypePairs;

    protected mapObject: AbstractMap;

    public disabledSet: [string[]] = [] as any;

    public mapLayerIdsToTitles: Map<string, string> = new Map<string, string>();

    // Save the values of the filters in the FilterService that are compatible with this visualization's filters.
    private _layersToFilteredPoints: Map<string, any[]> = new Map<string, any[]>();
    private _layersToFilterFieldsToFilteredValues: Map<string, Map<string, any[]>> = new Map<string, Map<string, any[]>>();

    constructor(
        dashboardService: DashboardService,
        filterService: InjectableFilterService,
        searchService: AbstractSearchService,
        protected colorThemeService: InjectableColorThemeService,
        ref: ChangeDetectorRef,
        dialog: MatDialog,
        public visualization: ElementRef
    ) {
        super(
            dashboardService,
            filterService,
            searchService,
            ref,
            dialog
        );

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
        if (typeof this.options.mapType !== 'undefined') {
            this.options.type = this.options.mapType;
        }
    }

    /**
     * Creates any visualization elements when the widget is drawn.
     *
     * @override
     */
    constructVisualization() {
        if (!CoreUtil.isNumber(this.options.type)) {
            this.options.type = MapType[this.options.type] || MapType.Leaflet;
        }
        switch (this.options.type) {
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
     * Sets the filter on the given bounding box.
     *
     * Function for the FilterListener interface.
     *
     * @arg {BoundingBoxByDegrees} box
     * @override
     */
    public filterByLocation(box: BoundingBoxByDegrees): void {
        let filters: AbstractFilterDesign[] = this.options.layers.map((layer) => this.createFilterDesignOnBox(layer, box.north, box.south,
            box.east, box.west));

        this.exchangeFilters(filters, [], true);
    }

    /**
     * Sets the filter on the given map point and the given map of filter fields and values.
     *
     * Function for the FilterListener interface.
     *
     * @arg {Map<string,any>[]} filterFieldToValueList
     * @arg {number} lat
     * @arg {number} lon
     * @override
     */
    public filterByMapPoint(filterFieldToValueList: Map<string, any>[], lat: number, lon: number): void {
        let filters: AbstractFilterDesign[] = [];
        let filtersToDelete: AbstractFilterDesign[] = [];

        this.options.layers.forEach((layer) => {
            // Change or toggle the filtered points on the map layer.
            let filteredPoints = this._layersToFilteredPoints.get(layer.id) || [];
            if (this.options.toggleFiltered) {
                if (filteredPoints.some((point) => point[0] === lat && point[1] === lon)) {
                    filteredPoints = filteredPoints.filter((point) => point[0] === lat && point[1] === lon);
                } else {
                    filteredPoints.push([lat, lon]);
                }
            } else {
                filteredPoints = [[lat, lon]];
            }
            this._layersToFilteredPoints.set(layer.id, filteredPoints);
            // Create filters on the filtered points.
            filters = filters.concat(filteredPoints.map((point) => this.createFilterDesignOnPoint(layer, point[0], point[1])));

            // Change or toggle the filtered values on the map layer.
            let fieldsToValues = this._layersToFilterFieldsToFilteredValues.get(layer.id) || new Map<string, any[]>();
            layer.filterFields.forEach((field) => {
                // Get all the values for the filter field from the filterFieldToValueList argument.
                const values = CoreUtil.flatten(filterFieldToValueList.map((filterFieldToValue) =>
                    filterFieldToValue.get(field.columnName))).filter((value) => !!value);

                // Change or toggle the filtered values for the filter field.
                const filteredValues = CoreUtil.changeOrToggleMultipleValues(values, fieldsToValues.get(field.columnName) || [],
                    this.options.toggleFiltered);

                fieldsToValues.set(field.columnName, filteredValues);

                if (filteredValues.length) {
                    // Create a single filter on the filtered values.
                    filters = filters.concat(this.createFilterDesignOnValue(layer, field, filteredValues));
                } else {
                    // If we won't add any filters, create a FilterDesign without a value to delete all the old filters on the filter field.
                    filtersToDelete.push(this.createFilterDesignOnValue(layer, field));
                }
            });
            this._layersToFilterFieldsToFilteredValues.set(layer.id, fieldsToValues);
        });

        this.exchangeFilters(filters, filtersToDelete);
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
     * @arg {QueryPayload} queryPayload
     * @arg {FilterClause[]} sharedFilters
     * @return {QueryPayload}
     * @override
     */
    finalizeVisualizationQuery(options: any, query: QueryPayload, sharedFilters: FilterClause[]): QueryPayload {
        let filters: FilterClause[] = [
            this.searchService.buildFilterClause(options.latitudeField.columnName, '!=', null),
            this.searchService.buildFilterClause(options.longitudeField.columnName, '!=', null)
        ];

        this.searchService.updateFilter(query, this.searchService.buildCompoundFilterClause(sharedFilters.concat(filters)));

        return query;
    }

    legendItemSelected(event: any) {
        let fieldName: string = event.fieldName;
        let value: string = event.value;
        let currentlyActive: boolean = event.currentlyActive;

        if (currentlyActive) {
            for (let layer of this.options.layers) {
                if (layer.colorField.columnName === fieldName) {
                    this.mapObject.hidePoints(layer._id, value);
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
            this.disabledSet = this.disabledSet.filter((set) => !(set[0] === fieldName && set[1] === value)) as [string[]];
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
     * @arg {FieldConfig} hoverPopupField
     * @arg {array} data
     * @return {array}
     * @protected
     */
    protected getMapPoints(databaseName: string, tableName: string, idField: string, filterFields: FieldConfig[],
        lngField: string, latField: string, colorField: string, hoverPopupField: FieldConfig, data: any[]): any[] {
        let map = new Map<string, UniqueLocationPoint>();

        for (let point of data) {
            let lngCoord = this.convertToFloatIfString(CoreUtil.deepFind(point, lngField));
            let latCoord = this.convertToFloatIfString(CoreUtil.deepFind(point, latField));
            let colorValue = CoreUtil.deepFind(point, colorField);
            let idValue = CoreUtil.deepFind(point, idField);
            let filterValues = new Map<string, any>();
            let hoverPopupValue = hoverPopupField.columnName ? CoreUtil.deepFind(point, hoverPopupField.columnName) : '';

            for (let field of filterFields) {
                let fieldValue = CoreUtil.deepFind(point, field.columnName);
                filterValues.set(field.columnName, fieldValue);
            }

            // Use first value if deepFind returns an array
            colorValue = colorValue instanceof Array ? (colorValue.length ? colorValue[0] : '') : colorValue;
            idValue = idValue instanceof Array ? (idValue.length ? idValue[0] : '') : idValue;

            if (latCoord instanceof Array && lngCoord instanceof Array) {
                for (let pos = latCoord.length - 1; pos >= 0; pos--) {
                    // Check if hover popup value is nested within coordinate array
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
        let rgbColor = this.colorThemeService.getThemeAccentColorHex();
        map.forEach((unique) => {
            let color = rgbColor;
            if (!this.options.singleColor) {
                color = !unique.colorValue ? whiteString : this.colorThemeService.getColor(databaseName, tableName, colorField,
                    unique.colorValue).getComputedCss(this.visualization.nativeElement);
            }

            let name = `${unique.lat.toFixed(3)}\u00b0, ${unique.lng.toFixed(3)}\u00b0`;
            mapPoints.push(new MapPoint(unique.idField, unique.idList, unique.filterList, unique.filterMap, name, unique.lat, unique.lng,
                unique.count, color, 'Count: ' + unique.count, unique.colorField, unique.colorValue, unique.hoverPopupMap));
        });
        mapPoints.sort((point1, point2) => point2.count - point1.count);
        return mapPoints;
    }

    /**
     * Transforms the given array of query results using the given options into an array of objects to be shown in the visualization.
     * Returns the count of elements shown in the visualization.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any[]} results
     * @arg {FilterCollection} filters
     * @return {number}
     * @override
     */
    transformVisualizationQueryResults(options: any, results: any[], filters: FilterCollection): number {
        // TODO Need to either preprocess data to get color, size scales OR see if neon aggregations can give ranges.
        // TODO break this function into smaller bits so it is more understandable.

        if (!this.mapObject) {
            return 0;
        }

        // TODO Move singleColor to layer options.
        // check if colorField was not defines or (None)
        if (options.colorField.columnName === '') {
            this.options.singleColor = true;
        } else {
            this.options.singleColor = false;
        }

        // TODO THOR-1104 Update the selected (filtered) map point(s) using the given filters.
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

        let existingLayerTitle = this.mapLayerIdsToTitles.get(options._id);

        if ((existingLayerTitle && existingLayerTitle !== options.title) || !existingLayerTitle) {
            this.mapLayerIdsToTitles.set(options._id, options.title);
            this.mapObject.addPoints(mapPoints, options._id, options.cluster, options.title);
        } else {
            this.mapObject.addPoints(mapPoints, options._id, options.cluster, undefined);
        }

        this.filterMapForLegend();
        this.updateLegend();

        // Redraw the latest filters in the visualization element.
        this.redrawFilters(filters);

        return mapPoints.length;
    }

    /**
     * Updates the map legend using the layers.
     */
    updateLegend() {
        let colorKeys: string[] = [];
        for (let layer of this.options.layers) {
            if (layer.colorField.columnName !== '') {
                colorKeys.push(this.colorThemeService.getColorKey(layer.database.name, layer.table.name, layer.colorField.columnName));
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
        if (!CoreUtil.isNumber(lat) || !CoreUtil.isNumber(lng)) {
            return;
        }

        let hashCode = geohash.encode(lat, lng) + ' - ' + colorValue;
        let obj = map.get(hashCode);

        // Check if point has already been created
        if (!obj) {
            let idList: string[] = [];
            idList.push(idValue); // Store the id of the unique point

            let filterList: any[] = [];
            filterList.push(filterMap);

            let hoverPopupMap = new Map<string, number>();

            // Add to map if hover value exists
            if (hoverPopupValue) {
                hoverPopupMap.set(hoverPopupValue, 1);
            }
            obj = new UniqueLocationPoint(idValue, idList, filterList, filterMap, lat, lng, 1, colorField, colorValue, hoverPopupMap);
            map.set(hashCode, obj);
        } else {
            obj.idList.push(idValue); // Add the id to the list of points
            obj.filterList.push(filterMap);
            obj.count++;

            // Check if popup value already exists increase count in map
            if (hoverPopupValue && (obj.hoverPopupMap.has(hoverPopupValue))) {
                obj.hoverPopupMap.set(hoverPopupValue, obj.hoverPopupMap.get(hoverPopupValue));
            } else {
                obj.hoverPopupMap.set(hoverPopupValue, 1);
            }
        }
    }

    /**
     * Redraws this visualization with the given compatible filters.
     *
     * @override
     */
    protected redrawFilters(filters: FilterCollection): void {
        let removeFilter = true;

        // Add or remove a bounding box on the map depending on if the bounds is filtered.
        // TODO THOR-1102 Does this work with multiple layers?  Should a bounds filter on one layer always affect all of the other layers?
        this.options.layers.forEach((layer) => {
            const boundsFilters: AbstractFilter[] = filters.getCompatibleFilters(this.createFilterDesignOnBox(layer));
            if (boundsFilters.length) {
                // TODO THOR-1102 How should we handle multiple filters?  Should we draw multiple bounding boxes?
                for (const boundsFilter of boundsFilters) {
                    const bounds: BoundsValues = (boundsFilter as BoundsFilter).retrieveValues();
                    const fieldKey1 = DatasetUtil.deconstructTableOrFieldKeySafely(bounds.field1);
                    const fieldKey2 = DatasetUtil.deconstructTableOrFieldKeySafely(bounds.field2);
                    if (fieldKey1.field === layer.latitudeField.columnName && fieldKey2.field === layer.longitudeField.columnName) {
                        this.mapObject.drawBoundary([bounds.end1 as number, bounds.end2 as number], [bounds.begin1 as number,
                            bounds.begin2 as number]);
                    }
                    if (fieldKey2.field === layer.latitudeField.columnName && fieldKey1.field === layer.longitudeField.columnName) {
                        this.mapObject.drawBoundary([bounds.end2 as number, bounds.end1 as number], [bounds.begin2 as number,
                            bounds.begin1 as number]);
                    }
                }
                removeFilter = false;
            }

            // Update the filtered values for the map points.
            const mapPointFilters: AbstractFilter[] = filters.getCompatibleFilters(this.createFilterDesignOnPoint(layer));
            this._layersToFilteredPoints.set(layer.id, mapPointFilters.map((mapPointFilter) => {
                const pairFilter = mapPointFilter as PairFilter;
                return [pairFilter.value1, pairFilter.value2];
            }));
            // TODO THOR-1104 Update the selected points in the map element using the filtered points.

            // Update the filtered values for the filter fields.
            let filteredValues: Map<string, any[]> = this._layersToFilterFieldsToFilteredValues.get(layer.id) || new Map<string, any[]>();
            layer.filterFields.forEach((field) => {
                const listFilters: ListFilter[] = filters.getCompatibleFilters(this.createFilterDesignOnValue(layer, field)) as
                    ListFilter[];
                filteredValues.set(field.columnName, CoreUtil.retrieveValuesFromListFilters(listFilters));
            });
            this._layersToFilterFieldsToFilteredValues.set(layer.id, filteredValues);
        });

        if (removeFilter) {
            this.mapObject.removeFilterBox();
        }
    }

    /**
     * Updates and redraws the elements and properties for the visualization.
     *
     * @override
     */
    refreshVisualization() {
        // Do nothing.
    }

    /**
     * Redraws the map using the given map type.
     *
     * @arg {MapType} mapType
     */
    handleChangeMapType() {
        if (this.mapObject) {
            this.mapObject.destroy();
        }
        this.ngAfterViewInit(); // Re-initialize map
    }

    /**
     * @override
     * @param {MapType} mapType
     */
    handleChangeSubcomponentType() {
        this.handleChangeMapType();
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

    mouseWheelUp(event: MouseWheelEvent) {
        if (this.shouldZoom(event)) {
            this.mapObject.zoomIn();
        } else {
            this.overlay();
        }
    }

    mouseWheelDown(event: MouseWheelEvent) {
        if (this.shouldZoom(event)) {
            this.mapObject.zoomOut();
        } else {
            this.overlay();
        }
    }

    shouldZoom(event: MouseEvent) {
        const ctrlMetaPressed = event.ctrlKey || event.metaKey;
        const usingLeaflet = this.options.type === MapType.Leaflet;
        const ctrlZoomEnabled = !this.options.disableCtrlZoom;
        return (ctrlMetaPressed && ctrlZoomEnabled && usingLeaflet);
    }

    overlay() {
        this.mapOverlayRef.nativeElement.style.zIndex = '1000';
        setTimeout(
            () => {
                this.mapOverlayRef.nativeElement.style.zIndex = '-1';
            },
            1400
        );
    }

    getOverlayText() {
        return (
            navigator.platform.toLowerCase().includes('mac') ?
                'Use ⌘ + scroll wheel to zoom' :
                'Use ctrl + scroll wheel to zoom'
        );
    }

    private createFilterDesignOnBox(layer: any, north?: number, south?: number, east?: number, west?: number): BoundsFilterDesign {
        return new BoundsFilterDesign(
            layer.datastore.name + '.' + layer.database.name + '.' + layer.table.name + '.' + layer.latitudeField.columnName,
            layer.datastore.name + '.' + layer.database.name + '.' + layer.table.name + '.' + layer.longitudeField.columnName,
            south,
            west,
            north,
            east
        );
    }

    private createFilterDesignOnPoint(layer: any, latitude?: number, longitude?: number): PairFilterDesign {
        return new PairFilterDesign(
            CompoundFilterType.AND,
            layer.datastore.name + '.' + layer.database.name + '.' + layer.table.name + '.' + layer.latitudeField.columnName,
            layer.datastore.name + '.' + layer.database.name + '.' + layer.table.name + '.' + layer.longitudeField.columnName,
            '=',
            '=',
            latitude,
            longitude
        );
    }

    private createFilterDesignOnValue(layer: any, field: FieldConfig, values: any[] = [undefined]): ListFilterDesign {
        return new ListFilterDesign(CompoundFilterType.OR, layer.datastore.name + '.' + layer.database.name + '.' + layer.table.name + '.' +
            field.columnName, '=', values);
    }

    /**
     * Creates and returns an array of options for a layer for the visualization.
     *
     * @return {ConfigOption[]}
     * @override
     */
    protected createOptionsForLayer(): ConfigOption[] {
        return [
            new ConfigOptionField('latitudeField', 'Latitude Field', true),
            new ConfigOptionField('longitudeField', 'Longitude Field', true),
            new ConfigOptionField('colorField', 'Color Field', false),
            new ConfigOptionField('dateField', 'Date Field', false),
            new ConfigOptionField('hoverPopupField', 'Hover Popup Field', false),
            new ConfigOptionField('idField', 'ID Field', false),
            new ConfigOptionField('sizeField', 'Size Field', false),
            new ConfigOptionFieldArray('filterFields', 'Filter Fields', false),
            new ConfigOptionSelect('cluster', 'Cluster', false, false, OptionChoices.NoFalseYesTrue)
        ];
    }

    /**
     * Creates and returns an array of options for the visualization.
     *
     * @return {ConfigOption[]}
     * @override
     */
    protected createOptions(): ConfigOption[] {
        return [
            new ConfigOptionNumber('clusterPixelRange', 'Cluster Pixel Range', false, 15),
            new ConfigOptionSelect('showPointDataOnHover', 'Coordinates on Point Hover', false, false, OptionChoices.HideFalseShowTrue),
            // Properties of customServer:  useCustomServer: boolean, mapUrl: string, layer: string
            new ConfigOptionNonPrimitive('customServer', 'Custom Server', false, null),
            new ConfigOptionSelect('disableCtrlZoom', 'Disable Control Zoom', false, false, OptionChoices.NoFalseYesTrue),
            new ConfigOptionNumber('east', 'East', false, null),
            // Properties of hoverSelect:  hoverTime: number
            new ConfigOptionNonPrimitive('hoverSelect', 'Hover Select', false, null),
            new ConfigOptionNumber('minClusterSize', 'Minimum Cluster Size', false, 5),
            new ConfigOptionNumber('north', 'North', false, null),
            new ConfigOptionSelect('singleColor', 'Single Color', false, false, OptionChoices.NoFalseYesTrue),
            new ConfigOptionNumber('south', 'South', false, null),
            new ConfigOptionSelect('type', 'Map Type', true, MapType.Leaflet, [{
                prettyName: 'Leaflet',
                variable: MapType.Leaflet
            }]),
            new ConfigOptionNumber('west', 'West', false, null),
            new ConfigOptionSelect('toggleFiltered', 'Toggle Filtered Items', false, false, OptionChoices.NoFalseYesTrue),
            new ConfigOptionSelect('applyPreviousFilter', 'Apply the previous filter on remove filter action',
                false, false, OptionChoices.NoFalseYesTrue)
        ];
    }

    /**
     * Returns the design for each type of filter made by this visualization.  This visualization will automatically update itself with all
     * compatible filters that were set internally or externally whenever it runs a visualization query.
     *
     * @return {AbstractFilterDesign[]}
     * @override
     */
    protected designEachFilterWithNoValues(): AbstractFilterDesign[] {
        return this.options.layers.reduce((designs, layer) => {
            if (layer.latitudeField.columnName && layer.longitudeField.columnName) {
                // Match a box filter on the layer's specific fields.
                designs.push(this.createFilterDesignOnBox(layer));
                // Match a point filter on the layer's specific fields.
                designs.push(this.createFilterDesignOnPoint(layer));
            }

            return layer.filterFields.reduce((nestedConfigs, filterField) => {
                if (filterField.columnName) {
                    // Match a single EQUALS filter on the specific filter field.
                    nestedConfigs.push(this.createFilterDesignOnValue(layer, filterField));
                }
                return nestedConfigs;
            }, designs);
        }, [] as AbstractFilterDesign[]);
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

    /**
     * Returns whether to create a default layer if no layers are configured.
     *
     * @return {boolean}
     * @override
     */
    protected shouldCreateDefaultLayer(): boolean {
        return true;
    }
}
