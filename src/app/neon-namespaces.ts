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

/* eslist-disable */

export namespace neonEvents {
    export const DASHBOARD_ERROR = 'DASHBOARD_ERROR';
    export const DASHBOARD_READY = 'DASHBOARD_READY';
    export const DASHBOARD_REFRESH = 'DASHBOARD_REFRESH';
    export const DASHBOARD_RESET = 'DASHBOARD_RESET';
    export const DASHBOARD_STATE = 'DASHBOARD_STATE';
    export const FILTERS_CHANGED = 'filters_changed'; // Lowercase to maintain backwards compatibility
    export const SELECT_ID = 'SELECT_ID';
    export const SHOW_OPTION_MENU = 'SHOW_OPTION_MENU';
    export const TOGGLE_FILTER_TRAY = 'TOGGLE_FILTER_TRAY';
    export const TOGGLE_SIMPLE_SEARCH = 'TOGGLE_SIMPLE_SEARCH';
    export const TOGGLE_VISUALIZATIONS_SHORTCUT = 'TOGGLE_VISUALIZATIONS_SHORTCUT';
    export const WIDGET_ADD = 'WIDGET_ADD';
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
    export function flatten(input, out = []) {
        for (const element of (input || [])) {
            if (Array.isArray(element)) {
                flatten(element, out);
            } else {
                out.push(element);
            }
        }
        return out;
    }

    /**
     * Returns the object nested inside the given object using the given path string (with periods to mark each nested property).
     *
     * @arg {object} item
     * @arg {string|string[]} pathString
     * @return {object}
     */
    export function deepFind(item, path, offset = 0) {
        let itemToReturn = item;
        const pathElements = Array.isArray(path) ? path : (path ? path.split('.') : []);

        for (let i = offset; i < pathElements.length; i++) {
            if (itemToReturn instanceof Array) {
                let pieces = [];
                for (let itemInList of itemToReturn) {
                    let entryValue = deepFind(itemInList, pathElements, i);
                    if (entryValue instanceof Array) {
                        entryValue = flatten(entryValue);
                    }
                    pieces = pieces.concat(entryValue);
                }
                return pieces;
            }
            itemToReturn = itemToReturn && itemToReturn[pathElements[i]];
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
        return array.sort((a, b) => {
            if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
                // property doesn't exist on either object
                return 0;
            }

            const varA = (typeof a[key] === 'string') ? a[key].toUpperCase() : a[key];
            const varB = (typeof b[key] === 'string') ? b[key].toUpperCase() : b[key];

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

export namespace neonVisualizationMinPixel { // jshint ignore:line
    export const x = 320;
    export const y = 240;
}

export const neonVisualizations: any[] = [{
    name: 'Annotation Viewer',
    type: 'annotationViewer',
    icon: 'annotation_viewer',
    bindings: {},
    config: {}
}, {
    name: 'Bar Chart',
    type: 'aggregation',
    icon: 'bar_chart',
    bindings: {
        title: 'Bar Chart',
        type: 'bar-v'
    },
    config: {}
}, {
    name: 'Data Table',
    type: 'dataTable',
    icon: 'view_data',
    bindings: {},
    config: {}
}, {
    name: 'Document Viewer',
    type: 'documentViewer',
    icon: 'document_viewer',
    bindings: {},
    config: {}
}, {
    name: 'Doughnut Chart',
    type: 'aggregation',
    icon: 'pie_chart',
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
    icon: 'line_chart',
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
    icon: 'media_viewer',
    bindings: {},
    config: {}
}, {
    name: 'Network Graph',
    type: 'networkGraph',
    icon: 'network_graph',
    bindings: {},
    config: {}
}, {
    name: 'News Feed',
    type: 'newsFeed',
    icon: 'newspaper',
    bindings: {},
    config: {}
}, {
    name: 'Pie Chart',
    type: 'aggregation',
    icon: 'pie_chart',
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
    icon: 'scatter_plot',
    bindings: {
        title: 'Scatter Plot',
        type: 'scatter-xy'
    },
    config: {}
}, {
    name: 'Taxonomy Viewer',
    type: 'taxonomyViewer',
    icon: 'taxonomy_viewer'
}, {
    name: 'Text Cloud',
    type: 'textCloud',
    icon: 'text_cloud',
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
    icon: 'wiki_viewer',
    bindings: {},
    config: {}
}];
