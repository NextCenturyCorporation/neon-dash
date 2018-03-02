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
import * as neon from 'neon-framework';
export var neonVariables;
(function (neonVariables) {
    /* tslint:disable:no-string-literal */
    neonVariables.ASCENDING = neon.query['ASCENDING'];
    neonVariables.AVG = neon.query['AVG'];
    neonVariables.COUNT = neon.query['COUNT'];
    neonVariables.DESCENDING = neon.query['DESCENDING'];
    neonVariables.MAX = neon.query['MAX'];
    neonVariables.MIN = neon.query['MIN'];
    neonVariables.SUM = neon.query['SUM'];
    /* tslint:enable:no-string-literal */
})(neonVariables || (neonVariables = {}));
export var neonUtilities;
(function (neonUtilities) {
    /**
     * Flattens and returns the given array.
     *
     * @arg {array} input
     * @return {array}
     */
    function flatten(input) {
        return (input || []).reduce(function (array, element) {
            return array.concat(Array.isArray(element) ? flatten(element) : element);
        }, []);
    }
    neonUtilities.flatten = flatten;
    /**
     * Returns the object nested inside the given object using the given path string (with periods to mark each nested property).
     *
     * @arg {object} item
     * @arg {string} pathString
     * @return {object}
     */
    function deepFind(item, pathString) {
        var itemToReturn = item;
        var path = (pathString ? pathString.split('.') : []);
        for (var i = 0; i < path.length; i++) {
            if (itemToReturn instanceof Array) {
                var nestedPath = path.slice(i).join('.');
                var pieces = [];
                for (var _i = 0, itemToReturn_1 = itemToReturn; _i < itemToReturn_1.length; _i++) {
                    var itemInList = itemToReturn_1[_i];
                    var entryValue = deepFind(itemInList, nestedPath);
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
    neonUtilities.deepFind = deepFind;
})(neonUtilities || (neonUtilities = {}));
// Mappings used in the JSON configuration file.
export var neonMappings;
(function (neonMappings) {
    neonMappings.ID = 'id';
    neonMappings.DATE = 'date';
    neonMappings.TAGS = 'tags';
    neonMappings.URLS = 'url';
    neonMappings.LATITUDE = 'latitude';
    neonMappings.LONGITUDE = 'longitude';
    neonMappings.SOURCE_LATITUDE = 'source_latitude';
    neonMappings.SOURCE_LONGITUDE = 'source_longitude';
    neonMappings.TARGET_LATITUDE = 'target_latitude';
    neonMappings.TARGET_LONGITUDE = 'target_longitude';
    neonMappings.COLOR = 'color_by';
    neonMappings.NODE_COLOR_BY = 'nodeColorBy';
    neonMappings.LINE_COLOR_BY = 'lineColorBy';
    neonMappings.SIZE = 'size_by';
    neonMappings.NODE_SIZE = 'node_size';
    neonMappings.LINE_SIZE = 'line_size';
    neonMappings.SORT = 'sort_by';
    neonMappings.AGGREGATE = 'count_by';
    neonMappings.Y_AXIS = 'y_axis';
    neonMappings.BAR_GROUPS = 'bar_x_axis';
    neonMappings.LINE_GROUPS = 'line_category';
    neonMappings.SCATTERPLOT_X_AXIS = 'x_attr';
    neonMappings.SCATTERPLOT_Y_AXIS = 'y_attr';
    neonMappings.GRAPH_NODE = 'graph_nodes';
    neonMappings.GRAPH_LINKED_NODE = 'graph_links';
    neonMappings.GRAPH_NODE_NAME = 'graph_node_name';
    neonMappings.GRAPH_LINKED_NODE_NAME = 'graph_link_name';
    neonMappings.GRAPH_NODE_SIZE = 'graph_node_size';
    neonMappings.GRAPH_LINKED_NODE_SIZE = 'graph_link_size';
    neonMappings.GRAPH_FLAG = 'graph_flag';
    neonMappings.GRAPH_FLAG_MODE = 'graph_flag_mode';
    neonMappings.GRAPH_TOOLTIP_ID_LABEL = 'graph_tooltip_id_label';
    neonMappings.GRAPH_TOOLTIP_DATA_LABEL = 'graph_tooltip_data_label';
    neonMappings.GRAPH_TOOLTIP_NAME_LABEL = 'graph_tooltip_name_label';
    neonMappings.GRAPH_TOOLTIP_SIZE_LABEL = 'graph_tooltip_size_label';
    neonMappings.GRAPH_TOOLTIP_FLAG_LABEL = 'graph_tooltip_flag_label';
    neonMappings.GRAPH_TOOLTIP_SOURCE_NAME_LABEL = 'graph_tooltip_source_name_label';
    neonMappings.GRAPH_TOOLTIP_TARGET_NAME_LABEL = 'graph_tooltip_target_name_label';
    neonMappings.GRAPH_TOOLTIP_SOURCE_SIZE_LABEL = 'graph_tooltip_source_size_label';
    neonMappings.GRAPH_TOOLTIP_TARGET_SIZE_LABEL = 'graph_tooltip_target_size_label';
    neonMappings.NEWSFEED_NAME = 'newsfeed_name';
    neonMappings.NEWSFEED_TYPE = 'newsfeed_type';
    neonMappings.NEWSFEED_TEXT = 'newsfeed_text';
    neonMappings.NEWSFEED_AUTHOR = 'newsfeed_author';
    neonMappings.START_DATE = 'startDate';
    neonMappings.END_DATE = 'endDate';
    neonMappings.MIN_LAT = 'minLat';
    neonMappings.MIN_LON = 'minLon';
    neonMappings.MAX_LAT = 'maxLat';
    neonMappings.MAX_LON = 'maxLon';
    neonMappings.BOUNDS = 'bounds';
    neonMappings.POINT = 'point';
})(neonMappings || (neonMappings = {}));
export var neonVisualizationMinPixel;
(function (neonVisualizationMinPixel) {
    neonVisualizationMinPixel.x = 320;
    neonVisualizationMinPixel.y = 240;
})(neonVisualizationMinPixel || (neonVisualizationMinPixel = {}));
export var neonVisualizations = [
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
    },
    {
        name: 'Timeline',
        type: 'timeline',
        icon: 'Timeline64'
    },
    {
        name: 'Wiki Viewer',
        type: 'wikiViewer',
        icon: 'WikiViewer'
    }
];
//# sourceMappingURL=neon-namespaces.js.map