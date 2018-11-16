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
import { ExportService } from '../../services/export.service';
import { FilterService } from '../../services/filter.service';

import { Color } from '../../color';
import { FieldMetaData, TableMetaData, DatabaseMetaData } from '../../dataset';
import { neonEvents } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import * as _ from 'lodash';
import * as uuid from 'node-uuid';

/**
 * Manages configurable options for all visualizations.
 */
export abstract class BaseNeonOptions {
    public _id: string;
    public databases: DatabaseMetaData[] = [];
    public database: DatabaseMetaData;
    public fields: FieldMetaData[] = [];
    public hideUnfiltered: boolean;
    public limit: number;
    public newLimit: number;
    public tables: TableMetaData[] = [];
    public table: TableMetaData;
    public title: string;
    public unsharedFilterField: FieldMetaData;
    public unsharedFilterValue: string;

    // The filter set in the config file.
    public filter: {
        lhs: string,
        operator: string,
        rhs: string
    };

    public customEventsToPublish: {
        id: string,
        fields: { columnName: string, prettyName?: string, type?: string }[]
    }[];

    public customEventsToReceive: {
        id: string,
        fields: { columnName: string, prettyName?: string, type?: string }[]
    }[];

    /**
     * @constructor
     * @arg {Injector} injector
     * @arg {DatasetService} datasetService
     * @arg {string} [visualizationTitle='']
     * @arg {number} [defaultLimit=10]
     */
    constructor(protected injector: Injector, protected datasetService: DatasetService, visualizationTitle: string = '',
        defaultLimit: number = 10) {

        this._id = injector.get('_id', uuid.v4());
        this.customEventsToPublish = injector.get('customEventsToPublish', []);
        this.customEventsToReceive = injector.get('customEventsToReceive', []);
        this.filter = injector.get('configFilter', null);
        this.hideUnfiltered = injector.get('hideUnfiltered', false);
        this.limit = injector.get('limit', defaultLimit);
        this.newLimit = this.limit;
        this.title = injector.get('title', visualizationTitle);
        this.unsharedFilterValue = injector.get('unsharedFilterValue', '');
        this.initializeNonFieldBindings();
        this.updateDatabases();
    }

    /**
     * Appends all the non-field bindings for the specific visualization to the given bindings object and returns the bindings object.
     *
     * @arg {any} bindings
     * @return {any}
     * @abstract
     */
    protected abstract appendNonFieldBindings(bindings: any): any;

    /**
     * Creates and returns the bindings for the options.
     *
     * @return {any}
     */
    public createBindings(): any {
        let bindings = {
            configFilter: this.filter || undefined,
            customEventsToPublish: this.customEventsToPublish,
            customEventsToReceive: this.customEventsToReceive,
            database: this.database.name,
            hideUnfiltered: this.hideUnfiltered,
            limit: this.limit,
            table: this.table.name,
            title: this.title,
            unsharedFilterValue: this.unsharedFilterValue
        };

        this.getAllFieldProperties().forEach((property) => {
            bindings[property] = this[property].columnName;
        });

        this.getAllFieldArrayProperties().forEach((property) => {
            bindings[property] = this[property].map((fieldsObject) => fieldsObject.columnName);
        });

        return this.appendNonFieldBindings(bindings);
    }

    /**
     * Returns the field object with the given column name.
     *
     * @arg {string} columnName
     * @return {FieldMetaData}
     */
    public findField(columnName: string): FieldMetaData {
        let outputFields = this.fields.filter((field: FieldMetaData) => {
            return field.columnName === columnName;
        });
        if (!outputFields.length && this.fields.length) {
            // Check if the column name is actually an array index rather than a name.
            let fieldIndex = parseInt(columnName, 10);
            if (!isNaN(fieldIndex) && fieldIndex < this.fields.length) {
                outputFields = [this.fields[fieldIndex]];
            }
        }
        return outputFields.length ? outputFields[0] : undefined;
    }

    /**
     * Returns the field object for the given binding / mapping key or an empty field object.
     *
     * @arg {string} bindingKey
     * @arg {string} [mappingKey]
     * @return {FieldMetaData}
     */
    public findFieldObject(bindingKey: string, mappingKey?: string): FieldMetaData {
        return this.findFieldObjectByName((this.injector.get(bindingKey, null) || ''), mappingKey);
    }

