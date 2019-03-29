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
import { AfterViewInit, ChangeDetectorRef, Injector, OnDestroy, OnInit } from '@angular/core';

import { AbstractSearchService, AggregationType, FilterClause, QueryPayload } from '../../services/abstract.search.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { FieldMetaData } from '../../dataset';
import { neonEvents } from '../../neon-namespaces';
import {
    OptionChoices,
    OptionType,
    WidgetFieldArrayOption,
    WidgetFieldOption,
    WidgetFreeTextOption,
    WidgetNonPrimitiveOption,
    WidgetOption,
    WidgetOptionCollection,
    WidgetSelectOption,
    WidgetTableOption
} from '../../widget-option';

import * as neon from 'neon-framework';
import * as _ from 'lodash';

export class TransformedVisualizationData {
    constructor(protected _data: any = []) {}

    get data(): any {
        return this._data;
    }

    /**
     * Returns the length of the data if it is an array or 0 otherwise (override as needed).
     *
     * @return {number}
     */
    public count(): number {
        return this._data instanceof Array ? this._data.length : 0;
    }
}

/**
 * @class BaseNeonComponent
 *
 * Superclass widget for all Neon visualizations with common behavior for the Neon Dashboard and Neon Services.
 */
export abstract class BaseNeonComponent implements AfterViewInit, OnInit, OnDestroy {
    private SETTINGS_BUTTON_WIDTH: number = 30;
    private TEXT_MARGIN_WIDTH: number = 10;
    private TOOLBAR_PADDING_WIDTH: number = 20;
    private TOOLBAR_EXTRA_WIDTH: number = this.SETTINGS_BUTTON_WIDTH + this.TEXT_MARGIN_WIDTH + this.TOOLBAR_PADDING_WIDTH;
    protected TOOLBAR_HEIGHT: number = 40;

    private nextLayerIndex = 1;

    protected id: string;
    protected messenger: neon.eventing.Messenger;

    // Maps the options/layer ID to the active transformed visualization data.
    private layerIdToActiveData: Map<string, TransformedVisualizationData> = new Map<string, TransformedVisualizationData>();

    // Maps the options/layer ID to the element count.
    private layerIdToElementCount: Map<string, number> = new Map<string, number>();

    // Maps the options/layer ID to the query ID to the query object.
    private layerIdToQueryIdToQueryObject: Map<string, Map<string, any>> = new Map<string, Map<string, any>>();

    public errorMessage: string = '';
    public loadingCount: number = 0;

    protected initializing: boolean = false;
    protected redrawOnResize: boolean = false;
    protected selectedDataId: string = '';
    protected showNoData: boolean = false;
    protected showingZeroOrMultipleElementsPerResult: boolean = false;
    protected updateOnSelectId: boolean = false;
    protected visualizationQueryPaginates: boolean = false;

    // The data pagination properties.
    protected lastPage: boolean = true;
    protected page: number = 1;
    protected savedPages: Map<string, number> = new Map<string, number>();

    // A WidgetOptionCollection object.  Must use "any" type to avoid typescript errors.
    public options: any;

    constructor(
        protected datasetService: DatasetService,
        protected filterService: FilterService,
        protected searchService: AbstractSearchService,
        protected injector: Injector,
        public changeDetection: ChangeDetectorRef
    ) {
        this.messenger = new neon.eventing.Messenger();
    }

    /**
     * Angular lifecycle hook:  Creates the visualization and runs the query.
     */
    public ngAfterViewInit(): void {
        this.constructVisualization();
        this.executeAllQueryChain();
    }

    /**
     * Angular lifecycle hook:  Initializes widget properties and registers with listeners as needed.
     */
    public ngOnInit(): void {
        this.initializing = true;

        this.options = this.createWidgetOptions(this.injector, this.getVisualizationDefaultTitle(), this.getVisualizationDefaultLimit());
        this.options.title = this.getVisualizationTitle(this.options.title);
        this.id = this.options._id;

        this.messenger.subscribe('filters_changed', this.handleFiltersChangedEvent.bind(this));
        this.messenger.subscribe('select_id', (eventMessage) => {
            if (this.updateOnSelectId) {
                (this.options.layers.length ? this.options.layers : [this.options]).forEach((layer) => {
                    if (eventMessage.database === layer.database.name && eventMessage.table === layer.table.name) {
                        let eventMessageId = Array.isArray(eventMessage.id) ? eventMessage.id[0] : eventMessage.id;
                        if (eventMessageId !== this.selectedDataId) {
                            this.onSelectId(layer, eventMessageId);
                            this.selectedDataId = eventMessageId;
                            this.handleChangeData(layer);
                        }
                    }
                });
            }
        });
        this.messenger.publish(neonEvents.WIDGET_REGISTER, {
            id: this.id,
            widget: this
        });

        try {
            this.setupFilters();
        } catch (e) {
            // Fails in unit tests - ignore.
        }

        this.initializeProperties();
        this.initializing = false;
    }

    /**
     * Runs any needed behavior after a new layer was added.
     *
     * @arg {any} options A WidgetOptionCollection object.
     */
    protected postAddLayer(options: any): void {
        // Override if needed.
    }

    /**
     * Creates any visualization elements when the widget is drawn.
     */
    protected constructVisualization(): void {
        // Override if needed.
    }

    /**
     * Removes any visualization elements when the widget is deleted.
     */
    protected destroyVisualization(): void {
        // Override if needed.
    }

    /**
     * Initializes any visualization properties when the widget is created.
     */
    protected initializeProperties(): void {
        // Override if needed.
    }

