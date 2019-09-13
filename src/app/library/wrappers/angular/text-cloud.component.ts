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
import { ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild, ViewEncapsulation } from '@angular/core';

import { AbstractSearchService } from '../../../services/abstract.search.service';
import { DashboardService } from '../../../services/dashboard.service';
import { Dataset, DatasetUtil, FieldKey } from '../../../models/dataset';
import { InjectableFilterService } from '../../../services/injectable.filter.service';

import '../../visualizations/text-cloud.webcomponent';

@Component({
    selector: 'app-next-century-angular-text-cloud',
    templateUrl: './text-cloud.component.html',
    styleUrls: ['./text-cloud.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NextCenturyAngularTextCloud {
    @Input() aggregationFieldKey: string;
    @Input() aggregationType: string;
    @Input() id: string;
    @Input() textFieldKey: string;

    constructor(
        private dashboardService: DashboardService,
        private filterService: InjectableFilterService,
        private searchService: AbstractSearchService,
        private elementRef: ElementRef
    ) {
        this.dashboardService.stateSource.subscribe(() => {
            const dataset: Dataset = this.dashboardService.state.asDataset();
            this.elementRef.nativeElement.querySelector('#' + this.id + 'TextCloudFilter').init(dataset, this.filterService);
            this.elementRef.nativeElement.querySelector('#' + this.id + 'TextCloudSearch').init(dataset, this.filterService, this.searchService);
        });
    }

    public findFieldName(fieldKeyString: string): string {
        const fieldKey: FieldKey = DatasetUtil.deconstructTableOrFieldKey(fieldKeyString);
        return fieldKey ? fieldKey.field : null;
    }
}
