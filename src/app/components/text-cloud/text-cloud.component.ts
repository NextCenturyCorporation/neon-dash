import { Component, OnInit, OnDestroy, ViewEncapsulation, ChangeDetectionStrategy, Injector } from '@angular/core';
import { TextCloud, TextCloudOptions, SizeOptions, ColorOptions } from './text-cloud-namespace';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';
import { TranslationService } from '../../services/translation.service';
import { FieldMetaData, TableMetaData, DatabaseMetaData } from '../../dataset';
import { neonMappings } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import * as _ from 'lodash';

@Component({
    selector: 'app-text-cloud',
    templateUrl: './text-cloud.component.html',
    styleUrls: ['./text-cloud.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.Default
})
export class TextCloudComponent implements OnInit, OnDestroy {

    private queryTitle: string;
    private textCloud: TextCloud;
    private messenger: neon.eventing.Messenger;
    private outstandingDataQuery: Object;
    private filters: any[];
    private errorMessage: string;
    private initializing: boolean;
    private translationsOn: boolean;
    private exportId: number;

    private languages: {
        fromLanguageOptions: Object,
        toLanguageOptions: Object
    };
    private bindings: {
        title: string,
        database: string,
        table: string,
        dataField: string,
        unsharedFilterField: Object,
        unsharedFilterValue: string
    };
    private active: {
        dataField: FieldMetaData,
        andFilters: boolean,
        limit: number,
        textColor: string,
        allowsTranslations: boolean,
        filterable: boolean,
        layers: any[],
        databases: DatabaseMetaData[],
        database: DatabaseMetaData,
        tables: TableMetaData[],
        table: TableMetaData,
        unsharedFilterField: Object,
        unsharedFilterValue: string,
        fields: FieldMetaData[],
        data: Object[]
    };

    constructor(private connectionService: ConnectionService, private datasetService: DatasetService,
        private filterService: FilterService, private exportService: ExportService, private translationService: TranslationService,
        private injector: Injector) {
        this.bindings = {
            title: this.injector.get('title', null),
            database: this.injector.get('database', null),
            table: this.injector.get('table', null),
            dataField: this.injector.get('dataField', null),
            unsharedFilterField: {},
            unsharedFilterValue: ''
        };
        this.messenger = new neon.eventing.Messenger();
        this.filters = [];
        this.translationsOn = false;
        this.active = {
            dataField: new FieldMetaData(),
            andFilters: true,
            limit: 40,
            textColor: '#111',
            allowsTranslations: true,
            filterable: true,
            layers: [],
            databases: [],
            database: new DatabaseMetaData(),
            tables: [],
            table: new TableMetaData(),
            unsharedFilterField: {},
            unsharedFilterValue: '',
            fields: [],
            data: []
        };
    };

    ngOnInit() {
        this.initializing = true;

        this.messenger.subscribe(DatasetService.UPDATE_DATA_CHANNEL, this.runDefaultQueryAndUpdate.bind(this));
        this.messenger.events({
            filtersChanged: this.handleFiltersChangedEvent
        });

        this.exportId = this.exportService.register(this.getExportData);
        // this.themesService.registerListener(this.visualizationId, this.handleThemeChangedEvent);
        // this.visualizationService.register(this.stateId, this.getBindings);

        if (this.active.allowsTranslations && this.translationService.hasKey()) {
            this.translationsOn = true;
            this.translationService.getSupportedLanguages((languages: Object) => {
                this.languages.fromLanguageOptions = languages;
                this.languages.toLanguageOptions = languages;
            }, (/*response*/) => {
                if (this.errorMessage) {
                    // errorNotificationService.hideErrorMessage($scope.errorMessage);
                    this.errorMessage = undefined;
                }
                this.errorMessage = 'Error'; // errorNotificationService.showErrorMessage($scope.element,
                                            // response.message,  response.reason);
            });
        }

        // TODO: Resize??
        /*
            $scope.element.resize(resize);
            $scope.element.find('.headers-container').resize(resizeDisplay);
            $scope.element.find('.options-menu-button').resize(resizeTitle);
            resize();
        */

        this.outstandingDataQuery = {};
        let me = this;
        this.datasetService.getDatabases().forEach((database) => {
            me.outstandingDataQuery[database.name] = {};
        });

        this.initData();

        if (this.getDataLayers()) {
            this.checkNeonDashboardFilters({ queryAndUpdate: true });
        }
        this.updateTextCloudSettings();

        this.initializing = false;
    };

    ngOnDestroy() {
        /* XDATA.userALE.log({
            activity: 'remove',
            action: 'remove',
            elementId: $scope.type,
            elementType: $scope.logElementType,
            elementSub: $scope.type,
            elementGroup: $scope.logElementGroup,
            source: 'system',
            tags: ['remove', $scope.type]
        }); */

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
    };

    updateTextCloudSettings() {
        let options = new TextCloudOptions(new SizeOptions(130, 250, '%'),
            new ColorOptions('#aaaaaa', this.active.textColor));
        this.textCloud = new TextCloud(options);
    };


    initData() {
        this.updateDatabases();
    };

    updateDatabases() {
        this.active.databases = this.datasetService.getDatabases();
        this.active.database = this.active.databases[0];

        if (this.active.databases.length > 0) {
            if (this.bindings.database) {
                this.active.databases.forEach(function(database) {
                    if (this.bindings.database === database.name) {
                        this.active.database = database;
                    }
                });
            }

            this.updateTables();
        }
    };

    updateTables() {
        this.active.tables = this.datasetService.getTables(this.active.database['name']);
        this.active.table = this.active.tables[0];

        if (this.active.tables.length > 0) {
            if (this.bindings.table) {
                this.active.tables.forEach(function(table) {
                    if (this.bindings.table === table.name) {
                        this.active.table = table;
                    }
                });
            }

            this.updateFields();
        }
    };

    updateFields() {
        // Sort the fields that are displayed in the dropdowns in the options menus alphabetically.
        this.active.fields = this.datasetService.getSortedFields(this.active.database['name'], this.active.table['name']);

        this.active.unsharedFilterField = this.findFieldObject('unsharedFilterField');
        this.active.unsharedFilterValue = this.bindings.unsharedFilterValue || '';

        this.onUpdateFields();
    };

    onUpdateFields() {
        this.active.dataField = this.findFieldObject('dataField', neonMappings.TAGS);
    };

    checkNeonDashboardFilters(options: { databaseName?: string, tableName?: string, queryAndUpdate?: boolean}) {
        let neonFilters = [];
        let neonFilterFields = [];
        let me = this;

        // Check for Neon filters on all filterable database/table/field combinations in the layers.
        let data = this.findFilterData();
        data.forEach(function(item) {
            let neonFiltersForItem = me.filterService.getFilters(item['database'], item['table'], item['fields']);
            if (neonFiltersForItem.length) {
                neonFilters = neonFilters.concat(neonFiltersForItem);
                neonFilterFields.push(item['fields']);
            }
        });

        // If some of the filtered data in this visualization do not have any Neon filters set, remove the filter from this
        // visualization if it is set. Note for single layer visualizations that this will always be true if a filter
        // is set in this visualization but not in the Neon dashboard.
        if ((!neonFilters.length || neonFilters.length < data.length) && this.isFilterSet()) {
            me.removeFilterValues();
            me.runDefaultQueryAndUpdate();
            return;
        }

        // If all filtered data in this visualization have the same Neon filters that are compatible with this visualization,
        // update the filter in this visualization. Note for single layer visualizations that this will always be true if
        // a filter is set in the Neon dashboard.
        if (neonFilters.length && neonFilters.length === data.length) {
            // Use the first element of the filter arrays because they should all be the same (or equivalent).
            me.updateFilterValues(neonFilters[0]);
            me.runDefaultQueryAndUpdate();
            return;
        }

        if (options.queryAndUpdate) {
            me.runDefaultQueryAndUpdate(options.databaseName, options.tableName);
        }
    };

    findFilterData(databaseName?: string, tableName?: string, fields?: string[], layers?: Object[], ignoreFilter?: boolean): Object[] {
        let data = [];
        let me = this;

        (layers || me.getDataLayers()).forEach(function(layer) {
            if (!layer['new'] && (layer['filterable'] || ignoreFilter) &&
                ((databaseName && tableName) ?
                    (databaseName === layer['database'].name && tableName === layer['table']['name']) : true)) {
                let valid = (fields || me.getFilterFields()).every(function(field: FieldMetaData) {
                    return me.datasetService.isFieldValid(field);
                });

                if (valid) {
                    // Check whether the database/table/filter fields for this layer already exist in the data.
                    let fieldNames = (fields || me.getFilterFields()).map(function(field: FieldMetaData) {
                        return field.columnName;
                    });
                    let index = _.findIndex(data, {
                        database: layer['database']['name'],
                        table: layer['table']['name'],
                        fields: fieldNames
                    });

                    if (index < 0) {
                        data.push({
                            database: layer['database']['name'],
                            table: layer['table']['name'],
                            fields: fieldNames,
                            layers: [layer]
                        });
                    } else {
                        data[index].layers.push(layer);
                    }
                }
            }
        });

        return data;
    };

    getDataLayers(): Object[] {
        return [this.active];
    };

    getFilterFields(): Object[] {
        return [this.active.dataField];
    };

    isFilterSet(): boolean {
        return this.filters.length > 0;
    };

    removeFilterValues () {
        this.filters = [];
        // this.removeLinks(this.active.dataField);
    };

    createTitle(resetQueryTitle?: boolean): string {
        if (resetQueryTitle) {
            this.queryTitle = '';
        }
        if (this.queryTitle) {
            return this.queryTitle;
        }
        if (this.bindings.title) {
            return this.bindings.title;
        }
        let title = this.active.unsharedFilterValue ? this.active.unsharedFilterValue + ' ' : '';
        if (_.keys(this.active).length) {
            return title + (this.active.table && this.active.table.name ? this.active.table.prettyName : '');
        }
        return title;
    };

    runDefaultQueryAndUpdate(databaseName?: string, tableName?: string) {
        // Save the title during the query so the title doesn't change immediately if the user changes the unshared filter.
        this.queryTitle = this.createTitle(true);

        // Resize the title and display after the error is hidden and the title is changed.
        // this.resize();

        this.queryAndUpdate(
            this.findQueryAndUpdateData(databaseName, tableName),
            0, this.addToQuery.bind(this), this.executeQuery.bind(this), this.updateData.bind(this));
    };

    updateFilterValues(neonFilter) {
        this.filters = [];
        if (this.getNumberOfFilterClauses(neonFilter) === 1) {
            this.addFilterValue(neonFilter.filter.whereClause.rhs);
        } else {
            let me = this;
            neonFilter.filter.whereClause.whereClauses.forEach(function(whereClause) {
                me.addFilterValue(whereClause.rhs);
            });
        }
    };

    updateNeonFilter(options?: any) {
        let args = options || {};
        this.addFiltersForData(
            this.findFilterData(args.databaseName, args.tableName, args.fields),
            0, args.createNeonFilterClause || this.createNeonFilterClause.bind(this), args.queryAfterFilter, args.callback);
    };

    createNeonFilterClause(_databaseAndTableName: {}, fieldName: string) {
        var filterClauses = this.filters.map(function(filter) {
            return neon.query.where(fieldName, "=", filter.value);
        });
        if(filterClauses.length === 1) {
            return filterClauses[0];
        }
        if(this.active.andFilters) {
            return neon.query.and.apply(neon.query, filterClauses);
        }
        return neon.query.or.apply(neon.query, filterClauses);
    };

    addFiltersForData(data: any, index: number, createNeonFilterClauseFunction: () => {},
        queryAfterFilter?: boolean, callback?:  () => {}) {
        var me = this;
        if(!data.length || index >= data.length) {
            data.forEach(function(item) {
                me.runDefaultQueryAndUpdate(item.database, item.table);
            });

            if(callback) {
                callback();
            }

            return;
        }

        var item = data[index];
        this.filterService.addFilter(this.messenger, item.database, item.table, item.fields, createNeonFilterClauseFunction, {
            visName: 'Text Cloud',
            text: this.createFilterTrayText()
        }, function() {
            /*XDATA.userALE.log({
                activity: "select",
                action: "click",
                elementId: $scope.type,
                elementType: $scope.logElementType,
                elementSub: $scope.type,
                elementGroup: $scope.logElementGroup,
                source: "user",
                tags: ["filter", $scope.type]
            });*/
            me.addFiltersForData(data, ++index, createNeonFilterClauseFunction, queryAfterFilter, callback);
        });
    };

    createFilterTrayText() {
        return (_.map(this.filters, (this.active.allowsTranslations ? "translated" : "value"))).join(", ");
    };

    getNumberOfFilterClauses(neonFilter: neon.query.Filter): number {
        return this.filterService.hasSingleClause(neonFilter) ? 1 : this.filterService.getMultipleClausesLength(neonFilter);
    };

    addFilter(value: string, translated: string) {
        let index = _.findIndex(this.filters, { value: value });
        if (index < 0) {
            this.addFilterValue(value, translated);
            this.updateNeonFilter();
        }
    };

    addFilterValue(value: string, translated?: string) {
        this.filters.push({
            translated: translated || value,
            value: value
        });
        // $scope.showLinksPopupButton = !!($scope.functions.createLinks($scope.active.dataField, value).length);
    };

    addToQuery(query: neon.query.Query, unsharedFilterWhereClause: neon.query.WhereClause): neon.query.Query {
        let whereClause = neon.query.where(this.active.dataField.columnName, '!=', null);
        return query.where(unsharedFilterWhereClause ? neon.query.and(whereClause, unsharedFilterWhereClause) : whereClause)
            .groupBy(this.active.dataField.columnName).aggregate(neon.query['COUNT'], '*', 'count')
            .sortBy('count', neon.query['DESCENDING'])
            .limit(this.active.limit).enableAggregateArraysByElement();
    };

    updateData(data: any[]) {
        let cloudData = data || [];

        if (this.isFilterSet() && this.active.andFilters) {
            cloudData = cloudData.filter((item) => {
                let index = _.findIndex(this.filters, { value: item[this.active.dataField.columnName] });
                return index === -1;
            });
        }

        this.active.data = cloudData.map((item) => {
            item.key = item[this.active.dataField.columnName];
            item.keyTranslated = item.key;
            return item;
        });

        if (this.active.allowsTranslations) {
            // this.performTranslation();
        }

        this.createTextCloud();
    };

    createTextCloud() {
        this.active.data = this.textCloud.createTextCloud(this.active.data);
    };

    executeQuery(connection: neon.query.Connection, query: neon.query.Query): any {
        return connection.executeQuery(query, null);
    };

    findQueryAndUpdateData(databaseName?: string, tableName?: string): any[] {
        let data = [];
        this.getDataLayers().forEach(function(layer) {
            if (!layer['new'] &&
                ((databaseName && tableName) ?
                    (layer['database']['name'] === databaseName && layer['table']['name'] === tableName) : true)) {
                if (layer['database'] && layer['table']) {
                    data.push({
                        database: layer['database']['name'],
                        table: layer['table']['name'],
                        layers: [layer]
                    });
                }
            }
        });

        return data;
    };

    queryAndUpdate = function(data: any[], index: number, addToQueryFunction: Function,
        executeQueryFunction: Function, updateDataFunction: Function) {
        if (!data.length || index >= data.length) {
            return;
        }

        let me = this;
        let item = data[index];

        if (index < 0) {
            if (this.errorMessage) {
                // errorNotificationService.hideErrorMessage($scope.errorMessage);
                this.errorMessage = undefined;
            }

            // Remove all data in the affected layers from the display.
            updateDataFunction(null, item.layers);
        }

        let connection = this.connectionService.getActiveConnection();

        if (!connection || !this.datasetService.isFieldValid(this.active.dataField)) {
            return;
        }

        let query = this.buildQuery(item.layers, item.database, item.table, addToQueryFunction);

        /* XDATA.userALE.log({
            activity: 'alter',
            action: 'send',
            elementId: $scope.type,
            elementType: $scope.logElementType,
            elementSub: $scope.type,
            elementGroup: $scope.logElementGroup,
            source: 'system',
            tags: ['query', $scope.type]
        }); */

        // Cancel any previous data query currently running.
        if (this.outstandingDataQuery[item.database] && this.outstandingDataQuery[item.database][item.table]) {
            this.outstandingDataQuery[item.database][item.table].abort();
        }

        // Execute the data query, calling the function defined in 'done' or 'fail' as needed.
        this.outstandingDataQuery[item.database][item.table] = executeQueryFunction(connection, query);

        // Visualizations that do not execute data queries will not return a query object.
        if (!this.outstandingDataQuery[item.database][item.table]) {
            updateDataFunction([], item.layers);
            return;
        }

        this.outstandingDataQuery[item.database][item.table].always(function() {
            me.outstandingDataQuery[item.database][item.table] = undefined;
        });

        this.outstandingDataQuery[item.database][item.table].done(function(response) {
            /* XDATA.userALE.log({
                activity: 'alter',
                action: 'receive',
                elementId: $scope.type,
                elementType: $scope.logElementType,
                elementSub: $scope.type,
                elementGroup: $scope.logElementGroup,
                source: 'system',
                tags: ['receive', $scope.type]
            }); */

            // The response for an array-counts query is an array and the response for other queries is
            // an object containing a data array.
            updateDataFunction(response.data || response, item.layers);
            me.queryAndUpdate(data, ++index, addToQueryFunction, executeQueryFunction, updateDataFunction);
            /* XDATA.userALE.log({
                activity: 'alter',
                action: 'render',
                elementId: $scope.type,
                elementType: $scope.logElementType,
                elementSub: $scope.type,
                elementGroup: $scope.logElementGroup,
                source: 'system',
                tags: ['render', $scope.type]
            }); */
        });

        this.outstandingDataQuery[item.database][item.table].fail(function(response) {
            if (response.status === 0) {
                /* XDATA.userALE.log({
                    activity: 'alter',
                    action: 'canceled',
                    elementId: $scope.type,
                    elementType: $scope.logElementType,
                    elementSub: $scope.type,
                    elementGroup: $scope.logElementGroup,
                    source: 'system',
                    tags: ['canceled', $scope.type]
                }); */
            } else {
                /* XDATA.userALE.log({
                    activity: 'alter',
                    action: 'failed',
                    elementId: $scope.type,
                    elementType: $scope.logElementType,
                    elementSub: $scope.type,
                    elementGroup: $scope.logElementGroup,
                    source: 'system',
                    tags: ['failed', $scope.type]
                }); */

                updateDataFunction([], item.layers);
                me.queryAndUpdate(data, ++index, addToQueryFunction, executeQueryFunction, updateDataFunction);

                // See if the error response contains a Neon notification to show through the Error Notification Service.
                if (response.responseJSON) {
                    me.errorMessage = 'Error'; // errorNotificationService.showErrorMessage($scope.element,
                                               // response.responseJSON.error, response.responseJSON.stackTrace);
                }
            }
        });
    };

    buildQuery(layers: any[], databaseName: string, tableName: string, addToQueryFunction?: Function): neon.query.Query {
        let query = new neon.query.Query().selectFrom(databaseName, tableName);

        let unsharedFilterField;
        let unsharedFilterValue;
        // If queryByTable is true, the unshared filter will be the same for all layers with the same database and table.
        // Otherwise, buildQuery will be called on each layer individually so the layers array will have a single item.
        if (layers.length && this.datasetService.isFieldValid(layers[0].unsharedFilterField) && layers[0].unsharedFilterValue) {
            unsharedFilterField = layers[0].unsharedFilterField;
            unsharedFilterValue = layers[0].unsharedFilterValue;
        }

        let unsharedFilterWhereClause;
        if (unsharedFilterField && unsharedFilterValue) {
            let operator = 'contains';
            if (_.isString(unsharedFilterValue) && !isNaN(Number(unsharedFilterValue))) {
                operator = '=';
                unsharedFilterValue = parseFloat(unsharedFilterValue);
            }
            unsharedFilterWhereClause = neon.query.where(unsharedFilterField.columnName, operator, unsharedFilterValue);
        }

        if (unsharedFilterWhereClause) {
            query.where(unsharedFilterWhereClause);
        }

        return addToQueryFunction ? addToQueryFunction(query, unsharedFilterWhereClause, layers) :
            this.addToQuery(query, unsharedFilterWhereClause);
    };

    findFieldObject(bindingKey: string, mappingKey?: string): FieldMetaData {
        let me = this;
        let find = function(name) {
            return _.find(me.active.fields, function(field) {
                return field['columnName'] === name;
            });
        };

        let field;
        if (bindingKey) {
            field = find(this.bindings[bindingKey]);
        }

        if (!field && mappingKey) {
            field = find(this.getMapping(mappingKey));
        }

        return field || this.datasetService.createBlankField();
    };

    getMapping = function(key: string): string {
        return this.datasetService.getMapping(this.active.database.name, this.active.table.name, key);
    };

    handleFiltersChangedEvent() {};

    getExportData() {};

    handleChangeDatabase() {
        this.updateTables();
        this.logChangeAndUpdate(); // ('database', this.active.database.name);
    };

    handleChangeTable() {
        this.updateFields();
        this.logChangeAndUpdate(); // ('table', this.active.table.name);
    };

    handleChangeDataField() {
        this.logChangeAndUpdate(); // ('dataField', this.active.dataField.columnName);
    };

    handleChangeLimit() {
        this.active.limit = this.active.limit || 1;
        this.logChangeAndUpdate(); // ('limit', this.active.limit, 'button');
    };

    handleChangeAndFilters() {
        this.logChangeAndUpdate(); // ('andFilters', this.active.andFilters, 'button');
        // this.updateNeonFilter();
    };

    handleChangeUnsharedFilterField() {
        this.active.unsharedFilterValue = '';
        // this.logChange('unsharedFilterField', this.active.unsharedFilterField.columnName);
    };

    handleRemoveUnsharedFilter() {
        this.active.unsharedFilterValue = '';
        this.logChangeAndUpdate(); // ('unsharedFilter', '', 'button');
    };

    handleChangeUnsharedFilterValue() {
        this.logChangeAndUpdate(); // ('unsharedFilterValue', this.active.unsharedFilterValue);
    };

    logChangeAndUpdate() { // (option: string, value: any, type?: string) { 
        // this.logChange(option, value, type);
        if (!this.initializing) {
            this.checkNeonDashboardFilters({ queryAndUpdate: true });
        }
    };

    getButtonText() {
        return !this.isFilterSet() && !this.active.data.length ? 'No Data' : 'Top ' + this.active.data.length;
    };

    requestExport() {
        let connection = this.connectionService.getActiveConnection();
        if (!connection) {
            // This is temporary. Come up with better code for if there isn't a connection.
            return;
        }
        let data = this.createExportDataObject();
        connection.executeExport(data, this.exportSuccess, this.exportFail, this.exportService.getFileFormat());
    };

    createExportDataObject() {
        let finalObject = {
            name: 'Text_Cloud',
            data: [{
                database: this.active.database.name,
                table: this.active.table.name,
                field: this.active.dataField.columnName,
                limit: this.active.limit,
                name: 'textCloud-' + this.exportId,
                fields: [],
                type: 'arraycount'
            }]
        };
        finalObject.data[0].fields.push({
            query: this.active.dataField.columnName,
            pretty: this.active.dataField.columnName
        });
        finalObject.data[0].fields.push({
            query: 'count',
            pretty: 'count'
        });
        return finalObject;
    };

    exportSuccess(queryResults: any) {
        window.location.assign('/neon/services/exportservice/generateZip/' + queryResults.data);
    };

    exportFail (response: any) {
        if (response.responseJSON) {
            this.errorMessage = 'Error'; // errorNotificationService.showErrorMessage($element,
                                        // response.responseJSON.error, response.responseJSON.stackTrace);
        }
    };

}
