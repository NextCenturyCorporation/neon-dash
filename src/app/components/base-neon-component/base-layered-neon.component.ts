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
import { DatasetService } from '../../services/dataset.service';
import { ExportService } from '../../services/export.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { VisualizationService } from '../../services/visualization.service';

import { EMPTY_FIELD, FieldMetaData, TableMetaData, DatabaseMetaData } from '../../dataset';
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
    constructor(protected config: any, protected datasetService: DatasetService) {
        this.title = config.title || 'New Layer';
        this.initDatabases();
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
        return this.getFieldObject((this.config[bindingKey] || []), mappingKey);
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
        return (Array.isArray(bindings) ? bindings : []).map((columnName) => this.getFieldObject(columnName, mappingKey));
    }

    /**
     * Returns the field object for the given name or the given mapping key.
     *
     * @arg {string} columnName
     * @arg {string} [mappingKey]
     * @return {FieldMetaData}
     * @private
     */
    private getFieldObject(columnName: string, mappingKey?: string): FieldMetaData {
        let field = columnName ? this.findField(columnName) : undefined;

        if (!field && mappingKey) {
            field = this.findField(this.datasetService.getMapping(this.database.name, this.table.name, mappingKey));
        }

        return field || EMPTY_FIELD;
    }

    /**
     * Initializes all the database options, then calls initTables().
     */
    public initDatabases() {
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

        this.initTables();
    }

    /**
     * Initializes all the field options, then calls onInitFields().
     */
    public initFields() {
        if (this.database && this.table) {
            // Sort the fields that are displayed in the dropdowns in the options menus alphabetically.
            this.fields = this.datasetService.getSortedFields(this.database.name, this.table.name, true).filter((field) => {
                return (field && field.columnName);
            });
        }

        this.unsharedFilterField = new FieldMetaData();
        this.unsharedFilterValue = '';

        this.onInitFields();
    }

    /**
     * Initializes all the table options, then calls initFields().
     */
    public initTables() {
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

        this.initFields();
    }

    /**
     * Initializes all the non-field options for the specific layer.
     *
     * @abstract
     */
    public abstract onInit(): void;

    /**
     * Initializes all the field options for the specific layer.
     *
     * @abstract
     */
    public abstract onInitFields(): void;
}

/**
 * Manages configurable options for all visualizations.
 */
export abstract class BaseNeonMultiLayerOptions {
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
     * @arg {string} visualizationTitle
     * @arg {number} [defaultLimit=10]
     */
    constructor(protected injector: Injector, visualizationTitle: string, defaultLimit: number = 10) {
        this.filter = injector.get('configFilter', null);
        this.limit = injector.get('limit', defaultLimit);
        this.newLimit = this.limit;
        this.title = injector.get('title', visualizationTitle);
        this.onInit();
    }

    /**
     * Returns the layers for the options.
     *
     * @abstract
     * @return {BaseNeonLayer[]}
     */
    public abstract getLayers(): BaseNeonLayer[];

    /**
     * Initializes all the options for the specific visualization.
     *
     * @abstract
     */
    public abstract onInit(): void;
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

    public exportId: number;

    public isLoading: number = 0;
    public isExportable: boolean = true;

    public emptyField = EMPTY_FIELD;

    public errorMessage: string = '';

