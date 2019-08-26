/**
 * Copyright 2019 Next Century Corporation
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

import { AbstractSearchService, FilterClause, QueryPayload } from '../../services/abstract.search.service';
import { InjectableColorThemeService } from '../../services/injectable.color-theme.service';
import { DashboardService } from '../../services/dashboard.service';
import { FilterConfig } from '../../models/filter';
import { FilterCollection, ListFilterDesign, SimpleFilterDesign } from '../../util/filter.util';
import { InjectableFilterService } from '../../services/injectable.filter.service';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import {
    AggregationType,
    CompoundFilterType,
    OptionChoices,
    SortOrder,
    WidgetFieldOption,
    WidgetOption,
    WidgetSelectOption
} from '../../models/widget-option';
import { TextCloud, SizeOptions, ColorOptions } from './text-cloud-namespace';
import { MatDialog } from '@angular/material';

@Component({
    selector: 'app-text-cloud',
    templateUrl: './text-cloud.component.html',
    styleUrls: ['./text-cloud.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextCloudComponent extends BaseNeonComponent implements OnInit, OnDestroy {
    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;

    public textCloud: TextCloud;

    public textCloudData: any[] = [];

    // Cached filtered terms used to create new intersection (AND) filters.
    private _filteredTerms: string[] = [];

    constructor(
        dashboardService: DashboardService,
        filterService: InjectableFilterService,
        searchService: AbstractSearchService,
        injector: Injector,
        ref: ChangeDetectorRef,
        protected colorThemeService: InjectableColorThemeService,
        dialog: MatDialog,
        public visualization: ElementRef
    ) {
        super(
            dashboardService,
            filterService,
            searchService,
            injector,
            ref,
            dialog
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
    }

    /**
     * Creates any visualization elements when the widget is drawn.
     *
     * @override
     */
    constructVisualization() {
        let accentColorHex = this.colorThemeService.getThemeAccentColorHex();
        let textColorHex = this.colorThemeService.getThemeTextColorHex();
        this.textCloud = new TextCloud(new SizeOptions(80, 140, '%'), new ColorOptions(textColorHex, accentColorHex));
    }

    /**
     * Redraws this visualization with the given compatible filters.
     *
     * @override
     */
    protected redrawFilters(filters: FilterCollection): void {
        this._filteredTerms = [];

        this.textCloudData = this.textCloudData.map((item) => {
            let itemCopy = {
                color: item.color,
                fontSize: item.fontSize,
                key: item.key,
                keyTranslated: item.keyTranslated,
                selected: false,
                value: item.value
            };

            if (filters.isFiltered(this.createFilterConfigOnSingleTerm(item.key)) ||
                filters.isFiltered(this.createFilterConfigOnMultipleTerms([item.key]))) {
                this._filteredTerms.push(item.key);
                itemCopy.selected = true;
            }

            return itemCopy;
        });
    }

    refreshVisualization() {
        // Do nothing.
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

    private createFilterConfigOnMultipleTerms(values: any[] = [undefined]): ListFilterDesign {
        return new ListFilterDesign(CompoundFilterType.AND, this.options.datastore.name + '.' + this.options.database.name + '.' +
            this.options.table.name + '.' + this.options.dataField.columnName, '=', values);
    }

    private createFilterConfigOnSingleTerm(value?: any): SimpleFilterDesign {
        return new SimpleFilterDesign(this.options.datastore.name, this.options.database.name, this.options.table.name,
            this.options.dataField.columnName, '=', value);
    }

    /**
     * Creates and returns an array of options for the visualization.
     *
     * @return {WidgetOption[]}
     * @override
     */
    protected createOptions(): WidgetOption[] {
        return [
            new WidgetFieldOption('dataField', 'Term Field', true),
            new WidgetFieldOption('sizeField', 'Size Field', false, this.optionsAggregationIsNotCount.bind(this)),
            new WidgetSelectOption('aggregation', 'Aggregation', AggregationType.COUNT, OptionChoices.Aggregation),
            new WidgetSelectOption('andFilters', 'Filter Operator', true, OptionChoices.OrFalseAndTrue),
            new WidgetSelectOption('ignoreSelf', 'Filter Self', false, OptionChoices.YesFalseNoTrue),
            new WidgetSelectOption('paragraphs', 'Show as Paragraphs', false, OptionChoices.NoFalseYesTrue),
            new WidgetSelectOption('showCounts', 'Show Counts', false, OptionChoices.NoFalseYesTrue)
        ];
    }

    /**
     * Returns the design for each type of filter made by this visualization.  This visualization will automatically update itself with all
     * compatible filters that were set internally or externally whenever it runs a visualization query.
     *
     * @return {FilterConfig[]}
     * @override
     */
    protected designEachFilterWithNoValues(): FilterConfig[] {
        return this.options.dataField.columnName ? [this.createFilterConfigOnSingleTerm(), this.createFilterConfigOnMultipleTerms()] : [];
    }

    /**
     * Finalizes the given visualization query by adding the aggregations, filters, groups, and sort using the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {QueryPayload} queryPayload
     * @arg {FilterClause[]} sharedFilters
     * @return {QueryPayload}
     * @override
     */
    finalizeVisualizationQuery(options: any, query: QueryPayload, sharedFilters: FilterClause[]): QueryPayload {
        let filter: FilterClause = this.searchService.buildFilterClause(options.dataField.columnName, '!=', null);

        let aggregationField = options.aggregation === AggregationType.COUNT ? options.dataField.columnName : options.sizeField.columnName;

        this.searchService.updateFilter(query, this.searchService.buildCompoundFilterClause(sharedFilters.concat(filter)))
            .updateGroups(query, [this.searchService.buildQueryGroup(options.dataField.columnName)])
            .updateAggregation(query, options.aggregation, this.searchService.getAggregationName(), aggregationField)
            .updateSort(query, this.searchService.getAggregationName(), SortOrder.DESCENDING);

        return query;
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

    /**
     * Transforms the given array of query results using the given options into an array of objects to be shown in the visualization.
     * Returns the count of elements shown in the visualization.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any[]} results
     * @arg {FilterCollection} filters
     * @return {number}
     * @override
     */
    transformVisualizationQueryResults(options: any, results: any[], filters: FilterCollection): number {
        this._filteredTerms = [];

        let data: any[] = results.map((item) => {
            let key = item[options.dataField.columnName];
            let filtered = filters.isFiltered(this.createFilterConfigOnSingleTerm(key)) ||
                filters.isFiltered(this.createFilterConfigOnMultipleTerms([item.key]));

            if (filtered) {
                this._filteredTerms.push(key);
            }

            return {
                key: key,
                keyTranslated: key,
                selected: filtered,
                value: item[this.searchService.getAggregationName()]
            };
        });

        this.textCloudData = this.textCloud.createTextCloud(data);

        return this.textCloudData.length;
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

    onClick(item) {
        this._filteredTerms.push(item.key);

        if (this.options.andFilters) {
            this.exchangeFilters([this.createFilterConfigOnMultipleTerms(this._filteredTerms)]);
        } else {
            this.toggleFilters([this.createFilterConfigOnSingleTerm(item.key)]);
        }
    }

    // These methods must be present for AoT compile
    requestExport() {
        // Do nothing.
    }
}
