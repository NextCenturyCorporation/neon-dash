import { DatasetService } from '../../services/dataset.service';
import { FieldMetaData, TableMetaData, DatabaseMetaData } from '../../dataset';
import * as neon from 'neon-framework';
import * as _ from 'lodash';
import * as uuid from 'node-uuid';
import { Color } from '../../services/color-scheme.service';
/**
 * Base component for all non-layered Neon visualizations.
 * This manages some of the lifecycle and query logic.
 */
var BaseLayeredNeonComponent = /** @class */ (function () {
    function BaseLayeredNeonComponent(activeGridService, connectionService, datasetService, filterService, exportService, injector, themesService, changeDetection, visualizationService) {
        this.activeGridService = activeGridService;
        this.connectionService = connectionService;
        this.datasetService = datasetService;
        this.filterService = filterService;
        this.exportService = exportService;
        this.injector = injector;
        this.themesService = themesService;
        this.changeDetection = changeDetection;
        this.visualizationService = visualizationService;
        this.SETTINGS_BUTTON_WIDTH = 30;
        this.TEXT_MARGIN_WIDTH = 10;
        this.TOOLBAR_PADDING_WIDTH = 20;
        this.TOOLBAR_EXTRA_WIDTH = this.SETTINGS_BUTTON_WIDTH + this.TEXT_MARGIN_WIDTH + this.TOOLBAR_PADDING_WIDTH;
        this.redrawAfterResize = false;
        /**
         * Just a blank FieldMetaData object.
         * Meant to be used for a 'clear' option in field dropdowns
         */
        this.emptyField = new FieldMetaData();
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
            title: '',
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
    BaseLayeredNeonComponent.prototype.ngOnInit = function () {
        this.initializing = true;
        this.outstandingDataQueriesByLayer = [];
        this.initData();
        try {
            this.setupFilters();
        }
        catch (e) {
            // Fails in unit tests - ignore.
        }
        this.messenger.subscribe(DatasetService.UPDATE_DATA_CHANNEL, this.onUpdateDataChannelEvent.bind(this));
        this.messenger.events({ filtersChanged: this.handleFiltersChangedEvent.bind(this) });
        this.visualizationService.registerBindings(this.id, this);
        this.activeGridService.register(this.id, this);
        this.meta.title = this.getOptionFromConfig('title') || this.getVisualizationName();
        this.subNgOnInit();
        this.exportId = (this.isExportable ? this.exportService.register(this.doExport) : null);
        this.initializing = false;
        this.postInit();
    };
    /**
     * Function to get any bindings needed to re-create the visualization
     * @return {any}
     */
    BaseLayeredNeonComponent.prototype.getBindings = function () {
        var bindings = {
            title: this.meta.title,
            databases: [],
            layers: []
        };
        for (var _i = 0, _a = this.meta.databases; _i < _a.length; _i++) {
            var database = _a[_i];
            bindings.databases.push(database.name);
        }
        for (var _b = 0, _c = this.meta.layers; _b < _c.length; _b++) {
            var layer = _c[_b];
            var layerBindings = {
                title: layer.title,
                database: layer.database.name,
                tables: [],
                table: layer.table.name,
                fields: [],
                unsharedFilterField: layer.unsharedFilterField.columnName,
                unsharedFilterValue: layer.unsharedFilterValue,
                docCount: 0
            };
            for (var _d = 0, _e = layer.fields; _d < _e.length; _d++) {
                var field = _e[_d];
                layerBindings.fields.push(field.columnName);
            }
            for (var _f = 0, _g = layer.tables; _f < _g.length; _f++) {
                var table = _g[_f];
                layerBindings.tables.push(table.name);
            }
            bindings.layers.push(layerBindings);
        }
        // Get the bindings from the subclass
        this.subGetBindings(bindings);
        return bindings;
    };
    /**
     * Add a new empty layer
     */
    BaseLayeredNeonComponent.prototype.addEmptyLayer = function () {
        var layer = {
            title: '',
            database: new DatabaseMetaData(),
            tables: [],
            table: new TableMetaData(),
            unsharedFilterField: {},
            unsharedFilterValue: '',
            fields: [],
            docCount: 0
        };
        this.outstandingDataQueriesByLayer.push({});
        this.subAddEmptyLayer();
        this.meta.layers.push(layer);
        this.initDatabases(this.meta.layers.length - 1);
    };
    /**
     * Remove a specific layer
     * @param {number} index
     */
    BaseLayeredNeonComponent.prototype.removeLayer = function (index) {
        // Stop if trying to remove a layer that doesn't exist
        if (index >= this.outstandingDataQueriesByLayer.length) {
            return;
        }
        this.outstandingDataQueriesByLayer.splice(index, 1);
        this.meta.layers.splice(index, 1);
        this.subRemoveLayer(index);
    };
    /**
     * Export a single layer
     * @param query
     * @param layerIndex
     * @return {}
     */
    BaseLayeredNeonComponent.prototype.exportOneLayer = function (query, layerIndex) {
        var exportName = this.meta.title;
        if (exportName) {
            // replaceAll
            exportName = exportName.split(':').join(' ');
        }
        var finalObject = {
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
        var fields = this.getExportFields(layerIndex);
        for (var _i = 0, fields_1 = fields; _i < fields_1.length; _i++) {
            var field = fields_1[_i];
            finalObject.data[0].fields.push({
                query: field.columnName,
                pretty: field.prettyName || field.columnName
            });
        }
        return finalObject;
    };
    /**
     * Get a query ready to give to the ExportService.
     */
    BaseLayeredNeonComponent.prototype.export = function () {
        // TODO this function needs to be changed  to abstract once we get through all the visualizations.
        var queries = this.createAllQueries();
        var mapFunction = this.exportOneLayer.bind(this);
        if (queries) {
            return queries.map(mapFunction).filter(function (fo) { return fo; });
        }
        else {
            console.error('SKIPPING EXPORT FOR ' + this.getVisualizationName());
            return null;
        }
    };
    BaseLayeredNeonComponent.prototype.doExport = function () {
        return this.export();
    };
    BaseLayeredNeonComponent.prototype.enableRedrawAfterResize = function (enable) {
        this.redrawAfterResize = enable;
    };
    /**
     * Initializes sub-component styles as needed.
     */
    BaseLayeredNeonComponent.prototype.onResizeStart = function () {
        // Update info text width.
        var refs = this.getElementRefs();
        if (refs.infoText && refs.visualization) {
            if (refs.visualization.nativeElement.clientWidth > (refs.infoText.nativeElement.clientWidth - this.TOOLBAR_EXTRA_WIDTH)) {
                refs.infoText.nativeElement.style.minWidth = (Math.round(refs.infoText.nativeElement.clientWidth) + 1) + 'px';
            }
        }
    };
    /**
     * Resizes sub-components as needed.
     */
    BaseLayeredNeonComponent.prototype.onResizeStop = function () {
        var _this = this;
        // Update header text width.
        var refs = this.getElementRefs();
        if (refs.headerText && refs.infoText && refs.visualization) {
            refs.headerText.nativeElement.style.maxWidth = Math.round(refs.visualization.nativeElement.clientWidth -
                refs.infoText.nativeElement.clientWidth - this.TOOLBAR_EXTRA_WIDTH) + 'px';
        }
        if (this.redrawAfterResize) {
            // This event fires as soon as the user releases the mouse, but NgGrid animates the resize,
            // so the current width and height are not the new width and height.  NgGrid uses a 0.25
            // second transition so wait until that has finished before redrawing.
            setTimeout(function () { _this.refreshVisualization(); }, 300);
        }
    };
    /**
     * Clean up everything
     */
    BaseLayeredNeonComponent.prototype.ngOnDestroy = function () {
        this.messenger.unsubscribeAll();
        this.exportService.unregister(this.exportId);
        this.visualizationService.unregister(this.id);
        this.activeGridService.unregister(this.id);
        this.subNgOnDestroy();
    };
    BaseLayeredNeonComponent.prototype.initData = function () {
        this.addEmptyLayer();
    };
    /**
     * Initialize the database metadata for a layer
     * @param layerIndex
     */
    BaseLayeredNeonComponent.prototype.initDatabases = function (layerIndex) {
        this.meta.databases = this.datasetService.getDatabases();
        this.meta.layers[layerIndex].database = this.meta.databases[0] || this.meta.layers[layerIndex].database;
        if (this.meta.databases.length > 0) {
            if (this.getOptionFromConfig('database')) {
                for (var _i = 0, _a = this.meta.databases; _i < _a.length; _i++) {
                    var database = _a[_i];
                    if (this.getOptionFromConfig('database') === database.name) {
                        this.meta.layers[layerIndex].database = database;
                        break;
                    }
                }
            }
            this.initTables(layerIndex);
        }
    };
    /**
     * Initialize the table metadata for a layer
     * @param layerIndex
     */
    BaseLayeredNeonComponent.prototype.initTables = function (layerIndex) {
        this.meta.layers[layerIndex].tables = this.datasetService.getTables(this.meta.layers[layerIndex].database.name);
        this.meta.layers[layerIndex].table = this.meta.layers[layerIndex].tables[0];
        if (this.meta.layers[layerIndex].tables.length > 0) {
            if (this.getOptionFromConfig('table')) {
                for (var _i = 0, _a = this.meta.layers[layerIndex].tables; _i < _a.length; _i++) {
                    var table = _a[_i];
                    if (this.getOptionFromConfig('table') === table.name) {
                        this.meta.layers[layerIndex].table = table;
                        break;
                    }
                }
            }
            this.initFields(layerIndex);
        }
    };
    /**
     * Initialize the field metadata for a layer
     * @param layerIndex
     */
    BaseLayeredNeonComponent.prototype.initFields = function (layerIndex) {
        // Sort the fields that are displayed in the dropdowns in the options menus
        // alphabetically.
        var fields = this.datasetService
            .getSortedFields(this.meta.layers[layerIndex].database.name, this.meta.layers[layerIndex].table.name);
        this.meta.layers[layerIndex].fields = fields.filter(function (field) {
            return !!field;
        });
        this.meta.layers[layerIndex].unsharedFilterField = this.findFieldObject(layerIndex, 'unsharedFilterField');
        this.meta.layers[layerIndex].unsharedFilterValue = this.getOptionFromConfig('unsharedFilterValue') || '';
        this.onUpdateFields(layerIndex);
    };
    BaseLayeredNeonComponent.prototype.stopEventPropagation = function (event) {
        if (event.stopPropagation) {
            event.stopPropagation();
        }
        else {
            event.returnValue = false;
        }
    };
    /**
     * Add a filter and register it with neon.
     * @param layerIndex
     * @param {boolean} executeQueryChainOnSuccess
     * @param filter
     */
    BaseLayeredNeonComponent.prototype.addNeonFilter = function (layerIndex, executeQueryChainOnSuccess, filter) {
        var _this = this;
        var filterName = {
            visName: this.getVisualizationName(),
            text: this.getFilterText(filter)
        };
        var onSuccess = function (resp) {
            if (typeof resp === 'string') {
                filter.id = resp;
            }
            if (executeQueryChainOnSuccess) {
                _this.executeQueryChain(layerIndex);
            }
        };
        this.filterService.addFilter(this.messenger, this.id, this.meta.layers[layerIndex].database.name, this.meta.layers[layerIndex].table.name, this.createNeonFilterClauseEquals(this.meta.layers[layerIndex].database.name, this.meta.layers[layerIndex].table.name, this.getNeonFilterFields(layerIndex)), filterName, onSuccess.bind(this), function () {
            console.error('filter failed to set');
        });
        this.changeDetection.detectChanges();
    };
    /**
     * Replace a filter and register the change with Neon.
     * @param layerIndex
     * @param {boolean} executeQueryChainOnSuccess
     * @param filter
     */
    BaseLayeredNeonComponent.prototype.replaceNeonFilter = function (layerIndex, executeQueryChainOnSuccess, filter) {
        var _this = this;
        var filterName = {
            visName: this.getVisualizationName(),
            text: this.getFilterText(filter)
        };
        var onSuccess = function (resp) {
            if (executeQueryChainOnSuccess) {
                _this.executeQueryChain(layerIndex);
            }
        };
        this.filterService.replaceFilter(this.messenger, filter.id, this.id, this.meta.layers[layerIndex].database.name, this.meta.layers[layerIndex].table.name, this.createNeonFilterClauseEquals(this.meta.layers[layerIndex].database.name, this.meta.layers[layerIndex].table.name, this.getNeonFilterFields(layerIndex)), filterName, onSuccess.bind(this), function () {
            console.error('filter failed to set');
        });
        this.changeDetection.detectChanges();
    };
    /**
     * This is expected to get called whenever a query is expected to be run.
     * This could be startup, user action to change field, relevant filter change
     * from another visualization
     */
    BaseLayeredNeonComponent.prototype.executeAllQueryChain = function () {
        for (var i = 0; i < this.meta.layers.length; i++) {
            this.executeQueryChain(i);
        }
    };
    /**
     * Execute the Neon query chain.
     *
     * This is expected to get called whenever a query is expected to be run.
     * This could be startup, user action to change field, relevant filter change
     * from another visualization
     */
    BaseLayeredNeonComponent.prototype.executeQueryChain = function (layerIndex) {
        var isValidQuery = this.isValidQuery(layerIndex);
        if (!isValidQuery) {
            return;
        }
        this.isLoading++;
        this.changeDetection.detectChanges();
        var query = this.createQuery(layerIndex);
        var filtersToIgnore = this.getFiltersToIgnore();
        if (filtersToIgnore && filtersToIgnore.length > 0) {
            query.ignoreFilters(filtersToIgnore);
        }
        this.executeQuery(layerIndex, query);
    };
    /**
     * Get the list of queries for all layers
     * @return {Array}
     */
    BaseLayeredNeonComponent.prototype.createAllQueries = function () {
        var queries = [];
        for (var i = 0; i < this.meta.layers.length; i++) {
            queries.push(this.createQuery(i));
        }
        return queries;
    };
    /**
     * Generic query success method
     * @param layerIndex
     * @param response
     */
    BaseLayeredNeonComponent.prototype.baseOnQuerySuccess = function (layerIndex, response) {
        this.onQuerySuccess(layerIndex, response);
        this.isLoading--;
        this.changeDetection.detectChanges();
        // Initialize the header styles.
        this.onResizeStart();
    };
    /**
     * Execute a neon query
     * @param {number} layerIndex
     * @param query The query to execute
     */
    BaseLayeredNeonComponent.prototype.executeQuery = function (layerIndex, query) {
        var _this = this;
        var database = this.meta.layers[layerIndex].database.name;
        var table = this.meta.layers[layerIndex].table.name;
        var connection = this.connectionService.getActiveConnection();
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
        this.outstandingDataQueriesByLayer[layerIndex][table].always(function () {
            _this.outstandingDataQueriesByLayer[layerIndex][table] = undefined;
        });
        this.outstandingDataQueriesByLayer[layerIndex][table].done(this.baseOnQuerySuccess.bind(this, layerIndex));
        this.outstandingDataQueriesByLayer[layerIndex][table].fail(function (response) {
            if (response.statusText === 'abort') {
                // query was aborted so we don't care.  We assume we aborted it on purpose.
            }
            else {
                _this.isLoading--;
                if (response.status === 0) {
                    console.error('Query failed: ' + response);
                }
                else {
                    console.error('Query failed: ' + response);
                }
                _this.changeDetection.detectChanges();
            }
        });
    };
    /**
     * Get field object from the key into the config options
     */
    BaseLayeredNeonComponent.prototype.findFieldObject = function (layerIndex, bindingKey, mappingKey) {
        var _this = this;
        var find = function (name) {
            return _.find(_this.meta.layers[layerIndex].fields, function (field) {
                return field.columnName === name;
            });
        };
        var fieldObject;
        if (bindingKey) {
            fieldObject = find(this.getOptionFromConfig(bindingKey));
        }
        if (!fieldObject && mappingKey) {
            fieldObject = find(this.getMapping(layerIndex, mappingKey));
        }
        return fieldObject || this.datasetService.createBlankField();
    };
    /**
     * Get a blank FieldMetaData object
     */
    BaseLayeredNeonComponent.prototype.getBlankField = function () {
        return this.datasetService.createBlankField();
    };
    BaseLayeredNeonComponent.prototype.getMapping = function (layerIndex, key) {
        return this.datasetService.getMapping(this.meta.layers[layerIndex].database.name, this.meta.layers[layerIndex].table.name, key);
    };
    /**
     * Called after the filters in the filter service have changed.
     * Defaults to calling setupFilters() then executeAllQueryChain()
     */
    BaseLayeredNeonComponent.prototype.handleFiltersChangedEvent = function () {
        this.setupFilters();
        this.executeAllQueryChain();
    };
    /**
     * Handles updates that come through the data channel
     * @param event
     */
    BaseLayeredNeonComponent.prototype.onUpdateDataChannelEvent = function (event) {
        // TODO
    };
    /**
     * Handles changes in the active database
     */
    BaseLayeredNeonComponent.prototype.handleChangeDatabase = function (layerIndex) {
        this.initTables(layerIndex);
        this.logChangeAndStartQueryChain(layerIndex);
    };
    /**
     * Handles changes in the active table
     */
    BaseLayeredNeonComponent.prototype.handleChangeTable = function (layerIndex) {
        this.initFields(layerIndex);
        this.logChangeAndStartQueryChain(layerIndex);
    };
    /**
     * If not initializing, calls executeQueryChain();
     */
    BaseLayeredNeonComponent.prototype.logChangeAndStartAllQueryChain = function () {
        if (!this.initializing) {
            this.executeAllQueryChain();
        }
    };
    /**
     * If not initializing, calls executeQueryChain(index) for a layer
     */
    BaseLayeredNeonComponent.prototype.logChangeAndStartQueryChain = function (layerIndex) {
        if (!this.initializing) {
            this.executeQueryChain(layerIndex);
        }
    };
    /**
     * Remove a filter from neon, and optionally requery and/or refresh
     * @param layerIndex
     * @param name the filter name
     * @param shouldRequery
     * @param shouldRefresh
     */
    BaseLayeredNeonComponent.prototype.removeLocalFilterFromLocalAndNeon = function (layerIndex, filter, shouldRequery, shouldRefresh) {
        var _this = this;
        // If we are removing a filter, assume its both local and neon so it should be removed in both
        var database = this.meta.layers[layerIndex].database.name;
        var table = this.meta.layers[layerIndex].table.name;
        var fields = this.getNeonFilterFields(layerIndex);
        this.filterService.removeFilter(this.messenger, filter.id, function () {
            _this.removeFilter(filter);
            if (shouldRequery) {
                _this.executeQueryChain(layerIndex);
            }
            else {
                if (shouldRefresh) {
                    _this.refreshVisualization();
                }
            }
            _this.changeDetection.detectChanges();
        }, function () {
            console.error('error removing filter');
        });
        this.changeDetection.detectChanges();
    };
    BaseLayeredNeonComponent.prototype.getButtonText = function () {
        return '';
    };
    BaseLayeredNeonComponent.prototype.getPrimaryThemeColor = function () {
        var elems = document.getElementsByClassName('coloraccessor'), style;
        if (!elems.length) {
            style = 'rgb(255, 255, 255)';
        }
        else {
            style = window.getComputedStyle(elems[0], null).getPropertyValue('color');
        }
        return style && Color.fromRgbString(style);
    };
    /**
     * Returns whether the given item is a number.
     *
     * @arg {any} item
     * @return {boolean}
     */
    BaseLayeredNeonComponent.prototype.isNumber = function (item) {
        return !isNaN(parseFloat(item)) && isFinite(item);
    };
    /**
     * Returns the prettified string of the given integer (with commas).
     *
     * @arg {number} item
     * @return {string}
     */
    BaseLayeredNeonComponent.prototype.prettifyInteger = function (item) {
        return item.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };
    return BaseLayeredNeonComponent;
}());
export { BaseLayeredNeonComponent };
//# sourceMappingURL=base-layered-neon.component.js.map