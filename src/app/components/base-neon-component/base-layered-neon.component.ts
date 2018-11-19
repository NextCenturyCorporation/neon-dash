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
import { FieldMetaData, TableMetaData, DatabaseMetaData } from '../../dataset';
import { neonEvents } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import * as _ from 'lodash';
import * as uuid from 'node-uuid';

/**
 * Manages configurable options for one layer.
 */
export abstract class BaseNeonLayer {
    public database: DatabaseMetaData;
    public databases: DatabaseMetaData[] = [];
    public fields: FieldMetaData[] = [];
    public table: TableMetaData;
    public tables: TableMetaData[] = [];
    public title: string;
    public unsharedFilterField: FieldMetaData;
    public unsharedFilterValue: string;

    /**
     * @constructor
     * @arg {any} config
     * @arg {DatasetService} datasetService
     */
    constructor(protected config: any, protected injector: Injector, protected datasetService: DatasetService) {
        this.title = config.title || 'New Layer';
        this.unsharedFilterValue = injector.get('unsharedFilterValue', '');
        this.initializeNonFieldBindings();
        this.updateDatabases();
    }

    /**
     * Appends all the non-field bindings for the specific layer to the given bindings object and returns the bindings object.
     *
     * @arg {any} bindings
     * @return {any}
     * @abstract
     */
    protected abstract appendNonFieldBindings(bindings: any): any;

