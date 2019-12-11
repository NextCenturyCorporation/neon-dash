/**
 * Copyright 2019 Next Century Corporation
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
 */
import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { neonEvents } from '../../models/neon-namespaces';

import { AbstractFilter } from 'nucleus/dist/core/models/filters';
import { CompoundFilterType } from 'nucleus/dist/core/models/config-option';
import { Dataset } from 'nucleus/dist/core/models/dataset';
import { InjectableFilterService } from '../../services/injectable.filter.service';

import { eventing } from 'neon-framework';
import { DashboardService } from '../../services/dashboard.service';

interface FilterGroup {
    name: string;
    multi?: boolean;
    filters?: AbstractFilter[];
}

@Component({
    selector: 'app-current-filters',
    templateUrl: './current-filters.component.html',
    styleUrls: ['./current-filters.component.scss']
})
export class CurrentFiltersComponent implements OnInit, OnDestroy {
    private messenger: eventing.Messenger;

    public COMPOUND_FILTER_TYPE = CompoundFilterType;

    public groups: FilterGroup[] = [];

    public dataset: Dataset;

    constructor(
        public filterService: InjectableFilterService,
        public dashboardService: DashboardService
    ) {
        this.messenger = new eventing.Messenger();
    }

    @HostBinding('style.display')
    get visible() {
        return this.groups.length > 0 ? 'grid' : 'none';
    }

    ngOnInit() {
        // TODO Do we really need to subscribe to all of these channels?
        this.dashboardService.stateSource.subscribe((dashboardState) => {
            this.dataset = dashboardState.asDataset();
            this.updateFilters();
        });
        this.filterService.registerFilterChangeListener('FilterList', this.updateFilters.bind(this));
        this.messenger.subscribe(neonEvents.DASHBOARD_REFRESH, this.updateFilters.bind(this));
    }

    remove(filter: AbstractFilter) {
        this.filterService.deleteFilter('FilterList', filter.toDesign());
    }

    removeAll() {
        this.filterService.deleteFilters('FilterList', this.groups
            .reduce((acc, group) => acc.concat(group.filters), [] as AbstractFilter[])
            .map((filter) => filter.toDesign()));
    }

    updateFilters() {
        if (!this.dataset) {
            return;
        }
        this.groups = [];
        for (const filter of this.filterService.getFilters()) {
            const filterFieldLabel = filter.getLabelForField(this.dataset, true);
            const fieldGroup = this.groups.find((group) => group.name === filterFieldLabel);
            if (!fieldGroup) {
                this.groups.push({
                    name: filterFieldLabel,
                    filters: [filter]
                });
            } else {
                fieldGroup.multi = true;
                fieldGroup.filters.push(filter);
                fieldGroup.filters.sort((group1, group2) =>
                    `${group1.getLabelForValue(this.dataset, true)}`.localeCompare(`${group2.getLabelForValue(this.dataset, true)}`));
            }
        }
        this.groups.sort((group1, group2) => group1.name.localeCompare(group2.name));
    }

    ngOnDestroy() {
        this.messenger.unsubscribeAll();
    }
}
