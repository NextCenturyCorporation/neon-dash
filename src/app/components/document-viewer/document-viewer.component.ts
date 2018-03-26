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
import { FilterService } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';
import { FieldMetaData } from '../../dataset';
import { neonUtilities, neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import * as _ from 'lodash';
// import * as moment from 'moment';
import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { DocumentViewerSingleItemComponent } from '../document-viewer-single-item/document-viewer-single-item.component';
import { ThemesService } from '../../services/themes.service';
import { VisualizationService } from '../../services/visualization.service';

import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material';

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

    public active: {
        data: any[],
        dataField: FieldMetaData,
        dateField: FieldMetaData,
        docCount: number,
        idField: FieldMetaData,
        page: number,
        metadataFields: any[], // Array of arrays. Each internal array is a row of metadata and contains {name, field} objects.
        popoutFields: any[], // Same as metadataFields in format. Extra fields that will show in the single document popout window.
        showSelect: boolean,
        showText: boolean
    };

    constructor(activeGridService: ActiveGridService, connectionService: ConnectionService, datasetService: DatasetService,
        filterService: FilterService, exportService: ExportService, injector: Injector, themesService: ThemesService,
        public viewContainerRef: ViewContainerRef, ref: ChangeDetectorRef, visualizationService: VisualizationService,
        public dialog: MatDialog) {
        super(activeGridService, connectionService, datasetService, filterService,
            exportService, injector, themesService, ref, visualizationService);

        this.active = {
            data: [],
            dataField: new FieldMetaData(),
            dateField: new FieldMetaData(),
            docCount: 0,
            idField: new FieldMetaData(),
            page: 1,
            metadataFields: neonUtilities.flatten(this.injector.get('metadataFields', [])),
            popoutFields: neonUtilities.flatten(this.injector.get('popoutFields', [])),
            showSelect: this.injector.get('showSelect', false),
            showText: this.injector.get('showText', false)
        };
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
        // TODO
    }

    getExportFields() {
        return [{
            columnName: this.active.dataField.columnName,
            prettyName: this.active.dataField.prettyName
        },
        {
            columnName: this.active.dateField.columnName,
            prettyName: this.active.dateField.prettyName
        },
        {
            columnName: this.active.idField.columnName,
            prettyName: this.active.idField.prettyName
        }];
    }

    onUpdateFields() {
        this.active.dataField = this.findFieldObject('dataField');
        this.active.dateField = this.findFieldObject('dateField');
        this.active.idField = this.findFieldObject('idField');
    }

    getFilterText(filter) {
        return '';
    }

    createNeonFilterClauseEquals(database: string, table: string, fieldName: string) {
        return null; // This visualization doesn't filter.
    }

    getNeonFilterFields() {
        return []; // This visualization doesn't filter.
    }

    getVisualizationName() {
        return 'Document Viewer';
    }

    getFiltersToIgnore() {
        return null;
    }

    isValidQuery(): boolean {
        let valid = true;
        valid = (this.meta.database && this.meta.database.name && valid);
        valid = (this.meta.table && this.meta.table.name && valid);
        valid = (this.active.dataField && this.active.dataField.columnName && valid);
        // We intentionally don't include dateField or idField in the validity check, because we're allowed to leave it null.
        return !!(valid);
    }

    /**
     * Creates and returns the Neon where clause for the visualization.
     *
     * @return {any}
     */
    createClause(): any {
        let clause = neon.query.where(this.active.dataField.columnName, '!=', null);

        if (this.hasUnsharedFilter()) {
            clause = neon.query.and(clause, neon.query.where(this.meta.unsharedFilterField.columnName, '=', this.meta.unsharedFilterValue));
        }

        return clause;
    }

    createQuery() {
        let databaseName = this.meta.database.name;
        let tableName = this.meta.table.name;
        let limit = this.meta.limit;
        let offset = ((this.active.page) - 1) * limit;
        let query = new neon.query.Query().selectFrom(databaseName, tableName);
        let whereClause = this.createClause();
        let fields = this.active.metadataFields.map((item) => {
            return item.field;
        }).concat(this.active.dataField.columnName);
        if (this.active.dateField.columnName) {
            fields = fields.concat(this.active.dateField.columnName);
            query = query.sortBy(this.active.dateField.columnName, neonVariables.DESCENDING);
        }
        if (this.active.idField.columnName) {
            fields = fields.concat(this.active.idField.columnName);
        }
        return query.where(whereClause).withFields(fields).limit(limit).offset(offset);
    }

    onQuerySuccess(response) {
        if (response.data.length === 1 && response.data[0]._docCount !== undefined) {
            this.active.docCount = response.data[0]._docCount;
        } else {
            let fields = this.active.metadataFields.map((item) => {
                return item.field;
            }).concat(this.active.dataField.columnName);
            if (this.active.dateField.columnName) {
                fields = fields.concat(this.active.dateField.columnName);
            }
            if (this.active.idField.columnName) {
                fields = fields.concat(this.active.idField.columnName);
            }
            let data = response.data.map((element) => {
                let elem = {};
                for (let field of fields) {
                    elem[field] = neonUtilities.deepFind(element, field);
                }
                return elem;
            });
            this.active.data = data;
            this.getDocCount();
        }
    }

    getDocCount() {
        let countQuery = new neon.query.Query().selectFrom(this.meta.database.name, this.meta.table.name).where(this.createClause())
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
        if (!this.active.docCount) {
            return 'No Data';
        }
        if (this.active.docCount <= this.active.data.length) {
            return 'Total ' + super.prettifyInteger(this.active.docCount);
        }
        let begin = super.prettifyInteger((this.active.page - 1) * this.meta.limit + 1);
        let end = super.prettifyInteger(Math.min(this.active.page * this.meta.limit, this.active.docCount));
        return (begin === end ? begin : (begin + ' - ' + end)) + ' of ' + super.prettifyInteger(this.active.docCount);
    }

    setupFilters() {
        this.active.page = 1;
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
            textField: this.active.dataField.columnName,
            metadataFields: this.active.metadataFields.concat(this.active.popoutFields)
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
        if (this.active.idField.columnName && item[this.active.idField.columnName]) {
            this.publishSelectId(item[this.active.idField.columnName]);
        }
    }

    nextPage() {
        this.active.page += 1;
        this.executeQueryChain();
    }

    previousPage() {
        this.active.page -= 1;
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
     * Returns the default limit for the visualization.
     *
     * @return {number}
     * @override
     */
    getDefaultLimit() {
        return 50;
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
