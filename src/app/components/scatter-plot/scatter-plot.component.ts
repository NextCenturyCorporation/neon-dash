import {
    Component,
    OnInit,
    OnDestroy,
    ViewEncapsulation,
    ChangeDetectionStrategy,
    Injector,
    ViewChild
} from '@angular/core';
import {ConnectionService} from '../../services/connection.service';
import {DatasetService} from '../../services/dataset.service';
import {FilterService} from '../../services/filter.service';
import {ExportService} from '../../services/export.service';
import {ThemesService} from '../../services/themes.service';
import {ColorSchemeService} from '../../services/color-scheme.service';
import {FieldMetaData } from '../../dataset';
import {neonMappings} from '../../neon-namespaces';
import * as neon from 'neon-framework';
//import * as _ from 'lodash';
//import {DateBucketizer} from '../bucketizers/DateBucketizer';
//import {LegendItem} from '../legend/legend.component';
import {BaseNeonComponent} from '../base-neon-component/base-neon.component';
import {ChartModule} from 'angular2-chartjs';
// import * as Chartjs from 'chart.js';
declare var Chart: any;

@Component({
    selector: 'app-scatter-plot',
    templateUrl: './scatter-plot.component.html',
    styleUrls: ['./scatter-plot.component.scss'],
    encapsulation: ViewEncapsulation.Emulated, changeDetection: ChangeDetectionStrategy.Default
})
export class ScatterPlotComponent extends BaseNeonComponent implements OnInit,
    OnDestroy {
    @ViewChild('scatter') chartModule: ChartModule;

    private filters: {
        key: string,
        startDate: string,
        endDate: string
    }[];

    private optionsFromConfig: {
        title: string,
        database: string,
        table: string,
        xField: string,
        yField: string,
        labelField: string,
        unsharedFilterField: Object,
        unsharedFilterValue: string
    };
    private active: {
        xField: FieldMetaData,
        yField: FieldMetaData,
        labelField: FieldMetaData,
        andFilters: boolean,
        limit: number,
        filterable: boolean,
        layers: any[],
        data: Object[],
        xAxisIsNumeric: boolean,
        yAxisIsNumeric: boolean,
        pointLabels: string[],
    };

    private chartDefaults: {
        activeColor: string,
        inactiveColor: string
    };

    private selection: {
        mouseDown: boolean
        startX: number,
        startY: number,
        endX: number,
        endY: number,
        height: number,
        width: number,
        x: number,
        y: number,
        visibleOverlay: boolean,
    };

    protected scatter: {
        data: {
            xLabels: any[],
            yLabels: any[],
            datasets: any[]
        },
        type: string,
        options: Object
    };

    private colorSchemeService: ColorSchemeService;

    constructor(connectionService: ConnectionService, datasetService: DatasetService, filterService: FilterService,
        exportService: ExportService, injector: Injector, themesService: ThemesService, colorSchemeSrv: ColorSchemeService) {
        super(connectionService, datasetService, filterService, exportService, injector, themesService);
        this.optionsFromConfig = {
            title: this.injector.get('title', null),
            database: this.injector.get('database', null),
            table: this.injector.get('table', null),
            xField: this.injector.get('xField', null),
            yField: this.injector.get('yField', null),
            labelField: this.injector.get('labelField', null),
            unsharedFilterField: {},
            unsharedFilterValue: ''
        };
        this.colorSchemeService = colorSchemeSrv;
        this.filters = [];

        this.active = {
            xField: new FieldMetaData(),
            yField: new FieldMetaData(),
            labelField: new FieldMetaData(),
            andFilters: true,
            limit: 200,
            filterable: true,
            layers: [],
            data: [],
            xAxisIsNumeric: true,
            yAxisIsNumeric: true,
            pointLabels: [],
        };

        this.selection = {
            mouseDown: false,
            height: 20,
            width: 20,
            x: 20,
            y: 200,
            startX: 0,
            startY: 0,
            endX: 0,
            endY: 0,
            visibleOverlay: false,
        };

        this.chartDefaults = {
            activeColor: 'rgba(57, 181, 74, 0.9)',
            inactiveColor: 'rgba(57, 181, 74, 0.3)'
        };

        this.onHover = this.onHover.bind(this);
        let dataColor = 'rgba(0, 0, 255, 0.2)';
        this.scatter = {
            type: 'line',
            data: {
                xLabels: [],
                yLabels: [],
                datasets: [
                    {
                        label: 'dataset',
                        fill: false,
                        showLine: false,
                        data: [],
                        backgroundColor: dataColor,
                        borderColor: dataColor,
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove', 'touchend'],
                onClick: null,
                hover: {
                    mode: 'point',
                    intersect: false,
                    onHover: null //this.onHover

                },
                legend: Chart.defaults.global.legend,
                //tooltips: Chart.defaults.global.tooltips,
                scales: {
                    xAxes: [{
                        //type: 'linear',
                        position: 'bottom'
                    }],
                    yAxes: [{
                        //type: 'linear'
                    }]
                }
            }
        };
        this.scatter.options['legend'] = {};
        this.scatter.options['legend'].display = false;
        let tooltipTitleFunc = (tooltips) => {
          console.log(tooltips.length);
            let title = this.active.pointLabels[tooltips[0].index];
            return title;
        };
        let tooltipDataFunc = (tooltips) => {
            let dataPoint = this.scatter.data.datasets[tooltips.datasetIndex].data[tooltips.index];
            let xLabel;
            let yLabel;
            if (this.active.xAxisIsNumeric) {
                xLabel = dataPoint.x;
            } else {
                xLabel = this.scatter.data.xLabels[dataPoint.x];
            }
            if (this.active.yAxisIsNumeric) {
                yLabel = dataPoint.y;
            } else {
                yLabel = this.scatter.data.yLabels[dataPoint.y];
            }
            let label = this.active.xField.prettyName + ': ' + xLabel + '  ' + this.active.yField.prettyName + ': ' + yLabel;
            return label;
        };
        this.scatter.options['tooltips'] = { callbacks: {} };
        this.scatter.options['tooltips'].callbacks.title = tooltipTitleFunc.bind(this);
        this.scatter.options['tooltips'].callbacks.label = tooltipDataFunc.bind(this);

    };
    subNgOnInit() {
        // do nothing
    };

    subNgOnDestroy() {

    };

    getOptionFromConfig(field) {
        return this.optionsFromConfig[field];
    };

    onUpdateFields() {

        this.active.xField = this.findFieldObject('xField', neonMappings.TAGS);
        this.active.yField = this.findFieldObject('yField', neonMappings.TAGS);
        this.active.labelField = this.findFieldObject('labelField', neonMappings.TAGS);
    };

    createFilter(key, startDate, endDate) {
        return {
            key: key,
            startDate: startDate,
            endDate: endDate
        };
    }

    addLocalFilter(f) {
        this.filters[0] = f;
    };

    /**
    * returns -1 if cannot be found
    */
    getPointXLocationByIndex(chart, index): number {
        let dsMeta = chart.controller.getDatasetMeta(0);
        if (dsMeta.data.length > index) {
            let pointMeta = dsMeta.data[index];
            let x = pointMeta.getCenterPoint().x;
            return x;
        }
        return -1;
    }

    onHover(/*event, items*/) {
        /*if (items.length === 0) {
            return;
        }
        let isMouseUp = false;
        if (!this.selection.mouseDown && event.buttons > 0) {
            // mouse down event
            this.selection.mouseDown = true;
            this.selection.startX = items[0].getCenterPoint().x;
            this.selection.startIndex = items[0]._index;
        }

        if (this.selection.mouseDown && event.buttons === 0) {
            // mouse up event
            this.selection.mouseDown = false;
            this.selection.endIndex = items[0]._index;
            isMouseUp = true;
        }
        if (items && items.length > 0 && this.selection.mouseDown) {
            // drag event near items
            let chartArea = items[0]._chart.controller.chartArea;
            let chartBottom = chartArea.bottom;
            let chartTop = chartArea.top;
            let startIndex: number = this.selection.startIndex;
            let endIndex: number = items[0]._index;
            //let endX = items[0].getCenterPoint().x;
            //let startX = this.selection.startX
            let endX: number = -1;
            let startX: number = -1;
            if (startIndex > endIndex) {
                let temp = startIndex;
                startIndex = endIndex;
                endIndex = temp;
            }
            // at this point, start Index is <= end index
            if (startIndex === 0) {
                //first element, so don't go off the chart
                startX = this.getPointXLocationByIndex(items[0]._chart, startIndex);
            } else {
                let a = this.getPointXLocationByIndex(items[0]._chart, startIndex - 1);
                let b = this.getPointXLocationByIndex(items[0]._chart, startIndex);
                startX = (b - a) / 2 + a;
            }

            if (endIndex >= this.scatter.data.labels.length - 1) {
                //last element, so don't go off the chart
                endX = this.getPointXLocationByIndex(items[0]._chart, endIndex);
            } else {
                let a = this.getPointXLocationByIndex(items[0]._chart, endIndex);
                let b = this.getPointXLocationByIndex(items[0]._chart, endIndex + 1);
                endX = (b - a) / 2 + a;
            }
            this.selection.width = Math.abs(startX - endX);
            this.selection.x = Math.min(startX, endX);
            this.selection.height = chartBottom - chartTop;
            this.selection.y = chartTop;

            //this.selection.visibleOverlay=!this.selection.visibleOverlay;
        }
        if (isMouseUp) {
            //The button was clicked, handle the selection.
            this.selection.startDate = this.active.dateBucketizer.getDateForBucket(this.selection.startIndex);
            this.selection.endDate = this.active.dateBucketizer.getDateForBucket(this.selection.endIndex);
            let key = this.active.dateField.columnName;
            let f = this.createFilter(key, this.selection.startDate, this.selection.endDate);
            this.addLocalFilter(f);
            this.addNeonFilter(true, f);
        }

        this.stopEventPropagation(event);
        //console.log(event);
        //console.log(items);*/
    }

    createNeonFilterClauseEquals(_databaseAndTableName: {}, fieldName: string) {
        let filterClauses = [];
        filterClauses[0] = neon.query.where(fieldName, '>=', 0);
        //let endDatePlusOne = this.selection.endDate.getTime() + this.active.dateBucketizer.getMillisMultiplier();
        //let endDatePlusOneDate = new Date(endDatePlusOne);
        //filterClauses[1] = neon.query.where(fieldName, '<', endDatePlusOneDate);
        return neon.query.and.apply(neon.query, filterClauses);
    };

    getFilterText() {
        // I.E. test - earthquakes - time = 10/11/2015 to 5/1/2016"
        /*let database = this.meta.database.name;
        let table = this.meta.table.name;
        let field = this.active.dateField.columnName;
        let text = database + ' - ' + table + ' - ' + field + ' = ';
        let date = this.selection.startDate;
        text += (date.getUTCMonth() + 1) + '/' + date.getUTCDate() + '/' + date.getUTCFullYear();
        date = this.selection.endDate;
        text += ' to ';
        text += (date.getUTCMonth() + 1) + '/' + date.getUTCDate() + '/' + date.getUTCFullYear();
        return text;*/
        return '';
    }

    getNeonFilterFields() {
        let fields = [this.active.xField.columnName, this.active.yField.columnName];
        return fields;
    }
    getVisualizationName() {
        return 'Scatter Plot';
    }

    refreshVisualization() {
        this.chartModule['chart'].update();
    }

    isValidQuery() {
        let valid = true;
        valid = (this.meta.database && valid);
        valid = (this.meta.table && valid);
        valid = (this.active.xField && valid);
        valid = (this.active.yField && valid);
        //valid = (this.active.labelField && valid);
        return valid;
    }

    createQuery(): neon.query.Query {
        let databaseName = this.meta.database.name;
        let tableName = this.meta.table.name;
        let query = new neon.query.Query().selectFrom(databaseName, tableName);
        let whereClauses = [];
        let xField = this.active.xField.columnName;
        let yField = this.active.yField.columnName;
        whereClauses.push(neon.query.where(xField, '!=', null));
        whereClauses.push(neon.query.where(yField, '!=', null));
        let groupBys: any[] = [];
        groupBys.push(xField);
        groupBys.push(yField);
        if (this.active.labelField && this.active.labelField.columnName !== '') {
            whereClauses.push(neon.query.where(this.active.labelField.columnName, '!=', null));
            groupBys.push(this.active.labelField);
        }
        query = query.groupBy(groupBys);
        query = query.sortBy(xField, neon.query['ASCENDING']);
        neon.query.and.apply(query, whereClauses);
        query = query.limit(this.active.limit);
        query = query.aggregate(neon.query['COUNT'], '*', 'value');
        return query;
    };

    getColorFromScheme(index) {
        let color = this.colorSchemeService.getColorAsRgb(index);
        return color;
    }

    getFiltersToIgnore() {
        return null;
    }

    isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    };

    onQuerySuccess(response) {
        //TODO much of this method could be optimized, but we'll worry about that later
        // need to reset chart when data potentially changes type (or number of datasets)
        let ctx = this.chartModule['chart'].chart.ctx;
        this.chartModule['chart'].destroy();


        let xField = this.active.xField.columnName;
        let yField = this.active.yField.columnName;

        let data = response.data;
        let points = [];
        let xAxisIsNumeric = true;
        let yAxisIsNumeric = true;
        let xAxisLabels = [];
        let yAxisLabels = [];
        this.active.pointLabels = [];
        for (let point of data) {
            let x = point[xField];
            let y = point[yField];
            let p = {
                'x': x,
                'y': y
            };
            xAxisLabels.push(x);
            yAxisLabels.push(y);
            xAxisIsNumeric = xAxisIsNumeric && this.isNumber(x);
            yAxisIsNumeric = yAxisIsNumeric && this.isNumber(y);
            points.push(p);
            let label = '';
            if (point.hasOwnProperty(this.active.labelField.columnName)) {
                label = point[this.active.labelField.columnName];
            }
            this.active.pointLabels.push(label);
        }

        if (xAxisIsNumeric) {
            this.scatter.options['scales'].xAxes[0] = { position: 'bottom' };
            this.scatter.options['scales'].xAxes[0].type = 'linear';
            this.scatter.data.xLabels = null;
        } else {
            let xLabels = this.removeDuplicatesAndSort(xAxisLabels);
            this.scatter.data.xLabels = xLabels;
            for (let p of points) {
                let val = p.x;
                p.x = xLabels.indexOf(val);
            }
            let xAxis = { ticks: null, position: 'bottom' };
            let tickCallback = (value) => {
                let t = this.scatter.data.xLabels[value];
                if (t !== undefined) {
                    return t;
                }
                return '';
            };
            xAxis.ticks = {};
            xAxis.ticks.callback = tickCallback.bind(this);
            this.scatter.options['scales'].xAxes[0] = xAxis;
            this.scatter.options['scales'].xAxes[0].type = 'linear';

            //this.scatter.options['scales'].xAxes[0].ticks = {
            //    min: 0,
            //    max: this.scatter.data.xLabels.length - 1
            //}
        }
        if (yAxisIsNumeric) {
            this.scatter.options['scales'].yAxes[0].type = 'linear';
            this.scatter.data.yLabels = null;
        } else {
            let yLabels = this.removeDuplicatesAndSort(yAxisLabels);
            this.scatter.options['scales'].yAxes[0].type = 'linear';
            this.scatter.data.yLabels = yLabels;
            for (let p of points) {
                let val = p.y;
                p.y = yLabels.indexOf(val);
            }
            let yAxis = { ticks: null };
            let tickCallback = (value) => {
                let t = this.scatter.data.yLabels[value];
                if (t !== undefined) {
                    return t;
                }
                return '';
            };
            yAxis.ticks = {};
            yAxis.ticks.callback = tickCallback.bind(this);
            this.scatter.options['scales'].yAxes[0] = yAxis;
            this.scatter.options['scales'].yAxes[0].type = 'linear';
        }
        this.scatter.data['labels'] = this.scatter.data.xLabels;

        this.scatter.data.datasets[0].data = points;
        //this.scatter.data.labels[0] = xField + ' vs ' + yField;
        //let labels = new Array(length);

        //this.scatter.data = {
        //    labels: labels,
        //    datasets: datasets
        //};
        this.active.xAxisIsNumeric = xAxisIsNumeric;
        this.active.yAxisIsNumeric = yAxisIsNumeric;
        this.chartModule['chart'] = new Chart(ctx, this.scatter);
        this.refreshVisualization();
    };

    removeDuplicatesAndSort(arr) {
        arr = arr.sort();
        arr = arr.filter(function(item, pos, ary) {
            return !pos || item !== ary[pos - 1];
        });
        return arr;
    }

    handleFiltersChangedEvent() {
        this.executeQueryChain();
    };

    handleChangeLimit() {
        this.logChangeAndStartQueryChain();
    }

    handleChangeXField() {
        this.logChangeAndStartQueryChain(); // ('dateField', this.active.dateField.columnName);
    };

    handleChangeYField() {
        this.logChangeAndStartQueryChain(); // ('dateField', this.active.dateField.columnName);
    };

    handleChangeLabelField() {
        this.logChangeAndStartQueryChain(); // ('dateField', this.active.dateField.columnName);
    };

    handleChangeAndFilters() {
        this.logChangeAndStartQueryChain(); // ('andFilters', this.active.andFilters, 'button');
        // this.updateNeonFilter();
    };

    getButtonText() {
        // TODO Fix this.  It gets called a lot
        // return !this.isFilterSet() && !this.active.data.length
        //    ? 'No Data'
        //    : 'Top ' + this.active.data.length;
        // console.log('TODO - see getButtonText()')
    };

    // Get filters and format for each call in HTML
    getCloseableFilters() {
        if (this.filters.length > 0) {
            return ['Scatter Filter'];
        } else {
            return [];
        }
    };

    getFilterTitle(/*value: string*/) {
        return this.active.xField.columnName + ' vs ' + this.active.yField.columnName;
    };

    getFilterCloseText(value: string) {
        return value;
    };

    getRemoveFilterTooltip(/*value: string*/) {
        return 'Delete Filter ' + this.getFilterTitle();
    };

    removeFilter(/*value: string*/) {
        this.filters = [];
    }
}
