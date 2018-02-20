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

export class FilterMock extends FilterService {
    createMockFilter(database: string, table: string, whereClause: neon.query.WhereClause,
                     filterName: string | { visName: string; text: string }) {
        let filter = new neon.query.Filter().selectFrom(database, table),
            name = (typeof filterName === 'string') ? filterName :
                (filterName.visName ? filterName.visName + ' - ' : '') + table + filterName.text ? ': ' + filterName.text : '';
        filter.whereClause = whereClause;
        if (filterName) {
            filter = filter.name(name);
        }
        return filter;
    }

    addFilter(messenger: neon.eventing.Messenger,
        ownerId: string,
        database: string,
        table: string,
        whereClause: any,
        filterName: string | { visName: string; text: string },
        onSuccess: (resp: any) => any,
        onError: (resp: any) => any) {

        // avoid network call
        let id = database + '-' + table + '-' + uuid.v4(),
            filter = this.createMockFilter(database, table, whereClause, filterName);
        this.getFilters().push({
            id: id,
            ownerId: ownerId,
            database: database,
            table: table,
            filter: filter
        });

        // don't do success call to avoid calling query chain
    }

    getLatestFilterId(): string {
        let filters = this.getFilters();
        return filters[filters.length - 1].id;
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

        let filter = this.createMockFilter(database, table, whereClause, filterName);
        let filters = this.getFilters(),
            index = _.findIndex(filters, { id: id });
        filters[index] = {
            id: id,
            ownerId: ownerId,
            database: database,
            table: table,
            filter: filter
        };

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
