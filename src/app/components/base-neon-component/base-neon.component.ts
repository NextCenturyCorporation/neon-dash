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
export abstract class BaseNeonComponent implements OnInit, OnDestroy {
    private SETTINGS_BUTTON_WIDTH: number = 30;
    private TEXT_MARGIN_WIDTH: number = 10;
    private TOOLBAR_PADDING_WIDTH: number = 20;
    private TOOLBAR_EXTRA_WIDTH: number = this.SETTINGS_BUTTON_WIDTH + this.TEXT_MARGIN_WIDTH + this.TOOLBAR_PADDING_WIDTH;

    public id: string;
    protected messenger: neon.eventing.Messenger;
    protected outstandingDataQuery: any;

    protected initializing: boolean;

    private redrawAfterResize: boolean = false;

    /**
     * Common metadata about the database, table, and any unshared filters
     */
    public meta: {
        title: string,
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
        this.isLoading = false;

        this.meta = {
            title: '',
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
        this.activeGridService.register(this.id, this);

        this.outstandingDataQuery = {};
        for (let database of this.datasetService.getDatabases()) {
            this.outstandingDataQuery[database.name] = {};
        }
        this.initDatabases(this.meta);
        try {
            this.setupFilters();
        } catch (e) {
            // Fails in unit tests - ignore.
        }

        this.meta.title = this.getOptionFromConfig('title') || this.getVisualizationName();
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
            title: this.meta.title,
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
        // TODO this function needs to be changed  to abstract once we get through all the visualizations.

        let query = this.createQuery();
        if (query) {
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
            let fields = this.getExportFields();
            for (let field of fields) {
                finalObject.data[0].fields.push({
                    query: field.columnName,
                    pretty: field.prettyName || field.columnName
                });
            }

            return finalObject;
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
     * Returns an object containing the ElementRef objects for the visualization.
     *
     * @return {any} Object containing:  {ElementRef} headerText, {ElementRef} infoText, {ElementRef} visualization
     */
    abstract getElementRefs(): any;

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
     * Clean up everything
     */
    ngOnDestroy() {
        this.messenger.unsubscribeAll();
        this.exportService.unregister(this.exportId);
        this.visualizationService.unregister(this.id);
        this.activeGridService.unregister(this.id);
        this.subNgOnDestroy();
    }

    /**
     * Load all the database metadata, then call initTables()
     *
     * @arg {object} metaObject
     */
    initDatabases(metaObject: any) {
        metaObject.databases = this.datasetService.getDatabases();
        metaObject.database = metaObject.databases[0] || new DatabaseMetaData();

        if (metaObject.databases.length > 0) {
            if (this.getOptionFromConfig('database')) {
                for (let database of metaObject.databases) {
                    if (this.getOptionFromConfig('database') === database.name) {
                        metaObject.database = database;
                        break;
                    }
                }
            }

            this.initTables(metaObject);
        }
    }

    /**
     * Load all the table metadata, then call initFields()
     *
     * @arg {object} metaObject
     */
    initTables(metaObject: any) {
        metaObject.tables = this.datasetService.getTables(metaObject.database.name);
        metaObject.table = metaObject.tables[0] || new TableMetaData();

        if (metaObject.tables.length > 0) {
            if (this.getOptionFromConfig('table')) {
                for (let table of metaObject.tables) {
                    if (this.getOptionFromConfig('table') === table.name) {
                        metaObject.table = table;
                        break;
                    }
                }
            }
            this.initFields(metaObject);
        }
    }

    /**
     * Initialize all the field metadata
     *
     * @arg {object} metaObject
     */
    initFields(metaObject: any) {
        // Sort the fields that are displayed in the dropdowns in the options menus alphabetically.
        metaObject.fields = this.datasetService.getSortedFields(metaObject.database.name, metaObject.table.name, true).filter((field) => {
            return (field && field.columnName);
        });
        metaObject.unsharedFilterField = this.findFieldObject('unsharedFilterField');
        metaObject.unsharedFilterValue = this.getOptionFromConfig('unsharedFilterValue') || '';

        this.onUpdateFields();
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
    addNeonFilter(executeQueryChainOnSuccess: boolean, filter: any, whereClause?: neon.query.WherePredicate) {
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
            whereClause || this.createNeonFilterClauseEquals(
                this.meta.database.name,
                this.meta.table.name,
                (filterFields.length === 1) ? filterFields[0] : filterFields),
            filterName,
            onSuccess.bind(this),
            () => {
                console.error('filter failed to set');
            });
        this.changeDetection.detectChanges();
    }

    /**
     * Replace a filter and register the change with Neon.
     * @param {boolean} executeQueryChainOnSuccess
     * @param filter
     */
    replaceNeonFilter(executeQueryChainOnSuccess: boolean, filter: any, whereClause?: neon.query.WherePredicate) {
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
            whereClause || this.createNeonFilterClauseEquals(
                this.meta.database.name,
                this.meta.table.name,
                (filterFields.length === 1) ? filterFields[0] : filterFields),
            filterName,
            onSuccess.bind(this),
            () => {
                console.error('filter failed to set');
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
        this.onQuerySuccess(response);
        this.isLoading = false;
        this.changeDetection.detectChanges();
        // Initialize the header styles.
        this.onResizeStart();
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
            console.error('execute query did not return an object');
        }

        this.outstandingDataQuery[database][table].always(function() {
            me.outstandingDataQuery[database][table] = undefined;
        });

        this.outstandingDataQuery[database][table].done(this.baseOnQuerySuccess.bind(this));

        this.outstandingDataQuery[database][table].fail(function(response) {
            if (response.statusText === 'abort') {
                // query was aborted so we don't care.  We assume we aborted it on purpose.
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
                return field.columnName === name;
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
        // TODO
    }

    /**
     * Handles changes in the active database
     */
    handleChangeDatabase() {
        this.initTables(this.meta);
        this.logChangeAndStartQueryChain();
    }

    /**
     * Handles changes in the active table
     */
    handleChangeTable() {
        this.initFields(this.meta);
        this.logChangeAndStartQueryChain();
    }

    /**
     * Handles changes in the active data
     */
    handleChangeData() {
        this.logChangeAndStartQueryChain();
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
            (removedFilter) => {
                if (removedFilter) {
                    this.removeFilter(removedFilter);
                } else {
                    // No filter removed means undefined or old ID. Pass this back to remove itself.
                    this.removeFilter(filter);
                }
                if (shouldRequery) {
                    this.executeQueryChain();
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
}
