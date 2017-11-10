import {
    OnInit,
    OnDestroy,
    Injector,
    ChangeDetectorRef
} from '@angular/core';
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

/**
 * Base component for all non-layered Neon visualizations.
 * This manages some of the lifecycle and query logic.
 */
export abstract class BaseLayeredNeonComponent implements OnInit,
    OnDestroy {

    public id: string;
    protected queryTitle: string;
    protected messenger: neon.eventing.Messenger;
    protected outstandingDataQueriesByLayer: any[];

    protected initializing: boolean;

    private redrawAfterResize: boolean = false;

    /**
     * Common metadata about the database, and the table and any unshared filter of the layers
     */
    public meta: {
        databases: DatabaseMetaData[],
        layers: {
            database: DatabaseMetaData,
            tables: TableMetaData[],
            table: TableMetaData,
            fields: FieldMetaData[]
            unsharedFilterField: any,
            unsharedFilterValue: string,
            colorField: FieldMetaData
        }[]
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
            databases: [],
            layers: []
        };
        this.isExportable = true;
        this.doExport = this.doExport.bind(this);
        this.getBindings = this.getBindings.bind(this);
        this.id = uuid.v4();

        // Make sure the empty field has non-null values
        this.emptyField.columnName = '';
        this.emptyField.prettyName = '';
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
            console.warn('Error while setting up filters duing init, ignoring');
        }

        this.messenger.subscribe(DatasetService.UPDATE_DATA_CHANNEL, this.onUpdateDataChannelEvent.bind(this));
        this.messenger.events({ filtersChanged: this.handleFiltersChangedEvent.bind(this) });
        this.visualizationService.registerBindings(this.id, this);


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
     * Get an option from the visualization's config
     * @param option the option
     * @return {any} the option's value
     */
    abstract getOptionFromConfig(option: string): any;

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
            title: this.createTitle(),
            databases: [],
            layers: []
        };
        for (let database of this.meta.databases) {
            bindings.databases.push(database.name);
        }
        for (let layer of this.meta.layers) {
            let layerBindings = {
                database: layer.database.name,
                tables: [],
                table: layer.table.name,
                fields: [],
                unsharedFilterField: layer.unsharedFilterField.columnName,
                unsharedFilterValue: layer.unsharedFilterValue,
                colorField: layer.colorField.columnName
            };
            for (let field of layer.fields) {
                layerBindings.fields.push(field.columnName);
            }
            for (let table of layer.tables) {
                layerBindings.tables.push(table.name);
            }
            bindings.layers.push(layerBindings);
        }

        // Get the bindings from the subclass
        this.subGetBindings(bindings);

        return bindings;
    }

    /**
     * Add a new empty layer
     */
    addEmptyLayer() {
        let layer = {
            database: new DatabaseMetaData(),
            tables: [],
            table: new TableMetaData(),
            unsharedFilterField: {},
            unsharedFilterValue: '',
            fields: [],
            colorField: new FieldMetaData()
        };
        this.outstandingDataQueriesByLayer.push({});
        this.subAddEmptyLayer();
        this.meta.layers.push(layer);
        this.initDatabases(this.meta.layers.length - 1);
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
        let exportName = this.queryTitle;
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
                query: field['columnName'],
                pretty: field['prettyName'] || field['columnName']
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
            return queries.map(mapFunction).filter(fo => fo);
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

    onResizeStop() {
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
        this.subNgOnDestroy();
    }

    initData() {
        this.addEmptyLayer();
    }

    /**
     * Initialize the database metadata for a layer
     * @param layerIndex
     */
    initDatabases(layerIndex) {
        this.meta.databases = this.datasetService.getDatabases();
        this.meta.layers[layerIndex].database = this.meta.databases[0];

        if (this.meta.databases.length > 0) {
            if (this.getOptionFromConfig('database')) {
                for (let database of this.meta.databases) {
                    if (this.getOptionFromConfig('database') === database.name) {
                        this.meta.layers[layerIndex].database = database;
                        break;
                    }
                }
            }

            this.initTables(layerIndex);
        }
    }

    /**
     * Initialize the table metadata for a layer
     * @param layerIndex
     */
    initTables(layerIndex) {
        this.meta.layers[layerIndex].tables = this.datasetService.getTables(this.meta.layers[layerIndex].database['name']);
        this.meta.layers[layerIndex].table = this.meta.layers[layerIndex].tables[0];

        if (this.meta.layers[layerIndex].tables.length > 0) {
            if (this.getOptionFromConfig('table')) {
                for (let table of this.meta.layers[layerIndex].tables) {
                    if (this.getOptionFromConfig('table') === table.name) {
                        this.meta.layers[layerIndex].table = table;
                        break;
                    }
                }
            }
            this.initFields(layerIndex);
        }
    }

    /**
     * Initialize the field metadata for a layer
     * @param layerIndex
     */
    initFields(layerIndex) {
        // Sort the fields that are displayed in the dropdowns in the options menus
        // alphabetically.
        let fields = this.datasetService
            .getSortedFields(this.meta.layers[layerIndex].database['name'], this.meta.layers[layerIndex].table['name']);
        this.meta.layers[layerIndex].fields = fields.filter(function(f) {
            return (f && f.type);
        });
        this.meta.layers[layerIndex].unsharedFilterField = this.findFieldObject(layerIndex, 'unsharedFilterField');
        this.meta.layers[layerIndex].unsharedFilterValue = this.getOptionFromConfig('unsharedFilterValue') || '';
        this.meta.layers[layerIndex].colorField = this.getOptionFromConfig('colorField') || new FieldMetaData();

        this.onUpdateFields(layerIndex);
    }

    /**
     * Called when any field metadata changes.
     * This will be called once before initialization is complete
     */
    abstract onUpdateFields(layerIndex);

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
     * Creates and returns the Neon where clause for a Neon filter on the given database, table, and
     * fields using the filters set in this visualization.
     * Called by the Filter Service.
     * @param databaseAndTableName
     * @param fieldName
     */
    abstract createNeonFilterClauseEquals(database: string, table: string, fieldName: string | string[]);

    /**
     * Returns the list of field objects on which filters are set for the layer.
     */
    abstract getNeonFilterFields(layerIndex: number): string[];

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
     * @param layerIndex
     * @param {boolean} executeQueryChainOnSuccess
     * @param filter
     */
    addNeonFilter(layerIndex: number, executeQueryChainOnSuccess: boolean, filter: any) {
        let filterName = {
            visName: this.getVisualizationName(),
            text: this.getFilterText(filter)
        };
        let onSuccess = (resp: any) => {
            if (typeof resp === 'string') {
                filter.id = resp;
            }
            if (executeQueryChainOnSuccess) {
                this.executeQueryChain(layerIndex);
            }
        };
        this.filterService.addFilter(this.messenger,
            this.id,
            this.meta.layers[layerIndex].database.name,
            this.meta.layers[layerIndex].table.name,
            this.createNeonFilterClauseEquals(
                this.meta.layers[layerIndex].database.name,
                this.meta.layers[layerIndex].table.name,
                this.getNeonFilterFields(layerIndex)),
            filterName,
            onSuccess.bind(this),
            () => {
                console.error('filter failed to set');
            });
        this.changeDetection.detectChanges();
    }

    /**
     * Replace a filter and register the change with Neon.
     * @param layerIndex
     * @param {boolean} executeQueryChainOnSuccess
     * @param filter
     */
    replaceNeonFilter(layerIndex: number, executeQueryChainOnSuccess: boolean, filter: any) {
        let filterName = {
            visName: this.getVisualizationName(),
            text: this.getFilterText(filter)
        };
        let onSuccess = (resp: any) => {
            if (executeQueryChainOnSuccess) {
                this.executeQueryChain(layerIndex);
            }
        };
        this.filterService.replaceFilter(
            this.messenger,
            filter.id,
            this.id,
            this.meta.layers[layerIndex].database.name,
            this.meta.layers[layerIndex].table.name,
            this.createNeonFilterClauseEquals(
                this.meta.layers[layerIndex].database.name,
                this.meta.layers[layerIndex].table.name,
                this.getNeonFilterFields(layerIndex)),
            filterName,
            onSuccess.bind(this),
            () => {
                console.error('filter failed to set');
            });
        this.changeDetection.detectChanges();
    }

    /**
     * Create a title for a query
     * @param {boolean} resetQueryTitle
     * @return {string}
     */
    createTitle(resetQueryTitle?: boolean): string {
        if (resetQueryTitle) {
            this.queryTitle = '';
        }
        if (this.queryTitle) {
            return this.queryTitle;
        }
        let optionTitle = this.getOptionFromConfig('title');
        if (optionTitle) {
            return optionTitle;
        }
        if (this.meta.layers.length === 1) {
            return this.createLayerTitle(1, resetQueryTitle);
        } else {
            return 'Multiple Layers - ' + this.getVisualizationName();
        }
    }

    /**
     * Create a title for a layer
     * @param {number} layerIndex
     * @param {boolean} resetQueryTitle
     * @return {string}
     */
    createLayerTitle(layerIndex: number, resetQueryTitle?: boolean): string {
        if (resetQueryTitle) {
            this.queryTitle = '';
        }
        if (this.queryTitle) {
            return this.queryTitle;
        }
        let optionTitle = this.getOptionFromConfig('title');
        if (optionTitle) {
            return optionTitle;
        }
        let title = this.meta.layers[layerIndex].unsharedFilterValue
            ? this.meta.layers[layerIndex].unsharedFilterValue + ' '
            : '';
        if (_.keys(this.meta).length) {
            return title + (this.meta.layers[layerIndex].table && this.meta.layers[layerIndex].table.name
                ? this.meta.layers[layerIndex].table.prettyName
                : '');
        }
        return title;
    }

    /**
    This is expected to get called whenever a query is expected to be run.
    This could be startup, user action to change field, relevant filter change
    from another visualization
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
        this.queryTitle = this.createLayerTitle(layerIndex, false);
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
    findFieldObject(layerIndex: number, bindingKey: string, mappingKey?: string): FieldMetaData {
        let find = (name: string) => {
            return _.find(this.meta.layers[layerIndex].fields, function(field) {
                return field['columnName'] === name;
            });
        };

        let fieldObject;
        if (bindingKey) {
            fieldObject = find(this.getOptionFromConfig(bindingKey));
        }

        if (!fieldObject && mappingKey) {
            fieldObject = find(this.getMapping(layerIndex, mappingKey));
        }

        return fieldObject || this.datasetService.createBlankField();
    }

    /**
     * Get a blank FieldMetaData object
     */
    getBlankField(): FieldMetaData {
        return this.datasetService.createBlankField();
    }

    getMapping(layerIndex, key: string): string {
        return this.datasetService.getMapping(this.meta.layers[layerIndex].database.name, this.meta.layers[layerIndex].table.name, key);
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
     * Handles updates that come through the data channel
     * @param event
     */
    onUpdateDataChannelEvent(event) {
        // TODO
    }

    /**
     * Handles changes in the active database
     */
    handleChangeDatabase(layerIndex) {
        this.initTables(layerIndex);
        this.logChangeAndStartQueryChain(layerIndex); // ('database', this.active.database.name);
    }

    /**
     * Handles changes in the active table
     */
    handleChangeTable(layerIndex) {
        this.initFields(layerIndex);
        this.logChangeAndStartQueryChain(layerIndex); // ('table', this.active.table.name);
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
    logChangeAndStartQueryChain(layerIndex: number) { // (option: string, value: any, type?: string) {
        if (!this.initializing) {
            this.executeQueryChain(layerIndex);
        }
    }

    /**
     * Called when a filter has been removed
     * @param value the filter name
     */
    abstract removeFilter(value: string): void;

    /**
     * Remove a filter from neon, and optionally requery and/or refresh
     * @param layerIndex
     * @param name the filter name
     * @param shouldRequery
     * @param shouldRefresh
     */
    removeLocalFilterFromLocalAndNeon(layerIndex: number, filter: any, shouldRequery: boolean, shouldRefresh: boolean) {
        // If we are removing a filter, assume its both local and neon so it should be removed in both
        let database = this.meta.layers[layerIndex].database.name;
        let table = this.meta.layers[layerIndex].table.name;
        let fields = this.getNeonFilterFields(layerIndex);
        this.filterService.removeFilter(
            this.messenger,
            filter.id,
            () => {
                this.removeFilter(filter);
                if (shouldRequery) {
                    this.executeQueryChain(layerIndex);
                } else {
                    if (shouldRefresh) {
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

    getButtonText() {
        return '';
    }
}