    /**
     * Adds a new layer for the visualization using the given bindings.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any} [layerBindings={}]
     */
    public addLayer(options: any, layerBindings: any = {}): any {
        let layerOptions = this.createLayer(options, layerBindings);
        this.finalizeCreateLayer(layerOptions);
    }

    private createLayer(options: any, layerBindings: any = {}): any {
        let layerOptions = new WidgetOptionCollection(this.createLayerFieldOptions.bind(this), undefined, layerBindings);
        layerOptions.inject(new WidgetFreeTextOption('title', 'Title', 'Layer ' + this.nextLayerIndex++));
        layerOptions.inject(this.createLayerNonFieldOptions());
        layerOptions.updateDatabases(this.datasetService);
        options.layers.push(layerOptions);
        return layerOptions;
    }

    private finalizeCreateLayer(layerOptions: any): void {
        this.layerIdToQueryIdToQueryObject.set(layerOptions._id, new Map<string, any>());
        this.postAddLayer(layerOptions);
    }

    private deleteLayer(options: any, layerOptions: any): boolean {
        let layers: any[] = options.layers.filter((layer) => layer._id !== layerOptions._id);
        // Do not delete the final layer!
        if (layers.length) {
            options.layers = layers;
            return true;
        }
        return false;
    }

    private finalizeDeleteLayer(layerOptions: any): void {
        Array.from(this.layerIdToQueryIdToQueryObject.get(layerOptions._id).keys()).forEach((key) => {
            this.layerIdToQueryIdToQueryObject.get(layerOptions._id).get(key).abort();
        });
        this.layerIdToQueryIdToQueryObject.delete(layerOptions._id);
        // Delete the layer's data from this visualization.
        this.handleChangeData(layerOptions);
    }

    /**
     * Returns the export header data using the given options and visualization query.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {QueryPayload} query
     * @return {{name:string,data:any}}
     */
    private createExportOptions(options: any, query: QueryPayload): { name: string, data: any } {
        let exportName = options.title.split(':').join(' ');
        let exportQuery: any = this.searchService.transformQueryPayloadToExport(query);
        return {
            // TODO THOR-861 What is this name?  Should it really be hard-coded?
            name: 'Query_Results_Table',
            data: {
                query: exportQuery,
                name: exportName + '-' + options._id,
                fields: this.getExportFields(options).map((exportFieldsObject) => ({
                    query: exportFieldsObject.columnName,
                    pretty: exportFieldsObject.prettyName || exportFieldsObject.columnName
                })),
                ignoreFilters: exportQuery.ignoreFilters,
                selectionOnly: exportQuery.selectionOnly,
                ignoredFilterIds: [],
                type: 'query'
            }
        };
    }

    /**
     * Returns the export header data.
     *
     * @return {{name:string,data:any}[]}
     */
    public createExportData(): { name: string, data: any }[] {
        return (this.options.layers.length ? this.options.layers : [this.options]).map((options) => {
            let query: QueryPayload = this.createCompleteVisualizationQuery(options);
            return query ? this.createExportOptions(options, query) : [];
        }).filter((exportObject) => !!exportObject);
    }

    /**
     * Returns an object containing the ElementRef objects for the visualization.
     *
     * @return {any} Object containing:  {ElementRef} headerText, {ElementRef} infoText, {ElementRef} visualization
     */
    public abstract getElementRefs(): any;

    /**
     * Handles any needed behavior before the widget is resized.
     */
    public onResizeStart() {
        // Override if needed.
    }

    /**
     * Updates the header text styles.
     */
    private updateHeaderTextStyles() {
        let refs = this.getElementRefs();
        if (refs.headerText && refs.infoText && refs.visualization) {
            refs.headerText.nativeElement.style.maxWidth = Math.floor(refs.visualization.nativeElement.clientWidth -
                refs.infoText.nativeElement.clientWidth - this.TOOLBAR_EXTRA_WIDTH - 1) + 'px';
        }
    }

    /**
     * Updates the visualization as needed whenever it is resized.
     */
    protected updateOnResize() {
        // Override if needed.
    }

    /**
     * Handles any needed behavior once the widget is resized.
     */
    public onResizeStop() {
        this.updateHeaderTextStyles();

        this.updateOnResize();

        if (this.redrawOnResize) {
            // This event fires as soon as the user releases the mouse, but NgGrid animates the resize,
            // so the current width and height are not the new width and height.  NgGrid uses a 0.25
            // second transition so wait until that has finished before redrawing.
            setTimeout(() => { this.refreshVisualization(); }, 300);
        }
    }

    /**
     * Angular lifecycle hook:  Removes the visualization from the page and unregisters from listeners as needed.
     */
    public ngOnDestroy() {
        this.messenger.unsubscribeAll();
        this.messenger.publish(neonEvents.WIDGET_UNREGISTER, {
            id: this.id
        });
        this.destroyVisualization();
    }

    /**
     * Stops propagation of the given event.
     *
     * @arg {event} event
     */
    public stopEventPropagation(event) {
        if (event.stopPropagation) {
            event.stopPropagation();
        } else {
            event.returnValue = false;
        }
    }

    /**
     * Get a text decription of a filter
     * @param filter
     */
    abstract getFilterText(filter: any): string;

    /**
     * Must return null for no filters.  Returning an empty array causes the
     * query to ignore ALL fitlers.
     */
    abstract getFiltersToIgnore(): string[];

