import { Component, OnInit, OnDestroy, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef, Injector } from '@angular/core';
import { TextCloud, TextCloudOptions, SizeOptions, ColorOptions } from './text-cloud-namespace';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';
//import { TranslationService } from '../../services/translation.service';
import { ThemesService } from '../../services/themes.service';
import { FieldMetaData } from '../../dataset';
import { neonMappings } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import * as _ from 'lodash';
import {BaseNeonComponent} from '../base-neon-component/base-neon.component';

@Component({
    selector: 'app-text-cloud',
    templateUrl: './text-cloud.component.html',
    styleUrls: ['./text-cloud.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextCloudComponent extends BaseNeonComponent implements OnInit, OnDestroy {
    private textCloud: TextCloud;
    private filters: any[];

    private optionsFromConfig: {
        title: string,
        database: string,
        table: string,
        dataField: string,
        unsharedFilterField: any,
        unsharedFilterValue: string
    };
    public active: {
        dataField: FieldMetaData,
        andFilters: boolean,
        limit: number,
        textColor: string,
        allowsTranslations: boolean,
        filterable: boolean,
        data: any[]
    };

    constructor(connectionService: ConnectionService, datasetService: DatasetService, filterService: FilterService,
        exportService: ExportService, injector: Injector, themesService: ThemesService, ref: ChangeDetectorRef) {
        super(connectionService, datasetService, filterService, exportService, injector, themesService, ref);
        this.optionsFromConfig = {
            title: this.injector.get('title', null),
            database: this.injector.get('database', null),
            table: this.injector.get('table', null),
            dataField: this.injector.get('dataField', null),
            unsharedFilterField: {},
            unsharedFilterValue: ''
        };
        this.filters = [];
        this.active = {
            dataField: new FieldMetaData(),
            andFilters: true,
            limit: 40,
            textColor: '#111',
            allowsTranslations: true,
            filterable: true,
            data: []
        };
        this.queryTitle = 'Text Cloud';
    };

    subNgOnInit() {
        this.updateTextCloudSettings();
    };

    postInit() {

    };

    subNgOnDestroy() {
        //Do nothing
    };

    getOptionFromConfig(field) {
        return this.optionsFromConfig[field];
    };

    updateTextCloudSettings() {
        let options = new TextCloudOptions(new SizeOptions(130, 250, '%'),
            new ColorOptions('#aaaaaa', this.active.textColor));
        this.textCloud = new TextCloud(options);
    };

    updateObject(prev, field, value) {
        let obj = Object.assign({}, prev);
        obj[field] = value;
        return obj;
    }

    updateArray(arr, add) {
        let newArr = arr.slice();
        newArr.push(add);
        return newArr;
    }

    onUpdateFields() {
        let dataField = this.findFieldObject('dataField', neonMappings.TAGS);
        this.active = this.updateObject(this.active, 'dataField', dataField);
        this.meta = Object.assign({}, this.meta); //trigger action
    };

    addLocalFilter(filter) {
        //this.filters.push(filter);
        this.filters = this.updateArray(this.filters, filter);
    };

    createNeonFilterClauseEquals(_databaseAndTableName: {}, fieldName: string) {
        let filterClauses = this.filters.map(function(filter) {
            return neon.query.where(fieldName, '=', filter.value);
        });
        if (filterClauses.length === 1) {
            return filterClauses[0];
        }
        if (this.active.andFilters) {
            return neon.query.and.apply(neon.query, filterClauses);
        }
        return neon.query.or.apply(neon.query, filterClauses);
    };

    getNeonFilterFields(): string[] {
        return [this.active.dataField.columnName];
    }

    getVisualizationName(): string {
        return 'Bar Chart';
    }

    refreshVisualization() {
        this.createTextCloud();
    }

    getFilterText(filter) {
        return filter.value;
    }

    isValidQuery() {
        let valid = true;
        valid = (this.meta.database && this.meta.database.name && valid);
        valid = (this.meta.table && this.meta.table.name && valid);
        valid = (this.active.dataField && this.active.dataField.columnName && valid);
        return valid;
    }

    createQuery(): neon.query.Query {
        let databaseName = this.meta.database.name;
        let tableName = this.meta.table.name;
        let query = new neon.query.Query().selectFrom(databaseName, tableName);
        let whereClause = neon.query.where(this.active.dataField.columnName, '!=', null);
        let dataField = this.active.dataField.columnName;
        return query.where(whereClause).groupBy(dataField).aggregate(neon.query['COUNT'], '*', 'value')
            .sortBy('value', neon.query['DESCENDING']).limit(this.active.limit);
    };

    getFiltersToIgnore() {
        return null;
    }

    onQuerySuccess(response): void {
        let data = response.data;
        let cloudData = data || [];
        let activeData = cloudData.map((item) => {
            item.key = item[this.active.dataField.columnName];
            item.keyTranslated = item.key;
            return item;
        });
        this.active = this.updateObject(this.active, 'data', activeData);
        this.refreshVisualization();
        this.queryTitle = this.optionsFromConfig.title;
    }

    handleFiltersChangedEvent() {
        // Get neon filters
        // See if any neon filters are local filters and set/clear appropriately
        let database = this.meta.database.name;
        let table = this.meta.table.name;
        let fields = [this.active.dataField.columnName];
        let neonFilters = this.filterService.getFilters(database, table, fields);
        if (neonFilters && neonFilters.length > 0) {
            for (let filter of neonFilters) {
                let key = filter.filter.whereClause.lhs;
                let value = filter.filter.whereClause.rhs;
                let f = {
                    key: key,
                    value: value,
                    prettyKey: key
                };
                if (this.filterIsUnique(f)) {
                    this.addLocalFilter(f);
                }
            }
        } else {
            this.filters = [];
        }
        this.executeQueryChain();
    };

    getDataLayers(): any[] {
        return [this.active];
    };

    getFilterFields(): any[] {
        return [this.active.dataField];
    };

    isFilterSet(): boolean {
        return this.filters.length > 0;
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



    createFilterTrayText() {
        return (_.map(this.filters, (this.active.allowsTranslations ? 'translated' : 'value'))).join(', ');
    };

    getNumberOfFilterClauses(neonFilter: neon.query.Filter): number {
        return this.filterService.hasSingleClause(neonFilter) ? 1 : this.filterService.getMultipleClausesLength(neonFilter);
    };

    onClick(item) {
        let value = item.key;
        let key = this.active.dataField.columnName;
        let prettyKey = this.active.dataField.prettyName;
        let filter = {
            key: key,
            value: value,
            prettyKey: prettyKey
        };
        if (this.filterIsUnique(filter)) {
            this.addLocalFilter(filter);
            this.addNeonFilter(false, filter);
            this.executeQueryChain();
        }
    };

    filterIsUnique(filter) {
        for (let f of this.filters) {
            if (f.value === filter.value && f.key === filter.key) {
                return false;
            }
        }
        return true;
    }

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
         let data = this.textCloud.createTextCloud(this.active.data);
         this.active = this.updateObject(this.active, 'data', data);
         //this.active.data = data;
    };

    handleChangeDataField() {
        this.logChangeAndStartQueryChain(); // ('dataField', this.active.dataField.columnName);
    };

    handleChangeLimit() {
        this.active.limit = this.active.limit || 1;
        this.logChangeAndStartQueryChain(); // ('limit', this.active.limit, 'button');
    };

    handleChangeAndFilters() {
        this.logChangeAndStartQueryChain(); // ('andFilters', this.active.andFilters, 'button');
        // this.updateNeonFilter();
    };

    getButtonText() {
        return !this.isFilterSet() && !this.active.data.length ? 'No Data' : 'Top ' + this.active.data.length;
    };

    getFilterData() {
        return this.filters.map((filter) => {
            return filter.value;
        });
    };

    createFilterDesc(value: string) {
        return this.active.dataField.columnName + ' = ' + value;
    };

    createFilterText(value: string) {
        if (!this.active.allowsTranslations) {
            return value;
        }

        let text = '';
        this.filters.forEach((filter) => {
            if (filter.value === value) {
                text = filter.translated || filter.value;
            }
        });

        return text;
    };

    getRemoveDesc(value: string) {
        return 'Delete Filter ' + this.createFilterDesc(value);
    };

    removeFilter(value: string) {
        let newFilters = [];
        for (let f of this.filters) {
            if (value !== f.value) {
                newFilters.push(f);
            }
        }
        this.filters = newFilters;
    }

    // These methods must be present for AoT compile
    requestExport() {}

    handleChangeUnsharedFilterField() {}

    handleChangeUnsharedFilterValue() {}

    handleRemoveUnsharedFilter() {}

}
