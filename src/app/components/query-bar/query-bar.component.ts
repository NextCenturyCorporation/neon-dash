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
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector, ViewChild } from '@angular/core';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { DatasetService } from '../../services/dataset.service';
import { FieldMetaData, SimpleFilter } from '../../dataset';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import * as neon from 'neon-framework';
import * as uuid from 'node-uuid';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { map, startWith } from 'rxjs/operators';
import { BaseNeonComponent, BaseNeonOptions } from '../base-neon-component/base-neon.component';
import { neonUtilities, neonVariables } from '../../neon-namespaces';
import { ExportService } from '../../services/export.service';
import { ConnectionService } from '../../services/connection.service';
import { VisualizationService } from '../../services/visualization.service';
import { ActiveGridService } from '../../services/active-grid.service';
import WherePredicate = neon.query.WherePredicate;
import { MatAutocompleteTrigger } from '@angular/material';

/**
 * Manages configurable options for the specific visualization.
 */
export class QueryBarOptions extends BaseNeonOptions {
    public id: string;
    public placeHolder: string;
    public idField: FieldMetaData;
    public filterField: FieldMetaData;
    public multiFilter: boolean;

    /**
     * Initializes all the non-field options for the specific visualization.
     *
     * @override
     */
    onInit() {
        this.id = this.injector.get('id', '');
        this.placeHolder = this.injector.get('placeHolder', 'Query');
        this.multiFilter = this.injector.get('multiFilter', false);
    }

    /**
     * Updates all the field options for the specific visualization.  Called on init and whenever the table is changed.
     *
     * @override
     */
    updateFieldsOnTableChanged() {
        this.idField = this.findFieldObject('idField');
        this.filterField = this.findFieldObject('filterField');
    }
}

