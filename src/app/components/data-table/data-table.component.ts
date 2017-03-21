import {
    Component,
    OnInit,
    OnDestroy,
    ViewEncapsulation,
    ChangeDetectionStrategy,
    Injector,
    ViewChild,
    ElementRef
} from '@angular/core';
import {ConnectionService} from '../../services/connection.service';
import {DatasetService} from '../../services/dataset.service';
import {FilterService} from '../../services/filter.service';
import {ExportService} from '../../services/export.service';
import {ThemesService} from '../../services/themes.service';
import {FieldMetaData} from '../../dataset';
import {neonMappings} from '../../neon-namespaces';
import * as neon from 'neon-framework';
//import * as _ from 'lodash';
import {BaseNeonComponent} from '../base-neon-component/base-neon.component';


@Component({
    selector: 'app-data-table',
    templateUrl: './data-table.component.html',
    styleUrls: ['./data-table.component.scss'],
    encapsulation: ViewEncapsulation.Emulated, changeDetection: ChangeDetectionStrategy.Default
})
export class DataTableComponent extends BaseNeonComponent implements OnInit,
    OnDestroy {
    @ViewChild('table') table: any;
    @ViewChild('dragView') dragView: ElementRef;

    private filters: {
        key: string,
        value: string,
        prettyKey: string
    }[];

    private optionsFromConfig: {
        title: string,
        database: string,
        table: string,
        sortField: string,
        limit: number,
        unsharedFilterField: Object,
        unsharedFilterValue: string
    };
    private active: {
        sortField: FieldMetaData,
        andFilters: boolean,
        limit: number,
        filterable: boolean,
        layers: any[],
        data: Object[],
        headers: { prop: string, name: string, active: boolean, style: Object }[],
        activeHeaders: { prop: string, name: string, active: boolean, style: Object }[],
        showColumnSelector: string
    };

    private drag: {
        mousedown: boolean,
        downIndex: number,
        currentIndex: number,
        field: { prop: string, name: string, active: boolean },
        x: number,
        y: number,
    };


    constructor(connectionService: ConnectionService, datasetService: DatasetService, filterService: FilterService,
        exportService: ExportService, injector: Injector, themesService: ThemesService) {
        super(connectionService, datasetService, filterService, exportService, injector, themesService);
        this.optionsFromConfig = {
            title: this.injector.get('title', null),
            database: this.injector.get('database', null),
            table: this.injector.get('table', null),
            sortField: this.injector.get('sortField', null),
            limit: this.injector.get('limit', 15),
            unsharedFilterField: {},
            unsharedFilterValue: ''
        };
        this.filters = [];
        this.active = {
            sortField: new FieldMetaData(),
            andFilters: true,
            limit: 100,
            filterable: true,
            layers: [],
            data: [],
            headers: [],
            activeHeaders: [],
            showColumnSelector: 'hide'
        };

        this.drag = {
            mousedown: false,
            downIndex: -1,
            currentIndex: -1,
            field: null,
            x: 0,
            y: 0,
        };
    };

    subNgOnInit() {
        //Do nothing
    };

    postInit() {
        this.executeQueryChain();
    };

    subNgOnDestroy() {
        //Do nothing
    };

    getOptionFromConfig(field) {
        return this.optionsFromConfig[field];
    };

    onUpdateFields() {
        this.active.sortField = this.findFieldObject('sortField', neonMappings.TAGS);
        for (let f of this.meta.fields) {
            this.active.headers.push({ prop: f.columnName, name: f.prettyName, active: true, style: {} });
        }
        this.recalculateActiveHeaders();
    };

    recalculateActiveHeaders() {
        this.active.activeHeaders = this.getActiveHeaders();
    }

    getActiveHeaders() {
        let active = [];
        for (let header of this.active.headers) {
            if (header.active) {
                active.push(header);
            }
        }
        return active;
    };

    closeColumnSelector() {
        this.active.showColumnSelector = 'hide';
    }

    logAndDisplay(obj) {
        console.log(obj);
    };

    addLocalFilter(key, value, prettyKey) {
        this.filters[0] = {
            key: key,
            value: value,
            prettyKey: prettyKey
        };
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
        return [this.active.sortField.columnName];
    }
    getVisualizationName(): string {
        return 'Data Chart';
    }

    getFilterText() {
        return this.filters[0].value;
    }

    refreshVisualization() {
        this.table.recalculate();
    }

    isValidQuery() {
        let valid = true;
        valid = (this.meta.database && this.meta.database.name && valid);
        valid = (this.meta.table && this.meta.table.name && valid);
        valid = (this.active.sortField && this.active.sortField.columnName && valid);
        // valid = (this.active.aggregation && valid);
        return valid;
    }

    createQuery(): neon.query.Query {
        let databaseName = this.meta.database.name;
        let tableName = this.meta.table.name;
        let query = new neon.query.Query().selectFrom(databaseName, tableName);
        let whereClause = neon.query.where(this.active.sortField.columnName, '!=', null);
        //let dataField = this.active.dataField.columnName;
        return query.where(whereClause).sortBy('value', neon.query['DESCENDING']).limit(this.active.limit);
    };

    getFiltersToIgnore() {
        return null;
    }

    onQuerySuccess(response): void {
        this.active.data = response.data;
        this.refreshVisualization();
    }

    handleFiltersChangedEvent() {
        // Get neon filters
        // See if any neon filters are local filters and set/clear appropriately
        let database = this.meta.database.name;
        let table = this.meta.table.name;
        let fields = [this.active.sortField.columnName];
        let neonFilters = this.filterService.getFilters(database, table, fields);
        if (neonFilters && neonFilters.length > 0) {
            for (let filter of neonFilters) {
                let key = filter.filter.whereClause.lhs;
                let value = filter.filter.whereClause.rhs;
                this.addLocalFilter(key, value, key);
            }
        } else {
            this.filters = [];
        }
        this.executeQueryChain();
    };

    handleChangeLimit() {
        this.logChangeAndStartQueryChain();
    }

    handleChangeSortField() {
        this.logChangeAndStartQueryChain(); // ('dataField', this.active.dataField.columnName);
    };

    isDragging(): boolean {
        return (this.drag.mousedown && this.drag.downIndex >= 0);
    }

    //mouse up in a drag and drop element
    onMouseUp(i) {
        if (this.isDragging && this.drag.downIndex !== this.drag.currentIndex) {
            let length = this.active.headers.length;
            if (this.drag.downIndex >= length || i >= length || this.drag.downIndex < 0 || i < 0) {
                console.log('index out of bounds!');
            } else {
              //  console.log('move index ' + this.drag.downIndex + ' to ' + i);
                let h = this.active.headers;
                let si = this.drag.downIndex; // startIndex
                let ei = i; // endIndex
                let dir = (si > ei ? -1 : 1);
                let moved = h[si];
                for (let ci = si; ci !== ei; ci += dir) {
                    h[ci] = h[ci + dir];
                }
                h[ei] = moved;
                this.recalculateActiveHeaders();
            }
        }
        this.clearHeaderStyles();
        this.drag.downIndex = -1;
        this.drag.mousedown = false;
    }

    //clicks on a drag and drop icon of an element
    onMouseDown(i) {
        if (i >= 0) {
            this.drag.downIndex = i;
            this.drag.mousedown = true;
            this.active.headers[i].style['backgroundColor'] = 'rgba(0, 0, 0, .2)';
            this.active.headers[i].style['border'] = 'gray dashed 1px';
        }
    }

    //enters a NEW drag and drop element
    onMouseEnter(i) {
        if (this.isDragging()) {
            this.drag.currentIndex = i;
            let style = 'thick solid gray';
            if (i < this.drag.downIndex) {
                this.active.headers[i].style['borderTop'] = style;
            } else if (i > this.drag.downIndex) {
                this.active.headers[i].style['borderBottom'] = style;
            }
        }
    }

    onMouseLeaveItem(i) {
        if (this.isDragging()) {
            if (i !== this.drag.downIndex) {
                this.active.headers[i].style['borderBottom'] = null;
                this.active.headers[i].style['borderTop'] = null;
            }
        }
    }

    //leaves drag and drop area
    onMouseLeaveArea() {
        this.drag.downIndex = -1;
        this.drag.mousedown = false;
        this.clearHeaderStyles();
    }

    //moving in drag and drop area
    onMouseMove(event) {
        if (this.isDragging()) {
            this.drag.x = event.screenX;
            this.drag.y = event.screenY;
        }
    }

    clearHeaderStyles() {
        for (let header of this.active.headers) {
            header.style = {};
        }
    }

    getButtonText() {
        // TODO Fix this.  It gets called a lot
        // return !this.isFilterSet() && !this.active.data.length
        //    ? 'No Data'
        //    : 'Top ' + this.active.data.length;
        // console.log('TODO - see getButtonText()')
    };

    // Get filters and format for each call in HTML
    getCloseableFilters() {
        let closeableFilters = this.filters.map((filter) => {
            return filter.value;
        });
        return closeableFilters;
    };

    getFilterTitle(value: string) {
        return this.active.sortField.columnName + ' = ' + value;
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
