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
    export const DASHBOARD_MESSAGE = 'DASHBOARD_MESSAGE';
    export const DASHBOARD_REFRESH = 'DASHBOARD_REFRESH';
    export const SELECT_ID = 'SELECT_ID';
    export const SHOW_OPTION_MENU = 'SHOW_OPTION_MENU';
    export const TOGGLE_FILTER_TRAY = 'TOGGLE_FILTER_TRAY';
    export const TOGGLE_SIMPLE_SEARCH = 'TOGGLE_SIMPLE_SEARCH';
    export const TOGGLE_VISUALIZATIONS_SHORTCUT = 'TOGGLE_VISUALIZATIONS_SHORTCUT';
    export const TOGGLE_LOCAL_TIMES = 'TOGGLE_LOCAL_TIMES';
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

export const neonVisualizations: any[] = [{
    name: 'Annotation Viewer',
    type: 'annotationViewer',
    icon: 'annotation',
    bindings: {},
    config: {}
}, {
    name: 'Annotation',
    type: 'annotation',
    icon: 'bar-chart',
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
    icon: 'taxonomy_viewer'
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
