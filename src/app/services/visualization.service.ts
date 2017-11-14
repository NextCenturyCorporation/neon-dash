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
import { Injectable } from '@angular/core';

import * as _ from 'lodash';
import { NeonGridItem } from '../neon-grid-item';
import { BaseNeonComponent } from '../components/base-neon-component/base-neon.component';
import { BaseLayeredNeonComponent } from '../components/base-neon-component/base-layered-neon.component';

/**
 * Basic information about a visualization
 */
export interface VisualizationAdapter {
    id: string;
    gridData: NeonGridItem;
    component: BaseNeonComponent | BaseLayeredNeonComponent;
}

/**
 * This provides an Angular service for registering and unregistering visualizations on a page.
 *
 * @class neonDemo.services.VisualizationService
 * @constructor
 */
@Injectable()
export class VisualizationService {
    private widgets: VisualizationAdapter[];

    constructor() {
        this.widgets = [];
    }

    /**
     * Registers a function to this service, so that it can be executed as part of a bulk operation. Should be called by visualization
     * widgets upon being created.
     * @param {String} visualizationId The unique id for the visualization.
     * @param {Function} bundleFunction The function to register.
     */
    registerBindings(visualizationId: string, component: BaseNeonComponent | BaseLayeredNeonComponent) {
        let widget = _.find(this.widgets, (item) => {
            return item.id === visualizationId;
        });

        // If the widget was found, add the binding function
        if (widget) {
            widget.component = component;
        } else {
        this.widgets.push({
            id: visualizationId,
            gridData: null,
            component: component
        });
        }
    }

    /**
     * Register the grid data for a visualization
     * @param {string} visualizationId
     * @param {NeonGridItem} gridData
     */
    registerGridData(visualizationId: string, gridData: NeonGridItem) {
        let widget = _.find(this.widgets, (item) => {
            return item.id === visualizationId;
        });

        // If the widget was found, add the binding function
        if (widget) {
            widget.gridData = gridData;
        } else {
            this.widgets.push({
                id: visualizationId,
                gridData: gridData,
                component: null
            });
        }
    }

    /**
     * Unregisters a function with the given ID from this service. Should be called by visualization widgets upon being destroyed.
     * @param {String} visualizationId The unique ID of the function being unregistered.
     */
    unregister(visualizationId) {
        let index: number = _.findIndex(this.widgets, {
            id: visualizationId
        });

        if (index >= 0) {
        this.widgets.splice(index, 1);
        }
    }

    /**
     * Returns a list of all objects currently registered to this service, so the functions they have references to can
     * be used for bulk operations.
     * @return {Array} The list of objects subscribed to this service.
     */
    getWidgets(): NeonGridItem[] {
        let widgetList: NeonGridItem[] = [];

        // Build the list of widgets
        for (let item of this.widgets) {
            // Clone everything
            let gridItem: NeonGridItem = _.cloneDeep(item.gridData);
            // Move the row/col/sizes up to the root
            let gridItemConfig = gridItem.gridItemConfig;
            gridItem.sizex = gridItemConfig.sizex;
            gridItem.sizey = gridItemConfig.sizey;
            gridItem.row = gridItemConfig.row;
            gridItem.col = gridItemConfig.col;

            // Re-build the bindings
            gridItem.bindings = item.component.getBindings();
            widgetList.push(gridItem);
        }

        return widgetList;
    }
}
