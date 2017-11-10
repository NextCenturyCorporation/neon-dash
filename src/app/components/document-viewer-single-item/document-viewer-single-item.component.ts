import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { ThemesService } from '../../services/themes.service';
import { neonUtilities } from '../../neon-namespaces';
import * as neon from 'neon-framework';

@Component({
    selector: 'app-document-viewer-single-item',
    templateUrl: './document-viewer-single-item.component.html',
    styleUrls: ['./document-viewer-single-item.component.scss']
})
export class DocumentViewerSingleItemComponent implements OnInit, OnDestroy {

    private messenger: neon.eventing.Messenger;

    private data: any;
    public text: any;
    public metadata: any;

    constructor(@Inject(MAT_DIALOG_DATA) data: any, public themesService: ThemesService,
        public dialogRef: MatDialogRef<DocumentViewerSingleItemComponent>) {
        this.messenger = new neon.eventing.Messenger();
        this.data = data;
        this.text = neonUtilities.deepFind(data.item, data.textField);
        this.metadata = this.data.metadataFields;
    }

    ngOnInit() {

    }

    ngOnDestroy() {

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
}
