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
    ViewContainerRef,
    ViewEncapsulation
} from '@angular/core';

import { AbstractSearchService, FilterClause, QueryPayload, SortOrder } from '../../services/abstract.search.service';
import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { DashboardService } from '../../services/dashboard.service';
import { FilterBehavior, FilterService } from '../../services/filter.service';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { DocumentViewerSingleItemComponent } from '../document-viewer-single-item/document-viewer-single-item.component';
import { neonUtilities } from '../../neon-namespaces';
import {
    OptionChoices,
    WidgetFieldArrayOption,
    WidgetFieldOption,
    WidgetFreeTextOption,
    WidgetNonPrimitiveOption,
    WidgetOption,
    WidgetSelectOption
} from '../../widget-option';
import * as _ from 'lodash';
import * as moment from 'moment';

import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material';

@Component({
    selector: 'app-document-viewer',
    templateUrl: './document-viewer.component.html',
    styleUrls: ['./document-viewer.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentViewerComponent extends BaseNeonComponent implements OnInit, OnDestroy {
    @ViewChild('visualization', { read: ElementRef }) visualization: ElementRef;
    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;

    public documentViewerData: any[] = null;

    private singleItemRef: MatDialogRef<DocumentViewerSingleItemComponent>;

    constructor(
        dashboardService: DashboardService,
        filterService: FilterService,
        searchService: AbstractSearchService,
        injector: Injector,
        protected widgetService: AbstractWidgetService,
        public viewContainerRef: ViewContainerRef,
        ref: ChangeDetectorRef,
        public dialog: MatDialog
    ) {
        super(
            dashboardService,
            filterService,
            searchService,
            injector,
            ref,
            dialog
        );

        this.visualizationQueryPaginates = true;
    }

    /**
     * Initializes any visualization properties when the widget is created.
     *
     * @override
     */
    initializeProperties() {
        // Backwards compatibility (sortOrder deprecated and replaced by sortDescending).
        let sortOrder = this.injector.get('sortOrder', null);
        this.options.sortDescending = sortOrder ? (sortOrder === 'DESCENDING') : this.options.sortDescending;
    }

    /**
     * Returns whether the visualization query created using the given options is valid.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     * @override
     */
    validateVisualizationQuery(options: any): boolean {
        return !!(options.database.name && options.table.name && options.dataField.columnName);
    }

    /**
     * Returns each type of filter made by this visualization as an object containing 1) a filter design with undefined values and 2) a
     * callback to redraw the filter.  This visualization will automatically update with compatible filters that were set externally.
     *
     * @return {FilterBehavior[]}
     * @override
     */
    protected designEachFilterWithNoValues(): FilterBehavior[] {
        // This visualization does not filter.
        return [];
    }

    /**
     * Creates and returns an array of field options for the visualization.
     *
     * @return {(WidgetFieldOption|WidgetFieldArrayOption)[]}
     * @override
     */
    createFieldOptions(): (WidgetFieldOption | WidgetFieldArrayOption)[] {
        return [
            new WidgetFieldOption('dataField', 'Text Field', true),
            new WidgetFieldOption('dateField', 'Date Field', false),
            new WidgetFieldOption('idField', 'ID Field', false),
            new WidgetFieldOption('sortField', 'Sort Field', false)
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
            new WidgetSelectOption('showText', 'Main Document Text', false, OptionChoices.HideFalseShowTrue),
            new WidgetFreeTextOption('nameWidthCss', 'Name (Left Column) Width CSS', ''),
            new WidgetSelectOption('showSelect', 'Select Button', false, OptionChoices.HideFalseShowTrue),
            new WidgetSelectOption('sortDescending', 'Sort', true, OptionChoices.AscendingFalseDescendingTrue),
            new WidgetSelectOption('hideSource', 'Source Button', false, OptionChoices.ShowFalseHideTrue),
            // TODO THOR-950 Change metadataFields and popoutFields to arrays of FieldMetaData objects!
            new WidgetNonPrimitiveOption('metadataFields', 'Metadata Fields', []),
            new WidgetNonPrimitiveOption('popoutFields', 'Popout Fields', [])
        ];
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
        let filter: FilterClause = this.searchService.buildFilterClause(this.options.dataField.columnName, '!=', null);

        // TODO THOR-950 Don't call updateFields once metadataFields and popoutFields are arrays of FieldMetaData objects.
        let fields = neonUtilities.flatten(options.metadataFields).map((item) => item.field)
            .concat(neonUtilities.flatten(options.popoutFields).map((item) => item.field));

        if (fields.length) {
            this.searchService.updateFields(query, fields);
        }

        if (options.sortField.columnName) {
            this.searchService.updateSort(query, options.sortField.columnName, options.sortDescending ? SortOrder.DESCENDING :
                SortOrder.ASCENDING);
        }

        this.searchService.updateFilter(query, this.searchService.buildCompoundFilterClause(sharedFilters.concat(filter)));

        return query;
    }

    /**
     * Returns the default limit for the visualization.
     *
     * @return {string}
     * @override
     */
    getVisualizationDefaultLimit(): number {
        return 50;
    }

    /**
     * Returns the default title for the visualization.
     *
     * @return {string}
     * @override
     */
    getVisualizationDefaultTitle(): string {
        return 'Document Viewer';
    }

    /**
     * Transforms the given array of query results using the given options into an array of objects to be shown in the visualization.
     * Returns the count of elements shown in the visualization.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any[]} results
     * @return {number}
     * @override
     */
    transformVisualizationQueryResults(options: any, results: any[]): number {
        let configFields: { name?: string, field: string, arrayFilter?: any }[] = neonUtilities.flatten(options.metadataFields).concat(
            neonUtilities.flatten(options.popoutFields)
        );

        if (!configFields.some((configField) => configField.field === options.dataField.columnName)) {
            configFields.splice(0, 0, {
                field: options.dataField.columnName,
                name: options.dataField.prettyName
            });
        }

        if (options.dateField.columnName && !configFields.some((configField) => configField.field === options.dateField.columnName)) {
            configFields.push({
                field: options.dateField.columnName,
                name: options.dateField.prettyName
            });
        }

        if (options.idField.columnName && !configFields.some((configField) => configField.field === options.idField.columnName)) {
            configFields.push({
                field: options.idField.columnName,
                name: options.idField.prettyName
            });
        }

        this.documentViewerData = results.map((result) => {
            let activeItem = {
                data: {},
                rows: []
            };
            configFields.forEach((configField) => {
                this.populateActiveItem(activeItem, result, configFields, configField.field, configField.name,
                    configField.arrayFilter);
            });
            return activeItem;
        });

        return this.documentViewerData.length;
    }

    /**
     * Populates the data and rows of the given active item object using the given response item and config fields.
     *
     * @arg {{data:any,rows:{name:string,text:string}[]}} activeItem
     * @arg {any} responseItem
     * @arg {{name?:string,field:string,arrayFilter?:any}[]} configFields
     * @arg {string} field
     * @arg {string} [name='']
     * @arg {any} [arrayFilter=null]
     * @arg {boolean} [nested=false]
     */
    populateActiveItem(activeItem: { data: any, rows: { name: string, text: string }[] }, responseItem: any,
        configFields: { name?: string, field: string, arrayFilter?: any }[], field: string, name: string = '', arrayFilter: any = null,
        nested: boolean = false) {
        let activeItemData = neonUtilities.deepFind(responseItem, field);
        if (!nested) {
            activeItem.data[field] = activeItemData;
        }

        let activeItemText = this.createTableRowText(activeItemData, arrayFilter);
        if (activeItemText) {
            activeItem.rows.push({
                name: name || (this.options.findField(field) || this.createEmptyField()).prettyName || field,
                text: activeItemText
            });
        }

        // Check for strings and arrays because they are enumerable and will cause issues with the for-in loop.
        if (typeof activeItemData !== 'string' && !(activeItemData instanceof Array)) {
            // Add all object properties in the field for the the response item to the active item.
            _.keys(activeItemData).sort().forEach((property) => {
                // Must validate the nested property of the item.
                if (activeItemData.hasOwnProperty(property)) {
                    // Ignore properties that are defined in the config.
                    let existsInConfig = configFields.some((configField) => configField.field === field + '.' + property);
                    if (!existsInConfig) {
                        this.populateActiveItem(activeItem, responseItem, configFields, field + '.' + property, '', arrayFilter, true);
                    }
                }
            });
        }
    }

    refreshVisualization() {
        // TODO STUB
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
        return 'Document' + (count === 1 ? '' : 's');
    }

    /**
     * Creates and returns the text for the row of the given item in the table.
     *
     * @arg {any} activeItemData
     * @arg {any} [arrayFilter]
     * @return {string}
     */
    createTableRowText(activeItemData: any, arrayFilter?: any): string {
        if (_.isDate(activeItemData)) {
            return moment.utc(activeItemData, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]').format('ddd, MMM D, YYYY, h:mm A');
        }

        if (typeof activeItemData === 'string' || typeof activeItemData === 'number' || typeof activeItemData === 'boolean') {
            if (moment('' + activeItemData, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]', true).isValid()) {
                return moment.utc('' + activeItemData, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]').format('ddd, MMM D, YYYY, h:mm A');
            }
            return ('' + activeItemData) || '';
        }

        if (activeItemData instanceof Array) {
            let matches = [];
            for (let arrayItem of activeItemData) {
                if (!arrayFilter) {
                    matches.push(arrayItem);
                } else if (this.checkIfRecordMatchesFilter(arrayItem, arrayFilter)) {
                    if (!arrayFilter.show || arrayFilter.show === '*') {
                        matches.push(arrayItem);
                    } else {
                        matches.push(arrayItem[arrayFilter.show]);
                    }
                }
            }
            return matches.join(', ') || '';
        }

        return '';
    }

    private checkIfRecordMatchesFilter(record: any, filter: any): boolean {
        if (filter && filter.filterType === '=') {
            for (let item of filter.filterFor) {
                let fieldToFilter = (!filter.filterOn || filter.filterOn === '*') ? record : record[filter.filterOn];
                if (fieldToFilter === item) {
                    return true;
                }
            }
            return false;
        }

        if (filter && filter.filterType === '!=') {
            for (let item of filter.filterFor) {
                let fieldToFilter = (!filter.filterOn || filter.filterOn === '*') ? record : record[filter.filterOn];
                if (fieldToFilter === item) {
                    return false;
                }
            }
            return true;
        }

        return true;
    }

    private openSingleRecord(activeItemData: any) {
        let config = new MatDialogConfig();
        config.data = {
            item: activeItemData,
            showText: this.options.showText,
            textField: this.options.dataField.columnName,
            metadataFields: neonUtilities.flatten(this.options.metadataFields).concat(neonUtilities.flatten(this.options.popoutFields))
        };

        this.singleItemRef = this.dialog.open(DocumentViewerSingleItemComponent, config);
        this.singleItemRef.afterClosed().subscribe(() => {
            this.singleItemRef = null;
        });
    }

    /**
     * Publishes a select_id event for the ID of the given selected item.
     *
     * @arg {any} activeItemData
     * @fires select_id
     * @private
     */
    private selectSingleRecord(activeItemData: any) {
        if (this.options.idField.columnName && activeItemData[this.options.idField.columnName]) {
            this.publishSelectId(activeItemData[this.options.idField.columnName]);
        }
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
     * Returns whether to show the select button.
     *
     * @return {boolean}
     */
    showSelectButton(): boolean {
        return this.options.showSelect && !!this.options.idField.columnName;
    }

    /**
     * Returns whether to show the source button.
     *
     * @return {boolean}
     */
    showSourceButton(): boolean {
        return !this.options.showText && !this.options.hideSource;
    }
}
