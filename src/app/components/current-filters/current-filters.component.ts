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

import { CompoundFilterType } from '../../services/abstract.search.service';
import { FilterDesign, FilterService, AbstractFilter, SimpleFilter, CompoundFilter } from '../../services/filter.service';

import * as moment from 'moment';

import { eventing } from 'neon-framework';
import { DashboardService } from '../../services/dashboard.service';
import { Router } from '@angular/router';

interface FilterDisplay {
    full: FilterDesign;
    text?: string;
    field?: string;
    op?: string;
    value?: any;
}

interface FilterGroup {
    name: string;
    multi?: boolean;
    filters?: FilterDisplay[];
}

export class FilterDisplayUtil {
    static cleanValue(type: string, val: any) {
        switch (type) {
            case 'date': return moment(val).format('YYYY-MM-DD');
            case 'geo': return parseFloat(val).toFixed(3);
            default: return val;
        }
    }

    static translateOperator(type: string, op: string) {
        switch (type) {
            case 'date': return op.replace(/^<=?$/, 'before').replace(/^>=?$/, 'after');
            default: return op.replace(/^=$/g, 'is');
        }
    }

    static isGeo(type: string, name: string) {
        return type === 'double' && (/[.](lat|lon)$/i).test(name);
    }

    static computeFilter(filter: AbstractFilter): FilterDisplay {
        let ret: Partial<FilterDisplay>;
        if (filter instanceof SimpleFilter) {
            ret = {
                field: filter.field.prettyName,
                value: this.cleanValue(filter.field.type, filter.value),
                op: this.translateOperator(filter.field.type, filter.operator)
            };
        } else if (filter instanceof CompoundFilter) {
            const simples = filter.filters.filter((nestedFilter) => nestedFilter instanceof SimpleFilter) as SimpleFilter[];
            const latLongs = simples.filter((nestedFilter) => this.isGeo(nestedFilter.field.type, nestedFilter.field.prettyName));
            const dates = simples.filter((nestedFilter) => nestedFilter.field.type === 'date');

            if (filter.filters.length === 2) {
                if (dates.length === 2) {
                    ret = {
                        field: dates[0].field.prettyName,
                        op: 'between',
                        value: `${this.cleanValue('date', dates[0].value)} and ${this.cleanValue('date', dates[1].value)}`
                    };
                } else if (latLongs.length === 2) {
                    ret = {
                        field: latLongs[0].field.prettyName.replace(/[.](lat|lon)$/i, ''),
                        op: 'at',
                        value: `(${this.cleanValue('geo', latLongs[0].value)}, ${this.cleanValue('geo', latLongs[1].value)})`
                    };
                }
            } else if (filter.filters.length === 4) {
                if (latLongs.length === 4) {
                    ret = {
                        field: latLongs[0].field.prettyName.replace(/[.](lat|lon)$/i, ''),
                        op: 'from',
                        value: [
                            `(${this.cleanValue('geo', latLongs[0].value)}, ${this.cleanValue('geo', latLongs[1].value)})`,
                            `(${this.cleanValue('geo', latLongs[2].value)}, ${this.cleanValue('geo', latLongs[3].value)})`
                        ].join(' to ')
                    };
                }
            }
            if (!ret) {
                const values = filter.filters
                    .map((nestedFilter) => this.computeFilter(nestedFilter).text)
                    .join(` ${filter.type} `.toUpperCase());

                ret = { text: `(${values})` };
            }
        }
        if (!ret.full) {
            ret.full = filter.toDesign();
        }
        if (!ret.text) {
            if (ret.field) {
                ret.text = `${ret.field} ${ret.op} ${ret.value}`.replace(/\s+/g, ' ');
            } else {
                ret.text = ret.full.name;
            }
        }
        return ret as FilterDisplay;
    }
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

    constructor(
        public filterService: FilterService,
        public dashboardService: DashboardService,
        public router: Router
    ) {
        this.messenger = new eventing.Messenger();
    }

    @HostBinding('style.display')
    get visible() {
        return this.groups.length > 0 ? 'grid' : 'none';
    }

    ngOnInit() {
        // TODO Do we really need to subscribe to all of these channels?
        this.dashboardService.stateSource.subscribe(() => this.updateFilters());
        this.messenger.subscribe(neonEvents.DASHBOARD_REFRESH, this.updateFilters.bind(this));
        this.messenger.subscribe(neonEvents.FILTERS_CHANGED, this.updateFilters.bind(this));
        this.updateFilters();
    }

    remove(filter: FilterDisplay) {
        this.filterService.deleteFilter('FilterList', filter.full);
    }

    removeAll() {
        this.filterService.deleteFilters('FilterList', null as any,
            this.groups
                .reduce((acc, group) => acc.concat(group.filters), [] as FilterDisplay[])
                .map((filter) => filter.full));
    }

    updateFilters() {
        this.groups = [];
        for (const rawFilter of this.filterService.getRawFilters()) {
            const filter = FilterDisplayUtil.computeFilter(rawFilter);
            if (filter.field) {
                const fieldGroup = this.groups.find((group) => group.name === filter.field);
                if (!fieldGroup) {
                    this.groups.push({
                        name: filter.field,
                        filters: [filter]
                    });
                } else {
                    fieldGroup.multi = true;
                    fieldGroup.filters.push(filter);
                    fieldGroup.filters.sort((group1, group2) => `${group1.value}`.localeCompare(`${group2.value}`));
                }
            } else {
                this.groups.push({
                    name: 'Custom',
                    filters: [filter]
                });
            }
        }
        this.groups.sort((group1, group2) => group1.name.localeCompare(group2.name));
        this.router.navigate([], {
            queryParams: { filter: JSON.stringify(this.filterService.getFiltersToSaveInConfig()) },
            relativeTo: this.router.routerState.root,
        });
    }

    ngOnDestroy() {
        this.messenger.unsubscribeAll();
    }
}
