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
import { CompoundFilterType } from 'component-library/dist/core/models/config-option';
import { Dataset, DatabaseConfig, FieldConfig, TableConfig } from 'component-library/dist/core/models/dataset';
import { DashboardService } from '../../services/dashboard.service';
import { InjectableFilterService } from '../../services/injectable.filter.service';
import { ListFilterDesign } from 'component-library/dist/core/models/filters';
import { neonEvents } from '../../models/neon-namespaces';
import { eventing } from 'neon-framework';
import { DashboardState } from '../../models/dashboard-state';

@Component({
    selector: 'app-simple-search-filter',
    templateUrl: './simple-search-filter.component.html',
    styleUrls: ['./simple-search-filter.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SimpleSearchFilterComponent implements OnInit, OnDestroy {
    public cachedFilter: ListFilterDesign;
    public inputPlaceholder: string = '';
    public showSimpleSearch: boolean = false;

    private messenger = new eventing.Messenger();
    public readonly dashboardState: DashboardState;

    constructor(
        private changeDetection: ChangeDetectorRef,
        dashboardService: DashboardService,
        protected filterService: InjectableFilterService
    ) {
        this.dashboardState = dashboardService.state;
    }

    public addFilter(text: string): void {
        if (!text.length) {
            this.removeFilter();
            return;
        }

        const simpleFilter: any = (this.dashboardState.getOptions() || {}).simpleFilter || {};

        if (!this.validateSimpleFilter(simpleFilter) || !this.dashboardState.datastores.length) {
            return;
        }

        this.inputPlaceholder = simpleFilter.placeholder || '';

        const dataset: Dataset = this.dashboardState.asDataset();
        // TODO THOR-1062 Properly handle multiple datastores.
        const datastoreName = this.dashboardState.datastores[0].name;
        const database: DatabaseConfig = dataset.retrieveDatabase(datastoreName, simpleFilter.databaseName);
        const table: TableConfig = dataset.retrieveTable(datastoreName, simpleFilter.databaseName, simpleFilter.tableName);
        const field: FieldConfig = dataset.retrieveField(datastoreName, simpleFilter.databaseName, simpleFilter.tableName,
            simpleFilter.fieldName);

        const filter: ListFilterDesign = new ListFilterDesign(CompoundFilterType.OR, datastoreName + '.' + database.name + '.' +
            table.name + '.' + field.columnName, 'contains', [text]);

        this.filterService.exchangeFilters('SimpleFilter', [filter], dataset);

        this.cachedFilter = filter;
    }

    ngOnDestroy() {
        this.messenger.unsubscribeAll();
    }

    ngOnInit() {
        this.messenger.subscribe(neonEvents.TOGGLE_SIMPLE_SEARCH, this.updateShowSimpleSearch.bind(this));
        // Show search on init if option is configured.
        this.updateSimpleFilterDesign();
    }

    public removeFilter(): void {
        if (this.cachedFilter) {
            this.filterService.deleteFilters('SimpleFilter', [new ListFilterDesign(CompoundFilterType.OR, this.cachedFilter.fieldKey,
                this.cachedFilter.operator, [undefined])]);
        }
        this.cachedFilter = null;
    }

    public updateSimpleFilterDesign(): void {
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