    /**
     * Adds a new filter to neon and runs a visualization query.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {boolean} executeQueryChainOnSuccess
     * @arg {object} subclassFilter
     * @arg {neon.query.WherePredicate} wherePredicate
     * @arg {function} [callback]
     */
    public addNeonFilter(options: any, executeQueryChainOnSuccess: boolean, subclassFilter: any, wherePredicate: neon.query.WherePredicate,
        callback?: Function): void {

        let filterName = {
            visName: options.title,
            text: this.getFilterText(subclassFilter)
        };
        let onSuccess = (response: any) => {
            if (typeof response === 'string') {
                subclassFilter.id = response;
            }
            if (callback) {
                callback();
            }
            if (executeQueryChainOnSuccess) {
                this.savedPages.set(subclassFilter.id, this.page);
                this.page = 1;
                this.executeQueryChain(options);
            }
        };
        this.filterService.addFilter(this.messenger,
            this.id,
            options.database.name,
            options.table.name,
            wherePredicate,
            filterName,
            onSuccess.bind(this),
            (response: any) => {
                this.messenger.publish(neonEvents.DASHBOARD_ERROR, {
                    error: response.responseJSON.stackTrace,
                    message: 'Add filter failed on visualization ' + options.title + ' database ' + options.database.name + ' table ' +
                        options.table.name
                });
                if (callback) {
                    callback();
                }
            });
        this.changeDetection.detectChanges();
    }

    /**
     * Adds all the given filters to neon and runs a visualization query.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {{singleFilter:any,clause:neon.query.WherePredicate}[]} filters
     * @arg {function} [callback]
     */
    public addMultipleFilters(options: any, filters: { singleFilter: any, clause: neon.query.WherePredicate }[],
        callback?: Function): void {

        if (!filters.length) {
            if (callback) {
                callback();
            }
            this.page = 1;
            this.executeQueryChain(options);
            return;
        }

        this.addNeonFilter(options, false, filters[0].singleFilter, filters[0].clause, () => {
            this.savedPages.set(filters[0].singleFilter.id, this.page);
            this.addMultipleFilters(options, filters.slice(1), callback);
        });
    }

    /**
     * Replaces a filter in neon and runs a visualization query.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {boolean} executeQueryChainOnSuccess
     * @arg {object} subclassFilter
     * @arg {neon.query.WherePredicate} wherePredicate
     * @arg {function} [callback]
     */
    public replaceNeonFilter(options: any, executeQueryChainOnSuccess: boolean, subclassFilter: any,
        wherePredicate: neon.query.WherePredicate, callback?: Function): void {

        let filterName = {
            visName: options.title,
            text: this.getFilterText(subclassFilter)
        };
        let onSuccess = (response: any) => {
            if (callback) {
                callback();
            }
            if (executeQueryChainOnSuccess) {
                this.savedPages.set(subclassFilter.id, this.page);
                this.page = 1;
                this.executeQueryChain(options);
            }
        };
        this.filterService.replaceFilter(
            this.messenger,
            subclassFilter.id,
            this.id,
            options.database.name,
            options.table.name,
            wherePredicate,
            filterName,
            onSuccess.bind(this),
            (response: any) => {
                this.messenger.publish(neonEvents.DASHBOARD_ERROR, {
                    error: response.responseJSON.stackTrace,
                    message: 'Replace filter failed on visualization ' + options.title + ' database ' + options.database.name + ' table ' +
                        options.table.name
                });
                if (callback) {
                    callback();
                }
            });
        this.changeDetection.detectChanges();
    }

    /**
     * Run before executing all the data queries for the visualization.
     * Used to notify the visualization that queries are imminent.
     */
    public beforeExecuteAllQueryChain(): void {
        // do nothing by default
    }

    /**
     * Runs all the data queries for the visualization.  Called on initialization, if a user changes the visualization config or sets a
     * filter, or whenever else the data queries need to be run.
     */
    private executeAllQueryChain(): void {
        if (!this.initializing) {
            this.beforeExecuteAllQueryChain();
            for (let options of (this.options.layers.length ? this.options.layers : [this.options])) {
                this.executeQueryChain(options);
            }
        }
    }

    /**
     * Runs the visualization query using the given options (or this.options if no options are given).
     *
     * @arg {any} [options=this.options] A WidgetOptionCollection object.
     */
    private executeQueryChain(options?: any): void {
        let queryOptions = options || this.options;

        if (!this.initializing && this.validateVisualizationQuery(queryOptions)) {
            this.changeDetection.detectChanges();

            let query: QueryPayload = this.createCompleteVisualizationQuery(queryOptions);

            if (query) {
                this.searchService.updateLimit(query, this.options.limit);

                if (this.visualizationQueryPaginates) {
                    this.searchService.updateOffset(query, (this.page - 1) * this.options.limit);
                }

                let filtersToIgnore = this.getFiltersToIgnore();
                if (filtersToIgnore && filtersToIgnore.length && (query as any).query) {
                    // TODO THOR-946
                    (query as any).query.ignoreFilters(filtersToIgnore);
                }

                this.executeQuery(queryOptions, query, 'default visualization query', this.handleSuccessfulVisualizationQuery.bind(this));
            }
        }
    }

    /**
     * Returns whether the visualization query created using the given options is valid.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     * @abstract
     */
    public abstract validateVisualizationQuery(options: any): boolean;

    /**
     * Finalizes the given visualization query by adding the aggregations, filters, groups, and sort using the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {QueryPayload} queryPayload
     * @arg {FilterClause[]} sharedFilters
     * @return {QueryPayload}
     * @abstract
     */
    public abstract finalizeVisualizationQuery(options: any, queryPayload: QueryPayload,
        sharedFilters: FilterClause[]): QueryPayload;

