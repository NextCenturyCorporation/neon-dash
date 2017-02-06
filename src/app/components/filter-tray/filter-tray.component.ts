import { Component, OnInit, OnDestroy } from '@angular/core';
import { MdDialogRef } from '@angular/material';

import { ParameterService } from '../../services/parameter.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import * as neon from 'neon-framework';

@Component({
    selector: 'app-filter-tray',
    templateUrl: './filter-tray.component.html',
    styleUrls: ['./filter-tray.component.css']
})
export class FilterTrayComponent implements OnInit, OnDestroy {

    private messenger: neon.eventing.Messenger;
    private filters: {
        raw: any[],
        formatted: any[]
    };

    constructor(private filterService: FilterService, private themesService: ThemesService,
        public dialogRef: MdDialogRef<FilterTrayComponent>) {
        this.messenger = new neon.eventing.Messenger();
        this.themesService = themesService;
        this.filters = {
            raw: [],
            formatted: []
        };
    }

    ngOnInit() {
        this.filters = {
            raw: [],
            formatted: []
        };

        this.messenger.events({
            activeDatasetChanged: this.onEventChanged,
            filtersChanged: this.onEventChanged
        });

        this.messenger.subscribe(ParameterService.STATE_CHANGED_CHANNEL, this.onEventChanged);
    }

    removeFilter(filterIds: string[]) {
        this.filterService.removeFiltersForKeys(filterIds);
    };

    onEventChanged() {
        this.updateFilterTray(this.filterService.getAllFilters());
    };

    updateFilterTray(rawState: any[]) {
        this.filters.raw = rawState;
        let filters = this.formatFilters(rawState);
        this.filters.formatted = filters;
    };

    formatFilters(filters: any[]): any[] {
        if (filters.length > 0) {
            // We only want unique filter names to eliminate display of multiple filters created by filter service

            // remove filters with empty string names
            let filterList = _.filter(filters, function(filter) {
                return (filter.filter.filterName && filter.filter.filterName !== '');
            });

            let result = {};
            _.each(filterList, function(filter) {
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
            _.each(result, function(filter) {
                resultList.push(filter);
            });

            return resultList;
        }
        return [];
    };

    ngOnDestroy() {
        this.messenger.unsubscribeAll();
    }

}