    /**
     * Creates and returns the bindings for the layer.
     *
     * @return {any}
     */
    public createBindings(): any {
        let bindings = {
            database: this.database.name,
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
        return this.findFieldObjectByName((this.config[bindingKey] || ''), mappingKey);
    }

    /**
     * Returns the array of field objects for the given binding / mapping key or an array of empty field objects.
     *
     * @arg {string} bindingKey
     * @arg {string} [mappingKey]
     * @return {FieldMetaData}
     */
    public findFieldObjects(bindingKey: string, mappingKey?: string): FieldMetaData[] {
        let bindings = this.config[bindingKey] || [];
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
     * Returns the list of field array properties for the specific layer.
     *
     * @return {string[]}
     * @abstract
     */
    protected abstract getFieldArrayProperties(): string[];

    /**
     * Returns the list of field properties for the specific layer.
     *
     * @return {string[]}
     * @abstract
     */
    protected abstract getFieldProperties(): string[];

    /**
     * Initializes all the non-field bindings for the specific layer.
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

        if (this.databases.length > 0) {
            let configDatabase = this.config ? this.config.database : undefined;
            if (configDatabase) {
                for (let database of this.databases) {
                    if (configDatabase === database.name) {
                        this.database = database;
                        break;
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
            let configTable = this.config ? this.config.table : undefined;
            if (configTable) {
                for (let table of this.tables) {
                    if (configTable === table.name) {
                        this.table = table;
                        break;
                    }
                }
            }
        }

        this.updateFields();
    }
}

/**
 * Manages configurable options for all visualizations.
 */
export abstract class BaseNeonMultiLayerOptions {
    public _id: string;
    public limit: number;
    public newLimit: number;
    public title: string;

    // The filter set in the config file.
    public filter: {
        lhs: string,
        operator: string,
        rhs: string
    };

    /**
     * @constructor
     * @arg {Injector} injector
     * @arg {string} [visualizationTitle='']
     * @arg {number} [defaultLimit=10]
     */
    constructor(protected injector: Injector, visualizationTitle: string = '', defaultLimit: number = 10) {
        this._id = injector.get('_id', uuid.v4());
        this.filter = injector.get('configFilter', null);
        this.limit = injector.get('limit', defaultLimit);
        this.newLimit = this.limit;
        this.title = injector.get('title', visualizationTitle);
        this.initializeNonFieldBindings();
    }

    /**
     * Creates and returns the bindings for the options.
     *
     * @return {any}
     */
    public createBindings(): any {
        return {
            configFilter: this.filter || undefined,
            title: this.title,
            limit: this.limit,
            layers: this.getLayers().map((layer) => layer.createBindings())
        };
    }

    /**
     * Returns the layers for the options.
     *
     * @abstract
     * @return {BaseNeonLayer[]}
     */
    public abstract getLayers(): BaseNeonLayer[];

    /**
     * Initializes all the non-field bindings for the specific visualization.
     *
     * @abstract
     */
    public abstract initializeNonFieldBindings(): void;
}

/**
 * Base component for all non-layered Neon visualizations.
 * This manages some of the lifecycle and query logic.
 */
export abstract class BaseLayeredNeonComponent implements OnInit, OnDestroy {
    private SETTINGS_BUTTON_WIDTH: number = 30;
    private TEXT_MARGIN_WIDTH: number = 10;
    private TOOLBAR_PADDING_WIDTH: number = 20;
    private TOOLBAR_EXTRA_WIDTH: number = this.SETTINGS_BUTTON_WIDTH + this.TEXT_MARGIN_WIDTH + this.TOOLBAR_PADDING_WIDTH;

    public id: string;
    protected messenger: neon.eventing.Messenger;
    protected outstandingDataQueriesByLayer: any[];

    protected initializing: boolean = false;

    private redrawAfterResize: boolean = false;

    public isLoading: number = 0;
    public isExportable: boolean = true;

    public errorMessage: string = '';

    constructor(
        protected connectionService: ConnectionService,
        protected datasetService: DatasetService,
        protected filterService: FilterService,
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
        this.outstandingDataQueriesByLayer = [];
        this.initData();
        try {
            this.setupFilters();
        } catch (e) {
            // Fails in unit tests - ignore.
        }

        this.messenger.subscribe(DatasetService.UPDATE_DATA_CHANNEL, this.onUpdateDataChannelEvent.bind(this));
        this.messenger.events({ filtersChanged: this.handleFiltersChangedEvent.bind(this) });
        this.messenger.publish(neonEvents.WIDGET_REGISTER, {
            id: this.id,
            widget: this
        });

        this.subNgOnInit();
        this.initializing = false;
        this.postInit();
    }

    /**
     * Returns the options for the specific visualization.
     *
     * @return {BaseNeonMultiLayerOptions}
     */
    abstract getOptions(): BaseNeonMultiLayerOptions;

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
     * Adds a new layer for the specific visualization using the given config.
     *
     * @arg {any} config
     */
    abstract subAddLayer(config: any);

    /**
     * Do any visualization-specific logic before removing a layer
     * @param {number} layerIndex
     */
    abstract subRemoveLayer(layerIndex: number);

    /**
     * Function to get any bindings needed to re-create the visualization
     * @return {any}
     */
    getBindings(): any {
        return this.getOptions().createBindings();
    }

    /**
     * Adds a new layer for the visualization using the given config.
     *
     * @arg {any} [config={}]
     */
    public addLayer(config: any = {}) {
        this.outstandingDataQueriesByLayer.push({});
        this.subAddLayer(config);
    }

    /**
     * Remove a specific layer
     * @param {number} layerIndex
     */
    removeLayer(layerIndex: number) {
        // Stop if trying to remove a layer that doesn't exist
        if (layerIndex >= this.outstandingDataQueriesByLayer.length) {
            return;
        }

        this.outstandingDataQueriesByLayer.splice(layerIndex, 1);
        this.subRemoveLayer(layerIndex);
    }

    /**
     * Export a single layer
     * @param query
     * @param layerIndex
     * @return {}
     */
    exportOneLayer(query: neon.query.Query, layerIndex: number) {
        let exportName = this.getOptions().title.split(':').join(' ');
        return {
            name: 'Query_Results_Table',
            data: [{
                query: query,
                name: exportName + '-' + this.id,
                fields: this.getOptions().getLayers()[layerIndex].getExportFields().map((exportFieldsObject) => ({
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
     */
    doExport() {
        // TODO this function needs to be changed  to abstract once we get through all the visualizations.
        let queries = this.createAllQueries();
        if (queries) {
            return queries.map((layerQuery, layerIndex) => this.exportOneLayer(layerQuery, layerIndex))
                .filter((exportLayersObject) => !!exportLayersObject);
        }
        console.error('SKIPPING EXPORT FOR ' + this.getOptions().title);
        return null;
    }

    protected enableRedrawAfterResize(enable: boolean) {
        this.redrawAfterResize = enable;
    }

    /**
     * Initializes sub-component styles as needed.
     */
    onResizeStart() {
        // Update info text width.
        let refs = this.getElementRefs();
        if (refs.infoText && refs.visualization) {
            if (refs.visualization.nativeElement.clientWidth > (refs.infoText.nativeElement.clientWidth - this.TOOLBAR_EXTRA_WIDTH)) {
                refs.infoText.nativeElement.style.minWidth = (Math.round(refs.infoText.nativeElement.clientWidth) + 1) + 'px';
            }
        }

    }

    /**
     * Resizes sub-components as needed.
     */
    onResizeStop() {
        // Update header text width.
        let refs = this.getElementRefs();
        if (refs.headerText && refs.infoText && refs.visualization) {
            refs.headerText.nativeElement.style.maxWidth = Math.round(refs.visualization.nativeElement.clientWidth -
                refs.infoText.nativeElement.clientWidth - this.TOOLBAR_EXTRA_WIDTH) + 'px';
        }

        if (this.redrawAfterResize) {
            // This event fires as soon as the user releases the mouse, but NgGrid animates the resize,
            // so the current width and height are not the new width and height.  NgGrid uses a 0.25
            // second transition so wait until that has finished before redrawing.
            setTimeout(() => { this.refreshVisualization(); }, 300);
        }
    }

    /**
     * Returns an object containing the ElementRef objects for the visualization.
     *
     * @return {any} Object containing:  {ElementRef} headerText, {ElementRef} infoText, {ElementRef} visualization
     */
    abstract getElementRefs(): any;

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

    initData() {
        if (!this.injector.get('layers', []).length) {
            this.addLayer();
        }
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
     * @arg {number} layerIndex
     * @arg {boolean} executeQueryChainOnSuccess
     * @arg {object} subclassFilter
     * @arg {neon.query.WherePredicate} wherePredicate
     */
    addNeonFilter(layerIndex: number, executeQueryChainOnSuccess: boolean, subclassFilter: any, wherePredicate: neon.query.WherePredicate) {
        let filterName = {
            visName: this.getOptions().title,
            text: this.getFilterText(subclassFilter)
        };
        let onSuccess = (resp: any) => {
            if (typeof resp === 'string') {
                subclassFilter.id = resp;
            }
            if (executeQueryChainOnSuccess) {
                this.executeQueryChain(layerIndex);
            }
        };
        this.filterService.addFilter(this.messenger,
            this.id,
            this.getOptions().getLayers()[layerIndex].database.name,
            this.getOptions().getLayers()[layerIndex].table.name,
            wherePredicate,
            filterName,
            onSuccess.bind(this),
            () => {
                console.error('filter failed to set');
            });
        this.changeDetection.detectChanges();
    }

    /**
     * Replace a filter and register the change with Neon.
     *
     * @arg {number} layerIndex
     * @arg {boolean} executeQueryChainOnSuccess
     * @arg {object} subclassFilter
     * @arg {neon.query.WherePredicate} wherePredicate
     */
    replaceNeonFilter(layerIndex: number, executeQueryChainOnSuccess: boolean, subclassFilter: any,
        wherePredicate: neon.query.WherePredicate) {

        let filterName = {
            visName: this.getOptions().title,
            text: this.getFilterText(subclassFilter)
        };
        let onSuccess = (resp: any) => {
            if (executeQueryChainOnSuccess) {
                this.executeQueryChain(layerIndex);
            }
        };
        this.filterService.replaceFilter(
            this.messenger,
            subclassFilter.id,
            this.id,
            this.getOptions().getLayers()[layerIndex].database.name,
            this.getOptions().getLayers()[layerIndex].table.name,
            wherePredicate,
            filterName,
            onSuccess.bind(this),
            () => {
                console.error('filter failed to set');
            });
        this.changeDetection.detectChanges();
    }

    /**
     * This is expected to get called whenever a query is expected to be run.
     * This could be startup, user action to change field, relevant filter change
     * from another visualization
     */
    executeAllQueryChain() {
        for (let i = 0; i < this.getOptions().getLayers().length; i++) {
            this.executeQueryChain(i);
        }
    }

    /**
     * Execute the Neon query chain.
     *
     * This is expected to get called whenever a query is expected to be run.
     * This could be startup, user action to change field, relevant filter change
     * from another visualization
     */
    executeQueryChain(layerIndex) {
        let isValidQuery = this.isValidQuery(layerIndex);
        if (!isValidQuery) {
            return;
        }
        this.isLoading++;
        this.changeDetection.detectChanges();
        let query = this.createQuery(layerIndex);

        let filtersToIgnore = this.getFiltersToIgnore();
        if (filtersToIgnore && filtersToIgnore.length > 0) {
            query.ignoreFilters(filtersToIgnore);
        }

        this.executeQuery(layerIndex, query);
    }

    /**
     * Get the list of queries for all layers
     * @return {Array}
     */
    createAllQueries(): neon.query.Query[] {
        let queries = [];
        for (let i = 0; i < this.getOptions().getLayers().length; i++) {
            queries.push(this.createQuery(i));
        }
        return queries;
    }

    /**
     * Check if the current query (Including filters) is valid for a layer
     * @param {number} layerIndex
     */
    abstract isValidQuery(layerIndex: number): void;

    /**
     * Create the query needed to get the data for the visualization for a layer
     * @param {number} layerIndex
     */
    abstract createQuery(layerIndex: number): neon.query.Query;

    /**
     * Called after a successful query for a layer
     * @param {number} layerIndex
     * @param response the quersy response
     */
    abstract onQuerySuccess(layerIndex: number, response: any): void;

    /**
     * Update the visualization
     */
    abstract refreshVisualization(): void;

    /**
     * Generic query success method
     * @param layerIndex
     * @param response
     */
    baseOnQuerySuccess(layerIndex: number, response) {
        //Converts the response to have the pretty names from the labelOptions in config to display
        this.onQuerySuccess(layerIndex, this.prettifyLabels(layerIndex, response));
        this.isLoading--;
        this.changeDetection.detectChanges();
        // Initialize the header styles.
        this.onResizeStart();
    }

    /**
     * Execute a neon query
     * @param {number} layerIndex
     * @param query The query to execute
     */
    executeQuery(layerIndex, query: neon.query.Query) {
        let database = this.getOptions().getLayers()[layerIndex].database.name;
        let table = this.getOptions().getLayers()[layerIndex].table.name;
        let connection = this.connectionService.getActiveConnection();

        if (!connection) {
            return;
        }

        /* tslint:disable:no-string-literal */
        let filter = _.cloneDeep(query['filter']);
        //If we have any labelOptions in the config, we want to edit the data to convert whatever data items that are specified to the
        //"pretty" name. The pretty name goes to the visualizations, but it must be converted back before doing a query as the
        //database won't recognize the pretty name.
        this.datifyWherePredicates(layerIndex, filter.whereClause);
        /* tslint:enable:no-string-literal */

        // Cancel any previous data query currently running.
        if (this.outstandingDataQueriesByLayer[layerIndex] && this.outstandingDataQueriesByLayer[layerIndex][table]) {
            this.outstandingDataQueriesByLayer[layerIndex][table].abort();
        }

        // Execute the data query, calling the function defined in 'done' or 'fail' as
        // needed.
        this.outstandingDataQueriesByLayer[layerIndex][table] = connection.executeQuery(query, null);

        // Visualizations that do not execute data queries will not return a query
        // object.
        if (!this.outstandingDataQueriesByLayer[layerIndex][table]) {
            // TODO do something
            console.error('execute query did not return an object');
        }

        this.outstandingDataQueriesByLayer[layerIndex][table].always(() => {
            this.outstandingDataQueriesByLayer[layerIndex][table] = undefined;
        });

        this.outstandingDataQueriesByLayer[layerIndex][table].done(this.baseOnQuerySuccess.bind(this, layerIndex));

        this.outstandingDataQueriesByLayer[layerIndex][table].fail((response) => {
            if (response.statusText === 'abort') {
                // query was aborted so we don't care.  We assume we aborted it on purpose.
            } else {
                this.isLoading--;
                if (response.status === 0) {
                    console.error('Query failed: ' + response);
                } else {
                    console.error('Query failed: ' + response);
                }
                this.changeDetection.detectChanges();
            }
        });
    }

    /**
     * Called after the filters in the filter service have changed.
     * Defaults to calling setupFilters() then executeAllQueryChain()
     */
    handleFiltersChangedEvent(): void {
        this.setupFilters();
        this.executeAllQueryChain();
    }

    /**
     * Get and configure filters from the filter service.
     * DO NOT EXECUTE QUERIES IN THIS METHOD
     * This method will be called before the visualization has finished init!
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
     * @arg {number} layerIndex
     */
    handleChangeDatabase(layerIndex: number) {
        this.getOptions().getLayers()[layerIndex].updateTables();
        this.removeAllFilters(layerIndex, this.getCloseableFilters(), () => {
            this.setupFilters();
            this.handleChangeDataAtLayerIndex(layerIndex);
        });
    }

    /**
     * Updates fields and filters whenever the table is changed and reruns the visualization query.
     *
     * @arg {number} layerIndex
     */
    handleChangeTable(layerIndex: number) {
        this.getOptions().getLayers()[layerIndex].updateFields();
        this.removeAllFilters(layerIndex, this.getCloseableFilters(), () => {
            this.setupFilters();
            this.handleChangeDataAtLayerIndex(layerIndex);
        });
    }

    /**
     * Updates filters whenever a filter field is changed and reruns the visualization query.
     *
     * @arg {number} layerIndex
     */
    handleChangeFilterField(layerIndex: number) {
        this.removeAllFilters(layerIndex, this.getCloseableFilters(), () => {
            this.setupFilters();
            this.handleChangeDataAtLayerIndex(layerIndex);
        });
    }

    /**
     * Reruns the visualization query.  Override to update properties and/or sub-components.
     */
    handleChangeData() {
        this.logChangeAndStartAllQueryChain();
    }

    /**
     * Reruns the visualization query for the layer at the given index.  Override to update properties and/or sub-components.
     *
     * @arg {number} layerIndex
     */
    handleChangeDataAtLayerIndex(layerIndex: number) {
        this.logChangeAndStartQueryChain(layerIndex);
    }

    /**
     * Updates or redraws sub-components after limit change as needed.
     */
    subHandleChangeLimit() {
        this.logChangeAndStartAllQueryChain();
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
    logChangeAndStartAllQueryChain() {
        if (!this.initializing) {
            this.executeAllQueryChain();
        }
    }

    /**
     * If not initializing, calls executeQueryChain(layerIndex) for a layer
     */
    logChangeAndStartQueryChain(layerIndex: number) {
        if (!this.initializing) {
            this.executeQueryChain(layerIndex);
        }
    }

    /**
     * Called when a filter has been removed
     * @param value the filter name
     */
    abstract removeFilter(filter: any): void;

    /**
     * Remove a filter from neon, and optionally requery and/or refresh
     *
     * @arg {number} layerIndex
     * @arg {object} filter
     * @arg {boolean} requery
     * @arg {boolean} refresh
     * @arg {function} [callback]
     */
    removeLocalFilterFromLocalAndNeon(layerIndex: number, filter: any, requery: boolean, refresh: boolean, callback?: Function) {
        // If we are removing a filter, assume its both local and neon so it should be removed in both
        let database = this.getOptions().getLayers()[layerIndex].database.name;
        let table = this.getOptions().getLayers()[layerIndex].table.name;
        this.filterService.removeFilters(
            this.messenger,
            [filter.id],
            () => {
                this.removeFilter(filter);
                if (requery) {
                    this.executeQueryChain(layerIndex);
                } else {
                    if (refresh) {
                        this.refreshVisualization();
                    }
                }
                this.changeDetection.detectChanges();
            },
            () => {
                console.error('error removing filter');
            });
        this.changeDetection.detectChanges();
    }

    /**
     * Removes all the given filters from this component and neon with an optional callback.
     *
     * @arg {number} layerIndex
     * @arg {array} filters
     * @arg {function} [callback]
     */
    removeAllFilters(layerIndex: number, filters: any[], callback?: Function) {
        if (!filters.length) {
            if (callback) {
                callback();
            }
            return;
        }

        this.removeLocalFilterFromLocalAndNeon(layerIndex, filters[0], false, false, () => {
            this.removeAllFilters(layerIndex, filters.slice(1), callback);
        });
    }

    getButtonText() {
        return '';
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
    private prettifyLabels(layerIndex, response) {
        let labelOptions = this.getLabelOptions(layerIndex);
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
    private datifyWherePredicates(layerIndex, whereClause) {
        let labelOptions = this.getLabelOptions(layerIndex);
        switch (whereClause.type) {
            case 'or':
            case 'and':
                let newFilters = [];
                for (let clause of whereClause.whereClauses) {
                    //recursively edit where clauses that contain multiple whereClauses
                    newFilters.push(this.datifyWherePredicates(layerIndex, clause));
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
    private getLabelOptions(layerIndex) {
        let dataset = this.datasetService.getDataset();
        let databaseName = this.getOptions().getLayers()[layerIndex].database.name;
        let tableName = this.getOptions().getLayers()[layerIndex].table.name;
        let database = _.find(dataset.databases, (db) => db.name === databaseName);
        let table = _.find(database.tables, (t) => t.name === tableName);
        let labelOptions = table.labelOptions;
        return labelOptions;
    }

    protected createEmptyField(): FieldMetaData {
        return new FieldMetaData();
    }
}
