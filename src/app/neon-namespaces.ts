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
export namespace charts { };
export namespace mediators { };

export namespace neonColors {
    export const GREEN = '#39b54a';
    export const RED = '#C23333';
    export const BLUE = '#3662CC';
    export const ORANGE = '#ff7f0e';
    export const PURPLE = '#9467bd';
    export const BROWN = '#8c564b';
    export const PINK = '#e377c2';
    export const GRAY = '#7f7f7f';
    export const YELLOW = '#bcbd22';
    export const CYAN = '#17becf';
    export const LIGHT_GREEN = '#98df8a';
    export const LIGHT_RED = '#ff9896';
    export const LIGHT_BLUE = '#aec7e8';
    export const LIGHT_ORANGE = '#ffbb78';
    export const LIGHT_PURPLE = '#c5b0d5';
    export const LIGHT_BROWN = '#c49c94';
    export const LIGHT_PINK = '#f7b6d2';
    export const LIGHT_GRAY = '#c7c7c7';
    export const LIGHT_YELLOW = '#dbdb8d';
    export const LIGHT_CYAN = '#9edae5';
    export const LIST = [
        GREEN,
        RED,
        BLUE,
        ORANGE,
        PURPLE,
        BROWN,
        PINK,
        GRAY,
        YELLOW,
        CYAN,
        LIGHT_GREEN,
        LIGHT_RED,
        LIGHT_BLUE,
        LIGHT_ORANGE,
        LIGHT_PURPLE,
        LIGHT_BROWN,
        LIGHT_PINK,
        LIGHT_GRAY,
        LIGHT_YELLOW,
        LIGHT_CYAN
    ];
    export const DEFAULT: string = GRAY;
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
};

export namespace neonWizard {
    export namespace mappings {
        export const DATE = {
            name: 'date',
            prettyName: 'Date'
        };
        export const TAGS = {
            name: 'tags',
            prettyName: 'Tag Cloud Field'
        };
        export const LATITUDE = {
            name: 'latitude',
            prettyName: 'Latitude'
        };
        export const LONGITUDE = {
            name: 'longitude',
            prettyName: 'Longitude'
        };
        export const COLOR = {
            name: 'color_by',
            prettyName: 'Map Color By'
        };
        export const SIZE = {
            name: 'size_by',
            prettyName: 'Map Size By'
        };
        export const SORT = {
            name: 'sort_by',
            prettyName: 'Data Table Sort By'
        };
        export const AGGREGATE = {
            name: 'count_by',
            prettyName: 'Aggregation Table Field'
        };
        export const Y_AXIS = {
            name: 'y_axis',
            prettyName: 'Y-Axis'
        };
        export const BAR_GROUPS = {
            name: 'bar_x_axis',
            prettyName: 'Bar Chart X-Axis'
        };
        export const LINE_GROUPS = {
            name: 'line_category',
            prettyName: 'Line Chart Grouping'
        };
        export const GRAPH_NODE = {
            name: 'graph_nodes',
            prettyName: 'Graph Nodes'
        };
        export const GRAPH_LINKED_NODE = {
            name: 'graph_links',
            prettyName: 'Graph Linked Nodes'
        };
        export const GRAPH_NODE_NAME = {
            name: 'graph_node_name',
            prettyName: 'Graph Nodes Name'
        };
        export const GRAPH_LINKED_NODE_NAME = {
            name: 'graph_link_name',
            prettyName: 'Graph Linked Nodes Name'
        };
        export const GRAPH_NODE_SIZE = {
            name: 'graph_node_size',
            prettyName: 'Graph Node Size'
        };
        export const GRAPH_LINKED_NODE_SIZE = {
            name: 'graph_link_size',
            prettyName: 'Graph Linked Node Size'
        };
        export const GRAPH_FLAG = {
            name: 'graph_flag',
            prettyName: 'Graph Flag Field'
        };
        export const NEWSFEED_TEXT = {
            name: 'newsfeed_text',
            prettyName: 'Graph Text Field'
        };
    }
}

export namespace neonWizard {
    export const visualizationBindings: any = {};
}

