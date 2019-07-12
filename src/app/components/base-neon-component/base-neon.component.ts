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
import { AfterViewInit, ChangeDetectorRef, Injector, OnDestroy, OnInit } from '@angular/core';

import {
    AbstractSearchService,
    FilterClause,
    QueryPayload
} from '../../services/abstract.search.service';
import { DashboardService } from '../../services/dashboard.service';
import {
    AbstractFilter,
    FilterCollection,
    FilterDataSource,
    FilterDesign
} from '../../util/filter.util';
import { InjectableFilterService } from '../../services/injectable.filter.service';
import { Dataset, NeonFieldMetaData } from '../../models/dataset';
import { neonEvents } from '../../models/neon-namespaces';
import {
    AggregationType,
    OptionType,
    WidgetOption
} from '../../models/widget-option';
import {
    ConfigurableWidget,
    OptionConfig,
    RootWidgetOptionCollection,
    WidgetOptionCollection
} from '../../models/widget-option-collection';

import { eventing } from 'neon-framework';
import { MatDialogRef, MatDialog } from '@angular/material';
import { DynamicDialogComponent } from '../dynamic-dialog/dynamic-dialog.component';
import { RequestWrapper } from '../../services/connection.service';
import { DashboardState } from '../../models/dashboard-state';

export class InjectorOptionConfig extends OptionConfig {
    public get(bindingKey: string, defaultValue: any): any {
        // Assume config is an Angular Injector
        return this.config.get(bindingKey, defaultValue);
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
    /* eslint-disable-next-line no-invalid-this */
    private TOOLBAR_EXTRA_WIDTH: number = this.SETTINGS_BUTTON_WIDTH + this.TEXT_MARGIN_WIDTH + this.TOOLBAR_PADDING_WIDTH;
    protected TOOLBAR_HEIGHT: number = 40;

    protected id: string;
    protected messenger: eventing.Messenger;

    // Maps the options/layer ID to the element count.
    private layerIdToElementCount: Map<string, number> = new Map<string, number>();

    // Maps the options/layer ID to the query ID to the query object.
    private layerIdToQueryIdToQueryObject: Map<string, Map<string, RequestWrapper>> = new Map<string, Map<string, RequestWrapper>>();

    public errorMessage: string = '';
    public loadingCount: number = 0;
    public showNoData: boolean = false;

    protected initializing: boolean = false;
    protected redrawOnResize: boolean = false;
    protected selectedDataId: string = '';
    protected showingZeroOrMultipleElementsPerResult: boolean = false;
    protected updateOnSelectId: boolean = false;
    protected visualizationQueryPaginates: boolean = false;

    // The data pagination properties.
    protected lastPage: boolean = true;
    protected page: number = 1;
    protected savedPages: Map<string, number> = new Map<string, number>();

    public options: RootWidgetOptionCollection & { [key: string]: any };

    private contributorsRef: MatDialogRef<DynamicDialogComponent>;
    readonly dashboardState: DashboardState;
    protected dataset: Dataset;

    constructor(
        protected dashboardService: DashboardService,
        protected filterService: InjectableFilterService,
        protected searchService: AbstractSearchService,
        protected injector: Injector,
        public changeDetection: ChangeDetectorRef,
        public dialog: MatDialog
    ) {
        this.messenger = new eventing.Messenger();
        this.dashboardState = dashboardService.state;
        this.dataset = this.dashboardState.asDataset();
        dashboardService.stateSource.subscribe((dashboardState) => {
            this.dataset = dashboardState.asDataset();
        });
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

        this.messenger.subscribe(neonEvents.DASHBOARD_REFRESH, () => {
            this.destroyVisualization();
            this.constructVisualization();
            this.handleChangeFilterField();
        });
        this.messenger.subscribe(neonEvents.SELECT_ID, (eventMessage) => {
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

        this.filterService.registerFilterChangeListener(this.id, this.handleFiltersChanged.bind(this));

        this.messenger.publish(neonEvents.WIDGET_REGISTER, {
            id: this.id,
            widget: this
        });

        this.initializeProperties();

        this.initializing = false;
    }

    /**
     * Runs any needed behavior after a new layer was added.
     */
    protected postAddLayer(__options: WidgetOptionCollection): void {
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

    private createLayer(options: WidgetOptionCollection, layerBindings: any = {}): any {
        return options.addLayer(layerBindings);
    }

    private finalizeCreateLayer(layerOptions: any): void {
        this.layerIdToQueryIdToQueryObject.set(layerOptions._id, new Map<string, any>());
        this.postAddLayer(layerOptions);
    }

    private deleteLayer(options: WidgetOptionCollection, layerOptions: any): boolean {
        return options.removeLayer(layerOptions);
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
     * Returns the export header data.
     *
     * @return {{name:string,data:any}[]}
     */
    public createExportData(): { name: string, data: any }[] {
        return (this.options.layers.length ? this.options.layers : [this.options]).map((options) => {
            let query: QueryPayload = this.createCompleteVisualizationQuery(options);
            let title = options.title.split(':').join(' ') + '-' + options._id;
            return query ? this.searchService.transformQueryPayloadToExport(this.getExportFields(options), query, title) : null;
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

    public onResize() {
        // Override if needed
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
            setTimeout(() => {
                this.refreshVisualization();
                this.changeDetection.detectChanges();
            }, 300);
        }
    }

    /**
     * Angular lifecycle hook:  Removes the visualization from the page and unregisters from listeners as needed.
     */
    public ngOnDestroy() {
        let queryMap: Map<string, RequestWrapper>;
        Array.from(this.layerIdToQueryIdToQueryObject.keys()).forEach((layerId) => {
            queryMap = this.layerIdToQueryIdToQueryObject.get(layerId);
            Array.from(queryMap.keys()).forEach((queryId) => {
                queryMap.get(queryId).abort();
            });
        });
        this.changeDetection.detach();
        this.messenger.unsubscribeAll();
        this.messenger.publish(neonEvents.WIDGET_UNREGISTER, {
            id: this.id
        });
        this.filterService.unregisterFilterChangeListener(this.id);
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
     * Deletes the given filters from the widget and the dash (or all the filters if no args are given) and runs a visualization query.
     *
     * @arg {FilterDesign[]} [filterDesignListToDelete]
     */
    public deleteFilters(filterDesignListToDelete?: FilterDesign[]) {
        let results: Map<any, FilterDesign[]> = this.filterService.deleteFilters(this.id, filterDesignListToDelete);

        // Return to the previously saved page that was being viewed when the deleted filter was first added.
        let page = this.page;
        Array.from(results ? results.keys() : []).forEach((key) => {
            let outputFilterDesignList: FilterDesign[] = results.get(key);
            outputFilterDesignList.forEach((outputFilterDesign) => {
                // TODO THOR-1107 How to choose the page if multiple filters are deleted.
                page = this.savedPages.get(outputFilterDesign.id) || page;
                this.savedPages.delete(outputFilterDesign.id);
            });
        });

        if (this.shouldFilterSelf()) {
            this.page = page;
        }
    }

    /**
     * Exchanges all the filters in the widget with the given filters and runs a visualization query.  If filterDesignListToDelete is
     * given, also deletes the filters of each data source in the list (useful if you want to do both with a single filter-change event).
     *
     * @arg {FilterDesign[]} filterDesignList
     * @arg {FilterDesign[]} [filterDesignListToDelete]
     */
    public exchangeFilters(filterDesignList: FilterDesign[], filterDesignListToDelete?: FilterDesign[]): void {
        let results: Map<any, FilterDesign[]> = this.filterService.exchangeFilters(this.id, filterDesignList,
            this.dataset.relations, filterDesignListToDelete);

        // Save the page that is being viewed.
        Array.from(results ? results.keys() : []).forEach((key) => {
            let outputFilterDesignList: FilterDesign[] = results.get(key);
            outputFilterDesignList.forEach((outputFilterDesign) => {
                this.savedPages.set(outputFilterDesign.id, this.page);
            });
        });

        if (this.shouldFilterSelf()) {
            this.page = 1;
        }
    }

    /**
     * Toggles the given filters (adds input filters that are not in the global list and deletes input filters that are in the global list)
     * in the widget and the dash and runs a visualization query.
     *
     * @arg {FilterDesign[]} filterDesignList
     */
    public toggleFilters(filterDesignList: FilterDesign[]): void {
        let results: Map<any, FilterDesign[]> = this.filterService.toggleFilters(this.id, filterDesignList, this.dataset.relations);

        // Save the page that is being viewed.
        Array.from(results ? results.keys() : []).forEach((key) => {
            let outputFilterDesignList: FilterDesign[] = results.get(key);
            outputFilterDesignList.forEach((outputFilterDesign) => {
                this.savedPages.set(outputFilterDesign.id, this.page);
            });
        });

        if (this.shouldFilterSelf()) {
            this.page = 1;
        }
    }

    /**
     * Run before executing all the data queries for the visualization.
     * Used to notify the visualization that queries are imminent.
     */
    public beforeExecuteAllQueryChain(): void {
        // Do nothing by default
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
    private executeQueryChain(options?: WidgetOptionCollection): void {
        let queryOptions = options || this.options;

        if (!this.initializing && this.validateVisualizationQuery(queryOptions)) {
            this.changeDetection.detectChanges();

            let query: QueryPayload = this.createCompleteVisualizationQuery(queryOptions);

            if (query) {
                this.searchService.updateLimit(query, this.options.limit);

                if (this.visualizationQueryPaginates) {
                    this.searchService.updateOffset(query, (this.page - 1) * this.options.limit);
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
    public abstract validateVisualizationQuery(options: WidgetOptionCollection): boolean;

    /**
     * Finalizes the given visualization query by adding the aggregations, filters, groups, and sort using the given options.
     * @abstract
     */
    public abstract finalizeVisualizationQuery(
        options: WidgetOptionCollection,
        queryPayload: QueryPayload,
        sharedFilters: FilterClause[]
    ): QueryPayload;

    /**
     * Creates and returns the visualization query with the database, table, and fields, but not the limit or offset.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {QueryPayload}
     */
    public createCompleteVisualizationQuery(options: WidgetOptionCollection): QueryPayload {
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
    public createSharedFilters(options: WidgetOptionCollection): FilterClause[] {
        let filterClauses: FilterClause[] = this.retrieveApplicableFilters(options).map((filter) =>
            this.searchService.generateFilterClauseFromFilter(filter));

        if (options.filter && options.filter.lhs && options.filter.operator && options.filter.rhs) {
            filterClauses = filterClauses.concat(this.searchService.buildFilterClause(options.filter.lhs, options.filter.operator,
                options.filter.rhs));
        }

        if (this.hasUnsharedFilter(options)) {
            filterClauses = filterClauses.concat(this.searchService.buildFilterClause(options.unsharedFilterField.columnName, '=',
                options.unsharedFilterValue));
        }

        return filterClauses;
    }

    private retrieveApplicableFilters(options: WidgetOptionCollection): AbstractFilter[] {
        let compatibleFilters: AbstractFilter[] = this.retrieveCompatibleFilters().getFilters();

        return this.filterService.getFiltersToSearch('', options.database.name, options.table.name, this.shouldFilterSelf() ? [] :
            compatibleFilters.map((filter) => filter.toDesign()));
    }

    private retrieveCompatibleFilters(): FilterCollection {
        return this.filterService.retrieveCompatibleFilterCollection(this.designEachFilterWithNoValues());
    }

    /**
     * Handles the given response data for a successful total count query created using the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any} response
     * @arg {() => void} callback
     * @abstract
     */
    private handleSuccessfulTotalCountQuery(options: WidgetOptionCollection, response: any, callback: () => void): void {
        if (!response || !response.data || !response.data.length ||
            response.data[0][this.searchService.getAggregationName('count')] === undefined) {
            this.layerIdToElementCount.set(options._id, 0);
        } else {
            this.layerIdToElementCount.set(options._id, response.data[0][this.searchService.getAggregationName('count')]);
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
     * @arg {(elementCount: number) => void} successCallback
     * @arg {(err: Error) => void} successCallback
     */
    protected handleTransformVisualizationQueryResults(
        options: any,
        results: any[],
        successCallback: (elementCount: number) => void,
        failureCallback: (err: Error) => void
    ): void {
        try {
            let data = this.transformVisualizationQueryResults(options, results, this.retrieveCompatibleFilters());
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
    private handleSuccessfulVisualizationQuery(options: WidgetOptionCollection, response: any, callback: () => void): void {
        if (!response || !response.data || !response.data.length) {
            this.transformVisualizationQueryResults(options, [], this.retrieveCompatibleFilters());
            this.errorMessage = 'No Data';
            this.layerIdToElementCount.set(options._id, 0);
            callback();
            return;
        }

        let successCallback = (elementCount: number) => {
            this.errorMessage = '';

            if (this.visualizationQueryPaginates && !this.showingZeroOrMultipleElementsPerResult) {
                let countQuery: QueryPayload = this.createCompleteVisualizationQuery(options);
                if (countQuery) {
                    // Add a count aggregation on '*' to get the total hit count.
                    // Do not add a limit or an offset!
                    this.searchService.updateAggregation(countQuery, AggregationType.COUNT,
                        this.searchService.getAggregationName('count'), '*');
                    this.executeQuery(options, countQuery, 'total count query', this.handleSuccessfulTotalCountQuery.bind(this));
                    // Ignore our own callback since the visualization will be refreshed within handleSuccessfulTotalCountQuery.
                } else {
                    this.lastPage = ((this.page * this.options.limit) >= this.layerIdToElementCount.get(options._id));
                    callback();
                }
            } else {
                // If the visualization query paginates but is showing zero or multiple elements per result, we cannot determine the page,
                // so just set lastPage to false.
                this.lastPage = !this.visualizationQueryPaginates;
                this.layerIdToElementCount.set(options._id, elementCount);
                callback();
            }
        };

        let failureCallback = (err: Error) => {
            this.transformVisualizationQueryResults(options, [], this.retrieveCompatibleFilters());
            this.errorMessage = 'Error';
            this.layerIdToElementCount.set(options._id, 0);
            this.messenger.publish(neonEvents.DASHBOARD_ERROR, {
                error: err,
                message: 'FAILED ' + options.title + ' transform results'
            });
            callback();
        };

        this.handleTransformVisualizationQueryResults(options, response.data, successCallback, failureCallback);
    }

    /**
     * Transforms the given array of query results using the given options into an array of objects to be shown in the visualization.
     * Returns the count of elements shown in the visualization.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any[]} results
     * @arg {FilterCollection} filters
     * @return {number}
     * @abstract
     */
    public abstract transformVisualizationQueryResults(options: WidgetOptionCollection, results: any[], filters: FilterCollection): number;

    /**
     * Redraws this visualization with the given compatible filters.
     */
    protected redrawFilters(__filters: FilterCollection): void {
        // Override if needed.
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
     * @arg {(options: WidgetOptionCollection, response: any, callback: () => void) => void} callback
     */
    private executeQuery(options: WidgetOptionCollection, query: QueryPayload, queryId: string,
        callback: (options: WidgetOptionCollection, response: any, callback: () => void) => void) {
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

        // If we have any labelOptions in the config, we want to edit the data to convert whatever data items that are specified to the
        // "pretty" name. The pretty name goes to the visualizations, but it must be converted back before doing a query as the
        // database won't recognize the pretty name.
        this.searchService.transformFilterClauseValues(query, this.getLabelOptions(options));

        if (this.layerIdToQueryIdToQueryObject.get(options._id).has(queryId)) {
            this.layerIdToQueryIdToQueryObject.get(options._id).get(queryId).abort();
        }

        // TODO THOR-1062 Allow multiple datastores
        this.layerIdToQueryIdToQueryObject.get(options._id).set(queryId, this.searchService.runSearch(
            this.dataset.datastores[0].type, this.dataset.datastores[0].host, query
        ));

        this.layerIdToQueryIdToQueryObject.get(options._id).get(queryId).always(() => {
            this.layerIdToQueryIdToQueryObject.get(options._id).delete(queryId);
        });

        this.layerIdToQueryIdToQueryObject.get(options._id).get(queryId).done((response) => {
            callback(options, this.searchService.transformQueryResultsValues(response, this.getLabelOptions(options)),
                this.finishQueryExecution.bind(this));
        });

        this.layerIdToQueryIdToQueryObject.get(options._id).get(queryId).fail((response) => {
            this.loadingCount--;
            if (response.statusText !== 'abort') {
                this.messenger.publish(neonEvents.DASHBOARD_ERROR, {
                    error: response && !!response.responseJSON ? response.responseJSON.stackTrace : response.responseText,
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
    private cannotExecuteQuery(options: WidgetOptionCollection): boolean {
        // TODO THOR-1062 Allow multiple datastores
        return (!this.searchService.canRunSearch(this.dataset.datastores[0].type, this.dataset.datastores[0].host) ||
            (this.options.hideUnfiltered && !this.retrieveApplicableFilters(options).length));
    }

    /**
     * Handles any needed behavior on a filter-change event and then runs the visualization query.
     */
    private handleFiltersChanged(callerId: string, __changeCollection: Map<FilterDataSource[], FilterDesign[]>): void {
        // Don't run the visualization query if the event was sent from this visualization and this visualization ignores its own filters.
        if (callerId !== this.id || this.shouldFilterSelf()) {
            // TODO THOR-1108 Ignore filters on non-matching datastores/databases/tables.
            this.executeAllQueryChain();
        } else {
            this.redrawFilters(this.retrieveCompatibleFilters());
            this.refreshVisualization();
            this.changeDetection.detectChanges();
        }
    }

    /**
     * Returns the design for each type of filter made by this visualization.  This visualization will automatically update itself with all
     * compatible filters that were set internally or externally whenever it runs a visualization query.
     *
     * @return {FilterDesign[]}
     */
    protected abstract designEachFilterWithNoValues(): FilterDesign[];

    /**
     * Updates filters whenever a filter field is changed and then runs the visualization query.
     *
     * @arg {any} [options=this.options] A WidgetOptionCollection object.
     * @arg {boolean} [databaseOrTableChange]
     */
    public handleChangeFilterField(options?: WidgetOptionCollection, databaseOrTableChange?: boolean): void {
        this.handleChangeData(options, databaseOrTableChange);
    }

    /**
     * Updates elements and properties whenever the widget config is changed.
     * @arg {boolean} [databaseOrTableChange]
     */
    protected onChangeData(__databaseOrTableChange?: boolean) {
        // Override if needed.
    }

    /**
     * Handles any behavior needed whenever the widget config is changed and then runs the visualization query.
     *
     * @arg {any} [options=this.options] A WidgetOptionCollection object.
     * @arg {boolean} [databaseOrTableChange]
     */
    public handleChangeData(options?: WidgetOptionCollection, databaseOrTableChange?: boolean): void {
        this.layerIdToElementCount.set((options || this.options)._id, 0);

        this.errorMessage = '';
        this.lastPage = true;
        this.page = 1;
        this.showingZeroOrMultipleElementsPerResult = false;

        this.onChangeData(databaseOrTableChange);
        this.messenger.publish(neonEvents.WIDGET_CONFIGURED, {});

        if (!options) {
            this.executeAllQueryChain();
        } else {
            this.executeQueryChain(options);
        }
    }

    /**
     * Handles any behavior needed whenever the subcomponent type is changed and
     * then runs the visualization query.
     */
    public handleChangeSubcomponentType(options?: WidgetOptionCollection | any) {
        this.handleChangeData(options);
    }

    /**
     * Returns whether the local unshared filter field and value are set.
     *
     * @arg {any} [options=this.options] A WidgetOptionCollection object.
     * @return {boolean}
     */
    private hasUnsharedFilter(options?: WidgetOptionCollection | { [key: string]: any }): boolean {
        return !!((options || this.options).unsharedFilterField && (options || this.options).unsharedFilterField.columnName &&
            typeof (options || this.options).unsharedFilterValue !== 'undefined' && (options || this.options).unsharedFilterValue !== '');
    }

    /**
     * Creates and returns the text for the settings button using the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {number} queryLimit
     * @return {string}
     */
    private createButtonText(options: WidgetOptionCollection, queryLimit: number): string {
        // If the query was not yet run, show no text unless waiting on an event.
        if (!this.layerIdToElementCount.has(options._id)) {
            // TODO Add support for 'Please Select'
            return this.options.hideUnfiltered ? 'Please Filter' : '';
        }

        let elementCount = this.layerIdToElementCount.get(options._id);
        let elementLabel = this.getVisualizationElementLabel(elementCount);

        // If the query was empty, show the relevant text.
        if (!elementCount) {
            let filtered = !!this.retrieveApplicableFilters(options).length;
            return (this.options.hideUnfiltered && !filtered) ? 'Please Filter' : (elementLabel ? ('0 ' + elementLabel) : 'None');
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
        this.messenger.publish(neonEvents.SHOW_OPTION_MENU, {
            changeData: this.handleChangeData.bind(this),
            changeFilterData: this.handleChangeFilterField.bind(this),
            createLayer: this.createLayer.bind(this),
            deleteLayer: this.deleteLayer.bind(this),
            exportData: this.createExportData.bind(this),
            finalizeCreateLayer: this.finalizeCreateLayer.bind(this),
            finalizeDeleteLayer: this.finalizeDeleteLayer.bind(this),
            handleChangeSubcomponentType: this.handleChangeSubcomponentType.bind(this),
            options: this.options
        } as ConfigurableWidget);
    }

    /**
     * Publishes the given ID and metadata to the select_id event channel.
     *
     * @arg {any} id
     * @arg {any} [metadata]
     * @fires select_id
     */
    public publishSelectId(id: any, metadata?: any) {
        this.messenger.publish(neonEvents.SELECT_ID, {
            source: this.id,
            database: this.options.database.name,
            table: this.options.table.name,
            id: id,
            metadata: metadata
        });
    }

    /**
     * Handles any needed behavior whenever a select_id event is observed that is relevant for the visualization.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any} id
     */
    protected onSelectId(__options: any, __id: any) {
        // Override if needed.
    }

    /**
     * Publishes the toggleGear so the app component can toggle the gear panel
     */
    toggleGear() {
        this.publishOptions();
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
     * Returns the labelOptions from the config for the database and table in the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     */
    private getLabelOptions(options: WidgetOptionCollection) {
        // TODO THOR-1062 Allow multiple datastores
        let datastore = this.dataset.datastores[0];
        let matchingDatabase = datastore.databases[options.database.name];
        let matchingTable = matchingDatabase.tables[options.table.name];
        return matchingTable ? matchingTable.labelOptions : {};
    }

    /**
     * Creates and returns a new empty field object.
     *
     * @return {NeonFieldMetaData}
     */
    public createEmptyField(): NeonFieldMetaData {
        return NeonFieldMetaData.get();
    }

    /**
     * Creates and returns an array of options for the visualization.
     *
     * @return {WidgetOption[]}
     * @abstract
     */
    protected abstract createOptions(): WidgetOption[];

    /**
     * Creates and returns an array of options for a layer for the visualization.
     *
     * @return {WidgetOption[]}
     */
    protected createOptionsForLayer(): WidgetOption[] {
        return [];
    }

    /**
     * Creates and returns the options for the visualization with the given title and limit.
     *
     * @arg {Injector} injector
     * @arg {string} visualizationTitle
     * @arg {number} defaultLimit
     * @return {any}
     */
    private createWidgetOptions(injector: Injector, visualizationTitle: string, defaultLimit: number): any {
        let options = new RootWidgetOptionCollection(this.dataset, this.createOptions.bind(this), this.createOptionsForLayer.bind(this),
            visualizationTitle, defaultLimit, this.shouldCreateDefaultLayer(), new InjectorOptionConfig(injector));

        this.layerIdToQueryIdToQueryObject.set(options._id, new Map<string, RequestWrapper>());

        options.layers.forEach((layerOptions) => {
            this.finalizeCreateLayer(layerOptions);
        });

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
        let currentDashboard = this.dashboardState.dashboard;

        if (currentDashboard && currentDashboard.visualizationTitles && currentDashboard.visualizationTitles[configValue]) {
            return currentDashboard.visualizationTitles[configValue];
        }
        // Otherwise, just return value from layouts section of config
        return configValue;
    }

    /**
     * Returns the list of fields to export.
     */
    public getExportFields(options?: WidgetOptionCollection): { columnName: string, prettyName: string }[] {
        return (options || this.options).list().reduce((returnFields, option) => {
            let fields = [];
            if (option.optionType === OptionType.FIELD && option.valueCurrent.columnName) {
                fields = [option.valueCurrent];
            }
            if (option.optionType === OptionType.FIELD_ARRAY) {
                fields = option.valueCurrent;
            }
            return fields.reduce((exportFields, field) => {
                if (field.columnName) {
                    // Ignore repeated fields.
                    let exists = exportFields.some((exportField) => exportField.columnName === field.columnName);
                    if (!exists) {
                        return exportFields.concat({
                            columnName: field.columnName,
                            prettyName: field.prettyName
                        });
                    }
                }
                return exportFields;
            }, returnFields);
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

    /**
     * Returns whether this visualization should filter itself.
     *
     * @return {boolean}
     */
    protected shouldFilterSelf(): boolean {
        return !this.options.ignoreSelf;
    }

    /**
     * Checks wheather there are any filters and returns no data.
     */
    public noDataCheck() {
        this.showNoData = !!(this.filterService.getFilters().length && !this.layerIdToElementCount.get(this.options._id));
        this.changeDetection.detectChanges();
        this.toggleBodyContainer();
    }

    /**
     * Method to be overrided in components where the body container wants to be hidden
     * if showNoData is true
     */
    public toggleBodyContainer() {
        //
    }

    public showContribution() {
        return ((this.options.contributionKeys && this.options.contributionKeys.length !== 0) ||
            (this.options.contributionKeys === null &&
                this.dashboardState.dashboard &&
                this.dashboardState.dashboard.contributors &&
                Object.keys(this.dashboardState.dashboard.contributors).length));
    }

    protected getContributorsForComponent() {
        let allContributors = this.dashboardState.dashboard.contributors;
        let contributorKeys = this.options.contributionKeys !== null ? this.options.contributionKeys :
            Object.keys(allContributors);

        return contributorKeys.filter((key) => !!allContributors[key]).map((key) => allContributors[key]);
    }

    protected getContributorAbbreviations() {
        let contributors = this.dashboardState.dashboard.contributors;
        let contributorKeys = this.options.contributionKeys !== null ? this.options.contributionKeys :
            Object.keys(contributors);

        let contributorAbbreviations = contributorKeys.filter((key) =>
            !!(contributors[key] && contributors[key].abbreviation)).map((key) => contributors[key].abbreviation);

        return contributorAbbreviations.join(', ');
    }

    protected openContributionDialog() {
        this.contributorsRef = this.dialog.open(DynamicDialogComponent, {
            data: {
                component: 'contribution-dialog',
                contributors: this.getContributorsForComponent()
            },
            width: '400px',
            minHeight: '200px'
        });
        this.contributorsRef.afterClosed().subscribe(() => {
            this.contributorsRef = null;
        });
    }
}