    /**
     * Returns the array of field objects for the given binding / mapping key or an array of empty field objects.
     *
     * @arg {string} bindingKey
     * @arg {string} [mappingKey]
     * @return {FieldMetaData}
     */
    public findFieldObjects(bindingKey: string, mappingKey?: string): FieldMetaData[] {
        let bindings = this.injector.get(bindingKey, null) || [];
        // TODO Should we remove empty field objects from the array?
        return (Array.isArray(bindings) ? bindings : []).map((columnName) => this.findFieldObjectByName(columnName, mappingKey));
    }

    /**
     * Returns the field object for the given name or the given mapping key.
     *
     * @arg {string} columnName
     * @arg {string} [mappingKey]
     * @return {FieldMetaData}
     * @private
     */
    private findFieldObjectByName(columnName: string, mappingKey?: string): FieldMetaData {
        let field = columnName ? this.findField(columnName) : undefined;

        if (!field && mappingKey) {
            field = this.findField(this.datasetService.getMapping(this.database.name, this.table.name, mappingKey));
        }

        return field || new FieldMetaData();
    }

    /**
     * Returns the list of field array properties.
     *
     * @return {string[]}
     */
    public getAllFieldArrayProperties(): string[] {
        return [].concat(this.getFieldArrayProperties());
    }

    /**
     * Returns the list of field properties.
     *
     * @return {string[]}
     */
    public getAllFieldProperties(): string[] {
        return ['unsharedFilterField'].concat(this.getFieldProperties());
    }

    /**
     * Returns the list of fields to export.
     *
     * @return {{ columnName: string, prettyName: string }[]}
     */
    public getExportFields(): { columnName: string, prettyName: string }[] {
        return this.getFieldProperties().map((property) => ({
            columnName: this[property].columnName,
            prettyName: this[property].prettyName
        })).filter((exportFieldsObject) => !!exportFieldsObject.columnName);
    }

    /**
     * Returns the list of field array properties for the specific visualization.
     *
     * @return {string[]}
     * @abstract
     */
    protected abstract getFieldArrayProperties(): string[];

    /**
     * Returns the list of field properties for the specific visualization.
     *
     * @return {string[]}
     * @abstract
     */
    protected abstract getFieldProperties(): string[];

    /**
     * Initializes all the non-field bindings for the specific visualization.
     *
     * @abstract
     */
    public abstract initializeNonFieldBindings(): void;

    /**
     * Updates all the database options, then calls updateTables().  Called on init.
     */
    public updateDatabases() {
        this.databases = this.datasetService.getDatabases();
        this.database = this.databases[0] || new DatabaseMetaData();

        if (this.databases.length) {
            let configDatabase = this.injector.get('database', null);
            if (configDatabase) {
                let isName = false;
                for (let database of this.databases) {
                    if (configDatabase === database.name) {
                        this.database = database;
                        isName = true;
                        break;
                    }
                }
                if (!isName) {
                    // Check if the config database is actually an array index rather than a name.
                    let databaseIndex = parseInt(configDatabase, 10);
                    if (!isNaN(databaseIndex) && databaseIndex < this.databases.length) {
                        this.database = this.databases[databaseIndex];
                    }
                }
            }
        }

        this.updateTables();
    }

    /**
     * Updates all the field options.  Called on init and whenever the table is changed.
     */
    public updateFields() {
        if (this.database && this.table) {
            // Sort the fields that are displayed in the dropdowns in the options menus alphabetically.
            this.fields = this.datasetService.getSortedFields(this.database.name, this.table.name, true).filter((field) => {
                return (field && field.columnName);
            });
        }

        this.getAllFieldProperties().forEach((property) => {
            this[property] = this.findFieldObject(property);
        });

        this.getAllFieldArrayProperties().forEach((property) => {
            this[property] = this.findFieldObjects(property);
        });
    }

