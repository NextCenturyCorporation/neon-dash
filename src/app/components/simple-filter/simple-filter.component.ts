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
import { ChangeDetectorRef, ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractSearchService } from '../../services/abstract.search.service';
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../dataset';
import { DatasetService } from '../../services/dataset.service';
import { FilterService, SimpleFilterDesign } from '../../services/filter.service';
import { eventing } from 'neon-framework';

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

    constructor(
        private changeDetection: ChangeDetectorRef,
        protected datasetService: DatasetService,
        protected filterService: FilterService,
        protected searchService: AbstractSearchService
    ) {}

    public addFilter(term: string): void {
        if (!term.length) {
            this.removeFilter();
            return;
        }

        let simpleFilter: any = (this.datasetService.getCurrentDashboardOptions() || {}).simpleFilter || {};

        if (!this.validateSimpleFilter(simpleFilter)) {
            return;
        }

        this.inputPlaceholder = simpleFilter.placeholder || '';

        let database: DatabaseMetaData = this.datasetService.getDatabaseWithName(simpleFilter.databaseName);
        let table: TableMetaData = this.datasetService.getTableWithName(simpleFilter.databaseName, simpleFilter.tableName);
        let field: FieldMetaData = this.datasetService.getFieldWithName(simpleFilter.databaseName, simpleFilter.tableName,
            simpleFilter.fieldName);

        let filter: SimpleFilterDesign = {
            datastore: '',
            database: database,
            table: table,
            field: field,
            operator: 'contains',
            value: term
        } as SimpleFilterDesign;

        this.filterService.exchangeFilters('SimpleFilter', [filter], this.datasetService.findRelationDataList(), this.searchService);

        this.cachedFilter = filter;
    }

    ngOnDestroy() {
        this.messenger.unsubscribeAll();
    }

    ngOnInit() {
        this.messenger.subscribe('showSimpleSearch', (message) => this.updateShowSimpleSearch(message.showSimpleSearch));
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
        this.updateShowSimpleSearch(this.validateSimpleFilter((this.datasetService.getCurrentDashboardOptions() || {}).simpleFilter || {}));
    }

    private updateShowSimpleSearch(show: boolean): void {
        this.showSimpleSearch = show;
        this.changeDetection.detectChanges();
    }

    private validateSimpleFilter(simpleFilter: any): boolean {
        return !!(simpleFilter.databaseName && simpleFilter.tableName && simpleFilter.fieldName);
    }
}