@Component({
    selector: 'app-query-bar',
    templateUrl: './query-bar.component.html',
    styleUrls: ['./query-bar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class QueryBarComponent  extends BaseNeonComponent {
    public idField: FieldMetaData;
    public filterField: FieldMetaData;

    @ViewChild('visualization', {read: ElementRef}) visualization: ElementRef;
    @ViewChild('queryBar') queryBar: ElementRef;
    @ViewChild('completeTrigger', {read: MatAutocompleteTrigger}) completeTrigger: MatAutocompleteTrigger;

    autoComplete: boolean = true;
    queryValues: string[];
    queryArray: any[];
    filterIds: string[] = [];

    public filters: {
        id: string,
        field: string,
        prettyField: string,
        value: string
    }[] = [];

    public simpleFilter = new BehaviorSubject<SimpleFilter>(undefined);
    public filterId = new BehaviorSubject<string>(undefined);
    public filteredOptions: Observable<void | string[]>;
    public options: QueryBarOptions;

    public id = uuid.v4();
    public messenger = new neon.eventing.Messenger();
    private filterFormControl: FormControl;

    constructor(activeGridService: ActiveGridService, connectionService: ConnectionService, datasetService: DatasetService,
                filterService: FilterService, exportService: ExportService, injector: Injector, themesService: ThemesService,
                ref: ChangeDetectorRef, visualizationService: VisualizationService) {

        super(activeGridService, connectionService, datasetService,
            filterService, exportService, injector, themesService, ref, visualizationService);

        this.filterFormControl = new FormControl();
        this.options = new QueryBarOptions(this.injector, this.datasetService, 'Query Bar');
    }

    createQuery(): neon.query.Query  {
        let query = new neon.query.Query().selectFrom(this.options.database.name, this.options.table.name);

        let fields = [this.options.idField.columnName, this.options.filterField.columnName];
        let whereClauses = [
            neon.query.where(this.options.filterField.columnName, '!=', null)
        ];

        return query.withFields(fields).where(neon.query.and.apply(query, whereClauses))
            .sortBy(this.options.filterField.columnName, neonVariables.ASCENDING);
    }
    /**
     * Returns whether the query bar using the active data config is valid.
     *
     * @return {boolean}
     * @override
     */
    isValidQuery(): boolean {
        return !!(this.options.database && this.options.database.name && this.options.table && this.options.table.name &&
            this.options.idField && this.options.idField.columnName && this.options.filterField && this.options.filterField.columnName);
    }

    onQuerySuccess(response) {
        this.queryArray = [];
        this.queryValues = [];

        try {
            if (response && response.data && response.data.length) {
                this.errorMessage = '';

                response.data.forEach((d) => {
                    let item = {};
                    for (let field of this.options.fields) {
                        if (field.columnName === this.options.filterField.columnName) {
                            this.queryValues.push(neonUtilities.deepFind(d, this.options.filterField.columnName));
                        }
                        if (field.type || field.columnName === '_id') {
                            let value = neonUtilities.deepFind(d, field.columnName);
                            if (typeof value !== 'undefined') {
                                item[field.columnName] = value;
                            }
                        }
                    }
                    this.queryArray.push(item);
                });

                this.queryValues = this.queryValues.filter((value, index, array) => array.indexOf(value) === index);
                this.queryBarSetup();

            } else {
                this.errorMessage = 'No Data';
                this.refreshVisualization();
            }
        } catch (e) {
            this.errorMessage = 'Error';
            this.refreshVisualization();
        }
    }

    private queryBarSetup() {
        this.filteredOptions = this.filterFormControl.valueChanges.pipe(
            startWith(''),
            map((value) => value ? this.filterAutoComplete(value) : this.queryValues.slice())
        );
    }

    private filterAutoComplete(val: string) {
        return this.queryValues.filter((value) =>
            value.toLowerCase().indexOf(val.toLowerCase()) === 0);
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
            headerText: this.queryBar
        };
    }

    /**
     * Returns the Query Bar export fields.
     *
     * @return {array}
     * @override
     */
    getExportFields(): any[] {
        return [];
    }

    /**
     * Returns the options for the specific visualization.
     *
     * @return {BaseNeonOptions}
     * @override
     */
    getOptions(): BaseNeonOptions {
        return this.options;
    }

    /**
     * Refreshes the Query Bar.
     *
     * @override
     */
    refreshVisualization() {
        this.changeDetection.detectChanges();
    }

    /**
     * Returns the list filters for the visualization to ignore.
     *
     * @return {array|null}
     * @override
     */
    getFiltersToIgnore() {
        // Ignore all the filters for the database and the table so it always shows the selected items.
        let neonFilters = this.filterService.getFiltersForFields(this.options.database.name, this.options.table.name);

        let ignoredFilterIds = neonFilters.filter((neonFilter) => {
            return !neonFilter.filter.whereClause.whereClauses;
        }).map((neonFilter) => {
            return neonFilter.id;
        });

        return ignoredFilterIds.length ? ignoredFilterIds : null;
    }

    /**
     * Returns the text for the given filter object.
     *
     * @arg {object} filter
     * @return {string}
     * @override
     */
    getFilterText(filter: any): string {
        return filter.prettyField + ' = ' + filter.value;
    }

    /**
     * Returns the list of filter objects.
     *
     * @return {array}
     * @override
     */
    getCloseableFilters(): any[] {
        return [];
    }

    createFilter(text: string) {
        if (text.length === 0) {
            this.removeFilter();
            return;
        }

        let values = this.queryArray.filter((value) =>
            value[this.options.filterField.columnName].toLowerCase().indexOf(text.toLowerCase()) === 0),
            clause: WherePredicate,
            whereClauses = [];

        clause = neon.query.where(this.options.filterField.columnName, '=', text);
        this.addFilter(text, clause, this.options.filterField.columnName);

        if (this.options.multiFilter) {
            for (let value of values) {
                whereClauses.push(neon.query.where(this.options.idField.columnName, '=', value[this.options.idField.columnName]));
            }

            clause = neon.query.or.apply(neon.query, whereClauses);
            this.addFilter(text, clause, this.options.idField.columnName);
        }
    }

    addFilter(text: string, clause: WherePredicate, field: string) {
        let filterName = ` ${this.options.title} - ${this.options.database.prettyName} - ${this.options.table.prettyName}`,
            filterId = this.filterId.getValue(),
            noOp = () => { /*no op*/ };

        if (filterId) {
            this.filterService.replaceFilter(
                this.messenger, filterId, this.id,
                this.options.database.name, this.options.table.name, clause,
                filterName,
                noOp, noOp
            );
        } else {
            this.filterService.addFilter(
                this.messenger, this.id,
                this.options.database.name, this.options.table.name, clause,
                filterName,
                (id) => {
                    this.filterIds.push(id);
                    this.filterId.next(typeof id === 'string' ? id : null);
                },
                noOp
            );
        }
    }

    removeFilter() {
        if (this.filterIds) {
            this.filterService.removeFilters(this.messenger, this.filterIds,
                () => this.filterId.next(undefined));

            this.filterIds = [];
           // console.log(this.completeTrigger)
        }
    }

    /**
     * Returns whether a visualization filter object with the given field and value strings exists in the list of visualization filters.
     *
     * @arg {string} field
     * @arg {string} value
     * @return {boolean}
     * @private
     */
    filterExists(field: string, value: string) {
        return this.filters.some((existingFilter) => {
            return field === existingFilter.field && value === existingFilter.value;
        });
    }

    /**
     * Sets filters for the visualization.
     *
     * @override
     */
    setupFilters() {
        let neonFilters = this.options.filterField.columnName ? this.filterService.getFiltersForFields(this.options.database.name,
            this.options.table.name, [this.options.filterField.columnName]) : [];
        this.filters = [];

        for (let neonFilter of neonFilters) {
            if (!neonFilter.filter.whereClause.whereClauses) {
                let field = this.options.findField(neonFilter.filter.whereClause.lhs);
                let value = neonFilter.filter.whereClause.rhs;
                let filter = {
                    id: neonFilter.id,
                    field: field.columnName,
                    prettyField: field.prettyName,
                    value: value
                };
                if (!this.filterExists(filter.field, filter.value)) {
                    this.filters.push(filter);
                }
            }
        }
    }

    /**
     * Sets the given bindings for the Query Bar.
     *
     * @arg {any} bindings
     * @override
     */
    subGetBindings(bindings: any) {
        bindings.idField = this.options.idField.columnName;
        bindings.filterField = this.options.filterField.columnName;
        bindings.multiFilter = this.options.multiFilter;
    }

    /**
     * Initializes the Query Bar.
     *
     * @override
     */
    postInit() {
        this.executeQueryChain();
    }

    /**
     * Initializes any Query Bar sub-components if needed.
     *
     * @override
     */
    subNgOnInit() {
        //
    }
    /**
     * Destroys any Query Bar sub-components if needed.
     *
     * @override
     */
    subNgOnDestroy() {
        // Do nothing.
    }

}
