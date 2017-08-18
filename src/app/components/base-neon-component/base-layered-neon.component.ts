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




export abstract class BaseLayeredNeonComponent implements OnInit,
    OnDestroy {

    protected queryTitle: string;
    protected messenger: neon.eventing.Messenger;
    protected outstandingDataQueriesByLayer: any[];

    protected initializing: boolean;

    private redrawAfterResize: boolean = false;

    public meta: {
        databases: DatabaseMetaData[],
        layers: {
            database: DatabaseMetaData,
            tables: TableMetaData[],
            table: TableMetaData,
            fields: FieldMetaData[]
            unsharedFilterField: any,
            unsharedFilterValue: string,
        }[],
    };

    public exportId: number;

    public isLoading: number;
    public isExportable: boolean;

    constructor(
        private connectionService: ConnectionService,
        private datasetService: DatasetService,
        protected filterService: FilterService,
        private exportService: ExportService,
        protected injector: Injector,
        public themesService: ThemesService,
        public changeDetection: ChangeDetectorRef) {
        //These assignments just eliminated unused warnings that occur even though the arguments are
        //automatically assigned to instance variables.
        this.exportService = this.exportService;
        this.filterService = this.filterService;
        this.connectionService = this.connectionService;
        this.injector = this.injector;
        this.themesService = themesService;
        this.changeDetection = changeDetection;
        this.messenger = new neon.eventing.Messenger();
        this.isLoading = 0;
        this.meta = {
            databases: [],
            layers: [],
        };
        this.isExportable = true;
        this.doExport = this.doExport.bind(this);
    };

    ngOnInit() {
        this.initializing = true;
        this.outstandingDataQueriesByLayer = [];
        //for (let database of this.datasetService.getDatabases()) {
        //this.outstandingDataQueriesByLayer[0] = {};
        //}
        this.initData();
        this.messenger.subscribe(DatasetService.UPDATE_DATA_CHANNEL, this.onUpdateDataChannelEvent.bind(this));
        this.messenger.events({ filtersChanged: this.handleFiltersChangedEvent.bind(this) });



        this.subNgOnInit();
        this.exportId = (this.isExportable ? this.exportService.register(this.doExport) : null);
        this.initializing = false;
        this.postInit();
    };

    abstract postInit();
    abstract subNgOnInit();
    abstract subNgOnDestroy();
    abstract getOptionFromConfig(option: string);
    abstract getExportFields(layerIndex: number);
    abstract subAddEmptyLayer();
    abstract subRemoveLayer(index: number);

    addEmptyLayer() {
        let layer = {
            database: new DatabaseMetaData(),
            tables: [],
            table: new TableMetaData(),
            unsharedFilterField: {},
            unsharedFilterValue: '',
            fields: []
        };
        this.outstandingDataQueriesByLayer.push({});
        this.subAddEmptyLayer();
        this.meta.layers.push(layer);
        this.initDatabases(this.meta.layers.length - 1);
    }

    removeLayer(index: number) {
        // Stop if trying to remove a layer that doesn't exist
        if (index >= this.outstandingDataQueriesByLayer.length) {
            return;
        }

        this.outstandingDataQueriesByLayer.splice(index, 1);
        this.meta.layers.splice(index, 1);

        this.subRemoveLayer(index);
    }

    exportOneLayer(query, layerIndex) {
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
        let fields = this.getExportFields(layerIndex);
        for (let field of fields) {
            finalObject.data[0].fields.push({
                query: field['columnName'],
                pretty: field['prettyName'] || field['columnName']
            });
        }

        return finalObject;
    };

    export() {
        //TODO this function needs to be changed  to abstract once we get through all the visualizations.
        let queries = this.createAllQueries();
        let mapFunction = this.exportOneLayer.bind(this);
        if (queries) {
            return queries.map(mapFunction).filter(fo => fo);
        } else {
            console.log('SKIPPING EXPORT FOR ' + this.getVisualizationName());
            return null;
        }
    };

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
        this.subNgOnDestroy();
    };

    initData() {
        this.addEmptyLayer();
    };

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
    };

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
    };

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

        this.onUpdateFields(layerIndex);
        //this.changeDetection.detectChanges();
    };

    abstract onUpdateFields(layerIndex);

    stopEventPropagation(event) {
        if (event.stopPropagation) {
            event.stopPropagation();
        } else {
            event.returnValue = false;
        }
    }

    abstract getFilterText(filter): string;
    abstract createNeonFilterClauseEquals(_databaseAndTableName: {}, fieldName: any);
    abstract getNeonFilterFields(layerIndex: number): string[];
    abstract getVisualizationName(): string;
    /**
    * Must return null for no filters.  Returning an empty array causes the
    * query to ignore ALL fitlers.
    */
    abstract getFiltersToIgnore(): string[];

    addNeonFilter(layerIndex, executeQueryChainOnSuccess, filter) {
        let database = this.meta.layers[layerIndex].database.name;
        let table = this.meta.layers[layerIndex].table.name;
        let fields: string[] = this.getNeonFilterFields(layerIndex);
        let text = this.getFilterText(filter);
        let visName = this.getVisualizationName();

        let onSuccess = () => {
            //console.log('filter set successfully');
            if (executeQueryChainOnSuccess) {
                this.executeQueryChain(layerIndex);
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
        if (this.meta.layers.length === 1) {
            return this.createLayerTitle(1, resetQueryTitle);
        } else {
            return 'Multiple Layers - ' + this.getVisualizationName();
        }
    }

    createLayerTitle(layerIndex, resetQueryTitle?: boolean): string {
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
    };

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

    executeQueryChain(layerIndex) {
        let isValidQuery = this.isValidQuery(layerIndex);
        if (!isValidQuery) {
            return;
        }
        this.isLoading++;
        this.changeDetection.detectChanges();
        this.queryTitle = this.createLayerTitle(false);
        let query = this.createQuery(layerIndex);

        let filtersToIgnore = this.getFiltersToIgnore();
        if (filtersToIgnore && filtersToIgnore.length > 0) {
            query.ignoreFilters(filtersToIgnore);
        }

        this.executeQuery(layerIndex, query);
    }

    createAllQueries() {
        let queries = [];
        for (let i = 0; i < this.meta.layers.length; i++) {
            queries.push(this.createQuery(i));
        }
        return queries;
    }

    abstract isValidQuery(layerIndex: number): void;
    abstract createQuery(layerIndex: number): neon.query.Query;
    abstract onQuerySuccess(layerIndex, response): void;
    abstract refreshVisualization(): void;

    baseOnQuerySuccess(layerIndex, response) {
        this.onQuerySuccess(layerIndex, response);
        this.isLoading--;
        this.changeDetection.detectChanges();
    }

    executeQuery(layerIndex, query: neon.query.Query) {
        let me = this;
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
            console.log('execute query did not return an object');
        }

        this.outstandingDataQueriesByLayer[layerIndex][table].always(function() {
            me.outstandingDataQueriesByLayer[layerIndex][table] = undefined;
        });

        this.outstandingDataQueriesByLayer[layerIndex][table].done(this.baseOnQuerySuccess.bind(this, layerIndex));

        this.outstandingDataQueriesByLayer[layerIndex][table].fail(function(response) {
            if ( response.statusText === 'abort') {
                //query was aborted so we don't care.  We assume we aborted it on purpose.
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
    };

    /**
    * Get field object from the key into the config options
    */
    findFieldObject(layerIndex: number, bindingKey: string, mappingKey?: string): FieldMetaData {
        let me = this;
        let find = function(name) {
            return _.find(me.meta.layers[layerIndex].fields, function(field) {
                return field['columnName'] === name;
            });
        };

        let field;
        if (bindingKey) {
            field = find(this.getOptionFromConfig(bindingKey));
        }

        if (!field && mappingKey) {
            field = find(this.getMapping(layerIndex, mappingKey));
        }

        return field || this.datasetService.createBlankField();
    };

    /**
     * Get a blank FieldMetaData object
     */
    getBlankField(): FieldMetaData {
        return this.datasetService.createBlankField();
    }

    getMapping(layerIndex, key: string): string {
        return this.datasetService.getMapping(this.meta.layers[layerIndex].database.name, this.meta.layers[layerIndex].table.name, key);
    };

    abstract handleFiltersChangedEvent(): void;

    onUpdateDataChannelEvent(event) {
        console.log('update data channel event');
        console.log(event);
    }

    getExportData() { };

    handleChangeDatabase(layerIndex) {
        this.initTables(layerIndex);
        this.logChangeAndStartQueryChain(layerIndex); // ('database', this.active.database.name);
    };

    handleChangeTable(layerIndex) {
        this.initFields(layerIndex);
        this.logChangeAndStartQueryChain(layerIndex); // ('table', this.active.table.name);
    };

    logChangeAndStartAllQueryChain() {
        if (!this.initializing) {
            this.executeAllQueryChain();
        }
    }

    logChangeAndStartQueryChain(layerIndex: number) { // (option: string, value: any, type?: string) {
        // this.logChange(option, value, type);
        if (!this.initializing) {
            this.executeQueryChain(layerIndex);
        }
    };

    abstract removeFilter(value: string): void;

    removeLocalFilterFromLocalAndNeon(layerIndex: number, value: string, isRequery, isRefresh) {
        // If we are removing a filter, assume its both local and neon so it should be removed in both
        let me = this;
        let database = this.meta.layers[layerIndex].database.name;
        let table = this.meta.layers[layerIndex].table.name;
        let fields = this.getNeonFilterFields(layerIndex);
        this.filterService.removeFilter(database, table, fields,
            () => {
                me.removeFilter(value);
                if (isRequery) {
                    this.executeQueryChain(layerIndex);
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
