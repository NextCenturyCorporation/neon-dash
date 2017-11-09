import {
    Component,
    OnInit,
    OnDestroy,
    ViewEncapsulation,
    ChangeDetectionStrategy,
    Injector,
    ChangeDetectorRef,
    ViewContainerRef
} from '@angular/core';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';
import { FieldMetaData } from '../../dataset';
import { neonMappings, neonUtilities } from '../../neon-namespaces';
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

    private singleItemRef: MatDialogRef<DocumentViewerSingleItemComponent>;

    private optionsFromConfig: {
        title: string,
        database: string,
        table: string,
        dataField: string,
        dateField: string,
        idField: string,
        metadataFields: any[], // Array of arrays. Each internal array is a row of metadata and contains {name, field} objects.
        popoutFields: any[], // Same as metadataFields in format. Extra fields that will show in the single document popout window.
        limit: number
    };

    public active: {
        dataField: FieldMetaData,
        dateField: FieldMetaData,
        idField: FieldMetaData,
        metadataFields: any[],
        limit: number,
        data: any[],
        docCount: number
    };

    constructor(connectionService: ConnectionService, datasetService: DatasetService, filterService: FilterService,
        exportService: ExportService, injector: Injector, themesService: ThemesService, public viewContainerRef: ViewContainerRef,
        ref: ChangeDetectorRef, visualizationService: VisualizationService, public dialog: MatDialog) {
        super(connectionService, datasetService, filterService, exportService, injector, themesService, ref, visualizationService);
        this.optionsFromConfig = {
            title: this.injector.get('title', null),
            database: this.injector.get('database', null),
            table: this.injector.get('table', null),
            dataField: this.injector.get('dataField', null),
            dateField: this.injector.get('dateField', null),
            idField: this.injector.get('idField', null),
            metadataFields: this.injector.get('metadataFields', null),
            popoutFields: this.injector.get('popoutFields', null),
            limit: this.injector.get('limit', null)
        };
        this.active = {
            dataField: new FieldMetaData(),
            dateField: new FieldMetaData(),
            idField: new FieldMetaData(),
            metadataFields: [],
            limit: 50,
            data: [],
            docCount: 0
        };
        this.queryTitle = this.optionsFromConfig.title || 'Document Viewer';
    }

    subNgOnInit() {
        this.executeQueryChain();
    }

    postInit() {

    }

    subNgOnDestroy() {

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

    getOptionFromConfig(field) {
        return this.optionsFromConfig[field];
    }

    onUpdateFields() {
        this.active.dataField = this.findFieldObject('dataField', neonMappings.NEWSFEED_TEXT);
        this.active.dateField = this.findFieldObject('dateField', null); // If not set in the config, ignore it altogether.
        this.active.idField = this.findFieldObject('idField', null);
        this.active.metadataFields = this.optionsFromConfig.metadataFields;
    }

    getFilterText(filter) {
        return filter.value;
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

    isValidQuery() {
        let valid = true;
        valid = (this.meta.database && this.meta.database.name && valid);
        valid = (this.meta.table && this.meta.table.name && valid);
        valid = (this.active.dataField && this.active.dataField.columnName && valid);
        // We intentionally don't include dateField or idField in the validity check, because we're allowed to leave it null.
        return valid;
    }

    createQuery() {
        let databaseName = this.meta.database.name;
        let tableName = this.meta.table.name;
        let query = new neon.query.Query().selectFrom(databaseName, tableName);
        let whereClause = neon.query.where(this.active.dataField.columnName, '!=', null);
        let fields = neonUtilities.flatten(this.optionsFromConfig.metadataFields).map(function(x) {
            return x.field;
        }).concat(this.active.dataField.columnName);
        if (this.active.dateField.columnName) {
            fields = fields.concat(this.active.dateField.columnName);
            query = query.sortBy(this.active.dateField.columnName, neon.query['DESCENDING']);
        }
        if (this.active.idField.columnName) {
            fields = fields.concat(this.active.idField.columnName);
        }
        return query.where(whereClause).withFields(fields).limit(this.active.limit);

    }

    onQuerySuccess(response) {
        if (response.data.length === 1 && response.data[0]['_docCount'] !== undefined) {
            this.active.docCount = response.data[0]['_docCount'];
        } else {
            let fields = neonUtilities.flatten(this.optionsFromConfig.metadataFields).map(function(x) {
                return x.field;
            }).concat(this.active.dataField.columnName);
            if (this.active.dateField.columnName) {
                fields = fields.concat(this.active.dateField.columnName);
            }
            if (this.active.idField.columnName) {
                fields = fields.concat(this.active.idField.columnName);
            }
            let data = response.data.map(function(element) {
                let elem = {};
                for (let field of fields) {
                    elem[field] = neonUtilities.deepFind(element, field);
                }
                return elem;
            }.bind(this));
            this.active.data = data;
            this.getDocCount();
        }
    }

    getDocCount() {
        let databaseName = this.meta.database.name;
        let tableName = this.meta.table.name;
        let whereClause = neon.query.where(this.active.dataField.columnName, '!=', null);
        let countQuery = new neon.query.Query()
            .selectFrom(databaseName, tableName)
            .where(whereClause)
            .aggregate(neon.query['COUNT'], '*', '_docCount');
        this.executeQuery(countQuery);
    }

    refreshVisualization() {
        // TODO STUB
    }

    getButtonText() {
        return !this.active.data.length ?
            'No Data' :
            this.active.data.length < this.active.docCount ?
                'Top ' + this.active.data.length + ' of ' + this.active.docCount :
                'Total ' + this.active.data.length;
    }

    setupFilters() {
        this.executeQueryChain();
    }

    removeFilter(value) {

    }

    handleChangeDataField() {
        this.logChangeAndStartQueryChain();
    }

    handleChangeDateField() {
        this.logChangeAndStartQueryChain();
    }

    handleChangeLimit() {
        this.logChangeAndStartQueryChain();
    }

    formatMetadataEntry(record, metadataEntry) {
        let field = record[metadataEntry.field];
        if (typeof field  === 'string') {
            // let asDate = moment(field, 'ddd MMM D hh:mm:ss ')
            // if ()
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

    checkIfRecordMatchesFilter(object, filter) {
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
        // config.viewContainerRef = this.viewContainerRef;
        let metadata = this.optionsFromConfig.metadataFields;
        if (this.optionsFromConfig.popoutFields) {
            metadata = metadata.concat(this.optionsFromConfig.popoutFields);
        }
        config.data = {
            item: item,
            textField: this.active.dataField.columnName,
            metadataFields: metadata
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
}
