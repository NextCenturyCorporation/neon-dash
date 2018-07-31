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
import * as _ from 'lodash';
import { FilterService, ServiceFilter } from '../../app/services/filter.service';

export class FilterServiceMock extends FilterService {
    addFilter(messenger: neon.eventing.Messenger,
        ownerId: string,
        database: string,
        table: string,
        whereClause: any,
        filterName: string | { visName: string; text: string },
        onSuccess: (resp: any) => any,
        onError: (resp: any) => any) {

        // avoid network call
        let id = database + '-' + table + '-' + filterName;
        let filter = this.createNeonFilter(database, table, whereClause, this.getFilterNameString(database, table, filterName));
        this.filters.push(new ServiceFilter(id, ownerId, database, table, filter));

        // don't do success call to avoid calling query chain
    }

    // Override to avoid calls to the DatasetService.
    getFilterNameString(database: string, table: string, filterName: string | {visName: string, text: string}): string {
        if (typeof filterName === 'object') {
            return (filterName.visName ? filterName.visName + ' - ' : '') + database + ' - ' + table +
                (filterName.text ? ': ' + filterName.text : '');
        }
        return filterName;
    }

    getLatestFilterId(): string {
        return this.filters[this.filters.length - 1].id;
    }

    replaceFilter(messenger: neon.eventing.Messenger,
        id: string,
        ownerId: string,
        database: string,
        table: string,
        whereClause: any,
        filterName: string | {visName: string, text: string},
        onSuccess: (resp: any) => any,
        onError: (resp: any) => any) {

        let filter = this.createNeonFilter(database, table, whereClause, this.getFilterNameString(database, table, filterName));
        let index = _.findIndex(this.filters, { id: id });
        this.filters[index] = new ServiceFilter(id, ownerId, database, table, filter);

        // don't do success call to avoid calling query chain
    }

    removeFilter(messenger: neon.eventing.Messenger,
        id: string,
        onSuccess?: (resp: any) => any,
        onError?: (resp: any) => any) {

        let index = _.findIndex(this.getFilters(), {id: id});
        this.getFilters().splice(index, 1);

        // don't do success call to avoid calling query chain
    }
}
