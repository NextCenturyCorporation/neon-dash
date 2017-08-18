import {
    Component,
    OnInit,
    OnDestroy,
    ViewEncapsulation,
    ChangeDetectionStrategy,
    Injector,
    ChangeDetectorRef
} from '@angular/core';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';
import { FieldMetaData } from '../../dataset';
import { neonMappings } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import * as _ from 'lodash';
import {BaseNeonComponent} from '../base-neon-component/base-neon.component';
import { ThemesService } from '../../services/themes.service';

@Component({
    selector: "app-document-viewer",
    templateUrl: "./document-viewer.component.html",
    styleUrls: ['./document-viewer.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentViewerComponent extends BaseNeonComponent implements OnInit, OnDestroy {

    private optionsFromConfig: {
        title: string,
        database: string,
        table: string,
        dataField: string,
        metadataFields: any[], // Array of arrays, with each internal array representing a row of metadata. Each row contains {name, field} objects.
        limit: number
    };

    public active: {
        dataField: FieldMetaData,
        metadataFields: any[],
        limit: number,
        data: any[]
    };

    constructor(connectionService: ConnectionService, datasetService: DatasetService, filterService: FilterService,
        exportService: ExportService, injector: Injector, themesService: ThemesService, ref: ChangeDetectorRef) {
        super(connectionService, datasetService, filterService, exportService, injector, themesService, ref);
        this.optionsFromConfig = {
            title: this.injector.get('title', null),
            database: this.injector.get('database', null),
            table: this.injector.get('table', null),
            dataField: this.injector.get('dataField', null),
            metadataFields: this.injector.get('metadataFields', null),
            limit: this.injector.get('limit', null)
        };
        this.active = {
            dataField: new FieldMetaData(),
            metadataFields: [],
            limit: 50,
            data: []
        };
        this.queryTitle = 'Document Viewer';
    }

    subNgOnInit() {
        this.executeQueryChain();
    }

    postInit() {

    }

    subNgOnDestroy() {

    }

    getOptionFromConfig(field) {
        return this.optionsFromConfig[field];
    }

    onUpdateFields() {
        this.active.dataField = this.findFieldObject('dataField', neonMappings.NEWSFEED_TEXT);
        this.active.metadataFields = this.optionsFromConfig.metadataFields;
    }

    getFilterText(filter) {
        return filter.value;
    }

    createNeonFilterClauseEquals(databaseAndTableName, fieldName) {
        return null; // This visualization doesn't filter.
    }

    getNeonFilterFields() {
        return []; // This visualization doesn't filter.
    }

    getVisualizationName() {
        return "Document Viewer";
    }

    getFiltersToIgnore() {
        return null; // Don't ignore any filters for now.
    }

    isValidQuery() {
        let valid = true;
        valid = (this.meta.database && this.meta.database.name && valid);
        valid = (this.meta.table && this.meta.table.name && valid);
        valid = (this.active.dataField && this.active.dataField.columnName && valid);
        return valid;
    }

    createQuery() {
        let databaseName = this.meta.database.name;
        let tableName = this.meta.table.name;
        let query = new neon.query.Query().selectFrom(databaseName, tableName);
        let whereClause = neon.query.where(this.active.dataField.columnName, '!=', null);
        let fields = this.flatten(this.optionsFromConfig.metadataFields).map(function(x) {
            return x.field;
        }).concat(this.active.dataField.columnName);
        return query.where(whereClause).withFields(fields).limit(this.active.limit);
    }

    flatten(array) {
        return array.reduce(function(sum, element) {
            return sum.concat(Array.isArray(element) ? this.flatten(element) : element);
        }.bind(this));
    }

    deepFind(obj, pathStr) {
        for (let i = 0, path = pathStr.split('.'), len = path.length; i < len; i++) {
            obj = obj[path[i]];
            if (!obj) {
                return undefined;
            }
        };
        return obj;
    }

    onQuerySuccess(response) {
        let fields = this.flatten(this.optionsFromConfig.metadataFields).map(function(x) {
            return x.field;
        }).concat(this.active.dataField.columnName);
        let data = response.data.map(function(element) {
            let elem = {};
            for(let field of fields) {
                elem[field] = this.deepFind(element, field);
            }
            return elem;
        }.bind(this));
        this.active.data = data;
    }

    refreshVisualization() {
        // TODO STUB
    }

    handleFiltersChangedEvent() {

    }

    getExportData() {

    }

    removeFilter(value) {

    }

    handleChangeDataField() {
        this.logChangeAndStartQueryChain();
    }

    handleChangeLimit() {
        this.logChangeAndStartQueryChain();
    }

    formatMetadataEntry(record, metadataEntry) {
        let field = record[metadataEntry.field];
        if(typeof field  === 'string') {
            return field;
        }
        else if(field instanceof Array) {
            let matches = [];
            for(let obj of field) {
                if(!metadataEntry.arrayFilter) {
                    matches.push(obj);
                }
                else if(this.checkIfRecordMatchesFilter(obj, metadataEntry.arrayFilter)) {
                    if(!metadataEntry.arrayFilter.show || metadataEntry.arrayFilter.show == '*') {
                        matches.push(obj);
                    }
                    else {
                        matches.push(obj[metadataEntry.arrayFilter.show]);
                    }
                }
            }
            return matches.join(', ');
        }
        else {
            return '';
        }
    }

    checkIfRecordMatchesFilter(object, filter) {
        if(!filter) {
            return true;
        }
        else if(filter.filterType == '=') {
            for(let item of filter.filterFor) {
                let fieldToFilter = (!filter.filterOn || filter.filterOn == '*') ? object : object[filter.filterOn];
                if(fieldToFilter == item) {
                    return true;
                }
            }
            return false;
        }
        else if(filter.filterType == '!=') {
            let matches = true;
            for(let item of filter.filterFor) {
                let fieldToFilter = (!filter.filterOn || filter.filterOn == '*') ? object : object[filter.filterOn];
                if(fieldToFilter == item) {
                    return false;
                }
            }
            return true;
        }
    }
}

/**
 * arrayFilter is used to filter only for certain results from a returned array. It is designed to accommodate both object and string/number arrays.
 * {
 *     "filterOn": String, the (non-nested) field of each individual object in the array to filter on. Use "" or "*" to filter on the entire object (as for string/number arrays).
 *     "filterType": String, the type of filter this is. Must be one of "=" or "!="
 *     "filterFor": Array, the values we want to include or exclude. The field specified in filterOn must match one of these values to be included/excluded.
 *     "show": String, the field to show for any included object. Use "" or "*" to show the entire object (as for string/number arrays).
 * }
 */
