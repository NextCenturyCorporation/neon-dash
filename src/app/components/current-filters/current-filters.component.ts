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
import { Component, OnInit, OnDestroy } from '@angular/core';
import { neonEvents } from '../../neon-namespaces';

import { CompoundFilterType } from '../../services/abstract.search.service';
import { FilterDesign, FilterService } from '../../services/filter.service';

import { eventing } from 'neon-framework';

@Component({
    selector: 'app-current-filters',
    templateUrl: './current-filters.component.html',
    styleUrls: ['./current-filters.component.scss']
})
export class CurrentFiltersComponent implements OnInit, OnDestroy {
    private messenger: eventing.Messenger;

    public COMPOUND_FILTER_TYPE = CompoundFilterType;

    public filters: FilterDesign[] = [];

    constructor(public filterService: FilterService) {
        this.messenger = new eventing.Messenger();
    }

    ngOnInit() {
        // TODO Do we really need to subscribe to all of these channels?
        this.messenger.subscribe(neonEvents.DASHBOARD_RESET, this.updateFilters.bind(this));
        this.messenger.subscribe(neonEvents.FILTERS_CHANGED, this.updateFilters.bind(this));
        this.messenger.subscribe(neonEvents.DASHBOARD_STATE, this.updateFilters.bind(this));
        this.updateFilters();
    }

    updateFilters() {
        this.filters = this.filterService.getFilters();
    }

    ngOnDestroy() {
        this.messenger.unsubscribeAll();
    }
}
