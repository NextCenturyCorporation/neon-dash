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
import { ElementRef } from '@angular/core';
import { AbstractAggregationSubcomponent, AggregationSubcomponentListener } from './subcomponent.aggregation.abstract';

import * as _ from 'lodash';

export class ListSubcomponent extends AbstractAggregationSubcomponent {
    private HEATS_DECREASING: string[] = ['heat-5', 'heat-4', 'heat-3', 'heat-2', 'heat-1'];
    private HEATS_INCREASING: string[] = ['heat-1', 'heat-2', 'heat-3', 'heat-4', 'heat-5'];

    private elementContainer;

    protected activeData: any[] = [];
    protected activeGroups: string[] = [];
    protected activeSort: string = '';
    protected selectedData: {
        element: any,
        group: string,
        value: any
    }[] = [];

    /**
     * @constructor
     * @arg {any} options
     * @arg {AggregationSubcomponentListener} listener
     * @arg {ElementRef} elementRef
     * @arg {boolean} [cannotSelect=false]
     */
    constructor(options: any, listener: AggregationSubcomponentListener, elementRef: ElementRef, protected cannotSelect: boolean = false) {
        super(options, listener, elementRef);
    }

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

        data.forEach((item, index) => {
            let labelAndValueClass = 'list-text list-selectable';

            let labelElement = document.createElement('td');
            labelElement.innerHTML = item.x;

            let valueElement = document.createElement('td');
            valueElement.innerHTML = item.y;

            if (this.options.showHeat) {
                let heatIndex = Math.floor((sort === 'y' ? item.y : index) / divisor);
                labelAndValueClass += ' ' + heatmap[Math.min(Math.max(heatIndex, 0), heatmap.length - 1)];
            }

            labelElement.setAttribute('class', labelAndValueClass);
            valueElement.setAttribute('class', labelAndValueClass);

            let rowClass = 'list-item';
            let rowTitle = item.x + ' (' + item.y + ')';
            let rowElement = document.createElement('tr');

            let selectedIndex = _.findIndex(this.selectedData, (selectedItem) => {
                return selectedItem.group === item.group && selectedItem.value === item.x;
            });

            if (selectedIndex >= 0) {
                rowClass += ' active';
                this.selectedData[selectedIndex].element = rowElement;
            }

            if (groups.length > 1) {
                let groupElement = document.createElement('td');
                groupElement.setAttribute('class', 'list-text');
                groupElement.setAttribute('style', 'color: ' + item.color.toRgb());
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
     * Deselects the given item or all the subcomponent elements.
     *
     * @arg {any} [item]
     * @override
     */
    public deselect(item?: any) {
        (item ? this.selectedData.filter((selectedItem) => {
            return selectedItem.value === item;
        }) : this.selectedData).forEach((selectedItem) => {
            selectedItem.element.setAttribute('class', selectedItem.element.getAttribute('class').replace(' active', ''));
        });
        this.selectedData = item ? this.selectedData.filter((selectedItem) => {
            return selectedItem.value !== item;
        }) : [];
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
     * Returns whether the subcomponent layout is horizontal. False for this
     * subcomponent.
     *
     * @return {boolean}
     */
    public isHorizontal(): boolean {
        return false;
    }

    /**
     * Handles the given click event by filtering on the clicked value.
     *
     * @arg {event} event
     * @private
     */
    protected handleClickEvent(event) {
        if (this.cannotSelect) {
            return;
        }

        let group = event.currentTarget.getAttribute('group');
        let value = event.currentTarget.getAttribute('value');
        let index = _.findIndex(this.selectedData, (selectedItem) => {
            return selectedItem.group === group && selectedItem.value === value;
        });

        if (index < 0) {
            event.currentTarget.setAttribute('class', event.currentTarget.getAttribute('class') + ' active');
            let doNotReplace = !!(event.ctrlKey || event.metaKey);
            if (!doNotReplace) {
                this.deselect();
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
     * Initializes all the subcomponent elements.
     *
     * @override
     */
    public initialize() {
        this.elementContainer = document.createElement('table');
        this.elementContainer.setAttribute('class', 'list-subcomponent');
        this.elementRef.nativeElement.appendChild(this.elementContainer);
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
}