    /**
     * Updates all the table options, then calls updateFields().  Called on init and whenever the database is changed.
     */
    public updateTables() {
        this.tables = this.database ? this.datasetService.getTables(this.database.name) : [];
        this.table = this.tables[0] || new TableMetaData();

        if (this.tables.length > 0) {
            let configTable = this.injector.get('table', null);
            if (configTable) {
                let isName = false;
                for (let table of this.tables) {
                    if (configTable === table.name) {
                        this.table = table;
                        isName = true;
                        break;
                    }
                }
                if (!isName) {
                    // Check if the config table is actually an array index rather than a name.
                    let tableIndex = parseInt(configTable, 10);
                    if (!isNaN(tableIndex) && tableIndex < this.tables.length) {
                        this.table = this.tables[tableIndex];
                    }
                }
            }
        }

        this.updateFields();
    }
}

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

    public isLoading: boolean = false;
    public isExportable: boolean = true;

    public errorMessage: string = '';

    constructor(
        protected connectionService: ConnectionService,
        protected datasetService: DatasetService,
        protected filterService: FilterService,
        protected exportService: ExportService,
        protected injector: Injector,
        public changeDetection: ChangeDetectorRef
    ) {
        this.messenger = new neon.eventing.Messenger();
        this.getBindings = this.getBindings.bind(this);
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
        this.id = this.getOptions()._id;
        this.messenger.subscribe(DatasetService.UPDATE_DATA_CHANNEL, this.onUpdateDataChannelEvent.bind(this));
        this.messenger.events({ filtersChanged: this.handleFiltersChangedEvent.bind(this) });
        this.messenger.publish(neonEvents.WIDGET_REGISTER, {
            id: this.id,
            export: this.isExportable ? this.doExport.bind(this) : null,
            widget: this
        });

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
        this.initializing = false;
        this.postInit();
    }

    /**
     * Returns the options for the specific visualization.
     *
     * @return {BaseNeonOptions}
     */
    abstract getOptions(): BaseNeonOptions;

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
        return this.getOptions().createBindings();
    }

    /**
     * Get a query ready to give to the ExportService.
     */
    export(): any {
        // TODO this function needs to be changed  to abstract once we get through all the visualizations.

        let query = this.createQuery();
        let exportName = this.getOptions().title.split(':').join(' ');
        if (query) {
            return {
                name: 'Query_Results_Table',
                data: [{
                    query: query,
                    name: exportName + '-' + this.id,
                    fields: this.getOptions().getExportFields().map((exportFieldsObject) => ({
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
            visName: this.getOptions().title,
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
            this.getOptions().database.name,
            this.getOptions().table.name,
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
            visName: this.getOptions().title,
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
            this.getOptions().database.name,
            this.getOptions().table.name,
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
        let options = this.getOptions();
        let database = options.database.name;
        let table = options.table.name;
        return (!connection || (options.hideUnfiltered && !this.filterService.getFiltersForFields(database, table).length));
    }

    /**
     * Execute a neon query
     * @param query The query to execute
     */
    executeQuery(query: neon.query.Query) {
        let options = this.getOptions();
        let database = options.database.name;
        let table = options.table.name;
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
        this.getOptions().updateTables();
        this.removeAllFilters(this.getCloseableFilters(), () => {
            this.setupFilters();
            this.handleChangeData();
        });
    }

    /**
     * Updates fields and filters whenever the table is changed and reruns the visualization query.
     */
    handleChangeTable() {
        this.getOptions().updateFields();
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
        if (this.isNumber(this.getOptions().newLimit)) {
            let newLimit = parseFloat('' + this.getOptions().newLimit);
            if (newLimit > 0) {
                this.getOptions().limit = newLimit;
                this.subHandleChangeLimit();
            } else {
                this.getOptions().newLimit = this.getOptions().limit;
            }
        } else {
            this.getOptions().newLimit = this.getOptions().limit;
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
        return !!(this.getOptions().unsharedFilterField && this.getOptions().unsharedFilterField.columnName &&
            this.getOptions().unsharedFilterValue && this.getOptions().unsharedFilterValue.trim());
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
        this.getOptions().customEventsToPublish.forEach((config) => {
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
            database: this.getOptions().database.name,
            table: this.getOptions().table.name,
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
        let database = _.find(dataset.databases, (db) => db.name === this.getOptions().database.name);
        let tableName = _.find(database.tables, (table) => table.name === this.getOptions().table.name);
        let labelOptions = tableName.labelOptions;
        return labelOptions;
    }

    protected createEmptyField(): FieldMetaData {
        return new FieldMetaData();
    }
}