    constructor(
        protected activeGridService: ActiveGridService,
        protected connectionService: ConnectionService,
        protected datasetService: DatasetService,
        protected filterService: FilterService,
        protected exportService: ExportService,
        protected injector: Injector,
        protected themesService: ThemesService,
        public changeDetection: ChangeDetectorRef,
        protected visualizationService: VisualizationService
    ) {
        // These assignments just eliminated unused warnings that occur even though the arguments are
        // automatically assigned to instance variables.
        this.exportService = this.exportService;
        this.filterService = this.filterService;
        this.connectionService = this.connectionService;
        this.injector = this.injector;
        this.visualizationService = this.visualizationService;
        this.themesService = themesService;
        this.changeDetection = changeDetection;
        this.messenger = new neon.eventing.Messenger();
        this.doExport = this.doExport.bind(this);
        this.getBindings = this.getBindings.bind(this);
        this.id = uuid.v4();
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
        this.outstandingDataQueriesByLayer = [];
        this.initData();
        try {
            this.setupFilters();
        } catch (e) {
            // Fails in unit tests - ignore.
        }

        this.messenger.subscribe(DatasetService.UPDATE_DATA_CHANNEL, this.onUpdateDataChannelEvent.bind(this));
        this.messenger.events({ filtersChanged: this.handleFiltersChangedEvent.bind(this) });
        this.visualizationService.registerBindings(this.id, this);
        this.activeGridService.register(this.id, this);

        this.subNgOnInit();
        this.exportId = (this.isExportable ? this.exportService.register(this.doExport) : null);
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
     * Get the list of fields to export for the layer index
     * @return {[]} List of {columnName, prettyName} values of the fields
     */
    abstract getExportFields(layerIndex: number): {columnName: string, prettyName: string}[];

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
     * Add any fields needed to restore the state to the bindings parameter
     * Note that the base class handles the title and basic layer metadata
     * @param bindings
     */
    abstract subGetBindings(bindings: any);

    /**
     * Function to get any bindings needed to re-create the visualization
     * @return {any}
     */
    getBindings(): any {
        let bindings = {
            title: this.getOptions().title,
            limit: this.getOptions().limit,
            layers: []
        };
        for (let layer of this.getOptions().getLayers()) {
            let layerBindings = {
                databases: [],
                database: layer.database.name,
                fields: [],
                tables: [],
                table: layer.table.name,
                title: layer.title,
                unsharedFilterField: layer.unsharedFilterField.columnName,
                unsharedFilterValue: layer.unsharedFilterValue
            };
            for (let field of layer.fields) {
                layerBindings.fields.push(field.columnName);
            }
            for (let table of layer.tables) {
                layerBindings.tables.push(table.name);
            }
            for (let database of layer.databases) {
                layerBindings.databases.push(database.name);
            }
            bindings.layers.push(layerBindings);
        }

        // Get the bindings from the subclass
        this.subGetBindings(bindings);

        return bindings;
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
        let exportName = this.getOptions().title;
        if (exportName) {
            // replaceAll
            exportName = exportName.split(':').join(' ');
        }
        let finalObject = {
            name: 'Query_Results_Table',
            data: [{
                query: query,
                name: exportName + '-' + this.exportId,
                fields: [],
                ignoreFilters: query.ignoreFilters,
                selectionOnly: query.selectionOnly,
                ignoredFilterIds: [],
                type: 'query'
            }]
        };
        let fields = this.getExportFields(layerIndex);
        for (let field of fields) {
            finalObject.data[0].fields.push({
                query: field.columnName,
                pretty: field.prettyName || field.columnName
            });
        }

        return finalObject;
    }

    /**
     * Get a query ready to give to the ExportService.
     */
    export() {
        // TODO this function needs to be changed  to abstract once we get through all the visualizations.
        let queries = this.createAllQueries();
        let mapFunction = this.exportOneLayer.bind(this);
        if (queries) {
            return queries.map(mapFunction).filter((fo) => fo);
        } else {
            console.error('SKIPPING EXPORT FOR ' + this.getVisualizationName());
            return null;
        }
    }

    doExport() {
        return this.export();
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
        this.exportService.unregister(this.exportId);
        this.visualizationService.unregister(this.id);
        this.activeGridService.unregister(this.id);
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
     * Get the name of the visualization
     */
    abstract getVisualizationName(): string;

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
            visName: this.getVisualizationName(),
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
            visName: this.getVisualizationName(),
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
        this.onQuerySuccess(layerIndex, response);
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
        this.getOptions().getLayers()[layerIndex].initTables();
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
        this.getOptions().getLayers()[layerIndex].initFields();
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
        this.filterService.removeFilter(
            this.messenger,
            filter.id,
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

    getPrimaryThemeColor() {
        let elems = document.getElementsByClassName('coloraccessor'),
            style: string;
        if (!elems.length) {
            style = 'rgb(255, 255, 255)';
        } else {
            style = window.getComputedStyle(elems[0], null).getPropertyValue('color');
        }
        return style && Color.fromRgbString(style);
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
}
