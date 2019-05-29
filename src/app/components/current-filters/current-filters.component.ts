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
import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { neonEvents } from '../../neon-namespaces';

import { CompoundFilterType } from '../../services/abstract.search.service';
import { FilterDesign, FilterService, AbstractFilter, SimpleFilter, CompoundFilter } from '../../services/filter.service';

import * as moment from 'moment';

import { eventing } from 'neon-framework';

interface FilterDisplay {
    full: FilterDesign;
    text?: string;
    field?: string;
    op?: string;
    value?: any;
}

interface FilterGroup {
    name?: string;
    multi?: boolean;
    filters?: FilterDisplay[];
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

    constructor(public filterService: FilterService) {
        this.messenger = new eventing.Messenger();
    }

    @HostBinding('style.display')
    get visible() {
        return this.groups.length > 0 ? 'grid' : 'none';
    }

    ngOnInit() {
        // TODO Do we really need to subscribe to all of these channels?
        this.messenger.subscribe(neonEvents.DASHBOARD_RESET, this.updateFilters.bind(this));
        this.messenger.subscribe(neonEvents.FILTERS_CHANGED, this.updateFilters.bind(this));
        this.messenger.subscribe(neonEvents.DASHBOARD_STATE, this.updateFilters.bind(this));
        this.updateFilters();
    }

    remove(filter: FilterDisplay) {
        this.filterService.deleteFilter('FilterList', filter.full);
    }

    removeAll() {
        this.filterService.deleteFilters('FilterList', null as any,
            this.groups
                .reduce((acc, g) => acc.concat(g.filters), [] as FilterDisplay[])
                .map(f => f.full)
        );
    }

    computeFilter(x: AbstractFilter): FilterDisplay {
        let ret: Partial<FilterDisplay>;
        if (x instanceof SimpleFilter) {
            const isDate = /date/i.test(x.field.type);
            ret = {
                field: x.field.prettyName,
                value: x.value,
                op: isDate ?
                    x.operator
                        .replace(/<=?/, 'before')
                        .replace(/>=?/, 'after') :
                    x.operator
                        .replace(/=/g, '')
            };
        } else if (x instanceof CompoundFilter) {
            const latLongs = x.filters
                .filter((y) => y instanceof SimpleFilter && y.field.type === 'double' && /[.](lat|lon)$/.test(y.field.prettyName))
                .map((y) => (y as SimpleFilter));

            const dates = x.filters
                .filter((y) => y instanceof SimpleFilter && y.field.type === 'date')
                .map((y) => (y as SimpleFilter));


            if (x.filters.length === 2) {
                if (dates.length === 2) {
                    ret = {
                        field: dates[0].field.prettyName,
                        op: 'between',
                        value: `${moment(dates[0].value).format('YYYY-MM-DD')} and ${moment(dates[1].value).format('YYYY-MM-DD')}`,
                    };
                } else if (latLongs.length === 2) {
                    ret = {
                        field: latLongs[0].field.prettyName.replace(/[.](lat|lon)$/, ''),
                        op: 'at',
                        value: `(${latLongs[0].value.toFixed(3)}, ${latLongs[1].value.toFixed(3)})`
                    };
                }
            } else if (x.filters.length === 4) {
                if (latLongs.length === 4) {
                    ret = {
                        field: latLongs[0].field.prettyName.replace(/[.](lat|lon)$/, ''),
                        op: 'from',
                        value: `(${latLongs[0].value.toFixed(3)}, ${latLongs[1].value.toFixed(3)}) to (${latLongs[2].value.toFixed(3)}, ${latLongs[3].value.toFixed(3)})`
                    };
                }
            }
            if (!ret) {
                const values = x.filters
                    .map((v) => this.computeFilter(v).text)
                    .join(` ${x.type} `.toUpperCase());

                ret = { text: `(${values})` };
            }
        }
        if (!ret.full) {
            ret.full = x.toDesign();
        }
        if (!ret.text) {
            if (ret.field) {
                ret.text = `${ret.field} ${ret.op} ${ret.value}`;
            } else {
                ret.text = ret.full.name;
            }
        }
        return ret as FilterDisplay;
    }

    updateFilters() {
        this.groups = [];
        for (const x of this.filterService.getRawFilters()) {
            const filter = this.computeFilter(x);
            if (filter.field) {
                const grp = this.groups.find((g) => g.name === filter.field);
                if (!grp) {
                    this.groups.push({
                        name: filter.field,
                        filters: [filter]
                    });
                } else {
                    grp.multi = true;
                    grp.filters!.push(filter);
                }
            } else {
                this.groups.push({
                    name: 'Custom',
                    filters: [filter]
                });
            }
        }
    }

    ngOnDestroy() {
        this.messenger.unsubscribeAll();
    }
}