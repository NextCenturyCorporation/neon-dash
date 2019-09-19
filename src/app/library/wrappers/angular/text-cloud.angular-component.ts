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
import { Dataset } from '../../core/models/dataset';
import { FilterService } from '../../core/services/filter.service';
import { NextCenturyTextCloud } from '../../visualizations/text-cloud/text-cloud.web-component';

@Component({
    selector: 'app-next-century-angular-text-cloud',
    template: '<next-century-text-cloud [attr.id]="id + \'_angular\'"></next-century-text-cloud>',
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NextCenturyAngularTextCloud implements OnChanges {
    @Input() dataset: Dataset;
    @Input() filterService: FilterService;
    @Input() id: string;
    @Input() options: Record<string, any>;
    @Input() searchService: AbstractSearchService;

    constructor(private elementRef: ElementRef) { }

    ngOnChanges(__changes) {
        if (this.id) {
            const textCloud = this.elementRef.nativeElement.querySelector('#' + this.id + '_angular') as NextCenturyTextCloud;
            if (textCloud) {
                Object.keys(this.options || {}).forEach((attribute) => {
                    textCloud.setAttribute(attribute, this.options[attribute]);
                });
                if (this.dataset && this.filterService && this.searchService) {
                    textCloud.init(this.dataset, this.filterService, this.searchService);
                }
            }
        }
    }
}
