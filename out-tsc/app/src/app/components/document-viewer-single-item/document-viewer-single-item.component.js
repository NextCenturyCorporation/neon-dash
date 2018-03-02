var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
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
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ThemesService } from '../../services/themes.service';
import { neonUtilities } from '../../neon-namespaces';
import * as neon from 'neon-framework';
var DocumentViewerSingleItemComponent = /** @class */ (function () {
    function DocumentViewerSingleItemComponent(data, themesService, dialogRef) {
        this.themesService = themesService;
        this.dialogRef = dialogRef;
        this.messenger = new neon.eventing.Messenger();
        this.data = data;
        this.text = neonUtilities.deepFind(data.item, data.textField);
        this.metadata = this.data.metadataFields;
    }
    DocumentViewerSingleItemComponent.prototype.ngOnInit = function () {
        // Do nothing.
    };
    DocumentViewerSingleItemComponent.prototype.ngOnDestroy = function () {
        // Do nothing.
    };
    DocumentViewerSingleItemComponent.prototype.formatMetadataEntry = function (record, metadataEntry) {
        var field = record[metadataEntry.field];
        if (typeof field === 'string') {
            return field || 'None';
        }
        else if (field instanceof Array) {
            var matches = [];
            for (var _i = 0, field_1 = field; _i < field_1.length; _i++) {
                var obj = field_1[_i];
                if (!metadataEntry.arrayFilter) {
                    matches.push(obj);
                }
                else if (this.checkIfRecordMatchesFilter(obj, metadataEntry.arrayFilter)) {
                    if (!metadataEntry.arrayFilter.show || metadataEntry.arrayFilter.show === '*') {
                        matches.push(obj);
                    }
                    else {
                        matches.push(obj[metadataEntry.arrayFilter.show]);
                    }
                }
            }
            return matches.join(', ') || 'None';
        }
        else {
            return 'None';
        }
    };
    DocumentViewerSingleItemComponent.prototype.checkIfRecordMatchesFilter = function (object, filter) {
        if (!filter) {
            return true;
        }
        else if (filter.filterType === '=') {
            for (var _i = 0, _a = filter.filterFor; _i < _a.length; _i++) {
                var item = _a[_i];
                var fieldToFilter = (!filter.filterOn || filter.filterOn === '*') ? object : object[filter.filterOn];
                if (fieldToFilter === item) {
                    return true;
                }
            }
            return false;
        }
        else if (filter.filterType === '!=') {
            var matches = true;
            for (var _b = 0, _c = filter.filterFor; _b < _c.length; _b++) {
                var item = _c[_b];
                var fieldToFilter = (!filter.filterOn || filter.filterOn === '*') ? object : object[filter.filterOn];
                if (fieldToFilter === item) {
                    return false;
                }
            }
            return true;
        }
    };
    DocumentViewerSingleItemComponent = __decorate([
        Component({
            selector: 'app-document-viewer-single-item',
            templateUrl: './document-viewer-single-item.component.html',
            styleUrls: ['./document-viewer-single-item.component.scss']
        }),
        __param(0, Inject(MAT_DIALOG_DATA)),
        __metadata("design:paramtypes", [Object, ThemesService,
            MatDialogRef])
    ], DocumentViewerSingleItemComponent);
    return DocumentViewerSingleItemComponent;
}());
export { DocumentViewerSingleItemComponent };
//# sourceMappingURL=document-viewer-single-item.component.js.map