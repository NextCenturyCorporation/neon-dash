import {
    Component,
    OnInit,
    OnDestroy,
    ViewEncapsulation,
    ChangeDetectionStrategy,
    Injector, ViewChild,
    ChangeDetectorRef
} from '@angular/core';
import {ConnectionService} from '../../services/connection.service';
import {DatasetService} from '../../services/dataset.service';
import {FilterService} from '../../services/filter.service';
import {ExportService} from '../../services/export.service';
import {ThemesService} from '../../services/themes.service';
import {FieldMetaData} from '../../dataset';
import {neonMappings} from '../../neon-namespaces';
import * as neon from 'neon-framework';
import {BaseNeonComponent} from '../base-neon-component/base-neon.component';
import {ChartComponent} from 'angular2-chartjs';
import {VisualizationService} from '../../services/visualization.service';
import {Color, ColorSchemeService} from '../../services/color-scheme.service';

/**
 * Data used to draw the bar chart
 */
class BarData {
    // The X-Axis labels
    labels: string[] = [];
    // The data to graph
    datasets: DataSet[] = [];
}

/**
 * One set of bars to draw
 */
class DataSet {
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
        limit: number;
    };
    public active: {
        dataField: FieldMetaData,
        aggregationField: FieldMetaData,
        aggregationFieldHidden: boolean,
        colorField: FieldMetaData,
        andFilters: boolean,
        limit: number,
        filterable: boolean,
        layers: any[],
        data: any[],
        aggregation: string
    };

    public chart: {
        data: {
            labels: string[],
            datasets: DataSet[]
        },
        type: string,
        options: any
    };

    private defaultActiveColor = new Color(57, 181, 74);
    public emptyField = new FieldMetaData();

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
            unsharedFilterValue: ''
        };
        this.filters = [];
        this.active = {
            dataField: new FieldMetaData(),
            aggregationField: new FieldMetaData(),
            aggregationFieldHidden: true,
            colorField: new FieldMetaData(),
            andFilters: true,
            limit: this.optionsFromConfig.limit,
            filterable: true,
            layers: [],
            data: [],
            aggregation: 'count'
        };

        // Make sure the empty field has non-null values
        this.emptyField.columnName = '';
        this.emptyField.prettyName = '';

        this.onClick = this.onClick.bind(this);
        this.chart = {
            type: 'bar',
            data: {
                labels: [],
                datasets: [new DataSet(0, this.defaultActiveColor)]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove', 'touchend'],
                onClick: this.onClick,
                animation: {
                  duration: 0, // general animation time
                },
                hover: {
                    mode: 'point',
                    onHover: null

                },
                scales: {
                    xAxes: [{
                        stacked: true
                    }],
                    yAxes: [{
                        stacked: true
                    }],
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
            return value === 0 ? null : tooltip.label + ': ' + value;
        };
        this.chart.options['tooltips'].callbacks.title = tooltipTitleFunc.bind(this);
        this.chart.options['tooltips'].callbacks.label = tooltipDataFunc.bind(this);
        this.queryTitle = 'Bar Chart';
    };

    subNgOnInit() {
        //Do nothing
    };

    postInit() {
        this.executeQueryChain();
    };

    subNgOnDestroy() {
        this.chartModule['chart'].destroy();
    };

    subGetBindings(bindings: any) {
        bindings.dataField = this.active.dataField.columnName;
        bindings.aggregation = this.active.aggregation;
        bindings.aggregationField = this.active.aggregationField.columnName;
        bindings.limit = this.active.limit;
        bindings.colorField = this.active.colorField.columnName;
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
    };

    onClick(_event, elements: any[]) {
        // console.log(event);
        //event.toString();
        for (let el of elements) {
            let value = el._model.label;
            let key = this.active.dataField.columnName;
            let prettyKey = this.active.dataField.prettyName;
            let filter = {
                key: key,
                value: value,
                prettyKey: prettyKey
            };
            this.addLocalFilter(filter);
            this.addNeonFilter(false, filter);
            this.refreshVisualization();
        }
    };

    onUpdateFields() {
        if (this.optionsFromConfig.aggregation) {
            this.active.aggregation = this.optionsFromConfig.aggregation;
        }
        this.active.aggregationField = this.findFieldObject('aggregationField', neonMappings.TAGS);
        this.active.dataField = this.findFieldObject('dataField', neonMappings.TAGS);
        this.active.colorField = this.findFieldObject('colorField', neonMappings.TAGS);
    };

    addLocalFilter(filter) {
        this.filters[0] = filter;
    };

    createNeonFilterClauseEquals(_databaseAndTableName: {}, fieldName: string) {
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
    };

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
        // If there is a filter, highlight the bar
        if (this.filters[0] && this.filters[0].value) {
            let activeValue = this.filters[0].value;
            let activeIndex = this.chart.data.labels.indexOf(activeValue);

            // Set all but the selected bar inactive
            for (let dataset of this.chart.data.datasets) {
                dataset.setAllInactive();
                dataset.setActiveColor(activeIndex);
            }
        } else {
            // Set all bars active
            for (let dataset of this.chart.data.datasets) {
                dataset.setAllActive();
            }
        }
        this.chartModule['chart'].update();
    }

    isValidQuery() {
        let valid = true;
        valid = (this.meta.database && this.meta.database.name && valid);
        valid = (this.meta.table && this.meta.table.name && valid);
        valid = (this.active.dataField && this.active.dataField.columnName && valid);
        valid = (this.active.aggregation && this.active.aggregation && valid);
        if (this.active.aggregation !== 'count') {
            valid = (this.active.aggregationField && this.active.aggregationField.columnName && valid);
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

        if (this.active.colorField.columnName !== '') {
            whereClauses.push(neon.query.where(this.active.colorField.columnName, '!=', null));
            groupBy.push(this.active.colorField.columnName);
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
                return query.groupBy(groupBy).aggregate(neon.query['COUNT'], '*', 'value')
                    .sortBy('value', neon.query['DESCENDING']).limit(this.active.limit);
            case 'sum':
                return query.groupBy(groupBy).aggregate(neon.query['SUM'], yAxisField, 'value')
                    .sortBy('value', neon.query['DESCENDING']).limit(this.active.limit);
            case 'average':
                return query.groupBy(groupBy).aggregate(neon.query['AVG'], yAxisField, 'value')
                    .sortBy('value', neon.query['DESCENDING']).limit(this.active.limit);
        }

    };

    getFiltersToIgnore() {
        let database = this.meta.database.name;
        let table = this.meta.table.name;
        let fields = this.getNeonFilterFields();
        // get relevant neon filters and check for filters that should be ignored and add that to query
        let neonFilters = this.filterService.getFilters(database, table, fields);
        // console.log(neonFilters);
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
        console.log('Query success');
        let colName = this.active.dataField.columnName;
        // let prettyColName = this.active.dataField.prettyName;
        let chartData = new BarData();

        let dataSets = new Map<string, DataSet>();

        let hasGroup = this.active.colorField.columnName !== '';

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
            if (chartData.labels.indexOf(key) === -1) {
                chartData.labels.push(key);
            }
        }

        for (let row of response.data) {
            let key: string = row[colName];
            if (!key) {
                continue;
            }
            let dataIndex = chartData.labels.indexOf(key);

            // The default group is the query title
            let group = this.queryTitle;
            if (hasGroup) {
                group = row[this.active.colorField.columnName];
            }

            let dataset = dataSets.get(group);
            if (dataset == null) {
                dataset = new DataSet(chartData.labels.length);
                dataSets.set(group, dataset);

                dataset.label = group;
                if (hasGroup) {
                    dataset.color = this.colorSchemeService.getColorFor(this.active.colorField.columnName, group);
                } else {
                    dataset.color = this.defaultActiveColor;
                }

                dataset.backgroundColor[0] = dataset.color.toRgb();
            }

            dataset.data[dataIndex] = row.value;
        }

        chartData.datasets = Array.from(dataSets.values());
        this.chart.data = chartData;
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
        title += ' by ' + this.active.dataField.prettyName;
        this.queryTitle = title;
    }

    handleChangeAggregation() {
        this.active.aggregationFieldHidden = (this.active.aggregation === 'count');
        this.executeQueryChain();
    }

    setupFilters() {
        // Get neon filters
        // See if any neon filters are local filters and set/clear appropriately
        let database = this.meta.database.name;
        let table = this.meta.table.name;
        let fields = [this.active.dataField.columnName];
        let neonFilters = this.filterService.getFilters(database, table, fields);
        if (neonFilters && neonFilters.length > 0) {
            for (let filter of neonFilters) {
                let key = filter.filter.whereClause.lhs;
                let value = filter.filter.whereClause.rhs;
                let f = {
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
        this.logChangeAndStartQueryChain(); // ('dataField', this.active.dataField.columnName);
    };

    handleChangeAggregationField() {
        this.logChangeAndStartQueryChain(); // ('dataField', this.active.dataField.columnName);
    };

    handleChangeColorField() {
        this.logChangeAndStartQueryChain(); // ('colorField', this.active.colorField.columnName);
    };

    handleChangeAndFilters() {
        this.logChangeAndStartQueryChain(); // ('andFilters', this.active.andFilters, 'button');
        // this.updateNeonFilter();
    };

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
        let data = this.chart.data['datasets'];
        if (!data || !data[0] || !data[0]['data'] || !data[0]['data'].length) {
            return text;
        } else {
            return 'Top ' + data[0]['data'].length;
        }
    };

    // Get filters and format for each call in HTML
    getCloseableFilters() {
        return this.filters.map((filter) => {
            return filter.value;
        });
    };

    getFilterTitle(value: string) {
        return this.active.dataField.columnName + ' = ' + value;
    };

    getFilterCloseText(value: string) {
        return value;
    };

    getRemoveFilterTooltip(value: string) {
        return 'Delete Filter ' + this.getFilterTitle(value);
    };

    removeFilter(/*value: string*/) {
        this.filters = [];
    }
}