neonWizard.visualizationBindings.barchart = [
    {
        label: 'X-Axis',
        name: 'bind-x-axis-field',
        bindingName: 'bar_x_axis'
    }, {
        label: 'Aggregation',
        name: 'bind-aggregation',
        options: [
            {
                name: 'count',
                prettyName: 'Count',
                defaultOption: true
            }, {
                name: 'sum',
                prettyName: 'Sum'
            }, {
                name: 'average',
                prettyName: 'Average'
            }
        ]
    }, {
        label: 'Y-Axis',
        name: 'bind-y-axis-field',
        bindingName: 'y_axis'
    }
];
neonWizard.visualizationBindings['circular-heat-form'] = [
    {
        label: 'Date Field',
        name: 'bind-date-field',
        bindingName: 'date'
    }
];
neonWizard.visualizationBindings['count-by'] = [
    {
        label: 'Group Field',
        name: 'bind-group-field',
        bindingName: 'count_by'
    }, {
        label: 'Aggregation',
        name: 'bind-aggregation',
        options: [
            {
                name: 'count',
                prettyName: 'Count',
                defaultOption: true
            }, {
                name: 'min',
                prettyName: 'Minimum'
            }, {
                name: 'max',
                prettyName: 'maximum'
            }
        ]
    }, {
        label: 'Aggregation Field',
        name: 'bind-aggregation-field'
    }
];
neonWizard.visualizationBindings['directed-graph'] = [];
neonWizard.visualizationBindings['filter-builder'] = [];
neonWizard.visualizationBindings['gantt-chart'] = [
    {
        label: 'Start Field',
        name: 'bind-start-field'
    }, {
        label: 'End Field',
        name: 'bind-end-field'
    }, {
        label: 'Color Field',
        name: 'bind-color-field'
    }
];
neonWizard.visualizationBindings.linechart = [
    {
        label: 'Date Granularity',
        name: 'bind-granularity',
        options: [
            {
                name: 'day',
                prettyName: 'Day',
                defaultOption: true
            }, {
                name: 'hour',
                prettyName: 'Hour'
            }
        ]
    }
];
neonWizard.visualizationBindings.map = [];
neonWizard.visualizationBindings.newsfeed = [
    {
        label: 'Primary Title Field',
        name: 'bind-primary-title-field'
    }, {
        label: 'Secondary Title Field',
        name: 'bind-secondary-title-field'
    }, {
        label: 'Date Field',
        name: 'bind-date-field',
        bindingName: 'date'
    }, {
        label: 'Content Field',
        name: 'bind-content-field'
    }
];
neonWizard.visualizationBindings['plotly-graph'] = [
    {
        label: 'X Attribute',
        name: 'bind-x-axis-field'
    }, {
        label: 'Y Attribute',
        name: 'bind-y-axis-field'
    }, {
        label: 'Type',
        name: 'graph-type',
        options: [
            {
                name: 'scatter',
                prettyName: 'Scatter Plot',
                defaultOption: true
            }, {
                name: 'heatmapScatter',
                prettyName: 'Heatmap Scatter Plot'
            }, {
                name: 'histogramScatter',
                prettyName: 'Histogram Plot'
            }
        ]
    }
];
neonWizard.visualizationBindings['query-results-table'] = [];
neonWizard.visualizationBindings.sunburst = [];
neonWizard.visualizationBindings['tag-cloud'] = [
    {
        label: 'Data Field',
        name: 'bind-tag-field',
        bindingName: 'tags'
    }
];
neonWizard.visualizationBindings['timeline-selector'] = [
    {
        label: 'Date Field',
        name: 'bind-date-field',
        bindingName: 'date'
    }, {
        label: 'Date Granularity',
        name: 'bind-granularity',
        options: [
            {
                name: 'year',
                prettyName: 'Year'
            }, {
                name: 'month',
                prettyName: 'Month'
            }, {
                name: 'day',
                prettyName: 'Day',
                defaultOption: true
            }, {
                name: 'hour',
                prettyName: 'Hour'
            }
        ]
    }
];

export namespace neonVisualizationMinPixel { // jshint ignore:line
    export const x = 320;
    export const y = 240;
};

export const neonVisualizations: any[] = [
    //    {   // jshint ignore:line
    //        name: 'Aggregation Table',
    //        type: 'aggregationTable',
    //        icon: 'Count64'
    //    },
    {
        name: 'Bar Chart',
        type: 'barChart',
        icon: 'BarChart64'
    },
    //{
    //    name: 'Custom Filter List',
    //    type: 'customFilterList',
    //    icon: 'CustomFilterList64'
    //},
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
    //{
    //    name: 'Gantt Chart',
    //    type: 'ganttChart',
    //    icon: 'Gantt64'
    //},
    {
        name: 'Line Chart',
        type: 'lineChart',
        icon: 'LineChart64'
    }, {
        name: 'Map',
        type: 'map',
        icon: 'Map64'
    },
    //{
    //    name: 'Network Graph',
    //    type: 'networkGraph',
    //    icon: 'Graph64'
    //},
    //{
    //    name: 'Newsfeed',
    //    type: 'newsFeed',
    //    icon: 'News64'
    //},
    // {
    //    name: 'Ops Clock',
    //    type: 'opsClock',
    //    icon: 'OpsClock64'
    //},
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
    //{
    //    name: 'Sunburst Chart',
    //    type: 'sunburstChart',
    //    icon: 'Sunburst64'
    //},
    {
        name: 'Text Cloud',
        type: 'textCloud',
        icon: 'TagCloud64'
    }, {
        name: 'Timeline',
        type: 'timeline',
        icon: 'Timeline64'
    }];
