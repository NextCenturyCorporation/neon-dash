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
import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { neonEvents } from '../../neon-namespaces';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { FilterService } from '../../services/filter.service';

import * as neon from 'neon-framework';
import * as _ from 'lodash';

@Component({
    selector: 'app-current-filters',
    templateUrl: './current-filters.component.html',
    styleUrls: ['./current-filters.component.scss']
})
export class CurrentFiltersComponent implements OnInit, OnDestroy {

    @Input() widgets: Map<string, BaseNeonComponent>;

    private messenger: neon.eventing.Messenger;
    public filters: {
        raw: any[],
        formatted: any[]
    };

    constructor(protected filterService: FilterService) {
        this.messenger = new neon.eventing.Messenger();
        this.filters = {
            raw: [],
            formatted: []
        };

    }

    ngOnInit() {
        this.onEventChanged = this.onEventChanged.bind(this);
        this.filters = {
            raw: [],
            formatted: []
        };

        this.messenger.events({
            activeDatasetChanged: this.onEventChanged,
            filtersChanged: this.onEventChanged
        });

        this.messenger.subscribe(neonEvents.DASHBOARD_STATE, this.onEventChanged);
        this.onEventChanged();
    }

    removeFilter(filterIds: string[]) {
        let onSuccess = (removedFilter) => {
            let visualization = this.widgets.get(removedFilter.ownerId);
            if (visualization) {
                visualization.removeFilter(removedFilter);
            }
            this.onEventChanged();
        };
        this.filterService.removeFilters(this.messenger, filterIds, onSuccess.bind(this));
    }

    removeAllFilters() {
        let filterIds = [];
        for (let filter of this.filters.raw) {
            filterIds.push(filter.id);
        }

        this.removeFilter(filterIds);
        this.filterService.clearFilters();
    }

    onEventChanged() {
        this.updateCurrentFilters(this.filterService.getFilters());
    }

    updateCurrentFilters(rawState: any[]) {
        this.filters.raw = rawState;
        let filters = this.formatFilters(rawState);
        this.filters.formatted = filters;
    }

    formatFilters(filters: any[]): any[] {
        if (filters.length > 0) {
            // We only want unique filter names to eliminate display of multiple filters created by filter service

            // remove filters with empty string names and those without an owner ID (which are created by relations).
            let filterList = _.filter(filters, (filter) => {
                return (filter.filter.filterName && filter.filter.filterName !== '' && filter.ownerId !== undefined);
            });

            let result = {};
            _.each(filterList, (filter) => {
                if (result[filter.filter.filterName]) {
                    // add id to array
                    result[filter.filter.filterName].ids.push(filter.id);
                } else {
                    result[filter.filter.filterName] = {
                        ids: [filter.id],
                        name: filter.filter.filterName
                    };
                }
            });

            let resultList = [];
            _.each(result, (filter) => {
                resultList.push(filter);
            });

            return resultList;
        }
        return [];
    }

    ngOnDestroy() {
        this.messenger.unsubscribeAll();
    }

}
