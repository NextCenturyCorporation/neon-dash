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
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';
import { ThemesService } from '../../services/themes.service';
import { FieldMetaData, TableMetaData, DatabaseMetaData } from '../../dataset';
import * as neon from 'neon-framework';
import * as _ from 'lodash';
import { VisualizationService } from '../../services/visualization.service';
import * as uuid from 'node-uuid';
import { Color } from '../../services/color-scheme.service';

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

    protected initializing: boolean;

    private redrawAfterResize: boolean = false;

    /**
     * Common metadata about the database, and the table and any unshared filter of the layers
     */
    public meta: {
        errorMessage: string,
        title: string,
        limit: number,
        newLimit: number,
        layers: {
            index: number,
            title: string,
            databases: DatabaseMetaData[],
            database: DatabaseMetaData,
            tables: TableMetaData[],
            table: TableMetaData,
            fields: FieldMetaData[]
            unsharedFilterField: any,
            unsharedFilterValue: string,
            docCount: number
        }[],
        errorMessage?: string
    };

    public exportId: number;

    public isLoading: number;
    public isExportable: boolean;

    /**
     * Just a blank FieldMetaData object.
     * Meant to be used for a 'clear' option in field dropdowns
     */
    public emptyField = new FieldMetaData();

    constructor(
        private activeGridService: ActiveGridService,
        private connectionService: ConnectionService,
        private datasetService: DatasetService,
        protected filterService: FilterService,
        private exportService: ExportService,
        protected injector: Injector,
        public themesService: ThemesService,
        public changeDetection: ChangeDetectorRef,
        protected visualizationService: VisualizationService) {
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
        this.isLoading = 0;

        this.meta = {
            errorMessage: '',
            title: '',
            limit: 0,
            newLimit: 0,
            layers: []
        };

        this.isExportable = true;
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

        this.meta.title = this.injector.get('title', this.getVisualizationName());
        this.meta.limit = this.injector.get('limit', this.getDefaultLimit());
        this.meta.newLimit = this.meta.limit;
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
     * Get the list of fields to export for the layer index
     * @return {[]} List of {columnName, prettyName} values of the fields
     */
    abstract getExportFields(layerIndex: number): {columnName: string, prettyName: string}[];

    /**
     * Do any visualization-specific logic after a new empty layer has been added
     */
    abstract subAddEmptyLayer();

    /**
     * Do any visualization-specific logic before removing a layer
     * @param {number} index
     */
    abstract subRemoveLayer(index: number);

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
            title: this.meta.title,
            limit: this.meta.limit,
            layers: []
        };
        for (let layer of this.meta.layers) {
            let layerBindings = {
                title: layer.title,
                databases: [],
                database: layer.database.name,
                tables: [],
                table: layer.table.name,
                fields: [],
                unsharedFilterField: layer.unsharedFilterField.columnName,
                unsharedFilterValue: layer.unsharedFilterValue,
                docCount: 0
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
     * Add a new empty layer
     *
     * @arg {object} layerOptions
     */
    addEmptyLayer(layerOptions?: any) {
        let index = this.meta.layers.length;
        let layer = {
            index: index,
            title: (layerOptions ? layerOptions.title : '') || this.meta.title || 'New Layer',
            databases: [],
            database: new DatabaseMetaData(),
            tables: [],
            table: new TableMetaData(),
            unsharedFilterField: new FieldMetaData(),
            unsharedFilterValue: '',
            fields: [],
            docCount: 0
        };
        this.outstandingDataQueriesByLayer.push({});
        this.subAddEmptyLayer();
        this.meta.layers.push(layer);
        this.initDatabases(layer, layerOptions);
    }

    /**
     * Remove a specific layer
     * @param {number} index
     */
    removeLayer(index: number) {
        // Stop if trying to remove a layer that doesn't exist
        if (index >= this.outstandingDataQueriesByLayer.length) {
            return;
        }

        this.outstandingDataQueriesByLayer.splice(index, 1);
        this.meta.layers.splice(index, 1);

        this.subRemoveLayer(index);
    }

    /**
     * Export a single layer
     * @param query
     * @param layerIndex
     * @return {}
     */
    exportOneLayer(query: neon.query.Query, layerIndex: number) {
        let exportName = this.meta.title;
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
            this.addEmptyLayer();
        }
    }

    /**
     * Load all the database metadata, then call initTables()
     *
     * @arg {object} metaObject
     * @arg {object} layerOptions
     */
    initDatabases(metaObject: any, layerOptions?: any) {
        metaObject.databases = this.datasetService.getDatabases();
        metaObject.database = metaObject.databases[0] || new DatabaseMetaData();

        if (metaObject.databases.length > 0) {
            let injectedDatabase = layerOptions ? layerOptions.database : undefined;
            if (injectedDatabase) {
                for (let database of metaObject.databases) {
                    if (injectedDatabase === database.name) {
                        metaObject.database = database;
                        break;
                    }
                }
            }

            this.initTables(metaObject, layerOptions);
        }
    }

    /**
     * Load all the table metadata, then call initFields()
     *
     * @arg {object} metaObject
     * @arg {object} layerOptions
     */
    initTables(metaObject: any, layerOptions?: any) {
        metaObject.tables = this.datasetService.getTables(metaObject.database.name);
        metaObject.table = metaObject.tables[0] || new TableMetaData();

        if (metaObject.tables.length > 0) {
            let injectedTable = layerOptions ? layerOptions.table : undefined;
            if (injectedTable) {
                for (let table of metaObject.tables) {
                    if (injectedTable === table.name) {
                        metaObject.table = table;
                        break;
                    }
                }
            }
            this.initFields(metaObject, layerOptions);
        }
    }

    /**
     * Initialize all the field metadata
     *
     * @arg {object} metaObject
     * @arg {object} layerOptions
     */
    initFields(metaObject: any, layerOptions?: any) {
        // Sort the fields that are displayed in the dropdowns in the options menus alphabetically.
        metaObject.fields = this.datasetService.getSortedFields(metaObject.database.name, metaObject.table.name, true).filter((field) => {
            return (field && field.columnName);
        });
        metaObject.unsharedFilterField = new FieldMetaData();
        metaObject.unsharedFilterValue = '';

        this.onUpdateFields(metaObject, layerOptions);
    }

    /**
     * Called when any field metadata changes.
     * This will be called once before initialization is complete
     *
     * @arg {object} metaObject
     * @arg {object} layerOptions
     */
    abstract onUpdateFields(metaObject: any, layerOptions?: any);

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
            this.meta.layers[layerIndex].database.name,
            this.meta.layers[layerIndex].table.name,
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
            this.meta.layers[layerIndex].database.name,
            this.meta.layers[layerIndex].table.name,
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
        for (let i = 0; i < this.meta.layers.length; i++) {
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
        for (let i = 0; i < this.meta.layers.length; i++) {
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
        let database = this.meta.layers[layerIndex].database.name;
        let table = this.meta.layers[layerIndex].table.name;
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
     * Get field object from the key into the config options
     */
    findFieldObject(metaObject: any, layerOptions: any, bindingKey: string, mappingKey?: string): FieldMetaData {
        let find = (name: string): FieldMetaData => {
            return !name ? undefined : _.find(metaObject.fields, (field: FieldMetaData) => {
                return field.columnName === name;
            });
        };

        let fieldObject: FieldMetaData = layerOptions && bindingKey ? find(layerOptions[bindingKey] || '') : undefined;

        if (!fieldObject && mappingKey) {
            fieldObject = find(this.getMapping(metaObject, mappingKey));
        }

        return fieldObject || new FieldMetaData();
    }

    getMapping(metaObject: any, key: string): string {
        return this.datasetService.getMapping(metaObject.database.name, metaObject.table.name, key);
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
        this.initTables(this.meta.layers[layerIndex]);
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
        this.initFields(this.meta.layers[layerIndex]);
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
        if (this.isNumber(this.meta.newLimit)) {
            let newLimit = parseFloat('' + this.meta.newLimit);
            if (newLimit > 0) {
                this.meta.limit = newLimit;
                this.subHandleChangeLimit();
            } else {
                this.meta.newLimit = this.meta.limit;
            }
        } else {
            this.meta.newLimit = this.meta.limit;
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
     * If not initializing, calls executeQueryChain(index) for a layer
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
        let database = this.meta.layers[layerIndex].database.name;
        let table = this.meta.layers[layerIndex].table.name;
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
     * Returns the default limit for the visualization.
     *
     * @return {number}
     */
    getDefaultLimit(): number {
        return 10;
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
