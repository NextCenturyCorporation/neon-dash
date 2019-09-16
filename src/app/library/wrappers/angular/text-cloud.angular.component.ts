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
import { ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, ViewEncapsulation } from '@angular/core';

import { AbstractSearchService } from '../../core/services/abstract.search.service';
import { Dataset, DatasetUtil, FieldKey } from '../../core/models/dataset';
import { FilterService } from '../../core/services/filter.service';

import '../../visualizations/text-cloud/text-cloud.webcomponent';

@Component({
    selector: 'app-next-century-angular-text-cloud',
    templateUrl: './text-cloud.angular.component.html',
    styleUrls: ['./text-cloud.angular.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NextCenturyAngularTextCloud implements OnChanges {
    @Input() aggregationFieldKey: string;
    @Input() aggregationType: string;
    @Input() dataset: Dataset;
    @Input() filterService: FilterService;
    @Input() id: string;
    @Input() searchService: AbstractSearchService;
    @Input() textFieldKey: string;

    constructor(private elementRef: ElementRef) { }

    ngOnChanges(__changes) {
        if (this.id && this.dataset && this.filterService && this.searchService) {
            this.elementRef.nativeElement.querySelector('#' + this.id + 'TextCloudFilter').init(this.dataset, this.filterService);
            this.elementRef.nativeElement.querySelector('#' + this.id + 'TextCloudSearch').init(this.dataset, this.filterService,
                this.searchService);
        }
    }

    public findFieldName(fieldKeyString: string): string {
        const fieldKey: FieldKey = DatasetUtil.deconstructTableOrFieldKey(fieldKeyString);
        return fieldKey ? fieldKey.field : null;
    }
}
