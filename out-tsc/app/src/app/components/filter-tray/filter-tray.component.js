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
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { ActiveGridService } from '../../services/active-grid.service';
import { ParameterService } from '../../services/parameter.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import * as neon from 'neon-framework';
import * as _ from 'lodash';
var FilterTrayComponent = /** @class */ (function () {
    function FilterTrayComponent(activeGridService, filterService, themesService, dialogRef) {
        this.activeGridService = activeGridService;
        this.filterService = filterService;
        this.themesService = themesService;
        this.dialogRef = dialogRef;
        this.messenger = new neon.eventing.Messenger();
        this.themesService = themesService;
        this.filters = {
            raw: [],
            formatted: []
        };
    }
    FilterTrayComponent.prototype.ngOnInit = function () {
        this.onEventChanged = this.onEventChanged.bind(this);
        this.filters = {
            raw: [],
            formatted: []
        };
        this.messenger.events({
            activeDatasetChanged: this.onEventChanged,
            filtersChanged: this.onEventChanged
        });
        this.messenger.subscribe(ParameterService.STATE_CHANGED_CHANNEL, this.onEventChanged);
        this.onEventChanged();
    };
    FilterTrayComponent.prototype.removeFilter = function (filterIds) {
        var _this = this;
        var onSuccess = function (removedFilter) {
            var visualization = _this.activeGridService.getVisualizationById(removedFilter.ownerId);
            visualization.removeFilter(removedFilter);
            _this.onEventChanged();
        };
        this.filterService.removeFilters(this.messenger, filterIds, onSuccess.bind(this));
    };
    FilterTrayComponent.prototype.onEventChanged = function () {
        this.updateFilterTray(this.filterService.getFilters());
    };
    FilterTrayComponent.prototype.updateFilterTray = function (rawState) {
        this.filters.raw = rawState;
        var filters = this.formatFilters(rawState);
        this.filters.formatted = filters;
    };
    FilterTrayComponent.prototype.formatFilters = function (filters) {
        if (filters.length > 0) {
            // We only want unique filter names to eliminate display of multiple filters created by filter service
            // remove filters with empty string names
            var filterList = _.filter(filters, function (filter) {
                return (filter.filter.filterName && filter.filter.filterName !== '');
            });
            var result_1 = {};
            _.each(filterList, function (filter) {
                if (result_1[filter.filter.filterName]) {
                    // add id to array
                    result_1[filter.filter.filterName].ids.push(filter.id);
                }
                else {
                    result_1[filter.filter.filterName] = {
                        ids: [filter.id],
                        name: filter.filter.filterName
                    };
                }
            });
            var resultList_1 = [];
            _.each(result_1, function (filter) {
                resultList_1.push(filter);
            });
            return resultList_1;
        }
        return [];
    };
    FilterTrayComponent.prototype.ngOnDestroy = function () {
        this.messenger.unsubscribeAll();
    };
    FilterTrayComponent = __decorate([
        Component({
            selector: 'app-filter-tray',
            templateUrl: './filter-tray.component.html',
            styleUrls: ['./filter-tray.component.scss']
        }),
        __metadata("design:paramtypes", [ActiveGridService, FilterService,
            ThemesService, MatDialogRef])
    ], FilterTrayComponent);
    return FilterTrayComponent;
}());
export { FilterTrayComponent };
//# sourceMappingURL=filter-tray.component.js.map