    /**
     * Creates and returns the visualization query with the database, table, and fields, but not the limit or offset.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {QueryPayload}
     */
    public createCompleteVisualizationQuery(options: any): QueryPayload {
        let fields: string[] = options.list().reduce((list: string[], option: WidgetOption) => {
            if (option.optionType === OptionType.FIELD && option.valueCurrent.columnName) {
                list.push(option.valueCurrent.columnName);
            }
            if (option.optionType === OptionType.FIELD_ARRAY) {
                option.valueCurrent.filter((fieldsObject) => !!fieldsObject.columnName).forEach((fieldsObject) => {
                    list.push(fieldsObject.columnName);
                });
            }
            return list;
        }, []);

        if (options.filter && options.filter.lhs && options.filter.operator && typeof options.filter.rhs !== 'undefined') {
            fields = [options.filter.lhs].concat(fields);
        }

        (options.customEventsToPublish || []).forEach((config) => {
            (config.fields || []).forEach((fieldsConfig) => {
                if (fields.indexOf(fieldsConfig.columnName) < 0) {
                    fields.push(fieldsConfig.columnName);
                }
            });
        });

        (options.customEventsToReceive || []).forEach((config) => {
            (config.fields || []).forEach((fieldsConfig) => {
                if (fields.indexOf(fieldsConfig.columnName) < 0) {
                    fields.push(fieldsConfig.columnName);
                }
            });
        });

        let query: QueryPayload = this.searchService.buildQueryPayload(options.database.name, options.table.name, fields);
        return this.finalizeVisualizationQuery(options, query, this.createSharedFilters(options));
    }

    /**
     * Creates and returns the shared filters for the visualization query.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {FilterClause[]}
     */
    public createSharedFilters(options: any): FilterClause[] {
        let filters: FilterClause[] = [];
        if (options.filter && options.filter.lhs && options.filter.operator && typeof options.filter.rhs !== 'undefined') {
            filters.push(this.searchService.buildFilterClause(options.filter.lhs, options.filter.operator, options.filter.rhs));
        }
        if (this.hasUnsharedFilter(options)) {
            filters.push(this.searchService.buildFilterClause(options.unsharedFilterField.columnName, '=', options.unsharedFilterValue));
        }
        return filters;
    }

    /**
     * Handles the given response data for a successful total count query created using the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any} response
     * @arg {() => void} callback
     * @abstract
     */
    private handleSuccessfulTotalCountQuery(options: any, response: any, callback: () => void): void {
        if (!response || !response.data || !response.data.length || response.data[0]._count === undefined) {
            this.layerIdToElementCount.set(options._id, 0);
        } else {
            this.layerIdToElementCount.set(options._id, response.data[0]._count);
        }
        this.lastPage = ((this.page * this.options.limit) >= this.layerIdToElementCount.get(options._id));
        // Decrease loadingCount because of the visualization query.
        this.loadingCount--;
        callback();
    }

    /**
     * Creates the transformed visualization data using the given options and results and then calls the given success callback function.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any[]} results
     * @arg {(data: TransformedVisualizationData) => void} successCallback
     * @arg {(err: Error) => void} successCallback
     */
    protected handleTransformVisualizationQueryResults(options: any, results: any[],
        successCallback: (data: TransformedVisualizationData) => void, failureCallback: (err: Error) => void): void {

        try {
            let data = this.transformVisualizationQueryResults(options, results);
            successCallback(data);
        } catch (err) {
            failureCallback(err);
        }
    }

    /**
     * Handles the given response data for a successful visualization query created using the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any} response
     * @arg {() => void} callback
     * @abstract
     */
    private handleSuccessfulVisualizationQuery(options: any, response: any, callback: () => void): void {
        if (!response || !response.data || !response.data.length) {
            // TODO THOR-985 Don't call transformVisualizationQueryResults
            this.transformVisualizationQueryResults(options, []);
            this.errorMessage = 'No Data';
            //this.showNoData = true;
            this.layerIdToActiveData.set(options._id, new TransformedVisualizationData());
            this.layerIdToElementCount.set(options._id, 0);
            this.clearVisualizationData(options);
            callback();
            return;
        }

        let successCallback = (data: TransformedVisualizationData) => {
            this.errorMessage = '';
            this.layerIdToActiveData.set(options._id, data);

            if (this.visualizationQueryPaginates && !this.showingZeroOrMultipleElementsPerResult) {
                let countQuery: QueryPayload = this.createCompleteVisualizationQuery(options);
                if (countQuery) {
                    // Do not add a limit or an offset!
                    this.searchService.updateAggregation(countQuery, AggregationType.COUNT, '_count', '*');
                    let filtersToIgnore = this.getFiltersToIgnore();
                    if (filtersToIgnore && filtersToIgnore.length && (countQuery as any).query) {
                        // TODO THOR-946
                        (countQuery as any).query.ignoreFilters(filtersToIgnore);
                    }
                    this.executeQuery(options, countQuery, 'total count query', this.handleSuccessfulTotalCountQuery.bind(this));
                    // Ignore our own callback since the visualization will be refreshed within handleSuccessfulTotalCountQuery.
                } else {
                    this.lastPage = ((this.page * this.options.limit) >= this.layerIdToElementCount.get(options._id));
                    callback();
                }
            } else {
                // If the visualization query paginates but is showing zero or multiple elements per result, we cannot determine the page,
                // so just set lastPage to false.
                this.lastPage = this.visualizationQueryPaginates ? false : true;
                this.layerIdToElementCount.set(options._id, this.layerIdToActiveData.get(options._id).count());
                callback();
            }
        };

        let failureCallback = (err: Error) => {
            this.errorMessage = 'Error';
            this.messenger.publish(neonEvents.DASHBOARD_ERROR, {
                error: err,
                message: 'FAILED ' + options.title + ' transform results'
            });
            this.layerIdToActiveData.set(options._id, new TransformedVisualizationData());
            this.layerIdToElementCount.set(options._id, 0);
            callback();
        };

        this.handleTransformVisualizationQueryResults(options, response.data, successCallback, failureCallback);
    }

