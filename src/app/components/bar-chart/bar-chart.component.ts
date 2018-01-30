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
import {
    Component,
    OnInit,
    OnDestroy,
    ViewEncapsulation,
    ChangeDetectionStrategy,
    Injector, ViewChild,
    ChangeDetectorRef
} from '@angular/core';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';
import { ExportService } from '../../services/export.service';
import { ThemesService } from '../../services/themes.service';
import { FieldMetaData } from '../../dataset';
import { neonMappings, neonVariables } from '../../neon-namespaces';
import * as neon from 'neon-framework';
import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { ChartComponent } from 'angular2-chartjs';
import { Chart } from 'chart.js';
import { VisualizationService } from '../../services/visualization.service';
import { Color, ColorSchemeService } from '../../services/color-scheme.service';

/**
 * Data used to draw the bar chart
 */
class BarData {
    // The X-Axis labels
    labels: string[] = [];
    // The data to graph
    datasets: BarDataSet[] = [];
}

/**
 * One set of bars to draw
 */
class BarDataSet {
    // The name of the data set
    label: string;
    // The data
    data: number[] = [];
    // The colors of the bars.
    backgroundColor: string[] = [];
    // The color of the data set
    color: Color;

    constructor(length?: number, color?: Color) {
        if (length) {
            for (let i = 0; i < length; i++) {
                this.data[i] = 0;
            }
        }
        this.color = color;
    }

    /**
     * Set all the background colors to the default color of this set
     */
    setAllActive() {
        for (let i = 0; i < this.data.length; i++) {
            this.backgroundColor[i] = this.color.toRgb();
        }
    }

    /**
     * Set all the background colors to the default color of this set
     */
    setAllInactive() {
        for (let i = 0; i < this.data.length; i++) {
            this.backgroundColor[i] = this.color.getInactiveRgba();
        }
    }

    /**
     * Set the background color of a single bar to the active color
     * @param {number} position
     */
    setActiveColor(position: number) {
        this.backgroundColor[position] = this.color.toRgb();
    }
    /**
     * set the background color of a single bar to the inactive color
     * @param {number} position
     */
    setInactiveColor(position: number) {
        this.backgroundColor[position] = this.color.getInactiveRgba();
    }
}

