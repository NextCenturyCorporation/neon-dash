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
import { EMPTY_FIELD, FieldMetaData } from '../../dataset';
import { neonUtilities, neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import * as _ from 'lodash';

import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material';

/**
 * Manages configurable options for the specific visualization.
 */
export class DocumentViewerOptions extends BaseNeonOptions {
    public dataField: FieldMetaData;
    public dateField: FieldMetaData;
    public idField: FieldMetaData;
    public metadataFields: any[];
    public popoutFields: any[];
    public showSelect: boolean;
    public showText: boolean;

    /**
     * Initializes all the non-field options for the specific visualization.
     *
     * @override
     */
    onInit() {
        this.metadataFields = neonUtilities.flatten(this.injector.get('metadataFields', []));
        this.popoutFields = neonUtilities.flatten(this.injector.get('popoutFields', []));
        this.showSelect = this.injector.get('showSelect', false);
        this.showText = this.injector.get('showText', false);
    }

    /**
     * Updates all the field options for the specific visualization.  Called on init and whenever the table is changed.
     *
     * @override
     */
    updateFieldsOnTableChanged() {
        this.dataField = this.findFieldObject('dataField');
        this.dateField = this.findFieldObject('dateField');
        this.idField = this.findFieldObject('idField');
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

    subGetBindings(bindings) {
        /*TODO: Fix 22001 Error
        bindings.data = this.activeData;
        bindings.dataField = this.options.dataField;
        bindings.dateField = this.options.dateField;
        bindings.docCount = this.docCount;
        bindings.idField = this.options.idField;
        bindings.page = this.page;
        bindings.metadataFields = this.options.metadataFields;
        bindings.popoutFields = this.options.popoutFields;
        bindings.showSelect = this.options.showSelect;
        bindings.showText = this.options.showText;
        */
    }

    getExportFields() {
        return [{
            columnName: this.options.dataField.columnName,
            prettyName: this.options.dataField.prettyName
        },
        {
            columnName: this.options.dateField.columnName,
            prettyName: this.options.dateField.prettyName
        },
        {
            columnName: this.options.idField.columnName,
            prettyName: this.options.idField.prettyName
        }];
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
        let fields = this.options.metadataFields.map((item) => {
            return item.field;
        }).concat(this.options.dataField.columnName);
        if (this.options.dateField.columnName) {
            fields = fields.concat(this.options.dateField.columnName);
            query = query.sortBy(this.options.dateField.columnName, neonVariables.DESCENDING);
        }
        if (this.options.idField.columnName) {
            fields = fields.concat(this.options.idField.columnName);
        }
        return query.where(whereClause).withFields(fields).limit(this.options.limit).offset((this.page - 1) * this.options.limit);
    }

    onQuerySuccess(response) {
        if (response.data.length === 1 && response.data[0]._docCount !== undefined) {
            this.docCount = response.data[0]._docCount;
        } else {
            let fields = this.options.metadataFields.map((item) => {
                return item.field;
            }).concat(this.options.dataField.columnName);
            if (this.options.dateField.columnName) {
                fields = fields.concat(this.options.dateField.columnName);
            }
            if (this.options.idField.columnName) {
                fields = fields.concat(this.options.idField.columnName);
            }
            let data = response.data.map((element) => {
                let elem = {};
                for (let field of fields) {
                    elem[field] = neonUtilities.deepFind(element, field);
                }
                return elem;
            });
            this.activeData = data;
            this.getDocCount();
        }
    }

    getDocCount() {
        let countQuery = new neon.query.Query().selectFrom(this.options.database.name, this.options.table.name).where(this.createClause())
            .aggregate(neonVariables.COUNT, '*', '_docCount');
        this.executeQuery(countQuery);
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

    formatMetadataEntry(record, metadataEntry) {
        let field = record[metadataEntry.field];
        if (typeof field  === 'string') {
            return field || 'None';
        } else if (field instanceof Array) {
            let matches = [];
            for (let obj of field) {
                if (!metadataEntry.arrayFilter) {
                    matches.push(obj);
                } else if (this.checkIfRecordMatchesFilter(obj, metadataEntry.arrayFilter)) {
                    if (!metadataEntry.arrayFilter.show || metadataEntry.arrayFilter.show === '*') {
                        matches.push(obj);
                    } else {
                        matches.push(obj[metadataEntry.arrayFilter.show]);
                    }
                }
            }
            return matches.join(', ') || 'None';
        } else {
            return 'None';
        }
    }

    private checkIfRecordMatchesFilter(object, filter) {
        if (!filter) {
            return true;
        } else if (filter.filterType === '=') {
            for (let item of filter.filterFor) {
                let fieldToFilter = (!filter.filterOn || filter.filterOn === '*') ? object : object[filter.filterOn];
                if (fieldToFilter === item) {
                    return true;
                }
            }
            return false;
        } else if (filter.filterType === '!=') {
            let matches = true;
            for (let item of filter.filterFor) {
                let fieldToFilter = (!filter.filterOn || filter.filterOn === '*') ? object : object[filter.filterOn];
                if (fieldToFilter === item) {
                    return false;
                }
            }
            return true;
        }
    }

    private openSingleRecord(item) {
        let config = new MatDialogConfig();
        config.data = {
            item: item,
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
     * @arg {object} item
     * @fires select_id
     * @private
     */
    private selectSingleRecord(item) {
        if (this.options.idField.columnName && item[this.options.idField.columnName]) {
            this.publishSelectId(item[this.options.idField.columnName]);
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
}