    /**
     * Transforms the given array of query results using the given options into the array of objects to be shown in the visualization.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any[]} results
     * @return TransformedVisualizationData
     * @abstract
     */
    public abstract transformVisualizationQueryResults(options: any, results: any[]): TransformedVisualizationData;

    /**
     * Returns the active transformed visualization data (or null) for the given options (or this.options if no options are given).
     *
     * @arg {any} [options=this.options] A WidgetOptionCollection object.
     * @return {TransformedVisualizationData}
     */
    public getActiveData(options?: any): TransformedVisualizationData {
        return this.layerIdToActiveData.get((options || this.options)._id) || null;
    }

    /**
     * Updates and redraws the elements and properties for the visualization.
     */
    public abstract refreshVisualization(): void;

    /**
     * Finishes the execution of any query by decreasing the loadingCount and updating Angular.
     */
    private finishQueryExecution(): void {
        this.loadingCount--;
        this.refreshVisualization();
        this.changeDetection.detectChanges();
        this.updateHeaderTextStyles();
        this.noDataCheck();
    }

    /**
     * Runs the given query.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {QueryPayload} query
     * @arg {string} queryId
     * @arg {(options: any, response: any, callback: () => void) => void} callback
     */
    private executeQuery(options: any, query: QueryPayload, queryId: string,
        callback: (options: any, response: any, callback: () => void) => void) {

        this.loadingCount++;

        if (this.cannotExecuteQuery(options) || !this.layerIdToQueryIdToQueryObject.has(options._id)) {
            if (this.layerIdToQueryIdToQueryObject.has(options._id) && this.layerIdToQueryIdToQueryObject.get(options._id).has(queryId)) {
                this.layerIdToQueryIdToQueryObject.get(options._id).get(queryId).abort();
            }
            callback(options, {
                data: []
            }, this.finishQueryExecution.bind(this));
            return;
        }

        //If we have any labelOptions in the config, we want to edit the data to convert whatever data items that are specified to the
        //"pretty" name. The pretty name goes to the visualizations, but it must be converted back before doing a query as the
        //database won't recognize the pretty name.
        this.searchService.transformFilterClauseValues(query, this.getLabelOptions(options));

        if (this.layerIdToQueryIdToQueryObject.get(options._id).has(queryId)) {
            this.layerIdToQueryIdToQueryObject.get(options._id).get(queryId).abort();
        }

        this.layerIdToQueryIdToQueryObject.get(options._id).set(queryId, this.searchService.runSearch(
            this.datasetService.getDatastoreType(), this.datasetService.getDatastoreHost(), query));

        this.layerIdToQueryIdToQueryObject.get(options._id).get(queryId).always(() => {
            this.layerIdToQueryIdToQueryObject.get(options._id).delete(queryId);
        });

        this.layerIdToQueryIdToQueryObject.get(options._id).get(queryId).done((response) => {
            callback(options, this.prettifyLabels(options, response), this.finishQueryExecution.bind(this));
        });

        this.layerIdToQueryIdToQueryObject.get(options._id).get(queryId).fail((response) => {
            this.loadingCount--;
            if (response.statusText !== 'abort') {
                this.messenger.publish(neonEvents.DASHBOARD_ERROR, {
                    error: response.responseJSON.stackTrace,
                    message: 'FAILED ' + options.title + ' ' + queryId
                });
                this.changeDetection.detectChanges();
            }
        });
    }

    /**
     * Returns whether this visualization cannot execute its query right now.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    private cannotExecuteQuery(options: any): boolean {
        return (!this.searchService.canRunSearch(this.datasetService.getDatastoreType(), this.datasetService.getDatastoreHost()) ||
            (this.options.hideUnfiltered && !this.filterService.getFiltersForFields(options.database.name, options.table.name).length));
    }

    /**
     * Handles any needed behavior on a filtersChanged event and then runs the visualization query.
     */
    private handleFiltersChangedEvent(): void {
        this.setupFilters();
        this.executeAllQueryChain();
    }

    /**
     * Get and configure filters from the filter service.
     * DO NOT EXECUTE QUERIES IN THIS METHOD.
     * This method will be called before the visualization has finished initialization!
     */
    abstract setupFilters(): void;

    /**
     * Returns the list of closeable filters for the visualization.
     *
     * @return {array}
     */
    abstract getCloseableFilters(): any[];

    /**
     * Updates filters whenever a filter field is changed and then runs the visualization query.
     *
     * @arg {any} [options=this.options] A WidgetOptionCollection object.
     */
    public handleChangeFilterField(options?: any): void {
        let optionsToUpdate = options || this.options;
        this.removeAllFilters(optionsToUpdate, this.getCloseableFilters(), false, false, () => {
            this.setupFilters();
            this.handleChangeData(optionsToUpdate);
        });
    }

    /**
     * Updates elements and properties whenever the widget config is changed.
     */
    protected onChangeData() {
        // Override if needed.
    }

    /**
     * Handles any behavior needed whenever the widget config is changed and then runs the visualization query.
     *
     * @arg {any} [options=this.options] A WidgetOptionCollection object.
     */
    public handleChangeData(options?: any): void {
        this.layerIdToActiveData.delete((options || this.options)._id);
        this.layerIdToElementCount.set((options || this.options)._id, 0);

        this.errorMessage = '';
        this.lastPage = true;
        this.page = 1;
        this.showingZeroOrMultipleElementsPerResult = false;

        this.onChangeData();

        if (!options) {
            this.executeAllQueryChain();
        } else {
            this.executeQueryChain(options);
        }
    }

