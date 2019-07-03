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
import { ChangeDetectorRef, ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractSearchService } from '../../services/abstract.search.service';
import { NeonDatabaseMetaData, NeonFieldMetaData, NeonTableMetaData } from '../../models/dataset';
import { DashboardService } from '../../services/dashboard.service';
import { FilterService, SimpleFilterDesign } from '../../services/filter.service';
import { neonEvents } from '../../models/neon-namespaces';
import { eventing } from 'neon-framework';
import { DashboardState } from '../../models/dashboard-state';

@Component({
    selector: 'app-simple-filter',
    templateUrl: './simple-filter.component.html',
    styleUrls: ['./simple-filter.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SimpleFilterComponent implements OnInit, OnDestroy {
    public cachedFilter: SimpleFilterDesign;
    public inputPlaceholder: string = '';
    public showSimpleSearch: boolean = false;

    private messenger = new eventing.Messenger();
    public readonly dashboardState: DashboardState;

    constructor(
        private changeDetection: ChangeDetectorRef,
        dashboardService: DashboardService,
        protected filterService: FilterService,
        protected searchService: AbstractSearchService
    ) {
        this.dashboardState = dashboardService.state;
    }

    public addFilter(term: string): void {
        if (!term.length) {
            this.removeFilter();
            return;
        }

        let simpleFilter: any = (this.dashboardState.getOptions() || {}).simpleFilter || {};

        if (!this.validateSimpleFilter(simpleFilter)) {
            return;
        }

        this.inputPlaceholder = simpleFilter.placeholder || '';

        let database: NeonDatabaseMetaData = this.dashboardState.getDatabaseWithName(simpleFilter.databaseName);
        let table: NeonTableMetaData = this.dashboardState.getTableWithName(simpleFilter.databaseName, simpleFilter.tableName);
        let field: NeonFieldMetaData = this.dashboardState.getFieldWithName(simpleFilter.databaseName, simpleFilter.tableName,
            simpleFilter.fieldName);

        let filter: SimpleFilterDesign = {
            datastore: '',
            database: database,
            table: table,
            field: field,
            operator: 'contains',
            value: term
        } as SimpleFilterDesign;

        this.filterService.exchangeFilters('SimpleFilter', [filter], this.dashboardState.findRelationDataList(), this.searchService);

        this.cachedFilter = filter;
    }

    ngOnDestroy() {
        this.messenger.unsubscribeAll();
    }

    ngOnInit() {
        this.messenger.subscribe(neonEvents.TOGGLE_SIMPLE_SEARCH, this.updateShowSimpleSearch.bind(this));
        // Show search on init if option is configured.
        this.updateSimpleFilterConfig();
    }

    public removeFilter(): void {
        if (this.cachedFilter) {
            this.filterService.deleteFilters('SimpleFilter', this.searchService, [{
                datastore: '',
                database: this.cachedFilter.database,
                table: this.cachedFilter.table,
                field: this.cachedFilter.field,
                operator: this.cachedFilter.operator
            } as SimpleFilterDesign]);
        }
        this.cachedFilter = null;
    }

    public updateSimpleFilterConfig(): void {
        this.updateShowSimpleSearch({
            show: this.validateSimpleFilter((this.dashboardState.getOptions() || {}).simpleFilter || {})
        });
    }

    private updateShowSimpleSearch(eventMessage: { show: boolean }): void {
        this.showSimpleSearch = eventMessage.show;
        this.changeDetection.detectChanges();
    }

    private validateSimpleFilter(simpleFilter: any): boolean {
        return !!(simpleFilter.databaseName && simpleFilter.tableName && simpleFilter.fieldName);
    }
}
