import {
    Component,
    OnInit,
    OnDestroy,
    ViewEncapsulation,
    ChangeDetectionStrategy,
    Injector,
    ViewChild,
    ChangeDetectorRef
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
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScatterPlotComponent extends BaseNeonComponent implements OnInit,
    OnDestroy {
    @ViewChild('scatter') chartModule: ChartModule;

    private filters: ScatterPlotFilter[];

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
    public active: {
        xField: FieldMetaData,
        yField: FieldMetaData,
        labelField: FieldMetaData,
        andFilters: boolean,
        limit: number,
        filterable: boolean,
        layers: any[],
        xAxisIsNumeric: boolean,
        yAxisIsNumeric: boolean,
        pointLabels: string[],
    };

    private chartDefaults: {
        activeColor: string,
        inactiveColor: string
    };

    private mouseEventValid: boolean;

    public selection: {
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
        exportService: ExportService, injector: Injector, themesService: ThemesService,
        colorSchemeSrv: ColorSchemeService, ref: ChangeDetectorRef) {
        super(connectionService, datasetService, filterService, exportService, injector, themesService, ref);
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
        this.mouseEventValid = false;
        this.active = {
            xField: new FieldMetaData(),
            yField: new FieldMetaData(),
            labelField: new FieldMetaData(),
            andFilters: true,
            limit: 200,
            filterable: true,
            layers: [],
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
                //onClick: this.onClick.bind(this),
                //onTouchStart: this.touchStart.bind(this),
                animation: {
                  duration: 0, // general animation time
                },
                hover: {
                    mode: 'point',
                    intersect: false,
                    onHover: this.onHover

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
            //console.log(tooltips.length);
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
        this.queryTitle = 'Scatter Plot';
    };
    subNgOnInit() {
        // do nothing
    };

    postInit() {
        this.executeQueryChain();
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

    forcePosInsideChart(pos, min, max) {
        if (pos < min) {
            pos = min;
        } else if (pos > max) {
            pos = max;
        }
        return pos;
    }

    /*onClick(event) {
        console.log(event);
    }*/

    mouseLeave(event) {
        //console.log('leave');
        //console.log(event);
        this.mouseEventValid = false;
        this.selection.mouseDown = false;
        this.stopEventPropagation(event);
        this.changeDetection.detectChanges();
    }

    mouseDown(event) {
        //console.log('down');
        //console.log(event);
        if (event.buttons > 0) {
            this.mouseEventValid = true;
        }
    }

    mouseUp(event) {
        //console.log('up');
        //console.log(event);
        if (this.selection.mouseDown && event.buttons === 0) {
            // mouse up event
            this.selection.mouseDown = false;
            if (this.mouseEventValid) {
                let filter = this.getFilterFromSelectionPositions();
                this.addLocalFilter(filter);
                this.addNeonFilter(true, filter);
            }
        }
        this.stopEventPropagation(event);
        this.changeDetection.detectChanges();
        if (event.buttons === 0) {
            this.mouseEventValid = false;
        }
    }

    onHover(event) {
        let chart = this.chartModule['chart'];
        let chartArea = chart.chartArea;
        let chartXPos = event.offsetX;
        let chartYPos = event.offsetY;
        let isMouseUp = false;
        if (!this.selection.mouseDown && event.buttons > 0 && this.mouseEventValid) {
            // mouse down event
            console.log(event);
            this.selection.mouseDown = true;
            this.selection.startX = this.forcePosInsideChart(chartXPos, chartArea.left, chartArea.right);
            this.selection.startY = this.forcePosInsideChart(chartYPos, chartArea.top, chartArea.bottom);
        }

        //console.log(chartXPos);

        if (this.selection.mouseDown && this.mouseEventValid) {
            // drag event near items
            //console.log(chartXPos);
            this.selection.endX = this.forcePosInsideChart(chartXPos, chartArea.left, chartArea.right);
            this.selection.endY = this.forcePosInsideChart(chartYPos, chartArea.top, chartArea.bottom);
            //console.log(this.selection.endX);
            this.selection.x = Math.min(this.selection.startX, this.selection.endX);
            this.selection.y = Math.min(this.selection.startY, this.selection.endY);
            this.selection.width = Math.abs(this.selection.startX - this.selection.endX);
            this.selection.height = Math.abs(this.selection.startY - this.selection.endY);
            //console.log("x: " + this.selection.startX + " " + this.selection.endX);
            //console.log(this.selection.x + " " + this.selection.width);
        }
        this.stopEventPropagation(event);
        this.changeDetection.detectChanges();
    }

    getFilterFromSelectionPositions() {
        let chart = this.chartModule['chart'];
        let x1 = chart.scales['x-axis-0'].getValueForPixel(this.selection.startX);
        let y1 = chart.scales['y-axis-0'].getValueForPixel(this.selection.startY);
        let x2 = chart.scales['x-axis-0'].getValueForPixel(this.selection.endX);
        let y2 = chart.scales['y-axis-0'].getValueForPixel(this.selection.endY);
        let temp = Math.max(x1, x2);
        x1 = Math.min(x1, x2);
        x2 = temp;
        temp = Math.max(y1, y2);
        y1 = Math.min(y1, y2);
        y2 = temp;
        if (!this.active.xAxisIsNumeric) {
            let i = Math.ceil(x1);
            x1 = this.scatter.data['xLabels'][i];
            i = Math.floor(x2);
            x2 = this.scatter.data['xLabels'][i];
        }
        if (!this.active.yAxisIsNumeric) {
            let i = Math.ceil(y1);
            y1 = this.scatter.data['yLabels'][i];
            i = Math.floor(y2);
            y2 = this.scatter.data['yLabels'][i];
        }
        return {
            xMin: x1, xMax: x2, yMin: y1, yMax: y2,
            xField: this.active.xField.columnName, yField: this.active.yField.columnName
        };
    }

    createNeonFilterClauseEquals(_databaseAndTableName: {}, fieldNames: string[]) {
        let filterClauses = [];
        let xField = fieldNames[0];
        let yField = fieldNames[1];
        let filter = this.filters[0];
        filterClauses[0] = neon.query.where(xField, '>=', filter.xMin);
        filterClauses[1] = neon.query.where(xField, '<=', filter.xMax);
        filterClauses[2] = neon.query.where(yField, '>=', filter.yMin);
        filterClauses[3] = neon.query.where(yField, '<=', filter.yMax);
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
        valid = (this.meta.database && this.meta.database.name && valid);
        valid = (this.meta.table && this.meta.table.name && valid);
        valid = (this.active.xField && this.active.xField.columnName && valid);
        valid = (this.active.yField && this.active.yField.columnName && valid);
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
            this.scatter.data.xLabels = [];
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
            this.scatter.data.yLabels = [];
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

        this.queryTitle = 'Scatter Plot: ' + this.active.xField.prettyName + ' vs ' + this.active.yField.prettyName;
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

export class ScatterPlotFilter {
    xMin: any;
    xMax: any;
    yMin: any;
    yMax: any;
    xField: string;
    yField: string;
};
