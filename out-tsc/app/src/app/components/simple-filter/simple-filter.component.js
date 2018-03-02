var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
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
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { DatasetService } from '../../services/dataset.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import * as neon from 'neon-framework';
import * as uuid from 'node-uuid';
var SimpleFilterComponent = /** @class */ (function () {
    function SimpleFilterComponent(datasetService, filterService, themesService) {
        this.datasetService = datasetService;
        this.filterService = filterService;
        this.themesService = themesService;
        this.simpleFilter = new BehaviorSubject(undefined);
        this.filterId = new BehaviorSubject(undefined);
        this.id = uuid.v4();
        this.messenger = new neon.eventing.Messenger();
        this.setSimpleFilter();
    }
    SimpleFilterComponent.prototype.setSimpleFilter = function () {
        var options = this.datasetService.getActiveDatasetOptions();
        this.simpleFilter.next(options && options.simpleFilter);
        this.removeFilter();
    };
    SimpleFilterComponent.prototype.addFilter = function (term) {
        var _this = this;
        if (term.length === 0) {
            this.removeFilter();
            return;
        }
        var sf = this.simpleFilter.getValue(), whereContains = neon.query.where(sf.fieldName, 'contains', term), filterName = "simple filter for " + sf.fieldName + " containing '" + term + "'", filterId = this.filterId.getValue(), noOp = function () { };
        if (filterId) {
            this.filterService.replaceFilter(this.messenger, filterId, this.id, sf.databaseName, sf.tableName, whereContains, filterName, noOp, noOp);
        }
        else {
            this.filterService.addFilter(this.messenger, this.id, sf.databaseName, sf.tableName, whereContains, filterName, function (id) { return _this.filterId.next(typeof id === 'string' ? id : null); }, noOp);
        }
    };
    SimpleFilterComponent.prototype.removeFilter = function () {
        var _this = this;
        var filterId = this.filterId.getValue();
        if (filterId) {
            this.filterService.removeFilters(this.messenger, [filterId], function () { return _this.filterId.next(undefined); });
        }
    };
    SimpleFilterComponent = __decorate([
        Component({
            selector: 'app-simple-filter',
            templateUrl: './simple-filter.component.html',
            styleUrls: ['./simple-filter.component.scss'],
            changeDetection: ChangeDetectionStrategy.OnPush
        }),
        __metadata("design:paramtypes", [DatasetService, FilterService, ThemesService])
    ], SimpleFilterComponent);
    return SimpleFilterComponent;
}());
export { SimpleFilterComponent };
//# sourceMappingURL=simple-filter.component.js.map