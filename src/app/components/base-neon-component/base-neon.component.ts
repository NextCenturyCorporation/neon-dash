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

import { ActiveGridService } from '../../services/active-grid.service';
import { Color } from '../../services/color-scheme.service';
import { ConnectionService } from '../../services/connection.service';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import { DatasetService } from '../../services/dataset.service';
import { ExportService } from '../../services/export.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { VisualizationService } from '../../services/visualization.service';
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
import * as uuid from 'node-uuid';
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
    protected outstandingDataQuery: any;

    protected initializing: boolean;

    private redrawAfterResize: boolean = false;

    public exportId: number;

    public isLoading: boolean = false;
    public isExportable: boolean = true;

    public errorMessage: string = '';

    public options: any;

    // TODO THOR-349 Move into future widget option menu component
    public newLimit: number;

    constructor(
        protected activeGridService: ActiveGridService,
        protected connectionService: ConnectionService,
        protected datasetService: DatasetService,
        protected filterService: FilterService,
        protected exportService: ExportService,
        protected injector: Injector,
        public themesService: ThemesService,
        public changeDetection: ChangeDetectorRef,
        protected visualizationService: VisualizationService
    ) {
        this.messenger = new neon.eventing.Messenger();
        this.doExport = this.doExport.bind(this);
        this.getBindings = this.getBindings.bind(this);
        this.id = uuid.v4();
        this.options = this.createWidgetOptions(this.injector, this.getWidgetName(), this.getWidgetDefaultLimit());
        this.newLimit = this.options.limit;
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
        this.messenger.subscribe(DatasetService.UPDATE_DATA_CHANNEL, this.onUpdateDataChannelEvent.bind(this));
        this.messenger.events({ filtersChanged: this.handleFiltersChangedEvent.bind(this) });
        this.visualizationService.registerBindings(this.id, this);
        this.activeGridService.register(this.id, this);

        this.outstandingDataQuery = {};
        for (let database of this.datasetService.getDatabases()) {
            this.outstandingDataQuery[database.name] = {};
        }
        try {
            this.setupFilters();
        } catch (e) {
            // Fails in unit tests - ignore.
        }

        this.subNgOnInit();
        this.exportId = (this.isExportable ? this.exportService.register(this.doExport) : null);
        this.initializing = false;
        this.postInit();
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
     * Function to get any bindings needed to re-create the visualization
     * @return {any}
     */
    getBindings(): any {
        return this.options.list().reduce((bindings, option) => {
            bindings[option.bindingKey] = option.getValueToSaveInBindings();
            return bindings;
        }, {});
    }

    /**
     * Get a query ready to give to the ExportService.
     */
    export(): any {
        // TODO this function needs to be changed  to abstract once we get through all the visualizations.

        let query = this.createQuery();
        let exportName = this.options.title.split(':').join(' ');
        if (query) {
            return {
                name: 'Query_Results_Table',
                data: [{
                    query: query,
                    name: exportName + '-' + this.exportId,
                    fields: this.getExportFields().map((exportFieldsObject) => ({
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
        console.error('SKIPPING EXPORT FOR ' + exportName);
        return null;
    }

    doExport() {
        return this.export();
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
    onResizeStart() {
        // Do nothing.
    }

    /**
     * Updates the header text styling.
     */
    updateHeaderTextStyling() {
        let refs = this.getElementRefs();
        if (refs.headerText && refs.infoText && refs.visualization) {
            refs.headerText.nativeElement.style.maxWidth = Math.floor(refs.visualization.nativeElement.clientWidth -
                refs.infoText.nativeElement.clientWidth - this.TOOLBAR_EXTRA_WIDTH - 1) + 'px';
        }
    }

    /**
     * Resizes visualization-specific sub-components as needed.  Override as needed.
     */
    subOnResizeStop() {
        // Do nothing.
    }

    /**
     * Resizes sub-components as needed.
     */
    onResizeStop() {
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
        this.exportService.unregister(this.exportId);
        this.visualizationService.unregister(this.id);
        this.activeGridService.unregister(this.id);
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
     * Add a filter and register it with neon.
     *
     * @arg {boolean} executeQueryChainOnSuccess
     * @arg {object} subclassFilter
     * @arg {neon.query.WherePredicate} wherePredicate
     * @arg {function} [callback]
     */
    addNeonFilter(executeQueryChainOnSuccess: boolean, subclassFilter: any, wherePredicate: neon.query.WherePredicate,
        callback?: Function) {

        let filterName = {
            visName: this.options.title,
            text: this.getFilterText(subclassFilter)
        };
        let onSuccess = (resp: any) => {
            if (typeof resp === 'string') {
                subclassFilter.id = resp;
            }
            if (callback) {
                callback();
            }
            if (executeQueryChainOnSuccess) {
                this.executeQueryChain();
            }
        };

        this.filterService.addFilter(this.messenger,
            this.id,
            this.options.database.name,
            this.options.table.name,
            wherePredicate,
            filterName,
            onSuccess.bind(this),
            () => {
                console.error('filter failed to set');
                if (callback) {
                    callback();
                }
            });
        this.changeDetection.detectChanges();
    }

    /**
     * Adds all the given filters to this component and neon with an optional callback function
     * @param filters
     * @param callback
     */
    addMultipleFilters(filters: {singleFilter: any, clause: neon.query.WherePredicate}[], callback?: Function) {
        if (!filters.length) {
            if (callback) {
                callback();
            }
            return;
        }

        this.addNeonFilter(true, filters[0].singleFilter, filters[0].clause, () => {
            this.addMultipleFilters(filters.slice(1), callback);
        });
    }

    /**
     * Replace a filter and register the change with Neon.
     *
     * @arg {boolean} executeQueryChainOnSuccess
     * @arg {object} subclassFilter
     * @arg {neon.query.WherePredicate} wherePredicate
     * @arg {function} [callback]
     */
    replaceNeonFilter(executeQueryChainOnSuccess: boolean, subclassFilter: any, wherePredicate: neon.query.WherePredicate,
        callback?: Function) {

        let filterName = {
            visName: this.options.title,
            text: this.getFilterText(subclassFilter)
        };
        let onSuccess = (resp: any) => {
            if (callback) {
                callback();
            }
            if (executeQueryChainOnSuccess) {
                this.executeQueryChain();
            }
        };
        this.filterService.replaceFilter(this.messenger,
            subclassFilter.id,
            this.id,
            this.options.database.name,
            this.options.table.name,
            wherePredicate,
            filterName,
            onSuccess.bind(this),
            () => {
                console.error('filter failed to set');
                if (callback) {
                    callback();
                }
            });
        this.changeDetection.detectChanges();
    }

    /**
     * Execute the Neon query chain.
     *
     * This is expected to get called whenever a query is expected to be run.
     * This could be startup, user action to change field, relevant filter change
     * from another visualization
     */
    executeQueryChain() {
        let isValidQuery = this.isValidQuery();
        if (!isValidQuery) {
            return;
        }
        this.isLoading = true;
        this.changeDetection.detectChanges();
        let query = this.createQuery();

        let filtersToIgnore = this.getFiltersToIgnore();
        if (filtersToIgnore && filtersToIgnore.length > 0) {
            query.ignoreFilters(filtersToIgnore);
        }

        this.executeQuery(query);
    }

    /**
     * Check if the current query (Including filters) is valid
     */
    abstract isValidQuery(): boolean;

    /**
     * Create the query needed to get the data for the visualization
     */
    abstract createQuery(): neon.query.Query;

    /**
     * Called after a successful query
     * @param response the quersy response
     */
    abstract onQuerySuccess(response: any): void;

    /**
     * Update the visualization
     */
    abstract refreshVisualization(): void;

    /**
     * Generic query success method
     * @param response
     */
    baseOnQuerySuccess(response) {
        //Converts the response to have the pretty names from the labelOptions in config to display
        this.onQuerySuccess(this.prettifyLabels(response));
        this.isLoading = false;
        this.changeDetection.detectChanges();
        this.updateHeaderTextStyling();
    }

    /**
     * Returns whether this visualization cannot execute its query right now.
     *
     * @return {boolean}
     */
    cannotExecuteQuery(): boolean {
        let connection = this.connectionService.getActiveConnection();
        let database = this.options.database.name;
        let table = this.options.table.name;
        return (!connection || (this.options.hideUnfiltered && !this.filterService.getFiltersForFields(database, table).length));
    }

    /**
     * Execute a neon query
     * @param query The query to execute
     */
    executeQuery(query: neon.query.Query) {
        let database = this.options.database.name;
        let table = this.options.table.name;
        let connection = this.connectionService.getActiveConnection();

        if (this.cannotExecuteQuery()) {
            this.baseOnQuerySuccess({
                data: []
            });
            return;
        }

        if (!connection) {
            return;
        }
        /* tslint:disable:no-string-literal */

        let filter = _.cloneDeep(query['filter']);
        //If we have any labelOptions in the config, we want to edit the data to convert whatever data items that are specified to the
        //"pretty" name. The pretty name goes to the visualizations, but it must be converted back before doing a query as the
        //database won't recognize the pretty name.
        this.datifyWherePredicates(filter.whereClause);
        /* tslint:enable:no-string-literal */

        // Cancel any previous data query currently running.
        if (this.outstandingDataQuery[database] && this.outstandingDataQuery[database][table]) {
            this.outstandingDataQuery[database][table].abort();
        }

        // Execute the data query, calling the function defined in 'done' or 'fail' as
        // needed.
        this.outstandingDataQuery[database][table] = connection.executeQuery(query, null);

        // Visualizations that do not execute data queries will not return a query
        // object.
        if (!this.outstandingDataQuery[database][table]) {
            // TODO do something
            console.error('execute query did not return an object');
        }

        this.outstandingDataQuery[database][table].always(() => {
            this.outstandingDataQuery[database][table] = undefined;
        });
        this.outstandingDataQuery[database][table].done(this.baseOnQuerySuccess.bind(this));

        this.outstandingDataQuery[database][table].fail((response) => {
            if (response.statusText === 'abort') {
                // query was aborted so we don't care.  We assume we aborted it on purpose.
            } else {
                this.isLoading = false;
                console.error('Query failed: ', response);
                this.changeDetection.detectChanges();
            }
        });
    }

    /**
     * Called after the filters in the filter service have changed.
     * Defaults to calling setupFilters() then executeQueryChain()
     */
    handleFiltersChangedEvent(): void {
        this.setupFilters();
        this.executeQueryChain();
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
     */
    handleChangeDatabase() {
        this.updateTablesInOptions(this.options);
        this.initializeFieldsInOptions(this.options);
        this.removeAllFilters(this.getCloseableFilters(), () => {
            this.setupFilters();
            this.handleChangeData();
        });
    }

    /**
     * Updates fields and filters whenever the table is changed and reruns the visualization query.
     */
    handleChangeTable() {
        this.updateFieldsInOptions(this.options);
        this.initializeFieldsInOptions(this.options);
        this.removeAllFilters(this.getCloseableFilters(), () => {
            this.setupFilters();
            this.handleChangeData();
        });
    }

    /**
     * Updates filters whenever a filter field is changed and reruns the visualization query.
     */
    handleChangeFilterField() {
        this.removeAllFilters(this.getCloseableFilters(), () => {
            this.setupFilters();
            this.handleChangeData();
        });
    }

    /**
     * Reruns the visualization query.  Override to update properties and/or sub-components.
     */
    handleChangeData() {
        this.logChangeAndStartQueryChain();
    }

    /**
     * Updates properties and/or sub-components whenever the limit is changed and reruns the visualization query.
     */
    subHandleChangeLimit() {
        this.logChangeAndStartQueryChain();
    }

    /**
     * Updates the limit and the visualization.
     */
    handleChangeLimit() {
        if (this.isNumber(this.newLimit)) {
            let newLimit = parseFloat('' + this.newLimit);
            if (newLimit > 0) {
                this.options.limit = newLimit;
                this.subHandleChangeLimit();
            } else {
                this.newLimit = this.options.limit;
            }
        } else {
            this.newLimit = this.options.limit;
        }
    }

    /**
     * If not initializing, calls executeQueryChain();
     */
    logChangeAndStartQueryChain() {
        if (!this.initializing) {
            this.executeQueryChain();
        }
    }

    /**
     * Called when a filter has been removed
     * @param filter The filter to remove: either a neon filter as stored in the filter service, or a local filter.
     */
    abstract removeFilter(filter: any): void;

    /**
     * Check that the local filter column name and value are not null/empty
     * @return {boolean}
     */
    hasUnsharedFilter(): boolean {
        return !!(this.options.unsharedFilterField && this.options.unsharedFilterField.columnName &&
            this.options.unsharedFilterValue && this.options.unsharedFilterValue.trim());
    }

    /**
     * Remove a filter from neon, and optionally requery and/or refresh
     *
     * @arg {object} filter
     * @arg {boolean} requery
     * @arg {boolean} refresh
     * @arg {function} [callback]
     */
    removeLocalFilterFromLocalAndNeon(filter: any, requery: boolean, refresh: boolean, callback?: Function) {
        // If we are removing a filter, assume its both local and neon so it should be removed in both
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
                    this.executeQueryChain();
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
            () => {
                console.error('error removing filter');
                if (callback) {
                    callback();
                }
            });
        this.changeDetection.detectChanges();
    }

    /**
     * Removes all the given filters from this component and neon with an optional callback.
     *
     * @arg {array} filters
     * @arg {function} [callback]
     */
    removeAllFilters(filters: any[], callback?: Function) {
        if (!filters.length) {
            if (callback) {
                callback();
            }
            return;
        }

        this.removeLocalFilterFromLocalAndNeon(filters[0], false, false, () => {
            this.removeAllFilters(filters.slice(1), callback);
        });
    }

    getButtonText() {
        return '';
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
        return item.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    /**
     * Returns the result of converting labels in the response query data
     * into pretty labels specified in the config.
     */
    private prettifyLabels(response) {
        let labelOptions = this.getLabelOptions();
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
     */
    private datifyWherePredicates(whereClause) {
        let labelOptions = this.getLabelOptions();
        switch (whereClause.type) {
            case 'or':
            case 'and':
                let newFilters = [];
                for (let clause of whereClause.whereClauses) {
                    //recursively edit where clauses that contain multiple whereClauses
                    newFilters.push(this.datifyWherePredicates(clause));
                }
                return newFilters;
            case 'where':
                return this.datifyWherePredicate(whereClause, labelOptions);
        }
    }

    //Base case of datifyWherePredicates() when there is a single where clause
    private datifyWherePredicate(predicate, labelOptions) {
        let labelKeys = Object.keys(labelOptions);

        let key = predicate.lhs;
        if (labelKeys.includes(key)) {
            let prettyLabels = labelOptions[key];
            let labels = Object.keys(prettyLabels);
            for (let label of labels) {
                let possiblePrettyLabel = predicate.rhs;
                if (prettyLabels[label] === possiblePrettyLabel) {
                    predicate.rhs = label;
                }
            }
        }
    }

    //Grabs labelOptions specified in the config
    private getLabelOptions() {
        let dataset = this.datasetService.getDataset();
        let database = _.find(dataset.databases, (db) => db.name === this.options.database.name);
        let tableName = _.find(database.tables, (table) => table.name === this.options.table.name);
        let labelOptions = tableName.labelOptions;
        return labelOptions;
    }

    protected createEmptyField(): FieldMetaData {
        return new FieldMetaData();
    }

    /**
     * Creates and returns an array of field options for the specific visualization.
     *
     * @return {(WidgetFieldOption|WidgetFieldArrayOption)[]}
     * @abstract
     */
    protected abstract createFieldOptions(): (WidgetFieldOption | WidgetFieldArrayOption)[];

    /**
     * Creates and returns an array of non-field options for the specific visualization.
     *
     * @return {WidgetOption[]}
     * @abstract
     */
    protected abstract createNonFieldOptions(): WidgetOption[];

    /**
     * Creates and returns the options for the unique widget with the given title and limit.
     *
     * @arg {Injector} injector
     * @arg {string} visualizationTitle
     * @arg {number} defaultLimit
     * @return {any}
     */
    public createWidgetOptions(injector: Injector, visualizationTitle: string, defaultLimit: number): any {
        let options: any = new WidgetOptionCollection(injector);

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
     * @return {FieldMetaData}
     */
    public findFieldObject(fields: FieldMetaData[], bindingKey: string): FieldMetaData {
        return this.findField(fields, this.injector.get(bindingKey, '')) || new FieldMetaData();
    }

    /**
     * Returns the array of field objects for the given binding key or an array of empty field objects.
     *
     * @arg {FieldMetaData[]} fields
     * @arg {string} bindingKey
     * @return {FieldMetaData[]}
     */
    public findFieldObjects(fields: FieldMetaData[], bindingKey: string): FieldMetaData[] {
        let bindings = this.injector.get(bindingKey, null) || [];
        return (Array.isArray(bindings) ? bindings : []).map((columnName) => this.findField(fields, columnName))
            .filter((fieldsObject) => !!fieldsObject);
    }

    /**
     * Returns the list of fields to export.
     *
     * @return {{ columnName: string, prettyName: string }[]}
     */
    public getExportFields(): { columnName: string, prettyName: string }[] {
        return this.options.list().reduce((exportFields, option) => {
            if (option.optionType === OptionType.FIELD && option.valueCurrent.columnName) {
                exportFields.push({
                    columnName: option.valueCurrent.columnName,
                    prettyName: option.valueCurrent.prettyName
                });
            }
            return exportFields;
        }, []);
    }

    /**
     * Returns the default limit for the unique widget.
     *
     * @return {string}
     * @abstract
     */
    protected abstract getWidgetDefaultLimit(): number;

    /**
     * Returns the name for the unique widget.
     *
     * @return {string}
     * @abstract
     */
    protected abstract getWidgetName(): string;

    /**
     * Initializes all the fields in the given WidgetOptionCollection.
     *
     * @arg {any} options
     */
    public initializeFieldsInOptions(options: any) {
        this.createFieldOptions().concat([new WidgetFieldOption('unsharedFilterField', 'Local Filter Field', false)]).forEach((option) => {
            if (option.optionType === OptionType.FIELD) {
                options.append(option, this.findFieldObject(options.fields, option.bindingKey));
            }
            if (option.optionType === OptionType.FIELD_ARRAY) {
                options.append(option, this.findFieldObjects(options.fields, option.bindingKey));
            }
        });
    }

    /**
     * Updates all the databases, tables, and fields in the given options.  Called on init.
     *
     * @arg {any} options
     * @return {any}
     */
    public updateDatabasesInOptions(options: any): any {
        options.databases = this.datasetService.getDatabases();
        options.database = options.databases[0] || options.database;

        if (options.databases.length) {
            let configDatabase = this.injector.get('database', null);
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

        return this.updateTablesInOptions(options);
    }

    /**
     * Updates all the fields in the given options.  Called on init and whenever the table is changed.
     *
     * @arg {any} options
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
     * @arg {any} options
     * @return {any}
     */
    public updateTablesInOptions(options: any): any {
        options.tables = options.database ? this.datasetService.getTables(options.database.name) : [];
        options.table = options.tables[0] || options.table;

        if (options.tables.length > 0) {
            let configTable = this.injector.get('table', null);
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
