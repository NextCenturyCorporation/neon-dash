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
var BaseNeonComponent = /** @class */ (function () {
    function BaseNeonComponent(activeGridService, connectionService, datasetService, filterService, exportService, injector, themesService, changeDetection, visualizationService) {
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
    BaseNeonComponent.prototype.ngOnInit = function () {
        this.initializing = true;
        this.messenger.subscribe(DatasetService.UPDATE_DATA_CHANNEL, this.onUpdateDataChannelEvent.bind(this));
        this.messenger.events({ filtersChanged: this.handleFiltersChangedEvent.bind(this) });
        this.visualizationService.registerBindings(this.id, this);
        this.activeGridService.register(this.id, this);
        this.outstandingDataQuery = {};
        for (var _i = 0, _a = this.datasetService.getDatabases(); _i < _a.length; _i++) {
            var database = _a[_i];
            this.outstandingDataQuery[database.name] = {};
        }
        this.initDatabases();
        try {
            this.setupFilters();
        }
        catch (e) {
            // Fails in unit tests - ignore.
        }
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
    BaseNeonComponent.prototype.getBindings = function () {
        var bindings = {
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
    };
    /**
     * Get a query ready to give to the ExportService.
     */
    BaseNeonComponent.prototype.export = function () {
        // TODO this function needs to be changed  to abstract once we get through all the visualizations.
        var query = this.createQuery();
        if (query) {
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
            var fields = this.getExportFields();
            for (var _i = 0, fields_1 = fields; _i < fields_1.length; _i++) {
                var field = fields_1[_i];
                finalObject.data[0].fields.push({
                    query: field.columnName,
                    pretty: field.prettyName || field.columnName
                });
            }
            return finalObject;
        }
        else {
            console.error('SKIPPING EXPORT FOR ' + this.getVisualizationName());
            return null;
        }
    };
    BaseNeonComponent.prototype.doExport = function () {
        return this.export();
    };
    BaseNeonComponent.prototype.enableRedrawAfterResize = function (enable) {
        this.redrawAfterResize = enable;
    };
    /**
     * Initializes sub-component styles as needed.
     */
    BaseNeonComponent.prototype.onResizeStart = function () {
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
    BaseNeonComponent.prototype.onResizeStop = function () {
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
    BaseNeonComponent.prototype.ngOnDestroy = function () {
        this.messenger.unsubscribeAll();
        this.exportService.unregister(this.exportId);
        this.visualizationService.unregister(this.id);
        this.activeGridService.unregister(this.id);
        this.subNgOnDestroy();
    };
    /**
     * Load all the database metadata, then call initTables()
     */
    BaseNeonComponent.prototype.initDatabases = function () {
        this.meta.databases = this.datasetService.getDatabases();
        this.meta.database = this.meta.databases[0];
        if (this.meta.databases.length > 0) {
            if (this.getOptionFromConfig('database')) {
                for (var _i = 0, _a = this.meta.databases; _i < _a.length; _i++) {
                    var database = _a[_i];
                    if (this.getOptionFromConfig('database') === database.name) {
                        this.meta.database = database;
                        break;
                    }
                }
            }
            this.initTables();
        }
    };
    /**
     * Load all the table metadata, then call initFields()
     */
    BaseNeonComponent.prototype.initTables = function () {
        this.meta.tables = this.datasetService.getTables(this.meta.database.name);
        this.meta.table = this.meta.tables[0];
        if (this.meta.tables.length > 0) {
            if (this.getOptionFromConfig('table')) {
                for (var _i = 0, _a = this.meta.tables; _i < _a.length; _i++) {
                    var table = _a[_i];
                    if (this.getOptionFromConfig('table') === table.name) {
                        this.meta.table = table;
                        break;
                    }
                }
            }
            this.initFields();
        }
    };
    /**
     * Initialize all the field metadata
     */
    BaseNeonComponent.prototype.initFields = function () {
        // Sort the fields that are displayed in the dropdowns in the options menus alphabetically.
        this.meta.fields = this.datasetService.getSortedFields(this.meta.database.name, this.meta.table.name, true).filter(function (field) {
            return (field && field.columnName);
        });
        this.meta.unsharedFilterField = this.findFieldObject('unsharedFilterField');
        this.meta.unsharedFilterValue = this.getOptionFromConfig('unsharedFilterValue') || '';
        this.onUpdateFields();
    };
    BaseNeonComponent.prototype.stopEventPropagation = function (event) {
        if (event.stopPropagation) {
            event.stopPropagation();
        }
        else {
            event.returnValue = false;
        }
    };
    /**
     * Add a filter and register it with neon.
     * @param {boolean} executeQueryChainOnSuccess
     * @param filter
     */
    BaseNeonComponent.prototype.addNeonFilter = function (executeQueryChainOnSuccess, filter, whereClause) {
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
                _this.executeQueryChain();
            }
        };
        var filterFields = this.getNeonFilterFields();
        this.filterService.addFilter(this.messenger, this.id, this.meta.database.name, this.meta.table.name, whereClause || this.createNeonFilterClauseEquals(this.meta.database.name, this.meta.table.name, (filterFields.length === 1) ? filterFields[0] : filterFields), filterName, onSuccess.bind(this), function () {
            console.error('filter failed to set');
        });
        this.changeDetection.detectChanges();
    };
    /**
     * Replace a filter and register the change with Neon.
     * @param {boolean} executeQueryChainOnSuccess
     * @param filter
     */
    BaseNeonComponent.prototype.replaceNeonFilter = function (executeQueryChainOnSuccess, filter, whereClause) {
        var _this = this;
        var filterName = {
            visName: this.getVisualizationName(),
            text: this.getFilterText(filter)
        };
        var onSuccess = function (resp) {
            if (executeQueryChainOnSuccess) {
                _this.executeQueryChain();
            }
        };
        var filterFields = this.getNeonFilterFields();
        this.filterService.replaceFilter(this.messenger, filter.id, this.id, this.meta.database.name, this.meta.table.name, whereClause || this.createNeonFilterClauseEquals(this.meta.database.name, this.meta.table.name, (filterFields.length === 1) ? filterFields[0] : filterFields), filterName, onSuccess.bind(this), function () {
            console.error('filter failed to set');
        });
        this.changeDetection.detectChanges();
    };
    /**
     * Execute the Neon query chain.
     *
     * This is expected to get called whenever a query is expected to be run.
     * This could be startup, user action to change field, relevant filter change
     * from another visualization
     */
    BaseNeonComponent.prototype.executeQueryChain = function () {
        var isValidQuery = this.isValidQuery();
        if (!isValidQuery) {
            return;
        }
        this.isLoading = true;
        this.changeDetection.detectChanges();
        var query = this.createQuery();
        var filtersToIgnore = this.getFiltersToIgnore();
        if (filtersToIgnore && filtersToIgnore.length > 0) {
            query.ignoreFilters(filtersToIgnore);
        }
        this.executeQuery(query);
    };
    /**
     * Generic query success method
     * @param response
     */
    BaseNeonComponent.prototype.baseOnQuerySuccess = function (response) {
        this.onQuerySuccess(response);
        this.isLoading = false;
        this.changeDetection.detectChanges();
        // Initialize the header styles.
        this.onResizeStart();
    };
    /**
     * Execute a neon query
     * @param query The query to execute
     */
    BaseNeonComponent.prototype.executeQuery = function (query) {
        var me = this;
        var database = this.meta.database.name;
        var table = this.meta.table.name;
        var connection = this.connectionService.getActiveConnection();
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
        this.outstandingDataQuery[database][table].always(function () {
            me.outstandingDataQuery[database][table] = undefined;
        });
        this.outstandingDataQuery[database][table].done(this.baseOnQuerySuccess.bind(this));
        this.outstandingDataQuery[database][table].fail(function (response) {
            if (response.statusText === 'abort') {
                // query was aborted so we don't care.  We assume we aborted it on purpose.
            }
            else {
                this.isLoading = false;
                if (response.status === 0) {
                    console.error('Query failed: ' + response);
                }
                else {
                    console.error('Query failed: ' + response);
                }
                this.changeDetection.detectChanges();
            }
        });
    };
    /**
     * Get field object from the key into the config options
     */
    BaseNeonComponent.prototype.findFieldObject = function (bindingKey, mappingKey) {
        var me = this;
        var find = function (name) {
            return _.find(me.meta.fields, function (field) {
                return field.columnName === name;
            });
        };
        var fieldObject;
        if (bindingKey) {
            fieldObject = find(this.getOptionFromConfig(bindingKey));
        }
        if (!fieldObject && mappingKey) {
            fieldObject = find(this.getMapping(mappingKey));
        }
        return fieldObject || this.datasetService.createBlankField();
    };
    BaseNeonComponent.prototype.getMapping = function (key) {
        return this.datasetService.getMapping(this.meta.database.name, this.meta.table.name, key);
    };
    /**
     * Called after the filters in the filter service have changed.
     * Defaults to calling setupFilters() then executeQueryChain()
     */
    BaseNeonComponent.prototype.handleFiltersChangedEvent = function () {
        this.setupFilters();
        this.executeQueryChain();
    };
    /**
     * Handles updates that come through the data channel
     * @param event
     */
    BaseNeonComponent.prototype.onUpdateDataChannelEvent = function (event) {
        // TODO
    };
    /**
     * Handles changes in the active database
     */
    BaseNeonComponent.prototype.handleChangeDatabase = function () {
        this.initTables();
        this.logChangeAndStartQueryChain();
    };
    /**
     * Handles changes in the active table
     */
    BaseNeonComponent.prototype.handleChangeTable = function () {
        this.initFields();
        this.logChangeAndStartQueryChain();
    };
    /**
     * If not initializing, calls executeQueryChain();
     */
    BaseNeonComponent.prototype.logChangeAndStartQueryChain = function () {
        if (!this.initializing) {
            this.executeQueryChain();
        }
    };
    /**
     * Check that the local filter column name and value are not null/empty
     * @return {boolean}
     */
    BaseNeonComponent.prototype.hasUnsharedFilter = function () {
        return this.meta.unsharedFilterField &&
            this.meta.unsharedFilterField.columnName !== '' &&
            this.meta.unsharedFilterValue &&
            this.meta.unsharedFilterValue.trim() !== '';
    };
    /**
     * Returns true of there is a valid color field set fot he visualization
     * @return {boolean}
     */
    BaseNeonComponent.prototype.hasColorField = function () {
        return this.meta.colorField && this.meta.colorField.columnName !== '';
    };
    /**
     * Remove a filter from neon, and optionally requery and/or refresh
     * @param name the filter name
     * @param shouldRequery
     * @param shouldRefresh
     */
    BaseNeonComponent.prototype.removeLocalFilterFromLocalAndNeon = function (filter, shouldRequery, shouldRefresh) {
        var _this = this;
        // If we are removing a filter, assume its both local and neon so it should be removed in both
        this.filterService.removeFilter(this.messenger, filter.id, function (removedFilter) {
            if (removedFilter) {
                _this.removeFilter(removedFilter);
            }
            else {
                // No filter removed means undefined or old ID. Pass this back to remove itself.
                _this.removeFilter(filter);
            }
            if (shouldRequery) {
                _this.executeQueryChain();
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
    BaseNeonComponent.prototype.getButtonText = function () {
        return '';
    };
    /**
     * Publishes the given ID to the select_id event.
     *
     * @arg {(number|string)} id
     * @fires select_id
     */
    BaseNeonComponent.prototype.publishSelectId = function (id) {
        this.messenger.publish('select_id', {
            database: this.meta.database.name,
            table: this.meta.table.name,
            id: id
        });
    };
    /**
     * Subscribes the given callback function to the select_id event.
     *
     * @arg {function} callback
     * @listens select_id
     */
    BaseNeonComponent.prototype.subscribeToSelectId = function (callback) {
        this.messenger.subscribe('select_id', callback);
    };
    BaseNeonComponent.prototype.getPrimaryThemeColor = function () {
        var elems = document.getElementsByClassName('coloraccessor'), style;
        if (!elems.length) {
            style = 'rgb(255, 255, 255)';
        }
        else {
            style = window.getComputedStyle(elems[0], null).getPropertyValue('color');
        }
        return style && Color.fromRgbString(style);
    };
    BaseNeonComponent.prototype.getComputedStyle = function (nativeElement) {
        return window.getComputedStyle(nativeElement, null);
    };
    /**
     * Returns whether the given item is a number.
     *
     * @arg {any} item
     * @return {boolean}
     */
    BaseNeonComponent.prototype.isNumber = function (item) {
        return !isNaN(parseFloat(item)) && isFinite(item);
    };
    /**
     * Returns the prettified string of the given integer (with commas).
     *
     * @arg {number} item
     * @return {string}
     */
    BaseNeonComponent.prototype.prettifyInteger = function (item) {
        return item.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };
    return BaseNeonComponent;
}());
export { BaseNeonComponent };
//# sourceMappingURL=base-neon.component.js.map