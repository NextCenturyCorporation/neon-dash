import { Component, OnInit, OnDestroy, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef, Injector } from '@angular/core';
import { TextCloud, TextCloudOptions, SizeOptions, ColorOptions } from './text-cloud-namespace';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';
import { ThemesService } from '../../services/themes.service';
import { FieldMetaData } from '../../dataset';
import { neonMappings } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import {BaseNeonComponent} from '../base-neon-component/base-neon.component';
import {VisualizationService} from '../../services/visualization.service';

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
        unsharedFilterValue: string,
        sizeField: string,
        limit: number
    };
    public active: {
        dataField: FieldMetaData,
        sizeField: FieldMetaData,
        andFilters: boolean,
        limit: number,
        textColor: string,
        allowsTranslations: boolean,
        filterable: boolean,
        data: any[]
    };

    constructor(connectionService: ConnectionService, datasetService: DatasetService, filterService: FilterService,
        exportService: ExportService, injector: Injector, themesService: ThemesService, ref: ChangeDetectorRef,
                visualizationService: VisualizationService) {
        super(connectionService, datasetService, filterService, exportService, injector, themesService, ref, visualizationService);
        this.optionsFromConfig = {
            title: this.injector.get('title', null),
            database: this.injector.get('database', null),
            table: this.injector.get('table', null),
            dataField: this.injector.get('dataField', null),
            unsharedFilterField: this.injector.get('unsharedFilterField', null),
            unsharedFilterValue: this.injector.get('unsharedFilterValue', null),
            sizeField: this.injector.get('sizeField', null),
            limit: this.injector.get('limit', -1)
        };
        this.filters = [];
        this.active = {
            dataField: new FieldMetaData(),
            sizeField: new FieldMetaData(),
            andFilters: true,
            limit: this.optionsFromConfig.limit > 0 ? this.optionsFromConfig.limit : 40,
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

    subGetBindings(bindings: any) {
        bindings.dataField = this.active.dataField.columnName;
        bindings.sizeField = this.active.sizeField.columnName;
    }

    getExportFields() {
        let countField = this.active.sizeField.prettyName === '' ? 'Count' :
            this.active.sizeField.prettyName;
        return [{
            columnName: this.active.dataField.columnName,
            prettyName: this.active.dataField.prettyName
        }, {
            columnName: 'value',
            prettyName: countField
        }];
    }

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
        let sizeField = this.findFieldObject('sizeField', neonMappings.TAGS);
        this.active = this.updateObject(this.active, 'dataField', dataField);
        this.active = this.updateObject(this.active, 'sizeField', sizeField);
        this.meta = Object.assign({}, this.meta); //trigger action
    };

    addLocalFilter(filter) {
        //this.filters.push(filter);
        this.filters = this.updateArray(this.filters, filter);
    };

    createNeonFilterClauseEquals(_databaseAndTableName: {}, fieldName: string) {
        let filterClauses = this.filters.map((filter) => {
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

        // Check for an unshared filter
        if (this.hasUnsharedFilter()) {
            whereClause = neon.query.where(this.meta.unsharedFilterField.columnName, '=', this.meta.unsharedFilterValue);
        }

        if (this.active.sizeField.columnName === '') {
            // Normal aggregation query
            return query.where(whereClause).groupBy(dataField).aggregate(neon.query['COUNT'], '*', 'value')
                .sortBy('value', neon.query['DESCENDING']).limit(this.active.limit);
        } else {
            // Query for data with the size field and sort by it
            let sizeColumn = this.active.sizeField.columnName;
            return query.where(neon.query.and(whereClause, neon.query.where(sizeColumn, '!=', null)))
                .groupBy(dataField).aggregate(neon.query['AVG'], sizeColumn, sizeColumn)
                .sortBy(sizeColumn, neon.query['DESCENDING']).limit(this.active.limit);
        }
    };

    getFiltersToIgnore() {
        return null;
    }

    onQuerySuccess(response): void {
        let data = response.data;
        let cloudData = data || [];
        let useSizeField: boolean = this.active.sizeField.columnName !== '';

        let activeData = cloudData.map((item) => {
            item.key = item[this.active.dataField.columnName];
            item.keyTranslated = item.key;
            // If we have a size field, asign the value to the value field
            if (useSizeField) {
                item.value = item[this.active.sizeField.columnName];
            }
            return item;
        });
        this.active = this.updateObject(this.active, 'data', activeData);
        this.refreshVisualization();
        this.queryTitle = 'Text Cloud by ' + this.active.dataField.prettyName;
        if (useSizeField) {
            this.queryTitle += ' and ' + this.active.sizeField.prettyName;
        }
    }

    setupFilters() {
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
    }

    isFilterSet(): boolean {
        return this.filters.length > 0;
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

    unsharedFilterChanged() {
        // Update the data
        this.executeQueryChain();
    }

    unsharedFilterRemoved() {
        // Update the data
        this.executeQueryChain();
    }

}
