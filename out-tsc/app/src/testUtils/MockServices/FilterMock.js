var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
import * as neon from 'neon-framework';
import * as uuid from 'node-uuid';
import * as _ from 'lodash';
import { FilterService } from '../../app/services/filter.service';
var FilterMock = /** @class */ (function (_super) {
    __extends(FilterMock, _super);
    function FilterMock() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    FilterMock.prototype.createMockFilter = function (database, table, whereClause, filterName) {
        var filter = new neon.query.Filter().selectFrom(database, table), name = (typeof filterName === 'string') ? filterName :
            (filterName.visName ? filterName.visName + ' - ' : '') + table + filterName.text ? ': ' + filterName.text : '';
        filter.whereClause = whereClause;
        if (filterName) {
            filter = filter.name(name);
        }
        return filter;
    };
    FilterMock.prototype.addFilter = function (messenger, ownerId, database, table, whereClause, filterName, onSuccess, onError) {
        // avoid network call
        var id = database + '-' + table + '-' + uuid.v4(), filter = this.createMockFilter(database, table, whereClause, filterName);
        this.getFilters().push({
            id: id,
            ownerId: ownerId,
            database: database,
            table: table,
            filter: filter
        });
        // don't do success call to avoid calling query chain
    };
    FilterMock.prototype.getLatestFilterId = function () {
        var filters = this.getFilters();
        return filters[filters.length - 1].id;
    };
    FilterMock.prototype.replaceFilter = function (messenger, id, ownerId, database, table, whereClause, filterName, onSuccess, onError) {
        var filter = this.createMockFilter(database, table, whereClause, filterName);
        var filters = this.getFilters(), index = _.findIndex(filters, { id: id });
        filters[index] = {
            id: id,
            ownerId: ownerId,
            database: database,
            table: table,
            filter: filter
        };
        // don't do success call to avoid calling query chain
    };
    FilterMock.prototype.removeFilter = function (messenger, id, onSuccess, onError) {
        var index = _.findIndex(this.getFilters(), { id: id });
        this.getFilters().splice(index, 1);
        // don't do success call to avoid calling query chain
    };
    return FilterMock;
}(FilterService));
export { FilterMock };
//# sourceMappingURL=FilterMock.js.map