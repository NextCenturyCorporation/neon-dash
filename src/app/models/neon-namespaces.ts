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

export namespace neonEvents {
    export const DASHBOARD_ERROR = 'DASHBOARD_ERROR';
    export const DASHBOARD_REFRESH = 'DASHBOARD_REFRESH';
    export const FILTERS_CHANGED = 'filters_changed'; // Lowercase to maintain backwards compatibility
    export const SELECT_ID = 'SELECT_ID';
    export const SHOW_OPTION_MENU = 'SHOW_OPTION_MENU';
    export const TOGGLE_FILTER_TRAY = 'TOGGLE_FILTER_TRAY';
    export const TOGGLE_SIMPLE_SEARCH = 'TOGGLE_SIMPLE_SEARCH';
    export const TOGGLE_VISUALIZATIONS_SHORTCUT = 'TOGGLE_VISUALIZATIONS_SHORTCUT';
    export const WIDGET_ADD = 'WIDGET_ADD';
    export const WIDGET_CONFIGURED = 'WIDGET_CONFIGURED';
    export const WIDGET_DELETE = 'WIDGET_DELETE';
    export const WIDGET_CONTRACT = 'WIDGET_CONTRACT';
    export const WIDGET_EXPAND = 'WIDGET_EXPAND';
    export const WIDGET_MOVE_TO_BOTTOM = 'WIDGET_MOVE_TO_BOTTOM';
    export const WIDGET_MOVE_TO_TOP = 'WIDGET_MOVE_TO_TOP';
    export const WIDGET_REGISTER = 'WIDGET_REGISTER';
    export const WIDGET_UNREGISTER = 'WIDGET_UNREGISTER';
}

export namespace neonUtilities {

    /**
     * Flattens and returns the given array.
     *
     * @arg {array} input
     * @return {array}
     */
    export function flatten(input) {
        return (input || []).reduce((array, element) => array.concat(Array.isArray(element) ? flatten(element) : element), []);
    }

    /**
     * Returns the object nested inside the given object using the given path string (with periods to mark each nested property).
     *
     * @arg {object} item
     * @arg {string} pathString
     * @return {object}
     */
    export function deepFind(item, pathString) {
        let itemToReturn = item;
        let path = (pathString ? pathString.split('.') : []);
        for (let index = 0; index < path.length; index++) {
            if (itemToReturn instanceof Array) {
                let nestedPath = path.slice(index).join('.');
                let pieces = [];
                for (let itemInList of itemToReturn) {
                    let entryValue = deepFind(itemInList, nestedPath);
                    if (entryValue instanceof Array) {
                        entryValue = flatten(entryValue);
                    }
                    pieces = pieces.concat(entryValue);
                }
                return pieces;
            }
            itemToReturn = itemToReturn ? itemToReturn[path[index]] : undefined;
        }
        return itemToReturn;
    }

    /**
     * Dynamic sorting over an array of objects
     * https://www.sitepoint.com/sort-an-array-of-objects-in-javascript/
     *
     * @arg {array} array
     * @arg {string} key
     * @arg {number} [order=1] 1 if ascending or -1 if descending
     * @return {array}
     */

    export function sortArrayOfObjects(array: any[], key: string, order: number = 1) {
        return array.sort((object1, object2) => {
            if (!object1.hasOwnProperty(key) || !object2.hasOwnProperty(key)) {
                // Property doesn't exist on either object
                return 0;
            }

            const varA = (typeof object1[key] === 'string') ? object1[key].toUpperCase() : object1[key];
            const varB = (typeof object2[key] === 'string') ? object2[key].toUpperCase() : object2[key];

            let comparison = 0;
            if (varA > varB) {
                comparison = 1;
            } else if (varA < varB) {
                comparison = -1;
            }
            return comparison * order;
        });
    }
}

// Mappings used in the JSON configuration file.
export namespace neonMappings {
    export const DATE = 'date';
    export const ID = 'id';
    export const LATITUDE = 'latitude';
    export const LONGITUDE = 'longitude';
    export const URL = 'url';
}

export const neonCustomConnectionMappings: { name: string, prettyName: string }[] = [{
    name: 'date',
    prettyName: 'Date'
},
{
    name: 'id',
    prettyName: 'ID'
},
{
    name: 'latitude',
    prettyName: 'Latitude'
},
{
    name: 'longitude',
    prettyName: 'Longitude'
},
{
    name: 'url',
    prettyName: 'URL'
}];

export namespace neonVisualizationMinPixel {
    /* eslint-disable id-length */
    export const x = 320;
    export const y = 240;
    /* eslint-enable id-length */
}

export const neonVisualizations: any[] = [{
    name: 'Annotation Viewer',
    type: 'annotationViewer',
    icon: 'annotation',
    bindings: {},
    config: {}
}, {
    name: 'Bar Chart',
    type: 'aggregation',
    icon: 'bar-chart',
    bindings: {
        title: 'Bar Chart',
        type: 'bar-v'
    },
    config: {}
}, {
    name: 'Data Table',
    type: 'dataTable',
    icon: 'data-table',
    bindings: {},
    config: {}
}, {
    name: 'Document Viewer',
    type: 'documentViewer',
    icon: 'document-viewer',
    bindings: {},
    config: {}
}, {
    name: 'Doughnut Chart',
    type: 'aggregation',
    icon: 'donut-chart',
    bindings: {
        title: 'Doughnut Chart',
        type: 'doughnut'
    },
    config: {}
}, {
    name: 'Histogram',
    type: 'aggregation',
    icon: 'timeline',
    bindings: {
        title: 'Histogram',
        type: 'histogram'
    },
    config: {}
}, {
    name: 'Line Chart',
    type: 'aggregation',
    icon: 'line-chart',
    bindings: {
        title: 'Line Chart',
        type: 'line-xy'
    },
    config: {}
}, {
    name: 'Map',
    type: 'map',
    icon: 'map',
    bindings: {},
    config: {}
}, {
    name: 'Media Viewer',
    type: 'mediaViewer',
    icon: 'media-viewer',
    bindings: {},
    config: {}
}, {
    name: 'Network Graph',
    type: 'networkGraph',
    icon: 'network-graph',
    bindings: {},
    config: {}
}, {
    name: 'News Feed',
    type: 'newsFeed',
    icon: 'news-feed',
    bindings: {},
    config: {}
}, {
    name: 'Pie Chart',
    type: 'aggregation',
    icon: 'pie-chart',
    bindings: {
        title: 'Pie Chart',
        type: 'pie'
    },
    config: {}
}, {
    name: 'Sample',
    type: 'sample',
    icon: 'neon_logo',
    bindings: {},
    config: {}
}, {
    name: 'Scatter Plot',
    type: 'aggregation',
    icon: 'scatter-chart',
    bindings: {
        title: 'Scatter Plot',
        type: 'scatter-xy'
    },
    config: {}
}, {
    name: 'Taxonomy Viewer',
    type: 'taxonomyViewer',
    icon: 'taxonomy_viewer-03'
}, {
    name: 'Text Cloud',
    type: 'textCloud',
    icon: 'text-cloud',
    bindings: {},
    config: {}
}, {
    name: 'Thumbnail Grid',
    type: 'thumbnailGrid',
    icon: 'thumbnail_grid',
    bindings: {},
    config: {}
}, {
    name: 'Wiki Viewer',
    type: 'wikiViewer',
    icon: 'wiki',
    bindings: {},
    config: {}
}];
