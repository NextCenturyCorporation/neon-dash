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
export abstract class BaseNeonComponent implements OnInit,
    OnDestroy {

    public id: string;
    protected queryTitle: string;
    protected messenger: neon.eventing.Messenger;
    protected outstandingDataQuery: any;

    protected initializing: boolean;

    private redrawAfterResize: boolean = false;

    /**
     * Common metadata about the database, table, and any unshared filters
     */
    public meta: {
        databases: DatabaseMetaData[],
        database: DatabaseMetaData,
        tables: TableMetaData[],
        table: TableMetaData,
        unsharedFilterField: any,
        unsharedFilterValue: string,
        colorField: FieldMetaData,
        fields: FieldMetaData[]
    };

    public exportId: number;

    public isLoading: boolean;
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
        //These assignments just eliminated unused warnings that occur even though the arguments are
        //automatically assigned to instance variables.
        this.exportService = this.exportService;
        this.filterService = this.filterService;
        this.connectionService = this.connectionService;
        this.injector = this.injector;
        this.visualizationService = this.visualizationService;
        this.themesService = themesService;
        this.changeDetection = changeDetection;
        this.messenger = new neon.eventing.Messenger();
        this.isLoading = false;
        this.meta = {
            databases: [],
            database: new DatabaseMetaData(),
            tables: [],
            table: new TableMetaData(),
            unsharedFilterField: {},
            unsharedFilterValue: '',
            colorField: new FieldMetaData(),
            fields: []
        };
        this.isExportable = true;
        this.doExport = this.doExport.bind(this);
        this.getBindings = this.getBindings.bind(this);
        // Let the ID be a UUID
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
        this.messenger.subscribe(DatasetService.UPDATE_DATA_CHANNEL, this.onUpdateDataChannelEvent.bind(this));
        this.messenger.events({ filtersChanged: this.handleFiltersChangedEvent.bind(this) });
        this.visualizationService.registerBindings(this.id, this);

        this.outstandingDataQuery = {};
        for (let database of this.datasetService.getDatabases()) {
            this.outstandingDataQuery[database.name] = {};
        }
        this.initDatabases();
        try {
            this.setupFilters();
        } catch (e) {
            console.warn('Error while setting up filters duing init, ignoring');
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
     * Get an option from the visualization's config
     * @param option the option
     * @return {any} the option's value
     */
    abstract getOptionFromConfig(option: string): any;

    /**
     * Get the list of fields to export
     * @return {[]} List of {columnName, prettyName} values of the fields
     */
    abstract getExportFields(): {columnName: string, prettyName: string}[];

    /**
     * Add any fields needed to restore the state to the bindings parameter.
     * Note that title, database, table, and unshared filter are all handled by the base class
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
            database: this.meta.database.name,
            table: this.meta.table.name,
            unsharedFilterField: this.meta.unsharedFilterField.columnName,
            unsharedFilterValue: this.meta.unsharedFilterValue,
            colorField: this.meta.colorField.columnName
        };

        // Get the bindings from the subclass
        this.subGetBindings(bindings);

        return bindings;
    }

    /**
     * Get a query ready to give to the ExportService.
     */
    export(): any {
        //TODO this function needs to be changed  to abstract once we get through all the visualizations.

        let query = this.createQuery();
        if (query) {
            //console.log('EXPORT NOT IMPLEMENTED IN '+ this.getVisualizationName());
            let exportName = this.queryTitle;
            if (exportName) {
                //replaceAll
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
                    ignoredFilterIds: [], //query.ignoredFilterIds,
                    type: 'query'
                }]
            };
            let fields = this.getExportFields();
            for (let field of fields) {
                finalObject.data[0].fields.push({
                    query: field['columnName'],
                    pretty: field['prettyName'] || field['columnName']
                });
            }

            return finalObject;
        } else {
            console.log('SKIPPING EXPORT FOR ' + this.getVisualizationName());
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
        /* $scope.element.off('resize', resize);
        $scope.element.find('.headers-container').off('resize', resizeDisplay);
        $scope.element.find('.options-menu-button').off('resize', resizeTitle);
        $scope.messenger.unsubscribeAll();

        if($scope.functions.isFilterSet()) {
            $scope.functions.removeNeonFilter({
                fromSystem: true
            });
        }

        exportService.unregister($scope.exportId);
        linksPopupService.deleteLinks($scope.visualizationId);
        $scope.getDataLayers().forEach(function(layer) {
            linksPopupService.deleteLinks(createLayerLinksSource(layer));
        });
        themeService.unregisterListener($scope.visualizationId);
        visualizationService.unregister($scope.stateId);

        resizeListeners.forEach(function(element) {
            $scope.element.find(element).off('resize', resize);
        }); */
        this.subNgOnDestroy();
    }

    /**
     * Load all the database metadata, then call initTables()
     */
    initDatabases() {
        this.meta.databases = this.datasetService.getDatabases();
        this.meta.database = this.meta.databases[0];

        if (this.meta.databases.length > 0) {
            if (this.getOptionFromConfig('database')) {
                for (let database of this.meta.databases) {
                    if (this.getOptionFromConfig('database') === database.name) {
                        this.meta.database = database;
                        break;
                    }
                }
            }

            this.initTables();
        }
    }

    /**
     * Load all the table metadata, then call initFields()
     */
    initTables() {
        this.meta.tables = this.datasetService.getTables(this.meta.database['name']);
        this.meta.table = this.meta.tables[0];

        if (this.meta.tables.length > 0) {
            if (this.getOptionFromConfig('table')) {
                for (let table of this.meta.tables) {
                    if (this.getOptionFromConfig('table') === table.name) {
                        this.meta.table = table;
                        break;
                    }
                }
            }
            this.initFields();
        }
    }

    /**
     * Initialize all the field metadata
     */
    initFields() {
        // Sort the fields that are displayed in the dropdowns in the options menus alphabetically.
        this.meta.fields = this.datasetService.getSortedFields(this.meta.database.name, this.meta.table.name).filter(function(field) {
            return (field && field.columnName);
        });
        this.meta.unsharedFilterField = this.findFieldObject('unsharedFilterField');
        this.meta.unsharedFilterValue = this.getOptionFromConfig('unsharedFilterValue') || '';

        this.onUpdateFields();
        //this.changeDetection.detectChanges();
    }

    /**
     * Called when any field metadata changes.
     * This will be called once before initialization is complete
     */
    abstract onUpdateFields();

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
     * Returns the list of field objects on which filters are set.
     */
    abstract getNeonFilterFields(): string[];

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
     * @param {boolean} executeQueryChainOnSuccess
     * @param filter
     */
    addNeonFilter(executeQueryChainOnSuccess: boolean, filter: any) {
        let filterName = {
            visName: this.getVisualizationName(),
            text: this.getFilterText(filter)
        };
        let onSuccess = (resp: any) => {
            if (typeof resp === 'string') {
                filter.id = resp;
            }
            if (executeQueryChainOnSuccess) {
                this.executeQueryChain();
            }
        };
        let filterFields = this.getNeonFilterFields();
        this.filterService.addFilter(this.messenger,
            this.id,
            this.meta.database.name,
            this.meta.table.name,
            this.createNeonFilterClauseEquals(
                this.meta.database.name,
                this.meta.table.name,
                (filterFields.length === 1) ? filterFields[0] : filterFields),
            filterName,
            onSuccess.bind(this),
            () => {
                console.log('filter failed to set');
            });
        this.changeDetection.detectChanges();
    }

    /**
     * Replace a filter and register the change with Neon.
     * @param {boolean} executeQueryChainOnSuccess
     * @param filter
     */
    replaceNeonFilter(executeQueryChainOnSuccess: boolean, filter: any) {
        let filterName = {
            visName: this.getVisualizationName(),
            text: this.getFilterText(filter)
        };
        let onSuccess = (resp: any) => {
            if (executeQueryChainOnSuccess) {
                this.executeQueryChain();
            }
        };
        let filterFields = this.getNeonFilterFields();
        this.filterService.replaceFilter(this.messenger,
            filter.id,
            this.id,
            this.meta.database.name,
            this.meta.table.name,
            this.createNeonFilterClauseEquals(
                this.meta.database.name,
                this.meta.table.name,
                (filterFields.length === 1) ? filterFields[0] : filterFields),
            filterName,
            onSuccess.bind(this),
            () => {
                console.log('filter failed to set');
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
        let title = this.meta.unsharedFilterValue
            ? this.meta.unsharedFilterValue + ' '
            : '';
        if (_.keys(this.meta).length) {
            return title + (this.meta.table && this.meta.table.name
                ? this.meta.table.prettyName
                : '');
        }
        return title;
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
        this.queryTitle = this.createTitle(false);
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
        this.onQuerySuccess(response);
        this.isLoading = false;
        this.changeDetection.detectChanges();
    }

    /**
     * Execute a neon query
     * @param query The query to execute
     */
    executeQuery(query: neon.query.Query) {
        let me = this;
        let database = this.meta.database.name;
        let table = this.meta.table.name;
        let connection = this.connectionService.getActiveConnection();

        if (!connection) {
            return;
        }
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
            console.log('execute query did not return an object');
        }

        this.outstandingDataQuery[database][table].always(function() {
            me.outstandingDataQuery[database][table] = undefined;
        });

        this.outstandingDataQuery[database][table].done(this.baseOnQuerySuccess.bind(this));

        this.outstandingDataQuery[database][table].fail(function(response) {
            if ( response.statusText === 'abort') {
                //query was aborted so we don't care.  We assume we aborted it on purpose.
            } else {
                this.isLoading = false;
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
    findFieldObject(bindingKey: string, mappingKey?: string): FieldMetaData {
        let me = this;
        let find = function(name) {
            return _.find(me.meta.fields, function(field) {
                return field['columnName'] === name;
            });
        };

        let fieldObject;
        if (bindingKey) {
            fieldObject = find(this.getOptionFromConfig(bindingKey));
        }

        if (!fieldObject && mappingKey) {
            fieldObject = find(this.getMapping(mappingKey));
        }

        return fieldObject || this.datasetService.createBlankField();
    }

    getMapping(key: string): string {
        return this.datasetService.getMapping(this.meta.database.name, this.meta.table.name, key);
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
     * Handles updates that come through the data channel
     * @param event
     */
    onUpdateDataChannelEvent(event) {
        console.log('update data channel event');
        console.log(event);
    }

    /**
     * Handles changes in the active database
     */
    handleChangeDatabase() {
        this.initTables();
        this.logChangeAndStartQueryChain(); // ('database', this.active.database.name);
    }

    /**
     * Handles changes in the active table
     */
    handleChangeTable() {
        this.initFields();
        this.logChangeAndStartQueryChain(); // ('table', this.active.table.name);
    }

    /**
     * If not initializing, calls executeQueryChain();
     */
    logChangeAndStartQueryChain() { // (option: string, value: any, type?: string) {
        // this.logChange(option, value, type);
        if (!this.initializing) {
            this.executeQueryChain();
        }
    }

    /**
     * Called when a filter has been removed
     * @param value the filter name
     */
    abstract removeFilter(filter: any): void;

    /**
     * Check that the local filter column name and value are not null/empty
     * @return {boolean}
     */
    hasUnsharedFilter(): boolean {
        return this.meta.unsharedFilterField &&
            this.meta.unsharedFilterField.columnName !== '' &&
            this.meta.unsharedFilterValue &&
            this.meta.unsharedFilterValue.trim() !== '';
    }

    /**
     * Returns true of there is a valid color field set fot he visualization
     * @return {boolean}
     */
    hasColorField(): boolean {
        return this.meta.colorField && this.meta.colorField.columnName !== '';
    }

    /**
     * Remove a filter from neon, and optionally requery and/or refresh
     * @param name the filter name
     * @param shouldRequery
     * @param shouldRefresh
     */
    removeLocalFilterFromLocalAndNeon(filter: any, shouldRequery: boolean, shouldRefresh: boolean) {
        // If we are removing a filter, assume its both local and neon so it should be removed in both
        this.filterService.removeFilter(
            this.messenger,
            filter.id,
            () => {
                this.removeFilter(filter.id);
                if (shouldRequery) {
                    this.executeQueryChain();
                } else {
                    if (shouldRefresh) {
                        this.refreshVisualization();
                    }
                }
                //console.log('remove filter' + value);
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

    /**
     * Publishes the given ID to the select_id event.
     *
     * @arg {(number|string)} id
     * @fires select_id
     */
    publishSelectId(id) {
        this.messenger.publish('select_id', {
            database: this.meta.database.name,
            table: this.meta.table.name,
            id: id
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
}
