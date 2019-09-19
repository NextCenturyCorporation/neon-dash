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

import { AbstractSearchService } from '../../core/services/abstract.search.service';
import { CoreUtil } from '../../core/core.util';
import { Dataset, DatasetUtil, FieldKey } from '../../core/models/dataset';
import { FilterService } from '../../core/services/filter.service';
import { NextCenturyAggregation } from '../../core/components/aggregation.web-component';
import { NextCenturyElement } from '../../core/components/element.web-component';
import { NextCenturyFilter } from '../../core/components/filter.web-component';
import { NextCenturyGroup } from '../../core/components/group.web-component';
import { NextCenturySearch } from '../../core/components/search.web-component';
import { NextCenturyTextCloudVisualization } from '../../visualizations/text-cloud/text-cloud.visualization';

export class NextCenturyTextCloud extends NextCenturyElement {
    private _containerElement: HTMLElement;
    private _dataset: Dataset;
    private _filterService: FilterService;
    private _searchService: AbstractSearchService;
    private _shadowRoot: ShadowRoot;

    static get observedAttributes(): string[] {
        return ['text-field-key'].concat(NextCenturySearch.requiredAttributes).concat(NextCenturySearch.optionalAttributes)
            .concat(NextCenturyFilter.requiredAttributes).concat(NextCenturyFilter.optionalAttributes)
            .concat(NextCenturyAggregation.observedAttributes).concat(NextCenturyFilter.observedAttributes)
            .concat(NextCenturyTextCloudVisualization.observedAttributes);
    }

    constructor() {
        super();
        const template = document.createElement('template');
        template.innerHTML = `
            <style>
                :host {
                    display: block;
                }

                :host([hidden]) {
                    display: none;
                }
            </style>
        `;

        this._shadowRoot = this.attachShadow({
            mode: 'open'
        });
        this._shadowRoot.appendChild(template.content.cloneNode(true));
        this._containerElement = document.createElement('div');
        this._shadowRoot.appendChild(this._containerElement);
    }

    public attributeChangedCallback(name: string, oldValue: any, newValue: any): void {
        super.attributeChangedCallback(name, oldValue, newValue);

        this._createVisualization();
    }

    public init(dataset: Dataset, filterService: FilterService, searchService: AbstractSearchService): void {
        this._dataset = dataset;
        this._filterService = filterService;
        this._searchService = searchService;

        this._createVisualization();
    }

    private _createAggregationLabel(attributes: Record<string, any>): string {
        if (attributes['aggregation-label']) {
            return attributes['aggregation-label'];
        }
        if (attributes['aggregation-type'] !== 'count') {
            const fieldKey: FieldKey = DatasetUtil.deconstructTableOrFieldKey(attributes['aggregation-field-key']);
            if (fieldKey && fieldKey.field) {
                const configData = this._dataset.retrieveConfigDataFromFieldKey(fieldKey);
                return attributes['aggregation-type'] + ' of ' + configData[3].prettyName;
            }
        }
        return undefined;
    }

    private _createVisualization(): void {
        const attributes = CoreUtil.transformElementAttributes(this.attributes);
        const textFieldKey: FieldKey = DatasetUtil.deconstructTableOrFieldKey(attributes['text-field-key']);
        if (!attributes['id'] || !textFieldKey || !textFieldKey.field || !this._dataset || !this._filterService || !this._searchService) {
            return;
        }

        const filterElementId = attributes['id'] + '_filter';
        const searchElementId = attributes['id'] + '_search';
        const visElementId = attributes['id'] + '_visualization';

        // Override attributes
        attributes['aggregation-name'] = '_aggregation';
        attributes['aggregation-field'] = 'aggregations._aggregation';
        attributes['aggregation-label'] = this._createAggregationLabel(attributes);
        attributes['aggregation-field-key'] = attributes['aggregation-field-key'] || attributes['text-field-key'];
        attributes['group-field-key'] = attributes['text-field-key'];
        attributes['filter-type'] = 'list';
        attributes['list-field-key'] = attributes['text-field-key'];
        attributes['list-operator'] = '=';
        attributes['search-element-id'] = searchElementId;
        attributes['search-field-keys'] = attributes['text-field-key'];
        attributes['search-limit'] = attributes['search-limit'] || 10000;
        attributes['sort-aggregation'] = '_aggregation';
        attributes['text-field'] = 'fields.' + textFieldKey.field;
        attributes['vis-draw-function'] = 'drawData';
        attributes['vis-element-id'] = visElementId;
        attributes['vis-filter-input-function'] = 'changeFilteredText';
        attributes['vis-filter-output-event'] = 'filter';

        const filterElement = NextCenturyFilter.createElement(filterElementId, attributes);
        const searchElement = NextCenturySearch.createElement(searchElementId, attributes);
        const aggregationElement = NextCenturyAggregation.createElement(attributes);
        const groupElement = NextCenturyGroup.createElement(attributes);
        searchElement.append(aggregationElement);
        searchElement.append(groupElement);

        const visElement = document.createElement('next-century-visualization-text-cloud');
        visElement.setAttribute('id', visElementId);
        NextCenturyTextCloudVisualization.observedAttributes.forEach((attribute) => {
            if (typeof attributes[attribute] !== 'undefined') {
                visElement.setAttribute(attribute, attributes[attribute]);
            }
        });

        this._containerElement.append(searchElement);
        this._containerElement.append(filterElement);
        this._containerElement.append(visElement);

        filterElement.init(this._dataset, this._filterService);
        searchElement.init(this._dataset, this._filterService, this._searchService);
    }
}

window.customElements.define('next-century-text-cloud', NextCenturyTextCloud);
