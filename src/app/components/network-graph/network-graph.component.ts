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
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';

import { AbstractSearchService, FilterClause, QueryPayload } from 'component-library/dist/core/services/abstract.search.service';
import { InjectableColorThemeService } from '../../services/injectable.color-theme.service';
import { DashboardService } from '../../services/dashboard.service';
import { AbstractFilterDesign, FilterCollection, ListFilter, ListFilterDesign } from 'component-library/dist/core/models/filters';
import { InjectableFilterService } from '../../services/injectable.filter.service';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { FieldConfig } from 'component-library/dist/core/models/dataset';
import { CoreUtil } from 'component-library/dist/core/core.util';
import {
    CompoundFilterType,
    OptionChoices,
    SortOrder,
    ConfigOptionFieldArray,
    ConfigOptionField,
    ConfigOptionFreeText,
    ConfigOptionNumber,
    ConfigOption,
    ConfigOptionSelect,
    ConfigOptionColor
} from 'component-library/dist/core/models/config-option';

import * as d3shape from 'd3-shape';
import 'd3-transition';
import * as vis from 'visjs-network/dist/vis-network.min';
import { MatDialog } from '@angular/material';

let styleImport: any;

class GraphData {
    constructor(
        public nodes = new vis.DataSet(),
        public edges = new vis.DataSet()
    ) { }

    update(source: GraphProperties) {
        this.nodes.update(source.nodes);
        this.edges.update(source.edges);
    }

    clear() {
        this.nodes.clear();
        this.edges.clear();
    }
}

class GraphProperties {
    constructor(
        public nodes: Node[] = [],
        public edges: Edge[] = []
    ) { }

    addNode(node: Node) {
        this.nodes.push(node);
    }

    addEdge(edge: Edge) {
        this.edges.push(edge);
    }
}

class Node {
    // http://visjs.org/docs/network/nodes.html
    constructor(
        public id: string,
        public label: string,
        public nodeType?: string,
        public size?: number,
        public color?: string,
        public isLink?: boolean,
        public font?: Record<string, any>,
        public shape?: string,
        public x?: number,
        public y?: number,
        public filterFields?: any[],
        public chosen?: Record<string, any>,
        public title?: HTMLElement | string
    ) { }
}

interface ArrowProperties {
    to: boolean;
}

interface ArrowUpdate {
    id: string;
    arrows: ArrowProperties;
    color?: Record<string, any>;
}

interface NodeUpdate {
    id: string;
    x: number;
    y: number;
}

interface EdgeColorProperties {
    color: string;
    highlight: string;
}

class Edge {
    // http://visjs.org/docs/network/edges.html
    constructor(
        public from: string,
        public to: string,
        public label?: string,
        public arrows?: ArrowProperties,
        public count?: number,
        public color?: EdgeColorProperties,
        public type?: string, // Used to identify that category of edge (to hide/show when legend option is clicked)
        /* TODO: width seem to breaking directed arrows, removing for now
        public width?: number*/
        public font?: Record<string, any>,
        public chosen?: Record<string, any>,
        public title?: HTMLElement | string
    ) { }
}

const LayerType = {
    Nodes: 'nodes',
    Edges: 'edges',
    Clusters: 'clusters',
    ClusterMemberships: 'clustermemberships'
};

