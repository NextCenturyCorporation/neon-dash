/*
 * Copyright 2016 Next Century Corporation
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
/* eslist-disable */

export namespace neonUtilities {
    /**
     * Flattens and returns the given array.
     *
     * @arg {array} array
     * @return {array} array
     */
    export function flatten(array) {
        return (array || []).reduce(function(sum, element) {
            return sum.concat(Array.isArray(element) ? this.flatten(element) : element);
        }.bind(this), []); // "(array || [])" and ", []" prevent against exceptions and return [] when array is null or empty.
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
        for (let i = 0, path = (pathString ? pathString.split('.') : []), length = path.length; i < length; i++) {
            if (itemToReturn instanceof Array) {
                let nestedPath = path.slice(i).join('.');
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
            itemToReturn = itemToReturn ? itemToReturn[path[i]] : undefined;
            if (!itemToReturn) {
                return undefined;
            }
        }
        return itemToReturn;
    }
}

// Mappings used in the JSON configuration file.
export namespace neonMappings {
    export const ID = 'id';
    export const DATE = 'date';
    export const TAGS = 'tags';
    export const URLS = 'url';
    export const LATITUDE = 'latitude';
    export const LONGITUDE = 'longitude';
    export const SOURCE_LATITUDE = 'source_latitude';
    export const SOURCE_LONGITUDE = 'source_longitude';
    export const TARGET_LATITUDE = 'target_latitude';
    export const TARGET_LONGITUDE = 'target_longitude';
    export const COLOR = 'color_by';
    export const NODE_COLOR_BY = 'nodeColorBy';
    export const LINE_COLOR_BY = 'lineColorBy';
    export const SIZE = 'size_by';
    export const NODE_SIZE = 'node_size';
    export const LINE_SIZE = 'line_size';
    export const SORT = 'sort_by';
    export const AGGREGATE = 'count_by';
    export const Y_AXIS = 'y_axis';
    export const BAR_GROUPS = 'bar_x_axis';
    export const LINE_GROUPS = 'line_category';
    export const SCATTERPLOT_X_AXIS = 'x_attr';
    export const SCATTERPLOT_Y_AXIS = 'y_attr';
    export const GRAPH_NODE = 'graph_nodes';
    export const GRAPH_LINKED_NODE = 'graph_links';
    export const GRAPH_NODE_NAME = 'graph_node_name';
    export const GRAPH_LINKED_NODE_NAME = 'graph_link_name';
    export const GRAPH_NODE_SIZE = 'graph_node_size';
    export const GRAPH_LINKED_NODE_SIZE = 'graph_link_size';
    export const GRAPH_FLAG = 'graph_flag';
    export const GRAPH_FLAG_MODE = 'graph_flag_mode';
    export const GRAPH_TOOLTIP_ID_LABEL = 'graph_tooltip_id_label';
    export const GRAPH_TOOLTIP_DATA_LABEL = 'graph_tooltip_data_label';
    export const GRAPH_TOOLTIP_NAME_LABEL = 'graph_tooltip_name_label';
    export const GRAPH_TOOLTIP_SIZE_LABEL = 'graph_tooltip_size_label';
    export const GRAPH_TOOLTIP_FLAG_LABEL = 'graph_tooltip_flag_label';
    export const GRAPH_TOOLTIP_SOURCE_NAME_LABEL = 'graph_tooltip_source_name_label';
    export const GRAPH_TOOLTIP_TARGET_NAME_LABEL = 'graph_tooltip_target_name_label';
    export const GRAPH_TOOLTIP_SOURCE_SIZE_LABEL = 'graph_tooltip_source_size_label';
    export const GRAPH_TOOLTIP_TARGET_SIZE_LABEL = 'graph_tooltip_target_size_label';
    export const NEWSFEED_NAME = 'newsfeed_name';
    export const NEWSFEED_TYPE = 'newsfeed_type';
    export const NEWSFEED_TEXT = 'newsfeed_text';
    export const NEWSFEED_AUTHOR = 'newsfeed_author';
    export const START_DATE = 'startDate';
    export const END_DATE = 'endDate';
    export const MIN_LAT = 'minLat';
    export const MIN_LON = 'minLon';
    export const MAX_LAT = 'maxLat';
    export const MAX_LON = 'maxLon';
    export const BOUNDS = 'bounds';
    export const POINT = 'point';
}

export namespace neonVisualizationMinPixel { // jshint ignore:line
    export const x = 320;
    export const y = 240;
}

export const neonVisualizations: any[] = [
    {
        name: 'Bar Chart',
        type: 'barChart',
        icon: 'BarChart64'
    },
    {
        name: 'Data Table',
        type: 'dataTable',
        icon: 'ViewData64'
    },
    {
        name: 'Document Viewer',
        type: 'documentViewer',
        icon: 'DocumentViewer64'
    },
    {
        minPixelX: 480,
        name: 'Filter Builder',
        type: 'filterBuilder',
        icon: 'CreateFilter64'
    },
    {
        name: 'Line Chart',
        type: 'lineChart',
        icon: 'LineChart64'
    }, {
        name: 'Map',
        type: 'map',
        icon: 'Map64'
    },
    {
        name: 'Scatter Plot',
        type: 'scatterPlot',
        icon: 'ScatterPlot64'
    },
    {
        name: 'Stacked Timeline',
        type: 'stackedTimeline',
        icon: 'Timeline64'
    },
    {
        name: 'Text Cloud',
        type: 'textCloud',
        icon: 'TagCloud64'
    }, {
        name: 'Timeline',
        type: 'timeline',
        icon: 'Timeline64'
    }];
