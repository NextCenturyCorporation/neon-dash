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
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { Router } from '@angular/router';

import { AbstractSearchService } from './library/core/services/abstract.search.service';
import { CoreUtil } from './library/core/core.util';
import { Dataset } from './library/core/models/dataset';
import { DateUtil } from './library/core/date.util';

import { ConfigService } from './services/config.service';
import { DashboardService } from './services/dashboard.service';
import { InjectableFilterService } from './services/injectable.filter.service';
import { RouteWithStateComponent } from './route-with-state.component';

import './library/core/components/aggregation.webcomponent';
import './library/core/components/filter.webcomponent';
import './library/core/components/group.webcomponent';
import './library/core/components/search.webcomponent';
import './library/visualizations/example.webcomponent';
import './library/visualizations/text-cloud/text-cloud.webcomponent';
import './library/wrappers/angular/text-cloud.angular.component';

@Component({
    selector: 'app-route-example',
    templateUrl: './route-example.component.html',
    styleUrls: ['./route-example.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RouteExampleComponent extends RouteWithStateComponent implements AfterViewInit {
    @ViewChild('filter1A') filter1A;
    @ViewChild('filter2A') filter2A;
    @ViewChild('filter3A') filter3A;
    @ViewChild('filter4A') filter4A;
    @ViewChild('textCloudFilter1A') textCloudFilter1A;
    @ViewChild('textCloudFilter2A') textCloudFilter2A;
    @ViewChild('search1') search1;
    @ViewChild('search2') search2;
    @ViewChild('search3') search3;
    @ViewChild('search4') search4;
    @ViewChild('search5') search5;
    @ViewChild('textCloudSearch1') textCloudSearch1;
    @ViewChild('textCloudSearch2') textCloudSearch2;
    @ViewChild('vis4') vis4;

    public dataset: Dataset;

    constructor(
        configService: ConfigService,
        dashboardService: DashboardService,
        public filterService: InjectableFilterService,
        public searchService: AbstractSearchService,
        private changeDetectorRef: ChangeDetectorRef,
        private elementRef: ElementRef,
        router: Router
    ) {
        super(configService, dashboardService, router);

        dashboardService.stateSource.subscribe(() => {
            this.dataset = this.dashboardService.state.asDataset();
            this.filter1A.nativeElement.init(this.dataset, this.filterService);
            this.filter2A.nativeElement.init(this.dataset, this.filterService);
            this.filter3A.nativeElement.init(this.dataset, this.filterService);
            this.filter4A.nativeElement.init(this.dataset, this.filterService);
            this.search1.nativeElement.init(this.dataset, this.filterService, this.searchService);
            this.search2.nativeElement.init(this.dataset, this.filterService, this.searchService);
            this.search3.nativeElement.init(this.dataset, this.filterService, this.searchService);
            this.search4.nativeElement.init(this.dataset, this.filterService, this.searchService);
            this.search5.nativeElement.init(this.dataset, this.filterService, this.searchService);
            this.textCloudFilter1A.nativeElement.init(this.dataset, this.filterService);
            this.textCloudFilter2A.nativeElement.init(this.dataset, this.filterService);
            this.textCloudSearch1.nativeElement.init(this.dataset, this.filterService, this.searchService);
            this.textCloudSearch2.nativeElement.init(this.dataset, this.filterService, this.searchService);
            // Must call detectChanges here to update the dataset of the Angular visualization wrapper elements.
            this.changeDetectorRef.detectChanges();
        });
    }

    ngAfterViewInit() {
        CoreUtil.addListener(this._transformTimestampsToDateStrings.bind(this), 'vis4', 'dataSelected');
        CoreUtil.addListener(this._transformDateStringsToTimestamps.bind(this), 'filter4A', 'filterValuesChanged');
    }

    private _transformDateStringsToTimestamps(event: any): void {
        if (!event || !event.detail || !event.detail.values) {
            return;
        }

        const values: any|any[] = event.detail.values;

        // If [begin, end], transform to [[begin, end]]; if [[begin, end]], keep it.
        const domains: any[] = ((Array.isArray(values) && values.length && Array.isArray(values[0])) ? values : [values]);

        // Transform date string arrays like [begin, end] to timestamps.
        const timestamps: number[] = domains.filter((domain) => Array.isArray(domain) && domain.length === 2)
            .map((domain) => DateUtil.fromStringToTimestamp(domain[0]));

        this.vis4.nativeElement.changeSelectedText(timestamps);
    }

    private _transformTimestampsToDateStrings(event: any): void {
        if (!event || !event.detail || !event.detail.values) {
            return;
        }

        const values: any|any[] = event.detail.values;

        // Transform timestamps to date string arrays like [begin, end].
        const domains: string[][] = (Array.isArray(values) ? values : [values]).map((value) => {
            let beginDate = new Date(value);
            let endDate = new Date(beginDate);
            endDate.setHours(beginDate.getHours() + 23);
            endDate.setMinutes(beginDate.getMinutes() + 59);
            endDate.setSeconds(beginDate.getSeconds() + 59);
            return [DateUtil.fromDateToString(beginDate), DateUtil.fromDateToString(endDate)];
        });

        this.filter4A.nativeElement.updateFilters(domains);
    }
}