    /**
     * Handles any behavior needed whenever the subcomponent type is changed and
     * then runs the visualization query.
     *
     * @arg {any} [options=this.options] A WidgetOptionCollection object.
     */
    public handleChangeSubcomponentType(options?: any) {
        this.handleChangeData(options);
    }

    /**
     * Called when a filter has been removed
     * @param filter The filter to remove: either a neon filter as stored in the filter service, or a local filter.
     */
    abstract removeFilter(filter: any): void;

    /**
     * Returns whether the local unshared filter field and value are set.
     *
     * @arg {any} [options=this.options] A WidgetOptionCollection object.
     * @return {boolean}
     */
    private hasUnsharedFilter(options?: any): boolean {
        return !!((options || this.options).unsharedFilterField && (options || this.options).unsharedFilterField.columnName &&
            typeof (options || this.options).unsharedFilterValue !== 'undefined' && (options || this.options).unsharedFilterValue !== '');
    }

    /**
     * Remove a filter from neon, and optionally requery and/or refresh
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {object} filter
     * @arg {boolean} requery
     * @arg {boolean} refresh
     * @arg {function} [callback]
     */
    public removeLocalFilterFromLocalAndNeon(options: any, filter: any, requery: boolean, refresh: boolean, callback?: Function) {
        // If we are removing a filter, assume its both local and neon so it should be removed in both
        let database = options.database.name;
        let table = options.table.name;
        this.filterService.removeFilters(
            this.messenger,
            [filter.id],
            (removedFilter) => {
                if (removedFilter) {
                    this.removeFilter(removedFilter);
                } else {
                    // No filter removed means undefined or old ID. Pass this back to remove itself.
                    this.removeFilter(filter);
                }
                if (requery) {
                    this.page = this.savedPages.get(filter.id) || 1;
                    this.savedPages.delete(filter.id);
                    this.executeQueryChain(options);
                } else {
                    if (refresh) {
                        this.refreshVisualization();
                    }
                }
                this.changeDetection.detectChanges();
                if (callback) {
                    callback();
                }
            },
            (response: any) => {
                this.messenger.publish(neonEvents.DASHBOARD_ERROR, {
                    error: response.responseJSON.stackTrace,
                    message: 'Remove filter failed on visualization ' + options.title + ' database ' + options.database.name + ' table ' +
                        options.table.name
                });
            });
        this.changeDetection.detectChanges();
    }

    /**
     * Removes all the given filters from this component and neon with an optional callback.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {array} filters
     * @arg {boolean} requery
     * @arg {boolean} refresh
     * @arg {function} [callback]
     */
    public removeAllFilters(options: any, filters: any[], requery: boolean, refresh: boolean, callback?: Function) {
        if (!filters.length) {
            // If removeAllFilters is called with no filters, we don't need to requery or refresh.
            if (callback) {
                callback();
            }
        } else if (filters.length === 1) {
            // Remove the last filter.
            this.removeLocalFilterFromLocalAndNeon(options, filters[0], requery, refresh, callback);
        } else {
            // Remove the next filter.  Don't requery or refresh because this is not the last call.
            this.removeLocalFilterFromLocalAndNeon(options, filters[0], false, false, () => {
                this.removeAllFilters(options, filters.slice(1), requery, refresh, callback);
            });
        }
    }

    /**
     * Creates and returns the text for the settings button using the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {number} queryLimit
     * @return {string}
     */
    private createButtonText(options: any, queryLimit: number): string {
        // If the query was not yet run, show no text unless waiting on an event.
        if (!this.layerIdToElementCount.has(options._id)) {
            // TODO Add support for 'Please Select'
            return this.options.hideUnfiltered ? 'Please Filter' : '';
        }

        let elementCount = this.layerIdToElementCount.get(options._id);
        let elementLabel = this.getVisualizationElementLabel(elementCount);

        // If the query was empty, show the relevant text.
        if (!elementCount) {
            return (this.options.hideUnfiltered && !this.getCloseableFilters().length) ? 'Please Filter' :
                ('0' + (elementLabel ? (' ' + elementLabel) : ''));
        }

        // If the visualization query does pagination, show the pagination text.
        if (this.visualizationQueryPaginates && !this.showingZeroOrMultipleElementsPerResult) {
            let begin = this.prettifyInteger((this.page - 1) * queryLimit + 1);
            let end = this.prettifyInteger(Math.min(this.page * queryLimit, elementCount));
            if (elementCount <= queryLimit) {
                return this.prettifyInteger(elementCount) + (elementLabel ? (' ' + elementLabel) : '');
            }
            return (begin === end ? begin : (begin + ' - ' + end)) + ' of ' + this.prettifyInteger(elementCount) +
                (elementLabel ? (' ' + elementLabel) : '');
        }

        // Otherwise just show the element count.
        return this.prettifyInteger(elementCount) + (elementLabel ? (' ' + elementLabel) : '');
    }

    /**
     * Creates and returns the text for the settings button.
     *
     * @return {string}
     */
    public getButtonText(): string {
        if (!this.options.layers.length) {
            return this.createButtonText(this.options, this.options.limit);
        }

        if (this.options.layers.length === 1) {
            return this.createButtonText(this.options.layers[0], this.options.limit);
        }

        return this.options.layers.map((layer) => {
            let text = this.createButtonText(layer, this.options.limit);
            return text ? (layer.title + ' (' + text + ')') : '';
        }).filter((text) => !!text).join(', ');
    }

    /**
     * Returns the label for the objects that are currently shown in this visualization (Bars, Lines, Nodes, Points, Rows, Terms, ...).
     * Uses the given count to determine plurality.
     *
     * @arg {number} count
     * @return {string}
     */
    public getVisualizationElementLabel(count: number): string {
        // Override if needed.
        return 'Result' + (count === 1 ? '' : 's');
    }

