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
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Injector, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { map, startWith } from 'rxjs/operators';

import { AbstractWidgetService } from '../../services/abstract.widget.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { FilterService } from '../../services/filter.service';

import { BaseNeonComponent } from '../base-neon-component/base-neon.component';
import { FieldMetaData, SimpleFilter } from '../../dataset';
import { neonUtilities, neonVariables } from '../../neon-namespaces';
import {
    OptionChoices,
    WidgetFieldArrayOption,
    WidgetFieldOption,
    WidgetFreeTextOption,
    WidgetNonPrimitiveOption,
    WidgetOption,
    WidgetSelectOption
} from '../../widget-option';
import WherePredicate = neon.query.WherePredicate;

import * as neon from 'neon-framework';

@Component({
    selector: 'app-query-bar',
    templateUrl: './query-bar.component.html',
    styleUrls: ['./query-bar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class QueryBarComponent  extends BaseNeonComponent {

    @ViewChild('visualization', {read: ElementRef}) visualization: ElementRef;
    @ViewChild('queryBar') queryBar: ElementRef;

    autoComplete: boolean = true;
    queryValues: string[] = [];
    queryArray: any[];
    filterIds: string[] = [];
    currentFilter: string = '';

    public simpleFilter = new BehaviorSubject<SimpleFilter>(undefined);
    public filterId = new BehaviorSubject<string>(undefined);
    public queryOptions: Observable<void | string[]>;

    private filterFormControl: FormControl;

    constructor(
        connectionService: ConnectionService,
        datasetService: DatasetService,
        filterService: FilterService,
        injector: Injector,
        protected widgetService: AbstractWidgetService,
        ref: ChangeDetectorRef
    ) {

        super(
            connectionService,
            datasetService,
            filterService,
            injector,
            ref
        );

        this.filterFormControl = new FormControl();
    }

    /**
     * Creates and returns an array of field options for the visualization.
     *
     * @return {(WidgetFieldOption|WidgetFieldArrayOption)[]}
     * @override
     */
    createFieldOptions(): (WidgetFieldOption | WidgetFieldArrayOption)[] {
        return [
            new WidgetFieldOption('filterField', 'Filter Field', true),
            new WidgetFieldOption('idField', 'ID Field', true)
        ];
    }

    /**
     * Creates and returns an array of non-field options for the visualization.
     *
     * @return {WidgetOption[]}
     * @override
     */
    createNonFieldOptions(): WidgetOption[] {
        return [
            new WidgetSelectOption('extendedFilter', 'Extended Filter', false, OptionChoices.NoFalseYesTrue),
            // TODO THOR-950 Rename extensionFields because it is not an array of FieldMetaData objects!
            new WidgetNonPrimitiveOption('extensionFields', 'Extension Fields', []),
            new WidgetFreeTextOption('id', 'ID', ''),
            new WidgetFreeTextOption('placeHolder', 'Place Holder', 'Query')
        ];
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
     * Returns the default limit for the visualization.
     *
     * @return {string}
     * @override
     */
    getVisualizationDefaultLimit(): number {
        return 10;
    }

    /**
     * Returns the default title for the visualization.
     *
     * @return {string}
     * @override
     */
    getVisualizationDefaultTitle(): string {
        return 'Query Bar';
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

        let setValues = true;
        if (this.queryValues && this.queryValues.length) {
            setValues = false;
        }

        try {
            if (response && response.data && response.data.length) {
                this.errorMessage = '';

                response.data.forEach((d) => {
                    let item = {};
                    for (let field of this.options.fields) {
                        if (field.columnName === this.options.filterField.columnName && setValues) {
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

                if (setValues) {
                    this.queryValues = this.queryValues.filter((value, index, array) => array.indexOf(value) === index).sort();
                }

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
        if (this.queryValues) {
            this.queryOptions = this.filterFormControl.valueChanges.pipe(
                startWith(''),
                map((value) => value && value.length > 0 ? this.filterAutoComplete(value) : [])
            );
        }
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

    /**
     * Creates a standard filter for the visualization.
     *
     * @arg {string} text
     */
    createFilter(text: string) {
        if (text && text.length === 0) {
            this.removeFilter();
            return;
        }

        //filters query text
        if (text && text !== this.currentFilter) {
            let values = this.queryArray.filter((value) =>
                value[this.options.filterField.columnName].toLowerCase() === text.toLowerCase()),
                clause: WherePredicate;

            if (values.length) {
                clause = neon.query.where(this.options.filterField.columnName, '=', text);

                if (this.currentFilter && this.filterIds) {
                    this.removeAllFilters(this.filterService.getFilters());
                }

                this.addFilter(text, clause, this.options.filterField.columnName);
                this.currentFilter = text;
                //gathers ids from the filtered query text in order to extend filtering to the other components
                if (this.options.extendedFilter) {
                    for (let ef of this.options.extensionFields) {
                        this.extensionFilter(text, ef, values);
                    }
                }
            } else {
                this.removeAllFilters(this.filterService.getFilters());
            }
        }
    }

    /**
     * Extends filtering across databases/indices that do not have related fields. Executes a query if necessary.
     *
     * @arg {string} text
     * @arg {any} fields
     * @arg {any} array
     *
     * @private
     */
    private extensionFilter(text: string, fields: any, array: any[]) {
        if (fields.database !== this.options.database.name && fields.table !== this.options.table.name) {
            let query = new neon.query.Query().selectFrom(fields.database, fields.table),
                queryFields = [fields.idField, fields.filterField],
                connection = this.connectionService.getActiveConnection(),
                execute = connection.executeQuery(query, null),
                tempArray = [],
                queryClauses = [];
            for (let value of array) {
                queryClauses.push(neon.query.where(fields.filterField, '=', value[this.options.idField.columnName]));
            }

            query.withFields(queryFields).where(neon.query.or.apply(query, queryClauses));
            execute.done((response) => {
                if (response && response.data && response.data.length) {
                    response.data.forEach((d) => {
                        let value = neonUtilities.deepFind(d, fields.idField);
                        if (typeof value !== 'undefined') {
                            if (value instanceof Array) {
                                for (let values of value) {
                                    tempArray.push(values);
                                }
                            } else {
                                tempArray.push(value);
                            }
                        }
                    });
                }

                tempArray = tempArray.filter((value, index, items) => items.indexOf(value) === index);
                this.extensionAddFilter(text, fields, tempArray);
            });
        }

        this.extensionAddFilter(text, fields, array);
    }

    /**
     * Adds or replaces a filter for the visualization
     *
     * @arg {string} text
     * @arg {WherePredicate} clause
     * @arg {string} field
     * @arg {string} database?
     * @arg {string} table?
     */
    addFilter(text: string, clause: WherePredicate, field: string, database?: string, table?: string) {
        let db = database ? database : this.options.database.name,
            tb = table ? table : this.options.table.name,
            filterName = ` ${this.options.title} - ${db} - ${tb} - ${field}`,
            filterId = this.filterId.getValue(),
            noOp = () => { /*no op*/ };

        if (filterId) {
            this.filterService.replaceFilter(
                this.messenger, filterId, this.id,
                db, tb, clause,
                filterName,
                (id) => {
                    this.filterIds.push(id);
                }, noOp
            );
        } else {
            this.filterService.addFilter(
                this.messenger, this.id,
                db, tb, clause,
                filterName,
                (id) => {
                    this.filterIds.push(id);
                    this.filterId.next(typeof id === 'string' ? id : null);
                },
                noOp
            );
        }
    }

    /**
     * Adds extension filters for the visualization
     *
     * @arg {string} text
     * @arg {any} fields
     * @arg {any} array
     *
     * @private
     */
    private extensionAddFilter(text: string, fields: any, array: any[]) {
        let whereClauses = [],
            clause: WherePredicate;
        for (let item of array) {
            if ((typeof item === 'object')) {
                if (item.hasOwnProperty(fields.idField)) {
                    whereClauses.push(neon.query.where(fields.idField, '=', item[fields.idField]));
                }
            } else {
                whereClauses.push(neon.query.where(fields.idField, '=', item));
            }
        }

        if (whereClauses.length) {
            clause = neon.query.or.apply(neon.query, whereClauses);
            this.filterId.next(this.id);
            this.addFilter(text, clause, fields.idField, fields.database, fields.table);
        }
    }

    /**
     * Called when a filter has been removed
     *
     */
    removeFilter() {
        if (this.filterIds) {
            this.removeAllFilters(this.filterService.getFilters());
            this.filterIds = [];
            this.currentFilter = '';
        }

        this.executeQueryChain();
    }

    /**
     * Sets filters for the visualization.
     *
     * @override
     */
    setupFilters() {
        //
    }

    /**
     * Initializes the Query Bar.
     *
     * @override
     */
    postInit() {
        this.removeFilter();
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
