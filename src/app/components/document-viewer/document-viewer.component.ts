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

import { ActiveGridService } from '../../services/active-grid.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { ExportService } from '../../services/export.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { VisualizationService } from '../../services/visualization.service';

import { BaseNeonComponent, BaseNeonOptions } from '../base-neon-component/base-neon.component';
import { DocumentViewerSingleItemComponent } from '../document-viewer-single-item/document-viewer-single-item.component';
import { FieldMetaData } from '../../dataset';
import { neonUtilities, neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import * as _ from 'lodash';
import * as moment from 'moment-timezone';

import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material';

/**
 * Manages configurable options for the specific visualization.
 */
export class DocumentViewerOptions extends BaseNeonOptions {
    public dataField: FieldMetaData;
    public dateField: FieldMetaData;
    public hideSource: boolean;
    public idField: FieldMetaData;
    public metadataFields: any[];
    public nameWidthCss: string;
    public popoutFields: any[];
    public showSelect: boolean;
    public showText: boolean;
    public sortField: FieldMetaData;
    public sortOrder: string;

    /**
     * Appends all the non-field bindings for the specific visualization to the given bindings object and returns the bindings object.
     *
     * @arg {any} bindings
     * @return {any}
     * @override
     */
    appendNonFieldBindings(bindings: any): any {
        bindings.hideSource = this.hideSource;
        bindings.metadataFields = this.metadataFields;
        bindings.nameWidthCss = this.nameWidthCss;
        bindings.popoutFields = this.popoutFields;
        bindings.showSelect = this.showSelect;
        bindings.showText = this.showText;
        bindings.sortOrder = this.sortOrder;

        return bindings;
    }

    /**
     * Returns the list of field properties for the specific visualization.
     *
     * @return {string[]}
     * @override
     */
    getFieldProperties(): string[] {
        return [
            'dataField',
            'dateField',
            'idField',
            'sortField'
        ];
    }

    /**
     * Returns the list of field array properties for the specific visualization.
     *
     * @return {string[]}
     * @override
     */
    getFieldArrayProperties(): string[] {
        return [];
    }

    /**
     * Initializes all the non-field bindings for the specific visualization.
     *
     * @override
     */
    initializeNonFieldBindings() {
        this.hideSource = this.injector.get('hideSource', false);
        this.metadataFields = neonUtilities.flatten(this.injector.get('metadataFields', []));
        this.nameWidthCss = this.injector.get('nameWidthCss', '');
        this.popoutFields = neonUtilities.flatten(this.injector.get('popoutFields', []));
        this.showSelect = this.injector.get('showSelect', false);
        this.showText = this.injector.get('showText', false);
        this.sortOrder = this.injector.get('sortOrder', 'DESCENDING');
    }
}

@Component({
    selector: 'app-document-viewer',
    templateUrl: './document-viewer.component.html',
    styleUrls: ['./document-viewer.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentViewerComponent extends BaseNeonComponent implements OnInit, OnDestroy {
    @ViewChild('visualization', {read: ElementRef}) visualization: ElementRef;
    @ViewChild('headerText') headerText: ElementRef;
    @ViewChild('infoText') infoText: ElementRef;

    private singleItemRef: MatDialogRef<DocumentViewerSingleItemComponent>;

    public options: DocumentViewerOptions;

    public activeData: any[] = [];
    public docCount: number = 0;
    public page: number = 1;

    constructor(
        activeGridService: ActiveGridService,
        connectionService: ConnectionService,
        datasetService: DatasetService,
        filterService: FilterService,
        exportService: ExportService,
        injector: Injector,
        themesService: ThemesService,
        public viewContainerRef: ViewContainerRef,
        ref: ChangeDetectorRef,
        visualizationService: VisualizationService,
        public dialog: MatDialog
    ) {

        super(
            activeGridService,
            connectionService,
            datasetService,
            filterService,
            exportService,
            injector,
            themesService,
            ref,
            visualizationService
        );

        this.options = new DocumentViewerOptions(this.injector, this.datasetService, 'Document Viewer', 50);
    }

    subNgOnInit() {
        this.executeQueryChain();
    }

    postInit() {
        // Do nothing.
    }

    subNgOnDestroy() {
        // Do nothing.
    }

    getFilterText(filter) {
        return '';
    }

    getFiltersToIgnore() {
        return null;
    }

    isValidQuery(): boolean {
        let valid = true;
        valid = (this.options.database && this.options.database.name && valid);
        valid = (this.options.table && this.options.table.name && valid);
        valid = (this.options.dataField && this.options.dataField.columnName && valid);
        // We intentionally don't include dateField or idField in the validity check, because we're allowed to leave it null.
        return !!(valid);
    }

    /**
     * Creates and returns the Neon where clause for the visualization.
     *
     * @return {any}
     */
    createClause(): any {
        let clause = neon.query.where(this.options.dataField.columnName, '!=', null);

        if (this.hasUnsharedFilter()) {
            clause = neon.query.and(clause, neon.query.where(this.options.unsharedFilterField.columnName, '=',
                this.options.unsharedFilterValue));
        }

        return clause;
    }

    createQuery() {
        let query = new neon.query.Query().selectFrom(this.options.database.name, this.options.table.name);
        let whereClause = this.createClause();
        let fields = [this.options.dataField.columnName].concat(this.options.metadataFields.map((item) => {
            return item.field;
        })).concat(this.options.popoutFields.map((item) => {
            return item.field;
        }));
        if (this.options.dateField.columnName) {
            fields = fields.concat(this.options.dateField.columnName);
        }
        if (this.options.sortField.columnName) {
            query = query.sortBy(this.options.sortField.columnName,
                (this.options.sortOrder === 'DESCENDING') ? neonVariables.DESCENDING : neonVariables.ASCENDING);
        }
        if (this.options.idField.columnName) {
            fields = fields.concat(this.options.idField.columnName);
        }
        return query.where(whereClause).withFields(fields).limit(this.options.limit).offset((this.page - 1) * this.options.limit);
    }

    onQuerySuccess(response) {
        if (response.data.length === 1 && response.data[0]._docCount !== undefined) {
            this.docCount = response.data[0]._docCount;
            return;
        }

        let configFields: { name?: string, field: string, arrayFilter?: any }[] = this.options.metadataFields.concat(
            this.options.popoutFields);

        if (!configFields.some((configField) => {
            return configField.field === this.options.dataField.columnName;
        })) {
            configFields.splice(0, 0, {
                field: this.options.dataField.columnName,
                name: this.options.dataField.prettyName
            });
        }

        if (this.options.dateField.columnName && !configFields.some((configField) => {
            return configField.field === this.options.dateField.columnName;
        })) {
            configFields.push({
                field: this.options.dateField.columnName,
                name: this.options.dateField.prettyName
            });
        }

        if (this.options.idField.columnName && !configFields.some((configField) => {
            return configField.field === this.options.idField.columnName;
        })) {
            configFields.push({
                field: this.options.idField.columnName,
                name: this.options.idField.prettyName
            });
        }

        this.activeData = response.data.map((responseItem) => {
            let activeItem = {
                data: {},
                rows: []
            };
            configFields.forEach((configField) => {
                this.populateActiveItem(activeItem, responseItem, configFields, configField.field, configField.name,
                    configField.arrayFilter);
            });
            return activeItem;
        });

        this.getDocCount();
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
                    let existsInConfig = configFields.some((configField) => {
                        return configField.field === field + '.' + property;
                    });
                    if (!existsInConfig) {
                        this.populateActiveItem(activeItem, responseItem, configFields, field + '.' + property, '', arrayFilter, true);
                    }
                }
            });
        }
    }

    getDocCount() {
        if (!this.cannotExecuteQuery()) {
            let countQuery = new neon.query.Query().selectFrom(this.options.database.name, this.options.table.name)
                .where(this.createClause()).aggregate(neonVariables.COUNT, '*', '_docCount');
            this.executeQuery(countQuery);
        }
    }

    refreshVisualization() {
        // TODO STUB
    }

    /**
     * Creates and returns the text for the settings button.
     *
     * @return {string}
     * @override
     */
    getButtonText() {
        if (!this.docCount) {
            if (this.options.hideUnfiltered) {
                return 'Please Filter';
            }
            return 'No Data';
        }
        if (this.docCount <= this.activeData.length) {
            return 'Total ' + super.prettifyInteger(this.docCount);
        }
        let begin = super.prettifyInteger((this.page - 1) * this.options.limit + 1);
        let end = super.prettifyInteger(Math.min(this.page * this.options.limit, this.docCount));
        return (begin === end ? begin : (begin + ' - ' + end)) + ' of ' + super.prettifyInteger(this.docCount);
    }

    setupFilters() {
        this.page = 1;
        this.executeQueryChain();
    }

    removeFilter() {
        // Do nothing.
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
            let matches = true;
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
            metadataFields: this.options.metadataFields.concat(this.options.popoutFields)
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

    nextPage() {
        this.page += 1;
        this.executeQueryChain();
    }

    previousPage() {
        this.page -= 1;
        this.executeQueryChain();
    }

    /**
     * Returns the list of filter objects.
     *
     * @return {array}
     * @override
     */
    getCloseableFilters(): any[] {
        return [];
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
     * Returns the options for the specific visualization.
     *
     * @return {BaseNeonOptions}
     * @override
     */
    getOptions(): BaseNeonOptions {
        return this.options;
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
