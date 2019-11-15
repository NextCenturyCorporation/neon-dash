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
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';

import { AbstractSearchService, FilterClause, QueryPayload } from 'component-library/dist/core/services/abstract.search.service';
import { InjectableColorThemeService } from '../../services/injectable.color-theme.service';
import { CoreUtil } from 'component-library/dist/core/core.util';
import { DashboardService } from '../../services/dashboard.service';
import { AbstractFilterDesign, FilterCollection, ListFilter, ListFilterDesign } from 'component-library/dist/core/models/filters';
import { InjectableFilterService } from '../../services/injectable.filter.service';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import {
    AggregationType,
    CompoundFilterType,
    OptionChoices,
    SortOrder,
    ConfigOptionField,
    ConfigOption,
    ConfigOptionSelect
} from 'component-library/dist/core/models/config-option';
import { TextCloud, SizeOptions, ColorOptions } from 'component-library/dist/visualizations/text-cloud/TextCloud';
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

    // Save the values of the filters in the FilterService that are compatible with this visualization's filters.
    private _filteredText: string[] = [];

    constructor(
        dashboardService: DashboardService,
        filterService: InjectableFilterService,
        searchService: AbstractSearchService,
        ref: ChangeDetectorRef,
        protected colorThemeService: InjectableColorThemeService,
        dialog: MatDialog,
        public visualization: ElementRef
    ) {
        super(
            dashboardService,
            filterService,
            searchService,
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
        if (typeof this.options.sizeAggregation !== 'undefined') {
            this.options.aggregation = this.options.sizeAggregation;
        }

        this.options.aggregation = (this.options.aggregation || AggregationType.COUNT).toLowerCase();
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
        let listFilters: ListFilter[] = filters.getCompatibleFilters(this.createFilterDesignOnText()) as ListFilter[];
        this._filteredText = CoreUtil.retrieveValuesFromListFilters(listFilters);

        // Create a copy of each item.
        this.textCloudData = this.textCloudData.map((item) => ({
            color: item.color,
            fontSize: item.fontSize,
            key: item.key,
            keyTranslated: item.keyTranslated,
            selected: this._filteredText.indexOf(item.key) >= 0,
            value: item.value
        }));
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

    private createFilterDesignOnText(values: any[] = [undefined]): ListFilterDesign {
        return new ListFilterDesign(this.options.andFilters ? CompoundFilterType.AND : CompoundFilterType.OR,
            this.options.datastore.name + '.' + this.options.database.name + '.' + this.options.table.name + '.' +
            this.options.dataField.columnName, '=', values);
    }

    /**
     * Creates and returns an array of options for the visualization.
     *
     * @return {ConfigOption[]}
     * @override
     */
    protected createOptions(): ConfigOption[] {
        return [
            new ConfigOptionField('dataField', 'Term Field', true),
            new ConfigOptionField('sizeField', 'Size Field', false, this.optionsAggregationIsNotCount.bind(this)),
            new ConfigOptionSelect('aggregation', 'Aggregation', false, AggregationType.COUNT, OptionChoices.Aggregation),
            new ConfigOptionSelect('andFilters', 'Filter Operator', false, true, OptionChoices.OrFalseAndTrue),
            new ConfigOptionSelect('ignoreSelf', 'Filter Self', false, false, OptionChoices.YesFalseNoTrue),
            new ConfigOptionSelect('paragraphs', 'Show as Paragraphs', false, false, OptionChoices.NoFalseYesTrue),
            new ConfigOptionSelect('showCounts', 'Show Counts', false, false, OptionChoices.NoFalseYesTrue)
        ];
    }

    /**
     * Returns the design for each type of filter made by this visualization.  This visualization will automatically update itself with all
     * compatible filters that were set internally or externally whenever it runs a visualization query.
     *
     * @return {AbstractFilterDesign[]}
     * @override
     */
    protected designEachFilterWithNoValues(): AbstractFilterDesign[] {
        return this.options.dataField.columnName ? [this.createFilterDesignOnText()] : [];
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
        let listFilters: ListFilter[] = filters.getCompatibleFilters(this.createFilterDesignOnText()) as ListFilter[];
        this._filteredText = CoreUtil.retrieveValuesFromListFilters(listFilters);

        const data: any[] = results.map((item) => {
            const text = CoreUtil.deepFind(item, options.dataField.columnName);
            return {
                key: text,
                keyTranslated: text,
                selected: this._filteredText.indexOf(text) >= 0,
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
        this._filteredText = CoreUtil.changeOrToggleValues(item.key, this._filteredText, true);
        if (this._filteredText.length) {
            this.exchangeFilters([this.createFilterDesignOnText(this._filteredText)]);
        } else {
            // If we won't set any filters, create a FilterDesign without a value to delete all the old filters on the text field.
            this.exchangeFilters([], [this.createFilterDesignOnText()]);
        }
    }

    // These methods must be present for AoT compile
    requestExport() {
        // Do nothing.
    }
}
