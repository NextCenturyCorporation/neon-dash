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
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    Injector,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { TextCloud, TextCloudOptions, SizeOptions, ColorOptions } from './text-cloud-namespace';
import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';
import { ThemesService } from '../../services/themes.service';
import { FieldMetaData } from '../../dataset';
import { neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { VisualizationService } from '../../services/visualization.service';
import { Color, ColorSchemeService } from '../../services/color-scheme.service';

@Component({
    selector: 'app-text-cloud',
    templateUrl: './text-cloud.component.html',
    styleUrls: ['./text-cloud.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextCloudComponent extends BaseNeonComponent implements OnInit, OnDestroy {
    @ViewChild('visualization', {read: ElementRef}) visualization: ElementRef;
    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;

    private textCloud: TextCloud;

    private filters: {
        id: string,
        key: string,
        value: string,
        translated: string,
        prettyKey: string
    }[];

    private configFilter: {
        use: boolean,
        lhs: string,
        operator: string,
        rhs: string
    };

    public active: {
        dataField: FieldMetaData,
        sizeField: FieldMetaData,
        andFilters: boolean,
        textColor: string,
        allowsTranslations: boolean,
        filterable: boolean,
        data: any[],
        docCount: number
    };

    public sizeAggregationTypes = [
        {name: 'Average', value: 'AVG'},
        {name: 'Maximum', value: 'MAX'},
        {name: 'Minimum', value: 'MIN'},
        {name: 'Sum', value: 'SUM'}
    ];

    public sizeAggregation: string;

    constructor(activeGridService: ActiveGridService, connectionService: ConnectionService, datasetService: DatasetService,
        filterService: FilterService, exportService: ExportService, injector: Injector, themesService: ThemesService,
        ref: ChangeDetectorRef, visualizationService: VisualizationService) {
        super(activeGridService, connectionService, datasetService, filterService,
            exportService, injector, themesService, ref, visualizationService);

        this.configFilter = this.injector.get('configFilter', null);
        this.sizeAggregation = this.injector.get('sizeAggregation', 'AVG');
        this.filters = [];
        this.active = {
            dataField: new FieldMetaData(),
            sizeField: new FieldMetaData(),
            andFilters: true,
            textColor: '#111',
            allowsTranslations: true,
            filterable: true,
            data: [],
            docCount: 0
        };
    }

    subNgOnInit() {
        // Do nothing
    }

    postInit() {
        // This should happen before execute query as #refreshVisualization() depends on this.textCloud
        this.active.textColor = this.getPrimaryThemeColor().toHexString();
        this.updateTextCloudSettings();

        this.executeQueryChain();
    }

    subNgOnDestroy() {
        // Do nothing
    }

    subGetBindings(bindings: any) {
        bindings.dataField = this.active.dataField.columnName;
        bindings.sizeField = this.active.sizeField.columnName;
        bindings.sizeAggregation = this.sizeAggregation;
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

    private updateTextCloudSettings() {
        let options = new TextCloudOptions(new SizeOptions(80, 140, '%'),
            new ColorOptions('#aaaaaa', this.active.textColor));
        this.textCloud = new TextCloud(options);
    }

    updateObject(prev, field, value) {
        let obj = Object.assign({}, prev);
        obj[field] = value;
        return obj;
    }

    onUpdateFields() {
        let dataField = this.findFieldObject('dataField');
        let sizeField = this.findFieldObject('sizeField');
        // TODO Is this really needed?
        this.active = this.updateObject(this.active, 'dataField', dataField);
        this.active = this.updateObject(this.active, 'sizeField', sizeField);
        this.meta = Object.assign({}, this.meta); // trigger action
    }

    addLocalFilter(filter) {
        this.filters = this.filters.filter((existingFilter) => {
            return existingFilter.id !== filter.id;
        }).concat([filter]);
    }

    createNeonFilterClauseEquals(database: string, table: string, fieldName: string) {
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
    }

    getNeonFilterFields(): string[] {
        return [this.active.dataField.columnName];
    }

    getVisualizationName(): string {
        return 'Text Cloud';
    }

    refreshVisualization() {
        this.createTextCloud();
    }

    getFilterText(filter) {
        return filter.prettyKey + ' = ' + filter.value;
    }

    getFilterDetail(filter) {
        return this.active.allowsTranslations && filter.translated ? (' (' + filter.translated + ')') : '';
    }

    isValidQuery() {
        let valid = true;
        valid = (this.meta.database && this.meta.database.name && valid);
        valid = (this.meta.table && this.meta.table.name && valid);
        valid = (this.active.dataField && this.active.dataField.columnName && valid);
        return valid;
    }

    /**
     * Creates and returns the Neon where clause for the visualization.
     *
     * @return {any}
     */
    createClause(): any {
        let clauses = [neon.query.where(this.active.dataField.columnName, '!=', null)];

        if (this.configFilter) {
            clauses.push(neon.query.where(this.configFilter.lhs, this.configFilter.operator, this.configFilter.rhs));
        }

        if (this.hasUnsharedFilter()) {
            clauses.push(neon.query.where(this.meta.unsharedFilterField.columnName, '=', this.meta.unsharedFilterValue));
        }

        return clauses.length > 1 ? neon.query.and.apply(neon.query, clauses) : clauses[0];
    }

    createQuery(): neon.query.Query {
        let databaseName = this.meta.database.name;
        let tableName = this.meta.table.name;
        let query = new neon.query.Query().selectFrom(databaseName, tableName);
        let whereClause = this.createClause();
        let dataField = this.active.dataField.columnName;

        if (this.active.sizeField.columnName === '') {
            // Normal aggregation query
            return query.where(whereClause).groupBy(dataField).aggregate(neonVariables.COUNT, '*', 'value')
                .sortBy('value', neonVariables.DESCENDING).limit(this.meta.limit);
        } else {
            // Query for data with the size field and sort by it
            let sizeColumn = this.active.sizeField.columnName;
            return query.where(neon.query.and(whereClause, neon.query.where(sizeColumn, '!=', null)))
                .groupBy(dataField).aggregate(neon.query[this.sizeAggregation], sizeColumn, sizeColumn)
                .sortBy(sizeColumn, neonVariables.DESCENDING).limit(this.meta.limit);
        }
    }

    getFiltersToIgnore() {
        return null;
    }

    getDocCount() {
        let databaseName = this.meta.database.name;
        let tableName = this.meta.table.name;
        let whereClause = this.createClause();
        let countQuery = new neon.query.Query()
            .selectFrom(databaseName, tableName)
            .where(whereClause)
            .groupBy(this.active.dataField.columnName)
            .aggregate(neonVariables.COUNT, '*', '_docCount');
        this.executeQuery(countQuery);
    }

    onQuerySuccess(response): void {
        try {
            if (response && response.data && response.data.length && response.data[0]._docCount !== undefined) {
                this.active.docCount = response.data.length;
            } else {
                let cloudData = response.data || [];
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
                if (cloudData.length === 0) {
                    this.active.docCount = 0;
                } else {
                    this.getDocCount();
                }
            }
        } catch (e) {
            console.error((<Error> e).message);
        }
    }

    setupFilters() {
        // Get neon filters
        // See if any neon filters are local filters and set/clear appropriately
        let neonFilters = this.filterService.getFiltersForFields(this.meta.database.name, this.meta.table.name, this.getNeonFilterFields());
        this.filters = [];

        for (let neonFilter of neonFilters) {
            if (!neonFilter.filter.whereClause.whereClauses) {
                let key = neonFilter.filter.whereClause.lhs;
                let value = neonFilter.filter.whereClause.rhs;
                let filter = {
                    id: neonFilter.id,
                    key: key,
                    value: value,
                    prettyKey: key
                };
                if (this.filterIsUnique(filter)) {
                    this.addLocalFilter(filter);
                }
            }
        }
    }

    isFilterSet(): boolean {
        return this.filters.length > 0;
    }

    onClick(item) {
        let value = item.key;
        let key = this.active.dataField.columnName;
        let prettyKey = this.active.dataField.prettyName;
        let filter = {
            id: undefined, // This will be set in the success callback of addNeonFilter.
            key: key,
            value: value,
            prettyKey: prettyKey
        };
        if (this.filterIsUnique(filter)) {
            this.addLocalFilter(filter);
            let whereClause = neon.query.where(filter.key, '=', filter.value);
            this.addNeonFilter(true, filter, whereClause);
        }
    }

    filterIsUnique(filter) {
        for (let existingFilter of this.filters) {
            if (existingFilter.value === filter.value && existingFilter.key === filter.key) {
                return false;
            }
        }
        return true;
    }

    createTextCloud() {
         let data = this.textCloud.createTextCloud(this.active.data);
         this.active = this.updateObject(this.active, 'data', data);
    }

    /**
     * Creates and returns the text for the settings button.
     *
     * @return {string}
     * @override
     */
    getButtonText() {
        if (!this.isFilterSet() && !this.active.data.length) {
            return 'No Data';
        }
        if (this.active.docCount <= this.active.data.length) {
            return 'Total ' + super.prettifyInteger(this.active.docCount);
        }
        return super.prettifyInteger(this.active.data.length) + ' of ' + super.prettifyInteger(this.active.docCount);
    }

    /**
     * Returns the list of filter objects.
     *
     * @return {array}
     * @override
     */
    getCloseableFilters() {
        return this.filters;
    }

    // filter is a filter from the filter service that the filter to remove corresponds to.
    removeFilter(filter: any) {
        // We do it this way instead of using splice() because we have to replace filter array
        // with a new object for Angular to recognize the change. It doesn't respond to mutation.
        let newFilters = [];
        for (let index = this.filters.length - 1; index >= 0; index--) {
            if (this.filters[index].id !== filter.id) {
                newFilters.push(this.filters[index]);
            }
        }
        this.filters = newFilters;
    }

    // These methods must be present for AoT compile
    requestExport() {
        // Do nothing.
    }

    /**
     * Returns the default limit for the visualization.
     *
     * @return {number}
     * @override
     */
    getDefaultLimit() {
        return 40;
    }

    /**
     * Returns an object containing the ElementRef objects for the visualization.
     *
     * @return {any} Object containing:  {ElementRef} headerText, {ElementRef} infoText, {ElementRef} visualization
     * @override
     */
    getElementRefs() {
        return {
            visualization: this.visualization,
            headerText: this.headerText,
            infoText: this.infoText
        };
    }
}
