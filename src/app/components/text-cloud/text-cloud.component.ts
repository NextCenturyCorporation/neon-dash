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

import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { FieldMetaData } from '../../dataset';
import { neonVariables } from '../../neon-namespaces';
import {
    OptionChoices,
    WidgetFieldArrayOption,
    WidgetFieldOption,
    WidgetOption,
    WidgetSelectOption
} from '../../widget-option';
import { TextCloud, SizeOptions, ColorOptions } from './text-cloud-namespace';
import * as neon from 'neon-framework';

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

    public textCloud: TextCloud;

    public filters: {
        id: string,
        field: string,
        value: string,
        translated: string,
        prettyField: string
    }[] = [];

    public activeData: any[] = [];
    public termsCount: number = 0;
    public textColor: string = '#111';

    constructor(
        connectionService: ConnectionService,
        datasetService: DatasetService,
        filterService: FilterService,
        injector: Injector,
        ref: ChangeDetectorRef
    ) {

        super(
            connectionService,
            datasetService,
            filterService,
            injector,
            ref
        );

        // Backwards compatibility (sizeAggregation deprecated and replaced by aggregation).
        this.options.aggregation = (this.options.aggregation || this.injector.get('sizeAggregation', neonVariables.COUNT)).toLowerCase();
    }

    subNgOnInit() {
        // Do nothing
    }

    postInit() {
        // This should happen before execute query as #refreshVisualization() depends on this.textCloud
        this.textColor = this.getPrimaryThemeColor().toHexString();
        this.updateTextCloudSettings();

        this.executeQueryChain();
    }

    subNgOnDestroy() {
        // Do nothing
    }

    private updateTextCloudSettings() {
        this.textCloud = new TextCloud(new SizeOptions(80, 140, '%'), new ColorOptions('#aaaaaa', this.textColor));
    }

    refreshVisualization() {
        this.createTextCloud();
    }

    getFilterText(filter) {
        return filter.prettyField + ' = ' + filter.value;
    }

    getFilterDetail(filter) {
        return filter.translated ? (' (' + filter.translated + ')') : '';
    }

    isValidQuery() {
        return this.options.database.name && this.options.table.name && this.options.dataField.columnName &&
            (this.options.aggregation !== neonVariables.COUNT ? this.options.sizeField.columnName : true);
    }

    /**
     * Creates and returns the Neon where clause for the visualization.
     *
     * @return {any}
     */
    createClause(): any {
        let clauses = [neon.query.where(this.options.dataField.columnName, '!=', null)];

        if (this.options.filter) {
            clauses.push(neon.query.where(this.options.filter.lhs, this.options.filter.operator, this.options.filter.rhs));
        }

        if (this.hasUnsharedFilter()) {
            clauses.push(neon.query.where(this.options.unsharedFilterField.columnName, '=', this.options.unsharedFilterValue));
        }

        return clauses.length > 1 ? neon.query.and.apply(neon.query, clauses) : clauses[0];
    }

    /**
     * Creates and returns an array of field options for the visualization.
     *
     * @return {(WidgetFieldOption|WidgetFieldArrayOption)[]}
     * @override
     */
    createFieldOptions(): (WidgetFieldOption | WidgetFieldArrayOption)[] {
        return [
            new WidgetFieldOption('dataField', 'Term Field', true),
            new WidgetFieldOption('sizeField', 'Size Field', false, this.optionsAggregationIsNotCount)
        ];
    }

    /**
     * Creates and returns an array of non-field options for the visualization.
     *
     * @return {WidgetOption[]}
     * @override
     */
    createNonFieldOptions(): WidgetOption[] {
        return [
            new WidgetSelectOption('aggregation', 'Aggregation', neonVariables.COUNT, OptionChoices.AggregationType),
            new WidgetSelectOption('andFilters', 'Filter Operator', true, OptionChoices.OrFalseAndTrue),
            new WidgetSelectOption('ignoreSelf', 'Filter Self', false, OptionChoices.YesFalseNoTrue),
            new WidgetSelectOption('paragraphs', 'Show as Paragraphs', false, OptionChoices.NoFalseYesTrue),
            new WidgetSelectOption('showCounts', 'Show Counts', false, OptionChoices.NoFalseYesTrue)
        ];
    }

    createQuery(): neon.query.Query {
        let query = new neon.query.Query().selectFrom(this.options.database.name, this.options.table.name);
        let whereClause = this.createClause();
        let dataField = this.options.dataField.columnName;

        if (this.options.aggregation === neonVariables.COUNT) {
            // Normal aggregation query
            return query.where(whereClause).groupBy(dataField).aggregate(neonVariables.COUNT, '*', 'value')
                .sortBy('value', neonVariables.DESCENDING).limit(this.options.limit as number);
        } else {
            // Query for data with the size field and sort by it
            let sizeColumn = this.options.sizeField.columnName;
            return query.where(neon.query.and(whereClause, neon.query.where(sizeColumn, '!=', null)))
                .groupBy(dataField).aggregate(this.options.aggregation, sizeColumn, sizeColumn)
                .sortBy(sizeColumn, neonVariables.DESCENDING).limit(this.options.limit as number);
        }
    }

    /**
     * Returns the list of fields to export.
     *
     * @return {{ columnName: string, prettyName: string }[]}
     * @override
     */
    getExportFields(): { columnName: string, prettyName: string }[] {
        // TODO Do we really need this behavior for the sizeField or can we just simplify it and use the superclass getExportFields?
        return [{
            columnName: this.options.dataField.columnName,
            prettyName: this.options.dataField.prettyName
        }, {
            columnName: 'value',
            prettyName: this.options.sizeField.prettyName || 'Count'
        }];
    }

    /**
     * Returns the list of filters for the visualization to ignore.
     *
     * @return {any[]}
     * @override
     */
    getFiltersToIgnore() {
        if (!this.options.ignoreSelf) {
            return null;
        }

        let neonFilters = this.filterService.getFiltersForFields(this.options.database.name, this.options.table.name,
            [this.options.dataField.columnName]);

        let ignoredFilterIds = neonFilters.filter((neonFilter) => {
            return !neonFilter.filter.whereClause.whereClauses;
        }).map((neonFilter) => {
            return neonFilter.id;
        });

        return ignoredFilterIds.length ? ignoredFilterIds : null;
    }

    getTermsCount() {
        let countQuery = new neon.query.Query().selectFrom(this.options.database.name, this.options.table.name).where(this.createClause())
            .groupBy(this.options.dataField.columnName).aggregate(neonVariables.COUNT, '*', '_termsCount');
        this.executeQuery(countQuery);
    }

    /**
     * Returns the default limit for the visualization.
     *
     * @return {string}
     * @override
     */
    getVisualizationDefaultLimit(): number {
        return 40;
    }

    /**
     * Returns the default title for the visualization.
     *
     * @return {string}
     * @override
     */
    getVisualizationDefaultTitle(): string {
        return 'Text Cloud';
    }

    onQuerySuccess(response): void {
        try {
            if (response && response.data && response.data.length && response.data[0]._termsCount !== undefined) {
                this.termsCount = response.data.length;
            } else {
                let cloudData = response.data || [];

                this.activeData = cloudData.map((item) => {
                    item.key = item[this.options.dataField.columnName];
                    item.keyTranslated = item.key;
                    // If we have a size field, asign the value to the value field
                    if (this.options.sizeField.columnName) {
                        item.value = item[this.options.sizeField.columnName];
                    }
                    return item;
                });
                this.refreshVisualization();
                if (cloudData.length === 0) {
                    this.termsCount = 0;
                } else {
                    this.getTermsCount();
                }
            }
        } catch (e) {
            console.error((<Error> e).message);
        }
    }

    /**
     * Returns whether the aggregation type is not count.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    optionsAggregationIsNotCount(options: any): boolean {
        return options.aggregation !== neonVariables.COUNT;
    }

    publishOptions() {
        this.messenger.publish('options', {
            options: this.options,
            changeCallback: this.handleChangeFilterField(),
            changeLimitCallback: this.subHandleChangeLimit()
        });
    }

    publishToggleGear() {
        this.messenger.publish('toggleGear', {
            toggleGear: true
        });
    }

    toggleGear() {
        this.publishOptions();
        this.publishToggleGear();
    }

    setupFilters() {
        // Get neon filters
        // See if any neon filters are local filters and set/clear appropriately
        let neonFilters = this.filterService.getFiltersForFields(this.options.database.name, this.options.table.name,
            [this.options.dataField.columnName]);
        this.filters = [];
        for (let neonFilter of neonFilters) {
            if (!neonFilter.filter.whereClause.whereClauses) {
                let field = this.findField(this.options.fields, neonFilter.filter.whereClause.lhs);
                let value = neonFilter.filter.whereClause.rhs;
                let filter = {
                    id: neonFilter.id,
                    field: field.columnName,
                    prettyField: field.prettyName,
                    translated: '',
                    value: value
                };
                if (this.filterIsUnique(filter)) {
                    this.filters.push(filter);
                }
            }
        }
    }

    isFiltered(text: string): boolean {
        return this.filters.some((filter) => {
            return filter.value === text;
        });
    }

    onClick(item) {
        let filter = {
            id: undefined, // This will be set in the success callback of addNeonFilter.
            field: this.options.dataField.columnName,
            prettyField: this.options.dataField.prettyName,
            translated: '',
            value: item.key
        };
        if (!this.filters.length) {
            this.filters.push(filter);
            let whereClause = neon.query.where(filter.field, '=', filter.value);
            this.addNeonFilter(true, filter, whereClause);
        } else if (this.filterIsUnique(filter)) {
            filter.id = this.filters[0].id;
            this.filters.push(filter);
            let whereClauses = this.filters.map((existingFilter) => {
                return neon.query.where(existingFilter.field, '=', existingFilter.value);
            });
            let whereClause = whereClauses.length === 1 ? whereClauses[0] : (this.options.andFilters ? neon.query.and.apply(neon.query,
                whereClauses) : neon.query.or.apply(neon.query, whereClauses));
            this.replaceNeonFilter(true, filter, whereClause);
        }
    }

    filterIsUnique(filter) {
        for (let existingFilter of this.filters) {
            if (existingFilter.value === filter.value && existingFilter.field === filter.field) {
                return false;
            }
        }
        return true;
    }

    createTextCloud() {
         this.activeData = this.textCloud.createTextCloud(this.activeData);
    }

    /**
     * Creates and returns the text for the settings button.
     *
     * @return {string}
     * @override
     */
    getButtonText() {
        if (!this.filters.length && !this.termsCount) {
            if (this.options.hideUnfiltered) {
                return 'Please Filter';
            }
            return 'No Data';
        }
        if (this.termsCount <= this.activeData.length) {
            return 'Total ' + super.prettifyInteger(this.termsCount);
        }
        return super.prettifyInteger(this.activeData.length) + ' of ' + super.prettifyInteger(this.termsCount);
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
