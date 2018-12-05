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
    OnInit,
    OnDestroy,
    Injector,
    ChangeDetectorRef
} from '@angular/core';

import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';

import { Color } from '../../color';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import { neonEvents } from '../../neon-namespaces';
import {
    OptionChoices,
    OptionType,
    WidgetDatabaseOption,
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

/**
 * Base component for all non-layered Neon visualizations.
 * This manages some of the lifecycle and query logic.
 */
export abstract class BaseNeonComponent implements OnInit, OnDestroy {
    private SETTINGS_BUTTON_WIDTH: number = 30;
    private TEXT_MARGIN_WIDTH: number = 10;
    private TOOLBAR_PADDING_WIDTH: number = 20;
    private TOOLBAR_EXTRA_WIDTH: number = this.SETTINGS_BUTTON_WIDTH + this.TEXT_MARGIN_WIDTH + this.TOOLBAR_PADDING_WIDTH;
    protected TOOLBAR_HEIGHT: number = 40;
    protected VISUALIZATION_PADDING: number = 10;

    public id: string;
    public messenger: neon.eventing.Messenger;
    protected outstandingDataQueriesByLayer: Map<string, Map<string, any>> = new Map<string, Map<string, any>>();

    private redrawAfterResize: boolean = false;
    private nextLayerIndex = 1;

    public initializing: boolean = false;
    public isLoading: number = 0;
    public isExportable: boolean = true;
    public isPaginationWidget: boolean = false;

    public errorMessage: string = '';

    public options: any;

    // TODO THOR-349 Move into future widget option menu component
    public newLimit: number;

    // The data pagination properties.
    public lastPage: boolean = true;
    public page: number = 1;

    constructor(
        protected connectionService: ConnectionService,
        protected datasetService: DatasetService,
        protected filterService: FilterService,
        protected injector: Injector,
        public changeDetection: ChangeDetectorRef
    ) {
        this.messenger = new neon.eventing.Messenger();
    }

    /**
     * Initializes the visualization.
     * Basic initialization flow:
     *  * initDatabase()
     *  * setupFilters()
     *  * subNgOnInit()
     *  * postInit()
     */
    ngOnInit() {
        this.initializing = true;

        this.options = this.createWidgetOptions(this.injector, this.getVisualizationDefaultTitle(), this.getVisualizationDefaultLimit());
        this.newLimit = this.options.limit;
        this.id = this.options._id;

        this.messenger.subscribe(DatasetService.UPDATE_DATA_CHANNEL, this.onUpdateDataChannelEvent.bind(this));
        this.messenger.events({ filtersChanged: this.handleFiltersChangedEvent.bind(this) });
        this.messenger.publish(neonEvents.WIDGET_REGISTER, {
            id: this.id,
            widget: this
        });

        try {
            this.setupFilters();
        } catch (e) {
            // Fails in unit tests - ignore.
        }

        this.subNgOnInit();
        this.initializing = false;
        this.postInit();
    }

    /**
     * Runs any needed behavior after a new layer was added.
     *
     * @arg {any} options A WidgetOptionCollection object.
     */
    public postAddLayer(options: any) {
        // Do nothing.
    }

    /**
     * Method for anything that needs to be done once the visualization has been initialized
     */
    abstract postInit();

    /**
     * Method to do any visualization-specific initialization.
     */
    abstract subNgOnInit();

    /**
     * Method to do any visualization-specific logic before it is destroyed
     */
    abstract subNgOnDestroy();

    /**
     * Adds a new layer for the visualization using the given bindings.
     *
     * @arg {any} [options]
     * @arg {any} [layerBindings]
     */
    public addLayer(options?: any, layerBindings?: any) {
        let layerOptions = new WidgetOptionCollection(undefined, layerBindings || {});
        this.outstandingDataQueriesByLayer.set(layerOptions._id, new Map<string, any>());
        layerOptions.inject(new WidgetFreeTextOption('title', 'Title', 'Layer ' + this.nextLayerIndex++));
        layerOptions.inject(this.createLayerNonFieldOptions());
        layerOptions.append(new WidgetDatabaseOption(), new DatabaseMetaData());
        layerOptions.append(new WidgetTableOption(), new TableMetaData());
        this.updateDatabasesInOptions(layerOptions, layerBindings);
        this.initializeFieldsInOptions(layerOptions, this.createLayerFieldOptions());
        (options || this.options).layers.push(layerOptions);
        this.postAddLayer(options || this.options);
    }

    /**
     * Removes the layer at the given index.
     *
     * @arg {any} options A WidgetOptionCollection object.
     */
    public removeLayer(options: any) {
        this.outstandingDataQueriesByLayer.delete(options._id);
        this.handleChangeData();
    }

    /**
     * Returns the export header data using the given options and visualization data query.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {neon.query.Query} query
     * @return {{name:string,data:any[]}}
     */
    createExportOptions(options: any, query: neon.query.Query) {
        let exportName = this.options.title.split(':').join(' ');
        return {
            name: 'Query_Results_Table',
            data: [{
                query: query,
                name: exportName + '-' + this.id,
                fields: this.getExportFields(options).map((exportFieldsObject) => ({
                    query: exportFieldsObject.columnName,
                    pretty: exportFieldsObject.prettyName || exportFieldsObject.columnName
                })),
                ignoreFilters: query.ignoreFilters,
                selectionOnly: query.selectionOnly,
                ignoredFilterIds: [],
                type: 'query'
            }]
        };
    }

    /**
     * Returns the export header data.
     *
     * @return {{name:string,data:any[]}[]}
     */
    doExport(): any {
        return (this.isMultiLayerWidget ? this.options.layers : [this.options]).map((options) => {
            let query = this.createQuery(options);
            return this.createExportOptions(options, query);
        }).filter((exportObject) => !!exportObject);
    }

    protected enableRedrawAfterResize(enable: boolean) {
        this.redrawAfterResize = enable;
    }

    /**
     * Returns an object containing the ElementRef objects for the visualization.
     *
     * @return {any} Object containing:  {ElementRef} headerText, {ElementRef} infoText, {ElementRef} visualization
     */
    abstract getElementRefs(): any;

    /**
     * Initializes sub-component styles as needed.
     */
    public onResizeStart() {
        // Do nothing.
    }

    /**
     * Updates the header text styling.
     */
    public updateHeaderTextStyling() {
        let refs = this.getElementRefs();
        if (refs.headerText && refs.infoText && refs.visualization) {
            refs.headerText.nativeElement.style.maxWidth = Math.floor(refs.visualization.nativeElement.clientWidth -
                refs.infoText.nativeElement.clientWidth - this.TOOLBAR_EXTRA_WIDTH - 1) + 'px';
        }
    }

    /**
     * Resizes visualization-specific sub-components as needed.  Override as needed.
     */
    public subOnResizeStop() {
        // Do nothing.
    }

    /**
     * Resizes sub-components as needed.
     */
    public onResizeStop() {
        this.updateHeaderTextStyling();

        this.subOnResizeStop();

        if (this.redrawAfterResize) {
            // This event fires as soon as the user releases the mouse, but NgGrid animates the resize,
            // so the current width and height are not the new width and height.  NgGrid uses a 0.25
            // second transition so wait until that has finished before redrawing.
            setTimeout(() => { this.refreshVisualization(); }, 300);
        }
    }

    /**
     * Clean up everything
     */
    ngOnDestroy() {
        this.messenger.unsubscribeAll();
        this.messenger.publish(neonEvents.WIDGET_UNREGISTER, {
            id: this.id
        });
        this.subNgOnDestroy();
    }

    stopEventPropagation(event) {
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
     * Adds a new filter to neon and runs a visualization data query.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {boolean} executeQueryChainOnSuccess
     * @arg {object} subclassFilter
     * @arg {neon.query.WherePredicate} wherePredicate
     * @arg {function} [callback]
     */
    addNeonFilter(options: any, executeQueryChainOnSuccess: boolean, subclassFilter: any, wherePredicate: neon.query.WherePredicate,
        callback?: Function) {

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
                    error: response,
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
     * Adds all the given filters to neon and runs a visualization data query.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {{singleFilter:any,clause:neon.query.WherePredicate}[]} filters
     * @arg {function} [callback]
     */
    addMultipleFilters(options: any, filters: { singleFilter: any, clause: neon.query.WherePredicate }[], callback?: Function) {
        if (!filters.length) {
            if (callback) {
                callback();
            }
            this.executeQueryChain(options);
            return;
        }

        this.addNeonFilter(options, false, filters[0].singleFilter, filters[0].clause, () => {
            this.addMultipleFilters(options, filters.slice(1), callback);
        });
    }

    /**
     * Replaces a filter in neon and runs a visualization data query.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {boolean} executeQueryChainOnSuccess
     * @arg {object} subclassFilter
     * @arg {neon.query.WherePredicate} wherePredicate
     * @arg {function} [callback]
     */
    replaceNeonFilter(options: any, executeQueryChainOnSuccess: boolean, subclassFilter: any, wherePredicate: neon.query.WherePredicate,
        callback?: Function) {

        let filterName = {
            visName: options.title,
            text: this.getFilterText(subclassFilter)
        };
        let onSuccess = (response: any) => {
            if (callback) {
                callback();
            }
            if (executeQueryChainOnSuccess) {
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
                    error: response,
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
     * Runs all the data queries for the visualization.  Called on initialization, if a user changes the visualization config or sets a
     * filter, or whenever else the data queries need to be run.
     */
    executeAllQueryChain() {
        if (!this.initializing) {
            (this.isMultiLayerWidget ? this.options.layers : [this.options]).forEach((options) => {
                this.executeQueryChain(options);
            });
        }
    }

    /**
     * Runs the visualization data query using the given options (or this.options if no options are given).
     *
     * @arg {any} [options=this.options] A WidgetOptionCollection object.
     */
    executeQueryChain(options?: any) {
        if (!this.initializing && this.isValidQuery(options || this.options)) {
            this.isLoading++;
            this.changeDetection.detectChanges();
            let query = this.createQuery(options || this.options);

            let filtersToIgnore = this.getFiltersToIgnore();
            if (filtersToIgnore && filtersToIgnore.length) {
                query.ignoreFilters(filtersToIgnore);
            }

            this.executeQuery((options || this.options), query);
        }
    }

    /**
     * Returns whether the visualization data query created using the given options is valid.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     * @abstract
     */
    abstract isValidQuery(options: any): boolean;

    /**
     * Creates and returns the visualization data query using the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {neon.query.Query}
     * @abstract
     */
    abstract createQuery(options: any): neon.query.Query;

    /**
     * Handles the given response data for a successful visualization data query created using the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any} response
     * @abstract
     */
    abstract onQuerySuccess(options: any, response: any): void;

    /**
     * Refreshes the visualization.
     */
    abstract refreshVisualization(): void;

    /**
     * Handles the given response data for a successful visualization data query created using the given options and updates Angular.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any} response
     */
    baseOnQuerySuccess(options: any, response: any) {
        //Converts the response to have the pretty names from the labelOptions in config to display
        this.onQuerySuccess(options, this.prettifyLabels(options, response));
        this.isLoading--;
        this.changeDetection.detectChanges();
        this.updateHeaderTextStyling();
    }

    /**
     * Runs the given query.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {neon.query.Query} query
     */
    executeQuery(options: any, query: neon.query.Query) {
        if (this.cannotExecuteQuery(options)) {
            this.baseOnQuerySuccess(options, {
                data: []
            });
            return;
        }

        let databaseTableKey = options.database.name + '_' + options.table.name;

        /* tslint:disable:no-string-literal */
        let filter = _.cloneDeep(query['filter']);
        /* tslint:enable:no-string-literal */

        //If we have any labelOptions in the config, we want to edit the data to convert whatever data items that are specified to the
        //"pretty" name. The pretty name goes to the visualizations, but it must be converted back before doing a query as the
        //database won't recognize the pretty name.
        this.datifyWherePredicates(options, filter.whereClause);

        if (this.outstandingDataQueriesByLayer.get(options._id).has(databaseTableKey)) {
            this.outstandingDataQueriesByLayer.get(options._id).get(databaseTableKey).abort();
        }

        this.outstandingDataQueriesByLayer.get(options._id).set(databaseTableKey,
            this.connectionService.getActiveConnection().executeQuery(query, null));

        this.outstandingDataQueriesByLayer.get(options._id).get(databaseTableKey).always(() => {
            this.outstandingDataQueriesByLayer.get(options._id).delete(databaseTableKey);
        });

        this.outstandingDataQueriesByLayer.get(options._id).get(databaseTableKey).done(this.baseOnQuerySuccess.bind(this, options));

        this.outstandingDataQueriesByLayer.get(options._id).get(databaseTableKey).fail((response) => {
            if (response.statusText !== 'abort') {
                this.isLoading--;
                this.messenger.publish(neonEvents.DASHBOARD_ERROR, {
                    error: response,
                    message: options.title + ' visualization data query failed on ' + databaseTableKey
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
    cannotExecuteQuery(options: any): boolean {
        return (!this.connectionService.getActiveConnection() || (options.hideUnfiltered &&
            !this.filterService.getFiltersForFields(options.database.name, options.table.name).length));
    }

    /**
     * Runs a visualization data query and handles any other behavior needed whenever the filters are changed.
     */
    handleFiltersChangedEvent(): void {
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
     * Handles updates that come through the data channel
     * @param event
     */
    onUpdateDataChannelEvent(event) {
        // TODO
    }

    /**
     * Updates tables, fields, and filters whenenver the database is changed and reruns the visualization query.
     *
     * @arg {any} options A WidgetOptionCollection object.
     */
    handleChangeDatabase(options: any) {
        this.updateTablesInOptions(options);
        this.initializeFieldsInOptions(options, this.createLayerFieldOptions());
        this.removeAllFilters(options, this.getCloseableFilters(), () => {
            this.setupFilters();
            this.handleChangeData(options);
        });
    }

    /**
     * Updates fields and filters whenever the table is changed and reruns the visualization query.
     *
     * @arg {any} options A WidgetOptionCollection object.
     */
    handleChangeTable(options: any) {
        this.updateFieldsInOptions(options);
        this.initializeFieldsInOptions(options, this.createLayerFieldOptions());
        this.removeAllFilters(options, this.getCloseableFilters(), () => {
            this.setupFilters();
            this.handleChangeData(options);
        });
    }

    /**
     * Updates filters whenever a filter field is changed and reruns the visualization query.
     *
     * @arg {any} options A WidgetOptionCollection object.
     */
    handleChangeFilterField(options: any) {
        this.removeAllFilters(options, this.getCloseableFilters(), () => {
            this.setupFilters();
            this.handleChangeData(options);
        });
    }

    /**
     * Runs the visualization data query.  Override to update properties and/or sub-components.
     *
     * @arg {any} [options=this.options] A WidgetOptionCollection object.
     */
    handleChangeData(options?: any) {
        this.executeQueryChain(options || this.options);
    }

    /**
     * Updates properties and/or sub-components whenever the limit is changed and reruns the visualization query.
     *
     * @arg {any} [options=this.options] A WidgetOptionCollection object.
     */
    subHandleChangeLimit(options?: any) {
        this.executeQueryChain(options || this.options);
    }

    /**
     * Updates the limit and the visualization.
     *
     * @arg {any} [options=this.options] A WidgetOptionCollection object.
     */
    handleChangeLimit(options?: any) {
        if (this.isNumber(this.newLimit)) {
            let newLimit = parseFloat('' + this.newLimit);
            if (newLimit > 0) {
                (options || this.options).limit = newLimit;
                this.subHandleChangeLimit();
            } else {
                this.newLimit = (options || this.options).limit;
            }
        } else {
            this.newLimit = (options || this.options).limit;
        }
    }

    /**
     * Called when a filter has been removed
     * @param filter The filter to remove: either a neon filter as stored in the filter service, or a local filter.
     */
    abstract removeFilter(filter: any): void;

    /**
     * Check that the local filter column name and value are not null/empty
     *
     * @arg {any} [options=this.options] A WidgetOptionCollection object.
     * @return {boolean}
     */
    hasUnsharedFilter(options?: any): boolean {
        return !!((options || this.options).unsharedFilterField && (options || this.options).unsharedFilterField.columnName &&
            (options || this.options).unsharedFilterValue && (options || this.options).unsharedFilterValue.trim());
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
    removeLocalFilterFromLocalAndNeon(options: any, filter: any, requery: boolean, refresh: boolean, callback?: Function) {
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
                    error: response,
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
     * @arg {function} [callback]
     */
    removeAllFilters(options: any, filters: any[], callback?: Function) {
        if (!filters.length) {
            if (callback) {
                callback();
            }
            return;
        }

        this.removeLocalFilterFromLocalAndNeon(options, filters[0], false, false, () => {
            this.removeAllFilters(options, filters.slice(1), callback);
        });
    }

    /**
     * Creates and returns the text for the settings button.
     *
     * @return {string}
     */
    public getButtonText(): string {
        let shownDataArray = this.getShownDataArray();

        // If the query was not yet run, show no text unless waiting on an event.
        if (!shownDataArray) {
            // TODO Add support for 'Please Select'
            return this.options.hideUnfiltered ? 'Please Filter' : '';
        }

        let shownDataCount = this.getShownDataCount(shownDataArray);
        let elementLabel = this.getVisualizationElementLabel(shownDataCount);

        // If the query was empty, show the relevant text.
        if (!shownDataCount) {
            return (this.options.hideUnfiltered && !this.getCloseableFilters().length) ? 'Please Filter' :
                ('0' + (elementLabel ? (' ' + elementLabel) : ''));
        }

        let totalDataCount = this.getTotalDataCount();

        // If the query was not limited, show the total count.
        if (totalDataCount <= this.options.limit) {
            return this.prettifyInteger(shownDataCount) + (elementLabel ? (' ' + elementLabel) : '');
        }

        // If the query was limited and the widget uses pagination, show the pagination text.
        if (this.isPaginationWidget) {
            elementLabel = this.getVisualizationElementLabel(totalDataCount);
            let begin = this.prettifyInteger((this.page - 1) * this.options.limit + 1);
            let end = this.prettifyInteger(Math.min(this.page * this.options.limit, totalDataCount));
            return (begin === end ? begin : (begin + ' - ' + end)) + ' of ' + this.prettifyInteger(totalDataCount) +
                (elementLabel ? (' ' + elementLabel) : '');
        }

        // Otherwise just show the shown count with a note that the query was limited.
        return this.prettifyInteger(shownDataCount) + (elementLabel ? (' ' + elementLabel) : '') + ' (Limited)';
    }

    // TODO THOR-971 Replace this function with a new local variable.
    /**
     * Returns the array of data items that are currently shown in the visualization, or undefined if it has not yet run its data query.
     *
     * @return {any[]}
     */
    public getShownDataArray(): any[] {
        return undefined;
    }

    /**
     * Returns the count of the given array of data items that are currently shown in the visualization.
     *
     * @arg {any[]} data
     * @return {number}
     */
    public getShownDataCount(data: any[]): number {
        return data.length;
    }

    // TODO THOR-971 Replace this function with a new local variable.
    /**
     * Returns the count of data items that an unlimited query for the visualization would contain.
     *
     * @return {number}
     */
    public getTotalDataCount(): number {
        let shownDataArray = this.getShownDataArray();
        return (shownDataArray || []).length;
    }

    /**
     * Returns the label for the data items that are currently shown in this visualization (Bars, Lines, Nodes, Points, Rows, Terms, ...).
     * Uses the given count to determine plurality.
     *
     * @arg {number} count
     * @return {string}
     */
    public getVisualizationElementLabel(count: number): string {
        return 'Result' + (count === 1 ? '' : 's');
    }

    /**
     * Publishes any custom events in the options (from the config file) using the given data item and event field.
     *
     * @arg {any} dataItem
     * @arg {string} eventField
     */
    publishAnyCustomEvents(dataItem: any, eventField: string) {
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
     * Publishes the given ID to the select_id event.
     *
     * @arg {any} id
     * @arg {any} [metadata]
     * @fires select_id
     */
    publishSelectId(id: any, metadata?: any) {
        this.messenger.publish('select_id', {
            source: this.id,
            database: this.options.database.name,
            table: this.options.table.name,
            id: id,
            metadata: metadata
        });
    }

    /**
     * Subscribes the given callback function to the select_id event.
     *
     * @arg {function} callback
     * @listens select_id
     */
    subscribeToSelectId(callback) {
        this.messenger.subscribe('select_id', callback);
    }

    getHighlightThemeColor() {
        let elements = document.getElementsByClassName('color-highlight');
        let color = elements.length ? window.getComputedStyle(elements[0], null).getPropertyValue('color') : '';
        return Color.fromRgbString(color || 'rgb(255, 255, 255)');
    }

    getPrimaryThemeColor() {
        let elements = document.getElementsByClassName('color-primary');
        let color = elements.length ? window.getComputedStyle(elements[0], null).getPropertyValue('color') : '';
        return Color.fromRgbString(color || 'rgb(255, 255, 255)');
    }

    getComputedStyle(nativeElement: any) {
        return window.getComputedStyle(nativeElement, null);
    }

    /**
     * Returns whether the given item is a number.
     *
     * @arg {any} item
     * @return {boolean}
     */
    isNumber(item: any): boolean {
        return !isNaN(parseFloat(item)) && isFinite(item);
    }

    /**
     * Returns the prettified string of the given integer (with commas).
     *
     * @arg {number} item
     * @return {string}
     */
    prettifyInteger(item: number): string {
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
     * Converts data elements that are specified to have a pretty name back to their original data label so that the database can
     * correctly query. When it comes back in onQuerySuccess, the response will be converted back to their "pretty" form
     * Will probably skew the data if the config specifies a data label to have a pretty name that is the same as another data label
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {neon.query.WherePredicate} wherePredicate
     */
    private datifyWherePredicates(options: any, wherePredicate: neon.query.WherePredicate) {
        let labelOptions = this.getLabelOptions(options);
        switch (wherePredicate.type) {
            case 'or':
            case 'and':
                for (let clause of (wherePredicate as neon.query.BooleanClause).whereClauses) {
                    //recursively edit where clauses that contain multiple whereClauses
                    this.datifyWherePredicates(options, clause);
                }
                break;
            case 'where':
                this.datifyWherePredicate((wherePredicate as neon.query.WhereClause), labelOptions);
                break;
        }
    }

    /**
     * Base case of datifyWherePredicates() when there is a single where clause
     *
     * @arg {neon.query.WhereClause} wherePredicate
     * @arg {any} labelOptions
     */
    private datifyWherePredicate(wherePredicate: neon.query.WhereClause, labelOptions: any) {
        let labelKeys = Object.keys(labelOptions);

        let key = wherePredicate.lhs;
        if (labelKeys.includes(key)) {
            let prettyLabels = labelOptions[key];
            let labels = Object.keys(prettyLabels);
            for (let label of labels) {
                let possiblePrettyLabel = wherePredicate.rhs;
                if (prettyLabels[label] === possiblePrettyLabel) {
                    wherePredicate.rhs = label;
                }
            }
        }
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

    protected createEmptyField(): FieldMetaData {
        return new FieldMetaData();
    }

    /**
     * Creates and returns an array of field options for the visualization.
     *
     * @return {(WidgetFieldOption|WidgetFieldArrayOption)[]}
     * @abstract
     */
    protected abstract createFieldOptions(): (WidgetFieldOption | WidgetFieldArrayOption)[];

    /**
     * Creates and returns an array of field options for a layer for the visualization.
     *
     * @return {(WidgetFieldOption|WidgetFieldArrayOption)[]}
     */
    protected createLayerFieldOptions(): (WidgetFieldOption | WidgetFieldArrayOption)[] {
        return [];
    }

    /**
     * Creates and returns an array of non-field options for a layer for the visualization.
     *
     * @return {WidgetOption[]}
     */
    protected createLayerNonFieldOptions(): WidgetOption[] {
        return [];
    }

    /**
     * Creates and returns an array of non-field options for the visualization.
     *
     * @return {WidgetOption[]}
     * @abstract
     */
    protected abstract createNonFieldOptions(): WidgetOption[];

    /**
     * Creates and returns the options for the visualization with the given title and limit.
     *
     * @arg {Injector} injector
     * @arg {string} visualizationTitle
     * @arg {number} defaultLimit
     * @return {any}
     */
    private createWidgetOptions(injector: Injector, visualizationTitle: string, defaultLimit: number): any {
        let options: any = new WidgetOptionCollection(injector);
        this.outstandingDataQueriesByLayer.set(options._id, new Map<string, any>());

        options.inject(new WidgetNonPrimitiveOption('customEventsToPublish', 'Custom Events To Publish', []));
        options.inject(new WidgetNonPrimitiveOption('customEventsToReceive', 'Custom Events To Receive', []));
        options.inject(new WidgetNonPrimitiveOption('filter', 'Custom Widget Filter', null));

        options.inject(new WidgetSelectOption('hideUnfiltered', 'Hide Widget if Unfiltered', false, OptionChoices.NoFalseYesTrue));
        options.inject(new WidgetFreeTextOption('limit', 'Limit', defaultLimit));
        options.inject(new WidgetFreeTextOption('title', 'Title', visualizationTitle));
        options.inject(new WidgetFreeTextOption('unsharedFilterValue', 'Unshared Filter Value', ''));

        // Backwards compatibility (configFilter deprecated and renamed to filter).
        options.filter = options.filter || this.injector.get('configFilter', null);

        options.inject(this.createNonFieldOptions());

        options.append(new WidgetDatabaseOption(), new DatabaseMetaData());
        options.append(new WidgetTableOption(), new TableMetaData());

        this.updateDatabasesInOptions(options);
        this.initializeFieldsInOptions(options);

        this.injector.get('layers', []).forEach((layerBindings) => {
            this.addLayer(options, layerBindings);
        });

        // Add a new empty layer if needed.
        if (this.isMultiLayerWidget && !options.layers.length) {
            this.addLayer(options);
        }

        return options;
    }

    /**
     * Returns the field object with the given column name or undefinied if the field does not exist.
     *
     * @arg {FieldMetaData[]} fields
     * @arg {string} columnName
     * @return {FieldMetaData}
     */
    public findField(fields: FieldMetaData[], columnName: string): FieldMetaData {
        let outputFields = !columnName ? [] : fields.filter((field: FieldMetaData) => {
            return field.columnName === columnName;
        });
        if (!outputFields.length && fields.length) {
            // Check if the column name is actually an array index rather than a name.
            let fieldIndex = parseInt(columnName, 10);
            if (!isNaN(fieldIndex) && fieldIndex < fields.length) {
                outputFields = [fields[fieldIndex]];
            }
        }
        return outputFields.length ? outputFields[0] : undefined;
    }

    /**
     * Returns the field object for the given binding key or an empty field object.
     *
     * @arg {FieldMetaData[]} fields
     * @arg {string} bindingKey
     * @arg {any} [config]
     * @return {FieldMetaData}
     */
    public findFieldObject(fields: FieldMetaData[], bindingKey: string, config?: any): FieldMetaData {
        return this.findField(fields, (config ? config[bindingKey] : this.injector.get(bindingKey, ''))) || new FieldMetaData();
    }

    /**
     * Returns the array of field objects for the given binding key or an array of empty field objects.
     *
     * @arg {FieldMetaData[]} fields
     * @arg {string} bindingKey
     * @arg {any} [config]
     * @return {FieldMetaData[]}
     */
    public findFieldObjects(fields: FieldMetaData[], bindingKey: string, config?: any): FieldMetaData[] {
        let bindings = (config ? config[bindingKey] : this.injector.get(bindingKey, null)) || [];
        return (Array.isArray(bindings) ? bindings : []).map((columnName) => this.findField(fields, columnName))
            .filter((fieldsObject) => !!fieldsObject);
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
            layers: (options || this.options).layers.map((layer) => this.getBindings(layer))
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
     * Initializes all the fields in the given WidgetOptionCollection.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {(WidgetFieldOption|WidgetFieldArrayOption)[]} [fieldOptions]
     */
    public initializeFieldsInOptions(options: any, fieldOptions?: (WidgetFieldOption | WidgetFieldArrayOption)[]) {
        (fieldOptions || this.createFieldOptions()).concat([
            new WidgetFieldOption('unsharedFilterField', 'Local Filter Field', false)
        ]).forEach((option) => {
            if (option.optionType === OptionType.FIELD) {
                options.append(option, this.findFieldObject(options.fields, option.bindingKey, options.config));
            }
            if (option.optionType === OptionType.FIELD_ARRAY) {
                options.append(option, this.findFieldObjects(options.fields, option.bindingKey, options.config));
            }
        });
    }

    /**
     * Updates all the databases, tables, and fields in the given options.  Called on init.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any} [config]
     * @return {any}
     */
    public updateDatabasesInOptions(options: any, config?: any): any {
        options.databases = this.datasetService.getDatabases();
        options.database = options.databases[0] || options.database;

        if (options.databases.length) {
            let configDatabase = config ? config.database : this.injector.get('database', null);
            if (configDatabase) {
                let isName = false;
                for (let database of options.databases) {
                    if (configDatabase === database.name) {
                        options.database = database;
                        isName = true;
                        break;
                    }
                }
                if (!isName) {
                    // Check if the config database is actually an array index rather than a name.
                    let databaseIndex = parseInt(configDatabase, 10);
                    if (!isNaN(databaseIndex) && databaseIndex < options.databases.length) {
                        options.database = options.databases[databaseIndex];
                    }
                }
            }
        }

        return this.updateTablesInOptions(options, config);
    }

    /**
     * Updates all the fields in the given options.  Called on init and whenever the table is changed.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {any}
     */
    public updateFieldsInOptions(options: any): any {
        if (options.database && options.table) {
            // Sort the fields that are displayed in the dropdowns in the options menus alphabetically.
            options.fields = this.datasetService.getSortedFields(options.database.name, options.table.name, true).filter((field) => {
                return (field && field.columnName);
            });
        }
        return options;
    }

    /**
     * Updates all the tables and fields in the given options.  Called on init and whenever the database is changed.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any} [config]
     * @return {any}
     */
    public updateTablesInOptions(options: any, config?: any): any {
        options.tables = options.database ? this.datasetService.getTables(options.database.name) : [];
        options.table = options.tables[0] || options.table;

        if (options.tables.length > 0) {
            let configTable = config ? config.table : this.injector.get('table', null);
            if (configTable) {
                let isName = false;
                for (let table of options.tables) {
                    if (configTable === table.name) {
                        options.table = table;
                        isName = true;
                        break;
                    }
                }
                if (!isName) {
                    // Check if the config table is actually an array index rather than a name.
                    let tableIndex = parseInt(configTable, 10);
                    if (!isNaN(tableIndex) && tableIndex < options.tables.length) {
                        options.table = options.tables[tableIndex];
                    }
                }
            }
        }

        return this.updateFieldsInOptions(options);
    }
}
