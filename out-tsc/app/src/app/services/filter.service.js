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
import { Injectable } from '@angular/core';
import * as neon from 'neon-framework';
import { ErrorNotificationService } from './error-notification.service';
import { DatasetService } from './dataset.service';
import * as uuid from 'node-uuid';
import * as _ from 'lodash';
var FilterService = /** @class */ (function () {
    function FilterService(errorNotificationService, datasetService) {
        this.errorNotificationService = errorNotificationService;
        this.datasetService = datasetService;
        this.messenger = new neon.eventing.Messenger();
        this.filters = [];
    }
    /**
     * Gets all the filters from the server.
     * @param {Function} [onSuccess] Optional success callback
     * @param {Function} [onError] Optional error callback
     * @method getFilterState
     */
    FilterService.prototype.getFilterState = function (onSuccess, onError) {
        var _this = this;
        neon.query.Filter.getFilterState('*', '*', function (filters) {
            _this.filters = filters;
            if (onSuccess) {
                onSuccess();
            }
        }, function (response) {
            if (onError) {
                onError(response);
            }
            else if (response.responseJSON) {
                _this.errorNotificationService.showErrorMessage(null, response.responseJSON);
            }
        });
    };
    /**
     * Returns all filters matching the given comparitor object. The comparitor object can be as sparse
     * or as detailed as desired, and only filters matching every given field will be returned. If no parameter
     * is given, all filters are returned.
     * @param {Object} [comparitor] The object to use as a filter for returning filters.
     * @return {List} The list of all filters that match the given object.
     */
    FilterService.prototype.getFilters = function (comparitor) {
        var matches = [];
        // Check the obvious case first to avoid unnecessary comparisons.
        if (!comparitor) {
            return this.filters;
        }
        var _loop_1 = function (filter) {
            // if unable to find mismatched values, must be equal
            if (!Object.keys(comparitor).find(function (key) { return !_.isEqual(comparitor[key], filter[key]); })) {
                matches.push(filter);
            }
        };
        for (var _i = 0, _a = this.filters; _i < _a.length; _i++) {
            var filter = _a[_i];
            _loop_1(filter);
        }
        return matches;
    };
    /**
     * Convenience method to get a filter by its string ID.
     * @param {String} [filterId] The ID of the filter to return.
     * @return The filter with the given ID, or undefined if none exists.
     * @method getFilterById
     */
    FilterService.prototype.getFilterById = function (filterId) {
        var matches = this.getFilters({ id: filterId });
        if (matches.length === 0) {
            return undefined;
        }
        else {
            return matches[0];
        }
    };
    /**
     * Convenience method to get all filters with the given owner.
     * @param {String} [ownerVisId] The ID of the visualization whose filters to get.
     * @return {List} The filters belonging to the give nvisualization.
     * @method getFiltersByOwner
     */
    FilterService.prototype.getFiltersByOwner = function (ownerVisId) {
        return this.getFilters({ ownerId: ownerVisId });
    };
    FilterService.prototype.getFiltersForFields = function (database, table, fields) {
        var checkClauses = function (clause) {
            if (clause.type === 'where' && fields.indexOf(clause.lhs) >= 0) {
                return true;
            }
            else if (clause.type !== 'where') {
                for (var _i = 0, _a = clause.whereClauses; _i < _a.length; _i++) {
                    var whereClause = _a[_i];
                    if (!checkClauses(whereClause)) {
                        return false;
                    }
                }
                return true;
            }
        };
        var matchingFilters = [];
        for (var _i = 0, _a = this.getFilters({ database: database, table: table }); _i < _a.length; _i++) {
            var filter = _a[_i];
            if (checkClauses(filter.filter.whereClause)) {
                matchingFilters.push(filter);
            }
        }
        return matchingFilters;
    };
    FilterService.prototype.addFilter = function (messenger, ownerId, database, table, whereClause, filterName, onSuccess, onError) {
        var _this = this;
        var filter = this.createNeonFilter(database, table, whereClause, this.getFilterNameString(database, table, filterName));
        var id = database + '-' + table + '-' + uuid.v4();
        messenger.addFilter(id, filter, function () {
            _this.filters.push({
                id: id,
                ownerId: ownerId,
                database: database,
                table: table,
                filter: filter
            });
            onSuccess(id); // Return the ID of the created filter.
        }, onError);
    };
    FilterService.prototype.replaceFilter = function (messenger, id, ownerId, database, table, whereClause, filterName, onSuccess, onError) {
        var _this = this;
        var filter = this.createNeonFilter(database, table, whereClause, this.getFilterNameString(database, table, filterName));
        messenger.replaceFilter(id, filter, function () {
            var index = _.findIndex(_this.filters, { id: id });
            _this.filters[index] = {
                id: id,
                ownerId: ownerId,
                database: database,
                table: table,
                filter: filter
            };
            onSuccess(id); // Return the ID of the replaced filter.
        }, onError);
    };
    FilterService.prototype.removeFilter = function (messenger, id, onSuccess, onError) {
        var _this = this;
        messenger.removeFilter(id, function () {
            var index = _.findIndex(_this.filters, { id: id });
            var removedFilter = _this.filters.splice(index, 1)[0];
            if (onSuccess) {
                onSuccess(removedFilter); // Return the removed filter.
            }
        }, onError);
    };
    FilterService.prototype.removeFilters = function (messenger, ids, onSuccess, onError) {
        for (var _i = 0, ids_1 = ids; _i < ids_1.length; _i++) {
            var id = ids_1[_i];
            this.removeFilter(messenger, id, onSuccess, onError);
        }
    };
    FilterService.prototype.getFilterNameString = function (database, table, filterName) {
        if (typeof filterName === 'object') {
            var nameString = filterName.visName ? filterName.visName + ' - ' : '';
            nameString += this.datasetService.getTableWithName(database, table).prettyName;
            nameString += filterName.text ? ': ' + filterName.text : '';
            return nameString;
        }
        else {
            return filterName;
        }
    };
    FilterService.prototype.createNeonFilter = function (database, table, whereClause, filterName) {
        var filter = new neon.query.Filter().selectFrom(database, table);
        filter.whereClause = whereClause;
        if (filterName) {
            filter = filter.name(filterName);
        }
        return filter;
    };
    FilterService = __decorate([
        Injectable(),
        __metadata("design:paramtypes", [ErrorNotificationService, DatasetService])
    ], FilterService);
    return FilterService;
}());
export { FilterService };
//# sourceMappingURL=filter.service.js.map