    /**
     * Publishes any custom events in the options (from the config file) using the given data item and event field.
     *
     * @arg {any} dataItem
     * @arg {string} eventField
     */
    public publishAnyCustomEvents(dataItem: any, eventField: string) {
        this.options.customEventsToPublish.forEach((config) => {
            let metadata = {};
            (config.fields || []).forEach((fieldsConfig) => {
                metadata[fieldsConfig.columnName] = dataItem[fieldsConfig.columnName];
            });
            this.messenger.publish(config.id, {
                item: eventField ? dataItem[eventField] : dataItem,
                metadata: metadata
            });
        });
    }

    /**
     * Publishes the component's option object to the gear component
     */
    publishOptions() {
        this.messenger.publish('options', {
            changeData: this.handleChangeData.bind(this),
            changeFilterData: this.handleChangeFilterField.bind(this),
            createLayer: this.createLayer.bind(this),
            deleteLayer: this.deleteLayer.bind(this),
            exportData: this.createExportData.bind(this),
            finalizeCreateLayer: this.finalizeCreateLayer.bind(this),
            finalizeDeleteLayer: this.finalizeDeleteLayer.bind(this),
            handleChangeSubcomponentType: this.handleChangeSubcomponentType.bind(this),
            options: this.options
        });
    }

    /**
     * Publishes the given ID and metadata to the select_id event channel.
     *
     * @arg {any} id
     * @arg {any} [metadata]
     * @fires select_id
     */
    public publishSelectId(id: any, metadata?: any) {
        this.messenger.publish('select_id', {
            source: this.id,
            database: this.options.database.name,
            table: this.options.table.name,
            id: id,
            metadata: metadata
        });
    }

    /**
     * Publishes the toggleGear so the app component can toggle the gear panel
     */
    publishToggleGear() {
        this.messenger.publish('toggleGear', {
            toggleGear: true
        });
    }

    /**
     * Handles any needed behavior whenever a select_id event is observed that is relevant for the visualization.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any} id
     */
    protected onSelectId(options: any, id: any) {
        // Override if needed.
    }

    /**
     * Publishes the toggleGear so the app component can toggle the gear panel
     */
    toggleGear() {
        this.publishOptions();
        this.publishToggleGear();
    }

    /**
     * Returns whether the given item is a number.
     *
     * @arg {any} item
     * @return {boolean}
     */
    public isNumber(item: any): boolean {
        return !isNaN(parseFloat(item)) && isFinite(item);
    }