@Component({
    selector: 'app-network-graph',
    templateUrl: './network-graph.component.html',
    styleUrls: ['./network-graph.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NetworkGraphComponent extends BaseNeonComponent implements OnInit, OnDestroy, AfterViewInit {
    static FONT = 'Roboto, sans-serif';
    static EDGE_FONT_SIZE: number = 10;
    static NODE_FONT_SIZE: number = 14;
    static DEFAULT_FONT_COLOR: string ='#343434';
    static DEFAULT_EDGE_COLOR: string ='#2b7ce9';
    static DEFAULT_NODE_COLOR: string ='#96c1fc';

    @ViewChild('graphElement', { static: true }) graphElement: ElementRef;
    @ViewChild('headerText', { static: true }) headerText: ElementRef;
    @ViewChild('infoText', { static: true }) infoText: ElementRef;

    public graphData: GraphData = new GraphData();
    public responseData: any[] = [];

    public displayGraph: boolean;
    public totalNodes: number;
    public prettifiedNodeLegendLabels: string[] = [];
    public prettifiedEdgeLegendLabels: string[] = [];

    public updatedNodePositions: NodeUpdate[] = [];

    existingNodeNames: string[];
    view: any[];
    width: number = 400;
    height: number = 400;
    fitContainer: boolean = true;
    autoZoom: boolean = false;
    // Options
    orientation: string = 'TB'; // LR, RL, TB, BT
    orientations: any[] = [
        {
            label: 'Left to Right',
            value: 'LR'
        }, {
            label: 'Right to Left',
            value: 'RL'
        }, {
            label: 'Top to Bottom',
            value: 'TB'
        }, {
            label: 'Bottom to Top',
            value: 'BT'
        }
    ];

    // Line interpolation
    curveType: string = 'Linear';
    curve: any = d3shape.curveLinear;
    interpolationTypes = [
        'Bundle',
        'Cardinal',
        'Catmull Rom',
        'Linear',
        'Monotone X',
        'Monotone Y',
        'Natural',
        'Step',
        'Step After',
        'Step Before'
    ];

    nodeShapes = ['box', 'diamond', 'dot', 'square', 'triangle', 'triangleDown', 'star'];

    colorSets: any;
    colorScheme: any;
    schemeType: string = 'ordinal';
    selectedColorScheme: string;
    public colorKeys: string[] = [];
    public disabledSet: [string, string][] = [];

    private defaultActiveColor;
    private graph: vis.Network;
    private relationNodes: any[] = [];

    // Save the values of the filters in the FilterService that are compatible with this visualization's filters.
    private _filteredLegendValues: any[] = [];
    private _filterFieldsToFilteredValues: Map<string, any[]> = new Map<string, any[]>();

    constructor(
        dashboardService: DashboardService,
        filterService: InjectableFilterService,
        searchService: AbstractSearchService,
        protected colorThemeService: InjectableColorThemeService,
        ref: ChangeDetectorRef,
        dialog: MatDialog,
        public visualization: ElementRef,
    ) {
        super(
            dashboardService,
            filterService,
            searchService,
            ref,
            dialog
        );

        this.graphData = new GraphData();

        this.setInterpolationType('Bundle');

        if (!styleImport) {
            styleImport = document.createElement('link');
            styleImport.rel = 'stylesheet';
            styleImport.href = 'assets/vis/dist/vis-network.min.css';
            document.head.appendChild(styleImport);
        }
    }

    /**
     * Initilizes any visualization properties and elements when the widget is created.
     *
     * @override
     */
    initializeProperties() {
        // Backwards compatibility (showOnlyFiltered deprecated due to its redundancy with hideUnfiltered).
        if (typeof this.options.showOnlyFiltered !== 'undefined') {
            this.options.hideUnfiltered = this.options.showOnlyFiltered;
        }

        this.displayGraph = !this.options.hideUnfiltered;
    }

    private createFilterDesignOnLegend(values: any[] = [undefined]): ListFilterDesign {
        return new ListFilterDesign(CompoundFilterType.AND, this.options.datastore.name + '.' + this.options.database.name + '.' +
            this.options.table.name + '.' + this.options.edgeColorField.columnName, '!=', values);
    }

    private createFilterDesignOnList(field: FieldConfig, values: any[] = [undefined]): ListFilterDesign {
        return new ListFilterDesign(this.options.multiFilterOperator === 'or' ? CompoundFilterType.OR : CompoundFilterType.AND,
            this.options.datastore.name + '.' + this.options.database.name + '.' + this.options.table.name + '.' + field.columnName, '=',
            values);
    }

    /**
     * Creates and returns an array of options for the visualization.
     *
     * @return {ConfigOption[]}
     * @override
     */
    protected createOptions(): ConfigOption[] {
        return [
            new ConfigOptionField('nodeField', 'Node Field', true, this.optionsIsReified.bind(this)),
            new ConfigOptionField('nodeNameField', 'Node Name Field', false, this.optionsIsReified.bind(this)),
            new ConfigOptionField('targetNameField', 'Target Name Field', false, this.optionsIsReified.bind(this)),
            new ConfigOptionField('linkField', 'Link Field', true, this.optionsIsReified.bind(this)),
            new ConfigOptionField('linkNameField', 'Link Name Field', false, this.optionsIsReified.bind(this)),
            new ConfigOptionField('nodeColorField', 'Node Color Field', false, this.optionsIsReified.bind(this)),
            new ConfigOptionField('edgeColorField', 'Edge Color Field', false, this.optionsIsReified.bind(this)),
            new ConfigOptionField('targetColorField', 'Target Color Field', false, this.optionsIsReified.bind(this)),
            new ConfigOptionField('xPositionField', 'X Position Field', false, this.optionsIsReified.bind(this)),
            new ConfigOptionField('yPositionField', 'Y Position Field', false, this.optionsIsReified.bind(this)),
            new ConfigOptionField('xTargetPositionField', 'X Target Position Field', false, this.optionsIsReified.bind(this)),
            new ConfigOptionField('yTargetPositionField', 'Y Target Position Field', false, this.optionsIsReified.bind(this)),
            new ConfigOptionField('typeField', 'Type Field', false, this.optionsIsReified.bind(this)),
            new ConfigOptionFieldArray('filterFields', 'Filter Fields', false),
            new ConfigOptionSelect('cleanLegendLabels', 'Clean Legend Labels', false, false, OptionChoices.NoFalseYesTrue),
            new ConfigOptionSelect('isReified', 'Data Format', false, false, [{
                prettyName: 'Tabular',
                variable: false
            }, {
                prettyName: 'Reified',
                variable: true
            }]),
            new ConfigOptionSelect('isDirected', 'Directed', false, false, OptionChoices.NoFalseYesTrue),
            new ConfigOptionSelect('filterable', 'Filterable', false, false, OptionChoices.NoFalseYesTrue),
            // TODO THOR-949 Rename option and change to boolean.
            new ConfigOptionSelect('multiFilterOperator', 'Filter Operator', false, 'or', [{
                prettyName: 'OR',
                variable: 'or'
            }, {
                prettyName: 'AND',
                variable: 'and'
            }], this.optionsNotFilterable.bind(this)),
            new ConfigOptionSelect('displayLegend', 'Legend', false, false, OptionChoices.HideFalseShowTrue,
                this.optionsDoesNotHaveColorField.bind(this)),
            new ConfigOptionSelect('legendFiltering', 'Legend Filtering', false, true, OptionChoices.NoFalseYesTrue),
            new ConfigOptionSelect('physics', 'Physics', false, true, OptionChoices.NoFalseYesTrue),
            new ConfigOptionSelect('edgePhysics', 'Edge Physics', false, false, OptionChoices.NoFalseYesTrue),
            new ConfigOptionColor('edgeColor', 'Edge Color', false, NetworkGraphComponent.DEFAULT_EDGE_COLOR,
                this.optionsIsReified.bind(this)),
            new ConfigOptionNumber('edgeWidth', 'Edge Width', false, 1),
            new ConfigOptionColor('fontColor', 'Font Color', false, NetworkGraphComponent.DEFAULT_FONT_COLOR,
                this.optionsIsReified.bind(this)),
            new ConfigOptionColor('linkColor', 'Link Color', false, NetworkGraphComponent.DEFAULT_NODE_COLOR,
                this.optionsIsReified.bind(this)),
            new ConfigOptionColor('nodeColor', 'Node Color', false, NetworkGraphComponent.DEFAULT_NODE_COLOR,
                this.optionsIsReified.bind(this)),
            new ConfigOptionFreeText('nodeShape', 'Node Shape', false, 'box'),
            new ConfigOptionSelect('showRelationLinks', 'Show Relations as Links', false, false, OptionChoices.NoFalseYesTrue,
                this.optionsIsReified.bind(this)),
            new ConfigOptionFreeText('relationNodeIdentifier', 'Relation Node Identifier', false, ''),
            new ConfigOptionField('relationNameField', 'Relation Name Field', false, this.optionsIsReified.bind(this)),
            new ConfigOptionSelect('toggleFiltered', 'Toggle Filtered Items', false, false, OptionChoices.NoFalseYesTrue),
            new ConfigOptionSelect('applyPreviousFilter', 'Apply the previous filter on remove filter action',
                false, false, OptionChoices.NoFalseYesTrue)
        ];
    }

    /**
     * Creates and returns an array of options for layers of visualization.
     *
     * @return {ConfigOption[]}
     * @override
     */
    protected createOptionsForLayer(): ConfigOption[] {
        return [
            new ConfigOptionField('idField', 'Id Field', true, this.optionsIsReified.bind(this)),
            new ConfigOptionField('nameField', 'Name Field', true, this.optionsIsReified.bind(this)),
            new ConfigOptionField('colorField', 'Color Field', true, this.optionsIsReified.bind(this)),
            new ConfigOptionField('param1Field', 'Parameter 1 Field', true, this.optionsIsReified.bind(this)),
            new ConfigOptionField('param2Field', 'Parameter 2 Field', true, this.optionsIsReified.bind(this)),
            new ConfigOptionFieldArray('filterFields', 'Filter Fields', false),
            new ConfigOptionFreeText('layerType', 'Layer Type', true, '', false)
        ];
    }

    /**
     * Returns the design for each type of filter made by this visualization.  This visualization will automatically update itself with all
     * compatible filters that were set internally or externally whenever it runs a visualization query.
     *
     * @return {AbstractFilterDesign[]}
     * @override
     */
    protected designEachFilterWithNoValues(): AbstractFilterDesign[] {
        let filterFields: FieldConfig[] = [this.options.nodeField].concat(this.options.filterFields);
        if (this.options.layers.length) {
            this.options.layers.forEach((layer) => {
                if (layer.layerType === LayerType.Nodes) {
                    filterFields = [layer.nodeField].concat(layer.filterFields);
                }
            });
        }

        return filterFields.reduce((designs, filterField) => {
            if (filterField && filterField.columnName) {
                // Match a filter with one or more EQUALS filters on the specified filter field.
                designs.push(this.createFilterDesignOnList(filterField));
            }
            return designs;
        }, this.options.edgeColorField.columnName ? [this.createFilterDesignOnLegend()] : [] as AbstractFilterDesign[]);
    }

    /**
     * Returns the default limit for the visualization.
     *
     * @return {string}
     * @override
     */
    getVisualizationDefaultLimit(): number {
        return 500000;
    }

    /**
     * Returns the default title for the visualization.
     *
     * @return {string}
     * @override
     */
    getVisualizationDefaultTitle(): string {
        return 'Network Graph';
    }

    applyDimensions() {
        this.view = [this.width, this.height];
    }

    /**
     * Returns whether the widget does not have any color fields.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    optionsDoesNotHaveColorField(options: any): boolean {
        return !options.nodeColorField.columnName && !options.edgeColorField.columnName && !options.targetColorField.columnName;
    }

    /**
     * Returns whether the widget is not filterable.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    optionsNotFilterable(options: any): boolean {
        return !options.filterable;
    }

    /**
     * Returns whether the widget is reified.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     */
    optionsIsReified(options: any): boolean {
        return options.isReified;
    }

    toggleFitContainer(fitContainer: boolean, autoZoom: boolean): void {
        this.fitContainer = fitContainer;
        this.autoZoom = autoZoom;

        if (this.fitContainer) {
            this.view = undefined;
        } else {
            this.applyDimensions();
        }
    }

    /**
     * Creates any visualization elements when the widget is drawn.
     *
     * @override
     */
    constructVisualization() {
        // Note: options is REQUIRED. Fails to initialize physics properly without at least empty object
        let options: vis.Options = {
            layout: {
                randomSeed: 0
            },
            physics: {
                forceAtlas2Based: {
                    gravitationalConstant: -86,
                    centralGravity: 0.005,
                    springLength: 230,
                    springConstant: 0.18
                },
                maxVelocity: 146,
                solver: 'forceAtlas2Based',
                timestep: 1,
                stabilization: { iterations: 50 }
            },
            nodes: {
                physics: this.options.physics
            },
            edges: {
                smooth: {
                    type: 'dynamic'
                },
                physics: this.options.edgePhysics ? this.options.edgePhysics : this.options.physics
            },
            interaction: {
                hideEdgesOnDrag: true
            }
        };

        this.graph = new vis.Network(this.graphElement.nativeElement, this.graphData, options);
        if (this.options.filterable) {
            this.graph.on('doubleClick', this.onSelect.bind(this));
        }
        this.graph.on('dragEnd', this.onDrag.bind(this));
        this.graph.once('afterDrawing', this.afterDrawing.bind(this));
    }

    private restartPhysics(): void {
        // Turn off physics when stabilized
        this.graph.on('stabilized', () => {
            this.graph.setOptions({ physics: { enabled: false } });
            this.graph.off('stabilized');
        });

        // To avoid edge overlap the physics must always be on for edges.
        this.graph.setOptions({ physics: { enabled: this.options.edgePhysics ? this.options.edgePhysics : this.options.physics } });
    }

    setInterpolationType(curveType) {
        this.curveType = curveType;
        if (curveType === 'Bundle') {
            this.curve = d3shape.curveBundle.beta(1);
        }
        if (curveType === 'Cardinal') {
            this.curve = d3shape.curveCardinal;
        }
        if (curveType === 'Catmull Rom') {
            this.curve = d3shape.curveCatmullRom;
        }
        if (curveType === 'Linear') {
            this.curve = d3shape.curveLinear;
        }
        if (curveType === 'Monotone X') {
            this.curve = d3shape.curveMonotoneX;
        }
        if (curveType === 'Monotone Y') {
            this.curve = d3shape.curveMonotoneY;
        }
        if (curveType === 'Natural') {
            this.curve = d3shape.curveNatural;
        }
        if (curveType === 'Step') {
            this.curve = d3shape.curveStep;
        }
        if (curveType === 'Step After') {
            this.curve = d3shape.curveStepAfter;
        }
        if (curveType === 'Step Before') {
            this.curve = d3shape.curveStepBefore;
        }
    }

    /**
     * Redraws this visualization with the given compatible filters.
     *
     * @override
     */
    protected redrawFilters(filters: FilterCollection): void {
        let legendFilters: ListFilter[] = filters.getCompatibleFilters(this.createFilterDesignOnLegend()) as ListFilter[];
        this._filteredLegendValues = CoreUtil.retrieveValuesFromListFilters(legendFilters);
        // TODO AIDA-751 Update the selected checkboxes in the legend using the filtered legend values.

        this.options.filterFields.filter((field) => !!field.columnName).forEach((field) => {
            const listFilters: ListFilter[] = filters.getCompatibleFilters(this.createFilterDesignOnList(field)) as ListFilter[];
            this._filterFieldsToFilteredValues.set(field.columnName, CoreUtil.retrieveValuesFromListFilters(listFilters));
        });
        // TODO AIDA-752 Update the selected nodes in the network graph element using the filtered node values.
    }

    refreshVisualization() {
        //
    }

    getGraphData() {
        return this.graphData;
    }

    /**
     * Returns whether the visualization query created using the given options is valid.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @return {boolean}
     * @override
     */
    validateVisualizationQuery(options: any): boolean {
        return !!(options.database.name && options.table.name) &&
            (options.nodeField && options.nodeField.columnName && options.linkField && options.linkField.columnName ||
                this.isValidLayerOption(options));
    }

    private isValidLayerOption(options: any): boolean {
        // Return whether all specified properties are NOT undefined
        let allPropertiesValid = (array: any[]) => !array.some((property) => options[property] === undefined);

        // Always test nameField
        let required = ['nameField'];
        switch (options.layerType) {
            case LayerType.Clusters:
            case LayerType.Nodes:
                required.push('idField');
                return allPropertiesValid(required);
            case LayerType.Edges:
            case LayerType.ClusterMemberships:
                required.push('param1Field', 'param2Field');
                return allPropertiesValid(required);
            default:
                return false;
        }
    }

    /**
     * Finalizes the given visualization query by adding the aggregations, filters, groups, and sort using the given options.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {QueryPayload} queryPayload
     * @arg {FilterClause[]} sharedFilters
     * @return {QueryPayload}
     * @override
     */
    finalizeVisualizationQuery(options: any, query: QueryPayload, sharedFilters: FilterClause[]): QueryPayload {
        let names: string[];
        let sortFieldName: string;
        let sortOrder: SortOrder = SortOrder.DESCENDING;

        switch (options.layerType) {
            case LayerType.Clusters:
            case LayerType.Nodes:
                names = [options.nameField.columnName, options.idField.columnName];
                sortFieldName = options.idField.columnName;
                break;
            case LayerType.Edges:
            case LayerType.ClusterMemberships:
                names = [options.nameField.columnName, options.param1Field.columnName, options.param2Field.columnName];
                sortFieldName = options.param1Field.columnName;
                break;
            default:
                names = [options.nodeField.columnName, options.linkField.columnName];
                sortFieldName = (options.nodeColorField.columnName || options.edgeColorField.columnName ||
                    options.nodeField.columnName);
                sortOrder = SortOrder.ASCENDING;
        }

        let filter: FilterClause = this.searchService.buildCompoundFilterClause(names.map((name) =>
            this.searchService.buildFilterClause(name, '!=', null)), CompoundFilterType.OR);

        this.searchService.updateFilter(query, this.searchService.buildCompoundFilterClause(sharedFilters.concat(filter)))
            .updateSort(query, sortFieldName, sortOrder);

        return query;
    }

    public beforeExecuteAllQueryChain(): void {
        this.responseData = [];
    }

    /**
     * Converts multi-dimensional arrays into a one-dimentional array
     *
     * @arg {any} array
     * @arg {string} value
     * @return {boolean}
     */
    flattenArray(array: string[], value: string) {
        return array.concat(value);
    }

    /**
     *  Whether label is an array, a string with commas, or a string with dot notation; the first value is taken
     *
     * @arg {any} label
     * @return {string}
     */
    labelAbbreviation(label: any) {
        let cleanLabel = label instanceof Array ? label[0] : label;
        cleanLabel = cleanLabel.indexOf('.') > -1 ? cleanLabel.split('.')[0] : cleanLabel;
        cleanLabel = cleanLabel.indexOf(',') > -1 ? cleanLabel.split(',')[0] : cleanLabel;
        return cleanLabel;
    }

    /**
     *  Edge labels will be shown as multi-line
     *
     * @arg {any} label
     * @return {string}
     */
    edgeLabelFormat(label: any) {
        let cleanLabel = label instanceof Array ? label[0] : label;
        cleanLabel = cleanLabel.indexOf('.') > -1 ? cleanLabel.split('.').join('\n') : cleanLabel;
        cleanLabel = cleanLabel.indexOf('_') > -1 ? cleanLabel.split('_').join('\n') : cleanLabel;

        // Break the text at every 3rd spave and start a newline for the purpose of wrapping lengthy label text
        if (cleanLabel.indexOf(' ') > -1 && cleanLabel.indexOf('\n') === -1) {
            let splitSpace = cleanLabel.split(' ');
            let lastIndex = 0;

            for (let index = 1; index < splitSpace.length && lastIndex < splitSpace.length; index++) {
                if (Math.floor(index % 3) === 0) {
                    splitSpace.splice(index + lastIndex, 0, '\n');
                    lastIndex++;
                }
            }

            cleanLabel = splitSpace.join(' ');
        }

        return cleanLabel;
    }

    /**
     * Transforms the given array of query results using the given options into an array of objects to be shown in the visualization.
     * Returns the count of elements shown in the visualization.
     *
     * @arg {any} options A WidgetOptionCollection object.
     * @arg {any[]} results
     * @arg {FilterCollection} filters
     * @return {number}
     * @override
     */
    transformVisualizationQueryResults(options: any, results: any[], filters: FilterCollection): number {
        this.disabledSet = [];

        if (this.options.layers.length) {
            // TODO: clean up node labels for layers
            this.responseData.push({ options: options, results: results });
        } else {
            this.responseData = results;

            // TODO AIDA-752 Use the given filters to show the selected (filtered) nodes.

            this.responseData.forEach((result) => {
                for (let field of options.fields) {
                    if ([options.nodeColorField.columnName, options.targetColorField.columnName].includes(field.columnName) &&
                        options.cleanLegendLabels && options.displayLegend) {
                        let types = CoreUtil.deepFind(result, field.columnName);
                        if (types instanceof Array) {
                            for (let value of types) {
                                this.prettifiedNodeLegendLabels.push(this.labelAbbreviation(value));
                            }
                        } else {
                            this.prettifiedNodeLegendLabels.push(types);
                        }
                    }
                    if (field.columnName === options.edgeColorField.columnName && options.cleanLegendLabels &&
                        options.displayLegend) {
                        let types = CoreUtil.deepFind(result, options.edgeColorField.columnName);
                        if (types instanceof Array) {
                            for (let value of types) {
                                this.prettifiedEdgeLegendLabels.push(this.labelAbbreviation(value));
                            }
                        } else {
                            this.prettifiedEdgeLegendLabels.push(types);
                        }
                    }
                }
            });

            // Flattens multi-level arrays, removes duplicates, and sorts alphabetically
            this.prettifiedNodeLegendLabels = this.prettifiedNodeLegendLabels.reduce(this.flattenArray.bind(this), [])
                .filter((value, index, array) => array.indexOf(value) === index).sort();
            this.prettifiedEdgeLegendLabels = this.prettifiedEdgeLegendLabels.reduce(this.flattenArray.bind(this), [])
                .filter((value, index, array) => array.indexOf(value) === index).sort();
        }

        this.existingNodeNames = [];
        this.relationNodes = [];
        this.displayGraph = (this.options.hideUnfiltered && !!filters.getFilters().length) || !this.options.hideUnfiltered;

        this.resetGraphData();

        // Redraw the latest filters in the visualization element.
        this.redrawFilters(filters);

        this.updateLegend();

        return this.graphData.nodes.getIds().length;
    }

    private resetGraphData() {
        this.loadingCount++;

        let graphProperties = this.options.isReified ? this.createReifiedGraphProperties() :
            this.options.layers.length ? this.createMultiTableGraphProperties() : this.options.showRelationLinks ?
                this.createRelationsAsLinksGraphProperties() : this.createTabularGraphProperties();

        if (graphProperties) {
            this.totalNodes = graphProperties.nodes.filter((node, index, array) =>
                array.findIndex((nodeObject) => nodeObject.id === node.id) === index).length;

            this.graphData.clear();
            if (this.displayGraph) {
                this.restartPhysics();
                this.graphData.update(graphProperties);
            }
        }

        this.loadingCount--;
    }

    updateData() {
        // Do nothing ?
    }

    select(__data) {
        // Do nothing ?
    }

    onLegendLabelClick(__entry) {
        // Do nothing ?
    }

    toggleExpand(__node) {
        // Do nothing ?
    }

    /**
     * Creates and returns the text for the settings button.
     *
     * @return {string}
     * @override
     */
    public getButtonText(): string {
        let totalDataCount = this.totalNodes;
        let elementLabel = this.getVisualizationElementLabel(totalDataCount);

        if (this.options.isReified) {
            return CoreUtil.prettifyInteger(totalDataCount) + (this.displayGraph ? '' : ' Hidden') +
                (elementLabel ? (' ' + elementLabel) : '');
        }

        return super.getButtonText();
    }

    /**
     * Returns the label for the data items that are currently shown in this visualization (Bars, Lines, Nodes, Points, Rows, Terms, ...).
     * Uses the given count to determine plurality.
     *
     * @arg {number} count
     * @return {string}
     * @override
     */
    public getVisualizationElementLabel(count: number): string {
        return 'Node' + (count === 1 ? '' : 's');
    }

    resetData() {
        this.graphData = new GraphData();
    }

    getArray(type: any) {
        return (type instanceof Array) ? type : [type];
    }

    private createReifiedGraphProperties() {
        let graph = new GraphProperties();
        let limit = this.options.limit;
        let nodeColor = this.options.nodeColor;
        let nodeTextObject = {
            size: NetworkGraphComponent.NODE_FONT_SIZE,
            face: NetworkGraphComponent.FONT,
            color: this.options.fontColor
        };
        let nodeShape = this.options.nodeShape;

        for (const entry of this.responseData) {
            if (graph.nodes.length <= limit) {
                let subject = this.getArray(entry.subject);
                let predicate = entry.predicate;
                let object = this.getArray(entry.object);

                for (let sNode of subject) {
                    for (let oNode of object) {
                        this.addTriple(graph, sNode, predicate, oNode, nodeColor, nodeTextObject, nodeShape);
                    }
                }
            }

            // TODO: add hover with other properties
        }
        return graph;
    }

    private addTriple(graph: GraphProperties, subject: string, predicate: string, object: string, nodeColor?: string,
        nodeTextObject?: any, nodeShape?: string) {
        let edgeTextObject = {
            size: NetworkGraphComponent.EDGE_FONT_SIZE,
            face: NetworkGraphComponent.FONT
        };

        graph.addNode(new Node(subject, subject, '', null, nodeColor, false, nodeTextObject, nodeShape));
        graph.addNode(new Node(object, object, '', null, nodeColor, false, nodeTextObject, nodeShape));
        graph.addEdge(new Edge(subject, object, predicate, { to: this.options.isDirected }, null, null, null, edgeTextObject));
    }

    private addEdgesFromField(graph: GraphProperties, linkField: string | string[], source: string,
        colorValue?: string, edgeColorField?: string) {
        let edgeColor = { color: colorValue, highlight: colorValue };
        let edgeTextObject = {
            size: NetworkGraphComponent.EDGE_FONT_SIZE,
            face: NetworkGraphComponent.FONT
        };

        // TODO: edgeWidth being passed into Edge class is currently breaking directed arrows, removing for now
        // let edgeWidth = this.options.edgeWidth;
        if (Array.isArray(linkField)) {
            for (const linkEntry of linkField) {
                graph.addEdge(new Edge(source, linkEntry, '', null, 1, edgeColor, edgeColorField, edgeTextObject));
            }
        } else if (linkField) {
            graph.addEdge(new Edge(source, linkField, '', null, 1, edgeColor, edgeColorField, edgeTextObject));
        }
    }

    // TODO Reduce complexity of getAllNodes
    /* eslint-disable-next-line complexity */
    private getAllNodes(data: any[], idField: string, nameField: string, colorField: string, originalColor: string,
        xPositionField: string, yPositionField: string, filterFields: FieldConfig[], relationNodeIdentifier?: string,
        showToolTip?: boolean) {
        let ret: Node[] = [];
        let relationNodes: any[] = [];
        let color = originalColor;

        let nodeChosenObject = {
            label: (values) => {
                values.color = NetworkGraphComponent.DEFAULT_FONT_COLOR;
                values.mod = 'bold';
                values.strokeWidth = 0;
                values.size = 20;
            },
            node: (values) => {
                values.shadowSize = 6;
                values.shadowColor = '#464949';
                values.inheritsColor = true;
                values.length = 5;
                values.width = 5;
            }
        };

        for (let entry of data) {
            let colorMapVal = entry[colorField];
            let id = entry[idField];
            let updatedPosition = this.updatedNodePositions.findIndex((node) => node.id === id);
            let name = nameField && entry[nameField];
            let xPosition = updatedPosition > -1 ? this.updatedNodePositions[updatedPosition].x : entry[xPositionField];
            let yPosition = updatedPosition > -1 ? this.updatedNodePositions[updatedPosition].y : entry[yPositionField];
            let filterFieldData: any[] = [];

            // Create a tabular network graph
            if (!relationNodeIdentifier || colorMapVal.indexOf(relationNodeIdentifier) < 0) {
                filterFields.forEach((filterField) => {
                    filterFieldData.push({
                        field: filterField,
                        data: entry[filterField.columnName]
                    });
                });

                // If there is a valid nodeColorField and no modifications to the legend labels, override the default nodeColor
                if (colorField && this.prettifiedNodeLegendLabels.length === 0) {
                    color = this.colorThemeService.getColor(this.options.database.name, this.options.table.name, colorField,
                        colorMapVal).getComputedCss(this.visualization.nativeElement);
                }

                // Set node name with or without type description
                let nodes = this.getArray(id);
                let nodeNames: any[] = [];
                let typeExtension: string = this.options.typeField.columnName && relationNodeIdentifier &&
                name.toLowerCase() !== this.getArray(entry[this.options.typeField.columnName])[0].toLowerCase() ?
                    '\n : ' + this.getArray(entry[this.options.typeField.columnName])[0].toLowerCase() + '' : '';

                if (name) {
                    for (const title of this.getArray(name)) {
                        nodeNames.push(title + typeExtension);
                    }
                } else {
                    for (const node of nodes) {
                        nodeNames.push(node + typeExtension);
                    }
                }

                // Create a new node for each unique nodeId
                for (let index = 0; index < nodes.length && ret.length < this.options.limit; index++) {
                    let nodeEntry = nodes[index];
                    if (this.isUniqueNode(nodeEntry)) {
                        // If legend labels have been modified, override the node color
                        if (this.prettifiedNodeLegendLabels.length > 0 && this.options.displayLegend && colorMapVal && colorMapVal !== '') {
                            let shortName = this.labelAbbreviation(colorMapVal);
                            for (const nodeLabel of this.prettifiedNodeLegendLabels) {
                                if (nodeLabel === shortName) {
                                    color = this.colorThemeService.getColor(this.options.database.name, this.options.table.name, colorField,
                                        nodeLabel).getComputedCss(this.visualization.nativeElement);
                                    break;
                                }
                            }
                        }

                        if (showToolTip) {
                            ret.push(new Node(nodeEntry, nodeNames[index], colorMapVal, 1, color, false, { color: this.options.fontColor },
                                this.options.nodeShape, xPosition, yPosition, filterFieldData, nodeChosenObject, nodeNames[index]));
                        } else {
                            ret.push(new Node(nodeEntry, nodeNames[index], colorMapVal, 1, color, false, { color: this.options.fontColor },
                                this.options.nodeShape, xPosition, yPosition, filterFieldData, nodeChosenObject));
                        }
                    }
                }
            } else {
                // Collect the relation nodes that need to be added as links
                let relationIndex = relationNodes.findIndex((object) => object[idField] === id);

                if (relationIndex > -1) {
                    relationNodes[relationIndex].nodes.push({ id: entry[this.options.linkField.columnName],
                        name: entry[this.options.linkNameField.columnName] });
                } else {
                    entry.nodes = [{ id: entry[this.options.linkField.columnName],
                        name: entry[this.options.linkNameField.columnName] }];
                    relationNodes.push(entry);
                }
            }
        }

        if (relationNodeIdentifier && relationNodes.length > 0) {
            this.relationNodes = relationNodes;
        }

        return ret;
    }

    // Create edges between source and destinations specified by destinationField
    private getEdgesFromOneEntry(names: string[], colorField: string, originalColorMapVal: string, originalColor: string, source: string,
        destinations: string[], showToolTip?: boolean) {
        let ret: Edge[] = [];
        let colorMapVal = originalColorMapVal;
        let color = originalColor;
        let edgeTextObject = {
            size: NetworkGraphComponent.EDGE_FONT_SIZE,
            face: NetworkGraphComponent.FONT,
            color: '#64666b'
        };

        let edgeChosenObject = {
            label: (values) => {
                values.color = NetworkGraphComponent.DEFAULT_FONT_COLOR;
                values.mod = 'bold';
                values.strokeWidth = 2;
            },
            edge: (values) => {
                values.shadow = true;
                values.shadowSize = 6;
                values.shadowColor = '#9ba2a2';
                values.width = 4;
            }
        };

        // If there is a valid colorField and no modifications to the legend labels, override the default colorString
        if (colorField && this.prettifiedEdgeLegendLabels.length === 0) {
            color = this.colorThemeService.getColor(this.options.database.name, this.options.table.name, colorField,
                colorMapVal).getComputedCss(this.visualization.nativeElement);
        }

        let colorObject = { color: color, highlight: color };
        // TODO: edgeWidth being passed into Edge class is currently breaking directed arrows, removing for now
        // let edgeWidth = this.options.edgeWidth;

        for (let index = 0; index < destinations.length; index++) {
            // If legend labels have been modified, override the edgeColor and edgeColorObject
            if (this.prettifiedEdgeLegendLabels.length > 0 && this.options.displayLegend && names[index] && names[index] !== '') {
                let shortName = this.labelAbbreviation(names[index]);
                for (const edgeLabel of this.prettifiedEdgeLegendLabels) {
                    if (edgeLabel === shortName) {
                        colorMapVal = edgeLabel;
                        color = this.colorThemeService.getColor(this.options.database.name, this.options.table.name,
                            colorField, edgeLabel).getComputedCss(this.visualization.nativeElement);
                        colorObject = { color: color, highlight: color };
                        break;
                    }
                }
            }
            if (source && destinations[index]) {
                if (showToolTip) {
                    ret.push(new Edge(source, destinations[index], this.edgeLabelFormat(names[index]), { to: this.options.isDirected }, 1,
                        colorObject, colorMapVal, edgeTextObject, edgeChosenObject, this.edgeLabelFormat(names[index])));
                } else {
                    ret.push(new Edge(source, destinations[index], this.edgeLabelFormat(names[index]), { to: this.options.isDirected }, 1,
                        colorObject, colorMapVal, edgeTextObject, edgeChosenObject));
                }
            }
        }
        return ret;
    }

    private createMultiTableGraphProperties() {
        let types = this.responseData.map((data) => data.options.layerType);
        if (types.includes(LayerType.Nodes) && types.includes(LayerType.Edges)) {
            let graphProperties = new GraphProperties();
            for (let data of this.responseData) {
                let options = data.options;
                switch (options.layerType) {
                    case LayerType.Nodes:
                        graphProperties.nodes = graphProperties.nodes.concat(this.getAllNodes(
                            data.results,
                            options.idField.columnName,
                            options.nameField.columnName,
                            options.colorField.columnName,
                            '',
                            options.param1Field.columnName,
                            options.param2Field.columnName,
                            options.filterFields
                        ));
                        break;
                    case LayerType.Edges:
                        // TODO Fix the case declarations
                        /* eslint-disable no-case-declarations */
                        let nameField = options.nameField.columnName;
                        let colorField = options.colorField.columnName;
                        for (let entry of data.results) {
                            let destinations = this.getArray(entry[options.param2Field.columnName]);
                            let names = !nameField ? [].fill('', 0, destinations.length) : this.getArray(entry[nameField]);
                            let edges = this.getEdgesFromOneEntry(names, colorField, entry[colorField], '',
                                entry[options.param1Field.columnName], destinations);
                            graphProperties.edges = graphProperties.edges.concat(edges);
                        }
                        /* eslint-enable no-case-declarations */
                        break;
                    case LayerType.ClusterMemberships:
                        break;
                    case LayerType.Clusters:
                        break;
                    default:
                }
            }
            return graphProperties;
        }
        return null;
    }

    private createTabularGraphProperties() {
        let graph = new GraphProperties();
        let linkName = this.options.linkField.columnName;
        let linkNameColumn = this.options.linkNameField.columnName;
        let nodeName = this.options.nodeField.columnName;
        let nodeNameColumn = this.options.nodeNameField.columnName;
        let nodeColorField = this.options.nodeColorField.columnName;
        let edgeColorField = this.options.edgeColorField.columnName;
        let nodeColor = this.options.nodeColor;
        let edgeColor = this.options.edgeColor;
        let xPositionField = this.options.xPositionField.columnName;
        let yPositionField = this.options.yPositionField.columnName;

        // Assume nodes will take precedence over edges so create nodes first
        graph.nodes = this.getAllNodes(this.responseData, nodeName, nodeNameColumn, nodeColorField, nodeColor, xPositionField,
            yPositionField, this.options.filterFields, null, true);

        // Create edges and destination nodes only if required
        for (let entry of this.responseData) {
            let linkField = entry[linkName];
            let edgeType = entry[edgeColorField];
            let linkNameField = entry[linkNameColumn];
            let nodeField = entry[nodeName];

            // Create a node if linkfield doesn't point to a node that already exists
            let links = this.getArray(linkField);

            // Create edges between nodes and destinations specified by linkfield
            let linkNames = !linkNameField ? [].fill('', 0, links.length) : this.getArray(linkNameField);
            let nodes = this.getArray(nodeField);

            if (nodes) {
                for (const nodeEntry of nodes) {
                    graph.edges = graph.edges.concat(this.getEdgesFromOneEntry(linkNames, edgeColorField, edgeType, edgeColor, nodeEntry,
                        links));
                }
            }
        }
        return graph;
    }

    private createRelationsAsLinksGraphProperties() {
        let graph = new GraphProperties();
        let linkName = this.options.linkField.columnName;
        let linkNameColumn = this.options.linkNameField.columnName;
        let nodeName = this.options.nodeField.columnName;
        let nodeNameColumn = this.options.nodeNameField.columnName;
        let relationNameColumn = this.options.relationNameField.columnName ? this.options.relationNameField.columnName : nodeNameColumn;
        let nodeColorField = this.options.nodeColorField.columnName;
        let edgeColorField = this.options.edgeColorField.columnName;
        let nodeColor = this.options.nodeColor;
        let edgeColor = this.options.edgeColor;
        let linkColor = this.options.linkColor;
        let xPositionField = this.options.xPositionField.columnName;
        let yPositionField = this.options.yPositionField.columnName;

        if (this.options.relationNodeIdentifier && this.options.relationNodeIdentifier !== '') {
            // Assume nodes will take precedence over edges so create nodes first
            graph.nodes = this.getAllNodes(this.responseData, nodeName, nodeNameColumn, nodeColorField, nodeColor, xPositionField,
                yPositionField, this.options.filterFields, this.options.relationNodeIdentifier, true);

            // Create edges and destination nodes only if required
            for (let entry of this.responseData) {
                let entryLink = entry[linkName];
                let entryEdgeColor = entry[edgeColorField];
                let entryLinkName = entry[linkNameColumn];
                let entryNodeName = entry[nodeName];
                let entryNodeColor = entry[nodeColorField];

                if (entryNodeColor !== this.options.relationNodeIdentifier) {
                    // Create a node if linkfield doesn't point to a node that already exists
                    let links = this.getArray(entryLink);

                    // Create edges between nodes and destinations specified by linkfield
                    let linkNames = !entryLinkName ? [].fill('', 0, links.length) : this.getArray(entryLinkName);
                    let nodes = this.getArray(entryNodeName);

                    if (nodes) {
                        for (const nodeEntry of nodes) {
                            graph.edges = graph.edges.concat(this.getEdgesFromOneEntry(linkNames, edgeColorField, entryEdgeColor,
                                edgeColor, nodeEntry, links, true));
                        }
                    }
                }
            }

            // Convert relation nodes to edges. Ensure that the relation link object has two nodes before adding it to the network graph
            for (let relationNode of this.relationNodes) {
                let linkNames = this.edgeLabelFormat(relationNode[relationNameColumn]);
                if (relationNode.nodes.length === 2) {
                    graph.edges = graph.edges.concat(this.getEdgesFromOneEntry(this.getArray(linkNames), edgeColorField,
                        relationNode[edgeColorField], linkColor, relationNode.nodes[0].id, this.getArray(relationNode.nodes[1].id), true));
                }
            }
        }
        return graph;
    }

    /**
     * Check if the nodeId exists already and adds it if it's unique
     * @param nodeId
     */
    isUniqueNode(nodeId) {
        if (this.options.isReified) {
            return !this.graphData.nodes || !this.graphData.nodes.get(nodeId);
        }
        if (this.indexOfNodeName(nodeId) !== -1) {
            return false;
        }
        this.insertNodeName(nodeId);
        return true;
    }

    /**
     * Returns the index of the nodeName or -1 if it doesnt exist (binary search)
     * @param searchElement nodoName to look for in the array
     */
    indexOfNodeName(searchElement) {
        let minIndex = 0;
        let maxIndex = this.existingNodeNames.length - 1;
        let currentIndex;
        let currentElement;

        if (maxIndex === 0 || searchElement < this.existingNodeNames[minIndex] || searchElement > this.existingNodeNames[maxIndex]) {
            return -1;
        }

        while (minIndex <= maxIndex) {
            currentIndex = Math.floor((minIndex + maxIndex) / 2);
            currentElement = this.existingNodeNames[currentIndex];

            if (currentElement < searchElement) {
                minIndex = currentIndex + 1;
            } else if (currentElement > searchElement) {
                maxIndex = currentIndex - 1;
            } else {
                return currentIndex;
            }
        }
        return -1;
    }

    /**
     * Inserts a unique nodeName into the existingNodeNames array in order
     * @param element
     */
    insertNodeName(element) {
        let arraySize = this.existingNodeNames.length - 1;
        let list = this.existingNodeNames;

        let index: number;
        for (index = arraySize; index >= 0 && list[index] > element; index--) {
            list[index + 1] = list[index];
        }
        list[index + 1] = element;
    }

    /**
     * Inserts a unique nodeName into the existingNodeNames array in order
     * @param element
     */
    handleChangeDirected() {
        let arrowUpdates: ArrowUpdate[] = this.graphData.edges.map(
            (edge: ArrowUpdate) => ({ id: edge.id, arrows: { to: this.options.isDirected } }),
            { fields: ['id', 'arrows'] }
        );
        this.graphData.edges.update(arrowUpdates);
    }

    handleChangeReified() {
        this.resetGraphData();
    }

    /**
     * Returns an object containing the ElementRef objects for the visualization.
     *
     * @return {any} Object containing:  {ElementRef} headerText, {ElementRef} infoText, {ElementRef} visualization
     * @override
     */
    getElementRefs() {
        return {
            visualization: this.visualization,
            headerText: this.headerText,
            infoText: this.infoText
        };
    }

    legendIsNeeded() {
        let nodeColorField = this.options.nodeColorField.columnName;
        let edgeColorField = this.options.edgeColorField.columnName;
        return (this.displayGraph && this.options.displayLegend &&
            ((nodeColorField && nodeColorField !== '') || (edgeColorField && edgeColorField !== ''))
        );
    }

    /**
     * Updates the network graph legend.
     */
    updateLegend() {
        let colorKeys: string[] = [];
        if (this.options.nodeColorField.columnName !== '') {
            colorKeys.push(this.colorThemeService.getColorKey(this.options.database.name, this.options.table.name,
                this.options.nodeColorField.columnName));
        } else if (this.options.edgeColorField.columnName !== '') {
            colorKeys.push(this.colorThemeService.getColorKey(this.options.database.name, this.options.table.name,
                this.options.edgeColorField.columnName));
        }
        this.colorKeys = colorKeys;
    }

    /**
     * Filters data based on the clicked legend option
     * @param event
     */
    legendItemSelected(event: any) {
        if (event.value && this.options.edgeColorField.columnName) {
            if (event.currentlyActive) {
                this.disabledSet.push([this.options.edgeColorField.columnName, event.value]);
            } else {
                this.disabledSet = this.disabledSet.filter((disabledSet) => !(disabledSet[0] === this.options.edgeColorField.columnName &&
                    disabledSet[1] === event.value));
            }

            this._filteredLegendValues = CoreUtil.changeOrToggleValues(event.value, this._filteredLegendValues, true);
            if (this._filteredLegendValues.length) {
                this.exchangeFilters([this.createFilterDesignOnLegend(this._filteredLegendValues)]);
            } else {
                // If we won't set any filters, create a FilterDesign without a value to delete all the old filters on the color field.
                this.exchangeFilters([], [this.createFilterDesignOnLegend()]);
            }
        }
    }

    /**
     * Filters the data using the name of the selected node
     * @param properties
     */
    onSelect(properties: { nodes: string[] }) {
        if (properties.nodes.length !== 1) {
            return;
        }

        let selectedNode = this.graphData.nodes.get(properties.nodes[0]) as Node;

        let filters: AbstractFilterDesign[] = [];
        let filtersToDelete: AbstractFilterDesign[] = [];

        selectedNode.filterFields.filter((nodeFilterField) => !!nodeFilterField.field.columnName).forEach((nodeFilterField) => {
            // Get all the values for the filter field from the data item.
            const values: any[] = Array.isArray(nodeFilterField.data) ? nodeFilterField.data : [nodeFilterField.data];

            // Change or toggle the filtered values for the filter field.
            const filteredValues: any[] = CoreUtil.changeOrToggleMultipleValues(values,
                this._filterFieldsToFilteredValues.get(nodeFilterField.field.columnName) || [], this.options.toggleFiltered);

            this._filterFieldsToFilteredValues.set(nodeFilterField.field.columnName, filteredValues);

            if (filteredValues.length) {
                // Create a single filter on the filtered values.
                filters.push(this.createFilterDesignOnList(nodeFilterField.field, filteredValues));
            } else {
                // If we won't add any filters, create a FilterDesign without a value to delete all the old filters on the filter field.
                filtersToDelete.push(this.createFilterDesignOnList(nodeFilterField.field));
            }
        });

        this.exchangeFilters(filters, filtersToDelete, true);
    }

    onDrag(properties: { nodes: string[] }) {
        for (let nodeId of properties.nodes) {
            let xPosition = this.graph.getPositions([nodeId])[nodeId].x;
            let yPosition = this.graph.getPositions([nodeId])[nodeId].y;

            let indexToUpdate = this.updatedNodePositions.findIndex((node) => node.id === nodeId);
            if (indexToUpdate > -1) {
                this.updatedNodePositions[indexToUpdate].x = xPosition;
                this.updatedNodePositions[indexToUpdate].y = yPosition;
            } else {
                this.updatedNodePositions.push({ id: nodeId, x: xPosition, y: yPosition });
            }
        }
    }

    afterDrawing() {
        this.graph.moveTo({
            scale: 0.03
        });
    }

    /*
    * Used when changing colors and other optional non-field values in the guere settings
    */
    reloadGraph() {
        this.totalNodes = 0;
        this.existingNodeNames = [];
        this.resetGraphData();
        this.updateLegend();
    }

    resetColors() {
        this.options.linkColor = this.options.access('linkColor').valueDefault;
        this.options.nodeColor = this.options.access('nodeColor').valueDefault;
        this.options.edgeColor = this.options.access('edgeColor').valueDefault;
        this.options.fontColor = this.options.access('fontColor').valueDefault;
        this.reloadGraph();
    }
}