@Component({
    selector: 'app-bar-chart',
    templateUrl: './bar-chart.component.html',
    styleUrls: ['./bar-chart.component.scss'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BarChartComponent extends BaseNeonComponent implements OnInit,
    OnDestroy {
    @ViewChild('myChart') chartModule: ChartComponent;

    private filters: {
        id: string,
        key: string,
        value: string,
        prettyKey: string
    }[];

    private optionsFromConfig: {
        title: string,
        database: string,
        table: string,
        dataField: string,
        aggregation: string,
        aggregationField: string,
        unsharedFilterField: any,
        unsharedFilterValue: string,
        colorField: string,
        limit: number,
        chartType: string // bar or horizontalBar
    };
    public active: {
        dataField: FieldMetaData,
        aggregationField: FieldMetaData,
        aggregationFieldHidden: boolean,
        andFilters: boolean,
        limit: number,
        filterable: boolean,
        layers: any[],
        data: any[],
        aggregation: string,
        chartType: string,
        maxNum: number,
        minScale: string,
        maxScale: string,
        scaleManually: boolean,
        seenValues: string[]
    };

    //this is what gets loaded into the Chart object; it should always(?) be identical to chartModule.chart.config
    public chartInfo: {
        data: {
            labels: string[],
            datasets: BarDataSet[]
        },
        type: string,
        options: any
    };

    // Used to change the colors between active/inactive in the legend
    public selectedLabels: string[] = [];
    public colorFieldNames: string[] = [];
    private defaultActiveColor;

    constructor(connectionService: ConnectionService, datasetService: DatasetService, filterService: FilterService,
        exportService: ExportService, injector: Injector, themesService: ThemesService, ref: ChangeDetectorRef,
        visualizationService: VisualizationService, private colorSchemeService: ColorSchemeService) {
        super(connectionService, datasetService, filterService, exportService, injector, themesService, ref, visualizationService);

        this.optionsFromConfig = {
            title: this.injector.get('title', null),
            database: this.injector.get('database', null),
            table: this.injector.get('table', null),
            dataField: this.injector.get('dataField', null),
            aggregation: this.injector.get('aggregation', null),
            aggregationField: this.injector.get('aggregationField', null),
            colorField: this.injector.get('colorField', null),
            limit: this.injector.get('limit', 100),
            unsharedFilterField: {},
            unsharedFilterValue: '',
            chartType: this.injector.get('chartType', 'bar')
        };
        this.filters = [];
        this.active = {
            dataField: new FieldMetaData(),
            aggregationField: new FieldMetaData(),
            aggregationFieldHidden: true,
            andFilters: true,
            limit: this.optionsFromConfig.limit,
            filterable: true,
            layers: [],
            data: [],
            aggregation: 'count',
            chartType: this.optionsFromConfig.chartType || 'horizontalBar',
            minScale: undefined,
            maxScale: undefined,
            maxNum: 0,
            scaleManually: false,
            seenValues: []
        };

        this.onClick = this.onClick.bind(this);

        this.chartInfo = {
            type: this.active.chartType,
            data: {
                labels: [],
                datasets: [new BarDataSet(0, this.defaultActiveColor)]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove', 'touchend'],
                onClick: this.onClick,
                animation: {
                    duration: 0 // general animation time
                },
                hover: {
                    mode: 'point',
                    onHover: null

                },
                scales: {
                    xAxes: [{
                        stacked: true,
                        ticks: {
                            // max: 100,
                            beginAtZero: true,
                            callback: this.formatingCallback
                        }
                    }],
                    yAxes: [{

                        stacked: true,
                        ticks: {
                            // max: 100,
                            beginAtZero: true,
                            callback: this.formatingCallback
                        }
                    }]
                },
                legend: {
                    display: false
                },
                tooltips: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {}
                }
            }
        };

        let tooltipTitleFunc = (tooltips, data) => {
            return this.active.dataField.prettyName + ': ' + tooltips[0].xLabel;
        };
        let tooltipDataFunc = (tooltipItem, data) => {
            let tooltip = data.datasets[tooltipItem.datasetIndex];
            let value = tooltip.data[tooltipItem.index];
            // Returning null removes the row from the tooltip
            return value === 0 ? null : tooltip.label + ': ' + this.formatingCallback(value);
        };
        this.chartInfo.options.tooltips.callbacks.title = tooltipTitleFunc.bind(this);
        this.chartInfo.options.tooltips.callbacks.label = tooltipDataFunc.bind(this);
        this.queryTitle = this.optionsFromConfig.title || 'Bar Chart';

    }

    subNgOnInit() {
        // Do nothing
    }

    postInit() {
        this.executeQueryChain();

        //This does nothing, but it is here to hide a bug: without it, if you open a barchart, and switch the type once,
        //then the chart will not resize with the widget. Resizing works again after any subsequent type-switch. So if we call
        //this at the outset of the program, the chart should always resize correctly. I would think we'd need to call this
        //method twice, but for some reason it appears it only needs one call to work.
        this.handleChangeChartType();

        this.defaultActiveColor = this.getPrimaryThemeColor();
    }

    subNgOnDestroy() {
        this.chartModule.chart.destroy();
    }

    subGetBindings(bindings: any) {
        bindings.dataField = this.active.dataField.columnName;
        bindings.aggregation = this.active.aggregation;
        bindings.aggregationField = this.active.aggregationField.columnName;
        bindings.limit = this.active.limit;
    }

    getExportFields() {
        let valuePrettyName = this.active.aggregation +
            (this.active.aggregationFieldHidden ? '' : '-' + this.active.aggregationField.prettyName);
        valuePrettyName = valuePrettyName.charAt(0).toUpperCase() + valuePrettyName.slice(1);
        return [{
            columnName: this.active.dataField.columnName,
            prettyName: this.active.dataField.prettyName
        }, {
            columnName: 'value',
            prettyName: valuePrettyName
        }];
    }

    getOptionFromConfig(field) {
        return this.optionsFromConfig[field];
    }

    onClick(_event, elements: any[]) {
        for (let el of elements) {
            let value = el._model.label;
            let key = this.active.dataField.columnName;
            let prettyKey = this.active.dataField.prettyName;
            let filter = {
                id: undefined,
                key: key,
                value: value,
                prettyKey: prettyKey
            };
            if (_event.ctrlKey) { // If Ctrl is pressed...
                if (this.filterIsUnique(filter)) {
                    this.addLocalFilter(filter);
                    let whereClause = neon.query.where(filter.key, '=', filter.value);
                    this.addNeonFilter(true, filter, whereClause);
                } else {
                    for (let f of this.filters) {
                        if (f.key === filter.key && f.value === filter.value) {
                            this.removeLocalFilterFromLocalAndNeon(f, true, true);
                            break;
                        }
                    }
                }
            } else { // If Ctrl isn't pressed...
                if (this.filters.length === 0) {
                    this.addLocalFilter(filter);
                    this.addNeonFilter(true, filter);
                } else if (this.filters.length === 1 && this.filterIsUnique(filter)) {
                    filter.id = this.filters[0].id;
                    this.filters[0] = filter;
                    this.replaceNeonFilter(true, filter);
                } else {
                    this.removeAllFilters(false, false);
                    this.addLocalFilter(filter);
                    this.addNeonFilter(true, filter);
                }
            }

            this.refreshVisualization();
        }
    }

    onUpdateFields() {
        if (this.optionsFromConfig.aggregation) {
            this.active.aggregation = this.optionsFromConfig.aggregation;
        }
        this.active.aggregationField = this.findFieldObject('aggregationField', neonMappings.TAGS);
        this.active.dataField = this.findFieldObject('dataField', neonMappings.TAGS);
        this.meta.colorField = this.findFieldObject('colorField', neonMappings.TAGS);
    }

    addLocalFilter(filter) {
        //this.filters[0] = filter;
        if (this.filterIsUnique(filter)) {
            this.filters = this.updateArray(this.filters, filter);
        }
    }

    updateArray(arr, add) {
        let newArr = arr.slice();
        newArr.push(add);
        return newArr;

    }

    filterIsUnique(filter) {
        for (let f of this.filters) {
            if (f.value === filter.value && f.key === filter.key) {
                return false;
            }
        }
        return true;
    }

    createNeonFilterClauseEquals(database: string, table: string, fieldName: string) {
        let filterClauses = this.filters.map(function(filter) {
            return neon.query.where(fieldName, '=', filter.value);
        });
        if (filterClauses.length === 1) {
            return filterClauses[0];
        }
        if (this.active.andFilters) {
            return neon.query.and.apply(neon.query, filterClauses);
        }
        return neon.query.or.apply(neon.query, filterClauses);
    }

    getNeonFilterFields(): string[] {
        return [this.active.dataField.columnName];
    }
    getVisualizationName(): string {
        return 'Bar Chart';
    }

    getFilterText(filter) {
        return filter.value;
    }

    refreshVisualization() {
        let selectedLabels: string[] = [];
/*
        if (this.filters.length > 1) {
            let activeValues = this.getActiveValues(this.filters);

            for (let value of activeValues) {
                let activeIndex = this.chartInfo.data.labels.indexOf(value);
                for (let dataset of this.chartInfo.data.datasets) {
                    dataset.setAllInactive();
                    dataset.setActiveColor(value);
                    //console.log('First ' + value);
                }
            }/*
            for (let dataset of this.chartInfo.data.datasets) {
                //dataset.setAllActive();
                if (activeValues.hasOwnProperty(dataset.label)) {
                    console.log('Hi Hello this works');
                    for (let value of activeValues) {
                        let activeIndex = this.chartInfo.data.labels.indexOf(value);
                        dataset.setActiveColor(value);
                    }
                } else {
                    dataset.setAllInactive();
                }
            }
    } else */if (this.filters.length === 1 && this.filters[0] && this.filters[0].value) {
            // If there is a filter, highlight the bar
            let activeValue = this.filters[0].value;
            let activeIndex = this.chartInfo.data.labels.indexOf(activeValue);

            // Set all but the selected bar inactive
            for (let dataset of this.chartInfo.data.datasets) {
                dataset.setAllInactive();
                dataset.setActiveColor(activeIndex);
                //console.log('The active index is:' + activeIndex);

                if (dataset.data[activeIndex] > 0) {
                    selectedLabels.push(dataset.label);
                }
            }
        } else {
            // Set all bars active
            for (let dataset of this.chartInfo.data.datasets) {
                dataset.setAllActive();
            }
        }

        this.selectedLabels = selectedLabels;
        this.chartModule.chart.update();
    }

    getActiveValues(filter) {
        let activeValues = [];
        for (let value of filter) {
                activeValues = this.updateArray(activeValues, value);
        }
        return activeValues;
    }

    isValidQuery() {
        let valid = true;
        valid = (this.meta.database && this.meta.database.name && valid);
        valid = (this.meta.table && this.meta.table.name && valid);
        valid = (this.active.dataField && this.active.dataField.columnName && valid);
        valid = (this.active.aggregation && this.active.aggregation && valid); // what?
        if (this.active.aggregation !== 'count') {
            valid = (this.active.aggregationField !== undefined && this.active.aggregationField.columnName !== '' && valid);
            //This would mean though that if the data is just a number being represented by a string, it would simply fail.
            //As opposed to first trying to parse it.
            //This also makes it silently fail, without letting the user know that it failed or why. One could easily change the
            //aggregation type, not notice that the chart didn't change, and
            valid = ((this.active.aggregationField.type !== 'string') && valid);

        }
        // valid = (this.active.aggregation && valid);
        return valid;
    }

    createQuery(): neon.query.Query {
        let databaseName = this.meta.database.name;
        let tableName = this.meta.table.name;
        let query = new neon.query.Query().selectFrom(databaseName, tableName);
        let whereClauses: neon.query.WherePredicate[] = [];
        whereClauses.push(neon.query.where(this.active.dataField.columnName, '!=', null));
        let yAxisField = this.active.aggregationField.columnName;
        let groupBy: any[] = [this.active.dataField.columnName];

        if (this.hasColorField()) {
            whereClauses.push(neon.query.where(this.meta.colorField.columnName, '!=', null));
            groupBy.push(this.meta.colorField.columnName);
        }

        if (this.hasUnsharedFilter()) {
            // Add the unshared filter
            whereClauses.push(
                neon.query.where(this.meta.unsharedFilterField.columnName, '=',
                    this.meta.unsharedFilterValue));
        }

        query.where(neon.query.and.apply(query, whereClauses));
        switch (this.active.aggregation) {
            case 'count':
                return query.groupBy(groupBy).aggregate(neonVariables.COUNT, '*', 'value')
                    .sortBy('value', neonVariables.DESCENDING).limit(this.active.limit);
            case 'sum':
                return query.groupBy(groupBy).aggregate(neonVariables.SUM, yAxisField, 'value')
                    .sortBy('value', neonVariables.DESCENDING).limit(this.active.limit);
            case 'average':
                return query.groupBy(groupBy).aggregate(neonVariables.AVG, yAxisField, 'value')
                    .sortBy('value', neonVariables.DESCENDING).limit(this.active.limit);
            case 'min':
                return query.groupBy(groupBy).aggregate(neonVariables.MIN, yAxisField, 'value')
                    .sortBy('value', neonVariables.DESCENDING).limit(this.active.limit);
            case 'max':
                return query.groupBy(groupBy).aggregate(neonVariables.MAX, yAxisField, 'value')
                    .sortBy('value', neonVariables.DESCENDING).limit(this.active.limit);
        }

    }

    getFiltersToIgnore() {
        let database = this.meta.database.name;
        let table = this.meta.table.name;
        let fields = this.getNeonFilterFields();
        // get relevant neon filters and check for filters that should be ignored and add that to query
        let neonFilters = this.filterService.getFiltersForFields(database, table, fields);
        if (neonFilters.length > 0) {
            let ignoredFilterIds = [];
            for (let filter of neonFilters) {
                ignoredFilterIds.push(filter.id);
            }
            return ignoredFilterIds;
        }
        return null;
    }

    onQuerySuccess(response): void {
        let colName = this.active.dataField.columnName;
        // let prettyColName = this.active.dataField.prettyName;
        let chartData = new BarData();

        let dataSets = new Map<string, BarDataSet>();

        let hasColor = this.hasColorField();
        // Use our seen values list to create dummy values for every category not returned this time.
        let valsToAdd = [];
        for (let value of this.active.seenValues) {
            let exists = false;
            for (let row of response.data) {
                if (row[colName] === value) {
                    exists = true;
                }
            }
            if (!exists) {
                let item = {
                    value: 0
                };
                item[colName] = value;
                valsToAdd.push(item);
            }
        }
        response.data = response.data.concat(valsToAdd);

        /*
         * We need to build the datasets.
         * The datasets are just arrays of the data to draw, and the data is indexed
         * by the labels field.
         */
        for (let row of response.data) {
            let key: string = row[colName];
            if (!key) {
                continue;
            }
            // Add any labels that we haven't seen before to our "seen values" list so we have them for next time.
            if (this.active.seenValues.indexOf(key) === -1) {
                this.active.seenValues.push(key);
            }
            if (chartData.labels.indexOf(key) === -1) {
                chartData.labels.push(key);
            }
        }
        chartData.labels.sort();

        for (let row of response.data) {
            let key: string = row[colName];
            if (!key) {
                continue;
            }
            let dataIndex = chartData.labels.indexOf(key);

            // The default group is the query title
            let group = this.queryTitle;
            if (hasColor) {
                group = row[this.meta.colorField.columnName];
            }

            let dataset = dataSets.get(group);
            if (dataset == null) {
                dataset = new BarDataSet(chartData.labels.length);
                dataSets.set(group, dataset);

                dataset.label = group;
                if (hasColor) {
                    dataset.color = this.colorSchemeService.getColorFor(this.meta.colorField.columnName, group);
                } else {
                    dataset.color = this.defaultActiveColor;
                }

                dataset.backgroundColor[0] = dataset.color.toRgb();
            }

            dataset.data[dataIndex] = row.value;

            // Set this to force the legend to update
            this.colorFieldNames = [this.meta.colorField.columnName];
        }

        chartData.datasets = Array.from(dataSets.values());
        this.chartInfo.data = chartData;
        this.refreshVisualization();

        let title;
        switch (this.active.aggregation) {
            case 'count':
                title = 'Count';
                break;
            case 'average':
                title = 'Average'; // + this.active.aggregationField.prettyName;
                break;
            case 'sum':
                title = 'Sum'; // + this.active.aggregationField.prettyName;
                break;
        }

        // I don't know what this code was supposed to do. It adds "by {whatever the text field is currently set to}" to the title,
        // regardless of what you changed. So if I set the text field to "ID", the title will be "Bar Chart by ID".
        // If I then set the aggregation to Average, and the corresponding aggregation field to anything, the title will
        // be "Bar Chart by ID by ID". If I then change the text field to "Name", and then set the color field to '(None)',
        // the title will be "Bar Chart by ID by ID by Name by Name".
        // So any time a query is made, the value of the current text field is appended to the chart's title.
        // I'd guess the intent was to have some record of what filters are currently applied to the chart?
        // I'll leave in this comment and the old code, in case we want to make that change later.
        // title = this.optionsFromConfig.title || this.queryTitle + ' by ' + this.active.dataField.prettyName;
        title = this.optionsFromConfig.title || 'Bar Chart' + ' by ' + this.active.dataField.prettyName;
        this.queryTitle = title;
    }

    formatingCallback(value): string {

        // This checks if value is a number, taken from https://stackoverflow.com/a/1421988/3015812
        if (!isNaN(parseFloat(value)) && !isNaN(value - 0)) {
            //round to at most 3 decimal places, so as to not display tiny floating-point errors
            return String(Math.round((parseFloat(value) + 0.00001) * 1000) / 1000);
        }
        // can't be converted to a number, so just use it as-is.
        return value;
    }

    handleChangeAggregation() {
        this.active.aggregationFieldHidden = (this.active.aggregation === 'count');
        this.executeQueryChain();
    }

    handleChangeChartType() {
        let barData = this.chartInfo.data;
        let barOptions = this.chartInfo.options;

        let ctx = this.chartModule.chart.ctx;

        this.chartModule.chart.destroy();

        let clonedChart = new Chart(ctx, {
            type: this.active.chartType,
            data: barData,
            options: barOptions
        });

        this.chartInfo = {
            type: this.active.chartType,
            data: barData,
            options: barOptions
        };
        this.chartModule.chart = clonedChart;

        this.handleChangeScale();

        this.refreshVisualization();

    }

    setGraphMaximum(newMax) {
        if (this.chartModule.chart.config.type === 'bar') {
            this.chartModule.chart.config.options.scales.yAxes[0].ticks.max = newMax;
        } else if ('horizontalBar') {
            this.chartModule.chart.config.options.scales.xAxes[0].ticks.max = newMax;
        } else {
            //what
        }
    }

    setGraphMinimum(newMin) {
        if (this.chartModule.chart.config.type === 'bar') {
            this.chartModule.chart.config.options.scales.yAxes[0].ticks.min = newMin;
        } else if ('horizontalBar') {
            this.chartModule.chart.config.options.scales.xAxes[0].ticks.min = newMin;
        } else {
            //what
        }
    }

    handleChangeScale() {
        if (this.active.scaleManually) {
            if (this.active.maxScale === undefined
                || this.active.maxScale === ''
                || isNaN(Number(this.active.maxScale))) {
                this.setGraphMaximum(undefined); // not usable input, so default to automatic scaling
            } else {
                this.setGraphMaximum(Number(this.active.maxScale));
            }

            if (this.active.minScale === undefined
                || this.active.minScale === ''
                || isNaN(Number(this.active.minScale))) {
                this.setGraphMinimum(undefined); // not usable input, so default to automatic scaling
            } else {
                this.setGraphMinimum(Number(this.active.minScale));
            }
        } else {
            this.setGraphMaximum(undefined);
            this.setGraphMinimum(undefined);
        }

        this.logChangeAndStartQueryChain();
    }

    setupFilters() {
        // Get neon filters
        // See if any neon filters are local filters and set/clear appropriately
        let database = this.meta.database.name;
        let table = this.meta.table.name;
        let fields = [this.active.dataField.columnName];
        let neonFilters = this.filterService.getFiltersForFields(database, table, fields);
        if (neonFilters && neonFilters.length > 0) {
            for (let filter of neonFilters) {
                let key = filter.filter.whereClause.lhs;
                let value = filter.filter.whereClause.rhs;
                let f = {
                    id: filter.id,
                    key: key,
                    value: value,
                    prettyKey: key
                };
                this.addLocalFilter(f);
            }
        } else {
            this.filters = [];
        }
    }

    handleChangeLimit() {
        this.logChangeAndStartQueryChain();
    }

    handleChangeDataField() {
        this.active.seenValues = [];
        this.logChangeAndStartQueryChain(); // ('dataField', this.active.dataField.columnName);
    }

    handleChangeAggregationField() {
        this.logChangeAndStartQueryChain(); // ('dataField', this.active.dataField.columnName);
    }

    handleChangeColorField() {
        this.logChangeAndStartQueryChain(); // ('colorField', this.active.colorField.columnName);
    }

    handleChangeAndFilters() {
        this.logChangeAndStartQueryChain(); // ('andFilters', this.active.andFilters, 'button');
    }

    unsharedFilterChanged() {
        // Update the data
        this.executeQueryChain();
    }

    unsharedFilterRemoved() {
        // Update the data
        this.executeQueryChain();
    }

    getButtonText() {
        let text = 'No Data';
        let data = this.chartInfo.data.datasets;
        if (!data || !data[0] || !data[0].data || !data[0].data.length) {
            return text;
        } else {
            let total = data[0].data.reduce((sum, elem) => {
                return sum + Math.round((elem + 0.00001) * 10000) / 10000;
            }, 0);
            return 'Total ' + this.formatingCallback(total);
        }
    }

    // Get filters and format for each call in HTML
    getCloseableFilters() {
        return this.filters;
    }

    getFilterTitle(value: string) {
        return this.active.dataField.columnName + ' = ' + value;
    }

    getFilterCloseText(value: string) {
        return value;
    }

    getRemoveFilterTooltip(value: string) {
        return 'Delete Filter ' + this.getFilterTitle(value);
    }

    //Would love to refactor this but cannot because it's called in base neon.
    removeFilter(filter) {
        for (let index = this.filters.length - 1; index >= 0; index--) {
            if (this.filters[index].id === filter.id) {
                this.filters.splice(index, 1);
            }
        }
    }

    removeAllFilters(shouldRequery: boolean = true, shouldRefresh: boolean = true) {
        for (let index = this.filters.length - 1; index >= 0; index--) {
            this.removeLocalFilterFromLocalAndNeon(this.filters[index], false, false);
        }
        // Do these once we're finished removing all filters, rather than after each one.
        if (shouldRequery) {
            this.executeQueryChain();
        }
        if (shouldRefresh) {
            this.refreshVisualization();
        }
    }
}
