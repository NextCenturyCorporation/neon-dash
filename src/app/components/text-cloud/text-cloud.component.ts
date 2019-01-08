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

import {
    AbstractSearchService,
    AggregationType,
    NeonFilterClause,
    NeonQueryPayload,
    SortOrder
} from '../../services/abstract.search.service';
import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';

import { BaseNeonComponent, TransformedVisualizationData } from '../base-neon-component/base-neon.component';
import { FieldMetaData } from '../../dataset';
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

    // TODO THOR-985
    public textCloudData: any[] = [];

    public filters: {
        id: string,
        field: string,
        value: string,
        translated: string,
        prettyField: string
    }[] = [];

    public textColor: string = '#111';

    constructor(
        datasetService: DatasetService,
        filterService: FilterService,
        searchService: AbstractSearchService,
        injector: Injector,
        ref: ChangeDetectorRef,
        protected widgetService: AbstractWidgetService
    ) {
        super(
            datasetService,
            filterService,
            searchService,
            injector,
            ref
        );
    }

    /**
     * Initializes any visualization properties when the widget is created.
     *
     * @override
     */
    initializeProperties() {
        // Backwards compatibility (sizeAggregation deprecated and replaced by aggregation).
        this.options.aggregation = (this.options.aggregation || this.injector.get('sizeAggregation', AggregationType.COUNT)).toLowerCase();

        // This should happen before execute query as #refreshVisualization() depends on this.textCloud
        this.textColor = this.widgetService.getThemeAccentColorHex();
    }

    /**
     * Creates any visualization elements when the widget is drawn.
     *
     * @override
     */
    constructVisualization() {
        this.textCloud = new TextCloud(new SizeOptions(80, 140, '%'), new ColorOptions('#aaaaaa', this.textColor));
    }

    refreshVisualization() {
        this.textCloudData = this.textCloud.createTextCloud(this.getActiveData(this.options).data);
    }

    getFilterText(filter) {
        return filter.prettyField + ' = ' + filter.value;
    }

    getFilterDetail(filter) {
        return filter.translated ? (' (' + filter.translated + ')') : '';
    }

    /**
     * Returns whether the visualization query created using the given options is valid.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     * @override
     */
    validateVisualizationQuery(options: any): boolean {
        return options.database.name && options.table.name && options.dataField.columnName &&
            (options.aggregation !== AggregationType.COUNT ? options.sizeField.columnName : true);
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
            new WidgetSelectOption('aggregation', 'Aggregation', AggregationType.COUNT, OptionChoices.Aggregation),
            new WidgetSelectOption('andFilters', 'Filter Operator', true, OptionChoices.OrFalseAndTrue),
            new WidgetSelectOption('ignoreSelf', 'Filter Self', false, OptionChoices.YesFalseNoTrue),
            new WidgetSelectOption('paragraphs', 'Show as Paragraphs', false, OptionChoices.NoFalseYesTrue),
            new WidgetSelectOption('showCounts', 'Show Counts', false, OptionChoices.NoFalseYesTrue)
        ];
    }

    /**
     * Finalizes the given visualization query by adding the aggregations, filters, groups, and sort using the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {NeonQueryPayload} queryPayload
     * @arg {NeonFilterClause[]} sharedFilters
     * @return {NeonQueryPayload}
     * @override
     */
    finalizeVisualizationQuery(options: any, query: NeonQueryPayload, sharedFilters: NeonFilterClause[]): NeonQueryPayload {
        let filter: NeonFilterClause = this.searchService.buildFilterClause(options.dataField.columnName, '!=', null);

        let aggregationField = options.aggregation === AggregationType.COUNT ? '*' : options.sizeField.columnName;

        this.searchService.updateFilter(query, this.searchService.buildBoolFilterClause(sharedFilters.concat(filter)))
            .updateGroups(query, [this.searchService.buildQueryGroup(options.dataField.columnName)])
            .updateAggregation(query, options.aggregation, '_aggregation', aggregationField)
            .updateSort(query, '_aggregation', SortOrder.DESCENDING);

        return query;
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

    /**
     * Transforms the given array of query results using the given options into the array of objects to be shown in the visualization.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any[]} results
     * @return {TransformedVisualizationData}
     * @override
     */
    transformVisualizationQueryResults(options: any, results: any[]): TransformedVisualizationData {
        // TODO Create new objects (don't use result objects)
        let data = results.map((item) => {
            item.key = item[options.dataField.columnName];
            item.keyTranslated = item.key;
            item.value = item._aggregation;
            return item;
        });

        return new TransformedVisualizationData(data);
    }

    /**
     * Returns whether the aggregation type is not count.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    optionsAggregationIsNotCount(options: any): boolean {
        return options.aggregation !== AggregationType.COUNT;
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
            this.addNeonFilter(this.options, true, filter, whereClause);
        } else if (this.filterIsUnique(filter)) {
            filter.id = this.filters[0].id;
            this.filters.push(filter);
            let whereClauses = this.filters.map((existingFilter) => {
                return neon.query.where(existingFilter.field, '=', existingFilter.value);
            });
            let whereClause = whereClauses.length === 1 ? whereClauses[0] : (this.options.andFilters ? neon.query.and.apply(neon.query,
                whereClauses) : neon.query.or.apply(neon.query, whereClauses));
            this.replaceNeonFilter(this.options, true, filter, whereClause);
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

    /**
     * Returns the list of filter objects.
     *
     * @return {array}
     * @override
     */
    getCloseableFilters() {
        return this.filters;
    }

    /**
     * Returns the label for the data items that are currently shown in this visualization (Bars, Lines, Nodes, Points, Rows, Terms, ...).
     * Uses the given count to determine plurality.
     *
     * @arg {number} count
     * @return {string}
     * @override
     */
    public getVisualizationElementLabel(count: number): string {
        return 'Term' + (count === 1 ? '' : 's');
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
