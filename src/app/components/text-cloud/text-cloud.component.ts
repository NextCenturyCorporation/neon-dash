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
    FilterClause,
    QueryPayload,
    SortOrder
} from '../../services/abstract.search.service';
import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterBehavior, FilterService, FilterDesign, SimpleFilterDesign } from '../../services/filter.service';

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
import { MatDialog } from '@angular/material';

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

    public textColor: string = '#111';

    constructor(
        datasetService: DatasetService,
        filterService: FilterService,
        searchService: AbstractSearchService,
        injector: Injector,
        ref: ChangeDetectorRef,
        protected widgetService: AbstractWidgetService,
        dialog: MatDialog
    ) {
        super(
            datasetService,
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

        // This should happen before execute query as #refreshVisualization() depends on this.textCloud
        this.textColor = this.widgetService.getThemeMainColorHex();
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

    private createFilterDesignOnText(value?: any): FilterDesign {
        return {
            optional: !this.options.andFilters,
            datastore: '',
            database: this.options.database,
            table: this.options.table,
            field: this.options.dataField as FieldMetaData,
            operator: '=',
            value: value
        } as SimpleFilterDesign;
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
     * Returns each type of filter made by this visualization as an object containing 1) a filter design with undefined values and 2) a
     * callback to redraw the filter.  This visualization will automatically update with compatible filters that were set externally.
     *
     * @return {FilterBehavior[]}
     * @override
     */
    protected designEachFilterWithNoValues(): FilterBehavior[] {
        let behaviors: FilterBehavior[] = [];

        if (this.options.dataField.columnName) {
            behaviors.push({
                filterDesign: this.createFilterDesignOnText(),
                redrawCallback: this.redrawText.bind(this)
            } as FilterBehavior);
        }

        return behaviors;
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
            .updateAggregation(query, options.aggregation, '_aggregation', aggregationField)
            .updateSort(query, '_aggregation', SortOrder.DESCENDING);

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

    private redrawText(filterDesigns: FilterDesign[]): void {
        this.textCloudData = this.textCloudData.map((item) => {
            let itemCopy = {
                color: item.color,
                fontSize: item.fontSize,
                key: item.key,
                keyTranslated: item.keyTranslated,
                selected: false,
                value: item.value
            };
            if (this.isFiltered(this.createFilterDesignOnText(item.key))) {
                itemCopy.selected = true;
            }
            return itemCopy;
        });
        this.changeDetection.detectChanges();
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
        let data = results.map((item) => {
            let key = item[options.dataField.columnName];
            return {
                key: key,
                keyTranslated: key,
                selected: this.isFiltered(this.createFilterDesignOnText(key)),
                value: item._aggregation
            };
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

    onClick(item) {
        let filter: FilterDesign = this.createFilterDesignOnText(item.key);
        this.toggleFilters([filter]);
    }

    // These methods must be present for AoT compile
    requestExport() {
        // Do nothing.
    }

    protected clearVisualizationData(options: any): void {
        // TODO THOR-985 Temporary function.
        this.transformVisualizationQueryResults(options, []);
    }
}
