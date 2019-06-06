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
    Injector,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';

import { AbstractSearchService, CompoundFilterType, FilterClause, QueryPayload } from '../../services/abstract.search.service';
import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { DashboardService } from '../../services/dashboard.service';
import {
    CompoundFilterDesign,
    FilterBehavior,
    FilterDesign,
    FilterService,
    FilterUtil,
    SimpleFilterDesign
} from '../../services/filter.service';

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
import { FieldMetaData } from '../../types';
import { LeafletNeonMap } from './map.type.leaflet';
import { neonUtilities } from '../../neon-namespaces';
import {
    OptionChoices,
    WidgetFieldArrayOption,
    WidgetFieldOption,
    WidgetFreeTextOption,
    WidgetNonPrimitiveOption,
    WidgetOption,
    WidgetSelectOption
} from '../../widget-option';
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
    @ViewChild('visualization', { read: ElementRef }) visualization: ElementRef;
    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;

    @ViewChild('mapElement') mapElement: ElementRef;
    @ViewChild('mapOverlay') mapOverlayRef: ElementRef;

    public colorKeys: string[] = [];

    public filterVisible: Map<string, boolean> = new Map<string, boolean>();

    public mapTypes = MapTypePairs;

    protected mapObject: AbstractMap;

    public disabledSet: [string[]] = [] as any;

    public mapLayerIdsToTitles: Map<string, string> = new Map<string, string>();

    constructor(
        dashboardService: DashboardService,
        filterService: FilterService,
        searchService: AbstractSearchService,
        injector: Injector,
        protected widgetService: AbstractWidgetService,
        ref: ChangeDetectorRef,
        dialog: MatDialog
    ) {
        super(
            dashboardService,
            filterService,
            searchService,
            injector,
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
        let filters: FilterDesign[] = this.options.layers.map((layer) => this.createFilterDesignOnBox(layer, box.north, box.south,
            box.east, box.west));
        this.exchangeFilters(filters);
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
        let filters: FilterDesign[] = [];
        let filtersToDelete: FilterDesign[] = [];

        this.options.layers.forEach((layer) => {
            filters.push(this.createFilterDesignOnPoint(layer, lat, lon));
            layer.filterFields.forEach((filterField) => {
                let filterValues: any[] = neonUtilities.flatten(filterFieldToValueList.map((filterFieldToValue) =>
                    filterFieldToValue.get(filterField.columnName))).filter((value) => !!value);
                if (!filterValues.length) {
                    // Delete any previous filters on the filter field.
                    filtersToDelete.push(this.createFilterDesignOnValue(layer, filterField));
                } else {
                    // Create a separate filter on each value because each value is a distinct item in the data (overlapping points).
                    filters = filters.concat(filterValues.map((value) => this.createFilterDesignOnValue(layer, filterField, value)));
                }
            });
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
     * @arg {FieldMetaData} hoverPopupField
     * @arg {array} data
     * @return {array}
     * @protected
     */
    protected getMapPoints(databaseName: string, tableName: string, idField: string, filterFields: FieldMetaData[],
        lngField: string, latField: string, colorField: string, hoverPopupField: FieldMetaData, data: any[]): any[] {
        let map = new Map<string, UniqueLocationPoint>();

        for (let point of data) {
            let lngCoord = this.convertToFloatIfString(neonUtilities.deepFind(point, lngField));
            let latCoord = this.convertToFloatIfString(neonUtilities.deepFind(point, latField));
            let colorValue = neonUtilities.deepFind(point, colorField);
            let idValue = neonUtilities.deepFind(point, idField);
            let filterValues = new Map<string, any>();
            let hoverPopupValue = hoverPopupField.columnName ? neonUtilities.deepFind(point, hoverPopupField.columnName) : '';

            for (let field of filterFields) {
                let fieldValue = neonUtilities.deepFind(point, field.columnName);
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
        mapPoints.sort((point1, point2) => point2.count - point1.count);
        return mapPoints;
    }

    /**
     * Transforms the given array of query results using the given options into an array of objects to be shown in the visualization.
     * Returns the count of elements shown in the visualization.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any[]} results
     * @return {number}
     * @override
     */
    transformVisualizationQueryResults(options: any, results: any[]): number {
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

        return mapPoints.length;
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

    mouseWheelUp(event) {
        if (this.shouldZoom(event)) {
            this.mapObject.zoomIn();
        } else {
            this.overlay();
        }
    }

    mouseWheelDown(event) {
        if (this.shouldZoom(event)) {
            this.mapObject.zoomOut();
        } else {
            this.overlay();
        }
    }

    shouldZoom(event) {
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

    /**
     * Creates and returns an array of field options for the visualization.
     *
     * @return {(WidgetFieldOption|WidgetFieldArrayOption)[]}
     * @override
     */
    createFieldOptions(): (WidgetFieldOption | WidgetFieldArrayOption)[] {
        return [];
    }

    private createFilterDesignOnBox(layer: any, north?: number, south?: number, east?: number, west?: number): FilterDesign {
        return {
            type: CompoundFilterType.AND,
            filters: [{
                datastore: '',
                database: layer.database,
                table: layer.table,
                field: layer.latitudeField,
                operator: '>=',
                value: south
            }, {
                datastore: '',
                database: layer.database,
                table: layer.table,
                field: layer.latitudeField,
                operator: '<=',
                value: north
            }, {
                datastore: '',
                database: layer.database,
                table: layer.table,
                field: layer.longitudeField,
                operator: '>=',
                value: west
            }, {
                datastore: '',
                database: layer.database,
                table: layer.table,
                field: layer.longitudeField,
                operator: '<=',
                value: east
            }] as SimpleFilterDesign[]
        } as CompoundFilterDesign;
    }

    private createFilterDesignOnPoint(layer: any, latitude?: number, longitude?: number): FilterDesign {
        return {
            type: CompoundFilterType.AND,
            filters: [{
                datastore: '',
                database: layer.database,
                table: layer.table,
                field: layer.latitudeField,
                operator: '=',
                value: latitude
            }, {
                datastore: '',
                database: layer.database,
                table: layer.table,
                field: layer.longitudeField,
                operator: '=',
                value: longitude
            }] as SimpleFilterDesign[]
        } as CompoundFilterDesign;
    }

    private createFilterDesignOnValue(layer: any, field: FieldMetaData, value?: any): FilterDesign {
        return {
            root: CompoundFilterType.OR,
            datastore: '',
            database: layer.database,
            table: layer.table,
            field: field,
            operator: '=',
            value: value
        } as SimpleFilterDesign;
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
            }]),
            new WidgetFreeTextOption('west', 'West', null)
        ];
    }

    /**
     * Returns each type of filter made by this visualization as an object containing 1) a filter design with undefined values and 2) a
     * callback to redraw the filter.  This visualization will automatically update with compatible filters that were set externally.
     *
     * @return {FilterBehavior[]}
     * @override
     */
    protected designEachFilterWithNoValues(): FilterBehavior[] {
        let behaviors: FilterBehavior[] = [];

        this.options.layers.forEach((layer) => {
            if (layer.latitudeField.columnName && layer.longitudeField.columnName) {
                // Match a box filter on the layer's specific fields.
                behaviors.push({
                    filterDesign: this.createFilterDesignOnBox(layer),
                    redrawCallback: this.redrawFilterBox.bind(this)
                });
                // Match a point filter on the layer's specific fields.
                behaviors.push({
                    filterDesign: this.createFilterDesignOnPoint(layer),
                    redrawCallback: this.redrawFilterPoint.bind(this)
                });
            }

            layer.filterFields.forEach((filterField) => {
                behaviors.push({
                    // Match a single EQUALS filter on the specific filter field.
                    filterDesign: this.createFilterDesignOnValue(layer, filterField),
                    redrawCallback: () => { /* Do nothing */ }
                } as FilterBehavior);
            });
        });

        return behaviors;
    }

    private findMatchingFilterDesign(filterDesigns: SimpleFilterDesign[], fieldBinding: string, operator: string) {
        let matching: SimpleFilterDesign[] = filterDesigns.filter((filterDesign) => filterDesign.operator === operator &&
            this.options.layers.some((layer) => layer.database.name === filterDesign.database.name &&
                layer.table.name === filterDesign.table.name && layer[fieldBinding].columnName === filterDesign.field.columnName));
        return matching.length ? matching[0].value : undefined;
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

    private redrawFilterBox(filters: FilterDesign[]): void {
        let removeFilter = true;

        // Find the bounds inside the compound filter with an expected structure of createFilterDesignOnBox.
        // TODO THOR-1102 How should we handle multiple filters?  Should we draw multiple bounding boxes?
        if (filters.length && FilterUtil.isCompoundFilterDesign(filters[0])) {
            let boundsFilter: CompoundFilterDesign = (filters[0] as CompoundFilterDesign);

            if (boundsFilter && boundsFilter.filters.length === 4 && FilterUtil.isSimpleFilterDesign(boundsFilter.filters[0]) &&
                FilterUtil.isSimpleFilterDesign(boundsFilter.filters[1]) &&
                FilterUtil.isSimpleFilterDesign(boundsFilter.filters[2]) &&
                FilterUtil.isSimpleFilterDesign(boundsFilter.filters[3])) {
                let nestedFilters: SimpleFilterDesign[] = boundsFilter.filters as SimpleFilterDesign[];
                let north = this.findMatchingFilterDesign(nestedFilters, 'latitudeField', '<=');
                let south = this.findMatchingFilterDesign(nestedFilters, 'latitudeField', '>=');
                let east = this.findMatchingFilterDesign(nestedFilters, 'longitudeField', '<=');
                let west = this.findMatchingFilterDesign(nestedFilters, 'longitudeField', '>=');

                if (this.isNumber(north) && this.isNumber(south) && this.isNumber(east) && this.isNumber(west)) {
                    removeFilter = false;
                    // TODO THOR-1103 Update the bounding box element in the mapObject.
                }
            }
        }

        if (removeFilter && this.mapObject) {
            this.mapObject.removeFilterBox();
        }
    }

    private redrawFilterPoint(filters: FilterDesign[]): void {
        if (filters.length && this.mapObject) {
            // TODO THOR-1104 Update the selected point(s) in the mapObject.
        }
        if (!filters.length && this.mapObject) {
            // TODO THOR-1104 Remove the selected point(s) in the mapObject.
        }
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