    /**
     * Returns the prettified string of the given integer (with commas).
     *
     * @arg {number} item
     * @return {string}
     */
    public prettifyInteger(item: number): string {
        return Math.round(item).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    /**
     * Returns the result of converting labels in the response query data into pretty labels specified in the config.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {{data:any[]}} response
     * @return {{data:any[]}}
     */
    private prettifyLabels(options: any, response: { data: any[] }): { data: any[] } {
        let labelOptions = this.getLabelOptions(options);
        let labelKeys = Object.keys(labelOptions);
        let itemKeys;
        //Go through each item in the response data
        for (let item of response.data) {
            itemKeys = Object.keys(item);
            //for each key in the data item
            for (let key of itemKeys) {
                //if that key exists in the labelOptions as keys for which there is a value to change
                if (labelKeys.includes(key)) {
                    //data items can have arrays of values, and we have to change all of them otherwise,
                    //there is only one, and we have to change that one
                    let value = item[key];
                    if (value instanceof Array) {
                        let newItemParam = [];
                        //for each value in that array, if that element is a key in the options,
                        //push into the new array the pretty name, otherwize push the original value
                        for (let element of value) {
                            let possibleNewValue = labelOptions[key][element];
                            let newValue = possibleNewValue ? possibleNewValue : element;
                            newItemParam.push(newValue);
                        }
                        item[key] = newItemParam;
                    } else if (labelOptions[key][value]) {
                        //if it's not an array, check to see if its a value in the options, set it if it is
                        item[key] = labelOptions[key][value];
                    }
                }
            }
        }
        return response;
    }

    /**
     * Returns the labelOptions from the config for the database and table in the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     */
    private getLabelOptions(options: any) {
        let dataset = this.datasetService.getDataset();
        let matchingDatabase = _.find(dataset.databases, (database) => database.name === options.database.name);
        let matchingTable = _.find(matchingDatabase.tables, (table) => table.name === options.table.name);
        return matchingTable.labelOptions;
    }

    /**
     * Creates and returns a new empty field object.
     *
     * @return {FieldMetaData}
     */
    public createEmptyField(): FieldMetaData {
        return new FieldMetaData();
    }

    /**
     * Creates and returns an array of field options for the visualization.
     *
     * @return {(WidgetFieldOption|WidgetFieldArrayOption)[]}
     * @abstract
     */
    public abstract createFieldOptions(): (WidgetFieldOption | WidgetFieldArrayOption)[];

    private createFieldOptionsFull(): (WidgetFieldOption | WidgetFieldArrayOption)[] {
        return this.createFieldOptions().concat(new WidgetFieldOption('unsharedFilterField', 'Local Filter Field', false));
    }

    /**
     * Creates and returns an array of field options for a layer for the visualization.
     *
     * @return {(WidgetFieldOption|WidgetFieldArrayOption)[]}
     */
    public createLayerFieldOptions(): (WidgetFieldOption | WidgetFieldArrayOption)[] {
        return [];
    }

    /**
     * Creates and returns an array of non-field options for a layer for the visualization.
     *
     * @return {WidgetOption[]}
     */
    public createLayerNonFieldOptions(): WidgetOption[] {
        return [];
    }

    /**
     * Creates and returns an array of non-field options for the visualization.
     *
     * @return {WidgetOption[]}
     * @abstract
     */
    public abstract createNonFieldOptions(): WidgetOption[];

    /**
     * Creates and returns the options for the visualization with the given title and limit.
     *
     * @arg {Injector} injector
     * @arg {string} visualizationTitle
     * @arg {number} defaultLimit
     * @return {any}
     */
    private createWidgetOptions(injector: Injector, visualizationTitle: string, defaultLimit: number): any {
        let options: any = new WidgetOptionCollection(this.createFieldOptionsFull.bind(this), injector);
        this.layerIdToQueryIdToQueryObject.set(options._id, new Map<string, any>());

        options.inject(new WidgetNonPrimitiveOption('customEventsToPublish', 'Custom Events To Publish', [], false));
        options.inject(new WidgetNonPrimitiveOption('customEventsToReceive', 'Custom Events To Receive', [], false));
        options.inject(new WidgetNonPrimitiveOption('filter', 'Custom Widget Filter', null, false));

        options.inject(new WidgetSelectOption('hideUnfiltered', 'Hide Widget if Unfiltered', false, OptionChoices.NoFalseYesTrue));
        options.inject(new WidgetFreeTextOption('limit', 'Limit', defaultLimit));
        options.inject(new WidgetFreeTextOption('title', 'Title', visualizationTitle));
        options.inject(new WidgetFreeTextOption('unsharedFilterValue', 'Unshared Filter Value', ''));

        // Backwards compatibility (configFilter deprecated and renamed to filter).
        options.filter = options.filter || this.injector.get('configFilter', null);

        options.inject(this.createNonFieldOptions());

        options.updateDatabases(this.datasetService, this.injector.get('tableKey', null));

        this.injector.get('layers', []).forEach((layerBindings) => {
            this.addLayer(options, layerBindings);
        });

        // Add a new empty layer if needed.
        if (!options.layers.length && this.shouldCreateDefaultLayer()) {
            this.addLayer(options);
        }

        return options;
    }

    /**
     * Returns whether to create a default layer if no layers are configured.
     *
     * @return {boolean}
     */
    protected shouldCreateDefaultLayer(): boolean {
        // Override if needed.
        return false;
    }

    /**
     * If visualization title is a key referenced in config file, find value using current dashboard.
     *
     * @arg {any} configValue
     * @return {any}
     */
    public getVisualizationTitle(configValue: any): string {
        let currentDashboard = this.datasetService.getCurrentDashboard();

        if (currentDashboard && currentDashboard.visualizationTitles && currentDashboard.visualizationTitles[configValue]) {
            return currentDashboard.visualizationTitles[configValue];
        } else {
            // otherwise, just return value from layouts section of config
            return configValue;
        }
    }

    /**
     * Returns the bindings object with the current options for the visualization.
     *
     * @arg {any} [options=this.options] A WidgetOptionCollection object.
     * @return {any}
     */
    public getBindings(options?: any): any {
        return (options || this.options).list().reduce((bindings, option) => {
            bindings[option.bindingKey] = option.getValueToSaveInBindings();
            return bindings;
        }, {
            layers: (options || this.options).layers.length ? (options || this.options).layers.map((layer) => this.getBindings(layer)) :
                undefined
        });
    }

    /**
     * Returns the list of fields to export.
     *
     * @arg {any} [options=this.options] A WidgetOptionCollection object.
     * @return {{ columnName: string, prettyName: string }[]}
     */
    public getExportFields(options?: any): { columnName: string, prettyName: string }[] {
        return (options || this.options).list().reduce((exportFields, option) => {
            if (option.optionType === OptionType.FIELD && option.valueCurrent.columnName) {
                return exportFields.concat({
                    columnName: option.valueCurrent.columnName,
                    prettyName: option.valueCurrent.prettyName
                });
            }
            if (option.optionType === OptionType.FIELD_ARRAY) {
                return exportFields.concat(option.valueCurrent.filter((fieldsObject) => !!fieldsObject.columnName).map((fieldsObject) => ({
                    columnName: fieldsObject.columnName,
                    prettyName: fieldsObject.prettyName
                })));
            }
            return exportFields;
        }, []);
    }

    /**
     * Returns the default limit for the visualization.
     *
     * @return {string}
     * @abstract
     */
    public abstract getVisualizationDefaultLimit(): number;

    /**
     * Returns the default title for the visualization.
     *
     * @return {string}
     * @abstract
     */
    public abstract getVisualizationDefaultTitle(): string;

    /**
     * Increases the page and runs the visualization query.
     */
    public goToNextPage(): void {
        if (!this.lastPage) {
            this.page++;
            this.executeAllQueryChain();
        }
    }

    /**
     * Decreases the page and runs the visualization query.
     */
    public goToPreviousPage(): void {
        if (this.page !== 1) {
            this.page--;
            this.executeAllQueryChain();
        }
    }

    /**
     * Returns whether to show the pagination buttons.
     *
     * @return {boolean}
     */
    public showPagination(): boolean {
        // Assumes single-layer widget.
        return this.visualizationQueryPaginates && (this.page > 1 || this.showingZeroOrMultipleElementsPerResult ||
            ((this.page * this.options.limit) < this.layerIdToElementCount.get(this.options._id)));
    }

    protected clearVisualizationData(options: any): void {
        // TODO THOR-985 Temporary function.  Override as needed.
    }

    private noDataCheck() {
        if (this.filterService.getFilters().length > 0) {
            let activeData = this.getActiveData();
            if (!activeData || !activeData.data || !activeData.data.length) {
                this.showNoData = true;
            } else {
                this.showNoData = false;
            }
            this.changeDetection.detectChanges();
        }
    }
}
