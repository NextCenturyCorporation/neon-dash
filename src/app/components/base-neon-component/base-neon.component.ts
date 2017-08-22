import {
    OnInit,
    OnDestroy,
    Injector,
    ChangeDetectorRef
} from '@angular/core';
import {ConnectionService} from '../../services/connection.service';
import {DatasetService} from '../../services/dataset.service';
import {FilterService} from '../../services/filter.service';
import {ExportService} from '../../services/export.service';
import {ThemesService} from '../../services/themes.service';
import {FieldMetaData, TableMetaData, DatabaseMetaData} from '../../dataset';
//import {neonMappings} from '../../neon-namespaces';
import * as neon from 'neon-framework';
import * as _ from 'lodash';
import {VisualizationService} from '../../services/visualization.service';
import * as uuid from 'node-uuid';



export abstract class BaseNeonComponent implements OnInit,
    OnDestroy {

    protected queryTitle: string;
    protected messenger: neon.eventing.Messenger;
    protected outstandingDataQuery: any;
    protected stateId: string;

    protected initializing: boolean;

    private redrawAfterResize: boolean = false;

    public meta: {
        databases: DatabaseMetaData[],
        database: DatabaseMetaData,
        tables: TableMetaData[],
        table: TableMetaData,
        unsharedFilterField: any,
        unsharedFilterValue: string,
        fields: FieldMetaData[]
    };

    public exportId: number;

    public isLoading: boolean;
    public isExportable: boolean;

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
            fields: []
        };
        this.isExportable = true;
        this.doExport = this.doExport.bind(this);
        this.getBindings = this.getBindings.bind(this);
        // Let the ID be a UUID
        this.stateId = uuid.v4();
    };

    ngOnInit() {
        this.initializing = true;
        this.messenger.subscribe(DatasetService.UPDATE_DATA_CHANNEL, this.onUpdateDataChannelEvent.bind(this));
        this.messenger.events({ filtersChanged: this.handleFiltersChangedEvent.bind(this) });
        this.visualizationService.register(this.stateId, this.getBindings);

        this.outstandingDataQuery = {};
        for (let database of this.datasetService.getDatabases()) {
            this.outstandingDataQuery[database.name] = {};
        }
        this.initData();

        this.subNgOnInit();
        this.exportId = (this.isExportable ? this.exportService.register(this.doExport) : null);
        this.initializing = false;
        this.postInit();
    };

    abstract postInit();
    abstract subNgOnInit();
    abstract subNgOnDestroy();
    abstract getOptionFromConfig(option: string);
    abstract getExportFields();

    /**
     * Add any fields needed to restore the state to the bindings parameter
     * @param bindings
     */
    abstract subGetBindings(bindings: any);

    /**
     * Function to get any bindings needed to re-create the visualization
     * @return {any}
     */
    getBindings(): any {
        let bindings = {
            title: this.createTitle()
        };
        // TODO - What to add here?

        // Get the bindings from the subclass
        this.subGetBindings(bindings);

        return bindings;
    }

    export() {
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
    };

    protected enableRedrawAfterResize(enable: boolean) {
        this.redrawAfterResize = enable;
    };

    onResizeStop() {
        if (this.redrawAfterResize) {
            // This event fires as soon as the user releases the mouse, but NgGrid animates the resize,
            // so the current width and height are not the new width and height.  NgGrid uses a 0.25
            // second transition so wait until that has finished before redrawing.
            setTimeout(() => { this.refreshVisualization(); }, 300);
        }
    }

    ngOnDestroy() {
        this.messenger.unsubscribeAll();
        this.exportService.unregister(this.exportId);
        this.visualizationService.unregister(this.stateId);
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
    };

    initData() {
        this.initDatabases();
    };

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
    };

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
    };

    initFields() {
        // Sort the fields that are displayed in the dropdowns in the options menus
        // alphabetically.
        let fields = this.datasetService
            .getSortedFields(this.meta.database['name'], this.meta.table['name']);
        this.meta.fields = fields.filter(function(f) {
            return (f && f.type);
        });
        this.meta.unsharedFilterField = this.findFieldObject('unsharedFilterField');
        this.meta.unsharedFilterValue = this.getOptionFromConfig('unsharedFilterValue') || '';

        this.onUpdateFields();
        //this.changeDetection.detectChanges();
    };

    abstract onUpdateFields();

    stopEventPropagation(event) {
        if (event.stopPropagation) {
            event.stopPropagation();
        } else {
            event.returnValue = false;
        }
    }

    abstract getFilterText(filter): string;
    abstract createNeonFilterClauseEquals(_databaseAndTableName: {}, fieldName: any);
    abstract getNeonFilterFields(): string[];
    abstract getVisualizationName(): string;
    /**
    * Must return null for no filters.  Returning an empty array causes the
    * query to ignore ALL fitlers.
    */
    abstract getFiltersToIgnore(): string[];

    addNeonFilter(executeQueryChainOnSuccess, filter) {
        let database = this.meta.database.name;
        let table = this.meta.table.name;
        let fields: string[] = this.getNeonFilterFields();
        let text = this.getFilterText(filter);
        let visName = this.getVisualizationName();

        let onSuccess = () => {
            //console.log('filter set successfully');
            if (executeQueryChainOnSuccess) {
                this.executeQueryChain();
            }
        };
        this.filterService.addFilter(this.messenger, database, table, fields,
            this.createNeonFilterClauseEquals.bind(this),
            {
                visName: visName,
                text: text
            }
            , onSuccess.bind(this),
            () => {
                console.log('filter failed to set');
            });
        this.changeDetection.detectChanges();
    };

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
    };

    /**
    This is expected to get called whenever a query is expected to be run.
    This could be startup, user action to change field, relevant filter change
    from another visualization
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

    abstract isValidQuery(): void;
    abstract createQuery(): neon.query.Query;
    abstract onQuerySuccess(response): void;
    abstract refreshVisualization(): void;

    baseOnQuerySuccess(response) {
        this.onQuerySuccess(response);
        this.isLoading = false;
        this.changeDetection.detectChanges();
    }

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
    };

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

        let field;
        if (bindingKey) {
            field = find(this.getOptionFromConfig(bindingKey));
        }

        if (!field && mappingKey) {
            field = find(this.getMapping(mappingKey));
        }

        return field || this.datasetService.createBlankField();
    };

    getMapping(key: string): string {
        return this.datasetService.getMapping(this.meta.database.name, this.meta.table.name, key);
    };

    abstract handleFiltersChangedEvent(): void;

    onUpdateDataChannelEvent(event) {
        console.log('update data channel event');
        console.log(event);
    }

    getExportData() { };

    handleChangeDatabase() {
        this.initTables();
        this.logChangeAndStartQueryChain(); // ('database', this.active.database.name);
    };

    handleChangeTable() {
        this.initFields();
        this.logChangeAndStartQueryChain(); // ('table', this.active.table.name);
    };

    logChangeAndStartQueryChain() { // (option: string, value: any, type?: string) {
        // this.logChange(option, value, type);
        if (!this.initializing) {
            this.executeQueryChain();
        }
    };

    abstract removeFilter(value: string): void;

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

    removeLocalFilterFromLocalAndNeon(value: string, isRequery, isRefresh) {
        // If we are removing a filter, assume its both local and neon so it should be removed in both
        let me = this;
        let database = this.meta.database.name;
        let table = this.meta.table.name;
        let fields = this.getNeonFilterFields();
        this.filterService.removeFilter(database, table, fields,
            () => {
                me.removeFilter(value);
                if (isRequery) {
                    this.executeQueryChain();
                } else {
                    if (isRefresh) {
                        this.refreshVisualization();
                    }
                }
                //console.log('remove filter' + value);
                this.changeDetection.detectChanges();
            },
            () => {
                console.error('error removing filter');
            }, this.messenger);
        this.changeDetection.detectChanges();
    };

    getButtonText() {
        return '';
    }
}
