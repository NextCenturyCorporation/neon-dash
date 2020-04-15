/**
 * Copyright 2020 CACI (formerly Next Century Corporation)
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
import { AbstractAggregationSubcomponent } from './subcomponent.aggregation.abstract';

import * as _ from 'lodash';

export class ListSubcomponent extends AbstractAggregationSubcomponent {
    private HEATS_DECREASING: string[] = ['heat-5', 'heat-4', 'heat-3', 'heat-2', 'heat-1'];
    private HEATS_INCREASING: string[] = ['heat-1', 'heat-2', 'heat-3', 'heat-4', 'heat-5'];

    private elementContainer;

    protected activeData: any[] = [];
    protected activeGroups: string[] = [];
    protected activeSort: string = '';
    protected ignoreSelect: boolean = false;
    protected selectedData: {
        group: string;
        value: any;
    }[] = [];

    /**
     * Creates a list with the given data.
     *
     * @arg {any[]} data
     * @arg {string[]} groups
     * @arg {string} sort
     * @private
     */
    private createList(data: any[], groups: string[], sort: string) {
        if (!data.length) {
            return;
        }

        let maxY = (this.options.scaleMaxY !== '' && !isNaN(Number(this.options.scaleMaxY))) ? Number(this.options.scaleMaxY) : data[0].y;
        let minY = (this.options.scaleMinY !== '' && !isNaN(Number(this.options.scaleMinY))) ? Number(this.options.scaleMinY) :
            data[data.length - 1].y;

        let heatmap = (sort === 'y' ? this.HEATS_INCREASING : this.HEATS_DECREASING);
        let divisor = (sort === 'y' ? (maxY - minY) : data.length) / heatmap.length;

        document.documentElement.style.setProperty('--neon-list-columns', this.options.listColumns);

        data.forEach((item, index) => {
            let labelAndValueClass = 'list-text list-selectable';

            let labelElement = document.createElement('span');
            labelElement.innerHTML = item.x;

            let valueElement = document.createElement('span');
            valueElement.innerHTML = '(' + item.y + ')';

            if (this.options.showHeat) {
                let heatIndex = Math.floor((sort === 'y' ? item.y : index) / divisor);
                labelAndValueClass += ' ' + heatmap[Math.min(Math.max(heatIndex, 0), heatmap.length - 1)];
            }

            labelElement.setAttribute('class', labelAndValueClass);
            valueElement.setAttribute('class', labelAndValueClass);

            let rowClass = 'list-item';
            let rowTitle = item.x + ' (' + item.y + ')';
            let rowElement = document.createElement('span');

            let selectedIndex = _.findIndex(this.selectedData, (selectedItem) =>
                (selectedItem.group ? selectedItem.group === item.group : true) && selectedItem.value === '' + item.x);

            if (selectedIndex >= 0) {
                rowClass += ' active';
            }

            if (groups.length > 1) {
                let groupElement = document.createElement('span');
                groupElement.setAttribute('class', 'list-text');
                groupElement.setAttribute('style', 'color: ' + item.color.getComputedCss(this.elementRef.nativeElement));
                groupElement.innerHTML = item.group;
                rowTitle = item.group + ' - ' + rowTitle;
                rowElement.appendChild(groupElement);
            }

            rowElement.setAttribute('class', rowClass);
            rowElement.setAttribute('group', item.group);
            rowElement.setAttribute('title', rowTitle);
            rowElement.setAttribute('value', item.x);
            rowElement.addEventListener('click', this.handleClickEvent.bind(this));
            rowElement.appendChild(labelElement);
            rowElement.appendChild(valueElement);

            this.elementContainer.appendChild(rowElement);
        });
    }

    /**
     * Destroys all the subcomponent elements.
     *
     * @override
     */
    public destroy() {
        if (this.elementContainer) {
            this.elementRef.nativeElement.removeChild(this.elementContainer);
        }
    }

    /**
     * Draws all the subcomponent elements with the given data and metadata.
     *
     * @arg {array} data
     * @arg {any} meta
     * @override
     */
    public draw(data: any[], meta: any) {
        this.activeData = data;
        this.activeGroups = meta.groups;
        this.activeSort = meta.sort;

        this.destroy();
        this.initialize();

        this.createList(data, meta.groups, meta.sort);
    }

    /**
     * Returns the minimum dimensions needed for the subcomponent.
     *
     * @return { { height: number, width: number } }
     * @override
     */
    public getMinimumDimensions(): { height: number, width: number } {
        return {
            height: undefined,
            width: undefined
        };
    }

    /**
     * Returns the label for a visualization element using the given count to determine plurality.
     *
     * @arg {number} count
     * @return {string}
     * @override
     */
    public getVisualizationElementLabel(count: number): string {
        return 'Result' + (count === 1 ? '' : 's');
    }

    /**
     * Handles the given click event by filtering on the clicked value.
     *
     * @arg {event} event
     * @private
     */
    protected handleClickEvent(event) {
        if (this.ignoreSelect) {
            return;
        }

        let group = event.currentTarget.getAttribute('group');
        let value = event.currentTarget.getAttribute('value');
        let index = _.findIndex(this.selectedData, (selectedItem) => selectedItem.group === group && selectedItem.value === '' + value);

        if (index < 0) {
            event.currentTarget.setAttribute('class', event.currentTarget.getAttribute('class') + ' active');
            let doNotReplace = !!(event.ctrlKey || event.metaKey);
            if (!doNotReplace) {
                this.select([]);
            }
            let selectedItem = {
                element: event.currentTarget,
                group: group,
                value: value
            };
            this.selectedData = doNotReplace ? this.selectedData.concat(selectedItem) : [selectedItem];
            this.listener.subcomponentRequestsFilter(group, value, doNotReplace);
        }
    }

    /**
     * Configures the visualization to ignore any of the user's "select" events.
     *
     * @override
     */
    public ignoreSelectEvents(): void {
        this.ignoreSelect = true;
    }

    /**
     * Initializes all the subcomponent elements.
     *
     * @override
     */
    public initialize() {
        this.elementContainer = document.createElement('div');
        this.elementContainer.setAttribute('class', 'list-subcomponent');
        this.elementRef.nativeElement.appendChild(this.elementContainer);
    }

    /**
     * Returns whether the chart is horizontal.
     *
     * @return {boolean}
     * @override
     */
    public isHorizontal(): boolean {
        return false;
    }

    /**
     * Redraws all the subcomponent elements.
     *
     * @override
     */
    public redraw() {
        this.destroy();
        this.initialize();

        this.createList(this.activeData, this.activeGroups, this.activeSort);
    }

    /**
     * Selects the given items and deselects all other items.
     *
     * @arg {any[]} items
     * @override
     */
    public select(items: any[]) {
        this.selectedData = items.map((item) => ({
            group: null,
            value: item
        }));
        this.redraw();

        // TODO THOR-1057 Select values in specific groups.
    }
}
